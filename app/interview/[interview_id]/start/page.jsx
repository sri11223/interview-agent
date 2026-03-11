"use client";
import React, { useEffect, useState, useRef, useCallback } from "react";
import axios from "axios";
import TimerComponent from "./_components/TimerComponent";
import Vapi from "@vapi-ai/web";
import * as cocoSsd from "@tensorflow-models/coco-ssd";
import "@tensorflow/tfjs"
import { supabase } from "@/services/supabaseClient";
import Image from "next/image";
import { useRouter } from "next/navigation";
import { startInterviewSession, completeInterviewSession, abandonInterviewSession } from "@/lib/interviewSessionUtils";
import AutoPhotoSyncIndicator from "@/components/AutoPhotoSyncIndicator";

// Vapi AI assistant options (dynamic)
// Note: Using console.log instead of console.error to prevent Next.js webpack error interception

function getAssistantOptions(userName, jobPosition, questionList) {
  console.log("Creating assistant options with:", { userName, jobPosition, questionList });
  
  let questionsArr = [];
  if (Array.isArray(questionList) && questionList.length > 0) {
    if (typeof questionList[0] === "object" && questionList[0] !== null && questionList[0].question) {
      questionsArr = questionList.map(q => q.question);
    } else {
      questionsArr = questionList;
    }
  } else if (questionList && typeof questionList === 'string') {
    questionsArr = [questionList];
  } else {
    questionsArr = ["Tell me about yourself and your experience.", "What are your strengths?", "Why do you want this position?"];
  }
  
  const systemPrompt = `You are a friendly AI interview coach helping a student named ${userName || "Student"} practice for ${jobPosition || "technical"} interviews.

IMPORTANT: You MUST start the conversation immediately by asking the first question. Do not wait for the student to speak first.

Your practice questions are:
${questionsArr.map((q, i) => `${i + 1}. ${q}`).join('\n')}

Interview Process:
1. Start with a friendly greeting and immediately ask the first question
2. Listen to the student's response
3. Provide brief encouraging feedback ("Great answer!", "That's a good approach", "Think about it from another angle")
4. Move to the next question
5. Ask follow-up questions when the answer needs more depth
6. After covering the main questions, wrap up the practice session

Guidelines:
- Be encouraging and supportive - this is practice!
- Keep responses short and conversational
- Give hints if the student is stuck
- Ask one question at a time
- Provide constructive feedback
- Keep the session flowing naturally

Start the practice now by greeting the student and asking the first question immediately.`;

  return {
    name: "AI Interview Coach",
    firstMessage: `Hey ${userName || "there"}! Welcome to your ${jobPosition || "interview"} practice session. I'm your AI interview coach, and I'll help you prepare. Let's dive in! ${questionsArr[0] || "Tell me about yourself."}`,
    transcriber: {
      provider: "deepgram",
      model: "nova-2",
      language: "en-US",
    },
    voice: {
      provider: "playht",
      voiceId: "jennifer",
    },
    model: {
      provider: "openai",
      model: "gpt-4",
      messages: [
        {
          role: "system",
          content: systemPrompt
        }
      ],
      temperature: 0.7,
      maxTokens: 250
    },
    endCallMessage: "Great practice session! You did well. Check your feedback to see areas to improve. Keep practicing!",
    recordingEnabled: false,
    silenceTimeoutSeconds: 30,
    maxDurationSeconds: 1800
  };
}

export default function InterviewSession({ params }) {
  // Unwrap params Promise for Next.js App Router
  const { interview_id } = React.use(params);

  // Extract URL parameters for candidate name and email
  const [candidateName, setCandidateName] = useState("");
  const [candidateEmail, setCandidateEmail] = useState("");
  
  useEffect(() => {
    // Extract URL parameters on client side
    if (typeof window !== 'undefined') {
      const urlParams = new URLSearchParams(window.location.search);
      const nameParam = urlParams.get('name') || "";
      const emailParam = urlParams.get('email') || "";
      
      console.log("📧 URL Parameters extracted:", { nameParam, emailParam });
      setCandidateName(nameParam);
      setCandidateEmail(emailParam);
    }
  }, []);

  // Feedback generation hooks and logic must be inside the component
  const [feedback, setFeedback] = useState(null);
  const [feedbackLoading, setFeedbackLoading] = useState(false);
  const [feedbackError, setFeedbackError] = useState("");
  const [feedbackSaved, setFeedbackSaved] = useState(false);
  // Conversation tracking for feedback generation
  const [conversation, setConversation] = useState("");
  const [conversationMessages, setConversationMessages] = useState([]);
  // Session tracking
  const [sessionId, setSessionId] = useState(null);
  // Ref to prevent multiple feedback generation calls
  const feedbackGenerationRef = useRef(false);

  // Generate and save feedback to Supabase (improved duplicate prevention)
  const GenerateAndSaveFeedback = async () => {
    if (!conversation || conversation.trim() === "") {
      setFeedbackError("No conversation data available for feedback generation");
      return;
    }

    // Prevent multiple simultaneous calls using ref
    if (feedbackLoading || feedbackSaved || feedbackGenerationRef.current) {
      console.log("⚠️ Feedback already being generated or saved, skipping...");
      return;
    }

    feedbackGenerationRef.current = true; // Set flag
    setFeedbackLoading(true);
    setFeedbackError("");
    
    try {
      // First check if feedback already exists for this interview and candidate
      console.log("🔍 Checking for existing feedback...");
      const { data: existingFeedback, error: checkError } = await supabase
        .from('interview-feedback')
        .select('*')
        .eq('interview_id', interview_id)
        .eq('userEmail', candidateEmail || interview?.userEmail || 'candidate@example.com')
        .eq('userName', candidateName || interview?.userName || 'Interview Candidate');

      if (checkError) {
        console.log("❌ Error checking existing feedback:", checkError);
      } else if (existingFeedback && existingFeedback.length > 0) {
        console.log("✅ Feedback already exists, skipping generation");
        setFeedbackSaved(true);
        setFeedback({ feedback: existingFeedback[0].feedback }); // Set the existing feedback
        setFeedbackError("Feedback already generated for this interview session");
        setFeedbackLoading(false);
        return;
      }

      console.log("Generating feedback for conversation:", conversation.substring(0, 100) + "...");
      
      const requestData = { 
        conversation,
        interview_id,
        jobPosition: interview?.jobPosition || "Software Developer"
      };
      
      console.log("Making API request to /api/ai-feedback");
      let result;
      let feedbackData;
      
      try {
        result = await axios.post("/api/ai-feedback", requestData);
        console.log("API Response received:", result.data);
        
        if (result.data && result.data.success && result.data.feedback) {
          feedbackData = result.data;
        } else {
          throw new Error("Invalid API response format");
        }
      } catch (apiError) {
        console.log("❌ AI API failed, using local fallback:", apiError.message);
        
        // Generate GENUINE feedback based on actual performance and completion
        const conversationLength = conversation.length;
        const responseCount = (conversation.match(/User:|Assistant:/gi) || []).length;
        const totalQuestions = interview?.questionList?.length || 5;
        
        // Calculate interview completion percentage
        const expectedResponseCount = totalQuestions * 2; // User + AI responses per question
        const completionPercentage = Math.min(100, (responseCount / expectedResponseCount) * 100);
        
        // Analyze malpractice violations
        const hasMalpractice = tabSwitchCount > 0 || objectWarningCount > 0;
        const malpracticeScore = Math.max(0, 10 - (tabSwitchCount * 2) - (objectWarningCount * 1.5));
        
        // Base scores on actual conversation quality and completion
        let baseScores = {
          technicalSkills: Math.max(1, Math.round((conversationLength / 500) * (completionPercentage / 100) * 8)),
          communication: Math.max(1, Math.round((responseCount / 10) * (completionPercentage / 100) * 8)),
          problemSolving: Math.max(1, Math.round((conversationLength / 400) * (completionPercentage / 100) * 7)),
          experience: Math.max(1, Math.round((conversationLength / 600) * (completionPercentage / 100) * 7))
        };
        
        // Apply malpractice penalties
        Object.keys(baseScores).forEach(key => {
          if (hasMalpractice) {
            baseScores[key] = Math.max(1, Math.round(baseScores[key] * (malpracticeScore / 10)));
          }
          baseScores[key] = Math.min(10, baseScores[key]); // Cap at 10
        });
        
        const avgScore = Object.values(baseScores).reduce((a, b) => a + b, 0) / 4;
        
        // Genuine recommendation based on completion and performance
        let recommendation = "Not Recommended";
        let recommendationMsg = "Candidate needs significant improvement";
        
        if (completionPercentage < 50) {
          recommendation = "Not Recommended";
          recommendationMsg = "Interview was not completed. Cannot make hiring decision based on incomplete assessment.";
        } else if (hasMalpractice && avgScore < 6) {
          recommendation = "Not Recommended";
          recommendationMsg = `Malpractice detected (${tabSwitchCount} tab switches, ${objectWarningCount} violations). Poor performance combined with integrity concerns.`;
        } else if (hasMalpractice) {
          recommendation = "Further Review";
          recommendationMsg = `Good performance but malpractice detected (${tabSwitchCount} tab switches, ${objectWarningCount} violations). Requires additional evaluation.`;
        } else if (avgScore >= 8 && completionPercentage >= 80) {
          recommendation = "Hire";
          recommendationMsg = "Excellent performance with complete interview and no integrity issues.";
        } else if (avgScore >= 6 && completionPercentage >= 70) {
          recommendation = "Further Review";
          recommendationMsg = "Good performance but requires additional assessment to confirm capabilities.";
        }
        
        feedbackData = {
          feedback: {
            rating: baseScores,
            summary: `Interview completion: ${completionPercentage.toFixed(1)}%. ${hasMalpractice ? 'Integrity concerns detected.' : 'No integrity issues found.'} Performance assessment based on actual conversation quality and completion rate.`,
            Recommendation: recommendation,
            RecommendationMsg: recommendationMsg,
            interviewCompletion: completionPercentage,
            malpracticeDetected: hasMalpractice,
            malpracticeDetails: {
              tabSwitches: tabSwitchCount,
              objectDetections: objectWarningCount,
              integrityScore: malpracticeScore
            }
          },
          success: true,
          fallback: true
        };
        
        console.log("✅ Genuine feedback generated:", feedbackData);
      }
      
      if (feedbackData && feedbackData.success && feedbackData.feedback) {
        console.log("Feedback generated successfully:", feedbackData);
        
        setFeedback(feedbackData);
        
        // Save to Supabase interview-feedback table with photo columns only
        // Your table columns: id (auto), interview_id, userEmail, feedback (json), candidate_photo_url, photo_status
        const feedbackRecord = {
          interview_id: interview_id,
          userEmail: candidateEmail || interview?.userEmail || 'candidate@example.com',
          userName: candidateName || interview?.userName || 'Interview Candidate',
          candidate_photo_url: null, // Will be updated when photo is captured
          photo_status: 'pending', // pending, completed, failed
          feedback: {
            rating: feedbackData.feedback?.rating || {
              technicalSkills: 1,
              communication: 1, 
              problemSolving: 1,
              experience: 1
            },
            summary: feedbackData.feedback?.summary || 'Interview assessment completed',
            recommendation: feedbackData.feedback?.Recommendation || feedbackData.recommendation || 'Not Recommended',
            interviewCompletion: feedbackData.feedback?.interviewCompletion || 0,
            malpracticeDetected: feedbackData.feedback?.malpracticeDetected || false,
            malpracticeDetails: feedbackData.feedback?.malpracticeDetails || {
              tabSwitches: tabSwitchCount,
              objectDetections: objectWarningCount,
              integrityScore: 10
            },
            conversation: conversation, // Store conversation inside feedback JSON
            metadata: {
              endReason: endReason || 'Completed normally',
              objectWarningCount: objectWarningCount,
              tabSwitchCount: tabSwitchCount,
              timestamp: new Date().toISOString(),
              conversationLength: conversationMessages.length,
              interviewDuration: interview?.duration || 'Unknown',
              totalQuestions: interview?.questionList?.length || 0,
              userAgent: navigator.userAgent
            }
          }
        };

        console.log("💾 Saving feedback record to database:", feedbackRecord);

        // Test database connection first
        console.log("🔍 Testing database connection...");
        const { data: testData, error: testError } = await supabase
          .from('interview-feedback')
          .select('count', { count: 'exact', head: true });
        
        if (testError) {
          console.log("❌ Database connection test failed:", testError);
          throw new Error(`Database connection error: ${testError.message}`);
        }
        
        console.log("✅ Database connection successful. Current record count:", testData);

        // Try simple insert first, then handle duplicates
        console.log("💾 Attempting to insert feedback record...");
        const { data, error } = await supabase
          .from('interview-feedback')
          .insert(feedbackRecord)
          .select();

        if (error) {
          console.log('❌ Supabase error saving feedback:', error);
          
          // If it's a duplicate error, try to update existing record
          if (error.code === '23505' || error.message?.includes('duplicate') || error.message?.includes('unique')) {
            console.log("🔄 Duplicate detected, attempting to update existing record...");
            
            const { data: updateData, error: updateError } = await supabase
              .from('interview-feedback')
              .update({ feedback: feedbackRecord.feedback })
              .eq('interview_id', interview_id)
              .eq('userEmail', feedbackRecord.userEmail)
              .eq('userName', feedbackRecord.userName)
              .select();
            
            if (updateError) {
              console.log('❌ Update failed:', updateError);
              throw new Error(`Database update error: ${updateError.message}`);
            }
            
            console.log('✅ Feedback updated successfully:', updateData);
          } else {
            throw new Error(`Database error: ${error.message}`);
          }
        } else {
          console.log('✅ Feedback inserted successfully:', data);
        }

        console.log('✅ Feedback saved to database successfully:', data);
        setFeedbackSaved(true);
        
        // Verify the record was actually saved
        console.log("🔍 Verifying saved record...");
        const { data: verifyData, error: verifyError } = await supabase
          .from('interview-feedback')
          .select('*')
          .eq('interview_id', interview_id)
          .eq('userEmail', feedbackRecord.userEmail);
        
        if (verifyError) {
          console.log('⚠️ Verification failed:', verifyError);
        } else {
          console.log('✅ Verification successful. Found records:', verifyData?.length || 0);
          console.log('📄 Record details:', verifyData);
        }
      } else {
        console.log('⚠️ No feedback data received');
        throw new Error("No feedback data received from AI service");
      }
    } catch (e) {
      // Using console.log instead of console.error to prevent Next.js webpack error interception
      console.log('❌ Error generating or saving feedback:', {
        error: e,
        message: e.message,
        response: e.response?.data,
        status: e.response?.status
      });
      
      // More specific error messages
      let errorMessage = "Error generating feedback";
      
      if (e.response) {
        const status = e.response.status;
        const responseData = e.response.data;
        
        if (status === 500) {
          errorMessage = `Server Error: ${responseData?.error || responseData?.message || 'Internal server error'}`;
        } else if (status === 400) {
          errorMessage = `Invalid Request: ${responseData?.error || 'Bad request'}`;
        } else if (status === 401) {
          errorMessage = `Authentication Error: ${responseData?.error || 'Unauthorized'}`;
        } else {
          errorMessage = `API Error (${status}): ${responseData?.error || responseData?.message || e.message}`;
        }
      } else if (e.message?.includes('Network Error')) {
        errorMessage = "Network error: Please check your internet connection";
      } else if (e.message) {
        errorMessage = e.message;
      }
      
      setFeedbackError(errorMessage);
      throw e; // Re-throw for the calling code to handle
    } finally {
      setFeedbackLoading(false);
      feedbackGenerationRef.current = false; // Reset flag
    }
  };

  // Legacy function for backward compatibility
  const GenerateFeedback = GenerateAndSaveFeedback;
  // State
  const [objectWarningCount, setObjectWarningCount] = useState(0);
  const [tabSwitchCount, setTabSwitchCount] = useState(0);
  const [interviewEnded, setInterviewEnded] = useState(false);
  const [isSpeaking, setIsSpeaking] = useState(false);
  const [aiError, setAiError] = useState("");
  const [cameraError, setCameraError] = useState("");
  const [objectWarning, setObjectWarning] = useState("");
  const [tabSwitchWarning, setTabSwitchWarning] = useState("");
  const [interview, setInterview] = useState(null);
  const [questions, setQuestions] = useState([]);
  const [loading, setLoading] = useState(false);
  const [endReason, setEndReason] = useState("");
  const [timerActive, setTimerActive] = useState(false);
  const [retryCount, setRetryCount] = useState(0);
  const router = useRouter();

  // Suppress Daily.co console errors and handle meeting end gracefully
  useEffect(() => {
    const originalError = console.error;
    
    // Override console.error to filter Daily.co errors
    console.error = (...args) => {
      const message = args.join(' ');
      // Suppress Daily.co meeting ended errors
      if (message.includes('Meeting ended due to ejection') || 
          message.includes('Meeting has ended') ||
          message.includes('daily-js') ||
          message.includes('daily-esm')) {
        console.log('📞 Interview session ended normally (Daily.co)');
        return; // Don't log these errors
      }
      originalError.apply(console, args);
    };
    
    return () => {
      console.error = originalError;
    };
  }, []);

  // Refs
  const vapiRef = useRef(null);
  const videoRef = useRef(null);
  const canvasRef = useRef(null);
  const streamRef = useRef(null);

  // --- Vapi AI Setup ---
  const [vapiStarted, setVapiStarted] = useState(false);

  // Validate VAPI API key format and basic connectivity
  const validateVapiKey = async (apiKey) => {
    if (!apiKey) {
      throw new Error("VAPI API key is missing. Please check your .env.local file.");
    }
    
    if (apiKey.length < 10) {
      throw new Error("VAPI API key appears to be invalid (too short). Please verify your API key.");
    }
    
    // Check if API key has proper format (usually starts with specific prefix)
    if (!apiKey.startsWith('vapi_') && !apiKey.includes('-')) {
      throw new Error("VAPI API key format appears incorrect. Please check your API key.");
    }
    
    // Try creating a basic Vapi instance to test the key
    try {
      const testVapi = new Vapi(apiKey);
      console.log("✅ VAPI instance created successfully with provided key");
      return true;
    } catch (error) {
      console.log("❌ Failed to create VAPI instance:", error);
      
      // Provide specific error messages based on error type
      if (error.message?.includes('401') || error.message?.includes('unauthorized')) {
        throw new Error("VAPI API key is invalid or expired. Please check your API key and account status.");
      } else if (error.message?.includes('insufficient') || error.message?.includes('credits')) {
        throw new Error("VAPI account has insufficient credits. Please add credits to your VAPI account.");
      } else if (error.message?.includes('network') || error.message?.includes('connection')) {
        throw new Error("Network error connecting to VAPI. Please check your internet connection.");
      } else {
        throw new Error(`VAPI initialization failed: ${error.message || 'Unknown error'}. Please check your API key and account credits.`);
      }
    }
  };

  // Start Vapi and timer only after questions and interview are loaded
  const startVapi = async (qs) => {
    console.log("🚀 === VAPI STARTUP PROCESS ===");
    
    if (vapiRef.current || vapiStarted) {
      console.log("⚠️ VAPI already started or starting");
      return;
    }
    
    setAiError("");
    
    // Debug: Check if API key exists
    console.log("🔑 Vapi API Key:", process.env.NEXT_PUBLIC_VAPI_API_KEY ? "Present (" + process.env.NEXT_PUBLIC_VAPI_API_KEY.substring(0, 8) + "...)" : "❌ Missing");
    console.log("📊 Questions passed:", qs);
    console.log("🎯 Interview data:", interview);
    console.log("📝 Questions length:", qs?.length || 0);
    
    const apiKey = process.env.NEXT_PUBLIC_VAPI_API_KEY;
    if (!apiKey) {
      const error = "❌ VAPI API key is missing. Please check your .env.local file.";
      console.log(error);
      setAiError(error);
      return;
    }
    
    // Basic API key validation
    if (apiKey.length < 20) {
      const error = "❌ VAPI API key appears to be invalid (too short). Please check your .env.local file.";
      console.log(error);
      setAiError(error);
      return;
    }
    
    if (!qs || qs.length === 0) {
      const error = "❌ No interview questions available. Please check your interview setup.";
      console.log(error);
      setAiError(error);
      return;
    }
    
    try {
      // Enhanced API key validation
      console.log("🔐 Validating VAPI API key...");
      try {
        await validateVapiKey(apiKey);
        console.log("✅ VAPI API key validation passed");
      } catch (validationError) {
        console.error("❌ VAPI API key validation failed:", validationError.message);
        setAiError(`🔐 API Configuration Issue: ${validationError.message}. Please contact support if this issue persists.`);
        return;
      }
      
      console.log("🎤 Requesting microphone access...");
      let stream;
      try {
        stream = await navigator.mediaDevices.getUserMedia({ audio: true });
        console.log("✅ Microphone access granted");
      } catch (micError) {
        console.error("❌ Microphone access failed:", micError.message);
        setAiError(`🎤 Microphone Access Required: Please allow microphone access and refresh the page to start the interview.`);
        return;
      }
      
      console.log("🤖 Creating VAPI instance...");
      let vapi;
      try {
        vapi = new Vapi(apiKey);
        console.log("✅ VAPI instance created successfully");
      } catch (vapiError) {
        console.error("❌ VAPI instance creation failed:", vapiError.message);
        setAiError(`🤖 Interview System Initialization Failed: Unable to initialize the AI interview system. Please try refreshing the page.`);
        return;
      }
      vapiRef.current = vapi;
      
      console.log("📞 Setting up VAPI event listeners...");
      vapi.on("speech-start", () => {
        console.log("🗣️ AI started speaking");
        setIsSpeaking(true);
      });
      
      vapi.on("speech-end", () => {
        console.log("🤫 AI stopped speaking");
        setIsSpeaking(false);
      });
      vapi.on("error", (err) => {
        // Avoid logging empty error objects to prevent webpack errors
        const hasContent = err && (err.message || Object.keys(err).length > 0);
        
        // Handle Daily.co meeting ended errors gracefully
        if (err?.message && (err.message.includes("Meeting ended") || err.message.includes("Meeting has ended") || err.message.includes("ejection"))) {
          console.log("📞 Interview session ended normally (VAPI detected Daily.co end)");
          setInterviewEnded(true);
          setIsSpeaking(false);
          endVapi();
          return; // Don't show error for normal session end
        }
        
        if (hasContent) {
          console.log("❌ VAPI Error received:", {
            error: err,
            type: typeof err,
            keys: Object.keys(err),
            stringified: JSON.stringify(err)
          });
        } else {
          console.log("⚠️ VAPI emitted empty error object - likely API key or credits issue");
        }
        
        // Parse error message for specific issues
        let errorMessage = "VAPI connection failed";
        
        if (err?.message) {
          if (err.message.includes("Wallet Balance is") || err.message.includes("Purchase More Credits")) {
            errorMessage = "⚠️ VAPI Account Issue: Insufficient credits. Please add credits to your VAPI account to continue.";
          } else if (err.message.includes("Unauthorized") || err.message.includes("Invalid API key")) {
            errorMessage = "❌ Invalid VAPI API key. Please check your .env.local file.";
          } else {
            errorMessage = `VAPI Error: ${err.message}`;
          }
        } else if (err?.type === "start-method-error") {
          errorMessage = "🔧 Interview System Temporarily Unavailable: Our AI interview system is currently experiencing technical difficulties. This could be due to server maintenance or high demand. Please try refreshing the page in a few minutes, or contact support if the issue persists.";
        } else if (err && Object.keys(err).length > 0) {
          const errStr = JSON.stringify(err);
          if (errStr.includes("Wallet Balance") || errStr.includes("Purchase More Credits")) {
            errorMessage = "⚠️ VAPI Account Issue: Insufficient credits. Please add credits to your VAPI account to continue.";
          } else {
            errorMessage = `VAPI Error: ${errStr}`;
          }
        } else {
          // Empty error object - likely API key or credits issue
          errorMessage = "🔧 Interview System Connection Error: We're unable to connect to our AI interview system right now. This is typically a temporary issue. Please try refreshing the page (Ctrl+Shift+R) or wait a few minutes and try again. If the problem continues, please contact our technical support team.";
        }
        
        console.log("💬 Setting error message:", errorMessage);
        setAiError(errorMessage);
        setIsSpeaking(false);
      });
      vapi.on("message", (message) => {
        console.log("📩 VAPI Message:", message);
        if (message.type === 'transcript') {
          console.log(`${message.role}: ${message.transcript}`);
          
          // Track conversation for feedback generation
          const timestamp = new Date().toLocaleTimeString();
          const newMessage = {
            role: message.role,
            transcript: message.transcript,
            timestamp: timestamp
          };
          
          setConversationMessages(prev => [...prev, newMessage]);
          setConversation(prev => prev + `\n[${timestamp}] ${message.role}: ${message.transcript}`);
          
          console.log("💬 Updated conversation length:", conversationMessages.length + 1);
        }
      });
      
      vapi.on("call-start", () => {
        console.log("📞 VAPI Call started");
        setIsSpeaking(false);
      });
      
      vapi.on("call-end", () => {
        console.log("📞 VAPI Call ended");
        console.log("📝 Final conversation length:", conversationMessages.length);
        console.log("💬 Final conversation:", conversation);
        setIsSpeaking(false);
        setEndReason("Interview completed successfully");
        setInterviewEnded(true);
      });
      // Create VAPI options
      const userName = candidateName || interview?.userName || "candidate";
      const jobPosition = interview?.jobPosition || "Software Developer";
      const options = getAssistantOptions(userName, jobPosition, qs || questions);
      
      console.log("🚀 Starting VAPI call...");
      console.log("⚙️ Options:", { userName, jobPosition, questionsCount: qs?.length });
      
      // Validate options
      if (!options.firstMessage) {
        throw new Error("Missing firstMessage in VAPI options");
      }
      
      // Start VAPI
      await vapi.start(options);
      console.log("✅ VAPI started successfully!");
      
      setVapiStarted(true);
      setTimerActive(true);
      
      // Start session tracking
      const session = await startInterviewSession(supabase, interview_id);
      if (session) {
        setSessionId(session.id);
        console.log("📊 Session tracking started:", session.id);
      }
    } catch (err) {
      // Using console.log instead of console.error to prevent Next.js webpack error interception
      console.log("🔥 VAPI Start Error:", {
        error: err,
        errorMessage: err?.message,
        errorType: typeof err,
        errorStack: err?.stack,
        errorKeys: err ? Object.keys(err) : [],
        stringified: JSON.stringify(err, Object.getOwnPropertyNames(err))
      });
      
      let errorMessage = "";
      
      if (err?.name === "NotAllowedError" || err?.message?.includes("microphone") || err?.message?.includes("permission")) {
        errorMessage = "Microphone access denied. Please allow microphone permissions and try again.";
      } else if (err?.message?.includes("Invalid API key") || err?.message?.includes("Unauthorized")) {
        errorMessage = "Invalid VAPI API key. Please check your .env.local file and restart the server.";
      } else if (err?.message?.includes("network") || err?.message?.includes("fetch")) {
        errorMessage = "Network error. Please check your internet connection and try again.";
      } else if (err?.message) {
        errorMessage = "VAPI Error: " + err.message;
      } else {
        errorMessage = "Failed to start interview. Please refresh the page and try again.";
      }
      
      setAiError(errorMessage);
      setIsSpeaking(false);
      setVapiStarted(false);
      setTimerActive(false);
    }
  };

  // Automatically start Vapi when questions and interview are loaded
  useEffect(() => {
    if (
      questions && questions.length > 0 &&
      interview &&
      !vapiStarted &&
      !interviewEnded &&
      !aiError  // Don't auto-start if there's already an error
    ) {
      console.log("Auto-starting VAPI: questions and interview loaded");
      
      // Add a small delay to ensure everything is properly loaded
      const startTimer = setTimeout(() => {
        startVapi(questions);
      }, 1000);
      
      return () => clearTimeout(startTimer);
    }
  }, [questions, interview, vapiStarted, interviewEnded, aiError]);

  const endVapi = useCallback(() => {
    if (vapiRef.current) {
      vapiRef.current.stop();
      vapiRef.current = null;
      setIsSpeaking(false);
      setTimerActive(false);
      setVapiStarted(false);
    }
  }, []);

  // Stop Vapi if interview ends and automatically generate feedback
  useEffect(() => {
    if (interviewEnded) {
      endVapi();
      
      // Track session completion and generate feedback
      if (endReason && endReason.includes("completed") || endReason.includes("Time is up")) {
        // Mark session as completed
        completeInterviewSession(supabase, interview_id);
      } else if (endReason) {
        // Mark session as abandoned with reason
        abandonInterviewSession(supabase, interview_id, endReason);
      }
      
      // Automatically generate and save feedback when interview ends (with duplicate prevention)
      if (conversation && conversation.trim() !== "" && !feedback && !feedbackLoading && !feedbackSaved && !feedbackGenerationRef.current) {
        console.log("🎯 Interview ended - Auto-generating feedback...");
        
        const generateFeedback = async () => {
          try {
            await GenerateAndSaveFeedback();
          } catch (error) {
            console.log("❌ Auto-feedback generation failed:", error);
          }
        };
        
        setTimeout(generateFeedback, 2000); // Wait 2 seconds to ensure conversation is complete
      }
    }
  }, [interviewEnded, conversation, feedback, feedbackLoading]);

  // Improved error handling for Daily.co meeting end
  useEffect(() => {
    if (aiError && typeof aiError === "string" && (
      aiError.includes("Meeting has ended") || 
      aiError.includes("Meeting ended due to ejection") ||
      aiError.includes("daily-js") ||
      aiError.includes("daily-esm")
    )) {
      console.log("📞 Interview session ended normally - clearing Daily.co error");
      setAiError(""); // Clear the error instead of showing a message
      setInterviewEnded(true);
      endVapi();
    }
  }, [aiError, endVapi]);

  // Proctoring: tab switch detection
  useEffect(() => {
    function handleVisibilityChange() {
      if (document.visibilityState === "hidden") {
        setTabSwitchCount((prev) => {
          const next = prev + 1;
          setTabSwitchWarning(`Tab switching detected! Warning ${next}/3`);
          setTimeout(() => setTabSwitchWarning(""), 2000);
          if (next >= 3) {
            setEndReason("Interview stopped: Tab switching detected 3 times.");
            setInterviewEnded(true);
            endVapi();
          }
          return next;
        });
      }
    }
    document.addEventListener("visibilitychange", handleVisibilityChange);
    return () => {
      document.removeEventListener("visibilitychange", handleVisibilityChange);
    };
  }, []);

  // Redirect after interview ends
  useEffect(() => {
    if (interviewEnded) {
      setTimeout(() => {
        router.push("/dashboard");
      }, 5000);
    }
  }, [interviewEnded, router]);

  // Camera and proctoring logic
  useEffect(() => {
    let isMounted = true;
    let intervalId;
    let model;
    async function startCameraAndDetection() {
      setCameraError("");
      setObjectWarning("");
      try {
        model = await cocoSsd.load();
      } catch (err) {
        setCameraError("Failed to load object detection model: " + err.message);
        return;
      }
      let stream;
      try {
        stream = await navigator.mediaDevices.getUserMedia({ video: true, audio: false });
      } catch (err) {
        setCameraError("Unable to access camera: " + err.message);
        return;
      }
      if (!isMounted) {
        stream.getTracks().forEach((track) => track.stop());
        return;
      }
      streamRef.current = stream;
      const attachStream = () => {
        if (videoRef.current) {
          videoRef.current.srcObject = stream;
        } else {
          setTimeout(attachStream, 100);
        }
      };
      attachStream();
      intervalId = setInterval(async () => {
        if (videoRef.current && videoRef.current.readyState === 4) {
          try {
            const predictions = await model.detect(videoRef.current);
            let personCount = 0;
            let phoneDetected = false;
            let bookDetected = false;
            predictions.forEach((pred) => {
              if (pred.class === "person" && pred.score > 0.7) personCount++;
              if (pred.class === "cell phone") phoneDetected = true;
              if (pred.class === "book") bookDetected = true;
            });
            if (personCount > 1) {
              setObjectWarning("Multiple persons detected! Interview will be stopped.");
              setEndReason("Interview stopped: Multiple persons detected.");
              setInterviewEnded(true);
              endVapi();
            } else if (phoneDetected && bookDetected) {
              setObjectWarning("Multiple objects (mobile phone and book) detected! Interview will be stopped.");
              setEndReason("Interview stopped: Mobile phone and book detected together.");
              setInterviewEnded(true);
              endVapi();
            } else if (phoneDetected) {
              setObjectWarning(`Mobile phone detected! Please remove it from view. Warning ${objectWarningCount + 1}/3`);
              setObjectWarningCount((prev) => {
                const next = prev + 1;
                if (next >= 3) {
                  setEndReason("Interview stopped: Mobile phone detected 3 times.");
                  setInterviewEnded(true);
                  endVapi();
                }
                return next;
              });
            } else if (bookDetected) {
              setObjectWarning(`Book detected! Please remove it from view. Warning ${objectWarningCount + 1}/3`);
              setObjectWarningCount((prev) => {
                const next = prev + 1;
                if (next >= 3) {
                  setEndReason("Interview stopped: Book detected 3 times.");
                  setInterviewEnded(true);
                  endVapi();
                }
                return next;
              });
            } else {
              setObjectWarning("");
            }
          } catch (e) {
            setObjectWarning("Object detection error: " + e.message);
          }
        }
      }, 1000);
    }
    startCameraAndDetection();
    return () => {
      isMounted = false;
      if (intervalId) clearInterval(intervalId);
      if (streamRef.current) {
        streamRef.current.getTracks().forEach((track) => track.stop());
      }
    };
    // eslint-disable-next-line
  }, [router]);

  // Fetch interview data and questions
  useEffect(() => {
    async function fetchInterview() {
      setLoading(true);
      console.log("📊 Fetching interview data for ID:", interview_id);
      
      const { data, error } = await supabase
        .from("Interviews")
        .select("*") // Select all fields for complete interview information
        .eq("interview_id", interview_id)
        .single();
      
      if (error) {
        console.error("❌ Error fetching interview:", error);
        setAiError("Failed to load interview data");
      } else {
        console.log("✅ Interview data loaded:", data);
        setInterview(data);
        setQuestions(data?.questionList || []);
      }
      
      setLoading(false);
    }
    fetchInterview();
  }, [interview_id]);

  // --- Stop Vapi only on proctoring or tab switch ---
  useEffect(() => {
    if (interviewEnded) {
      endVapi();
    }
  }, [interviewEnded]);

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="flex items-center justify-between px-8 py-4 border-b bg-white">
        <div className="flex items-center gap-2">
          <span className="font-bold text-xl text-gray-800">PrepAI Practice</span>
        </div>
        <div className="flex items-center gap-2 text-gray-700 font-mono text-lg">
          <svg className="w-6 h-6" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
            <circle cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="2" />
            <path stroke="currentColor" strokeWidth="2" d="M12 6v6l4 2" />
          </svg>
          <TimerComponent
            active={timerActive}
            duration={interview?.duration}
            onComplete={() => {
              setEndReason("Interview ended: Time is up.");
              setInterviewEnded(true);
            }}
            interviewEnded={interviewEnded}
          />
        </div>
      </div>

      {/* Main Content */}
      <div className="flex flex-col items-center mt-8">
        <h2 className="font-bold text-2xl mb-8">AI Practice Session</h2>
        {/* Interview will start automatically when questions are loaded */}
        {/* Timer removed from main content, only in header now */}
        <div className="flex flex-row gap-16 mb-12 w-full max-w-5xl justify-center">
          {/* AI Coach Card */}
          <div className={`bg-white rounded-xl shadow flex flex-col items-center justify-center w-80 h-80 transition ${isSpeaking ? "ring-4 ring-blue-400 ring-offset-2" : ""}`}>
            <div className="w-24 h-24 rounded-full bg-gray-200 flex items-center justify-center mb-4">
              <Image src="/ai.jpg" alt="AI Coach" width={96} height={96} style={{ width: "100%", height: "100%", objectFit: "cover", borderRadius: "9999px" }} />
            </div>
            <div className="font-semibold text-lg">AI Coach</div>
          </div>
          {/* User Video Card */}
          <div className="bg-white rounded-xl shadow flex flex-col items-center justify-center w-80 h-80">
            <div className="w-56 h-56 rounded-xl bg-gray-200 flex items-center justify-center overflow-hidden" style={{ position: "relative" }}>
              <video ref={videoRef} autoPlay playsInline className="w-full h-full object-cover rounded-xl" style={{ position: "absolute", top: 0, left: 0 }} />
              <canvas ref={canvasRef} className="w-full h-full absolute top-0 left-0 pointer-events-none" style={{ zIndex: 2 }} />
            </div>
            <div className="font-semibold text-lg mt-4">You</div>
          </div>
        </div>
        
        {/* Auto Photo Sync Indicator */}
        <AutoPhotoSyncIndicator 
          interviewId={interview_id} 
          candidateEmail={candidateEmail} 
        />
        
        {cameraError && (
          <div className="fixed top-4 left-1/2 transform -translate-x-1/2 bg-red-200 text-red-900 px-6 py-3 rounded shadow-lg z-50 font-semibold">
            {cameraError}
          </div>
        )}
        {objectWarning && !cameraError && !interviewEnded && (
          <div className="fixed top-4 left-1/2 transform -translate-x-1/2 bg-yellow-200 text-yellow-900 px-6 py-3 rounded shadow-lg z-50 font-semibold">
            {objectWarning}
          </div>
        )}
        {tabSwitchWarning && !interviewEnded && (
          <div className="fixed top-20 left-1/2 transform -translate-x-1/2 bg-yellow-200 text-yellow-900 px-6 py-3 rounded shadow-lg z-50 font-semibold">
            {tabSwitchWarning}
          </div>
        )}
        {interviewEnded && (
          <>
            <div className="fixed top-4 left-1/2 transform -translate-x-1/2 bg-red-200 text-red-900 px-6 py-3 rounded shadow-lg z-50 font-semibold">
              {endReason || "Interview ended."}
            </div>
            {/* Feedback Generation and Status */}
            <div className="flex flex-col items-center mt-8">
              {/* Auto-feedback status */}
              {feedbackLoading && (
                <div className="text-blue-600 mb-4 font-semibold">
                  🤖 Generating AI feedback automatically...
                </div>
              )}
              
              {feedbackSaved && (
                <div className="text-green-600 mb-4 font-semibold">
                  ✅ Feedback saved to database successfully!
                </div>
              )}
              
              {/* Manual feedback button (if auto-generation failed) */}
              {!feedbackLoading && !feedbackSaved && (
                <div className="flex gap-3">
                  <button
                    onClick={GenerateFeedback}
                    className="px-6 py-2 bg-blue-600 text-white rounded shadow hover:bg-blue-700 disabled:opacity-50"
                    disabled={feedbackLoading}
                  >
                    {feedbackLoading ? "Generating Feedback..." : "Generate Feedback"}
                  </button>
                  
                  {/* Debug Database Connection Button */}
                  <button
                    onClick={async () => {
                      console.log("🧪 Testing database connection...");
                      try {
                        // Test basic connection
                        const { data: testData, error: testError } = await supabase
                          .from('interview-feedback')
                          .select('count', { count: 'exact', head: true });
                        
                        if (testError) {
                          console.error("❌ Database test failed:", testError);
                          alert(`Database Error: ${testError.message}`);
                          return;
                        }
                        
                        console.log("✅ Database connection successful!");
                        
                        // Test insert
                        const testRecord = {
                          interview_id: 'test-' + Date.now(),
                          userEmail: candidateEmail || 'test@example.com',
                          userName: candidateName || 'Test User',
                          feedback: {
                            rating: { technicalSkills: 8, communication: 7, problemSolving: 6, experience: 9 },
                            summary: 'Database test record',
                            recommendation: 'Test',
                            metadata: { timestamp: new Date().toISOString(), test: true }
                          }
                        };
                        
                        const { data: insertData, error: insertError } = await supabase
                          .from('interview-feedback')
                          .insert(testRecord)
                          .select();
                        
                        if (insertError) {
                          console.error("❌ Insert test failed:", insertError);
                          alert(`Insert Error: ${insertError.message}\\n\\nThis might be due to:\\n1. Missing columns in table\\n2. Permission issues\\n3. Invalid data format`);
                          return;
                        }
                        
                        console.log("✅ Insert test successful:", insertData);
                        alert(`✅ Database tests passed!\\n\\nConnection: OK\\nInsert: OK\\nRecord created with ID: ${insertData[0]?.id}`);
                        
                        // Cleanup
                        await supabase.from('interview-feedback').delete().eq('interview_id', testRecord.interview_id);
                        
                      } catch (error) {
                        console.error("💥 Database test failed:", error);
                        alert(`Database Test Failed: ${error.message}`);
                      }
                    }}
                    className="px-4 py-2 bg-gray-600 text-white text-sm rounded shadow hover:bg-gray-700"
                  >
                    🧪 Test DB
                  </button>
                </div>
              )}
              
              {feedbackError && (
                <div className="text-red-600 mt-2 p-3 bg-red-100 rounded">
                  <strong>Error:</strong> {feedbackError}
                </div>
              )}
              
              {feedback && (
                <div className="mt-4 p-4 bg-gray-100 rounded shadow w-full max-w-2xl text-left">
                  <h3 className="font-bold text-lg mb-2">Interview Feedback</h3>
                  <div className="space-y-2">
                    {feedback.feedback && Object.entries(feedback.feedback).map(([key, value]) => (
                      <div key={key} className="border-b pb-2">
                        <strong className="text-blue-700">{key}:</strong> 
                        <span className="ml-2">{typeof value === 'object' ? JSON.stringify(value, null, 2) : value}</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </>
        )}
        {/* Controls */}
        {!interviewEnded && (
          <div className="flex gap-6 mb-2 justify-center">
            {/* Mic Button (Start Vapi) */}

            {/* End Call Button (End Vapi with confirmation) */}
            <button
              onClick={() => {
                if (window.confirm("Are you sure you want to cancel the interview? The interview will be cancelled.")) {
                  setEndReason("Interview cancelled by user.");
                  setInterviewEnded(true);
                  endVapi();
                }
              }}
              className="flex items-center justify-center w-12 h-12 rounded-full bg-red-500 hover:bg-red-600 shadow transition"
            >
              <svg className="w-7 h-7 text-white" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                <path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6A19.79 19.79 0 0 1 2.08 4.18 2 2 0 0 1 4.06 2h3a2 2 0 0 1 2 1.72c.13 1.05.37 2.05.7 3a2 2 0 0 1-.45 2.11l-1.27 1.27a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45c.95.33 1.95.57 3 .7A2 2 0 0 1 22 16.92z" />
              </svg>
            </button>
          </div>
        )}
        {aiError && !interviewEnded && (
          <div className="fixed top-4 left-1/2 transform -translate-x-1/2 bg-red-100 border-2 border-red-400 text-red-800 px-6 py-4 rounded-lg shadow-lg z-50 max-w-lg">
            <div className="font-bold text-lg mb-2">� Interview System Notice</div>
            <div className="mb-3">{aiError}</div>
            {(aiError.includes("Wallet Balance") || aiError.includes("Purchase More Credits") || aiError.includes("insufficient credits")) ? (
              <div className="bg-blue-50 border border-blue-300 rounded p-3 mt-3">
                <div className="font-semibold text-blue-800">💡 What to do:</div>
                <div className="text-sm text-blue-700 mt-1">
                  1. Try refreshing this page (Ctrl+Shift+R)<br/>
                  2. Check your internet connection<br/>
                  3. If the issue persists, contact our support team<br/>
                  4. You can try again in a few minutes
                </div>
              </div>
            ) : (aiError.includes("Invalid API key") || aiError.includes("Unauthorized")) ? (
              <div className="bg-blue-50 border border-blue-300 rounded p-3 mt-3">
                <div className="font-semibold text-blue-800">💡 What to do:</div>
                <div className="text-sm text-blue-700 mt-1">
                  1. Try refreshing this page (Ctrl+Shift+R)<br/>
                  2. Check your internet connection<br/>
                  3. Clear your browser cache and try again<br/>
                  4. Contact support if the issue continues
                </div>
              </div>
            ) : null}
            
            {/* Add retry button for general errors */}
            {!aiError.includes("Wallet Balance") && 
             !aiError.includes("Purchase More Credits") && 
             !aiError.includes("insufficient credits") && 
             !aiError.includes("Invalid API key") && 
             !aiError.includes("Unauthorized") && (
              <div className="mt-3">
                <button
                  onClick={() => {
                    setRetryCount(prev => prev + 1);
                    setAiError("");
                    setVapiStarted(false);
                    if (questions && questions.length > 0) {
                      setTimeout(() => startVapi(questions), 1000);
                    }
                  }}
                  className="px-4 py-2 bg-blue-600 text-white text-sm font-medium rounded-md hover:bg-blue-700 transition-colors"
                >
                  🔄 Try Again {retryCount > 0 ? `(Attempt ${retryCount + 1})` : ''}
                </button>
                {retryCount >= 2 && (
                  <div className="mt-2 p-2 bg-yellow-50 border border-yellow-200 rounded text-sm">
                    <div className="font-semibold text-yellow-800">⚠️ Multiple Attempts Failed</div>
                    <div className="text-yellow-700 mt-1">
                      The interview system is experiencing technical difficulties. You can:
                      <br/>• Refresh the entire page (F5)
                      <br/>• Try again in 5-10 minutes
                      <br/>• Contact support if the issue persists
                    </div>
                  </div>
                )}
              </div>
            )}
          </div>
        )}
        <div className="text-gray-500 text-sm mb-8">
          {aiError ? "Interview Error - Please Check Settings" : "Interview in Progress..."}
        </div>
      </div>
    </div>
  );
}