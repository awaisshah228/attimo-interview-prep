# CI/CD & Deployment

## What It Is
- **CI (Continuous Integration)**: Automatically build, lint, test code on every push/PR
- **CD (Continuous Deployment)**: Automatically deploy to production after CI passes

---

## CI/CD Pipeline

```
Push to GitHub
  → Lint (ESLint, TypeScript)
  → Unit tests (Jest)
  → E2E tests (Playwright)
  → Build
  → Deploy to Preview (PR)
  → Manual review / approval
  → Deploy to Production (merge to main)
```

---

## GitHub Actions

### Basic CI Workflow

```yaml
# .github/workflows/ci.yml
name: CI

on:
  push:
    branches: [main]
  pull_request:
    branches: [main]

jobs:
  lint-and-test:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: actions/setup-node@v4
        with:
          node-version: 20
          cache: 'npm'

      - run: npm ci

      - name: Lint
        run: npm run lint

      - name: Type check
        run: npx tsc --noEmit

      - name: Unit tests
        run: npm test -- --coverage

      - name: Build
        run: npm run build

  e2e:
    runs-on: ubuntu-latest
    needs: lint-and-test
    steps:
      - uses: actions/checkout@v4
      - uses: actions/setup-node@v4
        with:
          node-version: 20
          cache: 'npm'
      - run: npm ci
      - run: npx playwright install --with-deps
      - name: E2E tests
        run: npx playwright test
      - uses: actions/upload-artifact@v4
        if: failure()
        with:
          name: playwright-report
          path: playwright-report/
```

---

## Vercel Deployment

### Automatic (Git Integration)

```
Push to branch → Vercel creates Preview Deployment (unique URL)
Merge to main  → Vercel creates Production Deployment
```

### Manual / CI Deployment

```bash
# Install Vercel CLI
npm i -g vercel

# Link project
vercel link

# Deploy preview
vercel deploy

# Deploy production
vercel deploy --prod

# Pre-built deploy (faster CI — separate build from deploy)
vercel build
vercel deploy --prebuilt
```

### Environment Variables

```bash
# Pull env vars to local
vercel env pull .env.local

# Add env var
vercel env add SECRET_KEY production

# List env vars
vercel env ls
```

---

## Deployment Strategies

| Strategy | How | Risk |
|----------|-----|------|
| **Direct deploy** | Push and deploy to all users | High — bugs affect everyone |
| **Preview deployments** | Every PR gets a unique URL for testing | None — isolated |
| **Blue-green** | Two identical environments, switch traffic | Low — instant rollback |
| **Canary/Rolling** | Gradually shift traffic (1% → 10% → 100%) | Low — catch issues early |
| **Rollback** | Revert to previous deployment | None — instant recovery |

### Vercel Rollback

```bash
# Promote a previous deployment to production
vercel promote <deployment-url>

# Or rollback to previous production deployment
vercel rollback
```

---

## AWS / GCP Basics

### AWS Services for Full-Stack Apps

| Service | Purpose |
|---------|---------|
| **EC2** | Virtual servers |
| **ECS/Fargate** | Container orchestration |
| **Lambda** | Serverless functions |
| **S3** | File storage |
| **RDS** | Managed PostgreSQL/MySQL |
| **ElastiCache** | Managed Redis |
| **CloudFront** | CDN |
| **Route 53** | DNS |
| **SQS** | Message queue |
| **SNS** | Pub/sub notifications |
| **CloudWatch** | Logs, metrics, alerts |

### GCP Equivalent Services

| AWS | GCP |
|-----|-----|
| EC2 | Compute Engine |
| Lambda | Cloud Functions |
| S3 | Cloud Storage |
| RDS | Cloud SQL |
| SQS | Cloud Tasks / Pub/Sub |
| CloudFront | Cloud CDN |
| CloudWatch | Cloud Monitoring |

---

## Environment Configuration

```
.env.local          → Local development (git-ignored)
.env.development    → Development defaults
.env.production     → Production defaults
.env.test           → Test environment

Vercel:
  Preview env vars  → Applied to preview deployments
  Production env vars → Applied to production
  Development env vars → Applied to vercel dev
```

**Rules**:
- Never commit secrets to git
- Use `.env*.local` for local overrides (gitignored)
- Use Vercel dashboard or CLI for deployment env vars
- Prefix client-side vars with `NEXT_PUBLIC_` in Next.js

---

## Key Terms

- **CI**: Continuous Integration — automated testing on every push
- **CD**: Continuous Deployment — automated deployment after tests pass
- **Pipeline**: Sequence of automated steps (lint → test → build → deploy)
- **Preview deployment**: Isolated deployment for a PR (unique URL)
- **Blue-green deployment**: Two environments, swap traffic between them
- **Canary release**: Gradually shift traffic to new version
- **Rollback**: Revert to a previous working deployment
- **Artifact**: Output of a build step (binary, report, screenshot)
- **Environment variables**: Configuration values injected at runtime
- **Pre-built deploy**: Build locally/in CI, then deploy the output (faster)

---

## Common Interview Questions

1. **What does your ideal CI/CD pipeline look like?**
   - Push → lint + typecheck + unit tests (parallel) → build → E2E tests → preview deploy → review → production deploy

2. **How do you handle secrets in CI/CD?**
   - GitHub Secrets / Vercel env vars. Never in code. Rotate regularly. Least privilege access.

3. **How do you handle failed deployments?**
   - Automatic rollback (Vercel), canary releases to catch issues early, monitoring + alerting

4. **Preview deployments vs staging environment?**
   - Preview: per-PR, isolated, automatic. Staging: shared, permanent, closer to production.
