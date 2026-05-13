const express = require('express');
const { body, param } = require('express-validator');
const prisma = require('../lib/prisma');
const { authenticate, requireAdmin } = require('../middleware/auth');
const { validate } = require('../middleware/validate');
const { asyncHandler } = require('../middleware/errorHandler');

const router = express.Router();
router.use(authenticate);

const PROJECT_SELECT = {
  id: true, name: true, description: true, color: true, status: true,
  createdAt: true, updatedAt: true,
  owner: { select: { id: true, name: true, email: true } },
  members: {
    include: { user: { select: { id: true, name: true, email: true, role: true } } },
  },
  _count: { select: { tasks: true } },
};

// ─── GET /api/projects ────────────────────────────────────────────────────────
router.get('/', asyncHandler(async (req, res) => {
  const where = req.user.role === 'ADMIN'
    ? {}
    : { members: { some: { userId: req.user.id } } };

  const projects = await prisma.project.findMany({
    where,
    select: {
      ...PROJECT_SELECT,
      tasks: { select: { status: true } },
    },
    orderBy: { createdAt: 'desc' },
  });

  res.json({ projects });
}));

// ─── GET /api/projects/:id ────────────────────────────────────────────────────
router.get('/:id', asyncHandler(async (req, res) => {
  const project = await prisma.project.findUnique({
    where: { id: req.params.id },
    select: {
      ...PROJECT_SELECT,
      tasks: {
        include: {
          assignee: { select: { id: true, name: true, email: true } },
          createdBy: { select: { id: true, name: true } },
        },
        orderBy: { createdAt: 'desc' },
      },
      activities: {
        include: { user: { select: { id: true, name: true } } },
        orderBy: { createdAt: 'desc' },
        take: 20,
      },
    },
  });

  if (!project) return res.status(404).json({ error: 'Project not found' });

  // Members and admins only
  const isMember = project.members.some((m) => m.userId === req.user.id);
  if (req.user.role !== 'ADMIN' && !isMember) {
    return res.status(403).json({ error: 'Access denied' });
  }

  res.json({ project });
}));

// ─── POST /api/projects ───────────────────────────────────────────────────────
router.post(
  '/',
  requireAdmin,
  [
    body('name').trim().notEmpty().withMessage('Project name required').isLength({ max: 100 }),
    body('description').optional().trim().isLength({ max: 500 }),
    body('color').optional().matches(/^#[0-9A-Fa-f]{6}$/).withMessage('Invalid hex color'),
    body('status').optional().isIn(['ACTIVE', 'ON_HOLD', 'COMPLETED']),
    body('memberIds').optional().isArray(),
  ],
  validate,
  asyncHandler(async (req, res) => {
    const { name, description, color, status, memberIds = [] } = req.body;

    const allMemberIds = [...new Set([req.user.id, ...memberIds])];

    const project = await prisma.project.create({
      data: {
        name, description, color, status,
        ownerId: req.user.id,
        members: {
          create: allMemberIds.map((userId) => ({
            userId,
            role: userId === req.user.id ? 'ADMIN' : 'MEMBER',
          })),
        },
        activities: {
          create: {
            text: `${req.user.name} created this project`,
            userId: req.user.id,
          },
        },
      },
      select: PROJECT_SELECT,
    });

    res.status(201).json({ project });
  })
);

// ─── PATCH /api/projects/:id ──────────────────────────────────────────────────
router.patch(
  '/:id',
  requireAdmin,
  [
    body('name').optional().trim().notEmpty().isLength({ max: 100 }),
    body('description').optional().trim().isLength({ max: 500 }),
    body('color').optional().matches(/^#[0-9A-Fa-f]{6}$/),
    body('status').optional().isIn(['ACTIVE', 'ON_HOLD', 'COMPLETED']),
  ],
  validate,
  asyncHandler(async (req, res) => {
    const { name, description, color, status } = req.body;

    const project = await prisma.project.update({
      where: { id: req.params.id },
      data: { name, description, color, status },
      select: PROJECT_SELECT,
    });

    await prisma.activity.create({
      data: {
        text: `${req.user.name} updated project settings`,
        userId: req.user.id,
        projectId: project.id,
      },
    });

    res.json({ project });
  })
);

// ─── DELETE /api/projects/:id ─────────────────────────────────────────────────
router.delete('/:id', requireAdmin, asyncHandler(async (req, res) => {
  await prisma.project.delete({ where: { id: req.params.id } });
  res.json({ message: 'Project deleted' });
}));

// ─── POST /api/projects/:id/members ──────────────────────────────────────────
router.post(
  '/:id/members',
  requireAdmin,
  [
    body('userId').notEmpty().withMessage('userId is required'),
    body('role').optional().isIn(['ADMIN', 'MEMBER']),
  ],
  validate,
  asyncHandler(async (req, res) => {
    const { userId, role = 'MEMBER' } = req.body;

    const user = await prisma.user.findUnique({ where: { id: userId } });
    if (!user) return res.status(404).json({ error: 'User not found' });

    const member = await prisma.projectMember.upsert({
      where: { userId_projectId: { userId, projectId: req.params.id } },
      update: { role },
      create: { userId, projectId: req.params.id, role },
    });

    await prisma.activity.create({
      data: {
        text: `${req.user.name} added ${user.name} to the project`,
        userId: req.user.id,
        projectId: req.params.id,
      },
    });

    res.status(201).json({ member });
  })
);

// ─── DELETE /api/projects/:id/members/:userId ─────────────────────────────────
router.delete('/:id/members/:userId', requireAdmin, asyncHandler(async (req, res) => {
  const { id: projectId, userId } = req.params;

  if (userId === req.user.id) {
    return res.status(400).json({ error: 'Cannot remove yourself from a project' });
  }

  await prisma.projectMember.delete({
    where: { userId_projectId: { userId, projectId } },
  });

  res.json({ message: 'Member removed from project' });
}));

module.exports = router;
