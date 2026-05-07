import { Link, useLocation, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import '../App.css';

export default function Layout({ children, showProjectSectionsNav, headerSearch }) {
  const location = useLocation();
  const navigate = useNavigate();
  const { user, logout, isOwner, isBidder } = useAuth();
  const onDetailPage = location.pathname.startsWith('/projects/');

  const roleLabel = isOwner ? 'Owner' : isBidder ? 'Bidder' : '';

  const handleLogout = () => {
    logout();
    navigate('/login', { replace: true });
  };

  const initial =
    user?.name?.trim()?.charAt(0)?.toUpperCase() ||
    user?.email?.trim()?.charAt(0)?.toUpperCase() ||
    '?';

  const showProjectNav = Boolean(onDetailPage && showProjectSectionsNav);

  return (
    <div className="uw-app">
      <header className={`uw-header${showProjectNav ? ' uw-header--project' : ''}`}>
        <div className="uw-header-inner">
          <div className="uw-header-row">
            <Link to="/" className="uw-logo">
              Oktawave
            </Link>

            <nav className="uw-nav-primary" aria-label="Primary">
              <Link to="/" className={!onDetailPage ? 'uw-nav-link active' : 'uw-nav-link'}>
                Find work
              </Link>
              {isOwner && (
                <Link to="/post-job" className="uw-nav-link">
                  Post a job
                </Link>
              )}
              <Link to="/loans" className="uw-nav-link">
                Loans
              </Link>
            </nav>

            <div className="uw-search-slot" aria-label="Search">
              {!onDetailPage && headerSearch ? headerSearch : null}
            </div>

            <div className="uw-header-user">
              {user && (
                <div className="uw-user-block">
                  <span className="uw-user-avatar" aria-hidden="true">
                    {initial}
                  </span>
                  <span className="uw-user-meta">
                    <span className="uw-user-name">{user.name}</span>
                    {roleLabel || user.profession ? (
                      <span className="uw-user-role">
                        {roleLabel}
                        {roleLabel && user.profession ? ' · ' : ''}
                        {user.profession || ''}
                      </span>
                    ) : null}
                  </span>
                </div>
              )}
              <button type="button" className="uw-btn-ghost" onClick={handleLogout}>
                Log out
              </button>
            </div>
          </div>

          {showProjectNav ? (
            <nav className="uw-header-project-nav" aria-label="Project workspace sections">
              <a href="#bids" className="uw-nav-link uw-nav-anchor">
                Bids
              </a>
              <a href="#assignment" className="uw-nav-link uw-nav-anchor">
                Assignment
              </a>
              <a href="#milestones" className="uw-nav-link uw-nav-anchor">
                Milestones
              </a>
              <a href="#payments" className="uw-nav-link uw-nav-anchor">
                Payments
              </a>
            </nav>
          ) : null}
        </div>
      </header>

      <main className="uw-main">{children}</main>

      <footer className="uw-footer">
        <div className="uw-footer-inner">
          <div className="uw-footer-grid">
            <div>
              <div className="uw-footer-brand">Oktawave</div>
              <p className="uw-footer-text">
                A fixed-price project workspace inspired by leading talent marketplaces —
                scoped work, proposals, milestones, and payouts in one place.
              </p>
            </div>
            <div>
              <h4 className="uw-footer-heading">Find work</h4>
              <ul className="uw-footer-links">
                <li>
                  <Link to="/">Browse jobs</Link>
                </li>
                <li>
                  <Link to="/#projects-list">Saved filters</Link>
                </li>
              </ul>
            </div>
            <div>
              <h4 className="uw-footer-heading">For clients</h4>
              <ul className="uw-footer-links">
                <li>
                  <Link to="/post-job">Post a job</Link>
                </li>
                <li>
                  <span className="uw-footer-muted">Contracts &amp; milestones (demo)</span>
                </li>
              </ul>
            </div>
            <div>
              <h4 className="uw-footer-heading">Loans</h4>
              <ul className="uw-footer-links">
                <li>
                  <Link to="/loans">Apply for a loan</Link>
                </li>
                <li>
                  <span className="uw-footer-muted">Loan calculator (demo)</span>
                </li>
              </ul>
            </div>
            <div>
              <h4 className="uw-footer-heading">Support</h4>
              <ul className="uw-footer-links">
                <li>
                  <span className="uw-footer-muted">Help center (demo)</span>
                </li>
                <li>
                  <span className="uw-footer-muted">Trust &amp; safety (demo)</span>
                </li>
              </ul>
            </div>
          </div>
          <div className="uw-footer-bottom">
            <span>Oktawave &copy; 2026</span>
            <span className="uw-footer-meta">Demo app · Not affiliated with Upwork</span>
          </div>
        </div>
      </footer>
    </div>
  );
}
