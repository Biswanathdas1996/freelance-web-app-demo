import { useState } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { getApiErrorMessage } from '../api';
import '../App.css';

export default function LoginPage() {
  const { login } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const from = location.state?.from || '/';

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    try {
      await login(email.trim(), password);
      navigate(from, { replace: true });
    } catch (err) {
      setError(getApiErrorMessage(err, 'Login failed'));
    }
  };

  return (
    <div className="page-container" style={{ maxWidth: 420 }}>
      <h1 className="page-heading">Sign in</h1>
      <p className="info-msg" style={{ marginBottom: 20 }}>
        Demo: <code>taylor@demo.com</code> / <code>morgan@demo.com</code> (owners) or{' '}
        <code>jordan@demo.com</code> (bidder) — password <code>demo123</code> after running{' '}
        <code>npm run seed</code> in the backend.
      </p>
      <div className="form-card">
        <form onSubmit={handleSubmit}>
          <div className="form-group">
            <label>Email</label>
            <input
              className="form-control"
              type="email"
              autoComplete="username"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
            />
          </div>
          <div className="form-group">
            <label>Password</label>
            <input
              className="form-control"
              type="password"
              autoComplete="current-password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
            />
          </div>
          {error && <div className="error-msg" style={{ marginBottom: 12 }}>{error}</div>}
          <button type="submit" className="btn-primary" style={{ width: '100%' }}>
            Sign in
          </button>
        </form>
      </div>
      <p style={{ marginTop: 20, fontSize: 14, color: '#555' }}>
        No account? <Link to="/register">Register</Link>
      </p>
    </div>
  );
}
