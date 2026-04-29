const express = require('express');
const router = express.Router();
const StageProgress = require('../models/StageProgress');
const Assignment = require('../models/Assignment');
const { requireAuth } = require('../middleware/auth');
const { assertProjectParticipant, userCanAccessProject, findProjectById } = require('../services/access');

router.use(requireAuth());

// CREATE — POST /api/stage-progress (project owner or assigned bidder)
router.post('/', async (req, res) => {
  try {
    const { assignmentId, stage, comment, updatedBy } = req.body;
    if (!assignmentId || !stage || !comment || !updatedBy) {
      return res.status(400).json({
        error: 'All fields are required: assignmentId, stage, comment, updatedBy'
      });
    }
    const assignment = await Assignment.findById(assignmentId);
    if (!assignment) return res.status(404).json({ error: 'Assignment not found' });
    const check = await assertProjectParticipant(req, assignment.projectId);
    if (check.status) return res.status(check.status).json({ error: check.error });

    const entry = new StageProgress({ assignmentId, stage, comment, updatedBy });
    const saved = await entry.save();
    res.status(201).json(saved);
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
});

// READ ALL — GET /api/stage-progress (?assignmentId= required)
router.get('/', async (req, res) => {
  try {
    if (!req.query.assignmentId) {
      return res.status(400).json({ error: 'assignmentId query parameter is required' });
    }
    const assignment = await Assignment.findById(req.query.assignmentId);
    if (!assignment) return res.status(404).json({ error: 'Assignment not found' });
    const project = await findProjectById(assignment.projectId);
    if (!project) return res.status(404).json({ error: 'Project not found' });
    if (!(await userCanAccessProject(req.user, project))) {
      return res.json([]);
    }

    const entries = await StageProgress.find({ assignmentId: req.query.assignmentId }).sort({
      createdAt: -1
    });
    res.json(entries);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// READ ONE — GET /api/stage-progress/:id
router.get('/:id', async (req, res) => {
  try {
    const entry = await StageProgress.findById(req.params.id);
    if (!entry) return res.status(404).json({ error: 'Stage progress entry not found' });
    const assignment = await Assignment.findById(entry.assignmentId);
    if (!assignment) return res.status(404).json({ error: 'Assignment not found' });
    const check = await assertProjectParticipant(req, assignment.projectId);
    if (check.status) return res.status(check.status).json({ error: check.error });
    res.json(entry);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;
