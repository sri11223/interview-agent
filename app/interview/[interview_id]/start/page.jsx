"use client";
import React, { useEffect, useState, useRef, useCallback } from "react";
import axios from "axios";
import TimerComponent from "./_components/TimerComponent";
import CodeEditor from "./_components/CodeEditor";
import * as cocoSsd from "@tensorflow-models/coco-ssd";
import "@tensorflow/tfjs";
import { supabase } from "@/services/supabaseClient";
import { useRouter } from "next/navigation";

export default function InterviewSession({ params }) {
  const { interview_id } = React.use(params);
  const router = useRouter();

  // --- State ---
  const [candidateName, setCandidateName] = useState("");
  const [candidateEmail, setCandidateEmail] = useState("");
  const [authEmail, setAuthEmail] = useState("");
  const [interview, setInterview] = useState(null);
  const [loading, setLoading] = useState(true);

  // Conversation
  const [messages, setMessages] = useState([]);
  const [conversation, setConversation] = useState("");
  const [questionCount, setQuestionCount] = useState(0);

  // AI / Speech
  const [aiThinking, setAiThinking] = useState(false);
  const [isSpeaking, setIsSpeaking] = useState(false);
  const [isListening, setIsListening] = useState(false);
  const [userTranscript, setUserTranscript] = useState("");
  const [aiError, setAiError] = useState("");
  const [speechSupported, setSpeechSupported] = useState(true);

  // Interview flow
  const [interviewStarted, setInterviewStarted] = useState(false);
  const [interviewEnded, setInterviewEnded] = useState(false);
  const [endReason, setEndReason] = useState("");
  const [timerActive, setTimerActive] = useState(false);

  // Voice
  const [voiceGender, setVoiceGender] = useState("female");

  // Code Editor
  const [showCodeEditor, setShowCodeEditor] = useState(false);
  const codeCategory = interview?.jobPosition === "DSA" || interview?.jobPosition === "Development";

  // Proctoring
  const [objectWarningCount, setObjectWarningCount] = useState(0);
  const [tabSwitchCount, setTabSwitchCount] = useState(0);
  const [objectWarning, setObjectWarning] = useState("");
  const [tabSwitchWarning, setTabSwitchWarning] = useState("");
  const [cameraError, setCameraError] = useState("");

  // Feedback
  const [feedback, setFeedback] = useState(null);
  const [feedbackLoading, setFeedbackLoading] = useState(false);
  const [feedbackError, setFeedbackError] = useState("");
  const [feedbackSaved, setFeedbackSaved] = useState(false);
  const feedbackGenerationRef = useRef(false);

  // Refs
  const videoRef = useRef(null);
  const canvasRef = useRef(null);
  const streamRef = useRef(null);
  const recognitionRef = useRef(null);
  const messagesRef = useRef([]);
  const silenceTimerRef = useRef(null);
  const interviewEndedRef = useRef(false);
  const scrollRef = useRef(null);
  const apiFailCountRef = useRef(0);

  // Keep refs in sync
  useEffect(() => { messagesRef.current = messages; }, [messages]);
  useEffect(() => { interviewEndedRef.current = interviewEnded; }, [interviewEnded]);

  // Auto-scroll
  useEffect(() => {
    if (scrollRef.current) scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
  }, [messages, userTranscript, aiThinking]);

  // --- Get auth email from Supabase session ---
  useEffect(() => {
    async function getAuth() {
      const { data } = await supabase.auth.getSession();
      if (data?.session?.user?.email) setAuthEmail(data.session.user.email);
    }
    getAuth();
  }, []);

  // --- Extract URL params ---
  useEffect(() => {
    if (typeof window !== "undefined") {
      const p = new URLSearchParams(window.location.search);
      setCandidateName(p.get("name") || "");
      setCandidateEmail(p.get("email") || "");
    }
  }, []);

  // --- Check Speech Support ---
  useEffect(() => {
    if (typeof window !== "undefined") {
      const hasSynth = "speechSynthesis" in window;
      const hasRecog = "SpeechRecognition" in window || "webkitSpeechRecognition" in window;
      if (!hasSynth || !hasRecog) {
        setSpeechSupported(false);
        setAiError("Your browser doesn't support voice. Please use Google Chrome or Microsoft Edge.");
      }
    }
  }, []);

  // --- Fetch interview ---
  useEffect(() => {
    async function fetchInterview() {
      setLoading(true);
      const { data, error } = await supabase
        .from("Interviews")
        .select("*")
        .eq("interview_id", interview_id)
        .single();
      if (error) {
        setAiError("Failed to load interview. Please go back and try again.");
      } else {
        setInterview(data);
      }
      setLoading(false);
    }
    fetchInterview();
  }, [interview_id]);

  // --- Speech Synthesis ---
  const speak = useCallback((text) => {
    return new Promise((resolve) => {
      if (!("speechSynthesis" in window)) { resolve(); return; }
      window.speechSynthesis.cancel();
      const utterance = new SpeechSynthesisUtterance(text);
      utterance.rate = 0.95;
      utterance.pitch = voiceGender === "female" ? 1.1 : 0.85;
      const voices = window.speechSynthesis.getVoices();
      let preferred;
      if (voiceGender === "female") {
        preferred = voices.find(v => v.name.includes("Google UK English Female")) ||
                    voices.find(v => v.name.toLowerCase().includes("female") && v.lang.startsWith("en")) ||
                    voices.find(v => v.name.includes("Samantha")) || voices.find(v => v.name.includes("Zira"));
      } else {
        preferred = voices.find(v => v.name.includes("Google UK English Male")) ||
                    voices.find(v => v.name.toLowerCase().includes("male") && v.lang.startsWith("en") && !v.name.toLowerCase().includes("female")) ||
                    voices.find(v => v.name.includes("Daniel")) || voices.find(v => v.name.includes("David"));
      }
      if (!preferred) preferred = voices.find(v => v.lang.startsWith("en-US")) || voices.find(v => v.lang.startsWith("en"));
      if (preferred) utterance.voice = preferred;
      utterance.onstart = () => setIsSpeaking(true);
      utterance.onend = () => { setIsSpeaking(false); resolve(); };
      utterance.onerror = () => { setIsSpeaking(false); resolve(); };
      window.speechSynthesis.speak(utterance);
    });
  }, [voiceGender]);

  // --- Speech Recognition ---
  const startListening = useCallback(() => {
    if (interviewEndedRef.current) return;
    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
    if (!SpeechRecognition) return;
    if (recognitionRef.current) { try { recognitionRef.current.abort(); } catch {} }

    const recognition = new SpeechRecognition();
    recognition.continuous = true;
    recognition.interimResults = true;
    recognition.lang = "en-US";
    let finalTranscript = "";
    let lastSpeechTime = Date.now();

    recognition.onstart = () => {
      setIsListening(true);
      setUserTranscript("");
      finalTranscript = "";
      lastSpeechTime = Date.now();
      if (silenceTimerRef.current) clearInterval(silenceTimerRef.current);
      silenceTimerRef.current = setInterval(() => {
        if (Date.now() - lastSpeechTime > 8000 && finalTranscript.trim()) {
          clearInterval(silenceTimerRef.current);
          recognition.stop();
        }
      }, 1000);
    };

    recognition.onresult = (event) => {
      let interim = "";
      for (let i = event.resultIndex; i < event.results.length; i++) {
        const t = event.results[i][0].transcript;
        if (event.results[i].isFinal) { finalTranscript += t + " "; lastSpeechTime = Date.now(); }
        else interim = t;
      }
      setUserTranscript(finalTranscript + interim);
    };

    recognition.onend = () => {
      setIsListening(false);
      if (silenceTimerRef.current) clearInterval(silenceTimerRef.current);
      const answer = finalTranscript.trim();
      if (answer && !interviewEndedRef.current) processStudentAnswer(answer);
      else if (!interviewEndedRef.current) setTimeout(() => startListening(), 500);
    };

    recognition.onerror = (e) => {
      setIsListening(false);
      if (silenceTimerRef.current) clearInterval(silenceTimerRef.current);
      if (e.error === "no-speech") {
        if (!interviewEndedRef.current) setTimeout(() => startListening(), 500);
      } else if (e.error === "not-allowed") {
        setAiError("Microphone access denied. Please allow mic and refresh.");
      }
    };

    recognition.start();
    recognitionRef.current = recognition;
  }, []);

  // --- Process answer & get AI response ---
  const processStudentAnswer = useCallback(async (answer) => {
    if (interviewEndedRef.current) return;
    const userMsg = { role: "user", content: answer };
    const updated = [...messagesRef.current, userMsg];
    setMessages(updated);
    setConversation(prev => prev + `\nStudent: ${answer}`);
    setUserTranscript("");
    setAiThinking(true);

    try {
      const res = await axios.post("/api/ai-conversation", {
        messages: updated,
        category: interview?.jobPosition,
        description: interview?.jobDescription,
        duration: interview?.duration,
        userName: candidateName,
        sessionId: interview_id,
      });

      if (res.data?.warning === "API_KEY_INVALID") {
        setAiError("OpenRouter API key issue — please update your .env.local OPENROUTER_API_KEY");
      }

      if (res.data?.success && res.data?.message) {
        apiFailCountRef.current = 0;
        const aiText = res.data.message;
        setMessages(prev => [...prev, { role: "assistant", content: aiText }]);
        setConversation(prev => prev + `\nAI Coach: ${aiText}`);
        setQuestionCount(prev => prev + 1);
        setAiThinking(false);

        const lower = aiText.toLowerCase();
        if (lower.includes("wraps up") || lower.includes("end of our session") || lower.includes("that concludes") || lower.includes("best of luck")) {
          await speak(aiText);
          setEndReason("Practice session completed!");
          setInterviewEnded(true);
          return;
        }
        await speak(aiText);
        if (!interviewEndedRef.current) startListening();
      } else {
        throw new Error(res.data?.error || "No response");
      }
    } catch (err) {
      apiFailCountRef.current += 1;
      setAiThinking(false);

      if (apiFailCountRef.current >= 3) {
        setAiError("AI service unavailable. Ending session with current feedback.");
        endInterview("AI service unavailable — session ended.");
        return;
      }

      setAiError(`Connection issue (attempt ${apiFailCountRef.current}/3) — retrying...`);
      setTimeout(() => {
        setAiError("");
        if (!interviewEndedRef.current) startListening();
      }, 2000);
    }
  }, [interview, candidateName, speak, startListening]);

  // --- Handle code sharing from editor ---
  const handleShareCode = useCallback((code, language) => {
    if (interviewEndedRef.current || !interviewStarted) return;
    const codeMsg = `Here's my ${language} solution:\n\`\`\`${language.toLowerCase()}\n${code}\n\`\`\`\nPlease review my code and give feedback.`;
    processStudentAnswer(codeMsg);
  }, [interviewStarted, processStudentAnswer]);

  // --- Start Interview ---
  const startInterview = useCallback(async () => {
    if (!interview || !speechSupported) return;
    setInterviewStarted(true);
    setTimerActive(true);
    setAiError("");

    const category = interview.jobPosition || "Technical";
    const firstQ = {
      "System Design": "Let's start with a classic one. How would you design a URL shortening service like bit.ly? Walk me through the high-level architecture and the key components.",
      "DSA": "Let's warm up! Can you explain the difference between time complexity and space complexity? Then tell me — what's the time complexity of searching in a sorted array, and how would you optimize it?",
      "Development": "Let's start with something practical. If you were building a full-stack web app with React and Node.js, how would you structure the project? What tools and patterns would you use?",
      "Behavioral": "Tell me about yourself. What got you into tech, and what kind of engineering role are you most excited about?",
    };
    const q = firstQ[category] || "Tell me about yourself and your technical background.";
    const coachName = voiceGender === "female" ? "Sarah" : "Alex";
    const greeting = `Hi ${candidateName || "there"}! I'm ${coachName}, your AI interview coach. Welcome to your ${category} practice session. Let's make this a great one! ${q}`;

    setMessages([{ role: "assistant", content: greeting }]);
    setConversation(`AI Coach: ${greeting}`);
    setQuestionCount(1);

    // Auto-show code editor for DSA/Development
    if (category === "DSA" || category === "Development") {
      setShowCodeEditor(true);
    }

    await speak(greeting);
    if (!interviewEndedRef.current) startListening();
  }, [interview, candidateName, speechSupported, speak, startListening, voiceGender]);

  // --- End interview ---
  const endInterview = useCallback((reason) => {
    setEndReason(reason || "Interview ended");
    setInterviewEnded(true);
    setTimerActive(false);
    setIsListening(false);
    setIsSpeaking(false);
    window.speechSynthesis?.cancel();
    if (recognitionRef.current) try { recognitionRef.current.abort(); } catch {}
    if (silenceTimerRef.current) clearInterval(silenceTimerRef.current);
  }, []);

  // --- Generate feedback on end ---
  useEffect(() => {
    if (!interviewEnded) return;
    window.speechSynthesis?.cancel();
    if (recognitionRef.current) try { recognitionRef.current.abort(); } catch {}
    if (!conversation || conversation.trim() === "" || feedback || feedbackLoading || feedbackSaved || feedbackGenerationRef.current) return;

    const timeout = setTimeout(async () => {
      feedbackGenerationRef.current = true;
      setFeedbackLoading(true);

      // Use auth email > candidate email > fallback
      const userEmail = authEmail || candidateEmail || "student@prepai.com";

      try {
        const result = await axios.post("/api/ai-feedback", {
          conversation, interview_id, jobPosition: interview?.jobPosition || "Technical",
        });
        if (result.data?.success && result.data?.feedback) {
          setFeedback(result.data);
          const record = {
            interview_id,
            userEmail,
            userName: candidateName || "Student",
            feedback: {
              rating: result.data.feedback.rating,
              summary: result.data.feedback.summary,
              recommendation: result.data.feedback.Recommendation || result.data.feedback.recommendation,
              recommendationMsg: result.data.feedback.RecommendationMsg || result.data.feedback.recommendationMsg,
              conversation,
              metadata: { endReason, tabSwitchCount, objectWarningCount, questionCount, timestamp: new Date().toISOString() },
            },
          };
          const { error } = await supabase.from("interview-feedback").insert(record);
          if (error && (error.code === "23505" || error.message?.includes("duplicate"))) {
            await supabase.from("interview-feedback").update({ feedback: record.feedback }).eq("interview_id", interview_id).eq("userEmail", record.userEmail);
          }
          setFeedbackSaved(true);
        } else throw new Error("Invalid response");
      } catch {
        const cnt = messages.filter(m => m.role === "user").length;
        const fallbackFb = {
          feedback: {
            rating: { technicalSkills: Math.min(10, cnt + 2), communication: Math.min(10, cnt + 3), problemSolving: Math.min(10, cnt + 1), confidence: Math.min(10, cnt + 2) },
            summary: `You answered ${cnt} question(s). ${cnt >= 3 ? "Solid effort!" : "Try answering more next time."}`,
            Recommendation: cnt >= 3 ? "Good - Keep Practicing" : "Needs More Practice",
            RecommendationMsg: "Keep practicing regularly to improve!",
          },
        };
        setFeedback(fallbackFb);
        // Save fallback feedback too
        try {
          await supabase.from("interview-feedback").insert({
            interview_id, userEmail, userName: candidateName || "Student",
            feedback: { ...fallbackFb.feedback, conversation, metadata: { endReason, questionCount, timestamp: new Date().toISOString() } },
          });
        } catch {}
        setFeedbackSaved(true);
        setFeedbackError("Used offline scoring (AI feedback service unavailable).");
      } finally {
        setFeedbackLoading(false);
        feedbackGenerationRef.current = false;
      }
    }, 1500);
    return () => clearTimeout(timeout);
  }, [interviewEnded]);

  // --- Tab switch detection ---
  useEffect(() => {
    const handler = () => {
      if (document.visibilityState === "hidden" && interviewStarted && !interviewEnded) {
        setTabSwitchCount(prev => {
          const next = prev + 1;
          setTabSwitchWarning(`Tab switch detected! Warning ${next}/3`);
          setTimeout(() => setTabSwitchWarning(""), 3000);
          if (next >= 3) endInterview("Stopped: Tab switching detected 3 times.");
          return next;
        });
      }
    };
    document.addEventListener("visibilitychange", handler);
    return () => document.removeEventListener("visibilitychange", handler);
  }, [interviewStarted, interviewEnded, endInterview]);

  // --- Camera + Object Detection ---
  useEffect(() => {
    let mounted = true, intervalId;
    async function startCamera() {
      let model;
      try { model = await cocoSsd.load(); } catch { setCameraError("Detection model failed to load"); return; }
      let stream;
      try { stream = await navigator.mediaDevices.getUserMedia({ video: true, audio: false }); } catch { setCameraError("Camera access denied"); return; }
      if (!mounted) { stream.getTracks().forEach(t => t.stop()); return; }
      streamRef.current = stream;
      const attach = () => { if (videoRef.current) videoRef.current.srcObject = stream; else setTimeout(attach, 100); };
      attach();
      intervalId = setInterval(async () => {
        if (!videoRef.current || videoRef.current.readyState !== 4) return;
        try {
          const preds = await model.detect(videoRef.current);
          let persons = 0, phone = false, book = false;
          preds.forEach(p => { if (p.class === "person" && p.score > 0.7) persons++; if (p.class === "cell phone") phone = true; if (p.class === "book") book = true; });
          if (persons > 1) endInterview("Stopped: Multiple persons detected.");
          else if (phone) { setObjectWarning("Phone detected!"); setObjectWarningCount(p => { if (p+1>=3) endInterview("Stopped: Phone detected 3 times."); return p+1; }); setTimeout(() => setObjectWarning(""), 3000); }
          else if (book) { setObjectWarning("Book detected!"); setObjectWarningCount(p => { if (p+1>=3) endInterview("Stopped: Book detected 3 times."); return p+1; }); setTimeout(() => setObjectWarning(""), 3000); }
          else setObjectWarning("");
        } catch {}
      }, 2000);
    }
    startCamera();
    return () => { mounted = false; if (intervalId) clearInterval(intervalId); if (streamRef.current) streamRef.current.getTracks().forEach(t => t.stop()); };
  }, [endInterview]);

  // --- Redirect after feedback ---
  useEffect(() => {
    if (interviewEnded && feedbackSaved) {
      const t = setTimeout(() => router.push("/interview-feedback"), 8000);
      return () => clearTimeout(t);
    }
  }, [interviewEnded, feedbackSaved, router]);

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-gradient-to-br from-slate-50 to-blue-50">
        <div className="text-center">
          <div className="relative w-16 h-16 mx-auto mb-4">
            <div className="absolute inset-0 border-4 border-blue-100 rounded-full"></div>
            <div className="absolute inset-0 border-4 border-blue-500 border-t-transparent rounded-full animate-spin"></div>
          </div>
          <p className="text-gray-500 font-medium">Loading practice session...</p>
        </div>
      </div>
    );
  }

  const category = interview?.jobPosition || "Technical";
  const showCodeBtn = category === "DSA" || category === "Development";

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50/30 to-indigo-50/20">
      {/* Header */}
      <div className="flex items-center justify-between px-4 md:px-6 py-2.5 border-b bg-white/80 backdrop-blur-sm shadow-sm sticky top-0 z-20">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 bg-gradient-to-br from-blue-600 to-indigo-600 rounded-lg flex items-center justify-center shadow-sm">
            <svg className="w-4.5 h-4.5 text-white" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><path d="M12 14l9-5-9-5-9 5 9 5z"/><path d="M12 14l6.16-3.422a12.083 12.083 0 01.665 6.479A11.952 11.952 0 0012 20.055a11.952 11.952 0 00-6.824-2.998 12.078 12.078 0 01.665-6.479L12 14z"/></svg>
          </div>
          <div>
            <span className="font-bold text-gray-800">PrepAI</span>
            <span className="text-gray-400 text-xs ml-2">{category} Interview</span>
          </div>
          {interviewStarted && !interviewEnded && (
            <span className="ml-2 flex items-center gap-1.5 bg-emerald-50 text-emerald-700 text-[11px] font-semibold px-2.5 py-1 rounded-full border border-emerald-200">
              <span className="w-1.5 h-1.5 bg-emerald-500 rounded-full animate-pulse"></span>Live Session
            </span>
          )}
        </div>
        <div className="flex items-center gap-3">
          {/* Code editor toggle */}
          {showCodeBtn && interviewStarted && !interviewEnded && (
            <button onClick={() => setShowCodeEditor(!showCodeEditor)}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition border ${
                showCodeEditor ? "bg-emerald-50 text-emerald-700 border-emerald-200" : "bg-gray-50 text-gray-600 border-gray-200 hover:bg-gray-100"
              }`}>
              <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M17.25 6.75L22.5 12l-5.25 5.25m-10.5 0L1.5 12l5.25-5.25m7.5-3l-4.5 16.5"/></svg>
              {showCodeEditor ? "Hide Code" : "Code Editor"}
            </button>
          )}
          <div className="font-mono text-sm">
            <TimerComponent active={timerActive} duration={interview?.duration} onComplete={() => endInterview("Time is up!")} interviewEnded={interviewEnded} />
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-3 md:px-6 py-4">
        {/* Alerts */}
        {(objectWarning || tabSwitchWarning || cameraError || aiError) && (
          <div className="max-w-4xl mx-auto mb-3 space-y-2">
            {aiError && <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-2.5 rounded-xl text-sm flex items-center gap-2"><svg className="w-4 h-4 flex-shrink-0" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M12 9v3.75m9-.75a9 9 0 11-18 0 9 9 0 0118 0zm-9 3.75h.008v.008H12v-.008z"/></svg>{aiError}</div>}
            {cameraError && <div className="bg-amber-50 border border-amber-200 text-amber-700 px-4 py-2.5 rounded-xl text-sm">{cameraError}</div>}
            {objectWarning && <div className="bg-amber-50 border border-amber-200 text-amber-800 px-4 py-2.5 rounded-xl text-sm font-medium">{objectWarning}</div>}
            {tabSwitchWarning && <div className="bg-orange-50 border border-orange-200 text-orange-800 px-4 py-2.5 rounded-xl text-sm font-medium">{tabSwitchWarning}</div>}
          </div>
        )}

        {/* Main Layout */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-4 max-w-7xl mx-auto">
          {/* Left Column — Camera + Status */}
          <div className="lg:col-span-3">
            <div className="bg-white rounded-2xl shadow-sm border overflow-hidden">
              <div className="aspect-[4/3] bg-gray-900 relative">
                <video ref={videoRef} autoPlay playsInline muted className="w-full h-full object-cover" />
                <canvas ref={canvasRef} className="absolute inset-0 pointer-events-none" />
                <div className="absolute bottom-2 left-2 bg-black/60 text-white text-[11px] px-2 py-0.5 rounded-md backdrop-blur-sm">{candidateName || "You"}</div>
                {interviewStarted && !interviewEnded && (
                  <div className="absolute top-2 right-2">
                    <div className={`w-3 h-3 rounded-full ${isListening ? "bg-green-500 animate-pulse" : isSpeaking ? "bg-blue-500 animate-pulse" : "bg-gray-400"}`}></div>
                  </div>
                )}
              </div>
              <div className="p-3 space-y-2">
                <div className="flex items-center justify-between text-xs">
                  <div className="flex items-center gap-1.5">
                    {isListening && <span className="flex items-center gap-1 text-emerald-600 font-semibold"><span className="w-1.5 h-1.5 bg-emerald-500 rounded-full animate-pulse"></span>Listening</span>}
                    {isSpeaking && <span className="flex items-center gap-1 text-blue-600 font-semibold"><span className="w-1.5 h-1.5 bg-blue-500 rounded-full animate-pulse"></span>Speaking</span>}
                    {aiThinking && <span className="flex items-center gap-1 text-purple-600 font-semibold"><span className="w-1.5 h-1.5 bg-purple-500 rounded-full animate-pulse"></span>Thinking</span>}
                    {!isListening && !isSpeaking && !aiThinking && interviewStarted && !interviewEnded && <span className="text-gray-400">Idle</span>}
                  </div>
                  {tabSwitchCount > 0 && <span className="text-red-500 font-semibold">{tabSwitchCount}/3</span>}
                </div>
                {interviewStarted && (
                  <div className="flex items-center gap-2 text-[11px] text-gray-400">
                    <span>Q: {questionCount}</span>
                    <span>&middot;</span>
                    <span>{category}</span>
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Center — Chat */}
          <div className={showCodeEditor ? "lg:col-span-5" : "lg:col-span-9"}>
            <div className="bg-white rounded-2xl shadow-sm border flex flex-col" style={{ height: showCodeEditor ? "580px" : "520px" }}>
              {/* Chat Header */}
              <div className="px-4 py-3 border-b flex items-center justify-between bg-gradient-to-r from-white to-blue-50/30">
                <div className="flex items-center gap-3">
                  <div className={`w-10 h-10 rounded-full flex items-center justify-center text-lg transition-all ${isSpeaking ? "bg-blue-500 shadow-lg shadow-blue-200 scale-110" : "bg-blue-50"}`}>
                    {voiceGender === "female" ? (isSpeaking ? "🗣️" : "👩‍💼") : (isSpeaking ? "🗣️" : "👨‍💼")}
                  </div>
                  <div>
                    <div className="font-semibold text-sm text-gray-800">{voiceGender === "female" ? "Sarah" : "Alex"} — AI Coach</div>
                    <div className="text-[11px] text-gray-400">
                      {isSpeaking ? "Speaking..." : aiThinking ? "Analyzing your answer..." : isListening ? "🎙️ Your turn — speak now" : interviewStarted ? "Ready" : "Select voice & start"}
                    </div>
                  </div>
                </div>
                {interviewStarted && !interviewEnded && (
                  <div className="flex items-center gap-1">
                    {isListening && (
                      <div className="flex gap-0.5 items-end h-5 mr-2">
                        {[6,12,4,14,8,10,5].map((h,i) => <span key={i} className="w-0.5 bg-emerald-500 rounded-full animate-pulse" style={{height:`${h}px`, animationDelay:`${i*80}ms`}}></span>)}
                      </div>
                    )}
                  </div>
                )}
              </div>

              {/* Chat Messages */}
              <div ref={scrollRef} className="flex-1 overflow-y-auto px-4 py-3 space-y-3">
                {!interviewStarted && !interviewEnded && (
                  <div className="flex items-center justify-center h-full">
                    <div className="text-center max-w-sm">
                      <div className="w-20 h-20 mx-auto mb-5 bg-gradient-to-br from-blue-100 to-indigo-100 rounded-full flex items-center justify-center shadow-inner">
                        <svg className="w-10 h-10 text-blue-500" fill="none" stroke="currentColor" strokeWidth="1.5" viewBox="0 0 24 24"><path d="M12 18.75a6 6 0 006-6v-1.5m-6 7.5a6 6 0 01-6-6v-1.5m6 7.5v3.75m-3.75 0h7.5M12 15.75a3 3 0 01-3-3V4.5a3 3 0 116 0v8.25a3 3 0 01-3 3z"/></svg>
                      </div>
                      <h3 className="text-lg font-bold text-gray-800 mb-1">Ready for your {category} session</h3>
                      <p className="text-xs text-gray-400 mb-6">Choose your interviewer and begin</p>

                      {/* Voice Selector */}
                      <div className="flex gap-3 justify-center mb-2">
                        <button onClick={() => setVoiceGender("female")}
                          className={`flex items-center gap-2 px-5 py-3 rounded-xl text-sm font-medium transition-all border-2 ${
                            voiceGender === "female" ? "border-pink-400 bg-pink-50 text-pink-700 shadow-sm shadow-pink-100" : "border-gray-200 bg-white text-gray-500 hover:border-gray-300"
                          }`}>
                          <span className="text-xl">👩‍💼</span>
                          <div className="text-left">
                            <div className="font-semibold">Sarah</div>
                            <div className="text-[10px] opacity-60">Female Voice</div>
                          </div>
                        </button>
                        <button onClick={() => setVoiceGender("male")}
                          className={`flex items-center gap-2 px-5 py-3 rounded-xl text-sm font-medium transition-all border-2 ${
                            voiceGender === "male" ? "border-blue-400 bg-blue-50 text-blue-700 shadow-sm shadow-blue-100" : "border-gray-200 bg-white text-gray-500 hover:border-gray-300"
                          }`}>
                          <span className="text-xl">👨‍💼</span>
                          <div className="text-left">
                            <div className="font-semibold">Alex</div>
                            <div className="text-[10px] opacity-60">Male Voice</div>
                          </div>
                        </button>
                      </div>
                      {showCodeBtn && (
                        <p className="text-[10px] text-gray-400 mt-3">💡 Code editor available for {category}</p>
                      )}
                    </div>
                  </div>
                )}

                {messages.map((msg, i) => (
                  <div key={i} className={`flex ${msg.role === "user" ? "justify-end" : "justify-start"}`}>
                    <div className={`max-w-[85%] px-4 py-2.5 rounded-2xl text-sm leading-relaxed ${
                      msg.role === "user"
                        ? "bg-gradient-to-br from-blue-600 to-blue-700 text-white rounded-br-md shadow-sm"
                        : "bg-gray-50 text-gray-800 rounded-bl-md border border-gray-100"
                    }`}>
                      {msg.content.includes("```") ? (
                        <pre className="whitespace-pre-wrap font-mono text-xs">{msg.content}</pre>
                      ) : msg.content}
                    </div>
                  </div>
                ))}

                {aiThinking && (
                  <div className="flex justify-start">
                    <div className="bg-gray-50 border border-gray-100 px-4 py-3 rounded-2xl rounded-bl-md">
                      <div className="flex gap-1.5">
                        <span className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{animationDelay:"0ms"}}></span>
                        <span className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{animationDelay:"150ms"}}></span>
                        <span className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{animationDelay:"300ms"}}></span>
                      </div>
                    </div>
                  </div>
                )}

                {userTranscript && isListening && (
                  <div className="flex justify-end">
                    <div className="max-w-[85%] px-4 py-2.5 rounded-2xl rounded-br-md bg-blue-50 text-blue-700 text-sm italic border border-blue-200/50">
                      {userTranscript}<span className="inline-block w-0.5 h-4 bg-blue-400 ml-1 animate-pulse"></span>
                    </div>
                  </div>
                )}
              </div>

              {/* Bottom Bar */}
              <div className="px-4 py-3 border-t bg-gray-50/50 rounded-b-2xl">
                {!interviewStarted && !interviewEnded && (
                  <button onClick={startInterview} disabled={!interview || !speechSupported}
                    className="w-full py-3.5 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white font-bold rounded-xl transition-all disabled:opacity-50 flex items-center justify-center gap-2.5 text-base shadow-sm shadow-blue-200">
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><path d="M5.25 5.653c0-.856.917-1.398 1.667-.986l11.54 6.348a1.125 1.125 0 010 1.971l-11.54 6.347a1.125 1.125 0 01-1.667-.985V5.653z"/></svg>
                    Start {category} Interview
                  </button>
                )}
                {interviewStarted && !interviewEnded && (
                  <div className="flex items-center gap-3">
                    <div className="flex-1 text-sm text-gray-500">
                      {isListening ? (
                        <span className="flex items-center gap-2 text-emerald-600 font-medium">
                          <span className="flex gap-0.5 items-end h-4">
                            {[8,14,6,16,10].map((h,i) => <span key={i} className="w-1 bg-emerald-500 rounded-full animate-pulse" style={{height:`${h}px`, animationDelay:`${i*100}ms`}}></span>)}
                          </span>
                          Speak your answer...
                        </span>
                      ) : isSpeaking ? "🔊 AI is speaking..." : aiThinking ? "🧠 Analyzing..." : "⏳ Processing..."}
                    </div>
                    <button onClick={() => { if (window.confirm("End the interview?")) endInterview("Ended by you."); }}
                      className="px-4 py-2 bg-red-500 hover:bg-red-600 text-white text-sm font-semibold rounded-lg transition shadow-sm">
                      End Session
                    </button>
                  </div>
                )}
                {interviewEnded && (
                  <div className="text-center space-y-2">
                    {feedbackLoading && <div className="flex items-center justify-center gap-2 text-blue-600 font-medium text-sm"><div className="animate-spin h-4 w-4 border-2 border-blue-500 border-t-transparent rounded-full"></div>Generating your performance report...</div>}
                    {feedbackSaved && !feedbackError && <div className="text-emerald-600 font-semibold text-sm">✓ Feedback saved! Redirecting to results...</div>}
                    {feedbackError && <div className="text-amber-600 text-xs">{feedbackError}</div>}
                    <button onClick={() => router.push("/interview-feedback")}
                      className="px-6 py-2.5 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white text-sm font-semibold rounded-xl transition shadow-sm">
                      View Detailed Feedback →
                    </button>
                  </div>
                )}
              </div>
            </div>

            {/* Inline feedback card */}
            {feedback && (
              <div className="mt-4 bg-white rounded-2xl shadow-sm border p-5">
                <h3 className="font-bold text-lg mb-3 flex items-center gap-2">📊 Session Feedback</h3>
                {feedback.feedback?.rating && (
                  <div className="grid grid-cols-2 gap-2.5 mb-4">
                    {Object.entries(feedback.feedback.rating).map(([key, val]) => (
                      <div key={key} className="flex items-center justify-between bg-gray-50 rounded-lg px-3 py-2">
                        <span className="text-xs text-gray-600 capitalize">{key.replace(/([A-Z])/g, " $1").trim()}</span>
                        <div className="flex items-center gap-2">
                          <div className="w-16 h-1.5 bg-gray-200 rounded-full overflow-hidden">
                            <div className={`h-full rounded-full ${val >= 7 ? "bg-emerald-500" : val >= 5 ? "bg-blue-500" : "bg-amber-500"}`} style={{ width: `${(val/10)*100}%` }}></div>
                          </div>
                          <span className="text-xs font-bold">{val}/10</span>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
                {feedback.feedback?.summary && <p className="text-sm text-gray-700">{feedback.feedback.summary}</p>}
              </div>
            )}
          </div>

          {/* Right Column — Code Editor (when visible) */}
          {showCodeEditor && (
            <div className="lg:col-span-4">
              <div className="sticky top-16">
                <div className="mb-2 flex items-center justify-between">
                  <h3 className="text-sm font-bold text-gray-700 flex items-center gap-1.5">
                    <svg className="w-4 h-4 text-emerald-600" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M17.25 6.75L22.5 12l-5.25 5.25m-10.5 0L1.5 12l5.25-5.25m7.5-3l-4.5 16.5"/></svg>
                    Code Editor
                  </h3>
                  <span className="text-[10px] text-gray-400">Write code & send for AI review</span>
                </div>
                <CodeEditor onShareCode={handleShareCode} visible={true} />
                <div className="mt-2 px-1 text-[10px] text-gray-400 leading-relaxed">
                  💡 Write your solution, then click "Send to AI for Review" — the AI will analyze your code and give feedback via voice.
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
