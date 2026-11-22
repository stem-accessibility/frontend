import React from "react";
import "../pages/styles/GuidancePage.css";
import "../pages/styles/ResourcesPage.css";

import {
  GuidanceHero,
  GuidanceSection,
  Callout,
} from "../components/guidance/GuidanceComponents";
import { RESOURCE_GROUPS, RESOURCES_LAST_CHECKED } from "../data/resources";

const Resources: React.FC = () => {
  return (
    <div className="guidance-page">
      <GuidanceHero
        title="Resources"
        subtitle="Other tools, guides and communities for making STEM content accessible."
      />

      <GuidanceSection id="about-this-list" title="About this list">
        <p>
          Some additional links to STEM accessibility software
        </p>
        <Callout tone="neutral">
          Many of these are AI tools that have their own privacy policies. Remove names and other personal or sensitive
          information from images before you upload them, and follow your institution’s policy.
          AI tools can also misread or leave out content, so check the result against the
          original.
        </Callout>
        <p>Links last checked on {RESOURCES_LAST_CHECKED}.</p>
      </GuidanceSection>

      {RESOURCE_GROUPS.map((group) => (
        <GuidanceSection key={group.id} id={group.id} title={group.title}>
          {group.intro ? <p>{group.intro}</p> : null}
          <ul className="resources-list">
            {group.items.map((item) => (
              <li key={item.url} className="resources-list__item">
                <a href={item.url} target="_blank" rel="noopener noreferrer">
                  {item.name}
                  <span className="sr-only"> (opens in a new tab)</span>
                </a>
                <p className="resources-list__description">{item.description}</p>
              </li>
            ))}
          </ul>
        </GuidanceSection>
      ))}

      <GuidanceSection id="suggest" title="Suggest a resource">
        <p>
          Know of a tool or guide that belongs here? Email{" "}
          <a href="mailto:stem-accessibility@uw.edu">stem-accessibility@uw.edu</a> or{" "}
          <a
            href="https://github.com/stem-accessibility/frontend/issues/new"
            target="_blank"
            rel="noopener noreferrer"
          >
            open an issue on GitHub
            <span className="sr-only"> (opens in a new tab)</span>
          </a>
          .
        </p>
      </GuidanceSection>
    </div>
  );
};

export default Resources;
