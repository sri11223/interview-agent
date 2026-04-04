import { NextResponse } from 'next/server';
import { logError } from '@/lib/logger';

export async function POST(req) {
    try {
        const body = await req.json();
        
        logError(`FRONTEND - Session: ${body.sessionId} | User: ${body.user} | Context: ${body.context}`, body.error);
        
        return NextResponse.json({ success: true, message: "Error logged successfully" });
    } catch (e) {
        console.error("Log error endpoint failed.", e);
        return NextResponse.json({ success: false, error: "Failed to log error" }, { status: 500 });
    }
}