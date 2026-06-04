const mongoose = require('mongoose');

const loanApplicationSchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true
    },
    status: {
      type: String,
      enum: ['initiated', 'customer_details_submitted', 'income_details_pending', 'income_details_submitted', 'under_review', 'approved', 'rejected'],
      default: 'initiated'
    },
    customerDetails: {
      fullName: { type: String, trim: true },
      email: { type: String, trim: true, lowercase: true },
      phone: { type: String, trim: true },
      address: { type: String, trim: true },
      dateOfBirth: { type: Date },
      ssn: { type: String, trim: true }
    },
    incomeDetails: {
      employmentStatus: { type: String, trim: true },
      employer: { type: String, trim: true },
      annualIncome: { type: Number },
      employmentDuration: { type: String, trim: true },
      additionalIncome: { type: Number, default: 0 }
    },
    loanDetails: {
      requestedAmount: { type: Number },
      purpose: { type: String, trim: true },
      termMonths: { type: Number }
    }
  },
  { timestamps: true }
);

module.exports = mongoose.model('LoanApplication', loanApplicationSchema);
