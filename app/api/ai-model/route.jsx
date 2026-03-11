import { QUESTIONS_PROMPT } from '@/services/Constants';
import { NextResponse } from 'next/server';
import OpenAI from 'openai';

export async function POST(req){

   const {jobPosition,jobDescription,duration,type}=await req.json();
   
   console.log('Received request data:', {jobPosition,jobDescription,duration,type});
   
   const FINAL_PROMPT = QUESTIONS_PROMPT
   .replace('{{jobTitle}}', jobPosition)
   .replace('{{jobDescription}}', jobDescription)
   .replace('{{duration}}', duration)
   .replace('{{type}}', type);
   console.log('Generated prompt:', FINAL_PROMPT);

    try {
      
        const openai = new OpenAI({
            baseURL: "https://openrouter.ai/api/v1",
            apiKey: process.env.OPENROUTER_API_KEY,
        })
        
        const completion = await openai.chat.completions.create({
            model: "google/gemini-2.0-flash-001",
            messages: [
                { 
                    role: "user", 
                    content: FINAL_PROMPT
                }
            ],
            
        })
        
        // Extract the content from the response and return it in the expected format
        const aiResponse = completion.choices[0].message.content;
        console.log('AI Response content:', aiResponse);
        
        return NextResponse.json({
            content: aiResponse,
            success: true
        });
        
    } catch (e){
      console.log('API Error:', e)
      return NextResponse.json({
        error: e.message || 'An error occurred',
        success: false
      }, { status: 500 })
    }
  }