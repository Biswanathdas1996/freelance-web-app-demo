const express = require('express');
const router = express.Router();
const Milestone = require('../models/Milestone');
const Assignment = require('../models/Assignment');
const { requireAuth, requireRole } = require('../middleware/auth');
const { isProjectOwner, findProjectById, userCanAccessProject } = require('../services/access');

router.use(requireAuth());

async function resolveProjectIdForList(req) {
  let projectId = req.query.projectId;
  if (!projectId && req.query.assignmentId) {
    const a = await Assignment.findById(req.query.assignmentId);
    if (!a) return { error: 'Assignment not found' };
    projectId = a.projectId.toString();
  }
  return { projectId };
}

// CREATE — POST /api/milestones (project owner)
router.post('/', requireRole('owner'), async (req, res) => {
  try {
    const { projectId, assignmentId, title, dueDate, amount } = req.body;
    if (!projectId || !assignmentId || !title || !dueDate || amount === undefined) {
      return res.status(400).json({
        error: 'All fields are required: projectId, assignmentId, title, dueDate, amount'
      });
    }
    const project = await findProjectById(projectId);
    if (!project) return res.status(404).json({ error: 'Project not found' });
    if (!isProjectOwner(req.user, project)) {
      return res.status(403).json({ error: 'Only the project owner can create milestones' });
    }
    const milestone = new Milestone(req.body);
    const saved = await milestone.save();
    res.status(201).json(saved);
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
});

// READ ALL — GET /api/milestones
router.get('/', async (req, res) => {
  try {
    const { projectId, error } = await resolveProjectIdForList(req);
    if (error === 'Assignment not found') return res.status(404).json({ error });
    if (!projectId) {
      return res.status(400).json({ error: 'projectId or assignmentId query is required' });
    }
    const project = await findProjectById(projectId);
    if (!project) return res.status(404).json({ error: 'Project not found' });
    if (!(await userCanAccessProject(req.user, project))) {
      return res.json([]);
    }

    const filter = {};
    if (req.query.projectId) filter.projectId = req.query.projectId;
    if (req.query.assignmentId) filter.assignmentId = req.query.assignmentId;
    const milestones = await Milestone.find(filter).sort({ createdAt: -1 });
    res.json(milestones);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// READ ONE — GET /api/milestones/:id
router.get('/:id', async (req, res) => {
  try {
    const milestone = await Milestone.findById(req.params.id);
    if (!milestone) return res.status(404).json({ error: 'Milestone not found' });
    const check = await assertProjectParticipant(req, milestone.projectId);
    if (check.status) return res.status(check.status).json({ error: check.error });
    res.json(milestone);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// UPDATE — PUT /api/milestones/:id (project owner)
router.put('/:id', requireRole('owner'), async (req, res) => {
  try {
    const milestone = await Milestone.findById(req.params.id);
    if (!milestone) return res.status(404).json({ error: 'Milestone not found' });
    const project = await findProjectById(milestone.projectId);
    if (!project || !isProjectOwner(req.user, project)) {
      return res.status(403).json({ error: 'Only the project owner can update milestones' });
    }
    const updated = await Milestone.findByIdAndUpdate(req.params.id, req.body, {
      new: true,
      runValidators: true
    });
    res.json(updated);
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
});

// DELETE — DELETE /api/milestones/:id (project owner)
router.delete('/:id', requireRole('owner'), async (req, res) => {
  try {
    const milestone = await Milestone.findById(req.params.id);
    if (!milestone) return res.status(404).json({ error: 'Milestone not found' });
    const project = await findProjectById(milestone.projectId);
    if (!project || !isProjectOwner(req.user, project)) {
      return res.status(403).json({ error: 'Only the project owner can delete milestones' });
    }
    await Milestone.findByIdAndDelete(req.params.id);
    res.json({ message: 'Milestone deleted' });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;
