const mongoose = require('mongoose');

const paymentSchema = new mongoose.Schema({
  milestoneId: { type: mongoose.Schema.Types.ObjectId, ref: 'Milestone', required: true },
  projectId: { type: mongoose.Schema.Types.ObjectId, ref: 'Project', required: true },
  amount: { type: Number, required: true, min: 0 },
  status: {
    type: String,
    enum: ['Pending', 'Released', 'Paid'],
    default: 'Pending'
  },
  paidDate: { type: Date },
  transactionNote: { type: String, trim: true },
  transactionRef: { type: String, trim: true },
  initiatedBy: { type: String, required: true, trim: true }
}, { timestamps: true });

module.exports = mongoose.model('Payment', paymentSchema);
