import { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import Layout from '../components/Layout';
import BidsSection from '../components/BidsSection';
import AssignmentSection from '../components/AssignmentSection';
import MilestonesSection from '../components/MilestonesSection';
import PaymentsSection from '../components/PaymentsSection';
import { useAuth } from '../context/AuthContext';
import { getProject } from '../api';

const STATUS_CONFIG = {
  Open: { bg: 'rgba(45, 181, 218, 0.12)', color: '#2DB5DA', label: 'Open', icon: 'O' },
  Assigned: { bg: 'rgba(236, 72, 153, 0.12)', color: '#EC4899', label: 'Assigned', icon: 'A' },
  InProgress: { bg: 'rgba(16, 185, 129, 0.12)', color: '#10B981', label: 'In Progress', icon: 'P' },
  Completed: { bg: 'rgba(139, 92, 246, 0.12)', color: '#8B5CF6', label: 'Completed', icon: 'C' },
  Cancelled: { bg: 'rgba(239, 68, 68, 0.12)', color: '#EF4444', label: 'Cancelled', icon: 'X' }
};

const ArrowLeftIcon = () => (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M19 12H5M12 19l-7-7 7-7"/>
  </svg>
);

const CalendarIcon = () => (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
    <rect x="3" y="4" width="18" height="18" rx="2" ry="2"/>
    <line x1="16" y1="2" x2="16" y2="6"/>
    <line x1="8" y1="2" x2="8" y2="6"/>
    <line x1="3" y1="10" x2="21" y2="10"/>
  </svg>
);

const DollarIcon = () => (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
    <line x1="12" y1="1" x2="12" y2="23"/>
    <path d="M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6"/>
  </svg>
);

const UserIcon = () => (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
    <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/>
    <circle cx="12" cy="7" r="4"/>
  </svg>
);

const MailIcon = () => (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
    <path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z"/>
    <polyline points="22,6 12,13 2,6"/>
  </svg>
);

const ClockIcon = () => (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
    <circle cx="12" cy="12" r="10"/>
    <polyline points="12 6 12 12 16 14"/>
  </svg>
);

const EditIcon = () => (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
    <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/>
    <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"/>
  </svg>
);

function resolveOwnerId(ownerId) {
  if (!ownerId) return null;
  if (typeof ownerId === 'object' && ownerId !== null) {
    return ownerId._id ?? ownerId.id ?? null;
  }
  return ownerId;
}

function posterName(project) {
  if (project.ownerId && typeof project.ownerId === 'object') {
    return project.ownerId.name || project.postedBy || '—';
  }
  return project.postedBy || '—';
}

function ownerEmail(project) {
  if (project.ownerId && typeof project.ownerId === 'object' && project.ownerId.email) {
    return project.ownerId.email;
  }
  return '—';
}

function formatDate(iso) {
  if (!iso) return '—';
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return '—';
  return d.toLocaleDateString(undefined, {
    weekday: 'short',
    month: 'short',
    day: 'numeric',
    year: 'numeric'
  });
}

function formatRelative(iso) {
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
  if (d < 7) return `${d}d ago`;
  return formatDate(iso);
}

function getDeadlineStatus(deadline) {
  const d = new Date(deadline);
  if (Number.isNaN(d.getTime())) return { text: '—', variant: 'neutral' };
  const now = new Date();
  const dayMs = 24 * 60 * 60 * 1000;
  const days = Math.ceil((d - now) / dayMs);

  if (days < 0) return { text: `${Math.abs(days)} days overdue`, variant: 'danger' };
  if (days === 0) return { text: 'Due today', variant: 'urgent' };
  if (days === 1) return { text: 'Due tomorrow', variant: 'warning' };
  if (days <= 7) return { text: `${days} days left`, variant: 'warning' };
  return { text: `${days} days left`, variant: 'success' };
}

export default function ProjectDetailPage() {
  const { id } = useParams();
  const { user, isOwner } = useAuth();
  const [project, setProject] = useState(null);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('bids');

  useEffect(() => {
    getProject(id)
      .then(setProject)
      .catch(console.error)
      .finally(() => setLoading(false));
  }, [id]);

  useEffect(() => {
    const handleHashChange = () => {
      const hash = window.location.hash.replace('#', '');
      if (hash) setActiveTab(hash);
    };
    handleHashChange();
    window.addEventListener('hashchange', handleHashChange);
    return () => window.removeEventListener('hashchange', handleHashChange);
  }, []);

  const ownerIdStr = project ? resolveOwnerId(project.ownerId) : null;
  const isProjectOwner = Boolean(user && ownerIdStr && String(ownerIdStr) === String(user.id));
  const statusCfg = project ? STATUS_CONFIG[project.status] || STATUS_CONFIG.Open : null;
  const deadlineStatus = project ? getDeadlineStatus(project.deadline) : null;

  if (loading) {
    return (
      <Layout>
        <div className="pd-container">
          <div className="pd-loading">
            <div className="pd-loading-spinner" />
            <p>Loading project...</p>
          </div>
        </div>
      </Layout>
    );
  }

  if (!project) {
    return (
      <Layout>
        <div className="pd-container">
          <div className="pd-empty">
            <div className="pd-empty-icon">!</div>
            <h2>Project not found</h2>
            <p>The project you're looking for doesn't exist or has been removed.</p>
            <Link to="/" className="pd-back-btn">
              <ArrowLeftIcon />
              Back to projects
            </Link>
          </div>
        </div>
      </Layout>
    );
  }

  const tabs = [
    { id: 'bids', label: 'Bids', count: null },
    { id: 'assignment', label: 'Assignment', count: null },
    { id: 'milestones', label: 'Milestones', count: null },
    { id: 'payments', label: 'Payments', count: null }
  ];

  return (
    <Layout showProjectSectionsNav>
      <div className="pd-container">
        {/* Modern Hero Section */}
        <div className="pd-hero">
          <div className="pd-hero-gradient" />

          <div className="pd-hero-content">
            {/* Back Link */}
            <Link to="/" className="pd-back-link">
              <ArrowLeftIcon />
              <span>Back to projects</span>
            </Link>

            {/* Title Row */}
            <div className="pd-hero-header">
              <div className="pd-hero-titles">
                <div className="pd-hero-eyebrow">
                  <span className="pd-hero-brand">Oktawave</span>
                  <span className="pd-hero-dot" />
                  <span>Project Details</span>
                </div>
                <h1 className="pd-hero-title">{project.title}</h1>
              </div>

              <div
                className="pd-status-badge"
                style={{ background: statusCfg.bg, color: statusCfg.color, borderColor: statusCfg.color }}
              >
                <span className="pd-status-dot" style={{ background: statusCfg.color }} />
                {statusCfg.label}
              </div>
            </div>

            {/* Description */}
            <p className="pd-hero-desc">{project.description}</p>

            {/* Skills */}
            {project.skills?.length > 0 && (
              <div className="pd-skills">
                {project.skills.map((s, i) => (
                  <span key={i} className="pd-skill">{s}</span>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Stats Grid */}
        <div className="pd-stats">
          <div className="pd-stat-card highlight">
            <div className="pd-stat-icon" style={{ background: 'rgba(45, 181, 218, 0.1)', color: '#2DB5DA' }}>
              <DollarIcon />
            </div>
            <div className="pd-stat-content">
              <span className="pd-stat-label">Budget</span>
              <span className="pd-stat-value">${Number(project.budget).toLocaleString()}</span>
            </div>
          </div>

          <div className={`pd-stat-card ${deadlineStatus?.variant}`}>
            <div className={`pd-stat-icon ${deadlineStatus?.variant}`}>
              <CalendarIcon />
            </div>
            <div className="pd-stat-content">
              <span className="pd-stat-label">Deadline</span>
              <span className="pd-stat-value">{formatDate(project.deadline)}</span>
              {deadlineStatus && (
                <span className={`pd-stat-sub ${deadlineStatus.variant}`}>{deadlineStatus.text}</span>
              )}
            </div>
          </div>

          <div className="pd-stat-card">
            <div className="pd-stat-icon" style={{ background: 'rgba(139, 92, 246, 0.1)', color: '#8B5CF6' }}>
              <UserIcon />
            </div>
            <div className="pd-stat-content">
              <span className="pd-stat-label">Posted by</span>
              <span className="pd-stat-value">{posterName(project)}</span>
              <span className="pd-stat-sub">{ownerEmail(project)}</span>
            </div>
          </div>

          <div className="pd-stat-card">
            <div className="pd-stat-icon" style={{ background: 'rgba(16, 185, 129, 0.1)', color: '#10B981' }}>
              <ClockIcon />
            </div>
            <div className="pd-stat-content">
              <span className="pd-stat-label">Posted</span>
              <span className="pd-stat-value">{formatRelative(project.createdAt) || formatDate(project.createdAt)}</span>
              {project.updatedAt && project.updatedAt !== project.createdAt && (
                <span className="pd-stat-sub">Updated {formatRelative(project.updatedAt)}</span>
              )}
            </div>
          </div>
        </div>

        {/* Action Bar */}
        {isProjectOwner && (
          <div className="pd-action-bar">
            <div className="pd-action-hint">
              <span className="pd-action-icon">
                <EditIcon />
              </span>
              <span>You are the project owner. Manage bids, assignments, and milestones below.</span>
            </div>
          </div>
        )}

        {/* Modern Tabs */}
        <div className="pd-tabs-wrapper">
          <nav className="pd-tabs" aria-label="Project sections">
            {tabs.map(tab => (
              <a
                key={tab.id}
                href={`#${tab.id}`}
                className={`pd-tab ${activeTab === tab.id ? 'active' : ''}`}
                onClick={() => setActiveTab(tab.id)}
              >
                {tab.label}
                {tab.count !== null && <span className="pd-tab-count">{tab.count}</span>}
              </a>
            ))}
          </nav>
        </div>

        {/* Content Sections */}
        <div className="pd-sections">
          <section id="bids" className="pd-section">
            <BidsSection
              projectId={id}
              projectStatus={project.status}
              isProjectOwner={isProjectOwner}
            />
          </section>

          <div className="pd-section-divider" />

          <section id="assignment" className="pd-section">
            <AssignmentSection projectId={id} isProjectOwner={isProjectOwner} />
          </section>

          <div className="pd-section-divider" />

          <section id="milestones" className="pd-section">
            <MilestonesSection projectId={id} isProjectOwner={isProjectOwner} />
          </section>

          <div className="pd-section-divider" />

          <section id="payments" className="pd-section">
            <PaymentsSection projectId={id} isProjectOwner={isProjectOwner} />
          </section>
        </div>
      </div>
    </Layout>
  );
}
