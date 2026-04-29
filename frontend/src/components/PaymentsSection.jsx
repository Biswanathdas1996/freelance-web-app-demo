import { useState, useEffect } from 'react';
import { getPayments, createPayment, updatePayment, getMilestones } from '../api';

function statusBadgeClass(status) {
  if (status === 'Paid') return 'badge badge-accepted';
  if (status === 'Released') return 'badge badge-open';
  return 'badge badge-pending';
}

export default function PaymentsSection({ projectId, isProjectOwner }) {
  const [payments, setPayments] = useState([]);
  const [milestones, setMilestones] = useState([]);
  const [form, setForm] = useState({
    milestoneId: '',
    amount: '',
    initiatedBy: '',
    transactionNote: '',
    transactionRef: ''
  });
  const [errors, setErrors] = useState({});
  const [showForm, setShowForm] = useState(false);
  const [statusEdits, setStatusEdits] = useState({});

  const load = async () => {
    try {
      const [pays, ms] = await Promise.all([
        getPayments({ projectId }),
        getMilestones({ projectId })
      ]);
      setPayments(pays);
      setMilestones(ms);
      if (ms.length > 0 && !form.milestoneId) {
        setForm((f) => ({ ...f, milestoneId: ms[0]._id }));
      }
    } catch (err) {
      console.error(err);
    }
  };

  useEffect(() => {
    load();
  }, [projectId]);

  const validate = () => {
    const e = {};
    if (!form.milestoneId) e.milestoneId = 'Select a milestone';
    if (form.amount === '' || Number(form.amount) < 0) e.amount = 'Valid amount required';
    if (!form.initiatedBy.trim()) e.initiatedBy = 'Required';
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
      await createPayment({ ...form, projectId, amount: Number(form.amount) });
      setForm((f) => ({
        ...f,
        amount: '',
        initiatedBy: '',
        transactionNote: '',
        transactionRef: ''
      }));
      setErrors({});
      setShowForm(false);
      load();
    } catch (err) {
      setErrors({ submit: err.response?.data?.error || 'Failed to record payment' });
    }
  };

  const handleStatusUpdate = async (paymentId) => {
    const status = statusEdits[paymentId];
    if (!status) return;
    const update = { status };
    if (status === 'Paid') update.paidDate = new Date().toISOString();
    try {
      await updatePayment(paymentId, update);
      load();
    } catch (err) {
      console.error(err);
    }
  };

  const getMilestoneTitle = (milestoneId) => {
    const m = milestones.find((x) => x._id === milestoneId);
    return m ? m.title : milestoneId;
  };

  const totalPaid = payments.filter((p) => p.status === 'Paid').reduce((sum, p) => sum + p.amount, 0);

  return (
    <div id="payments" style={{ marginBottom: 32 }}>
      <h2 className="section-heading">Payments</h2>

      {isProjectOwner && (
        <button className="toggle-btn" onClick={() => setShowForm((v) => !v)}>
          {showForm ? '- Hide Form' : '+ Record Payment'}
        </button>
      )}

      {isProjectOwner && showForm && (
        <div className="form-card">
          <form onSubmit={handleSubmit}>
            <div className="form-group">
              <label>Milestone</label>
              <select
                className="form-control"
                value={form.milestoneId}
                onChange={(e) => setForm((f) => ({ ...f, milestoneId: e.target.value }))}
              >
                <option value="">-- Select Milestone --</option>
                {milestones.map((m) => (
                  <option key={m._id} value={m._id}>
                    {m.title}
                  </option>
                ))}
              </select>
              {errors.milestoneId && <div className="error-msg">{errors.milestoneId}</div>}
            </div>
            <div className="form-row">
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
              <div className="form-group">
                <label>Initiated By</label>
                <input
                  className="form-control"
                  value={form.initiatedBy}
                  onChange={(e) => setForm((f) => ({ ...f, initiatedBy: e.target.value }))}
                />
                {errors.initiatedBy && <div className="error-msg">{errors.initiatedBy}</div>}
              </div>
            </div>
            <div className="form-row">
              <div className="form-group">
                <label>Transaction Note</label>
                <input
                  className="form-control"
                  value={form.transactionNote}
                  onChange={(e) => setForm((f) => ({ ...f, transactionNote: e.target.value }))}
                />
              </div>
              <div className="form-group">
                <label>Transaction Ref</label>
                <input
                  className="form-control"
                  value={form.transactionRef}
                  onChange={(e) => setForm((f) => ({ ...f, transactionRef: e.target.value }))}
                />
              </div>
            </div>
            {errors.submit && (
              <div className="error-msg" style={{ marginBottom: 8 }}>
                {errors.submit}
              </div>
            )}
            <button type="submit" className="btn-primary">
              Record Payment
            </button>
          </form>
        </div>
      )}

      {!isProjectOwner && payments.length > 0 && (
        <p className="info-msg" style={{ marginBottom: 12 }}>
          Only the project owner can record or change payment status.
        </p>
      )}

      {payments.length === 0 ? (
        <p className="info-msg">No payments recorded yet.</p>
      ) : (
        <>
          <table>
            <thead>
              <tr>
                <th>Milestone</th>
                <th>Amount</th>
                <th>Status</th>
                <th>Paid Date</th>
                <th>Note</th>
                <th>Ref</th>
                <th>Initiated By</th>
                <th>Update</th>
              </tr>
            </thead>
            <tbody>
              {payments.map((p) => (
                <tr key={p._id}>
                  <td>{getMilestoneTitle(p.milestoneId)}</td>
                  <td>${p.amount.toLocaleString()}</td>
                  <td>
                    <span className={statusBadgeClass(p.status)}>{p.status}</span>
                  </td>
                  <td>{p.paidDate ? new Date(p.paidDate).toLocaleDateString() : '—'}</td>
                  <td>{p.transactionNote || '—'}</td>
                  <td>{p.transactionRef || '—'}</td>
                  <td>{p.initiatedBy}</td>
                  <td>
                    {isProjectOwner ? (
                      <div style={{ display: 'flex', gap: 6, alignItems: 'center' }}>
                        <select
                          className="form-control"
                          style={{ width: 'auto', padding: '4px 8px', fontSize: 13 }}
                          value={statusEdits[p._id] || p.status}
                          onChange={(e) => setStatusEdits((s) => ({ ...s, [p._id]: e.target.value }))}
                        >
                          <option value="Pending">Pending</option>
                          <option value="Released">Released</option>
                          <option value="Paid">Paid</option>
                        </select>
                        <button
                          type="button"
                          className="btn-secondary btn-sm"
                          onClick={() => handleStatusUpdate(p._id)}
                        >
                          Save
                        </button>
                      </div>
                    ) : (
                      '—'
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          <div className="summary-box" style={{ marginTop: 16 }}>
            Total Paid: ${totalPaid.toLocaleString()}
          </div>
        </>
      )}
    </div>
  );
}
