import React from "react";
import { Link } from "react-router-dom";
import { useAuth } from "../auth/AuthProvider";
import "../pages/styles/HomeLanding.css";


  const REPS_HUB_URL = "https://www.access-flows.com/p/66c886fb4eb5"


const Hero: React.FC = () => {
  const { user } = useAuth();

  return (
  <section className="hero" aria-labelledby="hero-title">
    <div className="hero__inner">
      <div className="hero__copy">
       

        <h1 id="hero-title" className="hero__title">
          Make diagrams accessible.
        </h1>

        <p className="hero__subtitle">
        STEM-Accessibility helps teams generate accessible representations of flowchart diagrams. These representations are grounded in accessibility research and were iteratively designed and evaluated with blind and visually impaired users:  
        <a href="https://www.briannawimer.com/publications/2026-01-01-CHI-26" className="hero__link"> [see the research]</a>.
      </p>


        <ul className="hero__bullets" aria-label="Key capabilities">
          <li>Turn existing diagrams into structured, accessible representations  </li>
          <li>Explore diagrams through text, keyboard navigation, and touch </li>
          <li>Share one link that works across different access needs</li>
        </ul>

        <div className="hero__actions">
          {user ? (
            <Link className="btn hero__cta" to="/upload">
              Upload a diagram
            </Link>
          ) : (
            <Link className="btn hero__cta" to="/login">
              Log in or sign up to upload
            </Link>
          )}
          <a
          className="btn btn--secondary hero__secondary"
          href={REPS_HUB_URL}
          target="_blank"
          rel="noopener noreferrer"
        >
          See what you get
          <span className="sr-only"> (opens in a new tab)</span>
        </a>
        </div>

        <p className="hero__fineprint">
          {user
            ? "Your diagrams and published pages are listed on your dashboard."
            : "Free to sign up. Uploads are processed automatically and saved to your account."}
        </p>
      </div>

      <div className="hero__media" aria-label="Product preview">
        <div className="hero__mock">
          <div className="hero__mockTop">
            <span className="hero__dot" />
            <span className="hero__dot" />
            <span className="hero__dot" />
          </div>

          <div className="hero__mockBody">
            
             
              <a
                className="hero__mockHeadline"
                href={REPS_HUB_URL}
                target="_blank"
                rel="noopener noreferrer"
              >
                One diagram. Multiple Accessible Representations
                <span className="sr-only"> (opens in a new tab)</span>
              </a>
            

         <div className="hero__reps" role="group" aria-label="Accessible diagram representations">
  {[
    { src: "/original.jpg", label: "Diagram in its original visual form", alt: "Original flowchart image before accessibility processing" },
    { src: "/description.png", label: "Structured, sectioned explanation", alt: "Long description view presenting a structured textual explanation of a flowchart" },
    { src: "/keyboard.png", label: "Navigate diagrams with a keyboard", alt: "Keyboard-navigable diagram interface highlighting focused nodes" },
    { src: "/tactile-real.jpeg", label: "Tactile rendering for swell paper", alt: "Tactile flowchart representation designed for braille or swell paper output" },
  ].map((rep) => (
    <figure className="hero__rep" key={rep.src}>
      <div className="hero__repFrame">
        <img src={rep.src} alt={rep.alt} loading="lazy" />
      </div>
      <figcaption>{rep.label}</figcaption>
    </figure>
  ))}
</div>


          </div>
        </div>

        
      </div>
    </div>
  </section>
  );
};

export default Hero;
