require('dotenv').config();
const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');

const User = require('../models/User');
const Project = require('../models/Project');
const Bid = require('../models/Bid');
const Assignment = require('../models/Assignment');
const Milestone = require('../models/Milestone');
const Payment = require('../models/Payment');
const StageProgress = require('../models/StageProgress');
const Todo = require('../models/Todo');

async function clear() {
  await Promise.all([
    Payment.deleteMany({}),
    Milestone.deleteMany({}),
    StageProgress.deleteMany({}),
    Assignment.deleteMany({}),
    Bid.deleteMany({}),
    Project.deleteMany({}),
    Todo.deleteMany({}),
    User.deleteMany({})
  ]);
}

async function seed({ skipConnect = false, disconnectAfter = true } = {}) {
  if (!skipConnect) {
    if (!process.env.MONGO_URI) {
      console.error('MONGO_URI is missing in .env');
      process.exit(1);
    }
    await mongoose.connect(process.env.MONGO_URI);
  }
  console.log('Connected to MongoDB');

  await clear();

  const hash = await bcrypt.hash('demo123', 10);

  const ownerTaylor = await User.create({
    email: 'taylor@demo.com',
    passwordHash: hash,
    name: 'Taylor Reed',
    profession: 'VP Growth Marketing',
    role: 'owner'
  });
  const ownerMorgan = await User.create({
    email: 'morgan@demo.com',
    passwordHash: hash,
    name: 'Morgan Diaz',
    profession: 'CTO · B2B SaaS',
    role: 'owner'
  });
  const ownerSam = await User.create({
    email: 'sam@demo.com',
    passwordHash: hash,
    name: 'Sam Okonkwo',
    profession: 'Creative Director · Brand Studio',
    role: 'owner'
  });

  const bidderJordan = await User.create({
    email: 'jordan@demo.com',
    passwordHash: hash,
    name: 'Jordan Lee',
    profession: 'Senior Frontend Engineer',
    role: 'bidder'
  });
  const bidderCasey = await User.create({
    email: 'casey@demo.com',
    passwordHash: hash,
    name: 'Casey Nguyen',
    profession: 'Full-Stack Developer (Node/React)',
    role: 'bidder'
  });
  const bidderRiley = await User.create({
    email: 'riley@demo.com',
    passwordHash: hash,
    name: 'Riley Patel',
    profession: 'Mobile & API Engineer',
    role: 'bidder'
  });
  const bidderJamie = await User.create({
    email: 'jamie@demo.com',
    passwordHash: hash,
    name: 'Jamie Wu',
    profession: 'Platform / DevOps Engineer',
    role: 'bidder'
  });

  await Todo.insertMany([
    { title: 'Smoke test deploy pipeline', completed: false },
    { title: 'Review freelancer proposals', completed: true }
  ]);

  const p1 = await Project.create({
    title: 'Marketing landing site · conversion sprint',
    description:
      'Rebuild our paid-acquisition landing for a B2B analytics product: responsive layout, HubSpot forms, GA4 + Segment events, and cookie-consent (OneTrust). Design files in Figma; must hit Core Web Vitals “good” on mobile.',
    budget: 4200,
    skills: ['React', 'Vite', 'Tailwind CSS', 'HubSpot'],
    deadline: new Date('2026-07-01'),
    status: 'Open',
    ownerId: ownerTaylor._id,
    postedBy: ownerTaylor.name
  });

  await Bid.insertMany([
    {
      projectId: p1._id,
      bidderId: bidderJordan._id,
      freelancerName: bidderJordan.name,
      freelancerProfession: bidderJordan.profession,
      amount: 4000,
      timeline: 28,
      proposal:
        'Ship static-first React/Vite with shared primitives; Lighthouse performance ≥90, accessibility spot-checks. Includes Storybook handoff for your team.',
      status: 'Pending'
    },
    {
      projectId: p1._id,
      bidderId: bidderCasey._id,
      freelancerName: bidderCasey.name,
      freelancerProfession: bidderCasey.profession,
      amount: 4150,
      timeline: 32,
      proposal:
        'Full integration with your CRM hooks + staging QA checklist. Two structured revision rounds and Slack weekly updates.',
      status: 'Pending'
    }
  ]);

  const p2 = await Project.create({
    title: 'Mobile API integration · JWT & Flutter',
    description:
      'Wire our existing Express API to a production Flutter client: OAuth2-style refresh tokens, device binding, rate limiting headers, and OpenAPI docs kept in sync. Coordinate with our mobile lead on release trains.',
    budget: 12000,
    skills: ['Node.js', 'Express', 'Flutter', 'OpenAPI'],
    deadline: new Date('2026-08-15'),
    status: 'Assigned',
    ownerId: ownerMorgan._id,
    postedBy: ownerMorgan.name
  });

  const winBid = await Bid.create({
    projectId: p2._id,
    bidderId: bidderRiley._id,
    freelancerName: bidderRiley.name,
    freelancerProfession: bidderRiley.profession,
    amount: 10500,
    timeline: 60,
    proposal:
      'Weekly demos, shared Slack channel, Postman collection + Flutter integration notes; phased rollout with feature flags.',
    status: 'Accepted'
  });

  await Bid.create({
    projectId: p2._id,
    bidderId: bidderJamie._id,
    freelancerName: bidderJamie.name,
    freelancerProfession: bidderJamie.profession,
    amount: 11200,
    timeline: 55,
    proposal:
      'Emphasis on CI pipelines and contract tests between API and app; can pair on Terraform if helpful.',
    status: 'Rejected'
  });

  const assignment = await Assignment.create({
    projectId: p2._id,
    bidId: winBid._id,
    freelancerName: bidderRiley.name,
    description:
      'Own auth refresh flow on mobile, coordinate with Flutter lead for QA.',
    assignedAt: new Date('2026-03-01'),
    currentStage: 'InProgress',
    notes: 'Kickoff scheduled; backlog in shared board.'
  });

  const milestone = await Milestone.create({
    projectId: p2._id,
    assignmentId: assignment._id,
    title: 'Auth endpoints + JWT rotation',
    description: 'Login, logout, rotate; Postman suite attached.',
    dueDate: new Date('2026-04-20'),
    amount: 4000,
    status: 'InProgress'
  });

  await Milestone.create({
    projectId: p2._id,
    assignmentId: assignment._id,
    title: 'Flutter integration sprint',
    description: 'Wire screens to live API with staging flag.',
    dueDate: new Date('2026-06-01'),
    amount: 6500,
    status: 'Pending'
  });

  await Payment.insertMany([
    {
      milestoneId: milestone._id,
      projectId: p2._id,
      amount: 4000,
      status: 'Pending',
      transactionNote: 'Escrow milestone 1 — pending client approval.',
      initiatedBy: ownerMorgan.name
    }
  ]);

  await StageProgress.create({
    assignmentId: assignment._id,
    stage: 'InProgress',
    comment: 'Refresh token reuse edge case investigated; fix in PR #14.',
    updatedBy: bidderRiley.name,
    updatedAt: new Date()
  });

  await Project.create({
    title: 'Logo + brand booklet',
    description:
      'Vector logo system (primary + wordmark), color + typography scale, usage on light/dark, and a 12-page PDF brand guide for agency partners. Deliverables: Figma source, AI/EPS exports, print-ready PDF.',
    budget: 2200,
    skills: ['Figma', 'Illustrator', 'Brand guidelines'],
    deadline: new Date('2026-05-30'),
    status: 'Completed',
    ownerId: ownerSam._id,
    postedBy: ownerSam.name
  });

  await Project.insertMany([
    {
      title: 'Technical SEO audit · e‑commerce (Shopify)',
      description:
        'Crawl analysis, indexation fixes, Core Web Vitals remediation plan, schema.org for products, and a prioritized backlog for our Shopify Plus storefront. Work with our content team for redirects after migration.',
      budget: 5600,
      skills: ['SEO', 'Shopify', 'Schema.org', 'Lighthouse'],
      deadline: new Date('2026-06-20'),
      status: 'Open',
      ownerId: ownerTaylor._id,
      postedBy: ownerTaylor.name
    },
    {
      title: 'Explainer video · 90s motion graphics',
      description:
        'Storyboard from approved script, voice-over sync (we provide VO files), After Effects project files, and 1080p + 4K masters for paid social and website hero.',
      budget: 7800,
      skills: ['After Effects', 'Motion design', 'Premiere Pro'],
      deadline: new Date('2026-09-01'),
      status: 'Open',
      ownerId: ownerSam._id,
      postedBy: ownerSam.name
    },
    {
      title: 'PostgreSQL performance tuning',
      description:
        'Investigate slow queries on Neon Postgres (dashboards + batch jobs). Deliver EXPLAIN plans, missing indexes, and safe migration scripts; optional PgBouncer tuning recommendations.',
      budget: 3400,
      skills: ['PostgreSQL', 'SQL', 'Neon'],
      deadline: new Date('2026-05-15'),
      status: 'Open',
      ownerId: ownerMorgan._id,
      postedBy: ownerMorgan.name
    }
  ]);

  console.log('Seed complete:', {
    users: await User.countDocuments(),
    projects: await Project.countDocuments(),
    bids: await Bid.countDocuments(),
    assignments: await Assignment.countDocuments(),
    milestones: await Milestone.countDocuments(),
    payments: await Payment.countDocuments(),
    stageProgress: await StageProgress.countDocuments(),
    todos: await Todo.countDocuments()
  });

  if (disconnectAfter) {
    await mongoose.disconnect();
  }
}

module.exports = { seed };

if (require.main === module) {
  seed({ skipConnect: false, disconnectAfter: true }).catch(err => {
    console.error(err);
    mongoose.disconnect().finally(() => process.exit(1));
  });
}
