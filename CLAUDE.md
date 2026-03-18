@AGENTS.md

## Workflow: GitHub Issues → Pull Requests

Whenever we open a GitHub issue and begin working on it:

1. Create a new branch named `issue-<number>-<short-description>` (e.g. `issue-1-fix-phone-duplication`)
2. Do all work on that branch — never commit directly to `main`
3. When the work is complete, open a pull request on GitHub that references the issue (e.g. "Closes #1" in the PR body)
4. The PR title should match the issue title format: `fix:`, `feat:`, or `refactor:` prefix

```bash
# Example flow for issue #1
git checkout -b issue-1-fix-phone-duplication
# ... make changes ...
git push -u origin issue-1-fix-phone-duplication
gh pr create --title "fix: Phone number duplicates and appends to last_name" --body "Closes #1"
```
