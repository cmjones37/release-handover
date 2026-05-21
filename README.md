[![PRD](https://img.shields.io/badge/PRD-documented-3c4f2c?style=flat-square)](./docs/PRD.md)

The thinking behind this project is documented in the [PRD](./docs/PRD.md).

---

## Background

Every release cycle ends the same way: the PRD is done, the feature is shipped, and then the same information gets manually rewritten four or five times for four or five different audiences. The services team needs to know what edge cases to watch for. Leadership wants the business outcome in two bullet points. Marketing needs to know which customers to talk to and what to say. Customers need to understand what changed and why it matters to them. None of this is in the PRD in the right form — it all has to be extracted, reframed, and rewritten by hand, usually under pressure at the end of a sprint.

I built Release Handover to address the extraction problem specifically. The idea is straightforward: a PM pastes a PRD, selects the stakeholders they need to communicate with, and the tool generates a tailored first-draft output for each one — customer release notes, a GTM brief, a services support guide, and a leadership summary. Each output is shaped for its audience in language, format, and level of detail. The PRD stays as the single source of truth; Release Handover makes that truth legible to everyone who needs it.

The decision to anchor this in PRD input rather than code diffs or repo connections was deliberate. PMs are the ones running release communications, and a PRD is the one artefact a PM always has regardless of how technical their environment is. Starting there keeps the tool genuinely PM-led rather than engineering-adjacent. Code diff input is a planned future iteration once the core extraction logic is validated.

---

## Features

- Paste any PRD and select one or more stakeholder output types in a single workflow
- Generates separate, downloadable markdown files per stakeholder — one for customers, one for GTM, one for services, one for leadership
- Customer output rewrites user story benefit clauses into plain-language, second-person release notes
- GTM output extracts named personas from user stories and frames honest positioning language grounded in what the PRD actually describes — not what could be claimed
- Services output surfaces edge cases, assumptions, and risks reframed as escalation triggers, so support teams are briefed before customer queries arrive
- Leadership output focuses on goals met and success metrics, stripping operational detail that isn't relevant at that level
- Inline quality signals flag gaps in the source PRD — missing sections, generic user story subjects, scope-driven absences — so the PM knows what to review before distributing

---

## Accessibility

The interface meets WCAG 2.1 AA standards throughout. Semantic HTML elements are used for all structural and interactive components. All interactive elements have visible focus states. Form inputs are associated with labels. Decorative elements carry `aria-hidden="true"`. Colour contrast on all text and background combinations meets AA thresholds.

---

## Performance

Release Handover is built on a vanilla HTML, CSS, and JavaScript stack with no npm dependencies and no client-side build step, consistent with the rest of the portfolio. The only external dependency is the Claude API, called via a server-side proxy to keep the API key out of the browser. No frameworks, no bundler, no unnecessary overhead.

---

## AI Integration

The core of this project is prompt architecture — four distinct Claude API prompts, each designed to extract and transform a different slice of the same PRD for a different audience. Writing those prompts was a product design problem as much as a technical one: which sections does each stakeholder actually need, what transformation is appropriate (rewrite, reframe, filter, or lift as-is), and what should the model do when the source material is thin or absent.

The hallucination risk is real and was treated as a first-class concern from the start. Each prompt explicitly instructs the model to extract only from specified PRD sections and to flag gaps rather than infer or embellish — particularly for the GTM output, where the temptation to overstate scope is highest. Outputs are framed as first drafts requiring PM review, which is the honest position: the tool accelerates the work, it doesn't replace the judgement.
