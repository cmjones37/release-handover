# PRD: Release Handover — Christine Jones

## 1. Overview

### Purpose

Release Handover is a web-based document generation tool for product managers. It takes a PRD as input and produces tailored release documentation for each relevant stakeholder — customers, services teams, GTM (marketing and sales), and leadership — as separate, downloadable markdown files. Each output is shaped for its audience: language, format, level of detail, and framing are all adjusted per stakeholder rather than produced once and distributed unchanged.

The tool is designed to reduce the manual effort PMs spend translating the same product information into four different communication formats after every release, and to improve the quality and consistency of those communications across the organisation.

### Goals

- Eliminate the manual translation layer between a completed PRD and stakeholder-ready release communications
- Ensure every stakeholder receives information shaped for their context — not a copy of the PRD reformatted
- Surface GTM-relevant persona and market fit signals from user stories and goals, reducing the risk of sales language drifting from what was actually built
- Give services teams the edge case and assumption context they need to support customers confidently from day one of a release
- Demonstrate a repeatable, PM-led approach to release communication that can be tested against multiple PRDs and iterated over time

### Background

Release communications are one of the most consistently underinvested parts of a product cycle. A PRD is written with care, reviewed, iterated — and then the information it contains gets manually re-summarised four or five times by the same PM for different audiences, often under time pressure at the end of a sprint or release cycle. The result is inconsistency: the services team gets a Slack message, leadership gets a bullet point in a weekly update, customers get a changelog entry that was written in ten minutes. The information exists — it just never gets translated systematically.

The standard response to this problem is templates: a standard release notes template, a standard services briefing format. Templates help with format but not with extraction — a PM still has to read the PRD, decide what is relevant for each audience, rewrite it in the appropriate register, and assemble it manually. For a PM working across multiple products or managing frequent release cycles, this compounds quickly.

Release Handover addresses the extraction problem directly. By analysing a PRD and applying stakeholder-specific logic — which sections are relevant, what transformation is needed, what tone and framing is appropriate — the tool produces a first-draft set of release communications that a PM can review, adjust, and publish. The PRD remains the single source of truth; the tool makes that truth legible to every audience that needs it.

---

## 2. User Stories

| ID | User Story | Acceptance Criteria |
|---|---|---|
| US1 | As a product manager, I want to paste a PRD and select which stakeholders to generate outputs for, so I can produce all release communications from a single workflow | All selected stakeholder outputs are generated and available for download as separate markdown files |
| US2 | As a product manager, I want each output to be shaped for its audience in language and format, so I can share it directly without significant manual editing | Each output uses the correct tone, structure, and level of detail for its stakeholder without requiring rewriting of the core content |
| US3 | As a product manager, I want the customer-facing output to describe features in benefit language, so I can publish release notes that are meaningful to end users rather than internal | Customer output uses second-person, benefit-led language and excludes internal terminology and NFRs |
| US4 | As a product manager, I want the GTM output to identify which personas benefit and recommend honest positioning language, so sales and marketing can communicate the release accurately | GTM output names relevant personas drawn from user stories and goals, and frames benefit language that reflects what was actually built |
| US5 | As a product manager, I want the services output to include edge cases, assumptions, and risk flags, so the support team has the context they need before customer queries arrive | Services output includes all edge cases, relevant assumptions, and risks reframed as escalation triggers |
| US6 | As a product manager, I want the leadership output to focus on business outcomes and strategic framing, so I can brief senior stakeholders without them needing to read the full PRD | Leadership output leads with goals and success metrics and excludes operational detail and risks below strategic threshold |

---

## 3. Requirements

### Functional Requirements

| ID | Requirement |
|---|---|
| FR1 | The tool must accept a PRD as pasted text input |
| FR2 | The tool must allow the PM to select one or more stakeholder output types before generating |
| FR3 | The tool must generate a separate output file for each selected stakeholder |
| FR4 | Each output must be generated via a stakeholder-specific Claude API prompt that controls tone, section selection, and format |
| FR5 | The customer output must rewrite user story benefit clauses into second-person, plain-language feature descriptions and exclude non-functional requirements |
| FR6 | The GTM output must extract persona references from user stories and, where user stories are insufficiently specific, fall back to Goals and Background to construct audience framing |
| FR7 | The GTM output must include recommended positioning language that is grounded in what the PRD describes — it must not introduce claims beyond the documented scope |
| FR8 | The services output must include all edge cases, all assumptions, and risks with High or Medium impact reframed as escalation triggers |
| FR9 | The leadership output must include Goals and Success Metrics and must exclude operational risks and implementation detail |
| FR10 | All outputs must be downloadable as `.md` files, one per stakeholder |
| FR11 | The tool must display generated outputs in-browser before download so the PM can review them |

### Non-Functional Requirements

| ID | Requirement |
|---|---|
| NFR1 | The tool must be a single-page web application requiring no installation or account creation |
| NFR2 | All Claude API calls must be made via a server-side proxy or equivalent secure pattern such that the API key is never exposed in client-side code or browser requests |
| NFR3 | The tool must handle PRDs up to approximately 4,000 words without truncation or degraded output quality |
| NFR4 | Generated outputs must be returned within 30 seconds per stakeholder under normal API response conditions |
| NFR5 | The interface must be usable on desktop without requiring a specific browser; no mobile optimisation is required for v1 |
| NFR6 | The tool must use the design system tokens and aesthetic established for the Christine Jones portfolio |

---

## 4. Extraction and Prompt Architecture

This section documents the logic that maps PRD content to stakeholder outputs. It is the architectural core of Release Handover — the quality of every output depends on how well this mapping is specified.

### PRD Section to Stakeholder Mapping

| PRD Section | Customer | GTM | Services | Leadership |
|---|---|---|---|---|
| Overview — Goals | — | ✓ (fallback for personas) | — | ✓ (primary) |
| Overview — Background | — | ✓ (fallback for market framing) | — | ✓ (strategic context) |
| User Stories | ✓ (benefit clauses) | ✓ (primary — persona extraction) | ✓ (intended user intent) | — |
| Functional Requirements | ✓ (user-visible only) | — | ✓ (intended behaviour) | — |
| Non-Functional Requirements | — | — | — | — |
| Edge Cases | — | — | ✓ (primary) | — |
| Assumptions | — | — | ✓ (primary) | — |
| Success Metrics | — | ✓ (outcome signals) | — | ✓ (primary) |
| Risks and Mitigations | — | — | ✓ (High/Medium only, reframed) | ✓ (strategic only) |
| Future Iterations | — | ✓ (scope boundary — what not to sell) | — | — |

### Prompt Design Principles

Each stakeholder prompt instructs Claude to:

1. Extract only from the mapped sections above — not summarise the whole PRD
2. Apply the correct transformation for that stakeholder (rewrite, reframe, filter, or lift)
3. Use the defined tone and format for the output type
4. Flag where source material is insufficient — for example, if user stories use generic subject types, the GTM prompt must note that persona extraction was limited and fell back to Goals

### Output Formats

| Stakeholder | Format | Structure |
|---|---|---|
| Customer | Markdown | `## What's New` followed by benefit-led bullet points; `## Changelog` with a one-line summary entry |
| GTM | Markdown | `## Who Benefits` (personas), `## What Changed` (outcomes), `## Suggested Positioning` (honest framing language) |
| Services | Markdown | `## What Shipped` (brief), `## How It Should Work` (intended behaviour), `## Watch For` (edge cases and assumptions), `## Escalation Triggers` (risks) |
| Leadership | Markdown | `## What We Shipped` (goals met), `## Business Impact` (metrics and targets), `## Strategic Context` (one paragraph) |

### PRD Quality Signal

The quality of GTM output is directly dependent on the specificity of user stories. A user story with a generic subject ("as a user") produces a weak persona extraction. This is an intentional design constraint — Release Handover will surface a quality warning in the GTM output when no named persona type is found in user stories, prompting the PM to either revise the PRD or manually supplement the output.

---

## 5. Edge Cases and Assumptions

### Edge Cases

| ID | Scenario | Handling Strategy |
|---|---|---|
| EC1 | PRD is pasted without all standard sections present | The tool must identify which sections are missing, generate outputs from available sections, and annotate each output with a notice indicating which source sections were absent |
| EC2 | User stories use generic subject types ("as a user") | GTM output includes an inline quality warning; persona section falls back to Goals and Background with a note that user stories were insufficiently specific |
| EC3 | PRD contains scope decisions that result in absent or minimal content in sections the tool expects to extract from | The tool must flag the specific gap inline in the affected output rather than omitting that portion silently, so the PM knows to review and supplement manually before distributing |
| EC4 | PRD contains no success metrics | Leadership output omits the Business Impact section and includes a notice that no metrics were available |
| EC5 | API call times out or returns an error for one stakeholder | The tool must display an error state for the affected output only; other successfully generated outputs must remain available for download |
| EC6 | PRD exceeds the practical context window for a single API call | The tool must detect approximate input length and warn the PM before generation if truncation is likely |

### Assumptions

- PMs using the tool will have a completed PRD that follows a consistent structure — outputs will degrade gracefully but not predictably for unstructured input
- PRDs produced within this portfolio will always include success metrics per the canonical PRD skill; EC4 applies primarily to external or informally structured PRD inputs
- Stakeholder output quality will be sufficient for review-and-edit use, not zero-edit publishing — a PM review step is expected before distribution
- The design system tokens from the portfolio are sufficient for the tool's interface without introducing new visual patterns

---

## 6. Success Metrics

| Metric | Description | Target |
|---|---|---|
| Output completeness | Each generated output covers all mapped sections without unexplained gaps | All four outputs complete for a well-formed PRD input in 100% of test runs. |
| Persona extraction accuracy | GTM output correctly identifies the personas named in user stories | Correct extraction with no hallucinated personas in 100% of test runs against portfolio PRDs. |
| Services coverage | Services output includes all edge cases and assumptions present in the source PRD | Zero omissions in 100% of test runs against portfolio PRDs. |
| Time to first output | Time from generation trigger to first displayed output | Under 30 seconds per stakeholder on standard API response times. |
| PM editing burden | Qualitative assessment of how much editing is required before an output is distribution-ready | Outputs require light editing (tone, minor corrections) rather than structural rewriting — validated by self-assessment across at least three PRD test runs. |

---

## 7. Dependencies

- **Claude API (claude-sonnet-4-20250514)** — powers all extraction and generation; all four stakeholder prompts are API calls to this model
- **Anthropic API key** — required for API calls; stored server-side and never exposed in client code or browser requests
- **Server-side proxy** — required to handle API calls securely; must be in place before v1 ships
- **Portfolio design system** — CSS tokens, typography, and component patterns from the Christine Jones portfolio applied to the tool interface
- No npm dependencies — intentional; vanilla HTML, CSS, and JS stack consistent with portfolio conventions

---

## 8. Risks and Mitigations

| Risk | Impact | Mitigation Strategy |
|---|---|---|
| API hallucination introduces claims not present in the PRD | High | Prompts explicitly instruct the model to extract only from specified sections and flag rather than infer when source material is absent; outputs are framed as first drafts requiring PM review |
| PRD input quality is too low for useful extraction | Medium | Tool provides inline quality signals (missing sections, generic user stories, scope-driven gaps) rather than silently producing thin output; PM is prompted to address gaps before distributing |
| GTM output overstates scope due to ambiguous PRD language | High | GTM prompt includes explicit instruction to scope positioning language to documented requirements only; Future Iterations section of the PRD is used as a scope boundary to exclude unshipped work |
| Output format inconsistency across multiple generation runs | Low–Medium | Prompts specify exact output structure including section headers; format is validated against expected structure before download is made available |

---

## 9. Future Iterations

The following are known gaps or planned improvements that are out of scope for the current version but will be addressed in future iterations.

- **Code diff input** — allow PMs to paste or upload a code diff alongside or instead of a PRD, extending the tool's usefulness beyond PM-led workflows to engineering-led releases
- **Presentation output for services** — generate a `.pptx` slide deck for the services stakeholder in addition to the markdown support guide, reflecting the reality that services briefings are commonly delivered as presentations
- **Tech writer output** — a documentation delta output identifying which documented workflows or UI elements have changed, formatted as a checklist for a technical writer to action
- **Multi-feature bundling** — support for combining multiple PRDs or feature inputs into a single release communication set, for teams that ship in batches

---

## 10. Open Questions

These questions are intended for stakeholder review and will shape future iterations. They are left open deliberately — this PRD is a living document.

1. **Output tone calibration** — how much editorial adjustment is typically needed before outputs are distribution-ready? Running the tool against existing portfolio PRDs will provide initial signal, but real-world use across different PRD styles may reveal systematic tone or framing issues that warrant prompt refinement.
2. **GTM fallback quality** — when user stories are insufficiently specific and the GTM prompt falls back to Goals and Background, how useful is the resulting output in practice? This is an open question until tested against a PRD with strong goals but weak user stories.
3. **PRD format tolerance** — Release Handover is designed and tested against PRDs that follow the portfolio's canonical structure. How degraded are outputs when the input is a PRD from a different organisation with a different structure? This matters if the tool is positioned as generally applicable rather than portfolio-specific.
