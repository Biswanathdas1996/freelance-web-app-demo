const mongoose = require('mongoose');

const bidSchema = new mongoose.Schema({
  projectId: { type: mongoose.Schema.Types.ObjectId, ref: 'Project', required: true },
  bidderId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  freelancerName: { type: String, required: true, trim: true },
  freelancerProfession: { type: String, trim: true, default: '' },
  amount: { type: Number, required: true, min: 0 },
  timeline: { type: Number, required: true, min: 1 },
  proposal: { type: String, required: true, trim: true },
  status: {
    type: String,
    enum: ['Pending', 'Accepted', 'Rejected'],
    default: 'Pending'
  }
}, { timestamps: true });

module.exports = mongoose.model('Bid', bidSchema);
