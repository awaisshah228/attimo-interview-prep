# AI Integration (RAG, Search Workflows, Safety)

## What It Is
Integrating AI/LLM features into applications — specifically RAG (Retrieval-Augmented Generation) for grounding AI responses in real data, plus safety and provenance patterns to ensure reliable, traceable AI outputs.

---

## RAG (Retrieval-Augmented Generation)

### The Problem
LLMs only know what they were trained on. They can't answer questions about your company's private data, recent events, or domain-specific knowledge.

### The Solution: RAG

```
User Question: "What's our refund policy for enterprise customers?"

1. RETRIEVE: Search your knowledge base for relevant documents
   → Found: "enterprise-refund-policy.pdf" (chunk 3, similarity: 0.92)

2. AUGMENT: Add retrieved context to the LLM prompt
   → "Based on the following documents, answer the question:
      [Document: enterprise-refund-policy.pdf, section 3]
      Enterprise customers are eligible for full refunds within 30 days..."

3. GENERATE: LLM produces grounded answer
   → "Enterprise customers can get a full refund within 30 days of purchase.
      After 30 days, a prorated refund is available. [Source: enterprise-refund-policy.pdf]"
```

### RAG Pipeline

```
┌─────────────┐     ┌───────────────┐     ┌──────────────┐
│  Documents   │ ──→ │  Chunking     │ ──→ │  Embedding   │
│ (PDF, docs)  │     │ (split text)  │     │ (vectors)    │
└─────────────┘     └───────────────┘     └──────┬───────┘
                                                  │ store
                                                  ▼
┌─────────────┐     ┌───────────────┐     ┌──────────────┐
│   Answer     │ ←── │    LLM        │ ←── │ Vector DB    │
│ + sources    │     │ (generate)    │     │ (search)     │
└─────────────┘     └───────────────┘     └──────────────┘
                          ↑                       ↑
                    augmented prompt          top K results
                                                  ↑
                                            ┌──────────────┐
                                            │  User Query   │
                                            │ (embedded)    │
                                            └──────────────┘
```

### Step-by-Step Implementation

#### 1. Document Ingestion (offline)

```tsx
import { embed } from 'ai';

// Chunk documents into smaller pieces
function chunkText(text: string, maxTokens: number = 500): string[] {
  // Split by paragraphs, then combine up to maxTokens
  const paragraphs = text.split('\n\n');
  const chunks: string[] = [];
  let current = '';

  for (const para of paragraphs) {
    if ((current + para).length > maxTokens * 4) {  // ~4 chars per token
      chunks.push(current.trim());
      current = para;
    } else {
      current += '\n\n' + para;
    }
  }
  if (current.trim()) chunks.push(current.trim());
  return chunks;
}

// Generate embeddings and store in vector DB
async function ingestDocument(doc: Document) {
  const chunks = chunkText(doc.content);

  for (const chunk of chunks) {
    const { embedding } = await embed({
      model: 'openai/text-embedding-3-small',
      value: chunk,
    });

    await vectorDB.insert({
      embedding,
      metadata: {
        documentId: doc.id,
        documentTitle: doc.title,
        chunkText: chunk,
        source: doc.source,
      },
    });
  }
}
```

#### 2. Retrieval (at query time)

```tsx
async function retrieveContext(query: string, topK: number = 5) {
  // Embed the user's query
  const { embedding } = await embed({
    model: 'openai/text-embedding-3-small',
    value: query,
  });

  // Search vector DB for similar chunks
  const results = await vectorDB.search({
    vector: embedding,
    topK,
    filter: { tenantId: currentTenant },  // Multi-tenant isolation
  });

  return results.map(r => ({
    text: r.metadata.chunkText,
    source: r.metadata.documentTitle,
    score: r.score,
  }));
}
```

#### 3. Generation (with context)

```tsx
import { streamText } from 'ai';

async function generateAnswer(query: string) {
  const context = await retrieveContext(query);

  const result = streamText({
    model: 'anthropic/claude-sonnet-4.6',
    system: `You are a helpful assistant. Answer questions based ONLY on the provided context.
If the context doesn't contain the answer, say "I don't have information about that."
Always cite your sources.`,
    prompt: `Context:
${context.map((c, i) => `[${i + 1}] ${c.source}: ${c.text}`).join('\n\n')}

Question: ${query}

Answer (cite sources using [1], [2], etc.):`,
  });

  return result;
}
```

---

## Embeddings

Embeddings convert text into numbers (vectors) that capture meaning. Similar texts have similar vectors.

```
"dog" → [0.2, 0.8, 0.1, ...]
"puppy" → [0.21, 0.79, 0.12, ...]    ← very similar
"car" → [0.9, 0.1, 0.7, ...]         ← very different
```

### Vector Databases
Store and search embeddings efficiently.

| Database | Type |
|----------|------|
| **Pinecone** | Managed, serverless |
| **Weaviate** | Open source |
| **Qdrant** | Open source, Rust |
| **pgvector** | PostgreSQL extension |
| **Chroma** | Lightweight, local-first |

---

## Safety & Provenance

### Provenance (Source Tracking)
Always track WHERE the AI's answer came from.

```tsx
interface AIResponse {
  answer: string;
  sources: {
    documentId: string;
    documentTitle: string;
    chunkText: string;
    relevanceScore: number;
  }[];
  model: string;
  timestamp: string;
}
```

### Safety Patterns

| Pattern | Purpose |
|---------|---------|
| **Grounding** | Only answer from provided context (RAG) |
| **Source citation** | Show which documents the answer came from |
| **Confidence scoring** | Indicate how confident the answer is |
| **Hallucination detection** | Cross-reference answer with source material |
| **Content filtering** | Block harmful/inappropriate outputs |
| **Rate limiting** | Prevent abuse of AI endpoints |
| **Audit logging** | Log every AI interaction (who, what, when, why) |

```tsx
// Audit every AI interaction
await db.aiAuditLog.create({
  data: {
    userId: session.user.id,
    tenantId: session.user.tenantId,
    query: userQuery,
    retrievedDocuments: context.map(c => c.source),
    response: aiResponse,
    model: 'claude-sonnet-4.6',
    tokensUsed: usage.totalTokens,
    timestamp: new Date(),
  },
});
```

### Input Validation

```tsx
// Prevent prompt injection
function sanitizeQuery(query: string): string {
  // Remove attempts to override system prompt
  const cleaned = query
    .replace(/ignore previous instructions/gi, '')
    .replace(/system:/gi, '')
    .slice(0, 1000);  // Max length

  return cleaned;
}
```

---

## Key Terms

- **RAG**: Retrieval-Augmented Generation — ground LLM answers in real data
- **Embedding**: Vector representation of text that captures semantic meaning
- **Vector database**: Database optimized for storing and searching embeddings
- **Chunking**: Splitting documents into smaller pieces for embedding
- **Similarity search**: Finding vectors closest to a query vector
- **Top-K**: Number of most similar results to retrieve
- **Provenance**: Tracking the source/origin of AI-generated content
- **Hallucination**: When an LLM generates plausible but false information
- **Grounding**: Constraining LLM to only use provided context
- **Prompt injection**: Malicious input that tries to override AI instructions
- **Token**: Unit of text the LLM processes (~4 characters)
- **Context window**: Maximum tokens the LLM can process at once

---

## Common Interview Questions

1. **What is RAG and why use it?**
   - Retrieval-Augmented Generation. It grounds LLM answers in real data, reducing hallucinations and enabling answers about private/recent data.

2. **How do you prevent hallucinations?**
   - RAG (ground in real data), instruct "only answer from context", cite sources, low temperature, validate answers against sources.

3. **How do you handle AI safety?**
   - Input validation, content filtering, rate limiting, audit logging, source provenance, user feedback loops.

4. **How do you evaluate RAG quality?**
   - Relevance of retrieved documents, answer accuracy, source citation correctness, user satisfaction.
