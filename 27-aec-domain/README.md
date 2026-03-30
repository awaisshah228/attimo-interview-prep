# AEC & Document-Heavy Workflows

## What It Is
**AEC** = Architecture, Engineering, and Construction industry. Attimo works in document-heavy, multi-party project environments — think construction projects with blueprints, contracts, permits, RFIs, and submittals flowing between architects, engineers, contractors, and clients.

---

## AEC Industry Concepts

### Key Document Types

| Document | What It Is |
|----------|-----------|
| **RFI** (Request for Information) | Formal question from contractor to designer to clarify plans |
| **Submittal** | Contractor submits materials/products for architect approval |
| **Change Order** | Modification to the original contract/scope |
| **Punch List** | List of items to fix before project completion |
| **Drawing/Blueprint** | Technical plans (architectural, structural, MEP) |
| **Specification** | Detailed description of materials, methods, standards |
| **Permit** | Government approval for construction work |
| **Daily Log** | Record of daily site activities, weather, labor |
| **BIM Model** | 3D Building Information Model |

### Stakeholders (Multi-Party)

```
Owner / Client
├── Architect (design)
├── General Contractor (build)
│   ├── Subcontractors (electrical, plumbing, etc.)
│   └── Suppliers
├── Structural Engineer
├── MEP Engineer (Mechanical, Electrical, Plumbing)
├── Inspectors / Code Officials
└── Project Manager
```

Each party needs to:
- Submit and receive documents
- Track approval workflows
- Manage versions and revisions
- Meet compliance deadlines

---

## Document-Heavy Workflow Patterns

### 1. Document Lifecycle

```
Draft → Review → Revise → Approve → Distribute → Archive
  ↑       │                  │
  └───────┘ (reject)         │
                              ↓
                         Active (in use)
                              │
                              ↓
                      Superseded (new version)
```

### 2. Version Control for Documents

```tsx
interface Document {
  id: string;
  title: string;
  currentVersion: number;
  status: 'draft' | 'in_review' | 'approved' | 'superseded' | 'archived';
  versions: DocumentVersion[];
}

interface DocumentVersion {
  version: number;
  fileUrl: string;
  uploadedBy: string;
  uploadedAt: Date;
  changes: string;        // What changed from previous version
  reviewers: Reviewer[];
  status: 'pending' | 'approved' | 'rejected';
}
```

### 3. Approval Workflows

```tsx
// Multi-step approval chain
interface ApprovalWorkflow {
  steps: ApprovalStep[];
  currentStep: number;
  status: 'in_progress' | 'approved' | 'rejected';
}

interface ApprovalStep {
  order: number;
  approverRole: string;    // 'architect', 'engineer', 'owner'
  approverId: string;
  status: 'pending' | 'approved' | 'rejected' | 'skipped';
  comments: string;
  decidedAt: Date | null;
}

// Workflow: Submittal → Contractor → Architect → Engineer → Owner
```

### 4. Multi-Party Access Control

```tsx
// Each party has specific access to specific documents
interface ProjectPermission {
  partyId: string;           // e.g., "acme-contractors"
  partyRole: string;         // e.g., "general_contractor"
  documentTypes: string[];   // What they can see: ['rfis', 'submittals', 'drawings']
  actions: string[];         // What they can do: ['view', 'submit', 'review']
}
```

---

## Technical Challenges in AEC Apps

### Large File Handling
- Construction drawings: 50-500MB each
- BIM models: 1-5GB
- Need: chunked uploads, signed URLs, progress tracking, preview generation

### Search Across Documents
- Full-text search across thousands of PDFs
- AI-powered search (RAG) to find relevant specs/drawings
- Metadata filtering (date, author, document type, project phase)

### Real-Time Collaboration
- Multiple parties reviewing same document simultaneously
- Live status updates (submittal approved, RFI responded)
- Notification streams per party

### Compliance & Audit Trail
- Every document action must be logged (who viewed/edited/approved what)
- Immutable history for legal disputes
- Retention policies (construction records kept 10+ years)
- Digital signatures for approvals

### Offline Capability
- Site workers may have limited connectivity
- Need: offline document access, sync when online

---

## Data Model Example

```sql
-- Projects
CREATE TABLE projects (
  id          UUID PRIMARY KEY,
  tenant_id   UUID NOT NULL,
  name        TEXT NOT NULL,
  status      TEXT NOT NULL,   -- 'planning', 'construction', 'completed'
  address     TEXT,
  start_date  DATE,
  end_date    DATE
);

-- Parties (stakeholders on a project)
CREATE TABLE project_parties (
  project_id  UUID REFERENCES projects(id),
  party_id    UUID REFERENCES organizations(id),
  role        TEXT NOT NULL,  -- 'owner', 'architect', 'contractor'
  PRIMARY KEY (project_id, party_id)
);

-- Documents
CREATE TABLE documents (
  id              UUID PRIMARY KEY,
  project_id      UUID REFERENCES projects(id),
  type            TEXT NOT NULL,  -- 'rfi', 'submittal', 'drawing', 'spec'
  title           TEXT NOT NULL,
  current_version INT NOT NULL DEFAULT 1,
  status          TEXT NOT NULL DEFAULT 'draft',
  created_by      UUID REFERENCES users(id),
  assigned_to     UUID REFERENCES users(id),
  due_date        DATE,
  created_at      TIMESTAMPTZ DEFAULT now()
);

-- Document versions
CREATE TABLE document_versions (
  id          UUID PRIMARY KEY,
  document_id UUID REFERENCES documents(id),
  version     INT NOT NULL,
  file_url    TEXT NOT NULL,
  file_size   BIGINT,
  uploaded_by UUID REFERENCES users(id),
  notes       TEXT,
  created_at  TIMESTAMPTZ DEFAULT now(),
  UNIQUE (document_id, version)
);
```

---

## Key Terms

- **AEC**: Architecture, Engineering, and Construction industry
- **RFI**: Request for Information — formal clarification request
- **Submittal**: Product/material submission for approval
- **Change Order**: Modification to the project scope/contract
- **Punch List**: Items to fix before project completion
- **BIM**: Building Information Modeling — 3D digital model of a building
- **MEP**: Mechanical, Electrical, Plumbing (engineering discipline)
- **Multi-party**: Multiple organizations collaborating on one project
- **Approval workflow**: Sequential approval chain across stakeholders
- **Document lifecycle**: Draft → Review → Approve → Distribute → Archive
- **Superseded**: Replaced by a newer version (previous version is historical only)

---

## Common Interview Questions

1. **How do you handle multi-party access control?**
   - Role-based per party, document-type permissions, project-level scoping, audit every access

2. **How would you implement document versioning?**
   - Separate `documents` and `document_versions` tables. Current version tracked on document. Previous versions are immutable history.

3. **How do you search across thousands of documents?**
   - Full-text search (PostgreSQL `tsvector` or Elasticsearch), AI-powered RAG for semantic search, metadata filtering.

4. **What's unique about building software for AEC?**
   - Large files, many stakeholders, complex approval chains, strict compliance, long retention, offline needs.
