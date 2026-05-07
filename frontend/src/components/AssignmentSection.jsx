import { useState, useEffect, useCallback } from 'react';
import {
  getAssignments,
  createAssignment,
  updateAssignment,
  deleteAssignment,
  createStageProgress,
  getStageProgress,
  getBids
} from '../api.js';
import { useAuth } from '../context/AuthContext';

const STAGES = ['NotStarted', 'InProgress', 'UnderReview', 'Completed'];

const STAGE_CONFIG = {
  NotStarted: { color: '#64748B', bg: 'rgba(100, 116, 139, 0.1)', border: 'rgba(100, 116, 139, 0.2)', icon: '○' },
  InProgress: { color: '#2DB5DA', bg: 'rgba(45, 181, 218, 0.1)', border: 'rgba(45, 181, 218, 0.25)', icon: '▶' },
  UnderReview: { color: '#8B5CF6', bg: 'rgba(139, 92, 246, 0.1)', border: 'rgba(139, 92, 246, 0.25)', icon: '◉' },
  Completed: { color: '#10B981', bg: 'rgba(16, 185, 129, 0.1)', border: 'rgba(16, 185, 129, 0.25)', icon: '✓' }
};

const ChevronDownIcon = () => (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
    <polyline points="6 9 12 15 18 9" />
  </svg>
);

const ChevronUpIcon = () => (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
    <polyline points="18 15 12 9 6 15" />
  </svg>
);

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

const UserIcon = () => (
  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
    <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" />
    <circle cx="12" cy="7" r="4" />
  </svg>
);

const CalendarIcon = () => (
  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
    <rect x="3" y="4" width="18" height="18" rx="2" ry="2" />
    <line x1="16" y1="2" x2="16" y2="6" />
    <line x1="8" y1="2" x2="8" y2="6" />
    <line x1="3" y1="10" x2="21" y2="10" />
  </svg>
);

const FileTextIcon = () => (
  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
    <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
    <polyline points="14 2 14 8 20 8" />
    <line x1="16" y1="13" x2="8" y2="13" />
    <line x1="16" y1="17" x2="8" y2="17" />
    <polyline points="10 9 9 9 8 9" />
  </svg>
);

const TrashIcon = () => (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
    <polyline points="3 6 5 6 21 6" />
    <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2" />
  </svg>
);

const ClockIcon = () => (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
    <circle cx="12" cy="12" r="10" />
    <polyline points="12 6 12 12 16 14" />
  </svg>
);

const MessageIcon = () => (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
    <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z" />
  </svg>
);

const PersonIcon = () => (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
    <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" />
    <circle cx="12" cy="7" r="4" />
  </svg>
);

export default function AssignmentSection({ projectId, isProjectOwner }) {
  const { isBidder, user } = useAuth();
  const [assignment, setAssignment] = useState(null);
  const [history, setHistory] = useState([]);
  const [bids, setBids] = useState([]);
  const [form, setForm] = useState({ stage: 'InProgress', comment: '', updatedBy: '' });
  const [createForm, setCreateForm] = useState({ bidId: '', freelancerName: '', description: '' });
  const [errors, setErrors] = useState({});
  const [createErrors, setCreateErrors] = useState({});
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  const loadAssignment = useCallback(async () => {
    try {
      const list = await getAssignments({ projectId });
      if (list.length > 0) {
        setAssignment(list[0]);
        const prog = await getStageProgress({ assignmentId: list[0]._id });
        setHistory(prog);
      } else {
        setAssignment(null);
        setHistory([]);
      }
    } catch (err) {
      console.error(err);
    }
  }, [projectId]);

  const loadBids = useCallback(async () => {
    try {
      const bidList = await getBids({ projectId });
      setBids(bidList);
    } catch (err) {
      console.error(err);
    }
  }, [projectId]);

  useEffect(() => {
    loadAssignment();
    loadBids();
  }, [loadAssignment, loadBids]);

  const selectedBid = bids.find((bid) => bid._id === createForm.bidId);

  const validateCreate = () => {
    const e = {};
    if (!createForm.bidId || createForm.bidId === '') e.bidId = 'Please select a bid';
    if (!createForm.freelancerName || !createForm.freelancerName.trim())
      e.freelancerName = 'Freelancer name is required';
    if (!createForm.description || !createForm.description.trim())
      e.description = 'Description is required';
    if (createForm.description && createForm.description.trim().length < 10)
      e.description = 'Description must be at least 10 characters';
    return e;
  };

  const handleCreateSubmit = async (e) => {
    e.preventDefault();
    const e2 = validateCreate();
    if (Object.keys(e2).length) {
      setCreateErrors(e2);
      return;
    }
    setIsLoading(true);
    try {
      await createAssignment({ projectId, ...createForm });
      setCreateForm({ bidId: '', freelancerName: '', description: '' });
      setCreateErrors({});
      setShowCreateForm(false);
      loadAssignment();
    } catch (err) {
      setCreateErrors({ submit: err.response?.data?.error || 'Failed to create assignment' });
    } finally {
      setIsLoading(false);
    }
  };

  const handleDelete = async () => {
    if (!assignment) return;
    if (!window.confirm('Are you sure you want to delete this assignment?')) return;
    setIsLoading(true);
    try {
      await deleteAssignment(assignment._id);
      setAssignment(null);
      setHistory([]);
      setForm({ stage: 'InProgress', comment: '', updatedBy: '' });
      setErrors({});
    } catch (err) {
      setErrors({ submit: err.response?.data?.error || 'Failed to delete assignment' });
    } finally {
      setIsLoading(false);
    }
  };

  const validate = () => {
    const e = {};
    if (!form.stage) e.stage = 'Required';
    if (!form.comment.trim()) e.comment = 'Required';
    if (!form.updatedBy.trim()) e.updatedBy = 'Required';
    return e;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    const e2 = validate();
    if (Object.keys(e2).length) {
      setErrors(e2);
      return;
    }
    setIsLoading(true);
    try {
      await createStageProgress({ assignmentId: assignment._id, ...form });
      await updateAssignment(assignment._id, { currentStage: form.stage });
      setForm({ stage: 'InProgress', comment: '', updatedBy: '' });
      setErrors({});
      loadAssignment();
    } catch (err) {
      setErrors({ submit: err.response?.data?.error || 'Failed to update stage' });
    } finally {
      setIsLoading(false);
    }
  };

  const canUpdateStage = assignment && (isProjectOwner || isBidder);
  const defaultUpdatedBy = user?.name || '';

  const getStageConfig = (stage) => STAGE_CONFIG[stage] || STAGE_CONFIG.NotStarted;

  // Empty state - no assignment
  if (!assignment) {
    return (
      <div className="assign-section">
        <div className="assign-section-header">
          <div className="assign-section-title">
            <div className="assign-section-icon">
              <UserIcon />
            </div>
            <h2>Assignment</h2>
          </div>
          {isProjectOwner && (
            <button
              className={`assign-toggle-btn ${showCreateForm ? 'active' : ''}`}
              onClick={() => setShowCreateForm((v) => !v)}
            >
              {showCreateForm ? (
                <>
                  <MinusIcon />
                  <span>Hide Form</span>
                </>
              ) : (
                <>
                  <PlusIcon />
                  <span>Create Assignment</span>
                </>
              )}
            </button>
          )}
        </div>

        {isProjectOwner && showCreateForm ? (
          <div className="assign-card">
            <div className="assign-card-header">
              <h3>Create New Assignment</h3>
              <p>Select a bid and define the assignment details</p>
            </div>
            <form onSubmit={handleCreateSubmit} className="assign-form">
              <div className="assign-form-grid">
                <div className="assign-form-group">
                  <label>Select Bid</label>
                  <div className="assign-select-wrapper">
                    <select
                      className="assign-select"
                      value={createForm.bidId}
                      onChange={(e) => {
                        const bid = bids.find((b) => b._id === e.target.value);
                        setCreateForm((f) => ({
                          ...f,
                          bidId: e.target.value,
                          freelancerName: bid ? bid.freelancerName : f.freelancerName
                        }));
                      }}
                    >
                      <option value="">Choose a bid...</option>
                      {bids.map((bid) => (
                        <option key={bid._id} value={bid._id}>
                          {bid.freelancerName} - ${bid.amount} ({bid.status})
                        </option>
                      ))}
                    </select>
                    <ChevronDownIcon />
                  </div>
                  {createErrors.bidId && <span className="assign-error">{createErrors.bidId}</span>}
                </div>

                <div className="assign-form-group">
                  <label>Freelancer Name</label>
                  <input
                    type="text"
                    className="assign-input"
                    placeholder="Enter freelancer name"
                    value={
                      selectedBid
                        ? createForm.freelancerName || selectedBid.freelancerName
                        : createForm.freelancerName
                    }
                    onChange={(e) => setCreateForm((f) => ({ ...f, freelancerName: e.target.value }))}
                  />
                  {createErrors.freelancerName && (
                    <span className="assign-error">{createErrors.freelancerName}</span>
                  )}
                </div>
              </div>

              <div className="assign-form-group">
                <label>Assignment Description</label>
                <textarea
                  className="assign-textarea"
                  placeholder="Describe the work to be done..."
                  rows={4}
                  value={createForm.description}
                  onChange={(e) => setCreateForm((f) => ({ ...f, description: e.target.value }))}
                />
                {createErrors.description && (
                  <span className="assign-error">{createErrors.description}</span>
                )}
              </div>

              {createErrors.submit && (
                <div className="assign-alert assign-alert-error">{createErrors.submit}</div>
              )}

              <div className="assign-form-actions">
                <button type="button" className="assign-btn-secondary" onClick={() => setShowCreateForm(false)}>
                  Cancel
                </button>
                <button type="submit" className="assign-btn-primary" disabled={isLoading}>
                  {isLoading ? 'Creating...' : 'Create Assignment'}
                </button>
              </div>
            </form>
          </div>
        ) : (
          <div className="assign-empty">
            <div className="assign-empty-icon">
              <UserIcon />
            </div>
            <h3>No Assignment Yet</h3>
            <p>
              Accept a bid first, or create one manually if you are the project owner.
            </p>
          </div>
        )}
      </div>
    );
  }

  const currentStageConfig = getStageConfig(assignment.currentStage);

  return (
    <div className="assign-section">
      <div className="assign-section-header">
        <div className="assign-section-title">
          <div className="assign-section-icon">
            <UserIcon />
          </div>
          <h2>Assignment</h2>
        </div>
        {isProjectOwner && (
          <button className="assign-btn-danger" onClick={handleDelete} disabled={isLoading}>
            <TrashIcon />
            <span>Delete</span>
          </button>
        )}
      </div>

      {/* Assignment Info Card */}
      <div className="assign-info-card">
        <div className="assign-info-header">
          <div className="assign-info-avatar">
            {assignment.freelancerName.charAt(0).toUpperCase()}
          </div>
          <div className="assign-info-main">
            <h3>{assignment.freelancerName}</h3>
            <span
              className="assign-stage-badge"
              style={{
                color: currentStageConfig.color,
                background: currentStageConfig.bg,
                borderColor: currentStageConfig.border
              }}
            >
              <span>{currentStageConfig.icon}</span>
              {assignment.currentStage}
            </span>
          </div>
        </div>

        <div className="assign-info-meta">
          <div className="assign-info-item">
            <CalendarIcon />
            <span>Assigned {new Date(assignment.assignedAt).toLocaleDateString(undefined, {
              month: 'short',
              day: 'numeric',
              year: 'numeric'
            })}</span>
          </div>
        </div>

        <div className="assign-info-desc">
          <FileTextIcon />
          <p>{assignment.description}</p>
        </div>

        {assignment.notes && (
          <div className="assign-info-notes">
            <MessageIcon />
            <p>{assignment.notes}</p>
          </div>
        )}
      </div>

      {/* Stage Update Form */}
      {canUpdateStage && (
        <div className="assign-card">
          <div className="assign-card-header compact">
            <h3>Update Stage</h3>
            <p>Track progress by updating the current stage</p>
          </div>
          <form onSubmit={handleSubmit} className="assign-form">
            <div className="assign-form-grid">
              <div className="assign-form-group">
                <label>New Stage</label>
                <div className="assign-select-wrapper">
                  <select
                    className="assign-select"
                    value={form.stage}
                    onChange={(e) => setForm((f) => ({ ...f, stage: e.target.value }))}
                  >
                    {STAGES.map((s) => {
                      const cfg = getStageConfig(s);
                      return (
                        <option key={s} value={s}>
                          {cfg.icon} {s}
                        </option>
                      );
                    })}
                  </select>
                  <ChevronDownIcon />
                </div>
                {errors.stage && <span className="assign-error">{errors.stage}</span>}
              </div>

              <div className="assign-form-group">
                <label>Updated By</label>
                <div className="assign-input-wrapper">
                  <PersonIcon />
                  <input
                    type="text"
                    className="assign-input"
                    placeholder={defaultUpdatedBy}
                    value={form.updatedBy}
                    onChange={(e) => setForm((f) => ({ ...f, updatedBy: e.target.value }))}
                  />
                </div>
                {errors.updatedBy && <span className="assign-error">{errors.updatedBy}</span>}
              </div>
            </div>

            <div className="assign-form-group">
              <label>Comment</label>
              <textarea
                className="assign-textarea"
                placeholder="Add a comment about this stage update..."
                rows={3}
                value={form.comment}
                onChange={(e) => setForm((f) => ({ ...f, comment: e.target.value }))}
              />
              {errors.comment && <span className="assign-error">{errors.comment}</span>}
            </div>

            {errors.submit && <div className="assign-alert assign-alert-error">{errors.submit}</div>}

            <div className="assign-form-actions">
              <button type="submit" className="assign-btn-primary" disabled={isLoading}>
                {isLoading ? 'Updating...' : 'Update Stage'}
              </button>
            </div>
          </form>
        </div>
      )}

      {!canUpdateStage && (
        <div className="assign-hint">
          <span className="assign-hint-icon">ℹ</span>
          Sign in as the project owner or the assigned bidder to post stage updates.
        </div>
      )}

      {/* Stage History */}
      <div className="assign-history">
        <h3 className="assign-history-title">
          <ClockIcon />
          Stage History
          <span className="assign-history-count">{history.length}</span>
        </h3>

        {history.length === 0 ? (
          <div className="assign-history-empty">
            No stage updates yet. Updates will appear here when you track progress.
          </div>
        ) : (
          <div className="assign-history-list">
            {history.map((entry, index) => {
              const entryConfig = getStageConfig(entry.stage);
              return (
                <div
                  key={entry._id}
                  className="assign-history-item"
                  style={{ animationDelay: `${index * 0.05}s` }}
                >
                  <div className="assign-history-timeline">
                    <div
                      className="assign-history-dot"
                      style={{ background: entryConfig.color }}
                    />
                    {index !== history.length - 1 && <div className="assign-history-line" />}
                  </div>
                  <div className="assign-history-content">
                    <div className="assign-history-header">
                      <span
                        className="assign-stage-badge small"
                        style={{
                          color: entryConfig.color,
                          background: entryConfig.bg,
                          borderColor: entryConfig.border
                        }}
                      >
                        <span>{entryConfig.icon}</span>
                        {entry.stage}
                      </span>
                      <span className="assign-history-time">
                        {new Date(entry.updatedAt).toLocaleDateString(undefined, {
                          month: 'short',
                          day: 'numeric'
                        })}
                        {' · '}
                        {new Date(entry.updatedAt).toLocaleTimeString(undefined, {
                          hour: '2-digit',
                          minute: '2-digit'
                        })}
                      </span>
                    </div>
                    <p className="assign-history-comment">{entry.comment}</p>
                    <span className="assign-history-author">by {entry.updatedBy}</span>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
