"use client";

import { supabase } from "@/services/supabaseClient";
import Image from "next/image";
import { use, useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { GraduationCap, Clock, FileText, Mic, Camera } from "lucide-react";
import { useUser } from "@/app/provider";

export default function JoinInterviewPage({ params }) {
  const { interview_id } = use(params);
  const router = useRouter();
  const { user: contextUser, session } = useUser();
  const [interview, setInterview] = useState(null);
  const [loading, setLoading] = useState(true);

  const displayName =
    contextUser?.name ||
    session?.user?.user_metadata?.name ||
    session?.user?.email?.split("@")[0] ||
    "Student";
  const displayEmail =
    contextUser?.email ||
    session?.user?.email ||
    "student@prepai.com";

  useEffect(() => {
    async function init() {
      setLoading(true);

      // Fetch interview data
      const { data, error } = await supabase
        .from("Interviews")
        .select("jobPosition, duration, type, jobDescription")
        .eq("interview_id", interview_id)
        .single();
      setInterview(data);
      setLoading(false);
    }
    init();
  }, [interview_id]);

  const handleStartPractice = () => {
    router.push(
      `/interview/${interview_id}/start?name=${encodeURIComponent(displayName)}&email=${encodeURIComponent(displayEmail)}`
    );
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-gray-50">
        <div className="animate-pulse text-gray-500">Loading practice session...</div>
      </div>
    );
  }

  return (
    <div className="flex items-center justify-center min-h-screen bg-gradient-to-br from-blue-50 via-white to-purple-50 p-4">
      <div className="bg-white rounded-2xl shadow-lg p-8 w-full max-w-lg">
        
        {/* Header */}
        <div className="flex flex-col items-center mb-8">
          <div className="flex items-center gap-2 mb-2">
            <GraduationCap className="h-8 w-8 text-blue-600" />
            <span className="text-2xl font-bold text-gray-900">PrepAI</span>
          </div>
          <div className="text-sm text-gray-500">AI-Powered Interview Practice</div>
        </div>

        {/* Session Info */}
        {interview ? (
          <div className="mb-8">
            <h2 className="text-2xl font-bold text-center text-gray-900 mb-2">
              {interview.jobPosition} Practice
            </h2>
            
            <div className="flex items-center justify-center gap-6 text-gray-500 text-sm mt-4">
              <div className="flex items-center gap-1">
                <Clock className="w-4 h-4" />
                <span>{interview.duration}</span>
              </div>
              <div className="flex items-center gap-1">
                <FileText className="w-4 h-4" />
                <span>AI-generated questions</span>
              </div>
            </div>
          </div>
        ) : (
          <div className="text-red-500 text-center mb-8">Practice session not found</div>
        )}

        {/* User Info */}
        {displayName && (
          <div className="bg-gray-50 rounded-lg p-4 mb-6">
            <p className="text-sm text-gray-600">
              Practicing as: <strong>{displayName}</strong>
            </p>
            <p className="text-xs text-gray-400">{displayEmail}</p>
          </div>
        )}

        {/* Pre-interview checklist */}
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-6">
          <h4 className="font-semibold text-blue-800 mb-3">Before You Start</h4>
          <div className="space-y-2 text-sm text-blue-700">
            <div className="flex items-center gap-2">
              <Mic className="w-4 h-4" />
              <span>Microphone will be needed for voice responses</span>
            </div>
            <div className="flex items-center gap-2">
              <Camera className="w-4 h-4" />
              <span>Camera will be active during the session</span>
            </div>
          </div>
        </div>

        {/* Start Button */}
        <button
          className="w-full font-semibold py-4 rounded-xl bg-blue-600 hover:bg-blue-700 text-white transition text-lg disabled:opacity-50"
          disabled={!interview}
          onClick={handleStartPractice}
        >
          Start Practice Session
        </button>

        <button
          className="w-full mt-3 font-medium py-2 text-gray-500 hover:text-gray-700 transition text-sm"
          onClick={() => router.push('/dashboard')}
        >
          Back to Dashboard
        </button>
      </div>
    </div>
  );
}
