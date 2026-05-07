import { useState, useEffect, useMemo } from 'react';
import { Link } from 'react-router-dom';
import Layout from '../components/Layout';
import { useAuth } from '../context/AuthContext';
import { getProjects } from '../api';

const STATUS_CONFIG = {
  Open: { bg: 'rgba(45, 181, 218, 0.12)', color: '#2DB5DA', label: 'Open' },
  Assigned: { bg: 'rgba(236, 72, 153, 0.12)', color: '#EC4899', label: 'Assigned' },
  InProgress: { bg: 'rgba(16, 185, 129, 0.12)', color: '#10B981', label: 'In Progress' },
  Completed: { bg: 'rgba(139, 92, 246, 0.12)', color: '#8B5CF6', label: 'Completed' },
  Cancelled: { bg: 'rgba(239, 68, 68, 0.12)', color: '#EF4444', label: 'Cancelled' }
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
  if (ms < 60000) return 'just now';
  const m = Math.floor(ms / 60000);
  if (m < 60) return `${m}m ago`;
  const h = Math.floor(m / 60);
  if (h < 24) return `${h}h ago`;
  const d = Math.floor(h / 24);
  if (d < 14) return `${d}d ago`;
  try {
    return new Date(iso).toLocaleDateString(undefined, { month: 'short', day: 'numeric' });
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
  if (days <= 7) return { text: `${days}d left`, urgent: true };
  return { text: `${days}d left`, urgent: false };
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

const SearchIcon = () => (
  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" aria-hidden>
    <circle cx="11" cy="11" r="7" />
    <path d="M20 20l-3-3" />
  </svg>
);

const FilterIcon = () => (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" aria-hidden>
    <polygon points="22 3 2 3 10 12.46 10 19 14 21 14 12.46 22 3" />
  </svg>
);

const BriefcaseIcon = () => (
  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" aria-hidden>
    <rect x="2" y="7" width="20" height="14" rx="2" ry="2" />
    <path d="M16 21V5a2 2 0 0 0-2-2h-4a2 2 0 0 0-2 2v16" />
  </svg>
);

const ClockIcon = () => (
  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" aria-hidden>
    <circle cx="12" cy="12" r="10" />
    <polyline points="12 6 12 12 16 14" />
  </svg>
);

const UserIcon = () => (
  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" aria-hidden>
    <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" />
    <circle cx="12" cy="7" r="4" />
  </svg>
);

const ArrowRightIcon = () => (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" aria-hidden>
    <path d="M5 12h14" />
    <path d="M12 5l7 7-7 7" />
  </svg>
);

const SparkleIcon = () => (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" aria-hidden>
    <path d="M12 2l1.5 4.5L18 8l-4.5 1.5L12 14l-1.5-4.5L6 8l4.5-1.5z" />
    <path d="M5 16l1 3 3 1-3 1-1 3-1-3-3-1 3-1z" />
  </svg>
);

export default function ProjectsPage() {
  const { isOwner } = useAuth();
  const [projects, setProjects] = useState([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [budgetMin, setBudgetMin] = useState('');
  const [budgetMax, setBudgetMax] = useState('');
  const [sortBy, setSortBy] = useState('newest');
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);

  useEffect(() => {
    getProjects().then(setProjects).catch(console.error);
  }, []);

  const displayProjects = useMemo(() => {
    const filtered = projects.filter((p) =>
      matchesFilters(p, { q: searchQuery, statusFilter, budgetMin, budgetMax })
    );
    return applySort(filtered, sortBy);
  }, [projects, searchQuery, statusFilter, budgetMin, budgetMax, sortBy]);

  const stats = useMemo(() => {
    const total = projects.length;
    const open = projects.filter(p => p.status === 'Open').length;
    const active = projects.filter(p => ['Assigned', 'InProgress'].includes(p.status)).length;
    const totalBudget = projects.reduce((sum, p) => sum + Number(p.budget || 0), 0);
    return { total, open, active, totalBudget };
  }, [projects]);

  const searchBar = (
    <div className="uw-search-bar">
      <span className="uw-search-icon"><SearchIcon /></span>
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

  const statusBreakdown = [
    { key: 'Open', label: 'Open', count: stats.open },
    { key: 'active', label: 'Active', count: stats.active },
    { key: 'completed', label: 'Done', count: projects.filter(p => p.status === 'Completed').length },
  ];

  return (
    <Layout headerSearch={searchBar}>
      {/* Hero Banner */}
      <div className="projects-hero-modern">
        <div className="projects-hero-gradient" />
        <div className="projects-hero-content">
          <div className="projects-hero-badge">
            <SparkleIcon />
            <span>Discover Opportunities</span>
          </div>
          <h1 className="projects-hero-title">
            Browse <span className="gradient-text">Projects</span>
          </h1>
          <p className="projects-hero-sub">
            Fixed-price listings with clear budgets and deadlines. Filter, sort, and find your next project.
          </p>
          <div className="projects-hero-actions">
            {isOwner && (
              <Link to="/post-job" className="btn-hero-solid">
                <BriefcaseIcon />
                Post a new job
              </Link>
            )}
          </div>
        </div>
        <div className="projects-hero-stats">
          <div className="hero-stat">
            <div className="hero-stat-value">{stats.total}</div>
            <div className="hero-stat-label">Total Projects</div>
          </div>
          <div className="hero-stat">
            <div className="hero-stat-value">{stats.open}</div>
            <div className="hero-stat-label">Open for Bids</div>
          </div>
          <div className="hero-stat">
            <div className="hero-stat-value">${(stats.totalBudget / 1000).toFixed(0)}K</div>
            <div className="hero-stat-label">Total Value</div>
          </div>
        </div>
      </div>

      {/* Status Filter Pills */}
      <div className="status-pills-row">
        <button
          className={`status-pill ${statusFilter === 'all' ? 'active' : ''}`}
          onClick={() => setStatusFilter('all')}
        >
          All jobs
          <span className="pill-count">{stats.total}</span>
        </button>
        {statusBreakdown.map(s => (
          <button
            key={s.key}
            className={`status-pill ${statusFilter === s.key ? 'active' : ''}`}
            onClick={() => setStatusFilter(s.key)}
          >
            {s.label}
            <span className="pill-count">{s.count}</span>
          </button>
        ))}
      </div>

      <div className="uw-feed-layout" id="projects-list">
        {/* Sidebar */}
        <aside className="uw-sidebar">
          <div className="uw-sidebar-card-modern">
            <div className="sidebar-header">
              <FilterIcon />
              <h3>Filters</h3>
            </div>
            <div className="uw-filter-group">
              <label htmlFor="st">Job status</label>
              <select
                id="st"
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
                className="modern-select"
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
                  className="modern-input"
                  placeholder="Min"
                  value={budgetMin}
                  onChange={(e) => setBudgetMin(e.target.value)}
                  aria-label="Minimum budget"
                />
                <input
                  type="number"
                  min="0"
                  className="modern-input"
                  placeholder="Max"
                  value={budgetMax}
                  onChange={(e) => setBudgetMax(e.target.value)}
                  aria-label="Maximum budget"
                />
              </div>
            </div>
          </div>

          {isOwner && (
            <div className="uw-sidebar-card-modern sidebar-cta">
              <div className="sidebar-cta-icon">
                <BriefcaseIcon />
              </div>
              <h3>Post a Project</h3>
              <p>Publish a fixed-scope project and receive proposals from skilled freelancers.</p>
              <Link to="/post-job" className="sidebar-cta-btn">
                + Post a new job
              </Link>
            </div>
          )}
        </aside>

        {/* Results */}
        <section aria-label="Job results">
          <div className="uw-results-header">
            <p className="uw-results-count">
              <strong>{displayProjects.length}</strong>{' '}
              {displayProjects.length === 1 ? 'job' : 'jobs'} found
              {projects.length !== displayProjects.length ? (
                <span className="results-filtered-hint">
                  {' · filtered from '}{projects.length}
                </span>
              ) : null}
            </p>
            <div className="sort-wrapper">
              <label htmlFor="sort" className="visually-hidden">Sort jobs</label>
              <select id="sort" value={sortBy} onChange={(e) => setSortBy(e.target.value)} className="modern-select sort-select">
                <option value="newest">Newest first</option>
                <option value="budget-desc">Budget: high to low</option>
                <option value="budget-asc">Budget: low to high</option>
                <option value="deadline-asc">Deadline: soonest</option>
              </select>
            </div>
          </div>

          {!isOwner && (
            <p className="info-msg-modern">
              You are signed in as a bidder — open any job to submit a proposal.
            </p>
          )}

          {displayProjects.length === 0 ? (
            <div className="uw-empty-feed-modern">
              <div className="empty-icon">
                <BriefcaseIcon />
              </div>
              <h3>No jobs found</h3>
              <p>
                {projects.length === 0
                  ? isOwner
                    ? 'No jobs yet. Visit the Post a job page to publish the first listing.'
                    : 'No jobs are listed yet. Check back later.'
                  : 'No jobs match your filters. Try clearing search or budget limits.'}
              </p>
              {projects.length !== displayProjects.length && (
                <button
                  className="clear-filters-btn"
                  onClick={() => { setSearchQuery(''); setStatusFilter('all'); setBudgetMin(''); setBudgetMax(''); }}
                >
                  Clear all filters
                </button>
              )}
            </div>
          ) : (
            <div className="uw-job-list-modern">
              {displayProjects.map((p, idx) => {
                const posted = relativePosted(p.createdAt);
                const dl = deadlineSummary(p.deadline);
                const statusCfg = STATUS_CONFIG[p.status] || STATUS_CONFIG.Open;
                return (
                  <article key={p._id} className="uw-job-card-modern" style={{ animationDelay: `${idx * 0.05}s` }}>
                    <div className="job-card-accent" style={{ background: statusCfg.color }} />
                    <div className="job-card-content">
                      <div className="job-card-main">
                        <div className="job-card-header">
                          <h2 className="job-card-title">
                            <Link to={`/projects/${p._id}`}>{p.title}</Link>
                          </h2>
                          <div className="job-card-budget-mobile">
                            <span className="budget-amount">${Number(p.budget).toLocaleString()}</span>
                          </div>
                        </div>
                        <p className="job-card-desc">{p.description}</p>
                        <div className="job-card-meta">
                          <span className="meta-type">Fixed price</span>
                          <span className="meta-dot">·</span>
                          <span className="meta-item">
                            <UserIcon />
                            {posterName(p)}
                          </span>
                          {posted && (
                            <>
                              <span className="meta-dot">·</span>
                              <span className="meta-item">
                                <ClockIcon />
                                {posted}
                              </span>
                            </>
                          )}
                          <span className="meta-dot">·</span>
                          <span className={`meta-deadline ${dl.urgent ? 'urgent' : ''}`}>
                            {dl.text}
                          </span>
                        </div>
                        <div className="job-card-skills">
                          {(p.skills || []).slice(0, 6).map((s, i) => (
                            <span key={i} className="skill-chip">{s}</span>
                          ))}
                          {(p.skills || []).length > 6 && (
                            <span className="skill-chip more">+{(p.skills || []).length - 6}</span>
                          )}
                        </div>
                        <div className="job-card-footer">
                          <span
                            className="status-badge"
                            style={{ background: statusCfg.bg, color: statusCfg.color }}
                          >
                            {statusCfg.label}
                          </span>
                        </div>
                      </div>
                      <div className="job-card-aside">
                        <div className="job-card-budget">
                          <span className="budget-amount">${Number(p.budget).toLocaleString()}</span>
                          <span className="budget-label">Est. budget</span>
                        </div>
                        <Link to={`/projects/${p._id}`} className="job-card-cta">
                          View job <ArrowRightIcon />
                        </Link>
                      </div>
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
