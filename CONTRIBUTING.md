# Contributing – Team 02 Book Store

This is how every change gets from a Jira task to production. **No exceptions**: the lecturer grades branches, reviewed PRs, commit messages and tags (criterion S5, every Sprint).

## 0. Repository roles & protection

| Member | GitHub role | Can do |
|---|---|---|
| **Dương Chí Thiện** | **Owner / Admin** (repo created under his account or org) | Full control: settings, rulesets, secrets, Vercel/Supabase integration, tags, emergency bypass |
| Bùi Gia Phát | Collaborator – **Write** | Push feature branches, open/review/merge PRs (after approvals) |
| Dương Ngọc Linh Đan | Collaborator – **Write** | Push feature branches, open/review/merge PRs (after approvals) |
| Lecturer | Collaborator – **Read** | View code, PRs, history (grading) |

**Ruleset "protect main & develop"** (*Settings → Rules → Rulesets*, target: `main`, `develop`). Thiện configures it:
- ✅ Restrict deletions · ✅ Block force pushes
- ✅ Require a pull request before merging
  - Required approvals: **1**
  - ✅ Dismiss stale approvals when new commits are pushed
  - ✅ Require review from Code Owners
  - ✅ Require approval of the most recent reviewable push
  - ✅ Require conversation resolution before merging
- ✅ Require status checks to pass → `build-and-test` (CI); ✅ branch must be up to date
- Allowed merge methods: **Squash** (feature → develop), **Merge commit** (develop → main)
- **Bypass list: Repository admin (Thiện)**, mode *"For pull requests only"*. Use it **only in an emergency** (e.g. a reviewer is unreachable on submission night). Write the reason in the PR and tell the team in Zalo. Normal work never bypasses: the lecturer checks reviewed PRs.

> Private repo + rulesets need **GitHub Pro**, free with the GitHub Student Developer Pack (Thiện's account).

`.github/CODEOWNERS` lists all three members, so GitHub automatically requests a review from the **two members who are not the author**; **one approval from either of them is enough**.

**The admin follows the same flow.** Thiện also works on feature branches and opens PRs (reviewed by Đan or Phát). The brief forbids direct commits to `main`, and the lecturer grades reviewed PRs for every member. Only exceptions: the very first scaffold commit before the ruleset is switched on, and pushing tags.

## 1. Branch model

```
main      ── production (Vercel prod URL) ── protected, tags: sprint-1, sprint-2, v1.0
  ▲  release PR at the end of each Sprint (merge commit)
develop   ── integration / staging URL ── protected
  ▲  feature PRs (squash and merge, 1 approval from another member, CI green)
feature/GB-12-register-form
fix/GB-31-pagination-off-by-one
docs/GB-40-test-cases-f2
```

- Branch from **`develop`**, name it `<type>/GB-<jira-id>-<short-slug>`.
- One branch = one Jira story or task. Keep branches short-lived (≤ 2 days).
- Never push directly to `main` or `develop` (blocked by branch protection).

## 2. Daily workflow (each developer)

```bash
# 1. Start a task: move the Jira issue to "In Progress"
git checkout develop
git pull origin develop
git checkout -b feature/GB-12-register-form

# 2. Work in small commits
git add .
git commit -m "feat(auth): add register form with zod validation (GB-12)"

# 3. Stay up to date with develop (at least once a day)
git fetch origin
git merge origin/develop         # simple and safe (recommended)
# Advanced: git rebase origin/develop, then push with
#           git push --force-with-lease   (only on YOUR feature branch, never on main/develop)

# 4. Check locally before pushing
npm run lint && npm run typecheck && npm test && npm run build

# 5. Push and open a PR into develop
git push -u origin feature/GB-12-register-form
# → GitHub shows "Compare & pull request" → base: develop
```

Then in Jira, move the issue to **"In Review"** and log the hours you spent.

## 3. Commit messages – Conventional Commits

`<type>(<scope>): <what changed> (GB-<id>)`

| type | use for |
|---|---|
| `feat` | new feature / AC |
| `fix` | bug fix |
| `test` | tests only |
| `docs` | documentation, test cases |
| `refactor` | code change with no behaviour change |
| `chore` | config, dependencies, CI |

Examples: `feat(books): soft delete hides book from customers (GB-23)` · `fix(list): keep filters when changing page (GB-35)` · `docs(test): F2 test cases (GB-28)`

## 4. Pull Request rules

- **Title:** same format as a commit, e.g. `feat(auth): register + login (GB-12)`.
- **Description:** fill in the PR template: AC checklist, test evidence, screenshots (375 / 768 / 1280 px for UI).
- **Size:** aim for < 400 changed lines. Split bigger work.
- **CI must be green** (lint, typecheck, test, build).
- **1 approval from a member who did not write the PR** (enforced by the ruleset):

| Author (opens PR) | Reviewer (either one approves) |
|---|---|
| Thiện | Đan or Phát |
| Phát | Thiện or Đan |
| Đan | Thiện or Phát |

- Spread reviews fairly: alternate reviewers so everyone has review activity in every Sprint.
- You cannot approve your own PR. If new commits are pushed after an approval, the reviewer approves again.

- Resolve every review comment (fix it or reply why not) before merging. The ruleset blocks merging while conversations are open.
- The **author merges** after approval using **Squash and merge**, then deletes the branch.
- The Vercel preview link on the PR is where the reviewer and the PO click through the AC.

## 5. How to review (reviewer checklist)

1. Read the linked story's AC in `PROJECT_SPEC.md` §7.
2. Open the **Vercel preview** and try main, exception and boundary cases.
3. Check the code: server-side validation and role check present? No secrets? No out-of-scope features? Readable?
4. Check that tests and test cases exist for every AC.
5. Choose **Approve**, or **Request changes** with specific comments (use GitHub "suggestion" blocks for small fixes).

Review within **24 hours** of being requested (within **4 hours** on submission day, Thursday); a waiting PR blocks the Sprint. The first available reviewer takes it. Mention it in the Daily Scrum if you can't.

## 6. End of Sprint – release (Sprint Leader)

```bash
# On Thursday, before submission
# 1. Open PR: develop → main, title "release: Sprint N"
# 2. List the stories included; get 1 approval from another member; merge with a MERGE COMMIT
# 3. Tag the release (Thiện as admin, or the Sprint Leader)
git checkout main && git pull
git tag -a sprint-1 -m "Sprint 1: F1 accounts & roles"
git push origin sprint-1
```
Sprint 3 uses tag `v1.0` plus `docs/release-notes.md` (features, known issues, how to run).
PM baselines: `baseline-v1.0` when the PMP is approved, `baseline-v1.1` after the Change Request is rebaselined.

## 7. Database changes (Supabase)

- Never edit tables in the Supabase dashboard by hand on production. Every schema/RLS change is a migration: `supabase migration new add_books_index`.
- Commit the `.sql` file in your PR and apply it to **staging** (`supabase db push` linked to `bookstore-staging`) so the preview works.
- At release time the Sprint Leader applies pending migrations to **production** before merging `develop → main`.
- After changing the schema, run `npm run db:types` and commit the updated `src/types/database.ts`.
- The **service-role key** is server-only: never use it in a Client Component, never prefix it with `NEXT_PUBLIC_`.

## 8. Hotfix on production

`git checkout -b fix/GB-xx-... origin/main` → PR into `main` (1 approval; admin bypass only if no reviewer is reachable before a deadline) → after merge, open a PR `main → develop` so `develop` gets the fix too.

## 9. Rules that protect our grade

- Every member must have commits and PRs **in every Sprint** (no commits in all 3 Sprints = A score 0).
- Never commit `.env`, passwords or API keys. Use `.env.example`.
- AI tools are allowed: log each use in `docs/AI_USAGE.md`. You must be able to explain any code you submit.
- Our repo, board and data are our own: never copy from other teams.
