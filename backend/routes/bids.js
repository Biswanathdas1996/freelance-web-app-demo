const express = require('express');
const router = express.Router();
const Bid = require('../models/Bid');
const Project = require('../models/Project');
const { requireAuth, requireRole } = require('../middleware/auth');
const { isProjectOwner, findProjectById, idEquals } = require('../services/access');

router.use(requireAuth());

// CREATE — POST /api/bids (bidders; not on own project)
router.post('/', requireRole('bidder'), async (req, res) => {
  try {
    const { projectId, amount, timeline, proposal } = req.body;
    if (!projectId || amount === undefined || !timeline || !proposal) {
      return res.status(400).json({
        error: 'All fields are required: projectId, amount, timeline, proposal'
      });
    }

    const project = await findProjectById(projectId);
    if (!project) return res.status(404).json({ error: 'Project not found' });
    if (project.status !== 'Open') {
      return res.status(400).json({ error: 'This project is not accepting bids' });
    }
    if (isProjectOwner(req.user, project)) {
      return res.status(403).json({ error: 'Project owners cannot bid on their own projects' });
    }

    const existing = await Bid.findOne({ projectId, bidderId: req.user._id, status: 'Pending' });
    if (existing) {
      return res.status(409).json({ error: 'You already have a pending bid on this project' });
    }

    const bid = new Bid({
      projectId,
      bidderId: req.user._id,
      freelancerName: req.user.name.trim(),
      freelancerProfession: (req.user.profession || '').trim(),
      amount: Number(amount),
      timeline: Number(timeline),
      proposal: typeof proposal === 'string' ? proposal.trim() : ''
    });
    const saved = await bid.save();
    res.status(201).json(saved);
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
});

// READ ALL — GET /api/bids (optional ?projectId= filter)
router.get('/', async (req, res) => {
  try {
    const filter = {};
    if (req.query.projectId) {
      const project = await findProjectById(req.query.projectId);
      if (!project) return res.status(404).json({ error: 'Project not found' });

      if (isProjectOwner(req.user, project)) {
        filter.projectId = req.query.projectId;
      } else if (req.user.role === 'bidder') {
        filter.projectId = req.query.projectId;
        filter.bidderId = req.user._id;
      } else {
        return res.json([]);
      }
    } else {
      filter.bidderId = req.user._id;
    }

    const bids = await Bid.find(filter).sort({ createdAt: -1 });
    res.json(bids);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// READ ONE — GET /api/bids/:id
router.get('/:id', async (req, res) => {
  try {
    const bid = await Bid.findById(req.params.id);
    if (!bid) return res.status(404).json({ error: 'Bid not found' });

    const project = await findProjectById(bid.projectId);
    if (!project) return res.status(404).json({ error: 'Project not found' });

    const owner = isProjectOwner(req.user, project);
    const isBidder = idEquals(bid.bidderId, req.user._id);
    if (!owner && !isBidder) {
      return res.status(403).json({ error: 'Not allowed to view this bid' });
    }

    res.json(bid);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// ACCEPT — PUT /api/bids/:id/accept
router.put('/:id/accept', requireRole('owner'), async (req, res) => {
  try {
    const bid = await Bid.findById(req.params.id);
    if (!bid) return res.status(404).json({ error: 'Bid not found' });

    const project = await findProjectById(bid.projectId);
    if (!project) return res.status(404).json({ error: 'Project not found' });
    if (!isProjectOwner(req.user, project)) {
      return res.status(403).json({ error: 'Only the project owner can accept bids' });
    }

    bid.status = 'Accepted';
    await bid.save();
    await Bid.updateMany(
      { projectId: bid.projectId, _id: { $ne: bid._id } },
      { status: 'Rejected' }
    );
    await Project.findByIdAndUpdate(bid.projectId, { status: 'Assigned' });
    res.json(bid);
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
});

// REJECT — PUT /api/bids/:id/reject
router.put('/:id/reject', requireRole('owner'), async (req, res) => {
  try {
    const bid = await Bid.findById(req.params.id);
    if (!bid) return res.status(404).json({ error: 'Bid not found' });

    const project = await findProjectById(bid.projectId);
    if (!project) return res.status(404).json({ error: 'Project not found' });
    if (!isProjectOwner(req.user, project)) {
      return res.status(403).json({ error: 'Only the project owner can reject bids' });
    }

    const updated = await Bid.findByIdAndUpdate(req.params.id, { status: 'Rejected' }, { new: true });
    res.json(updated);
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
});

// DELETE — DELETE /api/bids/:id (bidder: own pending bid)
router.delete('/:id', async (req, res) => {
  try {
    const bid = await Bid.findById(req.params.id);
    if (!bid) return res.status(404).json({ error: 'Bid not found' });

    if (idEquals(bid.bidderId, req.user._id)) {
      if (bid.status !== 'Pending') {
        return res.status(400).json({ error: 'Only pending bids can be withdrawn' });
      }
      await Bid.findByIdAndDelete(req.params.id);
      return res.json({ message: 'Bid withdrawn' });
    }

    const project = await findProjectById(bid.projectId);
    if (project && isProjectOwner(req.user, project)) {
      await Bid.findByIdAndDelete(req.params.id);
      return res.json({ message: 'Bid deleted' });
    }

    return res.status(403).json({ error: 'Not allowed to delete this bid' });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;
