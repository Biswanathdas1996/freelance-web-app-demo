import { useState, useEffect } from 'react';
import { getMilestones, createMilestone, updateMilestone, deleteMilestone, getAssignments } from '../api';

// Icons
const PlusIcon = () => (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
    <line x1="12" y1="5" x2="12" y2="19" />
    <line x1="5" y1="12" x2="19" y2="12" />
  </svg>
);

const MinusIcon = () => (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
    <line x1="5" y1="12" x2="19" y2="12" />
  </svg>
);

const FlagIcon = () => (
  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M4 15s1-1 4-1 5 2 8 2 4-1 4-1V3s-1 1-4 1-5-2-8-2-4 1-4 1z" />
    <line x1="4" y1="22" x2="4" y2="15" />
  </svg>
);

const CalendarIcon = () => (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
    <rect x="3" y="4" width="18" height="18" rx="2" ry="2" />
    <line x1="16" y1="2" x2="16" y2="6" />
    <line x1="8" y1="2" x2="8" y2="6" />
    <line x1="3" y1="10" x2="21" y2="10" />
  </svg>
);

const DollarIcon = () => (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
    <line x1="12" y1="1" x2="12" y2="23" />
    <path d="M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6" />
  </svg>
);

const CheckIcon = () => (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <polyline points="20 6 9 17 4 12" />
  </svg>
);

const TrashIcon = () => (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <polyline points="3 6 5 6 21 6" />
    <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2" />
  </svg>
);

const AlertCircleIcon = () => (
  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <circle cx="12" cy="12" r="10" />
    <line x1="12" y1="8" x2="12" y2="12" />
    <line x1="12" y1="16" x2="12.01" y2="16" />
  </svg>
);

const MilestoneIcon = () => (
  <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M12 2L2 7l10 5 10-5-10-5z" />
    <path d="M2 17l10 5 10-5" />
    <path d="M2 12l10 5 10-5" />
  </svg>
);

const EmptyStateIcon = () => (
  <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M12 2L2 7l10 5 10-5-10-5z" />
    <path d="M2 17l10 5 10-5" />
    <path d="M2 12l10 5 10-5" />
  </svg>
);

const ClockIcon = () => (
  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
    <circle cx="12" cy="12" r="10" />
    <polyline points="12 6 12 12 16 14" />
  </svg>
);

function getStatusConfig(status) {
  switch (status) {
    case 'Completed':
      return {
        bg: 'rgba(16, 185, 129, 0.1)',
        color: '#10B981',
        borderColor: 'rgba(16, 185, 129, 0.2)',
        label: 'Completed',
        icon: '✓'
      };
    case 'InProgress':
      return {
        bg: 'rgba(45, 181, 218, 0.1)',
        color: '#2DB5DA',
        borderColor: 'rgba(45, 181, 218, 0.2)',
        label: 'In Progress',
        icon: '▸'
      };
    default:
      return {
        bg: 'rgba(245, 158, 11, 0.1)',
        color: '#F59E0B',
        borderColor: 'rgba(245, 158, 11, 0.2)',
        label: 'Pending',
        icon: '○'
      };
  }
}

function formatDate(dateStr) {
  if (!dateStr) return '—';
  const d = new Date(dateStr);
  if (Number.isNaN(d.getTime())) return '—';
  return d.toLocaleDateString(undefined, {
    month: 'short',
    day: 'numeric',
    year: 'numeric'
  });
}

function getDueStatus(dueDate) {
  if (!dueDate) return null;
  const due = new Date(dueDate);
  const now = new Date();
  const diffTime = due - now;
  const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

  if (diffDays < 0) return { text: `${Math.abs(diffDays)} days overdue`, variant: 'danger' };
  if (diffDays === 0) return { text: 'Due today', variant: 'urgent' };
  if (diffDays === 1) return { text: 'Due tomorrow', variant: 'warning' };
  if (diffDays <= 7) return { text: `${diffDays} days left`, variant: 'warning' };
  return { text: `${diffDays} days left`, variant: 'success' };
}

export default function MilestonesSection({ projectId, isProjectOwner }) {
  const [milestones, setMilestones] = useState([]);
  const [assignmentId, setAssignmentId] = useState(null);
  const [form, setForm] = useState({ title: '', description: '', dueDate: '', amount: '' });
  const [errors, setErrors] = useState({});
  const [showForm, setShowForm] = useState(false);
  const [statusEdits, setStatusEdits] = useState({});
  const [loading, setLoading] = useState(true);

  const load = async () => {
    try {
      setLoading(true);
      const [ms, assignments] = await Promise.all([
        getMilestones({ projectId }),
        getAssignments({ projectId })
      ]);
      setMilestones(ms);
      if (assignments.length > 0) setAssignmentId(assignments[0]._id);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load();
  }, [projectId]);

  const validate = () => {
    const e = {};
    if (!form.title.trim()) e.title = 'Title is required';
    if (!form.dueDate) e.dueDate = 'Due date is required';
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
    if (!window.confirm('Are you sure you want to delete this milestone?')) return;
    try {
      await deleteMilestone(milestoneId);
      load();
    } catch (err) {
      console.error(err);
    }
  };

  // Calculate stats
  const totalAmount = milestones.reduce((sum, m) => sum + (m.amount || 0), 0);
  const completedAmount = milestones
    .filter(m => m.status === 'Completed')
    .reduce((sum, m) => sum + (m.amount || 0), 0);
  const completionRate = milestones.length > 0
    ? Math.round((milestones.filter(m => m.status === 'Completed').length / milestones.length) * 100)
    : 0;

  return (
    <div className="ms-section">
      {/* Header */}
      <div className="ms-header">
        <div className="ms-title-group">
          <div className="ms-title-icon">
            <FlagIcon />
          </div>
          <div>
            <h2 className="ms-title">Milestones</h2>
            <p className="ms-subtitle">
              {milestones.length === 0
                ? 'No milestones yet'
                : `${milestones.length} milestone${milestones.length !== 1 ? 's' : ''} • ${completionRate}% complete`}
            </p>
          </div>
        </div>
        {isProjectOwner && (
          <button
            className={`ms-toggle-btn ${showForm ? 'active' : ''}`}
            onClick={() => setShowForm((v) => !v)}
          >
            {showForm ? (
              <><MinusIcon /> <span>Hide Form</span></>
            ) : (
              <><PlusIcon /> <span>Add Milestone</span></>
            )}
          </button>
        )}
      </div>

      {/* Stats Cards */}
      {milestones.length > 0 && (
        <div className="ms-stats">
          <div className="ms-stat-card">
            <div className="ms-stat-value">{milestones.length}</div>
            <div className="ms-stat-label">Total Milestones</div>
          </div>
          <div className="ms-stat-card highlight">
            <div className="ms-stat-value" style={{ color: '#2DB5DA' }}>${completedAmount.toLocaleString()}</div>
            <div className="ms-stat-label">Completed Value</div>
          </div>
          <div className="ms-stat-card">
            <div className="ms-stat-value" style={{ color: '#10B981' }}>${totalAmount.toLocaleString()}</div>
            <div className="ms-stat-label">Total Value</div>
          </div>
          <div className="ms-stat-card">
            <div className="ms-stat-value">{completionRate}%</div>
            <div className="ms-stat-label">Completion Rate</div>
          </div>
        </div>
      )}

      {/* Add Milestone Form */}
      {isProjectOwner && showForm && (
        <div className="ms-form-card">
          <div className="ms-form-header">
            <h3>Create New Milestone</h3>
            <p>Define a deliverable milestone with a due date and payment amount</p>
          </div>
          <form onSubmit={handleSubmit}>
            <div className="ms-form-grid">
              <div className="ms-form-group">
                <label>Milestone Title</label>
                <input
                  className="ms-input"
                  placeholder="e.g., Initial Design Delivery"
                  value={form.title}
                  onChange={(e) => setForm((f) => ({ ...f, title: e.target.value }))}
                />
                {errors.title && <span className="ms-error">{errors.title}</span>}
              </div>
              <div className="ms-form-row">
                <div className="ms-form-group">
                  <label>Due Date</label>
                  <div className="ms-input-wrapper">
                    <CalendarIcon />
                    <input
                      type="date"
                      className="ms-input"
                      value={form.dueDate}
                      onChange={(e) => setForm((f) => ({ ...f, dueDate: e.target.value }))}
                    />
                  </div>
                  {errors.dueDate && <span className="ms-error">{errors.dueDate}</span>}
                </div>
                <div className="ms-form-group">
                  <label>Amount ($)</label>
                  <div className="ms-input-wrapper">
                    <DollarIcon />
                    <input
                      type="number"
                      min="0"
                      className="ms-input"
                      placeholder="0.00"
                      value={form.amount}
                      onChange={(e) => setForm((f) => ({ ...f, amount: e.target.value }))}
                    />
                  </div>
                  {errors.amount && <span className="ms-error">{errors.amount}</span>}
                </div>
              </div>
            </div>
            <div className="ms-form-group">
              <label>Description <span className="ms-optional">(optional)</span></label>
              <textarea
                className="ms-textarea"
                placeholder="Describe what needs to be delivered for this milestone..."
                value={form.description}
                onChange={(e) => setForm((f) => ({ ...f, description: e.target.value }))}
              />
            </div>
            {errors.submit && (
              <div className="ms-alert ms-alert-error">
                <AlertCircleIcon />
                <span>{errors.submit}</span>
              </div>
            )}
            <div className="ms-form-actions">
              <button
                type="button"
                className="ms-btn-secondary"
                onClick={() => setShowForm(false)}
              >
                Cancel
              </button>
              <button type="submit" className="ms-btn-primary">
                <CheckIcon />
                <span>Create Milestone</span>
              </button>
            </div>
          </form>
        </div>
      )}

      {/* Non-owner hint */}
      {!isProjectOwner && milestones.length > 0 && (
        <div className="ms-hint">
          <div className="ms-hint-icon">i</div>
          <span>Only the project owner can add or edit milestones.</span>
        </div>
      )}

      {/* Milestones List */}
      {milestones.length === 0 ? (
        <div className="ms-empty">
          <div className="ms-empty-icon">
            <EmptyStateIcon />
          </div>
          <h3>No milestones yet</h3>
          <p>
            {isProjectOwner
              ? 'Create milestones to break down the project into manageable deliverables with clear deadlines and payments.'
              : 'The project owner hasn\'t created any milestones yet.'}
          </p>
          {isProjectOwner && (
            <button className="ms-btn-primary" onClick={() => setShowForm(true)}>
              <PlusIcon />
              <span>Create First Milestone</span>
            </button>
          )}
        </div>
      ) : (
        <div className="ms-list">
          {milestones.map((m, index) => {
            const statusConfig = getStatusConfig(m.status);
            const dueStatus = getDueStatus(m.dueDate);

            return (
              <div key={m._id} className="ms-item">
                {/* Progress Line */}
                {index < milestones.length - 1 && (
                  <div
                    className={`ms-progress-line ${m.status === 'Completed' ? 'completed' : ''}`}
                  />
                )}

                {/* Status Indicator */}
                <div
                  className={`ms-status-indicator ${m.status.toLowerCase()}`}
                  style={{
                    background: statusConfig.bg,
                    color: statusConfig.color,
                    borderColor: statusConfig.borderColor
                  }}
                >
                  {m.status === 'Completed' ? (
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
                      <polyline points="20 6 9 17 4 12" />
                    </svg>
                  ) : m.status === 'InProgress' ? (
                    <div className="ms-pulse-dot" style={{ background: statusConfig.color }} />
                  ) : (
                    <div className="ms-dot" style={{ background: statusConfig.color }} />
                  )}
                </div>

                {/* Content */}
                <div className="ms-item-content">
                  <div className="ms-item-header">
                    <div className="ms-item-title-row">
                      <h4 className="ms-item-title">{m.title}</h4>
                      {isProjectOwner && (
                        <button
                          className="ms-delete-btn"
                          onClick={() => handleDelete(m._id)}
                          title="Delete milestone"
                        >
                          <TrashIcon />
                        </button>
                      )}
                    </div>
                    <div
                      className="ms-status-badge"
                      style={{
                        background: statusConfig.bg,
                        color: statusConfig.color,
                        borderColor: statusConfig.borderColor
                      }}
                    >
                      <span>{statusConfig.icon}</span>
                      <span>{statusConfig.label}</span>
                    </div>
                  </div>

                  {m.description && (
                    <p className="ms-item-desc">{m.description}</p>
                  )}

                  <div className="ms-item-meta">
                    <div className="ms-meta-item">
                      <CalendarIcon />
                      <span>{formatDate(m.dueDate)}</span>
                      {dueStatus && (
                        <span className={`ms-due-badge ${dueStatus.variant}`}>
                          {dueStatus.text}
                        </span>
                      )}
                    </div>
                    <div className="ms-meta-divider" />
                    <div className="ms-meta-item">
                      <DollarIcon />
                      <span className="ms-amount">${m.amount.toLocaleString()}</span>
                    </div>
                  </div>

                  {/* Owner Status Update */}
                  {isProjectOwner && (
                    <div className="ms-status-update">
                      <div className="ms-select-wrapper">
                        <select
                          className="ms-select"
                          value={statusEdits[m._id] || m.status}
                          onChange={(e) => setStatusEdits((s) => ({ ...s, [m._id]: e.target.value }))}
                        >
                          <option value="Pending">Pending</option>
                          <option value="InProgress">In Progress</option>
                          <option value="Completed">Completed</option>
                        </select>
                      </div>
                      <button
                        className="ms-btn-small"
                        onClick={() => handleStatusUpdate(m._id)}
                        disabled={(statusEdits[m._id] || m.status) === m.status}
                      >
                        Update Status
                      </button>
                    </div>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}

      <style>{`
        .ms-section {
          margin-bottom: 32px;
        }

        .ms-header {
          display: flex;
          align-items: center;
          justify-content: space-between;
          gap: 16px;
          margin-bottom: 24px;
        }

        .ms-title-group {
          display: flex;
          align-items: center;
          gap: 14px;
        }

        .ms-title-icon {
          width: 44px;
          height: 44px;
          border-radius: 12px;
          background: linear-gradient(135deg, rgba(45, 181, 218, 0.15) 0%, rgba(45, 181, 218, 0.08) 100%);
          color: #2DB5DA;
          display: flex;
          align-items: center;
          justify-content: center;
        }

        .ms-title {
          font-size: 20px;
          font-weight: 700;
          color: #0f172a;
          margin: 0 0 4px;
          letter-spacing: -0.01em;
        }

        .ms-subtitle {
          font-size: 13px;
          color: #64748b;
          margin: 0;
        }

        .ms-toggle-btn {
          display: inline-flex;
          align-items: center;
          gap: 8px;
          padding: 10px 18px;
          border-radius: 10px;
          font-size: 14px;
          font-weight: 600;
          color: #fff;
          background: linear-gradient(135deg, #2DB5DA 0%, #1a7a94 100%);
          border: none;
          cursor: pointer;
          transition: transform 0.15s, box-shadow 0.2s;
          font-family: inherit;
        }

        .ms-toggle-btn:hover {
          transform: translateY(-1px);
          box-shadow: 0 6px 20px rgba(45, 181, 218, 0.3);
        }

        .ms-toggle-btn.active {
          background: #f1f5f9;
          color: #64748b;
        }

        .ms-toggle-btn.active:hover {
          background: #e2e8f0;
          box-shadow: none;
        }

        /* Stats */
        .ms-stats {
          display: grid;
          grid-template-columns: repeat(auto-fit, minmax(140px, 1fr));
          gap: 12px;
          margin-bottom: 24px;
        }

        .ms-stat-card {
          background: #fff;
          border: 1px solid rgba(15, 23, 42, 0.07);
          border-radius: 12px;
          padding: 16px;
          text-align: center;
        }

        .ms-stat-card.highlight {
          background: linear-gradient(145deg, rgba(45, 181, 218, 0.05) 0%, #fff 100%);
          border-color: rgba(45, 181, 218, 0.15);
        }

        .ms-stat-value {
          font-size: 1.5rem;
          font-weight: 800;
          color: #0f172a;
          letter-spacing: -0.02em;
          line-height: 1.2;
        }

        .ms-stat-label {
          font-size: 11px;
          font-weight: 600;
          color: #64748b;
          text-transform: uppercase;
          letter-spacing: 0.04em;
          margin-top: 4px;
        }

        /* Form */
        .ms-form-card {
          background: #fff;
          border: 1px solid rgba(15, 23, 42, 0.07);
          border-radius: 16px;
          overflow: hidden;
          box-shadow: 0 1px 3px rgba(15, 23, 42, 0.04);
          margin-bottom: 24px;
          animation: slideDown 0.3s ease;
        }

        @keyframes slideDown {
          from {
            opacity: 0;
            transform: translateY(-10px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }

        .ms-form-header {
          padding: 20px 24px 0;
          margin-bottom: 20px;
        }

        .ms-form-header h3 {
          font-size: 16px;
          font-weight: 700;
          color: #0f172a;
          margin: 0 0 4px;
        }

        .ms-form-header p {
          font-size: 13px;
          color: #64748b;
          margin: 0;
        }

        .ms-form-card form {
          padding: 0 24px 24px;
        }

        .ms-form-grid {
          display: flex;
          flex-direction: column;
          gap: 16px;
          margin-bottom: 16px;
        }

        .ms-form-row {
          display: grid;
          grid-template-columns: 1fr 1fr;
          gap: 16px;
        }

        @media (max-width: 640px) {
          .ms-form-row {
            grid-template-columns: 1fr;
          }
        }

        .ms-form-group {
          margin-bottom: 0;
        }

        .ms-form-group label {
          display: block;
          font-size: 13px;
          font-weight: 600;
          color: #334155;
          margin-bottom: 6px;
        }

        .ms-optional {
          font-weight: 500;
          color: #94a3b8;
        }

        .ms-input,
        .ms-textarea,
        .ms-select {
          width: 100%;
          padding: 10px 14px;
          border: 1px solid rgba(15, 23, 42, 0.1);
          border-radius: 10px;
          font-size: 14px;
          font-family: inherit;
          color: #0f172a;
          background: #fff;
          transition: border-color 0.15s, box-shadow 0.15s;
          outline: none;
        }

        .ms-input:focus,
        .ms-textarea:focus,
        .ms-select:focus {
          border-color: #2DB5DA;
          box-shadow: 0 0 0 3px rgba(45, 181, 218, 0.1);
        }

        .ms-textarea {
          resize: vertical;
          min-height: 80px;
        }

        .ms-input-wrapper {
          position: relative;
        }

        .ms-input-wrapper svg {
          position: absolute;
          left: 12px;
          top: 50%;
          transform: translateY(-50%);
          width: 16px;
          height: 16px;
          color: #94a3b8;
        }

        .ms-input-wrapper .ms-input {
          padding-left: 36px;
        }

        .ms-error {
          display: block;
          font-size: 12px;
          color: #EF4444;
          margin-top: 6px;
        }

        .ms-alert {
          display: flex;
          align-items: center;
          gap: 10px;
          padding: 12px 16px;
          border-radius: 10px;
          font-size: 14px;
          margin-bottom: 16px;
        }

        .ms-alert svg {
          width: 18px;
          height: 18px;
          flex-shrink: 0;
        }

        .ms-alert-error {
          background: rgba(239, 68, 68, 0.08);
          border: 1px solid rgba(239, 68, 68, 0.15);
          color: #DC2626;
        }

        .ms-form-actions {
          display: flex;
          gap: 12px;
          justify-content: flex-end;
        }

        .ms-btn-primary {
          display: inline-flex;
          align-items: center;
          gap: 8px;
          padding: 10px 20px;
          border-radius: 10px;
          font-size: 14px;
          font-weight: 600;
          color: #fff;
          background: linear-gradient(135deg, #2DB5DA 0%, #1a7a94 100%);
          border: none;
          cursor: pointer;
          transition: transform 0.15s, box-shadow 0.2s;
          font-family: inherit;
        }

        .ms-btn-primary:hover:not(:disabled) {
          transform: translateY(-1px);
          box-shadow: 0 6px 20px rgba(45, 181, 218, 0.3);
        }

        .ms-btn-secondary {
          display: inline-flex;
          align-items: center;
          gap: 8px;
          padding: 10px 20px;
          border-radius: 10px;
          font-size: 14px;
          font-weight: 600;
          color: #64748b;
          background: #f1f5f9;
          border: 1px solid rgba(15, 23, 42, 0.08);
          cursor: pointer;
          transition: all 0.15s ease;
          font-family: inherit;
        }

        .ms-btn-secondary:hover {
          background: #e2e8f0;
          color: #334155;
        }

        /* Hint */
        .ms-hint {
          display: flex;
          align-items: center;
          gap: 12px;
          padding: 14px 18px;
          background: rgba(45, 181, 218, 0.06);
          border: 1px solid rgba(45, 181, 218, 0.12);
          border-radius: 12px;
          font-size: 14px;
          color: #475569;
          margin-bottom: 20px;
        }

        .ms-hint-icon {
          width: 22px;
          height: 22px;
          border-radius: 50%;
          background: rgba(45, 181, 218, 0.15);
          color: #2DB5DA;
          display: flex;
          align-items: center;
          justify-content: center;
          font-size: 12px;
          font-weight: 700;
          flex-shrink: 0;
        }

        /* Empty State */
        .ms-empty {
          text-align: center;
          padding: 48px 24px;
          background: #fff;
          border: 1px solid rgba(15, 23, 42, 0.07);
          border-radius: 16px;
          box-shadow: 0 1px 3px rgba(15, 23, 42, 0.04);
        }

        .ms-empty-icon {
          width: 64px;
          height: 64px;
          border-radius: 18px;
          background: linear-gradient(135deg, rgba(45, 181, 218, 0.1) 0%, rgba(45, 181, 218, 0.05) 100%);
          color: #2DB5DA;
          display: flex;
          align-items: center;
          justify-content: center;
          margin: 0 auto 16px;
        }

        .ms-empty h3 {
          font-size: 17px;
          font-weight: 700;
          color: #334155;
          margin: 0 0 8px;
        }

        .ms-empty p {
          font-size: 14px;
          color: #64748b;
          margin: 0 0 20px;
          max-width: 360px;
          line-height: 1.55;
        }

        /* Milestones List */
        .ms-list {
          display: flex;
          flex-direction: column;
          gap: 0;
          position: relative;
        }

        .ms-item {
          display: flex;
          gap: 16px;
          padding: 20px 0;
          position: relative;
          border-bottom: 1px solid rgba(15, 23, 42, 0.06);
        }

        .ms-item:last-child {
          border-bottom: none;
        }

        .ms-progress-line {
          position: absolute;
          left: 20px;
          top: 48px;
          width: 2px;
          height: calc(100% - 32px);
          background: rgba(15, 23, 42, 0.08);
        }

        .ms-progress-line.completed {
          background: linear-gradient(180deg, #10B981 0%, rgba(15, 23, 42, 0.08) 100%);
        }

        .ms-status-indicator {
          width: 40px;
          height: 40px;
          border-radius: 50%;
          border: 2px solid;
          display: flex;
          align-items: center;
          justify-content: center;
          flex-shrink: 0;
          z-index: 1;
          background: #fff;
        }

        .ms-status-indicator.inprogress {
          animation: pulse 2s ease-in-out infinite;
        }

        @keyframes pulse {
          0%, 100% { box-shadow: 0 0 0 0 rgba(45, 181, 218, 0.4); }
          50% { box-shadow: 0 0 0 6px rgba(45, 181, 218, 0); }
        }

        .ms-dot {
          width: 10px;
          height: 10px;
          border-radius: 50%;
        }

        .ms-pulse-dot {
          width: 10px;
          height: 10px;
          border-radius: 50%;
        }

        .ms-item-content {
          flex: 1;
          min-width: 0;
        }

        .ms-item-header {
          display: flex;
          align-items: flex-start;
          justify-content: space-between;
          gap: 12px;
          margin-bottom: 8px;
        }

        .ms-item-title-row {
          display: flex;
          align-items: center;
          gap: 12px;
          flex: 1;
        }

        .ms-item-title {
          font-size: 16px;
          font-weight: 700;
          color: #0f172a;
          margin: 0;
          letter-spacing: -0.01em;
        }

        .ms-delete-btn {
          width: 32px;
          height: 32px;
          border-radius: 8px;
          border: none;
          background: transparent;
          color: #94a3b8;
          cursor: pointer;
          display: flex;
          align-items: center;
          justify-content: center;
          transition: all 0.15s;
        }

        .ms-delete-btn:hover {
          background: rgba(239, 68, 68, 0.1);
          color: #EF4444;
        }

        .ms-status-badge {
          display: inline-flex;
          align-items: center;
          gap: 6px;
          padding: 5px 12px;
          border-radius: 999px;
          font-size: 12px;
          font-weight: 700;
          letter-spacing: 0.02em;
          border: 1px solid;
          flex-shrink: 0;
        }

        .ms-status-badge span:first-child {
          font-size: 10px;
        }

        .ms-item-desc {
          font-size: 14px;
          color: #64748b;
          line-height: 1.6;
          margin: 0 0 12px;
        }

        .ms-item-meta {
          display: flex;
          align-items: center;
          flex-wrap: wrap;
          gap: 8px 16px;
          margin-bottom: 12px;
        }

        .ms-meta-item {
          display: inline-flex;
          align-items: center;
          gap: 6px;
          font-size: 13px;
          color: #64748b;
        }

        .ms-meta-item svg {
          width: 14px;
          height: 14px;
          color: #94a3b8;
        }

        .ms-meta-divider {
          width: 4px;
          height: 4px;
          border-radius: 50%;
          background: #cbd5e1;
        }

        .ms-amount {
          font-weight: 700;
          color: #0f172a;
        }

        .ms-due-badge {
          display: inline-flex;
          align-items: center;
          padding: 2px 8px;
          border-radius: 999px;
          font-size: 11px;
          font-weight: 600;
          margin-left: 4px;
        }

        .ms-due-badge.success {
          background: rgba(16, 185, 129, 0.1);
          color: #10B981;
        }

        .ms-due-badge.warning {
          background: rgba(245, 158, 11, 0.1);
          color: #F59E0B;
        }

        .ms-due-badge.urgent {
          background: rgba(245, 158, 11, 0.15);
          color: #d97706;
        }

        .ms-due-badge.danger {
          background: rgba(239, 68, 68, 0.1);
          color: #EF4444;
        }

        .ms-status-update {
          display: flex;
          align-items: center;
          gap: 10px;
          margin-top: 12px;
          padding-top: 12px;
          border-top: 1px solid rgba(15, 23, 42, 0.06);
        }

        .ms-select-wrapper {
          position: relative;
        }

        .ms-select-wrapper::after {
          content: '';
          position: absolute;
          right: 12px;
          top: 50%;
          transform: translateY(-50%);
          width: 0;
          height: 0;
          border-left: 4px solid transparent;
          border-right: 4px solid transparent;
          border-top: 4px solid #64748b;
          pointer-events: none;
        }

        .ms-select {
          width: auto;
          min-width: 140px;
          padding: 8px 32px 8px 12px;
          font-size: 13px;
          appearance: none;
          cursor: pointer;
        }

        .ms-btn-small {
          display: inline-flex;
          align-items: center;
          padding: 8px 14px;
          border-radius: 8px;
          font-size: 13px;
          font-weight: 600;
          color: #2DB5DA;
          background: rgba(45, 181, 218, 0.08);
          border: 1px solid rgba(45, 181, 218, 0.15);
          cursor: pointer;
          transition: all 0.15s;
          font-family: inherit;
        }

        .ms-btn-small:hover:not(:disabled) {
          background: rgba(45, 181, 218, 0.15);
        }

        .ms-btn-small:disabled {
          opacity: 0.5;
          cursor: not-allowed;
        }

        @media (max-width: 640px) {
          .ms-header {
            flex-direction: column;
            align-items: flex-start;
            gap: 12px;
          }

          .ms-toggle-btn {
            width: 100%;
            justify-content: center;
          }

          .ms-item-header {
            flex-direction: column;
            gap: 8px;
          }

          .ms-item-meta {
            flex-direction: column;
            align-items: flex-start;
            gap: 8px;
          }

          .ms-meta-divider {
            display: none;
          }

          .ms-status-update {
            flex-direction: column;
            align-items: stretch;
          }

          .ms-select {
            width: 100%;
          }

          .ms-form-actions {
            flex-direction: column;
          }

          .ms-form-actions button {
            width: 100%;
            justify-content: center;
          }
        }
      `}</style>
    </div>
  );
}
