# Dependabot PR Review Checklist

> Senior engineer review framework for Dependabot pull requests in a solo JavaScript/TypeScript/Next.js repository.

**Goal:** Reduce noise while preventing breaking changes.

---

## Quick Decision Matrix

| Condition | Action |
|-----------|--------|
| ✅ All AUTO-MERGE criteria met | **AUTO-MERGE** |
| ❌ Any MANUAL REVIEW trigger | **MANUAL REVIEW** |

---

## AUTO-MERGE Criteria

**ALL of the following must be true:**

- [ ] Pull request author is `dependabot[bot]`
- [ ] Changes ONLY modify dependency files:
  - [ ] `package.json`
  - [ ] `package-lock.json`
  - [ ] `pnpm-lock.yaml` (if applicable)
  - [ ] `yarn.lock` (if applicable)
- [ ] Update type is **PATCH** or **MINOR** (semver)
- [ ] No application source code changes included
- [ ] No breaking change indicated in:
  - [ ] Release notes
  - [ ] PR description
  - [ ] Changelog

---

## MANUAL REVIEW Triggers

**STOP AND ASK if ANY of the following are true:**

- [ ] Update is a **MAJOR** version bump
- [ ] Core framework dependencies involved:
  - [ ] `next`
  - [ ] `react`
  - [ ] `react-dom`
- [ ] PR touches critical systems:
  - [ ] Runtime dependencies
  - [ ] Authentication libraries
  - [ ] Database clients
  - [ ] Build tooling
- [ ] PR modifies application source code
- [ ] PR includes:
  - [ ] Peer dependency warnings
  - [ ] Install errors
  - [ ] Build failures
- [ ] PR description mentions:
  - [ ] Breaking changes
  - [ ] Migrations required
  - [ ] Deprecations
  - [ ] API changes

---

## Review Process

### Step 1: Identify Update Type

```bash
# Check the PR title/description for semver type
- patch: 1.2.3 → 1.2.4
- minor: 1.2.3 → 1.3.0
- major: 1.2.3 → 2.0.0
```

**Update Type:** `[ ] PATCH` `[ ] MINOR` `[ ] MAJOR`

---

### Step 2: Identify Dependency Category

**Category:** `[ ] Framework` `[ ] Runtime` `[ ] Tooling` `[ ] UI` `[ ] Utility` `[ ] Other`

| Category | Examples | Risk Level |
|----------|----------|------------|
| Framework | next, react, react-dom | 🔴 High |
| Runtime | node-fetch, axios | 🟡 Medium |
| Auth | @supabase/*, next-auth | 🔴 High |
| Database | pg, prisma | 🔴 High |
| Build Tooling | webpack, vite, esbuild | 🟡 Medium |
| UI | @radix-ui/*, lucide-react | 🟢 Low |
| Utility | date-fns, clsx, lodash | 🟢 Low |

---

### Step 3: Confirm File Changes

**Files Changed:**
```
[ ] package.json
[ ] package-lock.json
[ ] Other dependency files: ________________
[ ] Application source code: ________________
```

**Only dependency files?** `[ ] Yes` `[ ] No`

---

### Step 4: Risk Assessment

**Risk Factors:**
- [ ] Major version bump
- [ ] Core framework dependency
- [ ] Critical system (auth/db/runtime)
- [ ] Breaking changes mentioned
- [ ] Source code modifications
- [ ] Build/test failures

**Risk Level:** `[ ] Low` `[ ] Medium` `[ ] High`

---

### Step 5: Decision

**Decision:** `[ ] AUTO-MERGE` `[ ] MANUAL REVIEW`

**Reason:** 
```
[1-2 sentence summary of why this decision was made]
```

---

## Review Template

Copy this template for each PR review:

```markdown
## Dependabot PR Review

**PR:** #[number] - [package-name] from [old-version] to [new-version]
**Author:** [author]
**Update Type:** [PATCH/MINOR/MAJOR]

### Files Changed
- [ ] package.json
- [ ] package-lock.json
- [ ] Other: _______________

### Dependency Category
[ ] Framework | [ ] Runtime | [ ] Auth | [ ] Database | [ ] Build | [ ] UI | [ ] Utility

### Risk Assessment
**Risk Level:** [ ] Low | [ ] Medium | [ ] High

**Risk Factors:**
- [Factor 1]
- [Factor 2]

### Decision
**Decision:** [ ] AUTO-MERGE | [ ] MANUAL REVIEW

**Reason:**
[1-2 sentence explanation]

### Notes
[Any additional context or concerns]
```

---

## Common Scenarios

### ✅ Safe to Auto-Merge

**Example:** `date-fns` patch update (2.30.0 → 2.30.1)
- ✅ Patch update
- ✅ Utility library
- ✅ Only dependency files changed
- ✅ No breaking changes
- **Decision:** AUTO-MERGE
- **Risk:** Low

---

### ⚠️ Requires Manual Review

**Example:** `next` minor update (15.3.2 → 15.4.0)
- ❌ Core framework
- ✅ Minor update (but framework = manual review)
- **Decision:** MANUAL REVIEW
- **Risk:** High

---

### 🛑 Definitely Manual Review

**Example:** `@supabase/supabase-js` major update (2.49.10 → 3.0.0)
- ❌ Major version bump
- ❌ Critical auth/database dependency
- ❌ Likely breaking changes
- **Decision:** MANUAL REVIEW
- **Risk:** High

---

## Special Cases

### Peer Dependency Warnings

If PR shows peer dependency warnings:
- [ ] Check if warnings are new
- [ ] Verify compatibility with current versions
- [ ] **Decision:** MANUAL REVIEW (until verified)

### Build/Test Failures

If CI shows failures:
- [ ] Review error messages
- [ ] Check if related to dependency update
- [ ] **Decision:** MANUAL REVIEW (always)

### Multiple Dependencies

If PR updates multiple packages:
- [ ] Review each dependency individually
- [ ] Check for interaction effects
- [ ] **Decision:** MANUAL REVIEW if any dependency fails criteria

---

## Quick Reference: Always Manual Review

These dependencies **always** require manual review regardless of update type:

- `next`
- `react`
- `react-dom`
- `@supabase/supabase-js`
- `@supabase/ssr`
- `typescript`
- `jest` / testing frameworks
- Database clients (`pg`, `prisma`, etc.)
- Authentication libraries

---

## Notes

- When in doubt, choose **MANUAL REVIEW**
- Major updates to any dependency = **MANUAL REVIEW**
- Framework/core dependencies = **MANUAL REVIEW**
- Breaking changes mentioned = **MANUAL REVIEW**

---

**Last Updated:** [Date]
**Maintained By:** Senior Engineering Review Process

