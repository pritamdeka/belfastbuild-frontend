# Legacy Design — Dark/Neon (snapshot 2026-06-03)

This folder is a frozen snapshot of the original BelfastBuild AI UI that
shipped in v1.0 (see `agent.md.txt` section 8). The current default
(`app/page.tsx` and friends) is the new elegant light/dark-split build
delivered as part of the design refresh.

## When to use this snapshot

* You preferred the original moody, animated, all-dark look.
* You want to A/B test the two designs.
* You need to inspect the original Framer Motion choreography.

## How to restore

```powershell
cd E:\BelfastBuildAI
copy /Y frontend\_legacy_dark\page.tsx        frontend\app\page.tsx
copy /Y frontend\_legacy_dark\page.module.css frontend\app\page.module.css
copy /Y frontend\_legacy_dark\globals.css     frontend\app\globals.css
copy /Y frontend\_legacy_dark\layout.tsx      frontend\app\layout.tsx
cd frontend
npm run build
```

The original layout used a single `framer-motion` hero with conic-gradient
score rings, neon orbs, and a fully-dark palette. CSS variables were
`--ink-900 / --ink-800 / --ink-700 / --emerald-500 / --rose-500`. There
was no theme toggle — the design was always dark.

## Don't edit these files

This is a snapshot. Make any new design edits in `frontend/app/` and
copy fresh versions here if you need a second reference point.
