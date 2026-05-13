const express = require('express');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const { body } = require('express-validator');
const prisma = require('../lib/prisma');
const { authenticate } = require('../middleware/auth');
const { validate } = require('../middleware/validate');
const { asyncHandler } = require('../middleware/errorHandler');

const router = express.Router();

const signToken = (userId) =>
  jwt.sign({ userId }, process.env.JWT_SECRET, {
    expiresIn: process.env.JWT_EXPIRES_IN || '7d',
  });

const setCookie = (res, token) => {
  res.cookie('token', token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: process.env.NODE_ENV === 'production' ? 'none' : 'lax',
    maxAge: 7 * 24 * 60 * 60 * 1000, // 7 days
  });
};

// ─── POST /api/auth/signup ────────────────────────────────────────────────────
router.post(
  '/signup',
  [
    body('name').trim().notEmpty().withMessage('Name is required').isLength({ max: 60 }),
    body('email').isEmail().normalizeEmail().withMessage('Valid email required'),
    body('password').isLength({ min: 6 }).withMessage('Password must be at least 6 characters'),
    body('role').optional().isIn(['ADMIN', 'MEMBER']).withMessage('Invalid role'),
  ],
  validate,
  asyncHandler(async (req, res) => {
    const { name, email, password, role } = req.body;

    const existing = await prisma.user.findUnique({ where: { email } });
    if (existing) {
      return res.status(409).json({ error: 'Email already registered' });
    }

    const hashed = await bcrypt.hash(password, 12);
    const user = await prisma.user.create({
      data: { name, email, password: hashed, role: role || 'MEMBER' },
      select: { id: true, name: true, email: true, role: true, createdAt: true },
    });

    const token = signToken(user.id);
    setCookie(res, token);

    res.status(201).json({ user, token });
  })
);

// ─── POST /api/auth/login ─────────────────────────────────────────────────────
router.post(
  '/login',
  [
    body('email').isEmail().normalizeEmail().withMessage('Valid email required'),
    body('password').notEmpty().withMessage('Password is required'),
  ],
  validate,
  asyncHandler(async (req, res) => {
    const { email, password } = req.body;

    const user = await prisma.user.findUnique({ where: { email } });
    if (!user || !(await bcrypt.compare(password, user.password))) {
      return res.status(401).json({ error: 'Invalid email or password' });
    }

    const token = signToken(user.id);
    setCookie(res, token);

    const { password: _, ...safeUser } = user;
    res.json({ user: safeUser, token });
  })
);

// ─── POST /api/auth/logout ────────────────────────────────────────────────────
router.post('/logout', (req, res) => {
  res.clearCookie('token');
  res.json({ message: 'Logged out successfully' });
});

// ─── GET /api/auth/me ─────────────────────────────────────────────────────────
router.get(
  '/me',
  authenticate,
  asyncHandler(async (req, res) => {
    const user = await prisma.user.findUnique({
      where: { id: req.user.id },
      select: { id: true, name: true, email: true, role: true, createdAt: true },
    });
    res.json({ user });
  })
);

// ─── PATCH /api/auth/me ───────────────────────────────────────────────────────
router.patch(
  '/me',
  authenticate,
  [
    body('name').optional().trim().notEmpty().isLength({ max: 60 }),
    body('currentPassword').optional().isLength({ min: 6 }),
    body('newPassword').optional().isLength({ min: 6 }).withMessage('New password must be at least 6 characters'),
  ],
  validate,
  asyncHandler(async (req, res) => {
    const { name, currentPassword, newPassword } = req.body;
    const updates = {};

    if (name) updates.name = name;

    if (newPassword) {
      if (!currentPassword) {
        return res.status(400).json({ error: 'Current password is required to change password' });
      }
      const user = await prisma.user.findUnique({ where: { id: req.user.id } });
      if (!(await bcrypt.compare(currentPassword, user.password))) {
        return res.status(401).json({ error: 'Current password is incorrect' });
      }
      updates.password = await bcrypt.hash(newPassword, 12);
    }

    const updated = await prisma.user.update({
      where: { id: req.user.id },
      data: updates,
      select: { id: true, name: true, email: true, role: true },
    });

    res.json({ user: updated });
  })
);

module.exports = router;
