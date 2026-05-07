import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { getApiErrorMessage } from '../api';
import '../App.css';

export default function RegisterPage() {
  const { register } = useAuth();
  const navigate = useNavigate();

  const [form, setForm] = useState({
    email: '',
    password: '',
    name: '',
    role: 'bidder',
    profession: ''
  });
  const [error, setError] = useState('');

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    try {
      await register({
        email: form.email.trim(),
        password: form.password,
        name: form.name.trim(),
        role: form.role,
        profession: form.profession.trim()
      });
      navigate('/projects', { replace: true });
    } catch (err) {
      setError(getApiErrorMessage(err, 'Registration failed'));
    }
  };

  return (
    <div className="page-container" style={{ maxWidth: 420 }}>
      <h1 className="page-heading">Create account</h1>
      <p style={{ color: '#555', fontSize: 14, marginBottom: 20 }}>
        Choose <strong>Project owner</strong> to post work, review bids, and manage milestones and
        payments. Choose <strong>Bidder</strong> to submit proposals.
      </p>
      <div className="form-card">
        <form onSubmit={handleSubmit}>
          <div className="form-group">
            <label>Full name</label>
            <input
              className="form-control"
              value={form.name}
              onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))}
              required
            />
          </div>
          <div className="form-group">
            <label>Email</label>
            <input
              className="form-control"
              type="email"
              autoComplete="email"
              value={form.email}
              onChange={(e) => setForm((f) => ({ ...f, email: e.target.value }))}
              required
            />
          </div>
          <div className="form-group">
            <label>Password (min 6 characters)</label>
            <input
              className="form-control"
              type="password"
              autoComplete="new-password"
              value={form.password}
              onChange={(e) => setForm((f) => ({ ...f, password: e.target.value }))}
              required
              minLength={6}
            />
          </div>
          <div className="form-group">
            <label>Professional title (optional)</label>
            <input
              className="form-control"
              placeholder="e.g. Senior UX Designer, Fractional CTO"
              maxLength={120}
              value={form.profession}
              onChange={(e) => setForm((f) => ({ ...f, profession: e.target.value }))}
            />
          </div>
          <div className="form-group">
            <label>Role</label>
            <select
              className="form-control"
              value={form.role}
              onChange={(e) => setForm((f) => ({ ...f, role: e.target.value }))}
            >
              <option value="bidder">Bidder (freelancer)</option>
              <option value="owner">Project owner (client)</option>
            </select>
          </div>
          {error && <div className="error-msg" style={{ marginBottom: 12 }}>{error}</div>}
          <button type="submit" className="btn-primary" style={{ width: '100%' }}>
            Register
          </button>
        </form>
      </div>
      <p style={{ marginTop: 20, fontSize: 14 }}>
        Already have an account? <Link to="/login">Sign in</Link>
      </p>
    </div>
  );
}
