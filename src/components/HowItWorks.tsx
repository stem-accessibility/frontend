import React from "react";
import "../pages/styles/HomeLanding.css";

const FLOWCHART_REPS_URL =
  "https://www.access-flows.com/p/66c886fb4eb5";

const HowItWorks: React.FC = () => (
  <section className="home-section" aria-labelledby="how-title">
    <div className="home-section__inner">
      <header className="home-section__header">
        <h2 id="how-title" className="home-section__title">
          How It Works
        </h2>

        <p className="home-section__lead">
          Start from the STEM image you already have. STEM-Accessibility converts it into structured data, lets you verify it in a
          visual editor, and publishes accessible representations via a permanent link.
        </p>
      </header>

      {/* Stepper */}
      <ol className="how-steps" aria-label="STEM-Accessibility workflow">
        {/* Step 1 */}
        <li className="how-step">
          <div className="how-step__meta">
            <div className="how-step__kicker">Step 1</div>
            <h3 className="how-step__title">Upload your original STEM image</h3>
            <p className="how-step__desc">
              Bring an existing image or PDF export. We extract the underlying nodes, edges, and labels into a
              structured representation.
            </p>
          </div>

          <figure className="how-step__card">
            <div className="how-step__frame">
              <img
                src="/original.jpg"
                alt="Original flowchart image before accessibility processing."
                loading="lazy"
              />
            </div>
            <figcaption className="how-step__caption">Original STEM image (image input)</figcaption>
          </figure>
        </li>

        <div className="how-connector" aria-hidden="true">
          <span className="how-connector__line" />
          <span className="how-connector__arrow">→</span>
        </div>

        {/* Step 2 */}
        <li className="how-step">
          <div className="how-step__meta">
            <div className="how-step__kicker">Step 2</div>
            <h3 className="how-step__title">Verify in the visual editor</h3>
            <p className="how-step__desc">
              Review and correct structure (nodes/edges) and wording. This step ensures the accessible outputs are
              accurate and audit-ready.
            </p>
          </div>

          <figure className="how-step__card">
            <div className="how-step__frame">
              <img
                src="/editor.png"
                alt="STEM-Accessibility visual editor showing a flowchart with editable nodes and connections."
                loading="lazy"
              />
            </div>
            <figcaption className="how-step__caption">Human-in-the-loop verification</figcaption>
          </figure>
        </li>

        <div className="how-connector" aria-hidden="true">
          <span className="how-connector__line" />
          <span className="how-connector__arrow">→</span>
        </div>

        {/* Step 3 */}
        <li className="how-step">
          <div className="how-step__meta">
            <div className="how-step__kicker">Step 3</div>
            <h3 className="how-step__title">Publish accessible representations</h3>
            <p className="how-step__desc">
             Share a permalink with a long description, structured data representing the STEM image, a keyboard-navigable view, and a tactile graphic ready for printing.
</p>

            <a
              className="how-step__link"
              href={FLOWCHART_REPS_URL}
              target="_blank"
              rel="noopener noreferrer"
            >
              View example representations
              <span className="sr-only"> (opens in a new tab)</span>
            </a>
          </div>

          
        </li>
      </ol>
    </div>
  </section>
);

export default HowItWorks;
