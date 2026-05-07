import { useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import Layout from '../components/Layout';
import { submitCustomerDetails } from '../api';

export default function CustomerDetailsFormPage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [formData, setFormData] = useState({
    fullName: '',
    email: '',
    phone: '',
    address: '',
    dateOfBirth: '',
    ssn: ''
  });

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    try {
      const result = await submitCustomerDetails(id, formData);
      if (result.nextStep === 'income_details') {
        navigate(`/loans/application/${id}/income-details`);
      }
    } catch (err) {
      console.error('Error submitting customer details:', err);
      setError('Failed to submit customer details. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Layout>
      <div className="loan-form-page">
        <div className="loan-form-container">
          <div className="loan-form-header">
            <h1>Customer Details</h1>
            <p>Please provide your personal information to continue with your loan application.</p>
          </div>

          {error && (
            <div className="error-msg" role="alert">
              {error}
            </div>
          )}

          <form onSubmit={handleSubmit} className="loan-form">
            <div className="form-group">
              <label htmlFor="fullName">
                Full Name <span className="required">*</span>
              </label>
              <input
                type="text"
                id="fullName"
                name="fullName"
                className="form-control"
                value={formData.fullName}
                onChange={handleChange}
                required
                placeholder="John Doe"
              />
            </div>

            <div className="form-group">
              <label htmlFor="email">
                Email Address <span className="required">*</span>
              </label>
              <input
                type="email"
                id="email"
                name="email"
                className="form-control"
                value={formData.email}
                onChange={handleChange}
                required
                placeholder="john.doe@example.com"
              />
            </div>

            <div className="form-group">
              <label htmlFor="phone">
                Phone Number <span className="required">*</span>
              </label>
              <input
                type="tel"
                id="phone"
                name="phone"
                className="form-control"
                value={formData.phone}
                onChange={handleChange}
                required
                placeholder="(555) 123-4567"
              />
            </div>

            <div className="form-group">
              <label htmlFor="address">
                Address <span className="required">*</span>
              </label>
              <textarea
                id="address"
                name="address"
                className="form-control"
                value={formData.address}
                onChange={handleChange}
                required
                rows="3"
                placeholder="123 Main St, Apt 4B, City, State, ZIP"
              />
            </div>

            <div className="form-group">
              <label htmlFor="dateOfBirth">
                Date of Birth <span className="required">*</span>
              </label>
              <input
                type="date"
                id="dateOfBirth"
                name="dateOfBirth"
                className="form-control"
                value={formData.dateOfBirth}
                onChange={handleChange}
                required
              />
            </div>

            <div className="form-group">
              <label htmlFor="ssn">
                Social Security Number <span className="required">*</span>
              </label>
              <input
                type="text"
                id="ssn"
                name="ssn"
                className="form-control"
                value={formData.ssn}
                onChange={handleChange}
                required
                placeholder="XXX-XX-XXXX"
                maxLength="11"
              />
              <small className="form-text">Your SSN is encrypted and securely stored.</small>
            </div>

            <div className="form-actions">
              <button
                type="submit"
                className="btn-primary"
                disabled={loading}
                aria-busy={loading}
              >
                {loading ? 'Submitting...' : 'Continue to Income Details'}
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

        @media (max-width: 768px) {
          .loan-form-container {
            padding: 24px;
          }
        }
      `}</style>
    </Layout>
  );
}
