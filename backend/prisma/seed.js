const { PrismaClient } = require('@prisma/client');
const bcrypt = require('bcryptjs');

const prisma = new PrismaClient();

async function main() {
  console.log('🌱 Seeding database...');

  // Clean up
  await prisma.activity.deleteMany();
  await prisma.task.deleteMany();
  await prisma.projectMember.deleteMany();
  await prisma.project.deleteMany();
  await prisma.user.deleteMany();

  // Users
  const adminPwd = await bcrypt.hash('Admin123', 12);
  const memberPwd = await bcrypt.hash('Member123', 12);

  const sarah = await prisma.user.create({
    data: { name: 'Sarah Chen', email: 'admin@teamflow.dev', password: adminPwd, role: 'ADMIN' },
  });
  const arjun = await prisma.user.create({
    data: { name: 'Arjun Mehta', email: 'dev@teamflow.dev', password: memberPwd, role: 'MEMBER' },
  });
  const priya = await prisma.user.create({
    data: { name: 'Priya Nair', email: 'design@teamflow.dev', password: memberPwd, role: 'MEMBER' },
  });

  // Projects
  const p1 = await prisma.project.create({
    data: {
      name: 'Mobile App Redesign',
      description: 'Complete UI overhaul of the iOS and Android apps',
      color: '#4a7cf7',
      status: 'ACTIVE',
      ownerId: sarah.id,
      members: {
        create: [
          { userId: sarah.id, role: 'ADMIN' },
          { userId: arjun.id, role: 'MEMBER' },
          { userId: priya.id, role: 'MEMBER' },
        ],
      },
    },
  });

  const p2 = await prisma.project.create({
    data: {
      name: 'Backend API v2',
      description: 'RESTful API rewrite with improved performance and security',
      color: '#22c55e',
      status: 'ACTIVE',
      ownerId: sarah.id,
      members: {
        create: [
          { userId: sarah.id, role: 'ADMIN' },
          { userId: arjun.id, role: 'MEMBER' },
        ],
      },
    },
  });

  const p3 = await prisma.project.create({
    data: {
      name: 'Design System',
      description: 'Component library and brand guidelines',
      color: '#a855f7',
      status: 'ACTIVE',
      ownerId: sarah.id,
      members: {
        create: [
          { userId: sarah.id, role: 'ADMIN' },
          { userId: priya.id, role: 'MEMBER' },
        ],
      },
    },
  });

  // Tasks
  const tasks = [
    { title: 'Create wireframes for onboarding', description: 'Design 5-screen onboarding experience', projectId: p1.id, assigneeId: priya.id, status: 'DONE', priority: 'HIGH', dueDate: new Date('2025-05-01'), createdById: sarah.id },
    { title: 'Implement push notifications', description: 'iOS and Android push notification setup', projectId: p1.id, assigneeId: arjun.id, status: 'IN_PROGRESS', priority: 'HIGH', dueDate: new Date('2025-05-20'), createdById: sarah.id },
    { title: 'Dark mode support', description: 'System dark mode detection and theming', projectId: p1.id, assigneeId: priya.id, status: 'TODO', priority: 'MEDIUM', dueDate: new Date('2025-05-25'), createdById: sarah.id },
    { title: 'Auth endpoint security audit', description: 'Penetration testing on login and JWT flows', projectId: p2.id, assigneeId: arjun.id, status: 'REVIEW', priority: 'HIGH', dueDate: new Date('2025-05-05'), createdById: sarah.id },
    { title: 'Rate limiting middleware', description: 'Redis-based rate limiting to all public endpoints', projectId: p2.id, assigneeId: arjun.id, status: 'DONE', priority: 'MEDIUM', dueDate: new Date('2025-04-28'), createdById: sarah.id },
    { title: 'Set up CI/CD pipeline', description: 'GitHub Actions workflow for auto-deploy', projectId: p2.id, assigneeId: sarah.id, status: 'IN_PROGRESS', priority: 'HIGH', dueDate: new Date('2025-05-18'), createdById: sarah.id },
    { title: 'Button component variants', description: 'Primary, secondary, ghost, danger, icon-only', projectId: p3.id, assigneeId: priya.id, status: 'DONE', priority: 'LOW', dueDate: new Date('2025-04-20'), createdById: sarah.id },
    { title: 'Color token documentation', description: 'Document all design tokens with usage examples', projectId: p3.id, assigneeId: priya.id, status: 'TODO', priority: 'MEDIUM', dueDate: new Date('2025-05-30'), createdById: sarah.id },
  ];

  await prisma.task.createMany({ data: tasks });

  // Activity
  await prisma.activity.createMany({
    data: [
      { text: 'Sarah Chen created this project', userId: sarah.id, projectId: p1.id },
      { text: 'Sarah Chen created this project', userId: sarah.id, projectId: p2.id },
      { text: 'Sarah Chen created this project', userId: sarah.id, projectId: p3.id },
      { text: 'Priya Nair completed "Create wireframes for onboarding"', userId: priya.id, projectId: p1.id },
      { text: 'Arjun Mehta completed "Rate limiting middleware"', userId: arjun.id, projectId: p2.id },
      { text: 'Arjun Mehta moved "Auth endpoint security audit" to Review', userId: arjun.id, projectId: p2.id },
    ],
  });

  console.log('✅ Seed complete!');
  console.log('\nDemo accounts:');
  console.log('  admin@teamflow.dev  / Admin123  (Admin)');
  console.log('  dev@teamflow.dev    / Member123 (Member)');
  console.log('  design@teamflow.dev / Member123 (Member)');
}

main()
  .catch((e) => { console.error(e); process.exit(1); })
  .finally(() => prisma.$disconnect());
