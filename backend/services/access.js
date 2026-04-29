const mongoose = require('mongoose');
const Project = require('../models/Project');
const Assignment = require('../models/Assignment');
const Bid = require('../models/Bid');

function idEquals(a, b) {
  if (!a || !b) return false;
  return a.toString() === b.toString();
}

function isProjectOwner(user, project) {
  if (!project?.ownerId || !user?._id) return false;
  return idEquals(project.ownerId, user._id);
}

async function findProjectById(projectId) {
  if (!mongoose.isValidObjectId(projectId)) return null;
  return Project.findById(projectId);
}

async function isAssignedBidder(userId, projectId) {
  if (!mongoose.isValidObjectId(projectId) || !userId) return false;
  const assignment = await Assignment.findOne({ projectId });
  if (!assignment) return false;
  const bid = await Bid.findById(assignment.bidId);
  if (!bid?.bidderId) return false;
  return idEquals(bid.bidderId, userId);
}

async function userCanAccessProject(user, project) {
  if (!user || !project) return false;
  if (isProjectOwner(user, project)) return true;
  if (user.role === 'bidder') return await isAssignedBidder(user._id, project._id);
  return false;
}

/** Returns { project } or { status, error } for HTTP response */
async function assertProjectParticipant(req, projectId) {
  const project = await findProjectById(projectId);
  if (!project) return { status: 404, error: 'Project not found' };
  if (await userCanAccessProject(req.user, project)) return { project };
  return { status: 403, error: 'Not allowed to access this project' };
}

module.exports = {
  idEquals,
  isProjectOwner,
  findProjectById,
  isAssignedBidder,
  userCanAccessProject,
  assertProjectParticipant
};
