const express = require('express');
const router = express.Router();
const Assignment = require('../models/Assignment');
const { requireAuth, requireRole } = require('../middleware/auth');
const { isProjectOwner, findProjectById, isAssignedBidder, assertProjectParticipant } = require('../services/access');

router.use(requireAuth());

// CREATE — POST /api/assignments (project owner)
router.post('/', requireRole('owner'), async (req, res) => {
  try {
    const { projectId, bidId, freelancerName, description } = req.body;
    if (!projectId || !bidId) {
      return res.status(400).json({ error: 'projectId and bidId are required' });
    }
    const project = await findProjectById(projectId);
    if (!project) return res.status(404).json({ error: 'Project not found' });
    if (!isProjectOwner(req.user, project)) {
      return res.status(403).json({ error: 'Only the project owner can create an assignment' });
    }

    const assignment = new Assignment({
      projectId,
      bidId,
      freelancerName,
      description,
      ...req.body
    });
    const saved = await assignment.save();
    res.status(201).json(saved);
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
});

// READ ALL — GET /api/assignments (?projectId= required)
router.get('/', async (req, res) => {
  try {
    if (!req.query.projectId) {
      return res.status(400).json({ error: 'projectId query parameter is required' });
    }
    const project = await findProjectById(req.query.projectId);
    if (!project) return res.status(404).json({ error: 'Project not found' });

    if (isProjectOwner(req.user, project)) {
      const assignments = await Assignment.find({ projectId: req.query.projectId }).sort({ createdAt: -1 });
      return res.json(assignments);
    }

    if (req.user.role === 'bidder') {
      const assigned = await isAssignedBidder(req.user._id, req.query.projectId);
      if (!assigned) return res.json([]);
      const assignments = await Assignment.find({ projectId: req.query.projectId }).sort({ createdAt: -1 });
      return res.json(assignments);
    }

    return res.json([]);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// READ ONE — GET /api/assignments/:id
router.get('/:id', async (req, res) => {
  try {
    const assignment = await Assignment.findById(req.params.id);
    if (!assignment) return res.status(404).json({ error: 'Assignment not found' });
    const check = await assertProjectParticipant(req, assignment.projectId);
    if (check.status) return res.status(check.status).json({ error: check.error });
    res.json(assignment);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// UPDATE — PUT /api/assignments/:id (project owner)
router.put('/:id', requireRole('owner'), async (req, res) => {
  try {
    const assignment = await Assignment.findById(req.params.id);
    if (!assignment) return res.status(404).json({ error: 'Assignment not found' });
    const project = await findProjectById(assignment.projectId);
    if (!project || !isProjectOwner(req.user, project)) {
      return res.status(403).json({ error: 'Only the project owner can update this assignment' });
    }
    const validStages = ['NotStarted', 'InProgress', 'UnderReview', 'Completed'];
    if (req.body.currentStage && !validStages.includes(req.body.currentStage)) {
      return res.status(400).json({ error: 'Invalid stage value' });
    }
    const updated = await Assignment.findByIdAndUpdate(req.params.id, req.body, {
      new: true,
      runValidators: true
    });
    res.json(updated);
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
});

// DELETE — DELETE /api/assignments/:id (project owner)
router.delete('/:id', requireRole('owner'), async (req, res) => {
  try {
    const assignment = await Assignment.findById(req.params.id);
    if (!assignment) return res.status(404).json({ error: 'Assignment not found' });
    const project = await findProjectById(assignment.projectId);
    if (!project || !isProjectOwner(req.user, project)) {
      return res.status(403).json({ error: 'Only the project owner can delete this assignment' });
    }

    await Assignment.findByIdAndDelete(req.params.id);
    const StageProgress = require('../models/StageProgress');
    await StageProgress.deleteMany({ assignmentId: req.params.id });

    res.json({ message: 'Assignment deleted successfully' });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;
