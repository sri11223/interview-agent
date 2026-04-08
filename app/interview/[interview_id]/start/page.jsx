"use client";
import React, { useEffect, useState, useRef, useCallback } from "react";
import axios from "axios";
import TimerComponent from "./_components/TimerComponent";
import CodeEditor from "./_components/CodeEditor";
// TensorFlow loaded dynamically to avoid bloating the initial bundle
import { supabase } from "@/services/supabaseClient";
import { useRouter } from "next/navigation";
import { useUser } from "@/app/provider";

export default function InterviewSession({ params }) {
  const { interview_id } = React.use(params);
  const router = useRouter();
  const { user: contextUser, session } = useUser();

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
  const [voiceGender, setVoiceGender] = useState("male");

  // Proctoring
  const [objectWarningCount, setObjectWarningCount] = useState(0);
  const [tabSwitchCount, setTabSwitchCount] = useState(0);
  const [objectWarning, setObjectWarning] = useState("");
  const [tabSwitchWarning, setTabSwitchWarning] = useState("");
  const [cameraError, setCameraError] = useState("");
  const [permissionsChecked, setPermissionsChecked] = useState(false);
  const [micPermission, setMicPermission] = useState("prompt");
  const [cameraPermission, setCameraPermission] = useState("prompt");
  const [permissionError, setPermissionError] = useState("");

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
  const handleAnswerRef = useRef(null);
  const utteranceRef = useRef(null);
  const sessionSeedRef = useRef(null);

  const logClientError = useCallback((errorMsg, context = "General Error") => {
    axios.post("/api/log-error", {
      sessionId: interview_id,
      user: candidateName || "Unknown",
      error: errorMsg,
      context,
    }).catch(() => {});
  }, [interview_id, candidateName]);

  const getDsaMode = useCallback((description) => {
    const match = description?.match(/DSA mode:\s*([^.]+)\./i);
    return match?.[1]?.trim() || "Interview Session";
  }, []);
  const isDsaCodingPractice = interview?.jobPosition === "DSA" && getDsaMode(interview?.jobDescription) === "Coding Practice";

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
    const nameFromContext =
      contextUser?.name ||
      session?.user?.user_metadata?.name ||
      session?.user?.email?.split("@")[0] ||
      "";
    const emailFromContext =
      contextUser?.email ||
      session?.user?.email ||
      "";
    if (nameFromContext || emailFromContext) {
      setCandidateName(nameFromContext);
      setCandidateEmail(emailFromContext);
      return;
    }
    if (typeof window !== "undefined") {
      const p = new URLSearchParams(window.location.search);
      setCandidateName(p.get("name") || "");
      setCandidateEmail(p.get("email") || "");
    }
  }, [contextUser, session]);

  // --- Check Speech Support ---
  useEffect(() => {
    if (typeof window !== "undefined") {
      const hasSynth = "speechSynthesis" in window;
      const hasRecog = "SpeechRecognition" in window || "webkitSpeechRecognition" in window;
      if (!hasSynth || !hasRecog) {
        setSpeechSupported(false);
        if (!isDsaCodingPractice) {
          setAiError("Your browser doesn't support voice. Please use Google Chrome or Microsoft Edge.");
        }
      }
    }
  }, [isDsaCodingPractice]);

  useEffect(() => {
    if (isDsaCodingPractice) {
      setAiError("");
    }
  }, [isDsaCodingPractice]);

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
        const msg = "Microphone access denied. Please allow mic and refresh.";
        setAiError(msg);
        logClientError(msg, "Speech Recognition (not-allowed)");
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
        sessionSeed: sessionSeedRef.current,
      });

      if (res.data?.warning === "API_KEY_INVALID") {
        const msg = "Groq/OpenRouter API key issue — please update your .env.local";
        setAiError(msg);
        logClientError(msg, "AI Conversation Request (API_KEY_INVALID)");
      }

      if (res.data?.success && res.data?.message) {
        apiFailCountRef.current = 0;
        const aiText = res.data.message;
        setMessages(prev => [...prev, { role: "assistant", content: aiText }]);
        setConversation(prev => prev + `\nAI Coach: ${aiText}`);
        setQuestionCount(prev => prev + 1);
        setAiThinking(false);

        if (!isDsaCodingPractice) {
          await speak(aiText);
          if (!interviewEndedRef.current) startListening();
        }
      } else {
        throw new Error(res.data?.error || "No response");
      }
    } catch (err) {
      apiFailCountRef.current += 1;
      setAiThinking(false);

      if (apiFailCountRef.current >= 3) {
        const msg = "AI service unavailable. Please try again in a moment.";
        setAiError(msg);
        logClientError(err.message, "AI Conversation Request (Max Retries)");
        return;
      }

      setAiError(`Connection issue (attempt ${apiFailCountRef.current}/3) — retrying...`);
      logClientError(err.message, `AI Conversation Request (Attempt ${apiFailCountRef.current})`);
      setTimeout(() => {
        setAiError("");
        if (!interviewEndedRef.current) startListening();
      }, 2000);
    }
  }, [interview, candidateName, speak, startListening, isDsaCodingPractice]);

  // --- Handle code sharing from editor ---
  const handleShareCode = useCallback((code, language) => {
    if (interviewEndedRef.current || !interviewStarted) return;
    const codeMsg = `Here's my ${language} solution:\n\`\`\`${language.toLowerCase()}\n${code}\n\`\`\`\nPlease review my code and give feedback.`;
    processStudentAnswer(codeMsg);
  }, [interviewStarted, processStudentAnswer]);

  useEffect(() => {
    handleAnswerRef.current = processStudentAnswer;
  }, [processStudentAnswer]);

  // --- Start Interview ---
  const requestPermissions = useCallback(async () => {
    setPermissionError("");
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true, video: true });
      stream.getTracks().forEach((t) => t.stop());
      setMicPermission("granted");
      setCameraPermission("granted");
      setPermissionsChecked(true);
      return true;
    } catch (err) {
      setPermissionsChecked(true);
      setMicPermission("denied");
      setCameraPermission("denied");
      setPermissionError("Microphone and camera access are required to start the session.");
      return false;
    }
  }, []);

  const startInterview = useCallback(async () => {
    if (!interview) return;
    if (!isDsaCodingPractice) {
      if (!speechSupported) return;
      const hasPermissions = await requestPermissions();
      if (!hasPermissions) return;
    }
    setInterviewStarted(true);
    setTimerActive(true);
    setAiError("");

    const category = interview.jobPosition || "Technical";
    if (!sessionSeedRef.current) {
      sessionSeedRef.current = `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
    }
    let q = "Tell me about yourself and your technical background.";
    try {
      const res = await axios.post("/api/ai-conversation", {
        messages: [{ role: "user", content: "Start the interview with your first question only." }],
        category,
        description: interview?.jobDescription,
        duration: interview?.duration,
        userName: candidateName,
        sessionId: interview_id,
        sessionSeed: sessionSeedRef.current,
      });
      if (res.data?.success && res.data?.message) {
        q = res.data.message;
      }
    } catch {
      // Keep fallback question if AI is unavailable
    }
    if (isDsaCodingPractice) {
      setMessages([{ role: "assistant", content: q }]);
      setConversation(`AI Coach: ${q}`);
      setQuestionCount(1);
      return;
    }

    const coachName = voiceGender === "female" ? "Sarah" : "Alex";
    const greeting = `Hi ${candidateName || "there"}! I'm ${coachName}, your AI interview coach. Welcome to your ${category} practice session. Let's make this a great one! ${q}`;

    setMessages([{ role: "assistant", content: greeting }]);
    setConversation(`AI Coach: ${greeting}`);
    setQuestionCount(1);

    await speak(greeting);
    if (!interviewEndedRef.current) startListening();
  }, [interview, candidateName, speechSupported, speak, startListening, voiceGender, requestPermissions, isDsaCodingPractice]);

  const fetchNextCodingProblem = useCallback(async () => {
    if (!interview || interviewEndedRef.current) return;
    setAiThinking(true);
    const userMsg = { role: "user", content: "Next coding problem only. Keep the exact LeetCode-style format." };
    const updated = [...messagesRef.current, userMsg];
    setMessages(updated);
    try {
      const res = await axios.post("/api/ai-conversation", {
        messages: updated,
        category: interview?.jobPosition,
        description: interview?.jobDescription,
        duration: interview?.duration,
        userName: candidateName,
        sessionId: interview_id,
        sessionSeed: sessionSeedRef.current,
      });
      if (res.data?.success && res.data?.message) {
        const aiText = res.data.message;
        setMessages((prev) => [...prev, { role: "assistant", content: aiText }]);
        setConversation((prev) => prev + `\nAI Coach: ${aiText}`);
        setQuestionCount((prev) => prev + 1);
      }
    } catch (err) {
      setAiError("Failed to load the next problem. Please try again.");
      logClientError(err.message, "AI Conversation Request (Next Problem)");
    } finally {
      setAiThinking(false);
    }
  }, [interview, candidateName, interview_id, logClientError]);

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
      try {
        await import("@tensorflow/tfjs");
        const cocoSsd = await import("@tensorflow-models/coco-ssd");
        model = await cocoSsd.load();
      } catch { setCameraError("Detection model failed to load"); return; }
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
          if (persons > 1) setObjectWarning("Multiple persons detected.");
          else if (phone) { setObjectWarning("Phone detected!"); setObjectWarningCount(p => p + 1); setTimeout(() => setObjectWarning(""), 3000); }
          else if (book) { setObjectWarning("Book detected!"); setObjectWarningCount(p => p + 1); setTimeout(() => setObjectWarning(""), 3000); }
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

  const category = interview?.jobPosition || "Technical";
  const systemTypeMatch = interview?.jobDescription?.match(/System type:\s*([^.]+)\./i);
  const systemType = systemTypeMatch?.[1]?.trim() || "General";
  const dsaMode = getDsaMode(interview?.jobDescription);
  const showCodeEditor = isDsaCodingPractice;
  const currentPrompt = [...messages].reverse().find((msg) => msg.role === "assistant")?.content;
  const effectiveDuration = isDsaCodingPractice ? "60 Minutes" : (interview?.duration || "-");

  const parseProblem = (text = "") => {
    if (!text) return null;
    const labels = new Set([
      "Title",
      "Difficulty",
      "Topics",
      "Description",
      "Input",
      "Output",
      "Examples",
      "Constraints",
      "Test Cases",
    ]);
    const sections = {
      Title: [],
      Difficulty: [],
      Topics: [],
      Description: [],
      Input: [],
      Output: [],
      Examples: [],
      Constraints: [],
      "Test Cases": [],
    };
    let current = null;
    const lines = text.split(/\r?\n/);
    for (const line of lines) {
      const match = line.match(/^([A-Za-z ]+):\s*(.*)$/);
      if (match && labels.has(match[1])) {
        current = match[1];
        if (match[2]) sections[current].push(match[2]);
      } else if (current) {
        sections[current].push(line);
      }
    }

    const clean = (arr) => arr.join("\n").trim();
    const title = clean(sections.Title);
    const difficulty = clean(sections.Difficulty);
    const topics = clean(sections.Topics);
    const description = clean(sections.Description);
    const input = clean(sections.Input);
    const output = clean(sections.Output);
    const examples = clean(sections.Examples);
    const constraints = clean(sections.Constraints);
    const testCases = clean(sections["Test Cases"]);

    return {
      title,
      difficulty,
      topics: topics ? topics.split(/\s*,\s*/).filter(Boolean) : [],
      description,
      input,
      output,
      examples,
      constraints,
      testCases,
    };
  };

  const parsedProblem = parseProblem(currentPrompt);
  const hasParsedProblem = parsedProblem && (
    parsedProblem.title ||
    parsedProblem.description ||
    parsedProblem.examples ||
    parsedProblem.constraints ||
    parsedProblem.testCases
  );
  const problemMeta = hasParsedProblem ? { title: parsedProblem.title, input: parsedProblem.input } : null;
  const testSpec = hasParsedProblem ? { examples: parsedProblem.examples, testCases: parsedProblem.testCases } : null;

  const handleTestResults = useCallback((payload) => {
    if (!payload?.summaryText) return;
    const title = parsedProblem?.title || "Coding Problem";
    const resultText = `Test Results for ${title}: ${payload.summaryText}`;
    setConversation((prev) => prev + `\n${resultText}`);
    setMessages((prev) => [...prev, { role: "user", content: resultText }]);
  }, [parsedProblem?.title]);

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
          <div className="font-mono text-sm">
            <TimerComponent active={timerActive} duration={effectiveDuration} onComplete={() => endInterview("Time is up!")} interviewEnded={interviewEnded} />
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-3 md:px-6 py-4">
        {!isDsaCodingPractice && (
          <div className="max-w-7xl mx-auto mb-4">
            <div className="bg-white rounded-2xl border shadow-sm p-4 md:p-5">
              <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-3">
                <div>
                  <p className="text-xs font-semibold uppercase tracking-widest text-gray-400">Session Focus</p>
                  <h2 className="text-xl md:text-2xl font-extrabold text-gray-900 mt-1">
                    {category} Interview
                  </h2>
                  <p className="text-sm text-gray-500 mt-1">
                    {category === "System Design" ? `${systemType} track` : "Structured practice session"}
                  </p>
                </div>
                <div className="flex flex-wrap items-center gap-2">
                  <span className="px-3 py-1 rounded-full text-xs font-semibold bg-blue-50 text-blue-700 border border-blue-100">{category}</span>
                  {category === "System Design" && (
                    <span className="px-3 py-1 rounded-full text-xs font-semibold bg-indigo-50 text-indigo-700 border border-indigo-100">{systemType}</span>
                  )}
                  <span className="px-3 py-1 rounded-full text-xs font-semibold bg-emerald-50 text-emerald-700 border border-emerald-100">{effectiveDuration} min</span>
                </div>
              </div>
              {category === "System Design" && (
                <div className="mt-4 grid grid-cols-2 md:grid-cols-4 gap-3">
                  <div className="bg-gray-50 rounded-xl border border-gray-100 p-3">
                    <div className="text-[11px] text-gray-500 font-semibold uppercase">Focus</div>
                    <div className="text-sm font-bold text-gray-900">Scalability</div>
                  </div>
                  <div className="bg-gray-50 rounded-xl border border-gray-100 p-3">
                    <div className="text-[11px] text-gray-500 font-semibold uppercase">Trade-offs</div>
                    <div className="text-sm font-bold text-gray-900">Latency vs Cost</div>
                  </div>
                  <div className="bg-gray-50 rounded-xl border border-gray-100 p-3">
                    <div className="text-[11px] text-gray-500 font-semibold uppercase">Reliability</div>
                    <div className="text-sm font-bold text-gray-900">Failover</div>
                  </div>
                  <div className="bg-gray-50 rounded-xl border border-gray-100 p-3">
                    <div className="text-[11px] text-gray-500 font-semibold uppercase">Data</div>
                    <div className="text-sm font-bold text-gray-900">Consistency</div>
                  </div>
                </div>
              )}
              {category === "Development" && (
                <div className="mt-4 grid grid-cols-2 md:grid-cols-4 gap-3">
                  <div className="bg-gray-50 rounded-xl border border-gray-100 p-3">
                    <div className="text-[11px] text-gray-500 font-semibold uppercase">Frontend</div>
                    <div className="text-sm font-bold text-gray-900">React + State</div>
                  </div>
                  <div className="bg-gray-50 rounded-xl border border-gray-100 p-3">
                    <div className="text-[11px] text-gray-500 font-semibold uppercase">Backend</div>
                    <div className="text-sm font-bold text-gray-900">APIs + Auth</div>
                  </div>
                  <div className="bg-gray-50 rounded-xl border border-gray-100 p-3">
                    <div className="text-[11px] text-gray-500 font-semibold uppercase">Debugging</div>
                    <div className="text-sm font-bold text-gray-900">Failures</div>
                  </div>
                  <div className="bg-gray-50 rounded-xl border border-gray-100 p-3">
                    <div className="text-[11px] text-gray-500 font-semibold uppercase">Performance</div>
                    <div className="text-sm font-bold text-gray-900">Latency</div>
                  </div>
                </div>
              )}
            </div>
          </div>
        )}
        {/* Alerts */}
        {(objectWarning || tabSwitchWarning || cameraError || aiError || permissionError) && (
          <div className="max-w-4xl mx-auto mb-3 space-y-2">
            {aiError && <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-2.5 rounded-xl text-sm flex items-center gap-2"><svg className="w-4 h-4 flex-shrink-0" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M12 9v3.75m9-.75a9 9 0 11-18 0 9 9 0 0118 0zm-9 3.75h.008v.008H12v-.008z"/></svg>{aiError}</div>}
            {cameraError && <div className="bg-amber-50 border border-amber-200 text-amber-700 px-4 py-2.5 rounded-xl text-sm">{cameraError}</div>}
            {objectWarning && <div className="bg-amber-50 border border-amber-200 text-amber-800 px-4 py-2.5 rounded-xl text-sm font-medium">{objectWarning}</div>}
            {tabSwitchWarning && <div className="bg-orange-50 border border-orange-200 text-orange-800 px-4 py-2.5 rounded-xl text-sm font-medium">{tabSwitchWarning}</div>}
            {permissionError && <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-2.5 rounded-xl text-sm">{permissionError}</div>}
          </div>
        )}

        {/* Main Layout */}
        {isDsaCodingPractice ? (
          <div className="max-w-7xl mx-auto">
            <div className="bg-white rounded-2xl shadow-sm border p-4 md:p-5">
              <div className="flex flex-wrap items-center justify-between gap-3 mb-3">
                <h3 className="text-sm font-bold text-gray-700 flex items-center gap-1.5">
                  <svg className="w-4 h-4 text-emerald-600" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M17.25 6.75L22.5 12l-5.25 5.25m-10.5 0L1.5 12l5.25-5.25m7.5-3l-4.5 16.5"/></svg>
                  Coding Practice
                </h3>
                <div className="flex items-center gap-3">
                  <span className="text-[11px] text-gray-400">LeetCode-style coding</span>
                  {!interviewStarted && !interviewEnded && (
                    <button onClick={startInterview} disabled={!interview}
                      className="px-4 py-2 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white font-semibold rounded-lg transition-all disabled:opacity-50 flex items-center gap-2 text-xs shadow-sm shadow-blue-200">
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><path d="M5.25 5.653c0-.856.917-1.398 1.667-.986l11.54 6.348a1.125 1.125 0 010 1.971l-11.54 6.347a1.125 1.125 0 01-1.667-.985V5.653z"/></svg>
                      Start Coding Practice
                    </button>
                  )}
                  {interviewStarted && !interviewEnded && (
                    <div className="flex items-center gap-2">
                      <button onClick={fetchNextCodingProblem}
                        className="px-3 py-2 text-xs font-semibold bg-white border border-slate-200 text-slate-700 rounded-lg hover:bg-slate-50 transition">
                        Take Another Test
                      </button>
                      <button onClick={() => { if (window.confirm("End the session?")) endInterview("Ended by user."); }}
                        className="px-3 py-2 text-xs font-semibold bg-red-500 hover:bg-red-600 text-white rounded-lg transition">
                        End Session
                      </button>
                    </div>
                  )}
                </div>
              </div>
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 h-[calc(100vh-360px)]">
                <div className="bg-[#111111] rounded-xl border border-[#222222] overflow-hidden flex flex-col">
                  <div className="px-4 py-2 border-b border-[#222222] flex items-center gap-2">
                    <span className="text-[12px] text-gray-200 font-semibold">Description</span>
                    <span className="text-[10px] text-gray-500">Problem</span>
                  </div>
                  <div className="flex-1 overflow-y-auto px-4 py-3 text-sm text-gray-200 leading-relaxed">
                    {!currentPrompt && "Click Start to load your first problem."}
                    {currentPrompt && !hasParsedProblem && (
                      <div className="whitespace-pre-wrap">{currentPrompt}</div>
                    )}
                    {currentPrompt && hasParsedProblem && (
                      <div className="space-y-4">
                        <div>
                          <h4 className="text-lg font-bold text-white">
                            {parsedProblem.title || "Coding Problem"}
                          </h4>
                          <div className="flex flex-wrap items-center gap-2 mt-2">
                            {parsedProblem.difficulty && (
                              <span className="px-2.5 py-1 rounded-full text-[11px] font-semibold bg-emerald-900/40 text-emerald-200 border border-emerald-700/40">
                                {parsedProblem.difficulty}
                              </span>
                            )}
                            {parsedProblem.topics.map((topic) => (
                              <span key={topic} className="px-2.5 py-1 rounded-full text-[11px] font-semibold bg-slate-800 text-slate-200 border border-slate-700">
                                {topic}
                              </span>
                            ))}
                          </div>
                        </div>

                        {parsedProblem.description && (
                          <div>
                            <div className="text-[11px] uppercase tracking-widest text-slate-400 font-semibold mb-1">Description</div>
                            <div className="whitespace-pre-wrap text-slate-100">{parsedProblem.description}</div>
                          </div>
                        )}

                        {(parsedProblem.input || parsedProblem.output) && (
                          <div className="grid grid-cols-1 gap-3">
                            {parsedProblem.input && (
                              <div className="bg-[#0c0c0c] border border-[#1f1f1f] rounded-lg p-3">
                                <div className="text-[11px] uppercase tracking-widest text-slate-400 font-semibold mb-1">Input</div>
                                <pre className="whitespace-pre-wrap text-xs text-slate-200 font-mono">{parsedProblem.input}</pre>
                              </div>
                            )}
                            {parsedProblem.output && (
                              <div className="bg-[#0c0c0c] border border-[#1f1f1f] rounded-lg p-3">
                                <div className="text-[11px] uppercase tracking-widest text-slate-400 font-semibold mb-1">Output</div>
                                <pre className="whitespace-pre-wrap text-xs text-slate-200 font-mono">{parsedProblem.output}</pre>
                              </div>
                            )}
                          </div>
                        )}

                        {parsedProblem.examples && (
                          <div>
                            <div className="text-[11px] uppercase tracking-widest text-slate-400 font-semibold mb-1">Examples</div>
                            <pre className="whitespace-pre-wrap text-xs text-slate-200 font-mono bg-[#0c0c0c] border border-[#1f1f1f] rounded-lg p-3">{parsedProblem.examples}</pre>
                          </div>
                        )}

                        {parsedProblem.constraints && (
                          <div>
                            <div className="text-[11px] uppercase tracking-widest text-slate-400 font-semibold mb-1">Constraints</div>
                            <pre className="whitespace-pre-wrap text-xs text-slate-200 font-mono bg-[#0c0c0c] border border-[#1f1f1f] rounded-lg p-3">{parsedProblem.constraints}</pre>
                          </div>
                        )}

                        {parsedProblem.testCases && (
                          <div>
                            <div className="text-[11px] uppercase tracking-widest text-slate-400 font-semibold mb-1">Test Cases</div>
                            <pre className="whitespace-pre-wrap text-xs text-slate-200 font-mono bg-[#0c0c0c] border border-[#1f1f1f] rounded-lg p-3">{parsedProblem.testCases}</pre>
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                </div>
                <div className="h-full">
                  <CodeEditor onShareCode={handleShareCode} visible={true} fullHeight={true} problemMeta={problemMeta} testSpec={testSpec} onTestResults={handleTestResults} />
                </div>
              </div>
            </div>
          </div>
        ) : (
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
                      {isSpeaking ? "Speaking..." : aiThinking ? "Analyzing your answer..." : isListening ? "🎙️ Your turn — speak now" : interviewStarted ? "Ready" : "Review the guidelines before starting"}
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
                      <h3 className="text-lg font-bold text-gray-800 mb-1">Before you start</h3>
                      <p className="text-xs text-gray-400 mb-4">{isDsaCodingPractice ? "Coding practice guidelines" : "Standard interview guidelines"}</p>

                      <div className="text-left text-sm text-gray-600 bg-white border border-gray-200 rounded-xl p-4 shadow-sm">
                        {isDsaCodingPractice ? (
                          <ul className="space-y-2">
                            <li>• Focus on writing correct, clean code for each prompt.</li>
                            <li>• Explain your approach briefly before coding.</li>
                            <li>• Mention time and space complexity.</li>
                            <li>• Test with edge cases and explain your reasoning.</li>
                            <li>• If stuck, outline a brute force solution first.</li>
                          </ul>
                        ) : (
                          <ul className="space-y-2">
                            <li>• Make sure you are in a quiet place with a stable internet connection.</li>
                            <li>• Keep your camera and microphone on for the entire session.</li>
                            <li>• Think out loud and explain your reasoning clearly.</li>
                            <li>• Ask clarifying questions if requirements are unclear.</li>
                            <li>• Keep answers concise and structured; use examples where helpful.</li>
                          </ul>
                        )}
                      </div>
                      <div className="mt-3 text-left text-xs text-gray-500">
                        {isDsaCodingPractice
                          ? "Coding practice mode: microphone is not required."
                          : `Permissions status: Mic ${micPermission} · Camera ${cameraPermission}`}
                      </div>
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
          </div>
        )}
      </div>
    </div>
  );
}
