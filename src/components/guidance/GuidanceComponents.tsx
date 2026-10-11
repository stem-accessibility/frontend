import React from 'react';

type HeroProps = {
  title: string;
  subtitle: string;
};

export const GuidanceHero: React.FC<HeroProps> = ({ title, subtitle }) => (
  <header className="guidance-hero">
    <div className="guidance-hero-inner">
      <h1 className="guidance-title">{title}</h1>
      <p className="guidance-subtitle">{subtitle}</p>
    </div>
  </header>
);

type SectionProps = {
  id?: string;
  title: string;
  children: React.ReactNode;
};

export const GuidanceSection: React.FC<SectionProps> = ({ id, title, children }) => (
  <section className="guidance-section" id={id}>
    <div className="guidance-section-inner">
      <h2 className="guidance-section-title">{title}</h2>
      <div className="guidance-section-body">{children}</div>
    </div>
  </section>
);

type CalloutProps = {
  tone?: 'neutral' | 'emphasis';
  children: React.ReactNode;
};

export const Callout: React.FC<CalloutProps> = ({ tone = 'neutral', children }) => (
  <aside className={`guidance-callout guidance-callout--${tone}`} aria-label="Callout">
    {children}
  </aside>
);

export const SourceNote: React.FC<{ children: React.ReactNode }> = ({ children }) => (
  <p className="guidance-source-note">{children}</p>
);

export const DecisionTreeChecklist: React.FC = () => (
  <div className="decision-tree">
    <ol className="decision-tree-list">
      <li>
        <strong>Does the image contain text?</strong>
        <ul>
          <li>If the same text is already present nearby → use empty <code>alt=""</code>.</li>
          <li>If the text is only decorative or for visual effect → use empty <code>alt=""</code>.</li>
          <li>If the text is functional (e.g., an icon label) → describe the function in <code>alt</code>.</li>
          <li>If the text is not available elsewhere → include that text in <code>alt</code>.</li>
        </ul>
      </li>

      <li>
        <strong>Is the image used in a link or button?</strong>
        <ul>
          <li>If yes, and the action/destination would be unclear without the image → describe the action or destination in <code>alt</code>.</li>
          <li>If no → continue.</li>
        </ul>
      </li>

      <li>
        <strong>Does the image contribute meaning to the current page or context?</strong>
        <ul>
          <li>If it’s simple (photo or straightforward graphic) → provide a brief meaningful description in <code>alt</code>.</li>
          <li>If it’s complex (chart, flowchart, map, multi-part diagram) → provide a separate long description.</li>
          <li>If it’s redundant to nearby text → use empty <code>alt=""</code>.</li>
        </ul>
      </li>

      <li>
        <strong>Is the image purely decorative?</strong>
        <ul>
          <li>If yes → use empty <code>alt=""</code> (or consider a CSS background image for purely decorative visuals).</li>
          <li>If unclear → consult more detailed image guidance and evaluate the image’s purpose in context.</li>
        </ul>
      </li>
    </ol>
  </div>
);

export const TwoPartAlternative: React.FC = () => (
  <div className="two-part">
    <p className="two-part-intro">
      For complex images, accessibility guidance often calls for a two-part text alternative:
    </p>
    <ol className="two-part-list">
      <li>
        <strong>Short description</strong>
        <div className="two-part-detail">
          Identifies the image and, where appropriate, indicates where to find the long description.
        </div>
      </li>
      <li>
        <strong>Long description</strong>
        <div className="two-part-detail">
          A textual representation of the essential information conveyed by the image (e.g., chart values, trends,
          workflow logic, or diagram relationships).
        </div>
      </li>
    </ol>

    <Callout tone="neutral">
      Common implementation pattern: place a clear text link to the long description adjacent to the image (e.g., within a
      <code>{' <figcaption>'}</code>).
    </Callout>
  </div>
);

type Example = {
  title: string;
  description: string;
  href: string;
  imgSrc: string;
  imgAlt: string;
  linkText: string;
};

export const ExamplesGrid: React.FC<{ examples: Example[] }> = ({ examples }) => (
  <div className="examples-grid" role="list">
    {examples.map((ex) => (
      <figure key={ex.href} className="example-card" role="group">
        <img className="example-card-img" src={ex.imgSrc} alt={ex.imgAlt} />
        <figcaption className="example-card-caption">
          <div className="example-card-title">{ex.title}</div>
          <div className="example-card-desc">{ex.description}</div>
          <a className="example-card-link" href={ex.href}>
            {ex.linkText}
          </a>
        </figcaption>
      </figure>
    ))}
  </div>
);

type SoftCTAProps = {
  title: string;
  body: string;
  primaryText: string;
  primaryHref: string;
};

export const SoftCTA: React.FC<SoftCTAProps> = ({ title, body, primaryText, primaryHref }) => (
  <section className="guidance-cta" aria-label="Next steps">
    <div className="guidance-cta-inner">
      <h2 className="guidance-cta-title">{title}</h2>
      <p className="guidance-cta-body">{body}</p>
      <a className="guidance-cta-button" href={primaryHref}>
        {primaryText}
      </a>
    </div>
  </section>
);
