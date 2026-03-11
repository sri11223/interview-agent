"use client"

import React, { useState, useEffect } from 'react'
import { supabase } from "@/services/supabaseClient"
import { useUser } from '@/app/provider'
import { useRouter } from 'next/navigation'
import moment from 'moment'
import { Clock, BarChart3, Play, GraduationCap } from 'lucide-react'

function PracticeHistory() {
    const { user } = useUser();
    const router = useRouter();
    const [interviewList, setInterviewList] = useState([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        user && GetInterviewList();
    }, [user]);

    const GetInterviewList = async () => {
        if (!user?.email) return;
        
        setLoading(true);
        try {
            const { data: interviews, error: interviewError } = await supabase
                .from('Interviews')
                .select('*')
                .eq('userEmail', user.email)
                .order('created_at', { ascending: false });

            if (interviewError) {
                console.error('Error fetching interviews:', interviewError);
                return;
            }

            let interviewsWithFeedback = [];
            
            if (interviews && interviews.length > 0) {
                for (const interview of interviews) {
                    try {
                        const { data: feedbackData, error: feedbackError } = await supabase
                            .from('interview-feedback')
                            .select('*')
                            .eq('interview_id', interview.interview_id);

                        interviewsWithFeedback.push({
                            ...interview,
                            hasFeedback: feedbackData && feedbackData.length > 0,
                            feedbackData: feedbackData?.[0] || null,
                        });
                    } catch (err) {
                        interviewsWithFeedback.push({
                            ...interview,
                            hasFeedback: false,
                            feedbackData: null,
                        });
                    }
                }
            }

            setInterviewList(interviewsWithFeedback || []);
        } catch (err) {
            console.error('Error in GetInterviewList:', err);
        } finally {
            setLoading(false);
        }
    }

    if (loading) {
        return (
            <div className="p-6">
                <h2 className="text-2xl font-bold text-gray-900 mb-6">My Practice History</h2>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {[...Array(6)].map((_, index) => (
                        <div key={index} className="bg-white rounded-xl border p-6 animate-pulse">
                            <div className="h-5 bg-gray-200 rounded mb-3 w-2/3"></div>
                            <div className="h-4 bg-gray-200 rounded mb-2 w-1/3"></div>
                            <div className="h-4 bg-gray-200 rounded w-1/2"></div>
                        </div>
                    ))}
                </div>
            </div>
        );
    }

    return (
        <div className="p-6">
            <div className="bg-white rounded-xl border p-6 mb-6">
                <h1 className="text-2xl font-bold text-gray-900 mb-1">
                    My Practice History
                </h1>
                <p className="text-gray-500">
                    Review your past practice sessions and track your improvement
                </p>
            </div>

            {interviewList.length === 0 ? (
                <div className="text-center py-16 bg-white rounded-xl border">
                    <GraduationCap className="h-16 w-16 text-blue-300 mx-auto mb-4" />
                    <h3 className="text-xl font-semibold text-gray-700 mb-2">No practice sessions yet</h3>
                    <p className="text-gray-500 mb-6">Start your first AI mock interview to see results here</p>
                    <button 
                        onClick={() => router.push('/dashboard/create-interview')}
                        className="px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition font-medium"
                    >
                        Start Practicing
                    </button>
                </div>
            ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {interviewList.map((interview) => {
                        const feedback = interview.feedbackData?.feedback;
                        const rating = feedback?.rating;
                        const avgScore = rating 
                            ? Math.round(Object.values(rating).reduce((a, b) => a + b, 0) / Object.values(rating).length * 10) / 10
                            : null;
                        
                        return (
                            <div key={interview.interview_id} className="bg-white rounded-xl border p-6 hover:shadow-lg transition-shadow">
                                <div className="flex justify-between items-start mb-3">
                                    <span className="bg-blue-100 text-blue-700 px-3 py-1 rounded-full text-xs font-medium">
                                        {moment(interview.created_at).format('DD MMM YYYY')}
                                    </span>
                                    {avgScore && (
                                        <span className={`px-2 py-1 rounded-full text-xs font-bold ${
                                            avgScore >= 7 ? 'bg-green-100 text-green-700' : 
                                            avgScore >= 5 ? 'bg-yellow-100 text-yellow-700' : 
                                            'bg-red-100 text-red-700'
                                        }`}>
                                            {avgScore}/10
                                        </span>
                                    )}
                                </div>
                                
                                <h3 className="font-bold text-lg text-gray-800 mb-2">
                                    {interview.jobPosition || 'Practice Session'}
                                </h3>
                                
                                <div className="flex items-center gap-3 text-gray-500 text-sm mb-4">
                                    <div className="flex items-center gap-1">
                                        <Clock className="w-3.5 h-3.5" />
                                        <span>{interview.duration || 'N/A'}</span>
                                    </div>
                                </div>

                                {/* Score bars */}
                                {rating && (
                                    <div className="space-y-2 mb-4">
                                        {Object.entries(rating).map(([key, value]) => (
                                            <div key={key} className="flex items-center gap-2">
                                                <span className="text-xs text-gray-500 w-24 truncate capitalize">
                                                    {key.replace(/([A-Z])/g, ' $1').trim()}
                                                </span>
                                                <div className="flex-1 bg-gray-100 rounded-full h-2">
                                                    <div 
                                                        className={`h-2 rounded-full ${
                                                            value >= 7 ? 'bg-green-500' : value >= 5 ? 'bg-yellow-500' : 'bg-red-500'
                                                        }`}
                                                        style={{ width: `${value * 10}%` }}
                                                    />
                                                </div>
                                                <span className="text-xs font-medium w-6 text-right">{value}</span>
                                            </div>
                                        ))}
                                    </div>
                                )}

                                {feedback?.Recommendation && (
                                    <div className={`text-xs font-medium px-2 py-1 rounded inline-block mb-3 ${
                                        feedback.Recommendation === 'Excellent' ? 'bg-green-100 text-green-700' :
                                        feedback.Recommendation.includes('Good') ? 'bg-yellow-100 text-yellow-700' :
                                        'bg-red-100 text-red-700'
                                    }`}>
                                        {feedback.Recommendation}
                                    </div>
                                )}
                                
                                <div className="flex gap-2 mt-2">
                                    <button
                                        onClick={() => router.push(`/dashboard/create-interview?category=${encodeURIComponent(interview.jobPosition)}`)}
                                        className="flex-1 flex items-center justify-center gap-1 px-3 py-2 border rounded-lg text-sm hover:bg-gray-50 transition"
                                    >
                                        <Play className="w-3.5 h-3.5" />
                                        Practice Again
                                    </button>
                                    {interview.hasFeedback && (
                                        <button
                                            onClick={() => router.push(`/scheduled-interview/${interview.interview_id}/details`)}
                                            className="flex-1 flex items-center justify-center gap-1 px-3 py-2 bg-blue-600 text-white rounded-lg text-sm hover:bg-blue-700 transition"
                                        >
                                            <BarChart3 className="w-3.5 h-3.5" />
                                            View Details
                                        </button>
                                    )}
                                </div>
                            </div>
                        );
                    })}
                </div>
            )}
        </div>
    );
}

export default PracticeHistory
