const express = require('express');
const router = express.Router();
const Payment = require('../models/Payment');
const { requireAuth, requireRole } = require('../middleware/auth');
const { isProjectOwner, findProjectById, userCanAccessProject } = require('../services/access');

router.use(requireAuth());

// CREATE — POST /api/payments (project owner)
router.post('/', requireRole('owner'), async (req, res) => {
  try {
    const { milestoneId, projectId, amount, initiatedBy } = req.body;
    if (!milestoneId || !projectId || amount === undefined || !initiatedBy) {
      return res.status(400).json({
        error: 'All fields are required: milestoneId, projectId, amount, initiatedBy'
      });
    }
    const project = await findProjectById(projectId);
    if (!project) return res.status(404).json({ error: 'Project not found' });
    if (!isProjectOwner(req.user, project)) {
      return res.status(403).json({ error: 'Only the project owner can record payments' });
    }
    const payment = new Payment(req.body);
    const saved = await payment.save();
    res.status(201).json(saved);
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
});

// READ ALL — GET /api/payments (?projectId= required)
router.get('/', async (req, res) => {
  try {
    if (!req.query.projectId) {
      return res.status(400).json({ error: 'projectId query parameter is required' });
    }
    const project = await findProjectById(req.query.projectId);
    if (!project) return res.status(404).json({ error: 'Project not found' });
    if (!(await userCanAccessProject(req.user, project))) {
      return res.json([]);
    }

    const filter = { projectId: req.query.projectId };
    if (req.query.milestoneId) filter.milestoneId = req.query.milestoneId;
    const payments = await Payment.find(filter).sort({ createdAt: -1 });
    res.json(payments);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// READ ONE — GET /api/payments/:id
router.get('/:id', async (req, res) => {
  try {
    const payment = await Payment.findById(req.params.id);
    if (!payment) return res.status(404).json({ error: 'Payment not found' });
    const check = await assertProjectParticipant(req, payment.projectId);
    if (check.status) return res.status(check.status).json({ error: check.error });
    res.json(payment);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// UPDATE — PUT /api/payments/:id (project owner)
router.put('/:id', requireRole('owner'), async (req, res) => {
  try {
    const payment = await Payment.findById(req.params.id);
    if (!payment) return res.status(404).json({ error: 'Payment not found' });
    const project = await findProjectById(payment.projectId);
    if (!project || !isProjectOwner(req.user, project)) {
      return res.status(403).json({ error: 'Only the project owner can update payments' });
    }
    const updated = await Payment.findByIdAndUpdate(req.params.id, req.body, {
      new: true,
      runValidators: true
    });
    res.json(updated);
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
});

module.exports = router;
