# ADRs, Technical Docs & Mentoring

## What It Is
Technical leadership responsibilities: making and documenting decisions, writing clear technical documentation, and mentoring other engineers.

---

## ADRs (Architecture Decision Records)

### What It Is
A short document that captures an important technical decision, its context, and consequences. It creates a historical record of WHY decisions were made.

### Template

```markdown
# ADR-001: Use PostgreSQL with Row-Level Security for Multi-Tenancy

## Status
Accepted (2024-01-15)

## Context
We need to support multi-tenant data isolation for our SaaS product.
We expect 500+ tenants within the first year. We need strong isolation
but also need to keep operational complexity low.

Options considered:
1. **Row-level security (RLS)** — shared tables, `tenant_id` column
2. **Schema-per-tenant** — separate Postgres schemas
3. **Database-per-tenant** — separate databases

## Decision
We will use **Row-Level Security (RLS)** with PostgreSQL.

## Reasoning
- Schema-per-tenant adds migration complexity that our small team can't absorb
- Database-per-tenant is overkill for our isolation requirements
- RLS gives us sufficient isolation with the simplest operational model
- We can migrate to schema-per-tenant later if compliance demands it

## Consequences
**Positive:**
- Single migration path for all tenants
- Simple connection pooling
- Low operational overhead

**Negative:**
- Must ensure every query includes tenant context
- Noisy neighbor risk (mitigated with query timeouts and rate limits)
- RLS policies add slight query overhead (~1-2ms)

## Follow-up
- Set up automated tests that verify tenant isolation
- Add linting rule to catch queries missing tenant_id filter
```

### When to Write an ADR

- Choosing a database, framework, or major library
- Deciding on an architecture pattern (monolith vs microservices)
- Changing authentication or authorization approach
- Picking a deployment strategy
- Any decision that future engineers will wonder "why did we do it this way?"

### ADR Storage

```
docs/
└── adr/
    ├── README.md              # Index of all ADRs
    ├── 001-multi-tenant-strategy.md
    ├── 002-auth-with-clerk.md
    ├── 003-state-management-zustand.md
    └── 004-api-versioning-strategy.md
```

---

## Technical Documentation

### Types of Technical Docs

| Type | Audience | Purpose |
|------|----------|---------|
| **ADR** | Engineers (present + future) | Why decisions were made |
| **API docs** | Consumers (frontend, external) | How to use the API |
| **Runbook** | On-call engineers | Step-by-step for incidents |
| **Onboarding guide** | New team members | Get productive quickly |
| **Architecture doc** | Engineers + stakeholders | System overview |
| **RFC** | Team | Propose and discuss changes |

### Writing Good Technical Docs

**Principles:**
1. **Start with WHY** — context before details
2. **Be specific** — "response time is 200ms" not "fast"
3. **Include examples** — code samples, diagrams
4. **Keep it current** — outdated docs are worse than no docs
5. **Link, don't duplicate** — point to source of truth

### RFC (Request for Comments)

For larger decisions that need team input before committing.

```markdown
# RFC: Migrate from REST to GraphQL for Mobile API

## Author: Your Name
## Date: 2024-01-15
## Status: Open for comments (closes 2024-01-22)

## Problem
Mobile app makes 5-7 REST calls per screen, causing waterfall requests
and over-fetching. Average screen load is 2.3 seconds.

## Proposal
Introduce a GraphQL layer specifically for mobile clients.
Keep REST for web and public API.

## Alternatives Considered
1. REST with compound endpoints (/_batch)
2. BFF (Backend-for-Frontend) pattern
3. GraphQL for all clients

## Trade-offs
[Honest assessment of pros/cons]

## Open Questions
- Who owns the GraphQL schema?
- How do we handle authorization in resolvers?

## Feedback
[Team members add comments here]
```

---

## Mentoring & Engineering Standards

### Code Review Practices

| Practice | Why |
|----------|-----|
| Review for correctness, not style | Automated formatters handle style |
| Ask questions, don't dictate | "What would happen if X?" > "Change this to X" |
| Praise good patterns | Reinforce what's working |
| Review within 24 hours | Don't block teammates |
| Keep reviews small | 200-400 lines max per PR |

### Feedback Framework

```
Situation: "In the PR for the auth migration..."
Behavior:  "I noticed the error handling catches all exceptions silently..."
Impact:    "This means failed logins won't show error messages to users."
Request:   "Could we add specific error types so we can show helpful messages?"
```

### Improving Engineering Standards

| Area | Action |
|------|--------|
| **Code quality** | Linting rules, TypeScript strict mode, automated formatting |
| **Testing** | Minimum coverage requirements, test review in PRs |
| **Documentation** | ADR template, API docs as part of Definition of Done |
| **Architecture** | RFC process for significant changes |
| **Incidents** | Blameless post-mortems, runbook updates |
| **Onboarding** | Updated setup guide, pairing sessions |

---

## Key Terms

- **ADR**: Architecture Decision Record — documents technical decisions and reasoning
- **RFC**: Request for Comments — proposal for team discussion before deciding
- **Runbook**: Step-by-step guide for handling operational incidents
- **Post-mortem**: Analysis after an incident (what happened, why, how to prevent)
- **Blameless culture**: Focus on systems and processes, not individual fault
- **Definition of Done**: Criteria that must be met before work is considered complete
- **Technical debt**: Shortcuts taken that will need to be fixed later
- **Code review**: Peer review of code changes before merging

---

## Common Interview Questions

1. **How do you make technical decisions?**
   - Gather context → identify options → evaluate trade-offs → decide → document in ADR → communicate

2. **How do you mentor junior engineers?**
   - Pair programming, thoughtful code reviews (questions not commands), assign stretch tasks with support, share context not just answers

3. **How do you improve engineering standards?**
   - Incrementally: identify one pain point → propose solution → get buy-in → implement → measure → repeat

4. **How do you handle disagreements on technical approach?**
   - Write an RFC, let the team discuss, prototype if needed, decide based on evidence, document the decision
