const jwt = require('jsonwebtoken');
const prisma = require('../lib/prisma');

// ─── Verify JWT ──────────────────────────────────────────────────────────────
const authenticate = async (req, res, next) => {
  try {
    const token =
      req.cookies?.token ||
      req.headers.authorization?.replace('Bearer ', '');

    if (!token) {
      return res.status(401).json({ error: 'Authentication required' });
    }

    const decoded = jwt.verify(token, process.env.JWT_SECRET);

    const user = await prisma.user.findUnique({
      where: { id: decoded.userId },
      select: { id: true, name: true, email: true, role: true },
    });

    if (!user) {
      return res.status(401).json({ error: 'User not found' });
    }

    req.user = user;
    next();
  } catch (err) {
    if (err.name === 'TokenExpiredError') {
      return res.status(401).json({ error: 'Token expired, please sign in again' });
    }
    return res.status(401).json({ error: 'Invalid token' });
  }
};

// ─── Require Admin Role ───────────────────────────────────────────────────────
const requireAdmin = (req, res, next) => {
  if (req.user?.role !== 'ADMIN') {
    return res.status(403).json({ error: 'Admin access required' });
  }
  next();
};

// ─── Require Project Membership ───────────────────────────────────────────────
const requireProjectMember = async (req, res, next) => {
  try {
    const projectId = req.params.projectId || req.body.projectId;
    if (!projectId) return next();

    // Admins bypass membership check
    if (req.user.role === 'ADMIN') return next();

    const membership = await prisma.projectMember.findUnique({
      where: { userId_projectId: { userId: req.user.id, projectId } },
    });

    if (!membership) {
      return res.status(403).json({ error: 'You are not a member of this project' });
    }

    next();
  } catch (err) {
    next(err);
  }
};

module.exports = { authenticate, requireAdmin, requireProjectMember };
