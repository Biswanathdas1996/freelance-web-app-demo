import { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import Layout from '../components/Layout';
import BidsSection from '../components/BidsSection';
import AssignmentSection from '../components/AssignmentSection';
import MilestonesSection from '../components/MilestonesSection';
import PaymentsSection from '../components/PaymentsSection';
import { useAuth } from '../context/AuthContext';
import { getProject } from '../api';

const STATUS_BADGE = {
  Open: 'badge-open',
  Assigned: 'badge-assigned',
  InProgress: 'badge-inprogress',
  Completed: 'badge-completed',
  Cancelled: 'badge-cancelled'
};

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

export default function ProjectDetailPage() {
  const { id } = useParams();
  const { user } = useAuth();
  const [project, setProject] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    getProject(id)
      .then(setProject)
      .catch(console.error)
      .finally(() => setLoading(false));
  }, [id]);

  if (loading)
    return (
      <Layout>
        <div className="uw-project-detail">
          <nav className="uw-detail-breadcrumb" aria-label="Breadcrumb">
            <Link to="/">Find work</Link>
            <span className="uw-detail-breadcrumb__sep" aria-hidden="true">
              /
            </span>
            <span className="uw-detail-breadcrumb__current">Loading…</span>
          </nav>
          <p className="uw-detail-loading">Loading project…</p>
        </div>
      </Layout>
    );

  if (!project)
    return (
      <Layout>
        <div className="uw-project-detail">
          <nav className="uw-detail-breadcrumb" aria-label="Breadcrumb">
            <Link to="/">Find work</Link>
            <span className="uw-detail-breadcrumb__sep" aria-hidden="true">
              /
            </span>
            <span className="uw-detail-breadcrumb__current">Not found</span>
          </nav>
          <p className="uw-detail-empty">Project not found.</p>
        </div>
      </Layout>
    );

  const ownerIdStr = resolveOwnerId(project.ownerId);
  const isProjectOwner = Boolean(user && ownerIdStr && String(ownerIdStr) === String(user.id));

  const listedOn =
    project.createdAt &&
    new Date(project.createdAt).toLocaleDateString(undefined, {
      month: 'short',
      day: 'numeric',
      year: 'numeric'
    });
  const updatedOn =
    project.updatedAt &&
    project.updatedAt !== project.createdAt &&
    new Date(project.updatedAt).toLocaleDateString(undefined, {
      month: 'short',
      day: 'numeric',
      year: 'numeric'
    });

  return (
    <Layout showProjectSectionsNav>
      <div className="uw-project-detail">
        <nav className="uw-detail-breadcrumb" aria-label="Breadcrumb">
          <Link to="/">Find work</Link>
          <span className="uw-detail-breadcrumb__sep" aria-hidden="true">
            /
          </span>
          <Link to="/#projects-list">All jobs</Link>
          <span className="uw-detail-breadcrumb__sep" aria-hidden="true">
            /
          </span>
          <span className="uw-detail-breadcrumb__current">{project.title}</span>
        </nav>

        <section
          className="uw-detail-hero"
          aria-labelledby="project-detail-title"
        >
          <div className="uw-detail-hero__accent" aria-hidden="true" />
          <div className="uw-detail-hero__head">
            <div className="uw-detail-hero__titles">
              <p className="uw-detail-eyebrow">
                <span>Oktawave</span>
                <span className="uw-detail-eyebrow__dot" aria-hidden="true" />
                <span>Project overview</span>
              </p>
              <h1 id="project-detail-title" className="uw-detail-title">
                {project.title}
              </h1>
            </div>
            <span
              className={`uw-status-pill badge ${STATUS_BADGE[project.status] || 'badge-pending'}`}
            >
              {project.status}
            </span>
          </div>
          <p className="uw-detail-desc">{project.description}</p>

          <div className="uw-detail-stats">
            <div className="uw-detail-stat">
              <span className="uw-detail-stat__label">Budget</span>
              <span className="uw-detail-stat__value uw-detail-stat__value--money">
                ${Number(project.budget).toLocaleString()}
              </span>
            </div>
            <div className="uw-detail-stat">
              <span className="uw-detail-stat__label">Deadline</span>
              <span className="uw-detail-stat__value">
                {new Date(project.deadline).toLocaleDateString(undefined, {
                  weekday: 'short',
                  month: 'short',
                  day: 'numeric',
                  year: 'numeric'
                })}
              </span>
            </div>
            <div className="uw-detail-stat">
              <span className="uw-detail-stat__label">Posted by</span>
              <span className="uw-detail-stat__value">{posterName(project)}</span>
            </div>
            {listedOn && (
              <div className="uw-detail-stat">
                <span className="uw-detail-stat__label">Listed on</span>
                <span className="uw-detail-stat__value">{listedOn}</span>
              </div>
            )}
            {updatedOn && (
              <div className="uw-detail-stat">
                <span className="uw-detail-stat__label">Last updated</span>
                <span className="uw-detail-stat__value">{updatedOn}</span>
              </div>
            )}
          </div>

          {project.skills?.length > 0 && (
            <div className="uw-detail-skills">
              {project.skills.map((s, i) => (
                <span key={i} className="uw-detail-skill">
                  {s}
                </span>
              ))}
            </div>
          )}

          <p className="uw-detail-hint">
            Use the sections below for bids, assignment, milestones, and payments. Jump links are
            in the header and in the tab row.
          </p>
        </section>

        <nav className="uw-detail-tabs" aria-label="Project workspace sections">
          <a href="#bids">Bids</a>
          <a href="#assignment">Assignment</a>
          <a href="#milestones">Milestones</a>
          <a href="#payments">Payments</a>
        </nav>

        <div className="uw-detail-sections">
          <BidsSection
            projectId={id}
            projectStatus={project.status}
            isProjectOwner={isProjectOwner}
          />
          <hr className="uw-detail-section-rule" />
          <AssignmentSection projectId={id} isProjectOwner={isProjectOwner} />
          <hr className="uw-detail-section-rule" />
          <MilestonesSection projectId={id} isProjectOwner={isProjectOwner} />
          <hr className="uw-detail-section-rule" />
          <PaymentsSection projectId={id} isProjectOwner={isProjectOwner} />
        </div>
      </div>
    </Layout>
  );
}
