const mongoose = require('mongoose');

const userSchema = new mongoose.Schema(
  {
    email: {
      type: String,
      required: true,
      unique: true,
      lowercase: true,
      trim: true
    },
    passwordHash: { type: String, required: true },
    name: { type: String, required: true, trim: true },
    profession: {
      type: String,
      trim: true,
      maxlength: 120,
      default: ''
    },
    role: {
      type: String,
      enum: ['owner', 'bidder'],
      required: true
    }
  },
  { timestamps: true }
);

module.exports = mongoose.model('User', userSchema);
