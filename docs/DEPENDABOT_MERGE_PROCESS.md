# Dependabot PR Merge Process

> Step-by-step guide for reviewing and merging existing Dependabot pull requests.

---

## Quick Review Process

### Step 1: Gather PR Information

For each Dependabot PR, collect:

1. **PR Title** - Usually: `Bump [package] from [old] to [new]`
2. **Package Name** - The dependency being updated
3. **Version Change** - Old → New (identify patch/minor/major)
4. **Files Changed** - Check the "Files changed" tab
5. **PR Description** - Check for breaking changes, release notes

---

### Step 2: Apply Review Checklist

Use the [Dependabot Review Checklist](./DEPENDABOT_REVIEW_CHECKLIST.md) to evaluate:

**Quick Check:**
- [ ] Is it a PATCH or MINOR update? → Continue
- [ ] Is it a MAJOR update? → **MANUAL REVIEW REQUIRED**
- [ ] Is it a framework/core dependency? → **MANUAL REVIEW REQUIRED**
- [ ] Only dependency files changed? → Continue
- [ ] Source code modified? → **MANUAL REVIEW REQUIRED**

---

### Step 3: Make Decision

**AUTO-MERGE if:**
- ✅ Patch/minor update
- ✅ Non-framework dependency
- ✅ Only `package.json` and `package-lock.json` changed
- ✅ No breaking changes mentioned
- ✅ CI tests pass

**MANUAL REVIEW if:**
- ❌ Major version update
- ❌ Framework dependency (next, react, react-dom)
- ❌ Critical system (auth, database, runtime)
- ❌ Source code changes
- ❌ Breaking changes mentioned

---

## Merge Process

### For Safe PRs (AUTO-MERGE candidates)

1. **Verify CI Status**
   ```
   ✅ All checks passing
   ✅ No build errors
   ✅ Tests passing
   ```

2. **Quick Code Review**
   - Open PR → "Files changed" tab
   - Verify only dependency files modified
   - Check for any unexpected changes

3. **Merge Options**
   - **Squash and merge** (recommended) - Clean history
   - **Merge commit** - Preserves PR history
   - **Rebase and merge** - Linear history

4. **Merge the PR**
   - Click "Merge pull request"
   - Confirm merge
   - Delete branch (auto-delete if configured)

---

### For Manual Review PRs

1. **Read Release Notes**
   - Check package's GitHub releases
   - Look for changelog/CHANGELOG.md
   - Review breaking changes section

2. **Test Locally** (if needed)
   ```bash
   # Checkout the PR branch
   git fetch origin
   git checkout dependabot/npm_and_yarn/[package]-[version]
   
   # Install dependencies
   npm install
   
   # Run tests
   npm test
   
   # Build
   npm run build
   
   # Test locally
   npm run dev
   ```

3. **Review Changes**
   - Check if any code changes needed
   - Verify compatibility
   - Test critical features

4. **Merge or Close**
   - If safe: Merge with notes
   - If risky: Close with explanation
   - If needs work: Request changes

---

## Batch Merging Strategy

If you have multiple safe PRs:

### Option 1: Merge Individually (Recommended)
- Review each PR
- Merge one at a time
- Easier to rollback if issues

### Option 2: Merge All Safe PRs
- Review all PRs first
- Merge safe ones in sequence
- Faster but less granular control

---

## Common Scenarios

### Scenario 1: Multiple Patch Updates
```
PR #1: date-fns 2.30.0 → 2.30.1 (patch)
PR #2: clsx 2.1.0 → 2.1.1 (patch)
PR #3: lucide-react 0.511.0 → 0.511.1 (patch)
```
**Action:** Review each, merge if all pass checklist ✅

---

### Scenario 2: Framework Minor Update
```
PR: next 15.3.2 → 15.4.0 (minor)
```
**Action:** MANUAL REVIEW - Check Next.js release notes, test build ✅

---

### Scenario 3: Major Version Update
```
PR: some-package 1.5.0 → 2.0.0 (major)
```
**Action:** MANUAL REVIEW - Read migration guide, test thoroughly ✅

---

### Scenario 4: Grouped PR (New Feature)
```
PR: Update safe-ui-updates group
  - @radix-ui/accordion 1.2.10 → 1.2.11
  - lucide-react 0.511.0 → 0.511.1
  - tailwind-merge 3.3.0 → 3.3.1
```
**Action:** Review as group, merge if all safe ✅

---

## Pre-Merge Checklist

Before merging ANY Dependabot PR:

- [ ] PR author is `dependabot[bot]`
- [ ] CI checks are passing
- [ ] Only dependency files changed
- [ ] No breaking changes mentioned
- [ ] Update type identified (patch/minor/major)
- [ ] Risk level assessed (low/medium/high)
- [ ] Decision made (auto-merge/manual review)

---

## Post-Merge Actions

After merging:

1. **Monitor CI/CD**
   - Watch for deployment issues
   - Check production logs

2. **Test Critical Features** (for major/minor updates)
   - Login/authentication
   - Data sync
   - Key user flows

3. **Rollback Plan** (if needed)
   ```bash
   # Revert the merge commit
   git revert [merge-commit-hash]
   ```

---

## Troubleshooting

### PR Has Merge Conflicts
1. Click "Resolve conflicts" in GitHub
2. Or update locally and push:
   ```bash
   git checkout main
   git pull
   git checkout dependabot/...
   git rebase main
   # Resolve conflicts
   git push --force-with-lease
   ```

### CI Failing
- Check error messages
- May need code changes (manual review)
- May be transient (retry)

### Dependency Conflicts
- Check if other PRs update same package
- Merge one at a time
- Resolve conflicts as needed

---

## Quick Reference

| Update Type | Framework | Action |
|-------------|-----------|--------|
| Patch | No | ✅ Auto-merge (if safe) |
| Minor | No | ✅ Auto-merge (if safe) |
| Major | No | ⚠️ Manual review |
| Any | Yes | ⚠️ Manual review |

---

**Need help reviewing a specific PR?** Share the PR details and I'll help evaluate it!

