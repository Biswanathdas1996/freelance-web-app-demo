const mongoose = require('mongoose');

const projectSchema = new mongoose.Schema({
  title: { type: String, required: true, trim: true },
  description: { type: String, required: true, trim: true },
  budget: { type: Number, required: true, min: 0 },
  skills: { type: [String], required: true },
  deadline: { type: Date, required: true },
  status: {
    type: String,
    enum: ['Open', 'Assigned', 'InProgress', 'Completed', 'Cancelled'],
    default: 'Open'
  },
  ownerId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  postedBy: { type: String, trim: true }
}, { timestamps: true });

module.exports = mongoose.model('Project', projectSchema);
