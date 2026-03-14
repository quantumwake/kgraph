# Releasing @quantumwake/kgraph

This document covers everything needed to publish `@quantumwake/kgraph` to npm — from first-time setup through ongoing releases. All publishing is done via GitHub Actions; you never run `npm publish` locally.

---

## How It Works

```
You: bump version → commit → push → create GitHub Release
  ↓
GitHub Actions:
  1. validate   — checks git tag matches package.json version
  2. build      — npm ci, lint, tsup build
  3. verify     — examples still compile against the new build
  4. publish    — npm publish --access public --provenance
  ↓
npm: @quantumwake/kgraph@x.y.z is live
```

The publish workflow (`.github/workflows/publish.yml`) triggers on GitHub Release creation. It validates, builds, verifies, and publishes — with npm provenance for supply chain security.

A separate CI workflow (`.github/workflows/ci.yml`) runs lint + build + examples on every push and PR to `main`.

---

## One-Time Setup

Do these steps once, before the first release.

### Step 1: Create the npm Organization

The package is scoped under `@quantumwake`, so you need an npm org.

**Option A — Web UI:**
1. Go to [npmjs.com/signup](https://www.npmjs.com/signup) (or log in)
2. Go to your account → **Add Organization**
3. Name it `quantumwake`
4. Choose the free plan (public packages only)

**Option B — CLI:**
```bash
npm login                    # authenticate first
npm org create quantumwake   # create the org
```

Verify it exists:
```bash
npm org ls quantumwake
```

### Step 2: Generate an npm Access Token

The GitHub Action needs a token to publish on your behalf.

1. Go to [npmjs.com](https://www.npmjs.com/) → click your avatar → **Access Tokens**
2. Click **Generate New Token** → choose **Granular Access Token**
3. Configure:
   - **Token name:** `kgraph-github-actions`
   - **Expiration:** 365 days (or your preference)
   - **Packages and scopes:** select **Read and write**
   - **Select packages:** choose **Only select packages and scopes** → add `@quantumwake`
4. Click **Generate Token**
5. **Copy the token immediately** — you won't see it again

### Step 3: Create the GitHub Repository

Create `quantumwake/kgraph` on GitHub (public). Then from your local checkout:

```bash
cd /Users/kasrarasaee/Development/quantumwake/kgraph
git remote add origin git@github.com:quantumwake/kgraph.git
git push -u origin main
```

Or if you prefer HTTPS:
```bash
git remote add origin https://github.com/quantumwake/kgraph.git
git push -u origin main
```

### Step 4: Add the NPM_TOKEN Secret to GitHub

1. Go to **github.com/quantumwake/kgraph** → **Settings** → **Secrets and variables** → **Actions**
2. Click **New repository secret**
3. **Name:** `NPM_TOKEN`
4. **Value:** paste the token from Step 2
5. Click **Add secret**

### Step 5: Create the `npm` Environment (Recommended)

This adds a protection layer so the publish job requires approval or has deployment rules.

1. Go to **Settings** → **Environments** → **New environment**
2. **Name:** `npm`
3. Optionally enable:
   - **Required reviewers** — someone must approve before publish runs
   - **Wait timer** — delay before the job starts (gives you time to cancel)
   - **Deployment branches** — restrict to `main` only
4. Click **Save protection rules**

The `publish` job in the workflow references `environment: npm`, so it will respect these rules.

### Step 6: Verify the Setup

Push your code and confirm CI passes:
```bash
git push origin main
```

Go to **Actions** tab — you should see the **CI** workflow run with two jobs:
- **Lint & Build Library** — should pass
- **Build Examples** — should pass

---

## Releasing a New Version

### Standard Release Flow

**1. Make sure you're on `main` and clean:**
```bash
git checkout main
git pull origin main
git status                   # should be clean
```

**2. Bump the version in `package.json`:**

Follow [semver](https://semver.org/):
- **Patch** (`0.1.0` → `0.1.1`): bug fixes, no API changes
- **Minor** (`0.1.0` → `0.2.0`): new features, backwards-compatible
- **Major** (`0.1.0` → `1.0.0`): breaking changes

```bash
# Pick one:
npm version patch            # 0.1.0 → 0.1.1
npm version minor            # 0.1.0 → 0.2.0
npm version major            # 0.1.0 → 1.0.0
```

This updates `package.json`, creates a git commit, and creates a git tag (`v0.1.1`).

**3. Push the commit and tag:**
```bash
git push origin main --follow-tags
```

**4. Create a GitHub Release:**

**Option A — Web UI:**
1. Go to **github.com/quantumwake/kgraph/releases** → **Draft a new release**
2. **Choose a tag:** select the tag you just pushed (e.g. `v0.1.1`)
3. **Release title:** `v0.1.1` (or something descriptive)
4. **Description:** write what changed (this becomes the changelog)
5. Check **Set as the latest release**
6. Click **Publish release**

**Option B — GitHub CLI:**
```bash
VERSION=$(node -p "require('./package.json').version")
gh release create "v${VERSION}" \
  --title "v${VERSION}" \
  --notes "- Description of changes" \
  --latest
```

**5. Watch it publish:**

Go to **Actions** → **Publish to npm** — you'll see the pipeline:

| Job | What it does |
|---|---|
| **Validate Release Tag** | Checks `v0.1.1` matches `package.json` version `0.1.1` |
| **Build** | `npm ci` → `tsc --noEmit` → `tsup` |
| **Verify Examples Build** | Downloads the built `dist/` → builds the examples app against it |
| **Publish to npm** | `npm publish --access public --provenance` |

Once the Publish job shows green, the package is live:
```
https://www.npmjs.com/package/@quantumwake/kgraph
```

**6. Verify it's published:**
```bash
npm view @quantumwake/kgraph version
# should print: 0.1.1
```

---

## What Gets Published to npm

Configured in `package.json` → `"files"`:

```
@quantumwake/kgraph@0.1.0
├── dist/
│   ├── index.js          # ESM bundle (42KB)
│   ├── index.cjs         # CJS bundle (43KB)
│   ├── index.d.ts        # TypeScript declarations (ESM)
│   ├── index.d.cts       # TypeScript declarations (CJS)
│   ├── index.js.map      # Source map (ESM)
│   └── index.cjs.map     # Source map (CJS)
├── README.md
├── LICENSE
└── package.json
```

Total package size: ~68KB. Everything else (source, examples, docs, workflows) is excluded.

To preview what gets published at any time:
```bash
npm pack --dry-run
```

---

## What the Workflows Do

### CI (`.github/workflows/ci.yml`)

Runs on every push to `main` and every PR.

```
push/PR to main
  ↓
[lint-and-build]
  checkout → setup node 20 → npm ci → lint → build → upload dist/
  ↓
[examples] (needs lint-and-build)
  checkout → download dist/ → npm ci → install examples → vite build
```

Concurrency: cancels in-progress runs on the same branch (so rapid pushes don't pile up).

### Publish (`.github/workflows/publish.yml`)

Runs when you publish a GitHub Release.

```
GitHub Release published
  ↓
[validate]
  check git tag matches package.json version
  ↓
[build] (needs validate)
  npm ci → lint → build → upload dist/
  ↓
[verify-examples] (needs build)
  download dist/ → build examples
  ↓
[publish] (needs build + verify-examples)
  download dist/ → npm publish --provenance
  ↓
Summary: link to npm + GitHub release
```

Features:
- **Tag validation** — prevents publishing if tag/version mismatch
- **Provenance** — `--provenance` flag creates a verifiable build attestation linking the npm package to the GitHub source
- **Environment protection** — the `npm` environment can require approval before publish runs
- **Concurrency lock** — only one publish can run at a time
- **Build artifacts** — dist/ is built once, shared across jobs via upload/download

---

## Troubleshooting

### "Tag does not match package.json version"

The git tag (e.g. `v0.2.0`) must exactly match `v` + the version in `package.json` (e.g. `0.2.0`). If they don't match:

```bash
# Delete the wrong tag
git tag -d v0.2.0
git push origin :refs/tags/v0.2.0

# Fix package.json, commit, re-tag
npm version 0.2.0 --no-git-tag-version
git add package.json
git commit -m "bump version to 0.2.0"
git tag v0.2.0
git push origin main --follow-tags
```

Then create the GitHub Release again.

### "npm ERR! 403 Forbidden"

The NPM_TOKEN is wrong, expired, or doesn't have write access to `@quantumwake`.

1. Check **Settings → Secrets → NPM_TOKEN** exists
2. Generate a new token on npmjs.com with `Read and write` on `@quantumwake`
3. Update the secret

### "npm ERR! 402 Payment Required"

Scoped packages (`@quantumwake/*`) require either a paid npm account or `--access public`. The workflow already includes `--access public`, but double-check the `.npmrc` has `access=public`.

### Examples build fails

The examples app links to the library via `"@quantumwake/kgraph": "file:.."`. In CI, the workflow downloads the built `dist/` artifact first. If examples fail:
- Check that the library build succeeded (look at the `build` job)
- Check that `examples/package.json` still has `"file:.."` as the dependency

### How to publish manually (emergency only)

If GitHub Actions is down:
```bash
npm login
npm run release              # lint → build → publish
```

This should be a last resort. Prefer the GitHub Release flow for auditability.

---

## Versioning Strategy

| When | Bump | Example |
|---|---|---|
| Bug fix, no API change | `patch` | `0.1.0` → `0.1.1` |
| New feature, backwards-compatible | `minor` | `0.1.0` → `0.2.0` |
| Breaking change (prop rename, removed export, etc.) | `major` | `0.1.0` → `1.0.0` |
| Pre-release (unstable) | use tag | `npm version 0.2.0-beta.1` |

For pre-releases, publish with a dist-tag:
```bash
npm version 0.2.0-beta.1
git push origin main --follow-tags
gh release create v0.2.0-beta.1 --title "v0.2.0-beta.1" --prerelease --notes "Beta release"
```

The workflow publishes as `latest` by default. To publish pre-releases under a different tag, update the workflow's publish step to add `--tag beta`.

---

## Quick Reference

| Task | Command |
|---|---|
| Local build | `npm run build` |
| Type-check | `npm run lint` |
| Preview package | `npm pack --dry-run` |
| Dry-run publish | `npm run release:dry` |
| Bump patch | `npm version patch` |
| Bump minor | `npm version minor` |
| Bump major | `npm version major` |
| Push with tags | `git push origin main --follow-tags` |
| Create release (CLI) | `gh release create v$(node -p "require('./package.json').version") --latest` |
| Check published version | `npm view @quantumwake/kgraph version` |
| Check CI status | `gh run list --workflow=ci.yml` |
| Check publish status | `gh run list --workflow=publish.yml` |
