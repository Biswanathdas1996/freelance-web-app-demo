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

function stageBadgeClass(stage) {
  if (stage === 'Completed') return 'badge badge-accepted';
  if (stage === 'InProgress') return 'badge badge-inprogress';
  if (stage === 'UnderReview') return 'badge badge-assigned';
  return 'badge badge-pending';
}

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
  const [editMode, setEditMode] = useState(false);
  const [editForm, setEditForm] = useState({ freelancerName: '', description: '', notes: '' });
  const [editErrors, setEditErrors] = useState({});

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
    try {
      await createAssignment({ projectId, ...createForm });
      setCreateForm({ bidId: '', freelancerName: '', description: '' });
      setCreateErrors({});
      setShowCreateForm(false);
      loadAssignment();
    } catch (err) {
      setCreateErrors({ submit: err.response?.data?.error || 'Failed to create assignment' });
    }
  };

  const handleDelete = async () => {
    if (!assignment) return;
    if (!window.confirm('Are you sure you want to delete this assignment?')) return;
    try {
      await deleteAssignment(assignment._id);
      setAssignment(null);
      setHistory([]);
      setForm({ stage: 'InProgress', comment: '', updatedBy: '' });
      setErrors({});
    } catch (err) {
      setErrors({ submit: err.response?.data?.error || 'Failed to delete assignment' });
    }
  };

  const handleEditClick = () => {
    setEditForm({
      freelancerName: assignment.freelancerName || '',
      description: assignment.description || '',
      notes: assignment.notes || ''
    });
    setEditMode(true);
    setEditErrors({});
  };

  const handleEditCancel = () => {
    setEditMode(false);
    setEditForm({ freelancerName: '', description: '', notes: '' });
    setEditErrors({});
  };

  const validateEdit = () => {
    const e = {};
    if (!editForm.freelancerName || !editForm.freelancerName.trim())
      e.freelancerName = 'Freelancer name is required';
    if (!editForm.description || !editForm.description.trim())
      e.description = 'Description is required';
    if (editForm.description && editForm.description.trim().length < 10)
      e.description = 'Description must be at least 10 characters';
    return e;
  };

  const handleEditSubmit = async (e) => {
    e.preventDefault();
    const e2 = validateEdit();
    if (Object.keys(e2).length) {
      setEditErrors(e2);
      return;
    }
    try {
      const updated = await updateAssignment(assignment._id, {
        freelancerName: editForm.freelancerName.trim(),
        description: editForm.description.trim(),
        notes: editForm.notes.trim()
      });
      setAssignment(updated);
      setEditMode(false);
      setEditForm({ freelancerName: '', description: '', notes: '' });
      setEditErrors({});
    } catch (err) {
      setEditErrors({ submit: err.response?.data?.error || 'Failed to update assignment' });
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
    try {
      await createStageProgress({ assignmentId: assignment._id, ...form });
      await updateAssignment(assignment._id, { currentStage: form.stage });
      setForm({ stage: 'InProgress', comment: '', updatedBy: '' });
      setErrors({});
      loadAssignment();
    } catch (err) {
      setErrors({ submit: err.response?.data?.error || 'Failed to update stage' });
    }
  };

  const canUpdateStage = assignment && (isProjectOwner || isBidder);
  const defaultUpdatedBy = user?.name || '';

  if (!assignment) {
    return (
      <div id="assignment" style={{ marginBottom: 32 }}>
        <h2 className="section-heading">Assignment</h2>
        {isProjectOwner && (
          <button className="toggle-btn" onClick={() => setShowCreateForm((v) => !v)}>
            {showCreateForm ? '- Hide Form' : '+ Create Assignment'}
          </button>
        )}
        {isProjectOwner && showCreateForm ? (
          <div className="form-card">
            <form onSubmit={handleCreateSubmit}>
              <div className="form-group">
                <label>Select Bid</label>
                <select
                  className="form-control"
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
                  <option value="">-- Choose a bid --</option>
                  {bids.map((bid) => (
                    <option key={bid._id} value={bid._id}>
                      {bid.freelancerName} - ${bid.amount} ({bid.status})
                    </option>
                  ))}
                </select>
                {createErrors.bidId && <div className="error-msg">{createErrors.bidId}</div>}
              </div>
              <div className="form-group">
                <label>Freelancer Name</label>
                <input
                  className="form-control"
                  value={
                    selectedBid
                      ? createForm.freelancerName || selectedBid.freelancerName
                      : createForm.freelancerName
                  }
                  onChange={(e) => setCreateForm((f) => ({ ...f, freelancerName: e.target.value }))}
                />
                {createErrors.freelancerName && (
                  <div className="error-msg">{createErrors.freelancerName}</div>
                )}
              </div>
              <div className="form-group">
                <label>Assignment Description</label>
                <textarea
                  className="form-control"
                  value={createForm.description}
                  onChange={(e) => setCreateForm((f) => ({ ...f, description: e.target.value }))}
                />
                {createErrors.description && (
                  <div className="error-msg">{createErrors.description}</div>
                )}
              </div>
              {createErrors.submit && (
                <div className="error-msg" style={{ marginBottom: 8 }}>
                  {createErrors.submit}
                </div>
              )}
              <button type="submit" className="btn-primary">
                Create Assignment
              </button>
            </form>
          </div>
        ) : (
          <p className="info-msg">
            No assignment yet — accept a bid first, or create one manually if you are the project owner.
          </p>
        )}
      </div>
    );
  }

  return (
    <div id="assignment" style={{ marginBottom: 32 }}>
      <h2 className="section-heading">Assignment</h2>
      {editMode ? (
        <div className="form-card">
          <h3 style={{ fontSize: 15, fontWeight: 600, marginBottom: 14 }}>Edit Assignment</h3>
          <form onSubmit={handleEditSubmit}>
            <div className="form-group">
              <label>Freelancer Name</label>
              <input
                className="form-control"
                value={editForm.freelancerName}
                onChange={(e) => setEditForm((f) => ({ ...f, freelancerName: e.target.value }))}
              />
              {editErrors.freelancerName && (
                <div className="error-msg">{editErrors.freelancerName}</div>
              )}
            </div>
            <div className="form-group">
              <label>Description</label>
              <textarea
                className="form-control"
                value={editForm.description}
                onChange={(e) => setEditForm((f) => ({ ...f, description: e.target.value }))}
              />
              {editErrors.description && <div className="error-msg">{editErrors.description}</div>}
            </div>
            <div className="form-group">
              <label>Notes (Optional)</label>
              <textarea
                className="form-control"
                value={editForm.notes}
                onChange={(e) => setEditForm((f) => ({ ...f, notes: e.target.value }))}
              />
            </div>
            {editErrors.submit && (
              <div className="error-msg" style={{ marginBottom: 8 }}>
                {editErrors.submit}
              </div>
            )}
            <div style={{ display: 'flex', gap: 12 }}>
              <button type="submit" className="btn-primary">
                Save Changes
              </button>
              <button type="button" className="btn-secondary" onClick={handleEditCancel}>
                Cancel
              </button>
            </div>
          </form>
        </div>
      ) : (
        <div className="card" style={{ marginBottom: 20 }}>
          <div className="meta-row">
            <div className="meta-item">
              <strong>Freelancer:</strong> {assignment.freelancerName}
            </div>
            <div className="meta-item">
              <strong>Assigned:</strong> {new Date(assignment.assignedAt).toLocaleDateString()}
            </div>
            <div className="meta-item">
              <strong>Stage:</strong>{' '}
              <span className={stageBadgeClass(assignment.currentStage)}>{assignment.currentStage}</span>
            </div>
          </div>
          <p style={{ fontSize: 14, color: '#555', marginTop: 10 }}>
            <strong>Description:</strong> {assignment.description}
          </p>
          {assignment.notes && (
            <p style={{ fontSize: 14, color: '#555' }}>
              <strong>Notes:</strong> {assignment.notes}
            </p>
          )}
          {isProjectOwner && (
            <div style={{ marginTop: 12, display: 'flex', gap: 12 }}>
              <button type="button" className="btn-primary btn-sm" onClick={handleEditClick}>
                Edit Assignment
              </button>
              <button type="button" className="btn-danger btn-sm" onClick={handleDelete}>
                Delete Assignment
              </button>
            </div>
          )}
        </div>
      )}

      {canUpdateStage && (
        <div className="form-card">
          <h3 style={{ fontSize: 15, fontWeight: 600, marginBottom: 14 }}>Update Stage</h3>
          <form onSubmit={handleSubmit}>
            <div className="form-group">
              <label>Stage</label>
              <select
                className="form-control"
                value={form.stage}
                onChange={(e) => setForm((f) => ({ ...f, stage: e.target.value }))}
              >
                {STAGES.map((s) => (
                  <option key={s} value={s}>
                    {s}
                  </option>
                ))}
              </select>
              {errors.stage && <div className="error-msg">{errors.stage}</div>}
            </div>
            <div className="form-group">
              <label>Comment</label>
              <textarea
                className="form-control"
                value={form.comment}
                onChange={(e) => setForm((f) => ({ ...f, comment: e.target.value }))}
              />
              {errors.comment && <div className="error-msg">{errors.comment}</div>}
            </div>
            <div className="form-group">
              <label>Updated By</label>
              <input
                className="form-control"
                value={form.updatedBy}
                placeholder={defaultUpdatedBy}
                onChange={(e) => setForm((f) => ({ ...f, updatedBy: e.target.value }))}
              />
              {errors.updatedBy && <div className="error-msg">{errors.updatedBy}</div>}
            </div>
            {errors.submit && <div className="error-msg" style={{ marginBottom: 8 }}>{errors.submit}</div>}
            <button type="submit" className="btn-primary">
              Update Stage
            </button>
          </form>
        </div>
      )}

      {!canUpdateStage && (
        <p className="info-msg" style={{ marginBottom: 20 }}>
          Sign in as the project owner or the assigned bidder to post stage updates.
        </p>
      )}

      <div className="stage-history">
        <h3 style={{ fontSize: 15, fontWeight: 600, marginBottom: 10 }}>Stage History</h3>
        {history.length === 0 ? (
          <p className="info-msg">No stage updates yet.</p>
        ) : (
          history.map((entry) => (
            <div key={entry._id} className="stage-history-item">
              <div style={{ display: 'flex', gap: 12, alignItems: 'center', marginBottom: 4 }}>
                <span className={stageBadgeClass(entry.stage)}>{entry.stage}</span>
                <span style={{ fontSize: 12, color: '#939598' }}>
                  {new Date(entry.updatedAt).toLocaleString()}
                </span>
                <span style={{ fontSize: 13, color: '#555' }}>
                  by <strong>{entry.updatedBy}</strong>
                </span>
              </div>
              <p style={{ fontSize: 14, color: '#333', margin: 0 }}>{entry.comment}</p>
            </div>
          ))
        )}
      </div>
    </div>
  );
}
