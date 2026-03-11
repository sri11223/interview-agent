
import { FEEDBACK_PROMPT } from "@/services/Constants";
import OpenAI from "openai";
import { NextResponse } from "next/server";

// Generate dynamic fallback feedback based on conversation analysis
function generateFallbackFeedback(conversation, aiResponse) {
    console.log('🔄 Generating dynamic fallback feedback');
    
    // Analyze conversation content for keywords and patterns
    const conversationLower = conversation.toLowerCase();
    
    // Extract key information from conversation
    const technicalKeywords = ['algorithm', 'database', 'api', 'framework', 'code', 'programming', 'sql', 'javascript', 'python', 'react', 'node', 'git', 'testing', 'debugging'];
    const communicationKeywords = ['explain', 'describe', 'example', 'experience', 'project', 'team', 'collaboration', 'presentation'];
    const problemSolvingKeywords = ['solve', 'approach', 'strategy', 'solution', 'challenge', 'optimize', 'improve', 'analyze'];
    const experienceKeywords = ['worked', 'developed', 'built', 'managed', 'led', 'implemented', 'designed', 'years'];
    
    // Count keyword matches
    const techMatches = technicalKeywords.filter(word => conversationLower.includes(word)).length;
    const commMatches = communicationKeywords.filter(word => conversationLower.includes(word)).length;
    const problemMatches = problemSolvingKeywords.filter(word => conversationLower.includes(word)).length;
    const expMatches = experienceKeywords.filter(word => conversationLower.includes(word)).length;
    
    // Analyze conversation length and response quality
    const conversationLength = conversation.length;
    const responseCount = (conversation.match(/User:|Assistant:|Candidate:|Interviewer:/gi) || []).length;
    const avgResponseLength = conversationLength / Math.max(responseCount, 1);
    
    // Critical: Analyze interview completion rate to prevent fake high scores
    const questionCount = (conversation.match(/Question \d+/gi) || []).length;
    const candidateResponses = (conversation.match(/\[.*\] (user|candidate):/gi) || []).length;
    
    // Determine completion penalty based on actual engagement
    let completionPenalty = 1.0; // Default no penalty
    
    if (questionCount >= 4) {
        // If 4+ questions were asked but minimal responses
        if (candidateResponses <= 2) {
            completionPenalty = 0.3; // Heavy penalty for minimal engagement
        } else if (candidateResponses <= 4) {
            completionPenalty = 0.5; // Moderate penalty
        } else if (candidateResponses <= 6) {
            completionPenalty = 0.7; // Light penalty
        }
    } else if (questionCount >= 2) {
        // If 2-3 questions asked
        if (candidateResponses <= 1) {
            completionPenalty = 0.4; // Heavy penalty
        } else if (candidateResponses <= 3) {
            completionPenalty = 0.6; // Moderate penalty
        }
    } else {
        // Less than 2 questions - very low engagement
        completionPenalty = 0.2;
    }
    
    // Additional penalty for very short responses
    if (conversationLength < 500) {
        completionPenalty *= 0.7; // Additional 30% penalty for very short conversations
    }
    
    console.log('📊 Interview Analysis:', {
        questionCount,
        candidateResponses,
        conversationLength,
        completionPenalty
    });
    
    // Generate scores based on content analysis WITH completion penalty
    const baseScores = {
        technicalSkills: Math.min(10, Math.max(1, Math.round((4 + (techMatches * 0.8) + (conversationLength / 1500)) * completionPenalty))),
        communication: Math.min(10, Math.max(1, Math.round((4 + (commMatches * 0.7) + (avgResponseLength / 150)) * completionPenalty))),
        problemSolving: Math.min(10, Math.max(1, Math.round((4 + (problemMatches * 0.9) + (responseCount / 6)) * completionPenalty))),
        experience: Math.min(10, Math.max(1, Math.round((4 + (expMatches * 0.8) + (conversationLength / 1200)) * completionPenalty)))
    };
    
    // Add some realistic variation
    Object.keys(baseScores).forEach(key => {
        const variation = Math.floor(Math.random() * 3) - 1; // -1, 0, or 1
        baseScores[key] = Math.min(10, Math.max(1, baseScores[key] + variation));
    });
    
    // Generate personalized performance summary based on conversation content
    let performanceSummary = generatePersonalizedSummary(conversation, baseScores, {
        techMatches,
        commMatches, 
        problemMatches,
        expMatches,
        conversationLength,
        responseCount
    });
    
    // Determine recommendation based on average score and completion
    const avgScore = Object.values(baseScores).reduce((a, b) => a + b, 0) / 4;
    let recommendation = "Not Recommended";
    let recommendationMsg = "";
    
    // Recommendation logic based on practice performance and completion
    if (completionPenalty < 0.5) {
        recommendation = "Needs More Practice";
        recommendationMsg = `This session had limited engagement (${candidateResponses} responses to ${questionCount} questions). Try again and focus on answering all questions thoroughly to get the most out of your practice.`;
    } else if (avgScore >= 8 && completionPenalty >= 0.8) {
        recommendation = "Excellent";
        recommendationMsg = "Outstanding performance! You demonstrated strong skills across all areas. Keep up the great work and continue challenging yourself with harder topics.";
    } else if (avgScore >= 6.5 && completionPenalty >= 0.7) {
        recommendation = "Good - Keep Practicing";
        recommendationMsg = "Solid performance with good understanding in most areas. A few more practice sessions will help you refine your responses and boost your confidence.";
    } else if (avgScore >= 5 && completionPenalty >= 0.6) {
        recommendation = "Good - Keep Practicing";
        recommendationMsg = "You're making progress! Focus on the areas where you scored lower and try practicing those specific topics to improve your overall readiness.";
    } else {
        recommendation = "Needs More Practice";
        recommendationMsg = `Your performance shows room for growth (completion: ${Math.round(completionPenalty * 100)}%). Review the feedback, study the weak areas, and practice again to build your confidence.`;
    }
    
    console.log('📊 Dynamic scores generated:', baseScores, 'Recommendation:', recommendation, 'Completion Rate:', Math.round(completionPenalty * 100) + '%');
    
    return {
        rating: baseScores,
        summary: performanceSummary,
        Recommendation: recommendation,
        RecommendationMsg: recommendationMsg
    };
}

// Generate personalized summary based on actual conversation content
function generatePersonalizedSummary(conversation, scores, analysisData) {
    const { techMatches, commMatches, problemMatches, expMatches, conversationLength, responseCount } = analysisData;
    
    console.log('🔍 Generating personalized summary with data:', {
        techMatches, commMatches, problemMatches, expMatches, 
        conversationLength, responseCount, scores
    });
    
    // Analyze interview completion and engagement
    const questionCount = (conversation.match(/Question \d+/gi) || []).length;
    const candidateResponses = (conversation.match(/\[.*\] (user|candidate):/gi) || []).length;
    const completionRate = questionCount > 0 ? (candidateResponses / (questionCount * 2)) * 100 : 0; // Expected 2 responses per question
    
    let summary = "";
    
    // Start with completion assessment
    if (completionRate < 25) {
        summary += "You had minimal engagement during the session, providing very limited responses. ";
    } else if (completionRate < 50) {
        summary += "You answered only some of the questions in this practice session. ";
    } else if (completionRate < 75) {
        summary += "You participated moderately, though some questions received incomplete responses. ";
    } else {
        summary += "Great job! You actively participated throughout the session with comprehensive responses. ";
    }
    
    // Analyze technical performance based on actual scores (with completion penalty applied)
    if (scores.technicalSkills >= 7) {
        if (techMatches >= 5) {
            summary += "Demonstrated strong technical expertise, discussing multiple technologies and concepts with confidence. ";
        } else {
            summary += "Showed solid technical understanding with good grasp of fundamental concepts. ";
        }
    } else if (scores.technicalSkills >= 4) {
        summary += "Displayed basic technical knowledge, though some areas could benefit from deeper exploration. ";
    } else {
        summary += "Limited technical expertise was evident, indicating need for significant skill development. ";
    }
    
    // Analyze communication based on conversation flow and actual engagement
    if (conversationLength > 2000 && candidateResponses >= 6) {
        summary += "The interview featured detailed discussions with comprehensive responses, indicating strong communication abilities. ";
    } else if (conversationLength > 1000 && candidateResponses >= 4) {
        summary += "Communication was adequate with reasonable detail in responses. ";
    } else if (candidateResponses >= 2) {
        summary += "Responses were brief and could benefit from more detailed explanations. ";
    } else {
        summary += "Very limited communication with minimal responses provided throughout the interview. ";
    }
    
    // Analyze problem-solving approach with context of engagement
    if (problemMatches >= 3 && candidateResponses >= 4) {
        summary += "The candidate demonstrated analytical thinking and problem-solving approach throughout the discussion. ";
    } else if (problemMatches >= 1 && candidateResponses >= 2) {
        summary += "Some problem-solving capabilities were evident, though more systematic thinking could be beneficial. ";
    } else {
        summary += "Limited evidence of structured problem-solving approach due to minimal engagement in the interview process. ";
    }
    
    // Analyze experience level with realistic assessment
    if (expMatches >= 4 && candidateResponses >= 4) {
        summary += "You demonstrated substantial knowledge through detailed project discussions and practical examples.";
    } else if (expMatches >= 2 && candidateResponses >= 2) {
        summary += "You showed some relevant experience. Practice articulating your projects and accomplishments for stronger impact.";
    } else {
        summary += "Try to share more about your projects and experiences in future sessions to better showcase your abilities.";
    }
    
    console.log('✅ Generated realistic summary:', summary);
    return summary;
}

export async function POST(req){
    try {
        console.log('AI Feedback API called');
        const {conversation} = await req.json();
        
        // Validate input
        if (!conversation || typeof conversation !== 'string' || conversation.trim() === '') {
            console.error('Invalid conversation data:', typeof conversation, conversation ? conversation.length : 'null');
            return NextResponse.json({
                error: 'No conversation data provided',
                success: false
            }, { status: 400 });
        }

        console.log('Conversation data received, length:', conversation.length);

        // Try AI feedback first, then fallback if it fails
        try {
            console.log('🤖 Attempting AI feedback generation...');
            
            if (!process.env.OPENROUTER_API_KEY) {
                throw new Error('OPENROUTER_API_KEY not found');
            }

            const FINAL_PROMPT = FEEDBACK_PROMPT.replace('{{conversation}}', conversation);
            console.log('Generating AI feedback for conversation length:', conversation.length);
            
            const openai = new OpenAI({
                baseURL: "https://openrouter.ai/api/v1",
                apiKey: process.env.OPENROUTER_API_KEY,
                timeout: 30000,
            });

            const completion = await openai.chat.completions.create({
                model: "meta-llama/llama-3.1-8b-instruct:free",
                messages: [
                    {
                        role: "user",
                        content: FINAL_PROMPT
                    }
                ],
                max_tokens: 1000,
                temperature: 0.7
            });
            
            if (!completion.choices || !completion.choices[0] || !completion.choices[0].message) {
                throw new Error('Invalid response from AI service');
            }

            const responseContent = completion.choices[0].message.content;
            console.log('Raw AI response:', responseContent);
            
            // Try to parse JSON response
            let feedbackData;
            try {
                // Clean the response and extract JSON
                const jsonMatch = responseContent.match(/\{[\s\S]*\}/);
                if (jsonMatch) {
                    feedbackData = JSON.parse(jsonMatch[0]);
                    console.log('✅ Successfully parsed AI feedback JSON:', feedbackData);
                    
                    // Validate the feedback structure
                    if (feedbackData.feedback && feedbackData.feedback.rating && feedbackData.feedback.summary) {
                        return NextResponse.json({
                            feedback: feedbackData.feedback,
                            success: true,
                            source: 'ai-generated'
                        });
                    } else {
                        throw new Error('Invalid feedback structure from AI');
                    }
                } else {
                    throw new Error('No JSON found in AI response');
                }
            } catch (parseError) {
                console.error('JSON parsing failed:', parseError);
                throw new Error('Failed to parse AI response');
            }
            
        } catch (aiError) {
            console.log('⚠️ AI feedback failed, using enhanced fallback:', aiError.message);
            
            // Use enhanced fallback with conversation analysis
            const fallbackFeedbackData = {
                feedback: generateFallbackFeedback(conversation, "Enhanced fallback feedback based on interview conversation analysis.")
            };
            
            console.log('✅ Enhanced fallback feedback generated:', fallbackFeedbackData);
            console.log('🔍 Fallback summary preview:', fallbackFeedbackData.feedback.summary.substring(0, 100) + '...');
            
            return NextResponse.json({
                feedback: fallbackFeedbackData.feedback,
                success: true,
                source: 'fallback-enhanced',
                message: "Using enhanced conversation analysis for feedback generation",
                debug: {
                    conversationLength: conversation.length,
                    summaryGenerated: true,
                    timestamp: new Date().toISOString()
                }
            });
        }

        
    } catch (e) {
        console.error('AI Feedback API Error Details:', {
            message: e.message,
            stack: e.stack,
            name: e.name,
            code: e.code,
            response: e.response?.data
        });
        
        let errorMessage = 'An error occurred while generating feedback';
        let errorCode = 'UNKNOWN_ERROR';
        
        if (e.message?.includes('API key') || e.message?.includes('401')) {
            errorMessage = 'Invalid OpenRouter API key configuration';
            errorCode = 'API_KEY_ERROR';
        } else if (e.message?.includes('network') || e.message?.includes('timeout') || e.message?.includes('Connection')) {
            errorMessage = 'Network error connecting to AI service. Please try again.';
            errorCode = 'NETWORK_ERROR';
        } else if (e.message?.includes('rate limit') || e.message?.includes('429')) {
            errorMessage = 'AI service rate limit exceeded. Please try again later.';
            errorCode = 'RATE_LIMIT_ERROR';
        } else if (e.message?.includes('No endpoints found') || e.message?.includes('404')) {
            errorMessage = 'AI model not available. Using fallback response.';
            errorCode = 'MODEL_ERROR';
            
            // Return fallback feedback instead of error
            return NextResponse.json({
                feedback: generateFallbackFeedback(conversation, "Interview assessment completed with AI assistance."),
                success: true,
                fallback: true
            });
        } else if (e.message) {
            errorMessage = e.message;
        }
        
        return NextResponse.json({
            error: errorMessage,
            success: false,
            errorCode: errorCode,
            details: e.name || 'Unknown error type'
        }, { status: 500 });
    }
}

