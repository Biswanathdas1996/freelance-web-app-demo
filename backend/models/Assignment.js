const mongoose = require('mongoose');

const assignmentSchema = new mongoose.Schema({
  projectId: { type: mongoose.Schema.Types.ObjectId, ref: 'Project', required: true, unique: true },
  bidId: { type: mongoose.Schema.Types.ObjectId, ref: 'Bid', required: true },
  freelancerName: { type: String, required: true, trim: true },
  description: { type: String, required: true, trim: true },
  assignedAt: { type: Date, default: Date.now },
  currentStage: {
    type: String,
    enum: ['NotStarted', 'InProgress', 'UnderReview', 'Completed'],
    default: 'NotStarted'
  },
  notes: { type: String, trim: true }
}, { timestamps: true });

module.exports = mongoose.model('Assignment', assignmentSchema);