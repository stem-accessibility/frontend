# Accessibility

STEM-Accessibility exists to make STEM visuals accessible. This document explains our accessibility commitments, what we expect from contributors, and how to report a barrier.

## Priorities

- **Accessibility target:** We aim to support [WCAG 2.2 Level AA](https://www.w3.org/TR/WCAG22). This is a goal that we are working towards. 

## Contributor expectations

If you contribute code or content, please follow these guidelines so we don't regress accessibility:

- **Testing**
  - For UI changes, run an automated accessibility tool such as [axe DevTools](https://www.deque.com/axe/devtools/) or the [GitHub Accessibility Scanner](https://github.com/github/accessibility-scanner).
  - Do at least one keyboard-only pass on any change involving interactive elements:
    - Tab order is logical, with no traps, and reaches every interactive control.
    - A visible focus indicator with sufficient contrast is always present.
    - Every action works by keyboard (Tab and Shift+Tab, Enter, Space, and arrow keys where expected).
    - You can move into and out of modals, menus, popovers, and editors.
  - Spot-check screen reader behavior for new components or significant content changes:
    - Controls have clear, accessible names that match their purpose.
    - Custom controls expose their role, name, and state (toggles, expanded, selected).
    - Dynamic updates such as errors, upload progress, and status messages are announced, for example through ARIA live regions.
- **Documentation and content**
  - Use a logical heading hierarchy and real list elements.
  - Use unique, descriptive link text (avoid "click here" or "read more").
  - Give images meaningful alternative text, following the [W3C alt decision tree](https://www.w3.org/WAI/tutorials/images/decision-tree/). For complex images or diagrams, include a text alternative nearby.
  - Don't use color as the only way to convey meaning.
  - Content should reflow without loss of information or functionality at 200% zoom and narrow widths.
- **Pull requests**
  - Describe how you checked accessibility for user-facing changes (tool, keyboard pass, screen reader).
  - If you introduce a known barrier you cannot fix in the same change, say so in the pull request and open an issue for it.

We do not yet run automated accessibility checks in continuous integration. Adding them is a planned improvement, and contributions toward it are welcome. We also plan to add a VPAT table and update it regularly.

## Reporting accessibility issues

If you run into a barrier, please tell us. We treat accessibility reports as expertise, not complaints.

1. **Open an issue:** [submit an accessibility issue on GitHub](https://github.com/stem-accessibility/frontend/issues/new), or email [stem-accessibility@uw.edu](mailto:stem-accessibility@uw.edu) if you would rather not use GitHub.
2. Include, when you can:
   - What you were trying to do and what went wrong.
   - The page URL.
   - Steps to reproduce.
   - Your operating system, browser, and assistive technology, with versions.
   - A screenshot or screen recording, if you are comfortable sharing one.
   - How severe it feels, using the [severity levels](#severity) below. Maintainers can set or adjust this during triage.

You do not need to share anything about your disability.

### Severity

- **Critical:** prevents you from completing a core task (for example, you cannot create a STEM image or read its description at all).
- **Serious:** significant difficulty, but a workaround exists.
- **Moderate:** an annoyance or inconsistent experience.
- **Minor:** a small issue with minimal impact on usability.

### How we respond

- We will acknowledge your report promptly, respectfully, and constructively.
- We will not ask you to disclose a diagnosis or other personal information.
- We will explain next steps, known limitations, and relevant dependencies.
- Where possible, we will offer a workaround while a fix is in progress.
- We will update you when the status or expected timeline changes.
- We may ask you to confirm that a fix resolves the barrier before we close the issue.
- We will thank you for helping improve the project.
- We are a small community and ask your understanding if our capacity slows responses down.

## Ownership and maintenance

Accessibility is owned by the **STEM-Accessibility maintainers** at [stem-accessibility@uw.edu](mailto:stem-accessibility@uw.edu).

The owner is responsible for:

- Triaging accessibility reports.
- Tracking accessibility work and known barriers.
- Sharing status updates and escalating unresolved risks.
- Keeping this document current.

## Supported environments

STEM-Accessibility is intended to work in the latest two versions of Chrome, Edge, Firefox, and Safari on desktop, and Safari on iOS and Chrome on Android on mobile.

We have not systematically tested every combination of browser and assistive technology. The assistive technologies we most often use and aim to support are VoiceOver (macOS and iOS), NVDA and JAWS (Windows), and TalkBack (Android). If something does not work in your setup, please report it.

## Known limitations

- The site has not had a formal accessibility audit, and we expect there are barriers we have not found yet.
- The visual editor and viewers are the most complex parts of the interface. Text, structure, and keyboard-driven alternatives exist, but they may not cover every action the visual editor offers.
- Embedded third-party content may not include captions or transcripts.

If you find a barrier, please [open an issue](https://github.com/stem-accessibility/frontend/issues/new).

## Feedback

Accessibility is an ongoing practice, not a one-time fix. If you have suggestions for improving this statement or our practices, please open an issue or a pull request.

---

This document is adapted from the [`ACCESSIBILITY.md` template](https://github.com/open-source-accessibility/accessibility-toolkit/blob/main/ACCESSIBILITY.md) in the Open Source Accessibility Toolkit (MIT licensed).
