"use client";
import React, { useEffect, useState, useRef, useCallback } from "react";
import axios from "axios";
import TimerComponent from "./_components/TimerComponent";
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

  // Voice
  const [voiceGender, setVoiceGender] = useState("female"); // "male" or "female"

  // Refs
  const videoRef = useRef(null);
  const canvasRef = useRef(null);
  const streamRef = useRef(null);
  const recognitionRef = useRef(null);
  const messagesRef = useRef([]);
  const silenceTimerRef = useRef(null);
  const interviewEndedRef = useRef(false);
  const scrollRef = useRef(null);

  // Keep refs in sync
  useEffect(() => { messagesRef.current = messages; }, [messages]);
  useEffect(() => { interviewEndedRef.current = interviewEnded; }, [interviewEnded]);

  // Auto-scroll conversation
  useEffect(() => {
    if (scrollRef.current) scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
  }, [messages, userTranscript, aiThinking]);

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

  // --- Speech Synthesis (AI speaks) ---
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
        preferred = voices.find(v => v.name.includes("Google UK English Female") && v.lang.startsWith("en")) ||
                    voices.find(v => v.name.toLowerCase().includes("female") && v.lang.startsWith("en")) ||
                    voices.find(v => v.name.includes("Samantha")) ||
                    voices.find(v => v.name.includes("Zira")) ||
                    voices.find(v => v.lang.startsWith("en") && v.name.toLowerCase().includes("woman"));
      } else {
        preferred = voices.find(v => v.name.includes("Google UK English Male") && v.lang.startsWith("en")) ||
                    voices.find(v => v.name.toLowerCase().includes("male") && v.lang.startsWith("en") && !v.name.toLowerCase().includes("female")) ||
                    voices.find(v => v.name.includes("Daniel")) ||
                    voices.find(v => v.name.includes("David"));
      }
      if (!preferred) preferred = voices.find(v => v.lang.startsWith("en-US")) || voices.find(v => v.lang.startsWith("en"));
      if (preferred) utterance.voice = preferred;
      utterance.onstart = () => setIsSpeaking(true);
      utterance.onend = () => { setIsSpeaking(false); resolve(); };
      utterance.onerror = () => { setIsSpeaking(false); resolve(); };
      window.speechSynthesis.speak(utterance);
    });
  }, [voiceGender]);

  // --- Speech Recognition (listen to student) ---
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
      });
      if (res.data?.success && res.data?.message) {
        const aiText = res.data.message;
        setMessages(prev => [...prev, { role: "assistant", content: aiText }]);
        setConversation(prev => prev + `\nAI Coach: ${aiText}`);
        setQuestionCount(prev => prev + 1);
        setAiThinking(false);

        const lower = aiText.toLowerCase();
        if (lower.includes("wraps up") || lower.includes("end of our session") || lower.includes("that concludes") || lower.includes("best of luck") || lower.includes("good luck with your")) {
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
      setAiThinking(false);
      setAiError("Connection issue — retrying...");
      setTimeout(() => { setAiError(""); if (!interviewEndedRef.current) startListening(); }, 2000);
    }
  }, [interview, candidateName, speak, startListening]);

  // --- Start Interview ---
  const startInterview = useCallback(async () => {
    if (!interview || !speechSupported) return;
    setInterviewStarted(true);
    setTimerActive(true);
    setAiError("");

    const category = interview.jobPosition || "Technical";
    const firstQ = {
      "System Design": "Let's start with a classic one. How would you design a URL shortening service like bit.ly? Walk me through the high-level architecture, the components involved, and how you'd handle millions of requests.",
      "DSA": "Let's warm up with some fundamentals. Can you explain the time complexity of common operations on arrays versus linked lists? For example, what happens when you insert an element at the beginning of each?",
      "Development": "Let's talk about your development experience. If you were building a full-stack web app with Node.js and React, how would you structure the project? What would your tech stack look like and why?",
      "Behavioral": "Tell me about yourself. What got you into tech, and what kind of engineering role are you most excited about?",
    };
    const q = firstQ[category] || "Tell me about yourself and your technical background.";
    const coachName = voiceGender === "female" ? "Sarah" : "Alex";
    const greeting = `Hi ${candidateName || "there"}! I'm ${coachName}, your AI interview coach. Welcome to your ${category} practice session. Let's make this a great one! ${q}`;

    setMessages([{ role: "assistant", content: greeting }]);
    setConversation(`AI Coach: ${greeting}`);
    setQuestionCount(1);

    await speak(greeting);
    if (!interviewEndedRef.current) startListening();
  }, [interview, candidateName, speechSupported, speak, startListening]);

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
      try {
        const result = await axios.post("/api/ai-feedback", {
          conversation, interview_id, jobPosition: interview?.jobPosition || "Technical",
        });
        if (result.data?.success && result.data?.feedback) {
          setFeedback(result.data);
          const record = {
            interview_id,
            userEmail: candidateEmail || "student@prepai.com",
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
        setFeedback({
          feedback: {
            rating: { technicalSkills: Math.min(10, cnt + 2), communication: Math.min(10, cnt + 3), problemSolving: Math.min(10, cnt + 1), confidence: Math.min(10, cnt + 2) },
            summary: `You answered ${cnt} question(s). ${cnt >= 3 ? "Solid effort!" : "Try answering more next time."}`,
            Recommendation: cnt >= 3 ? "Good - Keep Practicing" : "Needs More Practice",
            RecommendationMsg: "Keep practicing regularly to improve!",
          },
        });
        setFeedbackSaved(true);
        setFeedbackError("Used offline feedback (AI service temporarily unavailable).");
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
      const t = setTimeout(() => router.push("/interview-feedback"), 10000);
      return () => clearTimeout(t);
    }
  }, [interviewEnded, feedbackSaved, router]);

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-gray-50">
        <div className="text-center">
          <div className="animate-spin h-10 w-10 border-4 border-blue-500 border-t-transparent rounded-full mx-auto mb-4"></div>
          <p className="text-gray-600">Loading practice session...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-gray-50 to-gray-100">
      {/* Header */}
      <div className="flex items-center justify-between px-6 py-3 border-b bg-white shadow-sm">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 bg-blue-600 rounded-lg flex items-center justify-center">
            <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><path d="M12 14l9-5-9-5-9 5 9 5z"/><path d="M12 14l6.16-3.422a12.083 12.083 0 01.665 6.479A11.952 11.952 0 0012 20.055a11.952 11.952 0 00-6.824-2.998 12.078 12.078 0 01.665-6.479L12 14z"/></svg>
          </div>
          <span className="font-bold text-lg text-gray-800">PrepAI</span>
          {interviewStarted && !interviewEnded && (
            <span className="ml-3 flex items-center gap-1.5 bg-green-50 text-green-700 text-xs font-medium px-2.5 py-1 rounded-full">
              <span className="w-1.5 h-1.5 bg-green-500 rounded-full animate-pulse"></span>Live
            </span>
          )}
        </div>
        <div className="font-mono text-gray-700 text-sm">
          <TimerComponent active={timerActive} duration={interview?.duration} onComplete={() => endInterview("Time is up!")} interviewEnded={interviewEnded} />
        </div>
      </div>

      <div className="max-w-6xl mx-auto px-4 py-5">
        <div className="text-center mb-5">
          <h2 className="text-xl font-bold text-gray-900">{interview?.jobPosition || "Practice"} Interview</h2>
          <p className="text-gray-500 text-sm mt-1">
            {!interviewStarted ? "Ready when you are" : interviewEnded ? endReason : `Question ${questionCount}`}
          </p>
        </div>

        {/* Alerts */}
        {(objectWarning || tabSwitchWarning || cameraError || aiError) && (
          <div className="max-w-3xl mx-auto mb-4 space-y-2">
            {aiError && <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-2.5 rounded-lg text-sm">{aiError}</div>}
            {cameraError && <div className="bg-yellow-50 border border-yellow-200 text-yellow-700 px-4 py-2.5 rounded-lg text-sm">{cameraError}</div>}
            {objectWarning && <div className="bg-yellow-50 border border-yellow-200 text-yellow-800 px-4 py-2.5 rounded-lg text-sm">{objectWarning}</div>}
            {tabSwitchWarning && <div className="bg-orange-50 border border-orange-200 text-orange-800 px-4 py-2.5 rounded-lg text-sm">{tabSwitchWarning}</div>}
          </div>
        )}

        {/* Main Layout */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-5 max-w-5xl mx-auto">
          {/* Camera */}
          <div className="lg:col-span-1">
            <div className="bg-white rounded-2xl shadow overflow-hidden">
              <div className="aspect-[4/3] bg-gray-900 relative">
                <video ref={videoRef} autoPlay playsInline muted className="w-full h-full object-cover" />
                <canvas ref={canvasRef} className="absolute inset-0 pointer-events-none" />
                <div className="absolute bottom-2 left-2 bg-black/60 text-white text-xs px-2 py-1 rounded">{candidateName || "You"}</div>
              </div>
              <div className="p-3 flex items-center justify-between text-xs">
                <div className="flex items-center gap-2">
                  {isListening && <span className="flex items-center gap-1 text-green-600 font-medium"><span className="w-1.5 h-1.5 bg-green-500 rounded-full animate-pulse"></span>Listening</span>}
                  {isSpeaking && <span className="flex items-center gap-1 text-blue-600 font-medium"><span className="w-1.5 h-1.5 bg-blue-500 rounded-full animate-pulse"></span>AI Speaking</span>}
                  {aiThinking && <span className="flex items-center gap-1 text-purple-600 font-medium"><span className="w-1.5 h-1.5 bg-purple-500 rounded-full animate-pulse"></span>Thinking</span>}
                  {!isListening && !isSpeaking && !aiThinking && interviewStarted && !interviewEnded && <span className="text-gray-400">Ready</span>}
                </div>
                {tabSwitchCount > 0 && <span className="text-red-500">Warnings: {tabSwitchCount}/3</span>}
              </div>
            </div>
          </div>

          {/* Chat */}
          <div className="lg:col-span-2">
            <div className="bg-white rounded-2xl shadow flex flex-col" style={{ height: "460px" }}>
              <div className="px-4 py-3 border-b flex items-center gap-3">
                <div className={`w-9 h-9 rounded-full flex items-center justify-center transition-colors ${isSpeaking ? "bg-blue-500" : "bg-blue-100"}`}>
                  {voiceGender === "female" ? (
                    <span className="text-base">{isSpeaking ? "🗣️" : "👩"}</span>
                  ) : (
                    <span className="text-base">{isSpeaking ? "🗣️" : "👨"}</span>
                  )}
                </div>
                <div>
                  <div className="font-semibold text-sm text-gray-800">{voiceGender === "female" ? "Sarah" : "Alex"} — AI Coach</div>
                  <div className="text-xs text-gray-400">
                    {isSpeaking ? "Speaking..." : aiThinking ? "Thinking..." : isListening ? "Your turn — speak now" : interviewStarted ? "Ready" : "Waiting to start"}
                  </div>
                </div>
              </div>

              <div ref={scrollRef} className="flex-1 overflow-y-auto px-4 py-3 space-y-3">
                {!interviewStarted && !interviewEnded && (
                  <div className="flex items-center justify-center h-full">
                    <div className="text-center max-w-sm">
                      <div className="w-20 h-20 mx-auto mb-4 bg-gradient-to-br from-blue-100 to-indigo-100 rounded-full flex items-center justify-center">
                        <svg className="w-10 h-10 text-blue-500" fill="none" stroke="currentColor" strokeWidth="1.5" viewBox="0 0 24 24"><path d="M12 18.75a6 6 0 006-6v-1.5m-6 7.5a6 6 0 01-6-6v-1.5m6 7.5v3.75m-3.75 0h7.5M12 15.75a3 3 0 01-3-3V4.5a3 3 0 116 0v8.25a3 3 0 01-3 3z"/></svg>
                      </div>
                      <p className="text-base font-medium text-gray-700 mb-1">Your AI interviewer is ready</p>
                      <p className="text-xs text-gray-400 mb-5">Choose your interviewer voice and click start</p>
                      
                      {/* Voice gender selector */}
                      <div className="flex gap-3 justify-center mb-4">
                        <button onClick={() => setVoiceGender("female")}
                          className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-medium transition border-2 ${voiceGender === "female" ? "border-pink-400 bg-pink-50 text-pink-700" : "border-gray-200 bg-white text-gray-500 hover:border-gray-300"}`}>
                          <span className="text-lg">👩</span> Sarah (Female)
                        </button>
                        <button onClick={() => setVoiceGender("male")}
                          className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-medium transition border-2 ${voiceGender === "male" ? "border-blue-400 bg-blue-50 text-blue-700" : "border-gray-200 bg-white text-gray-500 hover:border-gray-300"}`}>
                          <span className="text-lg">👨</span> Alex (Male)
                        </button>
                      </div>
                    </div>
                  </div>
                )}

                {messages.map((msg, i) => (
                  <div key={i} className={`flex ${msg.role === "user" ? "justify-end" : "justify-start"}`}>
                    <div className={`max-w-[80%] px-4 py-2.5 rounded-2xl text-sm leading-relaxed ${msg.role === "user" ? "bg-blue-600 text-white rounded-br-sm" : "bg-gray-100 text-gray-800 rounded-bl-sm"}`}>
                      {msg.content}
                    </div>
                  </div>
                ))}

                {aiThinking && (
                  <div className="flex justify-start">
                    <div className="bg-gray-100 px-4 py-3 rounded-2xl rounded-bl-sm">
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
                    <div className="max-w-[80%] px-4 py-2.5 rounded-2xl rounded-br-sm bg-blue-50 text-blue-700 text-sm italic border border-blue-200">
                      {userTranscript}<span className="inline-block w-1 h-4 bg-blue-400 ml-1 animate-pulse"></span>
                    </div>
                  </div>
                )}
              </div>

              {/* Bottom */}
              <div className="px-4 py-3 border-t bg-gray-50 rounded-b-2xl">
                {!interviewStarted && !interviewEnded && (
                  <button onClick={startInterview} disabled={!interview || !speechSupported} className="w-full py-3 bg-blue-600 hover:bg-blue-700 text-white font-semibold rounded-xl transition disabled:opacity-50 flex items-center justify-center gap-2 text-base">
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><path d="M12 2a3 3 0 0 0-3 3v7a3 3 0 0 0 6 0V5a3 3 0 0 0-3-3Z"/><path d="M19 10v2a7 7 0 0 1-14 0v-2"/><line x1="12" x2="12" y1="19" y2="22"/></svg>
                    Start Interview
                  </button>
                )}
                {interviewStarted && !interviewEnded && (
                  <div className="flex items-center gap-3">
                    <div className="flex-1 text-sm text-gray-500">
                      {isListening ? (
                        <span className="flex items-center gap-2">
                          <span className="flex gap-0.5 items-end h-4">
                            {[8,14,6,16,10].map((h,i) => <span key={i} className="w-1 bg-green-500 rounded-full animate-pulse" style={{height:`${h}px`, animationDelay:`${i*100}ms`}}></span>)}
                          </span>
                          Speak your answer...
                        </span>
                      ) : isSpeaking ? "AI is speaking..." : aiThinking ? "Generating response..." : "Processing..."}
                    </div>
                    <button onClick={() => { if (window.confirm("End the interview?")) endInterview("Ended by you."); }} className="px-4 py-2 bg-red-500 hover:bg-red-600 text-white text-sm font-medium rounded-lg transition">
                      End Interview
                    </button>
                  </div>
                )}
                {interviewEnded && (
                  <div className="text-center space-y-2">
                    {feedbackLoading && <div className="flex items-center justify-center gap-2 text-blue-600 font-medium text-sm"><div className="animate-spin h-4 w-4 border-2 border-blue-500 border-t-transparent rounded-full"></div>Generating feedback...</div>}
                    {feedbackSaved && !feedbackError && <div className="text-green-600 font-medium text-sm">Feedback saved! Redirecting...</div>}
                    {feedbackError && <div className="text-yellow-600 text-xs">{feedbackError}</div>}
                    <button onClick={() => router.push("/interview-feedback")} className="px-6 py-2 bg-blue-600 hover:bg-blue-700 text-white text-sm font-medium rounded-lg transition">View Feedback</button>
                  </div>
                )}
              </div>
            </div>

            {/* Feedback card */}
            {feedback && (
              <div className="mt-4 bg-white rounded-2xl shadow p-5">
                <h3 className="font-bold text-lg mb-3">Session Feedback</h3>
                {feedback.feedback?.rating && (
                  <div className="grid grid-cols-2 gap-2.5 mb-4">
                    {Object.entries(feedback.feedback.rating).map(([key, val]) => (
                      <div key={key} className="flex items-center justify-between bg-gray-50 rounded-lg px-3 py-2">
                        <span className="text-xs text-gray-600 capitalize">{key.replace(/([A-Z])/g, " $1").trim()}</span>
                        <div className="flex items-center gap-2">
                          <div className="w-16 h-1.5 bg-gray-200 rounded-full overflow-hidden">
                            <div className={`h-full rounded-full ${val >= 7 ? "bg-green-500" : val >= 5 ? "bg-blue-500" : "bg-yellow-500"}`} style={{ width: `${(val/10)*100}%` }}></div>
                          </div>
                          <span className="text-xs font-bold">{val}/10</span>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
                {feedback.feedback?.summary && <p className="text-sm text-gray-700 mb-3">{feedback.feedback.summary}</p>}
                {(feedback.feedback?.Recommendation || feedback.feedback?.recommendation) && (
                  <span className={`inline-block px-3 py-1 rounded-full text-xs font-semibold ${
                    (feedback.feedback.Recommendation||feedback.feedback.recommendation)==="Excellent"?"bg-green-100 text-green-700":
                    (feedback.feedback.Recommendation||feedback.feedback.recommendation)?.includes("Good")?"bg-blue-100 text-blue-700":"bg-yellow-100 text-yellow-700"
                  }`}>{feedback.feedback.Recommendation || feedback.feedback.recommendation}</span>
                )}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
