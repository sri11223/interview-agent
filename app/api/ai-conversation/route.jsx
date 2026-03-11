import { NextResponse } from 'next/server';
import OpenAI from 'openai';

export async function POST(req) {
  try {
    const { messages, category, description, duration, userName } = await req.json();

    if (!messages || !Array.isArray(messages)) {
      return NextResponse.json({ error: 'Messages array is required' }, { status: 400 });
    }

    const durationMinutes = parseInt(duration) || 30;
    const questionCount = Math.max(3, Math.min(12, Math.floor(durationMinutes / 3)));

    // Category-specific prompts for much better interviews
    const categoryPrompts = {
      'DSA': `You are an expert coding interview coach. Focus on Data Structures & Algorithms.

QUESTION TOPICS (rotate through these):
- Arrays & Strings: two pointers, sliding window, prefix sums, kadane's algorithm
- Linked Lists: reversal, cycle detection, merge, fast/slow pointers
- Trees & Graphs: BFS, DFS, binary search trees, topological sort
- Dynamic Programming: memoization, tabulation, classic problems (knapsack, LCS, coin change)
- Sorting & Searching: binary search variations, merge sort, quick sort
- Stacks & Queues: monotonic stack, min stack, queue with stacks
- Hash Maps: frequency counting, two sum patterns, anagram detection

INTERVIEW STYLE:
- Ask the student to explain their APPROACH first (don't jump to code)
- Ask about time and space complexity after they explain
- Give hints if stuck: "What data structure would help here?" or "Think about what happens if you sort the array first"
- Ask follow-up: "Can you optimize that?" or "What if the input is very large?"
- Mix easy, medium, and hard problems progressively`,

      'Development': `You are an expert software engineering interview coach. Focus on Web/App Development.

QUESTION TOPICS (rotate through these):
- JavaScript/TypeScript: closures, promises, async/await, event loop, prototypes, hoisting
- React: hooks (useState, useEffect, useMemo, useCallback), state management, virtual DOM, lifecycle
- Node.js: event-driven architecture, streams, middleware, Express patterns, error handling
- APIs: REST vs GraphQL, authentication (JWT, OAuth), rate limiting, pagination
- Databases: SQL vs NoSQL, indexing, normalization, ORM patterns, query optimization
- DevOps basics: Docker, CI/CD, environment variables, deployment strategies
- Testing: unit tests, integration tests, mocking, TDD approach
- Git: branching strategies, merge vs rebase, conflict resolution

INTERVIEW STYLE:
- Ask practical scenario questions: "How would you implement..."
- Include debugging scenarios: "This code has a bug, can you spot it?"
- Ask about trade-offs: "Why would you choose X over Y?"
- Cover both frontend and backend
- Ask about real-world patterns: caching, error handling, security`,

      'System Design': `You are an expert system design interview coach.

QUESTION TOPICS:
- Design scalable systems: URL shortener, chat app, social media feed, file storage
- Key concepts: load balancing, caching (Redis), CDN, message queues, microservices
- Database choices: SQL vs NoSQL, sharding, replication, consistency vs availability
- API design, rate limiting, authentication at scale
- Monitoring, logging, alerting systems

INTERVIEW STYLE:
- Start with requirements gathering: "What features should we support?"
- Guide through: high-level design → detailed component design → scaling
- Ask about trade-offs and bottlenecks
- Probe: "What happens when this component fails?"`,

      'Behavioral': `You are a warm, supportive behavioral interview coach.

QUESTION TOPICS:
- Tell me about yourself / career goals
- Teamwork: conflict resolution, collaboration, leadership
- Challenges: technical failures, tight deadlines, learning from mistakes
- Growth: biggest learning, adapting to change, feedback handling
- STAR method: Situation, Task, Action, Result

INTERVIEW STYLE:
- Be encouraging and warm
- Ask follow-ups that dig deeper: "How did that make you feel?" "What would you do differently?"
- Coach them on STAR method if answers are vague`,
    };

    const categoryPrompt = categoryPrompts[category] || categoryPrompts['Development'];

    const systemPrompt = `${categoryPrompt}

You are conducting a ${category || 'technical'} practice interview with ${userName || 'a student'}.
${description || ''}
Session: ~${durationMinutes} minutes, approximately ${questionCount} questions.

CORE RULES:
- Ask ONE question at a time, then wait for response.
- Start easier, gradually increase difficulty.
- After each answer: give 1-2 sentences of brief feedback, then next question.
- If stuck, give a hint. If they say "skip" or "I don't know", be positive and move on.
- Keep responses SHORT (2-4 sentences max). Be conversational, not lecturing.
- After ~${questionCount} questions, wrap up with a brief summary.
- NEVER repeat questions. Don't number them.
- Be warm, supportive, and professional.`;

    const openai = new OpenAI({
      baseURL: 'https://openrouter.ai/api/v1',
      apiKey: process.env.OPENROUTER_API_KEY,
    });

    const completion = await openai.chat.completions.create({
      model: 'google/gemini-2.0-flash-001',
      messages: [
        { role: 'system', content: systemPrompt },
        ...messages,
      ],
      temperature: 0.7,
      max_tokens: 300,
    });

    const aiMessage = completion.choices[0]?.message?.content || "Could you repeat that? I didn't quite catch it.";

    return NextResponse.json({ message: aiMessage, success: true });
  } catch (e) {
    console.error('AI Conversation error:', e);
    return NextResponse.json({
      error: e.message || 'Failed to get AI response',
      success: false,
    }, { status: 500 });
  }
}
