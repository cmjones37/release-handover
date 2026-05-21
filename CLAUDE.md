# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

Release Handover is a single-page web app for product managers. Paste a PRD, select stakeholders, and generate tailored release communications (Customer, GTM, Services, Leadership) as downloadable `.md` files.

The PRD that defines this tool lives at `docs/PRD.md`.

## Stack

Vanilla HTML, CSS, and JavaScript frontend. No frontend npm or build pipeline. `server.js` serves static files and proxies `/api/generate` to the Claude API — the key never touches the browser.

## Running Locally

```powershell
# 1. Create your .env file from the example
copy .env.example .env
# Edit .env and replace sk-ant-... with your real key

# 2. Start the server (Node 20.6+ reads .env natively)
node --env-file=.env server.js

# 3. Open http://localhost:3000
```

`.env` is gitignored — never commit it.

## Architecture

| File | Purpose |
|---|---|
| `index.html` | Single-page app entry point |
| `styles.css` | Portfolio design tokens + UI styles |
| `scripts.js` | Frontend logic — input, generation, output cards, download |
| `server.js` | Local dev server; serves static files + proxies `/api/generate` to Claude API |
| `lib/prompts.js` | All four stakeholder prompts — required by `server.js` |

## API approach

`server.js` proxies requests to `api.anthropic.com` — the browser calls `/api/generate` and the server makes the Claude API call. Direct browser-to-API calls don't work due to CORS (Anthropic's API returns 400 on preflight OPTIONS requests). **Do not attempt to call the API directly from the browser.**

When deploying live, a serverless function (e.g. Netlify Functions) should replace `server.js` as the proxy, with `ANTHROPIC_API_KEY` set as an environment variable in the host's settings.

## Prompt architecture

Four stakeholder prompts in `lib/prompts.js`, each extracting from specific PRD sections per the mapping in `docs/PRD.md` Section 4:

- **Customer** — user story benefit clauses + user-visible FRs → second-person release notes
- **GTM** — personas from user stories (fallback: Goals/Background) + success metrics + Future Iterations as scope boundary
- **Services** — all edge cases + all assumptions + High/Medium risks reframed as escalation triggers
- **Leadership** — Goals + Background + Success Metrics + strategic-only risks

Model: `claude-sonnet-4-6`, `max_tokens: 2048`

## Frontend state

`scripts.js` maintains an `outputs` object keyed by stakeholder. Each entry tracks `{ status, content, element }`. Cards are created dynamically on generate; clicking Generate always regenerates all selected stakeholders. Generated content lands in an editable textarea — changes sync back to `outputs[stakeholder].content` before download.

## Design system

Fonts: Cormorant Garamond (headings), Jost (body), DM Mono (labels/code). Tokens defined in `:root` in `styles.css` — warm parchment backgrounds, teal accents.
