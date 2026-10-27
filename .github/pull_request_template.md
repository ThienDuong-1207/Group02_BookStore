## Jira
GB-<id> – <story title>  (US-xx)

## What changed
<!-- 2–4 bullet points -->
-

## Acceptance Criteria checklist
<!-- Copy the AC of the story from PROJECT_SPEC.md §7 and tick what this PR delivers -->
- [ ] M1 …
- [ ] E1 …
- [ ] B1 …

## How to test
<!-- Steps for the reviewer on the Vercel preview URL; include test accounts if needed -->
1.

## Evidence
- [ ] Automated tests added/updated (`npm test` green)
- [ ] Test cases written in `docs/test-cases/F#.md`
- [ ] Screenshots for UI changes (375 / 768 / 1280 px)
- [ ] Server-side validation / role check added where needed

## Checklist
- [ ] Branch is up to date with `develop`
- [ ] `npm run lint && npm run typecheck && npm test && npm run build` pass locally
- [ ] No secrets, no out-of-scope features (cart, payment, …)
- [ ] DB schema / RLS changed? → migration file in `supabase/migrations/` included, applied to staging, described below
- [ ] AI used? → row added to `docs/AI_USAGE.md`

## Notes for reviewer
