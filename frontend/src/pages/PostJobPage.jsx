import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import Layout from '../components/Layout';
import { useAuth } from '../context/AuthContext';
import { createProject } from '../api';

export default function PostJobPage() {
  const { isOwner } = useAuth();
  const navigate = useNavigate();
  const [form, setForm] = useState({
    title: '',
    description: '',
    budget: '',
    skills: '',
    deadline: ''
  });
  const [errors, setErrors] = useState({});

  const validate = () => {
    const e = {};
    if (!form.title.trim()) e.title = 'Required';
    if (!form.description.trim()) e.description = 'Required';
    if (form.budget === '' || Number(form.budget) < 0) e.budget = 'Valid budget required';
    if (!form.skills.trim()) e.skills = 'Required';
    if (!form.deadline) e.deadline = 'Required';
    return e;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    const e2 = validate();
    if (Object.keys(e2).length) {
      setErrors(e2);
      return;
    }
    try {
      const skillsArr = form.skills.split(',').map((s) => s.trim()).filter(Boolean);
      await createProject({
        title: form.title,
        description: form.description,
        budget: Number(form.budget),
        skills: skillsArr,
        deadline: form.deadline
      });
      setForm({ title: '', description: '', budget: '', skills: '', deadline: '' });
      setErrors({});
      navigate('/');
    } catch (err) {
      const apiMsg = err.response?.data?.error;
      const networkMsg =
        err.code === 'ERR_NETWORK' || err.message === 'Network Error'
          ? 'Cannot reach the API—start the backend (port 9001) and reload.'
          : null;
      setErrors({
        submit: apiMsg || networkMsg || err.message || 'Failed to create project'
      });
    }
  };

  return (
    <Layout>
      <nav className="uw-breadcrumb" aria-label="Breadcrumb">
        <Link to="/">Find work</Link>
        <span aria-hidden="true"> / </span>
        <span>Post a job</span>
      </nav>

      <h1 className="uw-page-title">Post a fixed-price job</h1>
      <p className="uw-page-sub">
        Publish a scoped project with budget and deadline. Freelancers will submit proposals, and
        you can accept the best bid to start delivery.
      </p>

      {!isOwner ? (
        <div className="uw-sidebar-card" style={{ maxWidth: 600, marginTop: 24 }}>
          <h3>Client access only</h3>
          <p style={{ fontSize: 14, color: '#767676', margin: '8px 0 16px', lineHeight: 1.5 }}>
            Only users with an owner account can post jobs. If you're a freelancer looking for
            work, browse available projects.
          </p>
          <Link to="/" className="btn-primary">
            Browse jobs
          </Link>
        </div>
      ) : (
        <div style={{ maxWidth: 600, marginTop: 24 }}>
          <form onSubmit={handleSubmit} className="uw-sidebar-card">
            <div className="form-group">
              <label>Job title</label>
              <input
                className="form-control"
                placeholder="e.g. Build a responsive landing page"
                value={form.title}
                onChange={(e) => setForm((f) => ({ ...f, title: e.target.value }))}
              />
              {errors.title && <div className="error-msg">{errors.title}</div>}
            </div>
            <div className="form-group">
              <label>Description</label>
              <textarea
                className="form-control"
                rows="6"
                placeholder="Describe the project scope, deliverables, and any special requirements"
                value={form.description}
                onChange={(e) => setForm((f) => ({ ...f, description: e.target.value }))}
              />
              {errors.description && <div className="error-msg">{errors.description}</div>}
            </div>
            <div className="form-group">
              <label>Budget ($)</label>
              <input
                type="number"
                min="0"
                className="form-control"
                placeholder="500"
                value={form.budget}
                onChange={(e) => setForm((f) => ({ ...f, budget: e.target.value }))}
              />
              {errors.budget && <div className="error-msg">{errors.budget}</div>}
            </div>
            <div className="form-group">
              <label>Deadline</label>
              <input
                type="date"
                className="form-control"
                value={form.deadline}
                onChange={(e) => setForm((f) => ({ ...f, deadline: e.target.value }))}
              />
              {errors.deadline && <div className="error-msg">{errors.deadline}</div>}
            </div>
            <div className="form-group">
              <label>Skills (comma-separated)</label>
              <input
                className="form-control"
                placeholder="e.g. React, Node.js, MongoDB"
                value={form.skills}
                onChange={(e) => setForm((f) => ({ ...f, skills: e.target.value }))}
              />
              {errors.skills && <div className="error-msg">{errors.skills}</div>}
            </div>
            {errors.submit && (
              <div className="error-msg" style={{ marginBottom: 16 }}>
                {errors.submit}
              </div>
            )}
            <button type="submit" className="btn-primary" style={{ width: '100%' }}>
              Publish job
            </button>
          </form>
        </div>
      )}
    </Layout>
  );
}
