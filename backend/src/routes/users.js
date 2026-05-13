const express = require('express');
const bcrypt = require('bcryptjs');
const { body } = require('express-validator');
const prisma = require('../lib/prisma');
const { authenticate, requireAdmin } = require('../middleware/auth');
const { validate } = require('../middleware/validate');
const { asyncHandler } = require('../middleware/errorHandler');

const router = express.Router();
router.use(authenticate);

// ─── GET /api/users ───────────────────────────────────────────────────────────
router.get('/', asyncHandler(async (req, res) => {
  const users = await prisma.user.findMany({
    select: {
      id: true, name: true, email: true, role: true, createdAt: true,
      _count: { select: { assignedTasks: true } },
    },
    orderBy: { name: 'asc' },
  });
  res.json({ users });
}));

// ─── GET /api/users/:id ───────────────────────────────────────────────────────
router.get('/:id', asyncHandler(async (req, res) => {
  const user = await prisma.user.findUnique({
    where: { id: req.params.id },
    select: {
      id: true, name: true, email: true, role: true, createdAt: true,
      assignedTasks: {
        select: { id: true, title: true, status: true, priority: true, dueDate: true },
        orderBy: { createdAt: 'desc' },
        take: 10,
      },
      _count: { select: { assignedTasks: true, ownedProjects: true } },
    },
  });

  if (!user) return res.status(404).json({ error: 'User not found' });
  res.json({ user });
}));

// ─── POST /api/users ── Admin creates a user ──────────────────────────────────
router.post(
  '/',
  requireAdmin,
  [
    body('name').trim().notEmpty().withMessage('Name is required'),
    body('email').isEmail().normalizeEmail(),
    body('password').isLength({ min: 6 }),
    body('role').optional().isIn(['ADMIN', 'MEMBER']),
  ],
  validate,
  asyncHandler(async (req, res) => {
    const { name, email, password, role = 'MEMBER' } = req.body;

    const existing = await prisma.user.findUnique({ where: { email } });
    if (existing) return res.status(409).json({ error: 'Email already registered' });

    const hashed = await bcrypt.hash(password, 12);
    const user = await prisma.user.create({
      data: { name, email, password: hashed, role },
      select: { id: true, name: true, email: true, role: true, createdAt: true },
    });

    res.status(201).json({ user });
  })
);

// ─── PATCH /api/users/:id ── Admin updates role ───────────────────────────────
router.patch(
  '/:id',
  requireAdmin,
  [body('role').optional().isIn(['ADMIN', 'MEMBER'])],
  validate,
  asyncHandler(async (req, res) => {
    if (req.params.id === req.user.id) {
      return res.status(400).json({ error: 'Cannot modify your own role' });
    }

    const user = await prisma.user.update({
      where: { id: req.params.id },
      data: { role: req.body.role },
      select: { id: true, name: true, email: true, role: true },
    });

    res.json({ user });
  })
);

// ─── DELETE /api/users/:id ────────────────────────────────────────────────────
router.delete('/:id', requireAdmin, asyncHandler(async (req, res) => {
  if (req.params.id === req.user.id) {
    return res.status(400).json({ error: 'Cannot delete your own account' });
  }

  await prisma.user.delete({ where: { id: req.params.id } });
  res.json({ message: 'User deleted' });
}));

module.exports = router;
