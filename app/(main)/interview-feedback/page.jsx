"use client"
import React, { useState, useEffect } from 'react'
import { supabase } from '@/services/supabaseClient'
import { useUser } from '@/app/provider'
import moment from 'moment'
import { useRouter } from 'next/navigation'

function InterviewFeedbackPage() {
    const { user } = useUser();
    const router = useRouter();
    const [feedbackList, setFeedbackList] = useState([]);
    const [loading, setLoading] = useState(true);
    const [selectedFeedback, setSelectedFeedback] = useState(null);
    const [routing, setRouting] = useState(false);

    useEffect(() => {
        if (user?.email) fetchAllFeedback();
    }, [user]);

    const fetchAllFeedback = async () => {
        setLoading(true);
        try {
            const { data, error } = await supabase
                .from('interview-feedback')
                .select('*')
                .eq('userEmail', user.email)
                .order('created_at', { ascending: false });

            if (!error && data) {
                setFeedbackList(data);
                if (data.length > 0) setSelectedFeedback(data[0]);
            }
        } catch (err) {
            console.error('Error fetching feedback:', err);
        } finally {
            setLoading(false);
        }
    };

    const getScoreColor = (score) => {
        if (score >= 8) return 'text-emerald-600';
        if (score >= 6) return 'text-blue-600';
        if (score >= 4) return 'text-amber-600';
        return 'text-red-500';
    };

    const getScoreBg = (score) => {
        if (score >= 8) return 'bg-emerald-500';
        if (score >= 6) return 'bg-blue-500';
        if (score >= 4) return 'bg-amber-500';
        return 'bg-red-500';
    };

    const getBadgeStyle = (rec) => {
        if (!rec) return 'bg-gray-100 text-gray-600';
        if (rec === 'Excellent') return 'bg-emerald-100 text-emerald-700 border border-emerald-200';
        if (rec.includes('Good')) return 'bg-blue-100 text-blue-700 border border-blue-200';
        return 'bg-amber-100 text-amber-700 border border-amber-200';
    };

    const getAvgScore = (rating) => {
        if (!rating) return 0;
        const vals = Object.values(rating).filter(v => typeof v === 'number');
        return vals.length ? (vals.reduce((a, b) => a + b, 0) / vals.length).toFixed(1) : 0;
    };

    const handleTakeTestAgain = async () => {
        const interviewId = selectedFeedback?.interview_id || latestFeedback?.interview_id;
        if (!interviewId || !user?.email) {
            router.push('/dashboard/create-interview');
            return;
        }

        setRouting(true);
        try {
            const { data, error } = await supabase
                .from('Interviews')
                .select('jobPosition')
                .eq('interview_id', interviewId)
                .eq('userEmail', user.email)
                .single();

            if (!error && data?.jobPosition) {
                router.push(`/dashboard/create-interview?category=${encodeURIComponent(data.jobPosition)}`);
                return;
            }
        } catch (err) {
            console.error('Failed to load interview category:', err);
        } finally {
            setRouting(false);
        }

        router.push('/dashboard/create-interview');
    };

    const fb = selectedFeedback?.feedback;
    const latestFeedback = feedbackList?.[0];
    const latestFb = latestFeedback?.feedback;
    const latestAvg = getAvgScore(latestFb?.rating);

    if (loading) {
        return (
            <div className="min-h-screen bg-gray-50 flex items-center justify-center">
                <div className="text-center">
                    <div className="relative w-16 h-16 mx-auto mb-4">
                        <div className="absolute inset-0 border-4 border-blue-100 rounded-full"></div>
                        <div className="absolute inset-0 border-4 border-blue-500 border-t-transparent rounded-full animate-spin"></div>
                    </div>
                    <p className="text-gray-500 font-medium">Loading your feedback...</p>
                </div>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50/30 to-indigo-50/20">
            {/* Header */}
            <div className="bg-white border-b sticky top-0 z-10">
                <div className="max-w-7xl mx-auto px-6 py-4 flex items-center justify-between">
                    <div>
                        <h1 className="text-2xl font-bold text-gray-900">Performance Feedback</h1>
                        <p className="text-sm text-gray-500 mt-0.5">{feedbackList.length} session{feedbackList.length !== 1 ? 's' : ''} completed</p>
                    </div>
                    <div className="flex items-center gap-2">
                        <button onClick={handleTakeTestAgain} disabled={routing} className="px-4 py-2 text-sm font-semibold text-white bg-blue-600 hover:bg-blue-700 rounded-lg transition disabled:opacity-60">
                            {routing ? 'Loading...' : 'Take Test Again'}
                        </button>
                        <button onClick={() => router.push('/dashboard')} className="px-4 py-2 text-sm font-medium text-gray-600 hover:text-gray-900 bg-gray-100 hover:bg-gray-200 rounded-lg transition">
                            Back to Dashboard
                        </button>
                    </div>
                </div>
            </div>

            {feedbackList.length === 0 ? (
                <div className="max-w-lg mx-auto mt-24 text-center px-6">
                    <div className="w-20 h-20 bg-blue-50 rounded-full flex items-center justify-center mx-auto mb-6">
                        <svg className="w-10 h-10 text-blue-400" fill="none" stroke="currentColor" strokeWidth="1.5" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" d="M9 12h3.75M9 15h3.75M9 18h3.75m3 .75H18a2.25 2.25 0 002.25-2.25V6.108c0-1.135-.845-2.098-1.976-2.192a48.424 48.424 0 00-1.123-.08m-5.801 0c-.065.21-.1.433-.1.664 0 .414.336.75.75.75h4.5a.75.75 0 00.75-.75 2.25 2.25 0 00-.1-.664m-5.8 0A2.251 2.251 0 0113.5 2.25H15c1.012 0 1.867.668 2.15 1.586m-5.8 0c-.376.023-.75.05-1.124.08C9.095 4.01 8.25 4.973 8.25 6.108V8.25m0 0H4.875c-.621 0-1.125.504-1.125 1.125v11.25c0 .621.504 1.125 1.125 1.125h9.75c.621 0 1.125-.504 1.125-1.125V9.375c0-.621-.504-1.125-1.125-1.125H8.25zM6.75 12h.008v.008H6.75V12zm0 3h.008v.008H6.75V15zm0 3h.008v.008H6.75V18z" />
                        </svg>
                    </div>
                    <h2 className="text-xl font-bold text-gray-900 mb-2">No feedback yet</h2>
                    <p className="text-gray-500 mb-6">Complete a practice interview to see your performance analysis here.</p>
                    <button onClick={() => router.push('/dashboard')} className="px-6 py-3 bg-blue-600 hover:bg-blue-700 text-white font-semibold rounded-xl transition">
                        Start Practicing
                    </button>
                </div>
            ) : (
                <div className="max-w-7xl mx-auto px-6 py-6">
                    {/* Latest Summary */}
                    {latestFb && (
                        <div className="mb-6 bg-gradient-to-r from-white to-blue-50 rounded-2xl border border-blue-100 p-5 shadow-sm">
                            <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
                                <div>
                                    <p className="text-xs text-gray-500 font-semibold uppercase tracking-wide">Latest Session</p>
                                    <h2 className="text-lg font-bold text-gray-900 mt-1">
                                        {moment(latestFeedback.created_at).format('MMM D, YYYY · h:mm A')}
                                    </h2>
                                    {(latestFb.recommendation || latestFb.Recommendation) && (
                                        <span className={`inline-block mt-2 px-3 py-1 rounded-full text-xs font-bold ${getBadgeStyle(latestFb.recommendation || latestFb.Recommendation)}`}>
                                            {latestFb.recommendation || latestFb.Recommendation}
                                        </span>
                                    )}
                                </div>
                                <div className="flex items-center gap-4">
                                    <div className="text-center bg-white rounded-xl border border-gray-100 px-4 py-3 shadow-sm">
                                        <div className={`text-3xl font-bold ${getScoreColor(latestAvg)}`}>{latestAvg}</div>
                                        <div className="text-xs text-gray-500">Avg Score</div>
                                    </div>
                                    <div className="text-center bg-white rounded-xl border border-gray-100 px-4 py-3 shadow-sm">
                                        <div className="text-3xl font-bold text-gray-900">{latestFb.metadata?.questionCount || 0}</div>
                                        <div className="text-xs text-gray-500">Questions</div>
                                    </div>
                                </div>
                            </div>
                        </div>
                    )}
                    <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
                        {/* Sessions List */}
                        <div className="lg:col-span-4">
                            <div className="bg-white rounded-2xl shadow-sm border overflow-hidden">
                                <div className="px-4 py-3 border-b bg-gray-50">
                                    <h3 className="font-semibold text-gray-800 text-sm">Session History</h3>
                                </div>
                                <div className="divide-y max-h-[calc(100vh-220px)] overflow-y-auto">
                                    {feedbackList.map((item, idx) => {
                                        const f = item.feedback;
                                        const avg = getAvgScore(f?.rating);
                                        const rec = f?.recommendation || f?.Recommendation;
                                        const isSelected = selectedFeedback?.id === item.id;
                                        return (
                                            <button key={item.id || idx} onClick={() => setSelectedFeedback(item)}
                                                className={`w-full text-left px-4 py-3.5 hover:bg-blue-50/50 transition ${isSelected ? 'bg-blue-50 border-l-[3px] border-l-blue-500' : ''}`}>
                                                <div className="flex items-start justify-between">
                                                    <div className="flex-1 min-w-0">
                                                        <p className="font-medium text-gray-900 text-sm truncate">
                                                            Session #{feedbackList.length - idx}
                                                        </p>
                                                        <p className="text-xs text-gray-400 mt-0.5">
                                                            {moment(item.created_at).format('MMM D, YYYY · h:mm A')}
                                                        </p>
                                                        {rec && (
                                                            <span className={`inline-block mt-1.5 px-2 py-0.5 rounded text-[10px] font-semibold ${getBadgeStyle(rec)}`}>
                                                                {rec}
                                                            </span>
                                                        )}
                                                    </div>
                                                    <div className={`text-lg font-bold ${getScoreColor(avg)}`}>{avg}</div>
                                                </div>
                                            </button>
                                        );
                                    })}
                                </div>
                            </div>
                        </div>

                        {/* Detail */}
                        <div className="lg:col-span-8">
                            {fb ? (
                                <div className="space-y-5">
                                    {/* Score Overview */}
                                    <div className="bg-white rounded-2xl shadow-sm border p-6">
                                        <div className="flex items-center justify-between mb-5">
                                            <h3 className="font-bold text-lg text-gray-900">Score Breakdown</h3>
                                            {(fb.recommendation || fb.Recommendation) && (
                                                <span className={`px-3 py-1 rounded-full text-xs font-bold ${getBadgeStyle(fb.recommendation || fb.Recommendation)}`}>
                                                    {fb.recommendation || fb.Recommendation}
                                                </span>
                                            )}
                                        </div>

                                        <div className="flex items-center gap-6 mb-6">
                                            <div className="relative w-24 h-24 flex-shrink-0">
                                                <svg className="w-24 h-24 -rotate-90" viewBox="0 0 100 100">
                                                    <circle cx="50" cy="50" r="42" fill="none" stroke="#e5e7eb" strokeWidth="8" />
                                                    <circle cx="50" cy="50" r="42" fill="none" stroke={getAvgScore(fb.rating) >= 7 ? '#10b981' : getAvgScore(fb.rating) >= 5 ? '#3b82f6' : '#f59e0b'} strokeWidth="8" strokeLinecap="round"
                                                        strokeDasharray={`${(getAvgScore(fb.rating) / 10) * 264} 264`} />
                                                </svg>
                                                <div className="absolute inset-0 flex items-center justify-center">
                                                    <span className={`text-2xl font-bold ${getScoreColor(getAvgScore(fb.rating))}`}>{getAvgScore(fb.rating)}</span>
                                                </div>
                                            </div>
                                            <div className="flex-1 grid grid-cols-2 gap-3">
                                                {fb.rating && Object.entries(fb.rating).map(([key, val]) => (
                                                    <div key={key} className="bg-gray-50 rounded-xl px-4 py-3">
                                                        <div className="flex items-center justify-between mb-2">
                                                            <span className="text-xs font-medium text-gray-500 capitalize">{key.replace(/([A-Z])/g, ' $1').trim()}</span>
                                                            <span className={`text-sm font-bold ${getScoreColor(val)}`}>{val}/10</span>
                                                        </div>
                                                        <div className="h-2 bg-gray-200 rounded-full overflow-hidden">
                                                            <div className={`h-full rounded-full transition-all duration-700 ${getScoreBg(val)}`} style={{ width: `${(val / 10) * 100}%` }}></div>
                                                        </div>
                                                    </div>
                                                ))}
                                            </div>
                                        </div>
                                    </div>

                                    {/* Summary */}
                                    {fb.summary && (
                                        <div className="bg-white rounded-2xl shadow-sm border p-6">
                                            <h3 className="font-bold text-gray-900 mb-3 flex items-center gap-2">
                                                <svg className="w-5 h-5 text-blue-500" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M9 12h3.75M9 15h3.75M9 18h3.75m3 .75H18a2.25 2.25 0 002.25-2.25V6.108c0-1.135-.845-2.098-1.976-2.192a48.424 48.424 0 00-1.123-.08m-5.801 0c-.065.21-.1.433-.1.664 0 .414.336.75.75.75h4.5a.75.75 0 00.75-.75 2.25 2.25 0 00-.1-.664m-5.8 0A2.251 2.251 0 0113.5 2.25H15c1.012 0 1.867.668 2.15 1.586m-5.8 0c-.376.023-.75.05-1.124.08C9.095 4.01 8.25 4.973 8.25 6.108V8.25m0 0H4.875c-.621 0-1.125.504-1.125 1.125v11.25c0 .621.504 1.125 1.125 1.125h9.75c.621 0 1.125-.504 1.125-1.125V9.375c0-.621-.504-1.125-1.125-1.125H8.25z" /></svg>
                                                Performance Summary
                                            </h3>
                                            <p className="text-gray-700 leading-relaxed">{fb.summary}</p>
                                        </div>
                                    )}

                                    {/* Recommendation */}
                                    {(fb.recommendationMsg || fb.RecommendationMsg) && (
                                        <div className="bg-gradient-to-r from-blue-50 to-indigo-50 rounded-2xl border border-blue-100 p-6">
                                            <h3 className="font-bold text-blue-900 mb-2 flex items-center gap-2">
                                                <svg className="w-5 h-5 text-blue-500" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M12 18v-5.25m0 0a6.01 6.01 0 001.5-.189m-1.5.189a6.01 6.01 0 01-1.5-.189m3.75 7.478a12.06 12.06 0 01-4.5 0m3.75 2.383a14.406 14.406 0 01-3 0M14.25 18v-.192c0-.983.658-1.823 1.508-2.316a7.5 7.5 0 10-7.517 0c.85.493 1.509 1.333 1.509 2.316V18" /></svg>
                                                What to Focus On
                                            </h3>
                                            <p className="text-blue-800 leading-relaxed">{fb.recommendationMsg || fb.RecommendationMsg}</p>
                                        </div>
                                    )}

                                    {/* Session metadata */}
                                    {fb.metadata && (
                                        <div className="bg-white rounded-2xl shadow-sm border p-6">
                                            <h3 className="font-bold text-gray-900 mb-3">Session Details</h3>
                                            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                                                <div className="bg-gray-50 rounded-lg p-3 text-center">
                                                    <div className="text-2xl font-bold text-gray-900">{fb.metadata.questionCount || 0}</div>
                                                    <div className="text-xs text-gray-500">Questions</div>
                                                </div>
                                                <div className="bg-gray-50 rounded-lg p-3 text-center">
                                                    <div className="text-2xl font-bold text-gray-900">{fb.metadata.tabSwitchCount || 0}</div>
                                                    <div className="text-xs text-gray-500">Tab Switches</div>
                                                </div>
                                                <div className="bg-gray-50 rounded-lg p-3 text-center">
                                                    <div className="text-2xl font-bold text-gray-900">{fb.metadata.objectWarningCount || 0}</div>
                                                    <div className="text-xs text-gray-500">Warnings</div>
                                                </div>
                                                <div className="bg-gray-50 rounded-lg p-3 text-center">
                                                    <div className="text-xs font-medium text-gray-900 break-all">{fb.metadata.endReason || 'Completed'}</div>
                                                    <div className="text-xs text-gray-500 mt-1">End Reason</div>
                                                </div>
                                            </div>
                                        </div>
                                    )}
                                </div>
                            ) : (
                                <div className="bg-white rounded-2xl shadow-sm border p-12 text-center">
                                    <p className="text-gray-400">Select a session to view detailed feedback</p>
                                </div>
                            )}
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}

export default InterviewFeedbackPage;
