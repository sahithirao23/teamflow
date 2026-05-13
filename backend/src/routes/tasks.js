const express = require('express');
const { body, query } = require('express-validator');
const prisma = require('../lib/prisma');
const { authenticate } = require('../middleware/auth');
const { validate } = require('../middleware/validate');
const { asyncHandler } = require('../middleware/errorHandler');

const router = express.Router();
router.use(authenticate);

const TASK_SELECT = {
  id: true, title: true, description: true, status: true,
  priority: true, dueDate: true, createdAt: true, updatedAt: true,
  project: { select: { id: true, name: true, color: true } },
  assignee: { select: { id: true, name: true, email: true } },
  createdBy: { select: { id: true, name: true } },
};

// ─── GET /api/tasks ───────────────────────────────────────────────────────────
// Query params: projectId, assigneeId, status, priority, overdue, myTasks
router.get(
  '/',
  [
    query('status').optional().isIn(['TODO', 'IN_PROGRESS', 'REVIEW', 'DONE']),
    query('priority').optional().isIn(['LOW', 'MEDIUM', 'HIGH']),
  ],
  validate,
  asyncHandler(async (req, res) => {
    const { projectId, assigneeId, status, priority, overdue, myTasks } = req.query;

    const where = {};

    // Scope to user's projects if not admin
    if (req.user.role !== 'ADMIN') {
      where.project = { members: { some: { userId: req.user.id } } };
    }

    if (projectId) where.projectId = projectId;
    if (status) where.status = status;
    if (priority) where.priority = priority;
    if (myTasks === 'true') where.assigneeId = req.user.id;
    if (assigneeId) where.assigneeId = assigneeId;
    if (overdue === 'true') {
      where.dueDate = { lt: new Date() };
      where.status = { not: 'DONE' };
    }

    const tasks = await prisma.task.findMany({
      where,
      select: TASK_SELECT,
      orderBy: [
        { priority: 'desc' },
        { dueDate: 'asc' },
        { createdAt: 'desc' },
      ],
    });

    res.json({ tasks });
  })
);

// ─── GET /api/tasks/:id ───────────────────────────────────────────────────────
router.get('/:id', asyncHandler(async (req, res) => {
  const task = await prisma.task.findUnique({
    where: { id: req.params.id },
    select: TASK_SELECT,
  });
  if (!task) return res.status(404).json({ error: 'Task not found' });
  res.json({ task });
}));

// ─── POST /api/tasks ──────────────────────────────────────────────────────────
router.post(
  '/',
  [
    body('title').trim().notEmpty().withMessage('Title is required').isLength({ max: 200 }),
    body('description').optional().trim().isLength({ max: 2000 }),
    body('projectId').notEmpty().withMessage('Project ID is required'),
    body('assigneeId').optional().isString(),
    body('status').optional().isIn(['TODO', 'IN_PROGRESS', 'REVIEW', 'DONE']),
    body('priority').optional().isIn(['LOW', 'MEDIUM', 'HIGH']),
    body('dueDate').optional().isISO8601().withMessage('Invalid date format'),
  ],
  validate,
  asyncHandler(async (req, res) => {
    const { title, description, projectId, assigneeId, status, priority, dueDate } = req.body;

    // Verify project exists and user has access
    const project = await prisma.project.findUnique({
      where: { id: projectId },
      include: { members: { where: { userId: req.user.id } } },
    });

    if (!project) return res.status(404).json({ error: 'Project not found' });

    if (req.user.role !== 'ADMIN' && project.members.length === 0) {
      return res.status(403).json({ error: 'You are not a member of this project' });
    }

    const task = await prisma.task.create({
      data: {
        title, description, projectId,
        assigneeId: assigneeId || null,
        status: status || 'TODO',
        priority: priority || 'MEDIUM',
        dueDate: dueDate ? new Date(dueDate) : null,
        createdById: req.user.id,
      },
      select: TASK_SELECT,
    });

    await prisma.activity.create({
      data: {
        text: `${req.user.name} created task "${title}"`,
        userId: req.user.id,
        projectId,
      },
    });

    res.status(201).json({ task });
  })
);

// ─── PATCH /api/tasks/:id ─────────────────────────────────────────────────────
router.patch(
  '/:id',
  [
    body('title').optional().trim().notEmpty().isLength({ max: 200 }),
    body('description').optional().trim().isLength({ max: 2000 }),
    body('status').optional().isIn(['TODO', 'IN_PROGRESS', 'REVIEW', 'DONE']),
    body('priority').optional().isIn(['LOW', 'MEDIUM', 'HIGH']),
    body('assigneeId').optional(),
    body('dueDate').optional().isISO8601(),
  ],
  validate,
  asyncHandler(async (req, res) => {
    const existing = await prisma.task.findUnique({ where: { id: req.params.id } });
    if (!existing) return res.status(404).json({ error: 'Task not found' });

    const { title, description, status, priority, assigneeId, dueDate } = req.body;
    const updates = {};

    if (title !== undefined) updates.title = title;
    if (description !== undefined) updates.description = description;
    if (status !== undefined) updates.status = status;
    if (priority !== undefined) updates.priority = priority;
    if (assigneeId !== undefined) updates.assigneeId = assigneeId || null;
    if (dueDate !== undefined) updates.dueDate = dueDate ? new Date(dueDate) : null;

    const task = await prisma.task.update({
      where: { id: req.params.id },
      data: updates,
      select: TASK_SELECT,
    });

    // Log status changes
    if (status && status !== existing.status) {
      const labels = { TODO: 'To Do', IN_PROGRESS: 'In Progress', REVIEW: 'Review', DONE: 'Done' };
      await prisma.activity.create({
        data: {
          text: `${req.user.name} moved "${task.title}" to ${labels[status]}`,
          userId: req.user.id,
          projectId: task.project.id,
        },
      });
    }

    res.json({ task });
  })
);

// ─── DELETE /api/tasks/:id ────────────────────────────────────────────────────
router.delete('/:id', asyncHandler(async (req, res) => {
  const task = await prisma.task.findUnique({ where: { id: req.params.id } });
  if (!task) return res.status(404).json({ error: 'Task not found' });

  // Only creator, assignee, or admin can delete
  const canDelete =
    req.user.role === 'ADMIN' ||
    task.createdById === req.user.id ||
    task.assigneeId === req.user.id;

  if (!canDelete) {
    return res.status(403).json({ error: 'Not authorized to delete this task' });
  }

  await prisma.task.delete({ where: { id: req.params.id } });

  await prisma.activity.create({
    data: {
      text: `${req.user.name} deleted task "${task.title}"`,
      userId: req.user.id,
      projectId: task.projectId,
    },
  });

  res.json({ message: 'Task deleted' });
}));

// ─── GET /api/tasks/stats/overview ───────────────────────────────────────────
router.get('/stats/overview', asyncHandler(async (req, res) => {
  const where = req.user.role === 'ADMIN'
    ? {}
    : { project: { members: { some: { userId: req.user.id } } } };

  const [total, todo, inProgress, review, done, overdue] = await Promise.all([
    prisma.task.count({ where }),
    prisma.task.count({ where: { ...where, status: 'TODO' } }),
    prisma.task.count({ where: { ...where, status: 'IN_PROGRESS' } }),
    prisma.task.count({ where: { ...where, status: 'REVIEW' } }),
    prisma.task.count({ where: { ...where, status: 'DONE' } }),
    prisma.task.count({
      where: { ...where, dueDate: { lt: new Date() }, status: { not: 'DONE' } },
    }),
  ]);

  res.json({ stats: { total, todo, inProgress, review, done, overdue } });
}));

module.exports = router;
