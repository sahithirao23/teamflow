const express = require('express');
const prisma = require('../lib/prisma');
const { authenticate } = require('../middleware/auth');
const { asyncHandler } = require('../middleware/errorHandler');

const router = express.Router();
router.use(authenticate);

// ─── GET /api/activity ────────────────────────────────────────────────────────
router.get('/', asyncHandler(async (req, res) => {
  const { projectId, limit = 30 } = req.query;

  const where = {};
  if (projectId) where.projectId = projectId;

  // Members only see activity in their projects
  if (req.user.role !== 'ADMIN') {
    where.project = {
      OR: [
        { members: { some: { userId: req.user.id } } },
        { id: null },
      ],
    };
  }

  const activities = await prisma.activity.findMany({
    where,
    include: {
      user: { select: { id: true, name: true } },
      project: { select: { id: true, name: true, color: true } },
    },
    orderBy: { createdAt: 'desc' },
    take: Math.min(parseInt(limit), 100),
  });

  res.json({ activities });
}));

module.exports = router;
