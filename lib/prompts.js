'use strict';

const PROMPTS = {

  customer: (prd) => `You are generating a customer-facing release note from a Product Requirements Document (PRD).

EXTRACT ONLY FROM:
- User Stories: transform the "so that" benefit clauses into second-person, plain-language feature descriptions
- Functional Requirements: include only user-visible requirements

DO NOT INCLUDE:
- Non-functional requirements, infrastructure or backend changes
- Internal terminology or technical jargon
- Edge cases, assumptions, or risks

TRANSFORMATION RULES:
- Rewrite in second person ("You can now...", "It's easier to...")
- Lead with the benefit, not the capability
- If user stories are absent or all use generic subjects ("as a user"), note this at the top of the output

OUTPUT (Markdown only — no preamble, no closing remarks):

## What's New

- [Benefit-led bullet point in plain, second-person language — one per meaningful user-facing change]

## Changelog

[One-line summary suitable for a changelog entry]

---

PRD:
${prd}`,

  gtm: (prd) => `You are generating a GTM (Go-to-Market) briefing for sales and marketing from a Product Requirements Document (PRD).

EXTRACT ONLY FROM:
- User Stories (primary source): identify named persona types from the subject of each story (e.g. "as a product manager", "as an admin user")
- Goals and Background (fallback only): use ONLY if user stories contain no specific persona types
- Success Metrics: include as outcome signals in What Changed
- Future Iterations: use as a scope boundary — explicitly note what has NOT shipped

CRITICAL RULES:
- Do NOT introduce claims, personas, or positioning language beyond what the PRD explicitly documents
- If user stories use only generic subjects ("as a user"), include this warning verbatim: "⚠️ Quality note: User stories did not specify named personas. The Who Benefits section draws from Goals and Background as a fallback — consider revising user stories before distributing this output."
- Use Future Iterations to note scope: "This release does not include [X]" where relevant

OUTPUT (Markdown only — no preamble, no closing remarks):

## Who Benefits

[Named persona types and why this release is relevant to each]

## What Changed

[Outcome-focused summary drawn from success metrics and user stories]

## Suggested Positioning

[Honest, PRD-grounded framing language. Ground every claim in a documented requirement. Note scope boundaries from Future Iterations where relevant.]

---

PRD:
${prd}`,

  services: (prd) => `You are generating a services and support briefing from a Product Requirements Document (PRD).

EXTRACT ONLY FROM:
- User Stories: intended user intent (what the user is trying to accomplish)
- Functional Requirements: intended system behaviour
- Edge Cases: include ALL edge cases with their handling strategies
- Assumptions: include ALL assumptions listed
- Risks and Mitigations: ONLY High and Medium impact risks, reframed as escalation triggers

DO NOT INCLUDE:
- Low impact risks, success metrics, strategic context, or NFRs

REFRAMING RULE — Escalation Triggers: transform each risk from its documented form into "If you see [observable symptom], escalate because [business or customer impact]."

OUTPUT (Markdown only — no preamble, no closing remarks):

## What Shipped

[2–3 sentence plain description of what was released and what it enables]

## How It Should Work

[Intended behaviour for each relevant user story and functional requirement — written as expected behaviour the team can verify against]

## Watch For

[All edge cases and assumptions. Format each as:
"Edge case: [scenario] — [how the system handles it]"
"Assumption: [what the system assumes] — [what to watch for if this breaks]"]

## Escalation Triggers

[High and Medium risks only. Format each as: "If you see [observable symptom], escalate because [impact]"]

---

PRD:
${prd}`,

  leadership: (prd) => `You are generating a leadership briefing from a Product Requirements Document (PRD).

EXTRACT ONLY FROM:
- Goals (primary): what was this release designed to achieve?
- Background (strategic context): why does this matter now?
- Success Metrics (primary): how will success be measured? Include specific targets where defined.
- Risks and Mitigations: ONLY High impact risks affecting business or customer outcomes — exclude operational and implementation detail

DO NOT INCLUDE:
- Functional or non-functional requirements, edge cases, assumptions, or implementation detail
- Medium or Low risks unless they have direct strategic significance

SPECIAL CASE: If no success metrics are present in the PRD, omit the Business Impact section entirely and add: "⚠️ No success metrics were defined in the source PRD. Consider defining measurable targets before distributing this briefing."

OUTPUT (Markdown only — no preamble, no closing remarks):

## What We Shipped

[Goals met — what did we ship and what problem does it solve? 2–4 sentences.]

## Business Impact

[Success metrics and targets — one bullet per metric.]

## Strategic Context

[One paragraph: why this release matters in the broader product and business context]

---

PRD:
${prd}`

};

if (typeof module !== 'undefined') module.exports = PROMPTS;
