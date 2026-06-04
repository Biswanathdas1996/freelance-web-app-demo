import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import Layout from '../components/Layout';
import { initiateLoanApplication } from '../api';

export default function LoanLandingPage() {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleStartApplication = async () => {
    setLoading(true);
    setError('');
    try {
      const application = await initiateLoanApplication();
      navigate(`/loans/application/${application._id}/customer-details`);
    } catch (err) {
      console.error('Error starting application:', err);
      setError('Failed to start loan application. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Layout>
      <div className="loan-landing-page">
        <div className="loan-hero">
          <div className="loan-hero-content">
            <h1 className="loan-hero-title">Get the funds you need with Oktawave Loans</h1>
            <p className="loan-hero-subtitle">
              Fast, secure, and transparent loan origination system. Apply in minutes and get a decision quickly.
            </p>
            <div className="loan-hero-features">
              <div className="loan-feature">
                <div className="loan-feature-icon" aria-hidden="true">✓</div>
                <div className="loan-feature-text">
                  <h3>Quick Application</h3>
                  <p>Complete your application in just a few minutes</p>
                </div>
              </div>
              <div className="loan-feature">
                <div className="loan-feature-icon" aria-hidden="true">✓</div>
                <div className="loan-feature-text">
                  <h3>Secure Process</h3>
                  <p>Your information is protected with bank-level security</p>
                </div>
              </div>
              <div className="loan-feature">
                <div className="loan-feature-icon" aria-hidden="true">✓</div>
                <div className="loan-feature-text">
                  <h3>Fast Decision</h3>
                  <p>Get a response within 24 hours</p>
                </div>
              </div>
            </div>
            {error && (
              <div className="error-msg" role="alert">
                {error}
              </div>
            )}
            <button
              type="button"
              className="btn-primary btn-large"
              onClick={handleStartApplication}
              disabled={loading}
              aria-busy={loading}
            >
              {loading ? 'Starting...' : 'Start Your Loan Application'}
            </button>
          </div>
        </div>

        <div className="loan-info-section">
          <h2>How It Works</h2>
          <div className="loan-steps">
            <div className="loan-step">
              <div className="loan-step-number">1</div>
              <h3>Provide Your Details</h3>
              <p>Share your personal and contact information securely</p>
            </div>
            <div className="loan-step">
              <div className="loan-step-number">2</div>
              <h3>Income Verification</h3>
              <p>Tell us about your employment and income sources</p>
            </div>
            <div className="loan-step">
              <div className="loan-step-number">3</div>
              <h3>Review & Decision</h3>
              <p>Our team reviews your application and provides a decision</p>
            </div>
          </div>
        </div>
      </div>

      <style>{`
        .loan-landing-page {
          max-width: 1200px;
          margin: 0 auto;
          padding: 40px 20px;
        }

        .loan-hero {
          background: linear-gradient(135deg, #0047AB 0%, #0066CC 100%);
          border-radius: 12px;
          padding: 60px 40px;
          color: white;
          margin-bottom: 60px;
        }

        .loan-hero-content {
          max-width: 800px;
          margin: 0 auto;
          text-align: center;
        }

        .loan-hero-title {
          font-size: 2.5rem;
          font-weight: 700;
          margin: 0 0 20px;
          line-height: 1.2;
        }

        .loan-hero-subtitle {
          font-size: 1.25rem;
          margin: 0 0 40px;
          opacity: 0.95;
        }

        .loan-hero-features {
          display: grid;
          grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
          gap: 30px;
          margin-bottom: 40px;
          text-align: left;
        }

        .loan-feature {
          display: flex;
          gap: 15px;
          align-items: flex-start;
        }

        .loan-feature-icon {
          width: 32px;
          height: 32px;
          background: rgba(255, 255, 255, 0.2);
          border-radius: 50%;
          display: flex;
          align-items: center;
          justify-content: center;
          font-size: 18px;
          flex-shrink: 0;
        }

        .loan-feature-text h3 {
          font-size: 1.1rem;
          margin: 0 0 5px;
          font-weight: 600;
        }

        .loan-feature-text p {
          font-size: 0.95rem;
          margin: 0;
          opacity: 0.9;
        }

        .btn-large {
          padding: 16px 48px;
          font-size: 1.1rem;
          font-weight: 600;
          border-radius: 8px;
        }

        .loan-info-section {
          text-align: center;
        }

        .loan-info-section h2 {
          font-size: 2rem;
          margin: 0 0 40px;
          color: #333;
        }

        .loan-steps {
          display: grid;
          grid-template-columns: repeat(auto-fit, minmax(250px, 1fr));
          gap: 40px;
          max-width: 900px;
          margin: 0 auto;
        }

        .loan-step {
          text-align: center;
        }

        .loan-step-number {
          width: 60px;
          height: 60px;
          background: #0047AB;
          color: white;
          border-radius: 50%;
          display: flex;
          align-items: center;
          justify-content: center;
          font-size: 1.5rem;
          font-weight: 700;
          margin: 0 auto 20px;
        }

        .loan-step h3 {
          font-size: 1.3rem;
          margin: 0 0 10px;
          color: #333;
        }

        .loan-step p {
          font-size: 1rem;
          color: #666;
          margin: 0;
        }

        .error-msg {
          background: #fee;
          color: #c33;
          padding: 12px 16px;
          border-radius: 6px;
          margin-bottom: 20px;
        }

        @media (max-width: 768px) {
          .loan-hero {
            padding: 40px 24px;
          }

          .loan-hero-title {
            font-size: 2rem;
          }

          .loan-hero-subtitle {
            font-size: 1.1rem;
          }

          .loan-hero-features {
            gap: 20px;
          }
        }
      `}</style>
    </Layout>
  );
}
