import React from "react";
import "../components/styles/Footer.css";

const REPO_URL = "https://github.com/stem-accessibility/frontend";
const ISSUES_URL = `${REPO_URL}/issues/new`;
const CONTACT_EMAIL = "stem-accessibility@uw.edu";

const Footer: React.FC = () => {
  const year = new Date().getFullYear();

  return (
    <footer className="site-footer" aria-label="Footer">
      <div className="site-footer__inner">
        <div className="site-footer__row">
          <span className="site-footer__label">Questions?</span>

          <div className="site-footer__links">
            <a href={`mailto:${CONTACT_EMAIL}`} className="site-footer__link">
              {CONTACT_EMAIL}
            </a>
            <a
              href={REPO_URL}
              className="site-footer__link"
              target="_blank"
              rel="noopener noreferrer"
            >
              Source code on GitHub
              <span className="sr-only"> (opens in a new tab)</span>
            </a>
            <a
              href={ISSUES_URL}
              className="site-footer__link site-footer__link--primary"
              target="_blank"
              rel="noopener noreferrer"
            >
              Submit an issue
              <span className="sr-only"> (opens in a new tab)</span>
            </a>
          </div>
        </div>

        <div className="site-footer__sub">
          © {year} STEM-Accessibility
        </div>
      </div>
    </footer>
  );
};

export default Footer;
