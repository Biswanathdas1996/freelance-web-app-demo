import { useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import Layout from '../components/Layout';
import { submitIncomeDetails } from '../api';

export default function IncomeDetailsFormPage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);
  const [formData, setFormData] = useState({
    employmentStatus: '',
    employer: '',
    annualIncome: '',
    employmentDuration: '',
    additionalIncome: '0'
  });

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    setSuccess(false);

    try {
      const payload = {
        ...formData,
        annualIncome: Number(formData.annualIncome),
        additionalIncome: Number(formData.additionalIncome)
      };
      await submitIncomeDetails(id, payload);
      setSuccess(true);
      setTimeout(() => {
        navigate('/loans');
      }, 2000);
    } catch (err) {
      console.error('Error submitting income details:', err);
      setError('Failed to submit income details. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Layout>
      <div className="loan-form-page">
        <div className="loan-form-container">
          <div className="loan-form-header">
            <h1>Income Details</h1>
            <p>Please provide information about your employment and income sources.</p>
          </div>

          {error && (
            <div className="error-msg" role="alert">
              {error}
            </div>
          )}

          {success && (
            <div className="success-msg" role="alert">
              Income details submitted successfully! Redirecting...
            </div>
          )}

          <form onSubmit={handleSubmit} className="loan-form">
            <div className="form-group">
              <label htmlFor="employmentStatus">
                Employment Status <span className="required">*</span>
              </label>
              <select
                id="employmentStatus"
                name="employmentStatus"
                className="form-control"
                value={formData.employmentStatus}
                onChange={handleChange}
                required
              >
                <option value="">Select employment status</option>
                <option value="full-time">Full-time Employed</option>
                <option value="part-time">Part-time Employed</option>
                <option value="self-employed">Self-employed</option>
                <option value="retired">Retired</option>
                <option value="unemployed">Unemployed</option>
              </select>
            </div>

            <div className="form-group">
              <label htmlFor="employer">
                Employer Name <span className="required">*</span>
              </label>
              <input
                type="text"
                id="employer"
                name="employer"
                className="form-control"
                value={formData.employer}
                onChange={handleChange}
                required
                placeholder="Company Name"
              />
            </div>

            <div className="form-group">
              <label htmlFor="annualIncome">
                Annual Income (USD) <span className="required">*</span>
              </label>
              <input
                type="number"
                id="annualIncome"
                name="annualIncome"
                className="form-control"
                value={formData.annualIncome}
                onChange={handleChange}
                required
                min="0"
                step="1000"
                placeholder="50000"
              />
            </div>

            <div className="form-group">
              <label htmlFor="employmentDuration">
                Employment Duration <span className="required">*</span>
              </label>
              <select
                id="employmentDuration"
                name="employmentDuration"
                className="form-control"
                value={formData.employmentDuration}
                onChange={handleChange}
                required
              >
                <option value="">Select duration</option>
                <option value="less-than-1-year">Less than 1 year</option>
                <option value="1-3-years">1-3 years</option>
                <option value="3-5-years">3-5 years</option>
                <option value="5-10-years">5-10 years</option>
                <option value="more-than-10-years">More than 10 years</option>
              </select>
            </div>

            <div className="form-group">
              <label htmlFor="additionalIncome">
                Additional Income (USD)
              </label>
              <input
                type="number"
                id="additionalIncome"
                name="additionalIncome"
                className="form-control"
                value={formData.additionalIncome}
                onChange={handleChange}
                min="0"
                step="1000"
                placeholder="0"
              />
              <small className="form-text">
                Include any additional sources of income (rental, investments, etc.)
              </small>
            </div>

            <div className="form-actions">
              <button
                type="submit"
                className="btn-primary"
                disabled={loading || success}
                aria-busy={loading}
              >
                {loading ? 'Submitting...' : success ? 'Submitted!' : 'Submit Application'}
              </button>
            </div>
          </form>
        </div>
      </div>

      <style>{`
        .loan-form-page {
          max-width: 700px;
          margin: 0 auto;
          padding: 40px 20px;
        }

        .loan-form-container {
          background: white;
          border-radius: 12px;
          padding: 40px;
          box-shadow: 0 2px 8px rgba(0,0,0,0.1);
        }

        .loan-form-header {
          margin-bottom: 30px;
        }

        .loan-form-header h1 {
          font-size: 2rem;
          margin: 0 0 10px;
          color: #0047AB;
        }

        .loan-form-header p {
          font-size: 1rem;
          color: #666;
          margin: 0;
        }

        .loan-form {
          display: flex;
          flex-direction: column;
          gap: 24px;
        }

        .form-group {
          display: flex;
          flex-direction: column;
        }

        .form-group label {
          font-weight: 600;
          margin-bottom: 8px;
          color: #333;
        }

        .required {
          color: #c33;
        }

        .form-control {
          padding: 12px;
          border: 1px solid #ddd;
          border-radius: 6px;
          font-size: 1rem;
          transition: border-color 0.2s;
        }

        .form-control:focus {
          outline: none;
          border-color: #0047AB;
          box-shadow: 0 0 0 3px rgba(0, 71, 171, 0.1);
        }

        .form-text {
          margin-top: 6px;
          font-size: 0.875rem;
          color: #666;
        }

        .form-actions {
          margin-top: 16px;
        }

        .form-actions button {
          width: 100%;
          padding: 14px;
          font-size: 1.1rem;
        }

        .success-msg {
          background: #d4edda;
          color: #155724;
          padding: 12px 16px;
          border-radius: 6px;
          margin-bottom: 20px;
          border: 1px solid #c3e6cb;
        }

        @media (max-width: 768px) {
          .loan-form-container {
            padding: 24px;
          }
        }
      `}</style>
    </Layout>
  );
}
