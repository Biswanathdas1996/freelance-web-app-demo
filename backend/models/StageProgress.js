const mongoose = require('mongoose');

const stageProgressSchema = new mongoose.Schema({
  assignmentId: { type: mongoose.Schema.Types.ObjectId, ref: 'Assignment', required: true },
  stage: {
    type: String,
    enum: ['NotStarted', 'InProgress', 'UnderReview', 'Completed'],
    required: true
  },
  comment: { type: String, required: true, trim: true },
  updatedBy: { type: String, required: true, trim: true },
  updatedAt: { type: Date, default: Date.now }
}, { timestamps: true });

module.exports = mongoose.model('StageProgress', stageProgressSchema);
