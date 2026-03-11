import { NextResponse } from 'next/server';
import OpenAI from 'openai';

// ========== OFFLINE QUESTION BANKS (used when API key is invalid/missing) ==========
const OFFLINE_QUESTIONS = {
  'DSA': [
    "Good attempt! Now, given an array of integers, how would you find two numbers that add up to a specific target? What data structure would make this efficient?",
    "Nice thinking! Let's move to linked lists. How would you detect if a linked list has a cycle? Can you describe the algorithm?",
    "Alright, let's try trees. How would you check if a binary tree is balanced? What's the time complexity of your approach?",
    "Good! Now a classic — can you explain how merge sort works step by step? What's its time and space complexity?",
    "Let's try dynamic programming. How would you solve the climbing stairs problem — if you can take 1 or 2 steps, how many ways to reach step N?",
    "Nice! How would you implement a stack that supports push, pop, and getMin — all in O(1) time?",
    "Here's a string problem — how would you check if two strings are anagrams of each other? What's the most efficient way?",
    "Let's do graphs. Can you explain the difference between BFS and DFS? When would you use each one?",
    "Good work! How would you find the longest substring without repeating characters? Walk me through your approach.",
    "Last one — how would you reverse a linked list iteratively? What pointers do you need to keep track of?",
    "That wraps up our DSA session! You covered arrays, trees, sorting, and more. Great practice — keep solving problems daily. Best of luck!",
  ],
  'Development': [
    "Good answer! Now tell me — what's the difference between let, const, and var in JavaScript? When would you use each?",
    "Nice! Can you explain how closures work in JavaScript? Give me a practical example of when you'd use one.",
    "Let's talk React. What's the difference between useState and useEffect? When does useEffect run?",
    "Good! How would you handle API calls in a React component? What about loading states and error handling?",
    "Now Node.js — can you explain the event loop? What makes Node.js non-blocking?",
    "Let's talk APIs. What's the difference between REST and GraphQL? When would you choose one over the other?",
    "How would you handle authentication in a web app? Explain the JWT flow from login to protected route access.",
    "Database question — what's the difference between SQL and NoSQL databases? Give an example use case for each.",
    "How would you optimize a slow React application? What tools and techniques would you use?",
    "Last question — explain the difference between git merge and git rebase. When would you use each?",
    "That wraps up our Development session! You covered JavaScript, React, Node.js, databases, and more. Great practice — keep building projects. Best of luck!",
  ],
  'System Design': [
    "Good thinking! Now, how would you design a chat application like WhatsApp? What are the key components?",
    "Nice! Let's talk databases — when would you use SQL vs NoSQL for a social media app? How would you handle scaling?",
    "How would you implement a caching layer? When would you use Redis vs Memcached?",
    "Good! How would you design a notification system that can handle millions of users? What queue system would you use?",
    "Let's talk about load balancing. What strategies exist, and how would you choose between them?",
    "How would you design a file storage service like Google Drive? Think about upload, download, and sharing.",
    "What's the CAP theorem? How does it affect your database choices in a distributed system?",
    "How would you handle rate limiting for an API? What algorithms can you use?",
    "How would you design a search autocomplete feature? What data structures would power it?",
    "Last one — how would you monitor and log errors in a microservices architecture? What tools would you use?",
    "That wraps up our System Design session! You covered scaling, databases, caching, and distributed systems. Great practice — keep studying system design patterns. Best of luck!",
  ],
  'Behavioral': [
    "Thanks for sharing! Can you tell me about a time you faced a difficult technical challenge? How did you approach it?",
    "Good story! Describe a situation where you had a disagreement with a teammate. How did you resolve it?",
    "Nice! Tell me about a project you're most proud of. What was your specific contribution?",
    "What's the biggest mistake you've made in a project? What did you learn from it?",
    "How do you handle tight deadlines? Give me a specific example.",
    "Tell me about a time you had to learn something new quickly. How did you approach the learning?",
    "How do you prioritize tasks when everything seems urgent? Walk me through your process.",
    "Describe a time you received critical feedback. How did you respond?",
    "What motivates you as a developer? Where do you see yourself in 3 years?",
    "Last question — why should a team want to work with you? What unique value do you bring?",
    "That wraps up our Behavioral session! You shared some great experiences. Remember to use the STAR method — Situation, Task, Action, Result. Best of luck!",
  ],
};

// Track question index per interview session (in-memory, resets on server restart)
const sessionTracker = new Map();

function getNextOfflineQuestion(category, sessionId) {
  const key = `${sessionId}-${category}`;
  const questions = OFFLINE_QUESTIONS[category] || OFFLINE_QUESTIONS['Development'];
  
  let index = sessionTracker.get(key) || 0;
  if (index >= questions.length) index = questions.length - 1; // Stay on wrap-up
  
  const question = questions[index];
  sessionTracker.set(key, index + 1);
  
  // Clean up old sessions (keep map from growing)
  if (sessionTracker.size > 1000) {
    const entries = [...sessionTracker.entries()];
    entries.slice(0, 500).forEach(([k]) => sessionTracker.delete(k));
  }
  
  return question;
}

// ========== MAIN HANDLER ==========
export async function POST(req) {
  try {
    const body = await req.json();
    const { messages, category, description, duration, userName, sessionId } = body;

    if (!messages || !Array.isArray(messages)) {
      return NextResponse.json({ error: 'Messages array is required' }, { status: 400 });
    }

    const durationMinutes = parseInt(duration) || 30;
    const questionCount = Math.max(3, Math.min(12, Math.floor(durationMinutes / 3)));

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

      'Development': `You are an expert full-stack web development interview coach. ONLY ask development questions.

TOPICS: JavaScript (closures, promises, async/await, event loop, prototypes), React (hooks, state, virtual DOM),
Node.js (event-driven, streams, Express), APIs (REST, GraphQL, JWT, OAuth), Databases (SQL, NoSQL, indexing),
CSS/HTML, TypeScript, Git, Testing, Docker, CI/CD, Performance optimization.

RULES:
- Ask practical questions: "How would you implement..."
- Include debugging scenarios
- Ask about trade-offs
- Cover both frontend AND backend
- NEVER ask DSA algorithm questions or system design questions`,

      'System Design': `You are an expert system design interview coach. ONLY ask system design questions.

TOPICS: URL shortener, chat app, social feed, file storage, notification system, search engine,
Load balancing, Caching (Redis, CDN), Message queues, Microservices, Database sharding,
API rate limiting, Monitoring, CAP theorem, Consistency patterns.

RULES:
- Start with requirements, then high-level, then details, then scaling
- Ask about trade-offs and failure scenarios
- NEVER ask coding/algorithm questions`,

      'Behavioral': `You are a warm behavioral interview coach.

TOPICS: Tell me about yourself, teamwork, conflict resolution, failures, learning, leadership, 
tight deadlines, feedback, career goals, STAR method.

RULES:
- Be encouraging and warm
- Dig deeper with follow-ups
- Coach on STAR method if answers lack structure`,
    };

    const categoryPrompt = categoryPrompts[category] || categoryPrompts['Development'];

    const systemPrompt = `${categoryPrompt}

You are interviewing ${userName || 'a student'} for ${category || 'technical'} practice.
${description ? `Context: ${description}` : ''}
Session: ~${durationMinutes} min, ~${questionCount} questions.

CORE RULES:
- ONE question at a time.
- After each answer: 1-2 sentences feedback, then next question.
- Keep responses SHORT (2-4 sentences). Be conversational.
- After ~${questionCount} questions, wrap up briefly.
- NEVER repeat questions. Don't number them.
- STAY ON TOPIC for ${category}. Do NOT drift to other categories.`;

    // ---- Try API call ----
    const apiKey = process.env.OPENROUTER_API_KEY;
    
    if (!apiKey || apiKey.length < 10) {
      // No API key — use offline questions
      console.log('⚠️ No OpenRouter API key configured, using offline questions');
      const question = getNextOfflineQuestion(category || 'Development', sessionId || 'default');
      return NextResponse.json({ message: question, success: true, mode: 'offline' });
    }

    const openai = new OpenAI({
      baseURL: 'https://openrouter.ai/api/v1',
      apiKey,
    });

    // Try primary model, then free fallback
    const models = ['google/gemini-2.0-flash-001', 'meta-llama/llama-3.3-70b-instruct:free'];
    
    for (let attempt = 0; attempt < models.length; attempt++) {
      try {
        const completion = await openai.chat.completions.create({
          model: models[attempt],
          messages: [
            { role: 'system', content: systemPrompt },
            ...messages,
          ],
          temperature: 0.7,
          max_tokens: 300,
        });
        const aiMessage = completion.choices[0]?.message?.content;
        if (aiMessage) {
          return NextResponse.json({ message: aiMessage, success: true, mode: 'ai' });
        }
      } catch (err) {
        console.error(`AI attempt ${attempt + 1} failed (${models[attempt]}):`, err.message);
        
        if (err.status === 401 || err.status === 403) {
          // API key is invalid — fall back to offline questions immediately
          console.log('🔑 API key invalid (401), switching to offline mode');
          const question = getNextOfflineQuestion(category || 'Development', sessionId || 'default');
          return NextResponse.json({ 
            message: question, 
            success: true, 
            mode: 'offline',
            warning: 'API_KEY_INVALID'
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
    const question = getNextOfflineQuestion(category || 'Development', sessionId || 'default');
    return NextResponse.json({ message: question, success: true, mode: 'offline' });

  } catch (e) {
    console.error('AI Conversation error:', e);
    return NextResponse.json({
      error: e.message || 'Failed to get AI response',
      success: false,
    }, { status: 500 });
  }
}
