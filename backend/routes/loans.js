const express = require('express');
const router = express.Router();
const LoanApplication = require('../models/LoanApplication');
const { authenticate } = require('../middleware/auth');

router.post('/initiate', authenticate, async (req, res) => {
  try {
    const loanApplication = new LoanApplication({
      userId: req.user.id,
      status: 'initiated'
    });
    await loanApplication.save();
    res.status(201).json(loanApplication);
  } catch (error) {
    console.error('Error initiating loan application:', error);
    res.status(500).json({ error: 'Failed to initiate loan application' });
  }
});

router.post('/:id/customer-details', authenticate, async (req, res) => {
  try {
    const { id } = req.params;
    const { fullName, email, phone, address, dateOfBirth, ssn } = req.body;

    const loanApplication = await LoanApplication.findOne({
      _id: id,
      userId: req.user.id
    });

    if (!loanApplication) {
      return res.status(404).json({ error: 'Loan application not found' });
    }

    loanApplication.customerDetails = {
      fullName,
      email,
      phone,
      address,
      dateOfBirth,
      ssn
    };
    loanApplication.status = 'customer_details_submitted';

    await loanApplication.save();

    res.json({
      success: true,
      loanApplication,
      nextStep: 'income_details'
    });
  } catch (error) {
    console.error('Error submitting customer details:', error);
    res.status(500).json({ error: 'Failed to submit customer details' });
  }
});

router.post('/:id/income-details', authenticate, async (req, res) => {
  try {
    const { id } = req.params;
    const { employmentStatus, employer, annualIncome, employmentDuration, additionalIncome } = req.body;

    const loanApplication = await LoanApplication.findOne({
      _id: id,
      userId: req.user.id
    });

    if (!loanApplication) {
      return res.status(404).json({ error: 'Loan application not found' });
    }

    if (loanApplication.status !== 'customer_details_submitted' && loanApplication.status !== 'income_details_pending') {
      return res.status(400).json({ error: 'Customer details must be submitted first' });
    }

    loanApplication.incomeDetails = {
      employmentStatus,
      employer,
      annualIncome,
      employmentDuration,
      additionalIncome
    };
    loanApplication.status = 'income_details_submitted';

    await loanApplication.save();

    res.json({
      success: true,
      loanApplication,
      message: 'Income details submitted successfully'
    });
  } catch (error) {
    console.error('Error submitting income details:', error);
    res.status(500).json({ error: 'Failed to submit income details' });
  }
});

router.get('/my-applications', authenticate, async (req, res) => {
  try {
    const applications = await LoanApplication.find({ userId: req.user.id })
      .sort({ createdAt: -1 });
    res.json(applications);
  } catch (error) {
    console.error('Error fetching loan applications:', error);
    res.status(500).json({ error: 'Failed to fetch loan applications' });
  }
});

router.get('/:id', authenticate, async (req, res) => {
  try {
    const loanApplication = await LoanApplication.findOne({
      _id: req.params.id,
      userId: req.user.id
    });

    if (!loanApplication) {
      return res.status(404).json({ error: 'Loan application not found' });
    }

    res.json(loanApplication);
  } catch (error) {
    console.error('Error fetching loan application:', error);
    res.status(500).json({ error: 'Failed to fetch loan application' });
  }
});

module.exports = router;
