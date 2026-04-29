import { useState, useEffect, useMemo } from 'react';
import { Link } from 'react-router-dom';
import Layout from '../components/Layout';
import { useAuth } from '../context/AuthContext';
import { getProjects, createProject } from '../api';

const STATUS_BADGE = {
  Open: 'badge-open',
  Assigned: 'badge-assigned',
  InProgress: 'badge-inprogress',
  Completed: 'badge-completed',
  Cancelled: 'badge-cancelled'
};

function posterName(project) {
  if (project.ownerId && typeof project.ownerId === 'object') {
    return project.ownerId.name || project.postedBy || '—';
  }
  return project.postedBy || '—';
}

function sortByNewest(list) {
  return [...list].sort((a, b) => {
    const ta = a.createdAt ? new Date(a.createdAt).getTime() : 0;
    const tb = b.createdAt ? new Date(b.createdAt).getTime() : 0;
    return tb - ta;
  });
}

function relativePosted(iso) {
  if (!iso) return null;
  const t = new Date(iso).getTime();
  if (Number.isNaN(t)) return null;
  const ms = Date.now() - t;
  if (ms < 60000) return 'Posted just now';
  const m = Math.floor(ms / 60000);
  if (m < 60) return `Posted ${m} min ago`;
  const h = Math.floor(m / 60);
  if (h < 24) return `Posted ${h} hr ago`;
  const d = Math.floor(h / 24);
  if (d < 14) return `Posted ${d} days ago`;
  try {
    return `Posted ${new Date(iso).toLocaleDateString(undefined, { month: 'short', day: 'numeric' })}`;
  } catch {
    return null;
  }
}

function deadlineSummary(deadline) {
  const d = new Date(deadline);
  if (Number.isNaN(d.getTime())) return { text: '—', urgent: false };
  const now = new Date();
  const dayMs = 24 * 60 * 60 * 1000;
  const days = Math.ceil((d - now) / dayMs);
  if (days < 0) return { text: `${Math.abs(days)}d overdue`, urgent: true };
  if (days === 0) return { text: 'Due today', urgent: true };
  if (days === 1) return { text: 'Due tomorrow', urgent: false };
  if (days <= 7) return { text: `${days} days left`, urgent: true };
  return { text: `${days} days left`, urgent: false };
}

function matchesFilters(project, { q, statusFilter, budgetMin, budgetMax }) {
  if (q.trim()) {
    const qq = q.trim().toLowerCase();
    const inTitle = project.title.toLowerCase().includes(qq);
    const inDesc = project.description.toLowerCase().includes(qq);
    const inSkills = (project.skills || []).some((s) => s.toLowerCase().includes(qq));
    if (!inTitle && !inDesc && !inSkills) return false;
  }
  if (statusFilter === 'open' && project.status !== 'Open') return false;
  if (statusFilter === 'active' && !['Assigned', 'InProgress'].includes(project.status))
    return false;
  if (statusFilter === 'completed' && project.status !== 'Completed') return false;
  if (statusFilter === 'cancelled' && project.status !== 'Cancelled') return false;
  const b = Number(project.budget);
  if (budgetMin !== '' && !Number.isNaN(Number(budgetMin)) && b < Number(budgetMin))
    return false;
  if (budgetMax !== '' && !Number.isNaN(Number(budgetMax)) && b > Number(budgetMax))
    return false;
  return true;
}

function applySort(list, sortBy) {
  const copy = [...list];
  switch (sortBy) {
    case 'budget-desc':
      return copy.sort((a, b) => Number(b.budget) - Number(a.budget));
    case 'budget-asc':
      return copy.sort((a, b) => Number(a.budget) - Number(b.budget));
    case 'deadline-asc':
      return copy.sort((a, b) => new Date(a.deadline) - new Date(b.deadline));
    case 'newest':
    default:
      return sortByNewest(copy);
  }
}

function SearchIcon() {
  return (
    <svg
      className="uw-search-glyph"
      width="18"
      height="18"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      aria-hidden
    >
      <circle cx="11" cy="11" r="7" />
      <path d="M20 20l-3-3" />
    </svg>
  );
}

export default function ProjectsPage() {
  const { isOwner } = useAuth();
  const [projects, setProjects] = useState([]);
  const [showForm, setShowForm] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [budgetMin, setBudgetMin] = useState('');
  const [budgetMax, setBudgetMax] = useState('');
  const [sortBy, setSortBy] = useState('newest');
  const [form, setForm] = useState({
    title: '',
    description: '',
    budget: '',
    skills: '',
    deadline: ''
  });
  const [errors, setErrors] = useState({});

  useEffect(() => {
    getProjects().then(setProjects).catch(console.error);
  }, []);

  const displayProjects = useMemo(() => {
    const filtered = projects.filter((p) =>
      matchesFilters(p, { q: searchQuery, statusFilter, budgetMin, budgetMax })
    );
    return applySort(filtered, sortBy);
  }, [projects, searchQuery, statusFilter, budgetMin, budgetMax, sortBy]);

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
      const created = await createProject({
        title: form.title,
        description: form.description,
        budget: Number(form.budget),
        skills: skillsArr,
        deadline: form.deadline
      });
      setProjects((prev) => [created, ...prev]);
      setForm({ title: '', description: '', budget: '', skills: '', deadline: '' });
      setErrors({});
      setShowForm(false);
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

  const searchBar = (
    <div className="uw-search-bar">
      <span className="uw-search-icon">
        <SearchIcon />
      </span>
      <input
        type="search"
        className="uw-search-input"
        placeholder="Search jobs, skills, or keywords"
        value={searchQuery}
        onChange={(e) => setSearchQuery(e.target.value)}
        aria-label="Search jobs"
      />
    </div>
  );

  return (
    <Layout headerSearch={searchBar}>
      <nav className="uw-breadcrumb" aria-label="Breadcrumb">
        <Link to="/">Find work</Link>
        <span aria-hidden="true"> / </span>
        <span>All jobs</span>
      </nav>

      <h1 className="uw-page-title">Browse fixed-price projects</h1>
      <p className="uw-page-sub">
        Contract-style listings with budget and deadline—similar to a talent marketplace job
        feed. Filter by status and budget, sort results, and open a job to bid or manage delivery.
      </p>

      <div className="uw-feed-layout" id="projects-list">
        <aside className="uw-sidebar">
          <div className="uw-sidebar-card">
            <h3>Filters</h3>
            <div className="uw-filter-group">
              <label htmlFor="st">Job status</label>
              <select
                id="st"
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
              >
                <option value="all">All jobs</option>
                <option value="open">Open — accepting proposals</option>
                <option value="active">In progress</option>
                <option value="completed">Completed</option>
                <option value="cancelled">Cancelled</option>
              </select>
            </div>
            <div className="uw-filter-group">
              <label>Budget (USD)</label>
              <div className="uw-filter-row">
                <input
                  type="number"
                  min="0"
                  className="form-control"
                  placeholder="Min"
                  value={budgetMin}
                  onChange={(e) => setBudgetMin(e.target.value)}
                  aria-label="Minimum budget"
                />
                <input
                  type="number"
                  min="0"
                  className="form-control"
                  placeholder="Max"
                  value={budgetMax}
                  onChange={(e) => setBudgetMax(e.target.value)}
                  aria-label="Maximum budget"
                />
              </div>
            </div>
          </div>

          {isOwner && (
            <div className="uw-sidebar-card" id="post-project">
              <h3>Client tools</h3>
              <p style={{ fontSize: 13, color: '#767676', margin: '0 0 12px', lineHeight: 1.5 }}>
                Post a fixed-scope project for freelancers to bid on.
              </p>
              <button
                type="button"
                className="btn-primary"
                style={{ width: '100%' }}
                onClick={() => setShowForm((v) => !v)}
              >
                {showForm ? 'Close form' : '+ Post a new job'}
              </button>
              {showForm && (
                <div style={{ marginTop: 16 }}>
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
                      {errors.description && (
                        <div className="error-msg">{errors.description}</div>
                      )}
                    </div>
                    <div className="form-group">
                      <label>Budget ($)</label>
                      <input
                        type="number"
                        min="0"
                        className="form-control"
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
                        placeholder="e.g. React, Node.js"
                        value={form.skills}
                        onChange={(e) => setForm((f) => ({ ...f, skills: e.target.value }))}
                      />
                      {errors.skills && <div className="error-msg">{errors.skills}</div>}
                    </div>
                    {errors.submit && (
                      <div className="error-msg" style={{ marginBottom: 8 }}>
                        {errors.submit}
                      </div>
                    )}
                    <button type="submit" className="btn-primary" style={{ width: '100%' }}>
                      Publish job
                    </button>
                  </form>
                </div>
              )}
            </div>
          )}
        </aside>

        <section aria-label="Job results">
          <div className="uw-results-header">
            <p className="uw-results-count">
              <strong>{displayProjects.length}</strong>{' '}
              {displayProjects.length === 1 ? 'job' : 'jobs'} found
              {projects.length !== displayProjects.length ? (
                <span style={{ color: '#939598', fontWeight: 400 }}>
                  {' '}
                  · filtered from {projects.length} total
                </span>
              ) : null}
            </p>
            <div className="uw-filter-group" style={{ marginBottom: 0, minWidth: 200 }}>
              <label htmlFor="sort" className="visually-hidden">
                Sort jobs
              </label>
              <select id="sort" value={sortBy} onChange={(e) => setSortBy(e.target.value)}>
                <option value="newest">Sort: Newest first</option>
                <option value="budget-desc">Sort: Budget (high to low)</option>
                <option value="budget-asc">Sort: Budget (low to high)</option>
                <option value="deadline-asc">Sort: Deadline (soonest)</option>
              </select>
            </div>
          </div>

          {!isOwner && (
            <p className="info-msg" style={{ padding: '0 0 12px', margin: 0 }}>
              You’re signed in as a bidder — open any job to submit a proposal.
            </p>
          )}

          {displayProjects.length === 0 ? (
            <div className="uw-empty-feed">
              {projects.length === 0
                ? isOwner
                  ? 'No jobs yet. Use "Post a new job" in the sidebar to publish the first listing.'
                  : 'No jobs are listed yet. Check back later.'
                : 'No jobs match your filters. Try clearing search or budget limits.'}
            </div>
          ) : (
            <div className="uw-job-list">
              {displayProjects.map((p) => {
                const posted = relativePosted(p.createdAt);
                const dl = deadlineSummary(p.deadline);
                return (
                  <article key={p._id} className="uw-job-row">
                    <div className="uw-job-main">
                      <h2 className="uw-job-title">
                        <Link to={`/projects/${p._id}`}>{p.title}</Link>
                      </h2>
                      <p className="uw-job-snippet">{p.description}</p>
                      <div className="uw-job-meta-line">
                        <span className="uw-job-type-pill">Fixed price</span>
                        <span className="uw-job-meta-dot" aria-hidden="true">
                          ·
                        </span>
                        <span className="uw-job-meta-client">
                          Client <span className="uw-job-client-name">{posterName(p)}</span>
                        </span>
                        {posted ? (
                          <>
                            <span className="uw-job-meta-dot" aria-hidden="true">
                              ·
                            </span>
                            <span>{posted}</span>
                          </>
                        ) : null}
                        <span className="uw-job-meta-dot" aria-hidden="true">
                          ·
                        </span>
                        <span>
                          <span
                            className={
                              dl.urgent ? 'deadline-hint deadline-hint--urgent' : 'deadline-hint'
                            }
                          >
                            {dl.text}
                          </span>
                        </span>
                      </div>
                      <div className="uw-job-skills">
                        {(p.skills || []).map((s, i) => (
                          <span key={i} className="uw-skill-tag">
                            {s}
                          </span>
                        ))}
                      </div>
                      <div className="uw-job-status-row">
                        <span className={`badge ${STATUS_BADGE[p.status] || 'badge-pending'}`}>
                          {p.status}
                        </span>
                      </div>
                    </div>
                    <div className="uw-job-aside">
                      <div className="uw-job-budget">
                        <span className="uw-job-budget-amount">
                          ${Number(p.budget).toLocaleString()}
                        </span>
                        <span className="uw-job-budget-label">Est. budget</span>
                      </div>
                      <Link to={`/projects/${p._id}`} className="uw-job-cta">
                        View job · Send proposal
                      </Link>
                    </div>
                  </article>
                );
              })}
            </div>
          )}
        </section>
      </div>
    </Layout>
  );
}
