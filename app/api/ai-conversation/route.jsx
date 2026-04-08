import { NextResponse } from 'next/server';
import OpenAI from 'openai';
import { logError } from '@/lib/logger';

// ========== OFFLINE QUESTION BANKS (used when API key is invalid/missing) ==========
const OFFLINE_QUESTIONS = {
  'DSA': [
    "Given a sorted array and a target, how would you find the first and last occurrence of the target?",
    "How would you detect a cycle in a linked list and locate the cycle start?",
    "Explain how to find the lowest common ancestor in a binary search tree.",
    "How would you compute the number of islands in a 2D grid?",
    "Describe an O(n) solution to find the maximum subarray sum.",
    "How would you design an LRU cache with O(1) operations?",
    "Explain how to topologically sort a directed acyclic graph.",
    "How would you find the k-th smallest element in an unsorted array?",
    "Describe a dynamic programming approach for the longest increasing subsequence.",
    "How would you implement a monotonic stack to solve a next greater element problem?",
  ],
  'DSA:Coding Practice': [
    "Title: Two Sum\nDifficulty: Easy\nTopics: Array, Hash Map\nDescription:\nGiven an array of integers nums and an integer target, return indices of the two numbers such that they add up to target.\nYou may assume that each input has exactly one solution, and you may not use the same element twice.\nYou can return the answer in any order.\nInput:\nnums: integer[]\ntarget: integer\nOutput:\ninteger[] (two indices)\nExamples:\n1) Input: nums = [2,7,11,15], target = 9\n   Output: [0,1]\n2) Input: nums = [3,2,4], target = 6\n   Output: [1,2]\nConstraints:\n- 2 <= nums.length <= 10^5\n- -10^9 <= nums[i] <= 10^9\n- -10^9 <= target <= 10^9\nTest Cases:\n- Input: nums = [3,3], target = 6 -> Output: [0,1]\n- Input: nums = [-1,-2,-3,-4,-5], target = -8 -> Output: [2,4]",
    "Title: Valid Parentheses\nDifficulty: Easy\nTopics: Stack\nDescription:\nGiven a string s containing just the characters '(', ')', '{', '}', '[' and ']', determine if the input string is valid.\nAn input string is valid if open brackets are closed by the same type of brackets and in the correct order.\nInput:\ns: string\nOutput:\nboolean\nExamples:\n1) Input: s = \"()\"\n   Output: true\n2) Input: s = \"()[]{}\"\n   Output: true\n3) Input: s = \"(]\"\n   Output: false\nConstraints:\n- 1 <= s.length <= 10^4\n- s consists of only parentheses characters\nTest Cases:\n- Input: s = \"{[]}\" -> Output: true\n- Input: s = \"([)]\" -> Output: false",
    "Title: Merge Two Sorted Lists\nDifficulty: Easy\nTopics: Linked List, Two Pointers\nDescription:\nYou are given the heads of two sorted linked lists list1 and list2. Merge the two lists into one sorted list. The list should be made by splicing together the nodes of the first two lists.\nInput:\nlist1: ListNode\nlist2: ListNode\nOutput:\nListNode (merged head)\nExamples:\n1) Input: list1 = [1,2,4], list2 = [1,3,4]\n   Output: [1,1,2,3,4,4]\n2) Input: list1 = [], list2 = []\n   Output: []\nConstraints:\n- The number of nodes in both lists is in the range [0, 10^4]\n- -10^5 <= Node.val <= 10^5\nTest Cases:\n- Input: list1 = [2], list2 = [1,3] -> Output: [1,2,3]\n- Input: list1 = [5,6], list2 = [] -> Output: [5,6]",
  ],
  'Development': [
    "Explain how JavaScript's event loop handles microtasks and macrotasks.",
    "How would you design a reusable React hook for form validation?",
    "Describe how you would implement optimistic UI updates in a React app.",
    "What are the trade-offs between SSR, SSG, and CSR in a Next.js app?",
    "How would you structure an Express API with layered architecture?",
    "Explain how you would secure a REST API against common attacks.",
    "How would you implement file uploads with progress tracking on the client?",
    "What strategies do you use to reduce bundle size in a frontend app?",
    "Describe how database indexing improves query performance and when it hurts.",
    "How would you design a CI pipeline for a full-stack app with automated tests?",
  ],
  'System Design': [
    "How would you design a feature flag service used by thousands of services?",
    "Design a metrics ingestion pipeline for real-time dashboards.",
    "How would you build a multi-tenant SaaS platform with isolation and billing?",
    "Design a recommendation system for an e-commerce homepage.",
    "How would you architect a document collaboration editor with real-time updates?",
    "Design a log aggregation system with search and retention policies.",
    "How would you design a global session store for authentication?",
    "Design a media processing pipeline for image and video transformations.",
    "How would you handle geo-distributed data and regional compliance?",
    "Design a high-throughput analytics event tracking system.",
  ],
  'System Design:Low-Level Design (LLD)': [
    "Design class structures for a movie ticket booking system.",
    "Model the core classes for a food recipe planner with shopping lists.",
    "Create a class design for a ride-sharing dispatch engine.",
    "Design the classes for a cloud storage client sync service.",
    "Model an online exam system with proctoring and question pools.",
    "Design classes for a banking ledger with accounts and transactions.",
    "Create a class model for a smart thermostat scheduling system.",
    "Design the classes for an issue tracking system with workflows.",
    "Model a digital marketplace with offers, bids, and order fulfillment.",
    "Design the core classes for a multiplayer game lobby and matchmaking.",
  ],
  'System Design:High-Level Design (HLD)': [
    "Design a marketplace for short-term rentals with booking and reviews.",
    "Architect a global push notification service with personalization.",
    "Design a live sports streaming platform with low latency.",
    "Architect a ride-hailing system with surge pricing and dispatch.",
    "Design a large-scale email delivery system with bounce handling.",
    "Architect a document search service with indexing and ranking.",
    "Design a social graph service for friend recommendations.",
    "Architect a password manager with secure sync.",
    "Design a content moderation pipeline for user-generated content.",
    "Architect a batch analytics platform for daily reporting.",
  ],
  'System Design:Distributed Systems': [
    "Design a consensus service using Raft for configuration management.",
    "How would you implement distributed rate limiting across regions?",
    "Design a global unique ID generator with ordering guarantees.",
    "How would you build a replicated cache with read-your-writes?",
    "Design a distributed task queue with at-least-once delivery.",
    "How would you implement a distributed lock service with leases?",
    "Design a geo-replicated key-value store with tunable consistency.",
    "How would you handle split-brain scenarios in a cluster?",
    "Design a distributed tracing system for microservices.",
    "How would you implement a leader failover strategy for a cluster?",
  ],
  'System Design:Scalability & Performance': [
    "How would you scale a read-heavy feed service with strict latency SLAs?",
    "Design a caching strategy for a multi-region storefront.",
    "How would you shard a database for a rapidly growing user table?",
    "Design a hot partition mitigation strategy for time-series writes.",
    "How would you tune a search system for high QPS?",
    "Design a batch processing system that avoids resource contention.",
    "How would you handle load spikes during flash sales?",
    "Design an autoscaling policy for a web tier under variable traffic.",
    "How would you reduce tail latency in a multi-service request path?",
    "Design a performance testing strategy with realistic traffic models.",
  ],
  'System Design:Database Design': [
    "Design a schema for a subscription billing system with invoices.",
    "How would you model a product catalog with variants and attributes?",
    "Design a schema for a logistics tracking system with status history.",
    "How would you design indexes for a high-cardinality analytics table?",
    "Model a messaging system with threads, reactions, and read receipts.",
    "Design a schema for a medical appointment booking system.",
    "How would you model audit logs with immutable history?",
    "Design a schema for a marketplace escrow and settlement flow.",
    "How would you store and query geospatial locations efficiently?",
    "Design a migration plan for splitting a monolithic database.",
  ],
  'System Design:API Design': [
    "Design a REST API for order management with clear resource modeling.",
    "How would you define pagination for large list endpoints?",
    "Design an API versioning strategy that minimizes breaking changes.",
    "How would you structure error codes and error payloads?",
    "Design an OAuth-based authentication flow for third-party apps.",
    "How would you implement idempotency keys for payments?",
    "Design webhook retries and signature verification.",
    "How would you rate limit per user and per IP?",
    "Design a bulk import API with async processing.",
    "How would you design a consistent filtering and sorting syntax?",
  ],
  'Behavioral': [
    "Tell me about a time you had to influence a decision without authority.",
    "Describe a project where you had to manage trade-offs under pressure.",
    "Tell me about a time you improved an existing process.",
    "Describe a situation where you had to handle ambiguity.",
    "Tell me about a conflict you resolved within a team.",
    "Describe a time you received critical feedback and applied it.",
    "Tell me about a time you made a mistake and what you learned.",
    "Describe a situation where you had to learn a new tool quickly.",
    "Tell me about a time you had to mentor or help a teammate.",
    "Describe a time you disagreed with your manager and how you handled it.",
  ],
};

// Track question index per interview session (in-memory, resets on server restart)
const sessionTracker = new Map();

function getNextOfflineQuestion(category, sessionId, systemType = '') {
  const systemKey = systemType ? `${category}:${systemType}` : category;
  const key = `${sessionId}-${systemKey}`;
  const questions = OFFLINE_QUESTIONS[systemKey] || OFFLINE_QUESTIONS[category] || OFFLINE_QUESTIONS['Development'];
  
  let index = sessionTracker.get(key) || 0;
  if (index >= questions.length) index = questions.length - 1; // Stay on wrap-up
  
  const question = questions[index];
  sessionTracker.set(key, index + 1);
  
  // Clean up old sessions (keep map from growing)
  if (sessionTracker.size > 1000) {
    const entries = [...sessionTracker.entries()];
    entries.slice(0, 500).forEach(([k]) => sessionTracker.delete(k));
  }
  
  return { question, systemKey };
}

// ========== MAIN HANDLER ==========
export async function POST(req) {
  try {
    const body = await req.json();
    const { messages, category, description, duration, userName, sessionId, sessionSeed } = body;

    const normalizeCategory = (value) => {
      const v = (value || '').toLowerCase();
      if (v.includes('system design')) return 'System Design';
      if (v.includes('dsa')) return 'DSA';
      if (v.includes('behavioral')) return 'Behavioral';
      if (v.includes('development')) return 'Development';
      return value || 'Development';
    };
    const normalizedCategory = normalizeCategory(category);

    if (!messages || !Array.isArray(messages)) {
      return NextResponse.json({ error: 'Messages array is required' }, { status: 400 });
    }

    const durationMinutes = parseInt(duration) || 30;
    const questionCount = Math.max(3, Math.min(12, Math.floor(durationMinutes / 3)));

    let extractedSystemType = '';
    if (normalizedCategory === 'System Design' && description) {
      const match = description.match(/System type:\s*([^.]+)\./);
      if (match) {
        extractedSystemType = match[1].trim();
      }
    }

    let dsaMode = '';
    if (normalizedCategory === 'DSA' && description) {
      const match = description.match(/DSA mode:\s*([^.]+)\./i);
      if (match) {
        dsaMode = match[1].trim();
      }
    }
    const isDsaCodingPractice = normalizedCategory === 'DSA' && dsaMode === 'Coding Practice';

    // Extract domain for Development category
    let extractedDomain = '';
    if (normalizedCategory === 'Development' && description) {
      const match = description.match(/Domain:\s*([^.]+)\./);
      if (match) extractedDomain = match[1].trim();
    }

    // Extract user-specified focus topics (from the "Specific Topics" field)
    let focusTopics = '';
    if (description) {
      const match = description.match(/Focus topics:\s*([^.]+)\./i);
      if (match) focusTopics = match[1].trim();
    }

    let systemDesignTopics = `URL shortener, chat app, social feed, file storage, notification system, search engine,
Load balancing, Caching (Redis, CDN), Message queues, Microservices, Database sharding,
API rate limiting, Monitoring, CAP theorem, Consistency patterns`;

    if (extractedSystemType === 'Low-Level Design (LLD)') {
      systemDesignTopics = `Object-Oriented Design (OOD), Class diagrams, Design Patterns (Singleton, Factory, Observer, Strategy), SOLID principles, UML, multithreading, concurrency control, parking lot ticketing system core classes`;
    } else if (extractedSystemType === 'High-Level Design (HLD)') {
      systemDesignTopics = `System architecture, microservices vs monolith, architectural patterns, components interaction, data flows, load balancing, CDNs, API Gateway, designing Youtube, Netflix, Uber at a high level`;
    } else if (extractedSystemType === 'Distributed Systems') {
      systemDesignTopics = `CAP theorem, PACELC, consensus algorithms (Raft, Paxos), leader election, distributed locking, clock synchronization, event-driven architecture, distributed tracing, network partitions`;
    } else if (extractedSystemType === 'Scalability & Performance') {
      systemDesignTopics = `Horizontal vs vertical scaling, Database sharding, partitioning, replication, Caching strategies (Redis, Memcached), rate limiting, handling read/write heavy workloads, eliminating bottlenecks`;
    } else if (extractedSystemType === 'Database Design') {
      systemDesignTopics = `Relational vs NoSQL, Indexing, Normalization vs Denormalization, ACID properties, BASE properties, Transactions, Isolation levels, query optimization, handling concurrent transactions`;
    } else if (extractedSystemType === 'API Design') {
      systemDesignTopics = `RESTful API principles, GraphQL vs REST vs gRPC, idempotency, pagination, versioning, authentication (JWT, OAuth), webhook design, WebSocket vs SSE, securing APIs`;
    }

    // ---- Build system prompt ----
    const categoryPrompts = {
      'DSA': `You are an expert DSA coding interview coach. ONLY ask Data Structures & Algorithms questions.

TOPICS: Arrays (two pointers, sliding window, prefix sums), Linked Lists (reversal, cycle detection), 
Trees (BFS, DFS, BST operations), Graphs (topological sort, shortest path), Dynamic Programming (memoization, tabulation),
Sorting (merge sort, quick sort), Stacks/Queues (monotonic stack), Hash Maps (frequency counting, two sum).

RULES:
- Ask the student to explain their APPROACH first before code
- Ask about time and space complexity
- Give hints if stuck
- Ask follow-ups: "Can you optimize?" or "What if input is huge?"
- NEVER ask about web development, APIs, databases, or non-DSA topics`,

      'Development': `You are an expert ${extractedDomain ? extractedDomain : 'full-stack web'} development interview coach. ONLY ask ${extractedDomain ? extractedDomain : 'web development'} questions.

TOPICS: ${(
  extractedDomain?.includes('Frontend') ? 'React (hooks, state, virtual DOM, reconciliation, performance), JavaScript (closures, promises, async/await, event loop, prototypes), HTML/CSS (flexbox, grid, animations, accessibility), TypeScript, testing (Jest, Testing Library), bundlers (Webpack, Vite), Core Web Vitals, responsive design.'
  : extractedDomain?.includes('Backend') ? 'Node.js (event loop, streams, clustering), Express/Fastify middleware patterns, REST API design, GraphQL, JWT & OAuth 2.0, SQL & NoSQL databases, indexing & query optimization, Redis caching, Docker, CI/CD pipelines, security (OWASP Top 10).'
  : extractedDomain?.includes('Mobile') ? 'React Native or Flutter, mobile UI patterns, navigation, state management, offline-first, push notifications, native modules, performance profiling, app store deployment.'
  : extractedDomain?.includes('API') || extractedDomain?.includes('Microservices') ? 'REST & GraphQL API design, gRPC, microservices patterns (Saga, CQRS, Event Sourcing), API gateway, service discovery, inter-service auth, rate limiting, circuit breakers, contract testing.'
  : 'JavaScript (closures, promises, async/await, event loop, prototypes), React (hooks, state, virtual DOM), Node.js (event-driven, streams, Express), APIs (REST, GraphQL, JWT, OAuth), Databases (SQL, NoSQL, indexing), CSS/HTML, TypeScript, Git, Testing, Docker, CI/CD, Performance optimization.'
)}

RULES:
- Start with requirements or context, then ask for approach, then drill into details and trade-offs
- Include debugging or failure scenarios
- Ask for complexity, performance, and security considerations where relevant
${extractedDomain ? `- FOCUS EXCLUSIVELY on ${extractedDomain} questions. Do NOT ask about other domains.` : '- Cover both frontend AND backend across the session'}
- NEVER ask DSA algorithm questions or system design questions`,

      'System Design': `You are an expert system design interview coach. ONLY ask system design questions specifically focused on ${extractedSystemType || 'System Design'}.

TOPICS: ${systemDesignTopics}.

RULES:
- ${extractedSystemType === 'Low-Level Design (LLD)' ? 'Focus on classes, interfaces, patterns, and OOD principles. Do not ask about broad architecture or servers.' : 'Start with requirements, then high-level, then details, then scaling.'}
- Ask about trade-offs and failure scenarios within the domain of ${extractedSystemType || 'system design'}.
- NEVER ask DSA problems or language framework trivia.`,

      'Behavioral': `You are a warm behavioral interview coach.

TOPICS: Tell me about yourself, teamwork, conflict resolution, failures, learning, leadership, 
tight deadlines, feedback, career goals, STAR method.

RULES:
- Use the STAR method (Situation, Task, Action, Result).
- Ask ONE behavioral question at a time.
- Be warm and encouraging.
- NEVER ask technical, coding, or system design questions.`,
    };

    const dsaCodingPrompt = `You are an expert DSA coding problem writer. Return LeetCode-style problem statements only.

OUTPUT FORMAT (plain text, exact labels):
Title: <short problem title>
Difficulty: Easy | Medium | Hard
Topics: <comma-separated topics>
Description:
<2-6 sentences describing the problem>
Input:
<input format>
Output:
<output format>
Examples:
1) Input: ...\n   Output: ...\n   Explanation: ... (optional)
2) Input: ...\n   Output: ...
Constraints:
- ...
Test Cases:
- Input: ... -> Output: ...
- Input: ... -> Output: ...

RULES:
- No greetings, no coaching, no solution, no code.
- Produce ONE problem only.
- Keep the problem self-contained and unambiguous.`;

    const categoryPrompt = isDsaCodingPractice
      ? dsaCodingPrompt
      : (categoryPrompts[normalizedCategory] || categoryPrompts['Development']);

    const categoryGuards = {
      'DSA': {
        allow: /(array|linked list|tree|graph|dp|dynamic programming|complexity|big\s*o|stack|queue|heap|hash|binary search|sorting|two\s*pointers|sliding window|recursion)/i,
        block: /(react|node|javascript|typescript|frontend|backend|api|rest|graphql|sql|database|system design|microservices)/i,
      },
      'System Design': {
        allow: /(architecture|scalability|load balancing|cache|database|latency|throughput|availability|consistency|sharding|replication|queue|microservices|api gateway|cdn)/i,
        block: /(binary search|linked list|dp|dynamic programming|leetcode|react|javascript)/i,
      },
      'Development': {
        allow: /(react|node|javascript|typescript|api|rest|graphql|sql|database|frontend|backend|auth|testing|ci\/cd)/i,
        block: /(binary search|linked list|dp|dynamic programming|system design|scalability|sharding)/i,
      },
      'Behavioral': {
        allow: /^(\s*(tell me about|describe|walk me through|what are your|why do you|where do you see|what motivates you|why did you choose|how do you handle|have you ever|do you))/i,
        block: /(binary search|linked list|dp|dynamic programming|react|node|javascript|typescript|html|css|frontend|backend|api|rest|graphql|sql|database|system design|scalability|microservices|web app|website|ui|ux|image|optimiz|state management|redux)/i,
      },
    };

            const coreRules = isDsaCodingPractice
      ? `CORE RULES:
    - Return ONLY the problem statement in the exact output format above.
    - Do NOT include feedback, hints, or follow-up questions.
    - Do NOT include any greetings or coaching.`
          : normalizedCategory === 'Behavioral'
          ? `CORE RULES:
        - Return ONLY a single behavioral/HR question.
        - No technical questions, no coaching, no feedback.
        - Start with "Tell me about" or "Describe a situation".
        - Keep it concise (1-2 sentences).`
      : `CORE RULES:
    - ONE question at a time.
    - After each answer: give 1-2 sentences of specific feedback on what was good or missing. Then either ask ONE targeted follow-up if the answer reveals a gap or something interesting, OR move to a new question.
    - Keep responses SHORT (2-4 sentences). Be conversational.
    - Keep asking questions until the session ends; do NOT wrap up early.
    - NEVER repeat questions. Don't number them.
    - Ensure questions are different each session; avoid reusing common openers.
    - STAY ON TOPIC for ${normalizedCategory}. Do NOT drift to other categories.
    ${focusTopics ? `- CRITICAL: The user has chosen to focus on "${focusTopics}". Ask ONLY questions about this specific topic for the ENTIRE session.` : ''}`;

        const systemPrompt = `${categoryPrompt}

  You are interviewing ${userName || 'a student'} for ${normalizedCategory || 'technical'} practice.
${description ? `Context: ${description}` : ''}
${focusTopics ? `\n⚠️ MANDATORY TOPIC RESTRICTION: The candidate has chosen to focus ONLY on "${focusTopics}". Every question this session must be about this topic.` : ''}
Session: ~${durationMinutes} min, ~${questionCount} questions.
Session seed: ${sessionSeed || 'n/a'} (use to vary questions across sessions).

${coreRules}`;

    // ---- Try API call ----
    const apiKey = process.env.GROQ_API_KEY;
    
    if (!apiKey || apiKey.length < 10) {
      // No API key — use offline questions
      console.log('⚠️ No Groq API key configured, using offline questions');
      const modeKey = normalizedCategory === 'DSA' ? dsaMode : extractedSystemType;
      const offline = getNextOfflineQuestion(normalizedCategory || 'Development', sessionId || 'default', modeKey);
      return NextResponse.json({ message: offline.question, success: true, mode: 'offline', offlineKey: offline.systemKey });
    }

    const openai = new OpenAI({
      baseURL: 'https://api.groq.com/openai/v1',
      apiKey,
    });

    // Try primary model, then fallback
    const models = ['llama-3.3-70b-versatile'];
    
    for (let attempt = 0; attempt < models.length; attempt++) {
      try {
        const completion = await openai.chat.completions.create({
          model: models[attempt],
          messages: [
            { role: 'system', content: systemPrompt },
            ...messages,
          ],
          temperature: 0.7,
          max_tokens: isDsaCodingPractice ? 450 : 300,
        });
        const aiMessage = completion.choices[0]?.message?.content || '';
        const guard = isDsaCodingPractice ? null : (categoryGuards[normalizedCategory] || null);
        if (aiMessage && guard) {
          const isBlocked = guard.block.test(aiMessage);
          const isAllowed = guard.allow.test(aiMessage);
          if (isBlocked || !isAllowed) {
            console.warn('⚠️ Category guard blocked off-topic response:', { category, aiMessage });

            if (normalizedCategory === 'Behavioral') {
              const offline = getNextOfflineQuestion(normalizedCategory || 'Development', sessionId || 'default', extractedSystemType);
              return NextResponse.json({ message: offline.question, success: true, mode: 'offline-guard', offlineKey: offline.systemKey });
            }

            const guardSystemPrompt = normalizedCategory === 'Behavioral'
              ? `${systemPrompt}\n\nSTRICT MODE: Return ONLY a single behavioral question. No feedback. No other topics. Start with "Tell me about a time" or "Describe a situation" and use STAR-style framing.`
              : `${systemPrompt}\n\nSTRICT MODE: Return ONLY a single ${normalizedCategory} question. No feedback. No other topics.`;
            const guardCompletion = await openai.chat.completions.create({
              model: models[attempt],
              messages: [
                { role: 'system', content: guardSystemPrompt },
                ...messages,
              ],
              temperature: 0.4,
              max_tokens: 220,
            });
            const guardMessage = guardCompletion.choices[0]?.message?.content || '';
            const guardBlocked = guard.block.test(guardMessage);
            const guardAllowed = guard.allow.test(guardMessage);
            if (guardMessage && guardAllowed && !guardBlocked) {
              return NextResponse.json({ message: guardMessage, success: true, mode: 'ai-guarded' });
            }
            const modeKey = normalizedCategory === 'DSA' ? dsaMode : extractedSystemType;
            const offline = getNextOfflineQuestion(normalizedCategory || 'Development', sessionId || 'default', modeKey);
            return NextResponse.json({ message: offline.question, success: true, mode: 'offline-guard', offlineKey: offline.systemKey });
          }
          return NextResponse.json({ message: aiMessage, success: true, mode: 'ai' });
        } else if (aiMessage) {
          return NextResponse.json({ message: aiMessage, success: true, mode: 'ai' });
        }
      } catch (err) {
        logError(`AI Conversation API | Attempt: ${attempt + 1}, Model: ${models[attempt]}`, err);
        console.error(`AI attempt ${attempt + 1} failed (${models[attempt]}):`, err.message);
        
        if (err.status === 401 || err.status === 403) {
          // API key is invalid — fall back to offline questions immediately
          console.log('🔑 API key invalid (401), switching to offline mode');
          const modeKey = normalizedCategory === 'DSA' ? dsaMode : extractedSystemType;
          const offline = getNextOfflineQuestion(normalizedCategory || 'Development', sessionId || 'default', modeKey);
          return NextResponse.json({ 
            message: offline.question, 
            success: true, 
            mode: 'offline',
            warning: 'API_KEY_INVALID',
            offlineKey: offline.systemKey
          });
        }
        
        // For other errors, try next model
        if (attempt < models.length - 1) {
          await new Promise(r => setTimeout(r, 500));
        }
      }
    }

    // All API attempts failed — use offline
    console.log('❌ All API attempts failed, using offline questions');
    const modeKey = normalizedCategory === 'DSA' ? dsaMode : extractedSystemType;
    const offline = getNextOfflineQuestion(normalizedCategory || 'Development', sessionId || 'default', modeKey);
    return NextResponse.json({ message: offline.question, success: true, mode: 'offline', offlineKey: offline.systemKey });

  } catch (e) {
    console.error('AI Conversation error:', e);
    return NextResponse.json({
      error: e.message || 'Failed to get AI response',
      success: false,
    }, { status: 500 });
  }
}
