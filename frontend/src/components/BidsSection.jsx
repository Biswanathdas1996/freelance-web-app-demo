import { useState, useEffect } from 'react';
import { getBids, createBid, acceptBid, rejectBid } from '../api';
import { useAuth } from '../context/AuthContext';

function statusBadgeClass(status) {
  if (status === 'Accepted') return 'badge badge-accepted';
  if (status === 'Rejected') return 'badge badge-rejected';
  return 'badge badge-pending';
}

export default function BidsSection({ projectId, projectStatus, isProjectOwner }) {
  const { isBidder } = useAuth();
  const [bids, setBids] = useState([]);
  const [form, setForm] = useState({ amount: '', timeline: '', proposal: '' });
  const [errors, setErrors] = useState({});
  const [showForm, setShowForm] = useState(false);

  const load = () => getBids({ projectId }).then(setBids).catch(console.error);

  useEffect(() => {
    load();
  }, [projectId]);

  const canBid = isBidder && !isProjectOwner && projectStatus === 'Open';
  const canManageBids = isProjectOwner;

  const validate = () => {
    const e = {};
    if (form.amount === '' || Number(form.amount) < 0) e.amount = 'Valid amount required';
    if (!form.timeline || Number(form.timeline) < 1) e.timeline = 'Min 1 day required';
    if (!form.proposal.trim()) e.proposal = 'Required';
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
      await createBid({
        projectId,
        amount: Number(form.amount),
        timeline: Number(form.timeline),
        proposal: form.proposal
      });
      setForm({ amount: '', timeline: '', proposal: '' });
      setErrors({});
      setShowForm(false);
      load();
    } catch (err) {
      setErrors({ submit: err.response?.data?.error || 'Failed to submit bid' });
    }
  };

  const handleAccept = async (bidId) => {
    try {
      await acceptBid(bidId);
      load();
    } catch (err) {
      console.error(err);
    }
  };

  const handleReject = async (bidId) => {
    try {
      await rejectBid(bidId);
      load();
    } catch (err) {
      console.error(err);
    }
  };

  return (
    <div id="bids" style={{ marginBottom: 32 }}>
      <h2 className="section-heading">Bids</h2>

      {canBid && (
        <>
          <button className="toggle-btn" onClick={() => setShowForm((v) => !v)}>
            {showForm ? '- Hide Form' : '+ Submit a Bid'}
          </button>
          {showForm && (
            <div className="form-card">
              <form onSubmit={handleSubmit}>
                <p className="info-msg" style={{ marginBottom: 12 }}>
                  Your profile name will be shown as the bidder.
                </p>
                <div className="form-row">
                  <div className="form-group">
                    <label>Bid Amount ($)</label>
                    <input
                      type="number"
                      min="0"
                      className="form-control"
                      value={form.amount}
                      onChange={(e) => setForm((f) => ({ ...f, amount: e.target.value }))}
                    />
                    {errors.amount && <div className="error-msg">{errors.amount}</div>}
                  </div>
                  <div className="form-group">
                    <label>Timeline (days)</label>
                    <input
                      type="number"
                      min="1"
                      className="form-control"
                      value={form.timeline}
                      onChange={(e) => setForm((f) => ({ ...f, timeline: e.target.value }))}
                    />
                    {errors.timeline && <div className="error-msg">{errors.timeline}</div>}
                  </div>
                </div>
                <div className="form-group">
                  <label>Proposal</label>
                  <textarea
                    className="form-control"
                    value={form.proposal}
                    onChange={(e) => setForm((f) => ({ ...f, proposal: e.target.value }))}
                  />
                  {errors.proposal && <div className="error-msg">{errors.proposal}</div>}
                </div>
                {errors.submit && (
                  <div className="error-msg" style={{ marginBottom: 8 }}>
                    {errors.submit}
                  </div>
                )}
                <button type="submit" className="btn-primary">
                  Submit Bid
                </button>
              </form>
            </div>
          )}
        </>
      )}

      {!canBid && isBidder && !isProjectOwner && projectStatus !== 'Open' && (
        <p className="info-msg">This project is not accepting new bids.</p>
      )}

      {bids.length === 0 ? (
        <p className="info-msg">
          {isProjectOwner ? 'No bids yet.' : isBidder ? 'You have not submitted a bid on this project (you only see your own bids here).' : 'No bids to show.'}
        </p>
      ) : (
        <table>
          <thead>
            <tr>
              <th>Freelancer</th>
              <th>Amount</th>
              <th>Timeline</th>
              <th>Proposal</th>
              <th>Status</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            {bids.map((bid) => (
              <tr key={bid._id} className={bid.status === 'Accepted' ? 'accepted-row' : ''}>
                <td>
                  <div>{bid.freelancerName}</div>
                  {bid.freelancerProfession ? (
                    <div className="bid-freelancer-title">{bid.freelancerProfession}</div>
                  ) : null}
                </td>
                <td>${bid.amount.toLocaleString()}</td>
                <td>{bid.timeline}d</td>
                <td style={{ maxWidth: 200 }}>
                  {bid.proposal.length > 80 ? bid.proposal.slice(0, 80) + '…' : bid.proposal}
                </td>
                <td>
                  <span className={statusBadgeClass(bid.status)}>{bid.status}</span>
                </td>
                <td>
                  {canManageBids && bid.status === 'Pending' && (
                    <div style={{ display: 'flex', gap: 6 }}>
                      <button type="button" className="btn-primary btn-sm" onClick={() => handleAccept(bid._id)}>
                        Accept
                      </button>
                      <button type="button" className="btn-danger btn-sm" onClick={() => handleReject(bid._id)}>
                        Reject
                      </button>
                    </div>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      )}
    </div>
  );
}
