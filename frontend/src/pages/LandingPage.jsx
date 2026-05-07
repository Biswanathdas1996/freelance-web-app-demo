import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useEffect, useRef, useState } from 'react';
import './LandingPage.css';

function LandingPage() {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [isVisible, setIsVisible] = useState({});
  const observerRef = useRef(null);

  useEffect(() => {
    observerRef.current = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            setIsVisible((prev) => ({ ...prev, [entry.target.id]: true }));
          }
        });
      },
      { threshold: 0.1, rootMargin: '0px 0px -50px 0px' }
    );

    const sections = document.querySelectorAll('.animate-on-scroll');
    sections.forEach((section) => {
      if (section.id) {
        observerRef.current.observe(section);
      }
    });

    return () => {
      if (observerRef.current) {
        observerRef.current.disconnect();
      }
    };
  }, []);

  const handleGetStarted = () => {
    if (user) {
      navigate('/projects');
    } else {
      navigate('/login');
    }
  };

  const features = [
    {
      title: 'Smart Project Management',
      description: 'Organize, track, and deliver projects with AI-powered insights and intuitive dashboards',
      icon: (
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
          <rect x="3" y="3" width="7" height="7" rx="1" />
          <rect x="14" y="3" width="7" height="7" rx="1" />
          <rect x="3" y="14" width="7" height="7" rx="1" />
          <rect x="14" y="14" width="7" height="7" rx="1" />
        </svg>
      )
    },
    {
      title: 'Real-time Collaboration',
      description: 'Work together seamlessly with live updates, comments, and instant notifications',
      icon: (
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
          <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" />
          <circle cx="9" cy="7" r="4" />
          <path d="M23 21v-2a4 4 0 0 0-3-3.87" />
          <path d="M16 3.13a4 4 0 0 1 0 7.75" />
        </svg>
      )
    },
    {
      title: 'Global Talent Network',
      description: 'Connect with skilled professionals worldwide and build your dream team',
      icon: (
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
          <circle cx="12" cy="12" r="10" />
          <path d="M2 12h20" />
          <path d="M12 2a15.3 15.3 0 0 1 4 10 15.3 15.3 0 0 1-4 10 15.3 15.3 0 0 1-4-10 15.3 15.3 0 0 1 4-10z" />
        </svg>
      )
    },
    {
      title: 'Secure & Reliable',
      description: 'Enterprise-grade security with encrypted data and 99.9% uptime guarantee',
      icon: (
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
          <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" />
          <path d="m9 12 2 2 4-4" />
        </svg>
      )
    },
    {
      title: 'Smart Payments',
      description: 'Automated invoicing, milestone-based payments, and multi-currency support',
      icon: (
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
          <rect x="2" y="5" width="20" height="14" rx="2" />
          <path d="M2 10h20" />
          <path d="M7 15h.01" />
        </svg>
      )
    },
    {
      title: 'Analytics & Insights',
      description: 'Track performance metrics and make data-driven decisions with powerful analytics',
      icon: (
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
          <path d="M3 3v18h18" />
          <path d="m19 9-5 5-4-4-3 3" />
        </svg>
      )
    }
  ];

  const stats = [
    { value: '50K+', label: 'Active Users' },
    { value: '120+', label: 'Countries' },
    { value: '$2B+', label: 'Projects Funded' },
    { value: '99.9%', label: 'Uptime' }
  ];

  const testimonials = [
    {
      quote: "This platform transformed how we manage projects. The efficiency gains have been incredible.",
      author: "Sarah Chen",
      role: "VP of Engineering",
      company: "TechCorp Global"
    },
    {
      quote: "Finding and managing talent has never been easier. Highly recommend for any growing team.",
      author: "Marcus Johnson",
      role: "Founder & CEO",
      company: "StartupLabs"
    },
    {
      quote: "The collaboration features are game-changing. Our remote team has never been more connected.",
      author: "Elena Rodriguez",
      role: "Product Manager",
      company: "InnovateCo"
    }
  ];

  return (
    <div className="landing-container">
      {/* Navigation */}
      <nav className="landing-nav">
        <div className="nav-logo">
          <div className="logo-icon">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
              <polygon points="12 2 2 7 12 12 22 7 12 2" />
              <polyline points="2 17 12 22 22 17" />
              <polyline points="2 12 12 17 22 12" />
            </svg>
          </div>
          <span>ProjectHub</span>
        </div>
        <div className="nav-links">
          <a href="#features">Features</a>
          <a href="#testimonials">Testimonials</a>
          <a href="#stats">Stats</a>
        </div>
        <div className="nav-actions">
          <button className="btn-nav" onClick={() => navigate('/login')}>Sign In</button>
          <button className="btn-nav-primary" onClick={handleGetStarted}>Get Started</button>
        </div>
      </nav>

      {/* Hero Section */}
      <section className="hero-section">
        <div className="hero-gradient"></div>
        <div className="hero-grid"></div>
        <div className="hero-content">
          <div className="hero-badge">
            <span className="badge-dot"></span>
            New: AI-Powered Project Insights
          </div>
          <h1 className="hero-title">
            Build Better
            <span className="gradient-text">Projects</span>
            Together
          </h1>
          <p className="hero-subtitle">
            The intelligent platform for modern teams. Streamline workflows,
            collaborate seamlessly, and deliver exceptional results.
          </p>
          <div className="hero-buttons">
            <button className="btn-primary-hero" onClick={handleGetStarted}>
              Start Free Trial
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M5 12h14M12 5l7 7-7 7" />
              </svg>
            </button>
            <button className="btn-secondary-hero" onClick={() => navigate('/login')}>
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <polygon points="5 3 19 12 5 21 5 3" />
              </svg>
              Watch Demo
            </button>
          </div>
          <div className="hero-trust">
            <p>Trusted by teams at</p>
            <div className="trust-logos">
              <span>Stripe</span>
              <span>Notion</span>
              <span>Figma</span>
              <span>Vercel</span>
            </div>
          </div>
        </div>
        <div className="hero-visual">
          <div className="hero-card-main">
            <div className="card-glow"></div>
            <div className="card-content-wrapper">
              <div className="card-header">
                <div className="card-avatar-group">
                  <div className="avatar"></div>
                  <div className="avatar"></div>
                  <div className="avatar"></div>
                  <div className="avatar-more">+5</div>
                </div>
                <span className="card-status active">Active</span>
              </div>
              <div className="card-body">
                <h4>Website Redesign</h4>
                <div className="progress-bar">
                  <div className="progress-fill" style={{ width: '75%' }}></div>
                </div>
                <div className="progress-info">
                  <span>Progress</span>
                  <span>75%</span>
                </div>
              </div>
              <div className="card-tasks">
                <div className="task-item-hero">
                  <div className="task-checkbox completed"></div>
                  <span>Research & Discovery</span>
                </div>
                <div className="task-item-hero">
                  <div className="task-checkbox completed"></div>
                  <span>Wireframe Design</span>
                </div>
                <div className="task-item-hero">
                  <div className="task-checkbox active"></div>
                  <span>Visual Design</span>
                </div>
                <div className="task-item-hero">
                  <div className="task-checkbox"></div>
                  <span>Development</span>
                </div>
              </div>
            </div>
          </div>
          <div className="floating-card card-1">
            <div className="floating-icon">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M12 2v4M12 18v4M4.93 4.93l2.83 2.83M16.24 16.24l2.83 2.83M2 12h4M18 12h4M4.93 19.07l2.83-2.83M16.24 7.76l2.83-2.83" />
              </svg>
            </div>
            <div>
              <p className="floating-title">Tasks Completed</p>
              <p className="floating-value">+24 this week</p>
            </div>
          </div>
          <div className="floating-card card-2">
            <div className="floating-icon purple">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z" />
              </svg>
            </div>
            <div>
              <p className="floating-title">Messages</p>
              <p className="floating-value">8 unread</p>
            </div>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section id="features" className={`features-section animate-on-scroll ${isVisible.features ? 'visible' : ''}`}>
        <div className="section-header">
          <span className="section-label">Features</span>
          <h2 className="section-title">
            Everything you need to
            <span className="gradient-text"> scale</span>
          </h2>
          <p className="section-subtitle">
            Powerful tools designed for modern teams who want to move fast and build better
          </p>
        </div>
        <div className="features-grid">
          {features.map((feature, index) => (
            <div key={index} className="feature-card">
              <div className="feature-icon-wrapper">
                <div className="feature-icon">{feature.icon}</div>
              </div>
              <h3 className="feature-title">{feature.title}</h3>
              <p className="feature-description">{feature.description}</p>
            </div>
          ))}
        </div>
      </section>

      {/* Stats Section */}
      <section id="stats" className={`stats-section animate-on-scroll ${isVisible.stats ? 'visible' : ''}`}>
        <div className="stats-grid">
          {stats.map((stat, index) => (
            <div key={index} className="stat-card">
              <div className="stat-value">{stat.value}</div>
              <div className="stat-label">{stat.label}</div>
            </div>
          ))}
        </div>
      </section>

      {/* Testimonials Section */}
      <section id="testimonials" className={`testimonials-section animate-on-scroll ${isVisible.testimonials ? 'visible' : ''}`}>
        <div className="section-header">
          <span className="section-label">Testimonials</span>
          <h2 className="section-title">
            Loved by teams
            <span className="gradient-text"> worldwide</span>
          </h2>
        </div>
        <div className="testimonials-grid">
          {testimonials.map((testimonial, index) => (
            <div key={index} className="testimonial-card">
              <div className="testimonial-quote">
                <svg viewBox="0 0 24 24" fill="currentColor">
                  <path d="M14.017 21v-7.391c0-5.704 3.731-9.57 8.983-10.609l.995 2.151c-2.432.917-3.995 3.638-3.995 5.849h4v10h-9.983zm-14.017 0v-7.391c0-5.704 3.748-9.57 9-10.609l.996 2.151c-2.433.917-3.996 3.638-3.996 5.849h3.983v10h-9.983z" />
                </svg>
              </div>
              <p className="testimonial-text">{testimonial.quote}</p>
              <div className="testimonial-author">
                <div className="author-avatar">{testimonial.author.split(' ').map(n => n[0]).join('')}</div>
                <div className="author-info">
                  <p className="author-name">{testimonial.author}</p>
                  <p className="author-role">{testimonial.role} at {testimonial.company}</p>
                </div>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* CTA Section */}
      <section className="cta-section">
        <div className="cta-gradient"></div>
        <div className="cta-content">
          <h2 className="cta-title">
            Ready to transform your workflow?
          </h2>
          <p className="cta-subtitle">
            Join thousands of teams already building the future with ProjectHub
          </p>
          <div className="cta-buttons">
            <button className="btn-primary-hero" onClick={handleGetStarted}>
              Get Started Free
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M5 12h14M12 5l7 7-7 7" />
              </svg>
            </button>
          </div>
          <p className="cta-note">No credit card required • 14-day free trial</p>
        </div>
      </section>

      {/* Footer */}
      <footer className="landing-footer">
        <div className="footer-grid">
          <div className="footer-brand">
            <div className="footer-logo">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                <polygon points="12 2 2 7 12 12 22 7 12 2" />
                <polyline points="2 17 12 22 22 17" />
                <polyline points="2 12 12 17 22 12" />
              </svg>
              <span>ProjectHub</span>
            </div>
            <p>Building the future of work, one project at a time.</p>
            <div className="footer-social">
              <a href="#" aria-label="Twitter">
                <svg viewBox="0 0 24 24" fill="currentColor">
                  <path d="M23.953 4.57a10 10 0 01-2.825.775 4.958 4.958 0 002.163-2.723c-.951.555-2.005.959-3.127 1.184a4.92 4.92 0 00-8.384 4.482C7.69 8.095 4.067 6.13 1.64 3.162a4.822 4.822 0 00-.666 2.475c0 1.71.87 3.213 2.188 4.096a4.904 4.904 0 01-2.228-.616v.06a4.923 4.923 0 003.946 4.84 4.996 4.996 0 01-2.212.085 4.936 4.936 0 004.604 3.417 9.867 9.867 0 01-6.102 2.105c-.39 0-.779-.023-1.17-.067a13.995 13.995 0 007.557 2.209c9.053 0 13.998-7.496 13.998-13.985 0-.21 0-.42-.015-.63A9.935 9.935 0 0024 4.59z" />
                </svg>
              </a>
              <a href="#" aria-label="LinkedIn">
                <svg viewBox="0 0 24 24" fill="currentColor">
                  <path d="M20.447 20.452h-3.554v-5.569c0-1.328-.027-3.037-1.852-3.037-1.853 0-2.136 1.445-2.136 2.939v5.667H9.351V9h3.414v1.561h.046c.477-.9 1.637-1.85 3.37-1.85 3.601 0 4.267 2.37 4.267 5.455v6.286zM5.337 8.433c-1.144 0-2.063-.926-2.063-2.065 0-1.138.92-2.063 2.063-2.063 1.14 0 2.064.925 2.064 2.063 0 1.139-.925 2.065-2.064 2.065zm1.782 13.019H3.555V9h3.564v11.452zM22.225 0H1.771C.792 0 0 .774 0 1.729v20.542C0 23.227.792 24 1.771 24h20.451C23.2 24 24 23.227 24 22.271V1.729C24 .774 23.2 0 22.222 0h.003z" />
                </svg>
              </a>
              <a href="#" aria-label="GitHub">
                <svg viewBox="0 0 24 24" fill="currentColor">
                  <path d="M12 0c-6.626 0-12 5.373-12 12 0 5.302 3.438 9.8 8.207 11.387.599.111.793-.261.793-.577v-2.234c-3.338.726-4.033-1.416-4.033-1.416-.546-1.387-1.333-1.756-1.333-1.756-1.089-.745.083-.729.083-.729 1.205.084 1.839 1.237 1.839 1.237 1.07 1.834 2.807 1.304 3.492.997.107-.775.418-1.305.762-1.604-2.665-.305-5.467-1.334-5.467-5.931 0-1.311.469-2.381 1.236-3.221-.124-.303-.535-1.524.117-3.176 0 0 1.008-.322 3.301 1.23.957-.266 1.983-.399 3.003-.404 1.02.005 2.047.138 3.006.404 2.291-1.552 3.297-1.23 3.297-1.23.653 1.653.242 2.874.118 3.176.77.84 1.235 1.911 1.235 3.221 0 4.609-2.807 5.624-5.479 5.921.43.372.823 1.102.823 2.222v3.293c0 .319.192.694.801.576 4.765-1.589 8.199-6.086 8.199-11.386 0-6.627-5.373-12-12-12z" />
                </svg>
              </a>
            </div>
          </div>
          <div className="footer-links-group">
            <h4>Product</h4>
            <a href="#">Features</a>
            <a href="#">Pricing</a>
            <a href="#">Integrations</a>
            <a href="#">Changelog</a>
          </div>
          <div className="footer-links-group">
            <h4>Company</h4>
            <a href="#">About</a>
            <a href="#">Blog</a>
            <a href="#">Careers</a>
            <a href="#">Contact</a>
          </div>
          <div className="footer-links-group">
            <h4>Resources</h4>
            <a href="#">Documentation</a>
            <a href="#">Help Center</a>
            <a href="#">Community</a>
            <a href="#">API Reference</a>
          </div>
          <div className="footer-links-group">
            <h4>Legal</h4>
            <a href="#">Privacy</a>
            <a href="#">Terms</a>
            <a href="#">Security</a>
          </div>
        </div>
        <div className="footer-bottom">
          <p>&copy; 2025 ProjectHub. All rights reserved.</p>
        </div>
      </footer>
    </div>
  );
}

export default LandingPage;
