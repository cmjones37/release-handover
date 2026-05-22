# Release Handover: Turning PRDs into stakeholder-ready communications

[<img src="docs/prd-icon.PNG" width="60" alt="PRD icon" />](./docs/PRD.md) The thinking behind this project is documented in the [PRD](./docs/PRD.md).

---

## Overview

Release Handover is an AI-powered tool that takes a PRD as input and generates tailored first-draft communications for four stakeholder audiences: customers, GTM, services, and leadership. Each output is shaped for its audience in language, format, and level of detail. The PRD stays as the single source of truth; Release Handover makes that truth legible to everyone who needs it.

---

## Background

Every release cycle ends the same way. The PRD is done, the feature is shipped, and then the same information gets manually rewritten four or five times for four or five different audiences. The services team needs to know what edge cases to watch for. Leadership wants the business outcome in two bullet points. Marketing needs to know which customers to talk to and what to say. Customers need to understand what changed and why it matters to them. None of that is in the PRD in the right form — it all has to be extracted, reframed, and rewritten by hand, usually under pressure at the end of a sprint.

I built Release Handover to address the extraction problem specifically. The decision to anchor the tool in PRD input rather than code diffs or repo connections was deliberate. PMs are the ones running release communications, and a PRD is the one artefact a PM always has regardless of how technical their environment is. Starting there keeps the tool genuinely PM-led rather than engineering-adjacent.

The core of this project is prompt architecture — four distinct Claude API prompts, each designed to extract and transform a different slice of the same PRD for a different audience. Writing those prompts was a product design problem as much as a technical one: which sections does each stakeholder actually need, what transformation is appropriate (rewrite, reframe, filter, or lift as-is), and what should the model do when the source material is thin or absent. Hallucination risk was treated as a first-class concern from the start: each prompt instructs the model to extract only from specified PRD sections and to flag gaps rather than infer or embellish. Outputs are framed as first drafts requiring PM review, which is the honest position — the tool accelerates the work, it doesn't replace the judgement.

---

## Features

- Paste any PRD and select one or more stakeholder output types in a single workflow
- Generates separate downloadable Markdown files per stakeholder — customer release notes, GTM brief, services support guide, leadership summary
- Customer output rewrites user story benefit clauses into plain-language, second-person release notes
- GTM output extracts named personas and frames positioning language grounded in what the PRD actually describes
- Services output surfaces edge cases, assumptions, and risks reframed as escalation triggers
- Leadership output focuses on goals met and success metrics, stripping operational detail
- Inline quality signals flag gaps in the source PRD — missing sections, generic user story subjects, scope-driven absences — so the PM knows what to review before distributing

---

## Accessibility

The interface meets WCAG 2.1 AA standards throughout. Semantic HTML elements are used for all structural and interactive components. All interactive elements have visible focus states. Form inputs are associated with labels. Decorative elements carry `aria-hidden="true"`. Colour contrast on all text and background combinations meets AA thresholds.

---

## Performance

Built on a vanilla HTML, CSS, and JavaScript stack with no npm dependencies and no client-side build step. The only external dependency is the Claude API, called via a server-side proxy to keep the API key out of the browser. No frameworks, no bundler, no unnecessary overhead.

---

## AI Integration

The core of this project is prompt architecture — four distinct Claude API prompts designed to extract and transform a different slice of the same PRD for a different audience. Each prompt explicitly instructs the model to flag gaps rather than infer or embellish, particularly for the GTM output where the temptation to overstate scope is highest. Code diff input is a planned future iteration once the core extraction logic is validated.
