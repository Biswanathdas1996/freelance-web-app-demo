import { useState, useEffect } from 'react';
import { getMilestones, createMilestone, updateMilestone, deleteMilestone, getAssignments } from '../api';

function statusBadgeClass(status) {
  if (status === 'Completed') return 'badge badge-accepted';
  if (status === 'InProgress') return 'badge badge-open';
  return 'badge badge-pending';
}

export default function MilestonesSection({ projectId, isProjectOwner }) {
  const [milestones, setMilestones] = useState([]);
  const [assignmentId, setAssignmentId] = useState(null);
  const [form, setForm] = useState({ title: '', description: '', dueDate: '', amount: '' });
  const [errors, setErrors] = useState({});
  const [showForm, setShowForm] = useState(false);
  const [statusEdits, setStatusEdits] = useState({});

  const load = async () => {
    try {
      const [ms, assignments] = await Promise.all([
        getMilestones({ projectId }),
        getAssignments({ projectId })
      ]);
      setMilestones(ms);
      if (assignments.length > 0) setAssignmentId(assignments[0]._id);
    } catch (err) {
      console.error(err);
    }
  };

  useEffect(() => {
    load();
  }, [projectId]);

  const validate = () => {
    const e = {};
    if (!form.title.trim()) e.title = 'Required';
    if (!form.dueDate) e.dueDate = 'Required';
    if (form.amount === '' || Number(form.amount) < 0) e.amount = 'Valid amount required';
    return e;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    const e2 = validate();
    if (Object.keys(e2).length) {
      setErrors(e2);
      return;
    }
    if (!assignmentId) {
      setErrors({ submit: 'No assignment found for this project.' });
      return;
    }
    try {
      await createMilestone({ projectId, assignmentId, ...form, amount: Number(form.amount) });
      setForm({ title: '', description: '', dueDate: '', amount: '' });
      setErrors({});
      setShowForm(false);
      load();
    } catch (err) {
      setErrors({ submit: err.response?.data?.error || 'Failed to create milestone' });
    }
  };

  const handleStatusUpdate = async (milestoneId) => {
    const status = statusEdits[milestoneId];
    if (!status) return;
    try {
      await updateMilestone(milestoneId, { status });
      load();
    } catch (err) {
      console.error(err);
    }
  };

  const handleDelete = async (milestoneId) => {
    try {
      await deleteMilestone(milestoneId);
      load();
    } catch (err) {
      console.error(err);
    }
  };

  return (
    <div id="milestones" style={{ marginBottom: 32 }}>
      <h2 className="section-heading">Milestones</h2>

      {isProjectOwner && (
        <button className="toggle-btn" onClick={() => setShowForm((v) => !v)}>
          {showForm ? '- Hide Form' : '+ Add Milestone'}
        </button>
      )}

      {isProjectOwner && showForm && (
        <div className="form-card">
          <form onSubmit={handleSubmit}>
            <div className="form-group">
              <label>Title</label>
              <input
                className="form-control"
                value={form.title}
                onChange={(e) => setForm((f) => ({ ...f, title: e.target.value }))}
              />
              {errors.title && <div className="error-msg">{errors.title}</div>}
            </div>
            <div className="form-group">
              <label>Description</label>
              <textarea
                className="form-control"
                value={form.description}
                onChange={(e) => setForm((f) => ({ ...f, description: e.target.value }))}
              />
            </div>
            <div className="form-row">
              <div className="form-group">
                <label>Due Date</label>
                <input
                  type="date"
                  className="form-control"
                  value={form.dueDate}
                  onChange={(e) => setForm((f) => ({ ...f, dueDate: e.target.value }))}
                />
                {errors.dueDate && <div className="error-msg">{errors.dueDate}</div>}
              </div>
              <div className="form-group">
                <label>Amount ($)</label>
                <input
                  type="number"
                  min="0"
                  className="form-control"
                  value={form.amount}
                  onChange={(e) => setForm((f) => ({ ...f, amount: e.target.value }))}
                />
                {errors.amount && <div className="error-msg">{errors.amount}</div>}
              </div>
            </div>
            {errors.submit && (
              <div className="error-msg" style={{ marginBottom: 8 }}>
                {errors.submit}
              </div>
            )}
            <button type="submit" className="btn-primary">
              Add Milestone
            </button>
          </form>
        </div>
      )}

      {!isProjectOwner && milestones.length > 0 && (
        <p className="info-msg" style={{ marginBottom: 12 }}>
          Only the project owner can add or edit milestones.
        </p>
      )}

      {milestones.length === 0 ? (
        <p className="info-msg">No milestones yet.</p>
      ) : (
        <div>
          {milestones.map((m) => (
            <div key={m._id} className="project-card">
              <div
                style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}
              >
                <div>
                  <h3 style={{ marginBottom: 4 }}>{m.title}</h3>
                  {m.description && (
                    <p style={{ fontSize: 13, color: '#666', marginBottom: 6 }}>{m.description}</p>
                  )}
                  <div className="meta-row">
                    <div className="meta-item">
                      <strong>Due:</strong> {new Date(m.dueDate).toLocaleDateString()}
                    </div>
                    <div className="meta-item">
                      <strong>Amount:</strong> ${m.amount.toLocaleString()}
                    </div>
                    <div className="meta-item">
                      <span className={statusBadgeClass(m.status)}>{m.status}</span>
                    </div>
                  </div>
                </div>
                {isProjectOwner && (
                  <button type="button" className="btn-danger btn-sm" onClick={() => handleDelete(m._id)}>
                    Delete
                  </button>
                )}
              </div>
              {isProjectOwner && (
                <div style={{ display: 'flex', gap: 8, alignItems: 'center', marginTop: 10 }}>
                  <select
                    className="form-control"
                    style={{ width: 'auto' }}
                    value={statusEdits[m._id] || m.status}
                    onChange={(e) => setStatusEdits((s) => ({ ...s, [m._id]: e.target.value }))}
                  >
                    <option value="Pending">Pending</option>
                    <option value="InProgress">InProgress</option>
                    <option value="Completed">Completed</option>
                  </select>
                  <button type="button" className="btn-secondary btn-sm" onClick={() => handleStatusUpdate(m._id)}>
                    Update
                  </button>
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
