const express = require('express');
const router = express.Router();
const Project = require('../models/Project');
const { requireAuth, requireRole } = require('../middleware/auth');
const { isProjectOwner, findProjectById } = require('../services/access');

router.use(requireAuth());

// CREATE — POST /api/projects (owners only)
router.post('/', requireRole('owner'), async (req, res) => {
  try {
    let { title, description, budget, skills, deadline } = req.body;

    title = typeof title === 'string' ? title.trim() : '';
    description = typeof description === 'string' ? description.trim() : '';

    if (typeof skills === 'string') {
      skills = skills.split(',').map((s) => s.trim()).filter(Boolean);
    }
    if (!Array.isArray(skills)) skills = [];

    budget = budget === '' || budget === undefined || budget === null ? NaN : Number(budget);
    const deadlineDate = deadline ? new Date(deadline) : null;

    if (
      !title ||
      !description ||
      Number.isNaN(budget) ||
      budget < 0 ||
      !skills.length ||
      !deadlineDate ||
      Number.isNaN(deadlineDate.getTime())
    ) {
      return res.status(400).json({
        error:
          'All fields are required: title, description, budget (number ≥ 0), at least one skill, valid deadline'
      });
    }

    const postedBy = req.user.name.trim();
    const project = new Project({
      title,
      description,
      budget,
      skills,
      deadline: deadlineDate,
      ownerId: req.user._id,
      postedBy
    });
    const saved = await project.save();
    const populated = await Project.findById(saved._id).populate('ownerId', 'name email');
    res.status(201).json(populated);
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
});

// READ ALL — GET /api/projects
router.get('/', async (req, res) => {
  try {
    const projects = await Project.find().populate('ownerId', 'name email').sort({ createdAt: -1 });
    res.json(projects);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// READ ONE — GET /api/projects/:id
router.get('/:id', async (req, res) => {
  try {
    const project = await Project.findById(req.params.id).populate('ownerId', 'name email');
    if (!project) return res.status(404).json({ error: 'Project not found' });
    res.json(project);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// UPDATE — PUT /api/projects/:id (project owner)
router.put('/:id', async (req, res) => {
  try {
    const project = await findProjectById(req.params.id);
    if (!project) return res.status(404).json({ error: 'Project not found' });
    if (!isProjectOwner(req.user, project)) {
      return res.status(403).json({ error: 'Only the project owner can update this project' });
    }
    const { ownerId, postedBy, ...body } = req.body;
    const updated = await Project.findByIdAndUpdate(req.params.id, body, {
      new: true,
      runValidators: true
    }).populate('ownerId', 'name email');
    res.json(updated);
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
});

// DELETE — DELETE /api/projects/:id (project owner)
router.delete('/:id', async (req, res) => {
  try {
    const project = await findProjectById(req.params.id);
    if (!project) return res.status(404).json({ error: 'Project not found' });
    if (!isProjectOwner(req.user, project)) {
      return res.status(403).json({ error: 'Only the project owner can delete this project' });
    }
    await Project.findByIdAndDelete(req.params.id);
    res.json({ message: 'Project deleted' });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;
