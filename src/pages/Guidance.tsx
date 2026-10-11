import React from 'react';
import '../pages/styles/GuidancePage.css';

import {
  GuidanceHero,
  GuidanceSection,
  Callout,
  DecisionTreeChecklist,
  TwoPartAlternative,
  SoftCTA,
  SourceNote,
} from '../components/guidance/GuidanceComponents';

const AltTextGuidancePage: React.FC = () => {
  return (
    <main className="guidance-page">
      <GuidanceHero
        title="Alt Text for Complex Images: When It’s Enough—and When It Isn’t"
        subtitle="How to apply W3C guidance for images, and how STEM-Accessibility supports long descriptions for complex graphics."
      />

      <GuidanceSection id="purpose" title="Purpose & Audience">
        <p>
          This page explains how to determine appropriate text alternatives for images, based on W3C guidance.
          It is intended for accessibility coordinators, content creators, and developers who need to provide
          accessible alternatives for charts, diagrams, and other complex graphics.
        </p>
      </GuidanceSection>

      <GuidanceSection id="alt-basics" title="What the alt Attribute Is Designed to Do">
        <p>
          The <code>alt</code> attribute provides a short text alternative for an image. It helps users who cannot
          perceive the image understand its role or meaning in context.
        </p>
        <p>
          Alt text works well for simple images (e.g., a photo with a straightforward purpose), but it is not designed
          to fully communicate complex visual information such as charts, process diagrams, or multi-step flowcharts.
        </p>
        <Callout tone="neutral">
          Alt text is a short alternative. For complex images, users typically need a longer, structured description.
        </Callout>
      </GuidanceSection>

      <GuidanceSection id="decision-tree" title="Deciding What to Put in alt Text">
        <p>
          Use the checklist below to determine when to write concise alt text, when to use empty alt for decorative or
          redundant images, and when a separate long description is needed.
        </p>
        <DecisionTreeChecklist />
        <SourceNote>
          Adapted from W3C’s Images Tutorial (Alt Decision Tree).
        </SourceNote>
      </GuidanceSection>

      <GuidanceSection id="where-it-breaks" title="When alt Text Is Not Enough">
        <p>
          Some images contain substantial information—more than can be conveyed in a short phrase or sentence. These
          “complex images” often require an additional long description so users can access the essential information.
        </p>
        <ul>
          <li>Charts and graphs with trends, comparisons, or multiple encodings</li>
          <li>Flowcharts and workflows with branching logic and decision points</li>
          <li>Instructional diagrams where understanding depends on relationships and structure</li>
          <li>Infographics that combine text, icons, and spatial layout to convey meaning</li>
        </ul>
      </GuidanceSection>

      <GuidanceSection id="two-part" title="The Two-Part Text Alternative for Complex Images">
        <TwoPartAlternative />
      </GuidanceSection>

      <GuidanceSection id="stuck" title="Where Teams Commonly Get Stuck">
        <ul>
          <li>What level of detail belongs in the long description?</li>
          <li>Where should the long description live so users can reliably find it?</li>
          <li>How do we keep accessible content updated when graphics change?</li>
          <li>How do we avoid rewriting descriptions whenever content is moved or reused?</li>
        </ul>
      </GuidanceSection>

      <GuidanceSection id="accessflow" title="How STEM-Accessibility Supports Long Descriptions for Complex Images">
        <p>
          STEM-Accessibility operationalizes this guidance by separating the accessible representation from the original visual
          asset—while keeping them permanently linked.
        </p>
        <ul>
          <li>Generate structure-preserving accessible representations aligned with WCAG intent</li>
          <li>Publish accessible outputs at stable permalinks that can be embedded adjacent to images</li>
          <li>Update accessible representations over time without breaking links</li>
          <li>Support multiple output formats (e.g., long descriptions, navigable representations, supporting tables)</li>
        </ul>

        <Callout tone="emphasis">
          Make the link once. Update the accessible representation whenever needed—without breaking the link.
        </Callout>
      </GuidanceSection>

      
      <GuidanceSection id="how-to-use" title="How to Use This Guidance">
        <p>
          Use this page to understand how to choose appropriate text alternatives. Use STEM-Accessibility when you need to apply
          these practices consistently across many complex graphics and maintain permanent links over time.
        </p>
      </GuidanceSection>

      <SoftCTA
        title="Need a scalable way to publish long descriptions for complex graphics?"
        body="STEM-Accessibility provides a centralized system to generate and maintain accessible representations using permanent links."
        primaryText="See how STEM-Accessibility works"
        primaryHref="/#how-it-works"
      />
    </main>
  );
};

export default AltTextGuidancePage;
