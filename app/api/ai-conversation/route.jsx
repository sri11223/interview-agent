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

    const systemPrompt = `You are an expert AI interview coach conducting a ${category || 'technical'} practice interview with a student named ${userName || 'Student'}.

${description || ''}

Session info: ~${durationMinutes} minutes, approximately ${questionCount} questions.

RULES:
- Ask ONE question at a time, then wait for the student's response.
- Start with easier questions, gradually increase difficulty.
- After the student answers, give 1-2 sentences of brief feedback, then ask the next question.
- If the student seems stuck, give a hint or say "Take your time!"
- If they say "I don't know" or "skip", acknowledge positively and move on.
- Ask follow-up questions when answers lack depth.
- Keep responses SHORT and conversational (2-4 sentences max).
- After ~${questionCount} questions, wrap up: briefly summarize performance and say goodbye.
- Be warm, supportive, and professional.
- NEVER repeat the same question.
- Do NOT number your questions or say "Question 1", just ask naturally.`;

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
