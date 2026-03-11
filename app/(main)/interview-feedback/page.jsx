"use client"
import React, { useState, useEffect } from 'react'
import { useSearchParams } from 'next/navigation'
import { supabase } from '@/services/supabaseClient'
import { useUser } from '@/app/provider'
import moment from 'moment'

function InterviewFeedbackPage() {
    const { user } = useUser();
    const searchParams = useSearchParams();
    const interviewId = searchParams.get('id');
    
    const [interview, setInterview] = useState(null);
    const [feedbackList, setFeedbackList] = useState([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        if (interviewId && user?.email) {
            GetInterviewDetails();
        }
    }, [interviewId, user]);

    const GetInterviewDetails = async () => {
        setLoading(true);
        try {
            // Get interview details
            const { data: interviewData, error: interviewError } = await supabase
                .from('Interviews')
                .select('*')
                .eq('interview_id', interviewId)
                .eq('userEmail', user.email)
                .single();

            if (interviewError) {
                console.error('Error fetching interview:', interviewError);
                return;
            }

            setInterview(interviewData);

            // Try to get feedback data - this table might not exist yet
            try {
                const { data: feedbackData, error: feedbackError } = await supabase
                    .from('interview_feedback')
                    .select('*')
                    .eq('interview_id', interviewId);

                if (!feedbackError && feedbackData) {
                    setFeedbackList(feedbackData);
                } else {
                    // If feedback table doesn't exist, create sample data
                    console.log('Feedback table not found, using sample data');
                    setFeedbackList([]);
                }
            } catch (err) {
                console.log('Feedback table does not exist, using empty feedback');
                setFeedbackList([]);
            }

        } catch (err) {
            console.error('Error in GetInterviewDetails:', err);
        } finally {
            setLoading(false);
        }
    };

    if (loading) {
        return (
            <div className="p-6">
                <div className="animate-pulse">
                    <div className="h-8 bg-gray-200 rounded mb-4"></div>
                    <div className="h-64 bg-gray-200 rounded"></div>
                </div>
            </div>
        );
    }

    if (!interview) {
        return (
            <div className="p-6 text-center">
                <h2 className="text-xl font-semibold text-gray-900">Interview not found</h2>
                <p className="text-gray-600 mt-2">The interview you're looking for doesn't exist or you don't have permission to view it.</p>
                <a href="/scheduled-interview" className="mt-4 inline-block text-blue-600 hover:text-blue-800">
                    Back to Interview List
                </a>
            </div>
        );
    }

    return (
        <div className="p-6">
            {/* Header */}
            <div className="mb-6">
                <a href="/scheduled-interview" className="text-blue-600 hover:text-blue-800 mb-4 inline-block">
                    ← Back to Interview List
                </a>
                <h1 className="text-2xl font-bold text-gray-900">Session Feedback</h1>
                <p className="text-gray-600">Review your practice performance</p>
            </div>

            {/* Interview Details */}
            <div className="bg-white rounded-lg border border-gray-200 p-6 mb-6">
                <div className="flex items-start gap-4">
                    <div className="w-16 h-16 bg-blue-500 rounded-full flex items-center justify-center">
                        <span className="text-white font-medium text-xl">
                            {(interview.jobPosition || 'I').charAt(0).toUpperCase()}
                        </span>
                    </div>
                    <div className="flex-1">
                        <h2 className="text-xl font-semibold text-gray-900 mb-2">
                            {interview.jobPosition || 'Interview Position'}
                        </h2>
                        <div className="flex items-center gap-4 text-sm text-gray-600">
                            <span>Duration: {interview.duration || 'N/A'} minutes</span>
                            <span>Created: {moment(interview.created_at).format('DD MMM YYYY, HH:mm')}</span>
                            <span>Sessions: {feedbackList.length}</span>
                        </div>
                    </div>
                </div>
            </div>

            {/* Feedback List */}
            <div className="space-y-6">
                <h3 className="text-lg font-semibold text-gray-900">
                    Session Feedback ({feedbackList.length})
                </h3>

                {feedbackList.length === 0 ? (
                    <div className="bg-white rounded-lg border border-gray-200 p-8 text-center">
                        <div className="mx-auto w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mb-4">
                            <svg className="w-8 h-8 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                            </svg>
                        </div>
                        <h4 className="text-lg font-medium text-gray-900 mb-2">No feedback yet</h4>
                        <p className="text-gray-600 mb-4">
                            Complete this practice session to see your feedback here.
                        </p>
                    </div>
                ) : (
                    <div className="space-y-4">
                        {feedbackList.map((feedback, index) => (
                            <div key={feedback.id || index} className="bg-white rounded-lg border border-gray-200 p-6">
                                <div className="flex items-start justify-between mb-4">
                                    <div>
                                        <h4 className="font-semibold text-gray-900">
                                            Candidate {index + 1}
                                        </h4>
                                        <p className="text-sm text-gray-600">
                                            {feedback.userEmail || 'Anonymous'}
                                        </p>
                                        <p className="text-xs text-gray-500">
                                            {moment(feedback.created_at).format('DD MMM YYYY, HH:mm')}
                                        </p>
                                    </div>
                                    <div className="text-right">
                                        <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800">
                                            Completed
                                        </span>
                                    </div>
                                </div>

                                {/* Feedback Content */}
                                <div className="bg-gray-50 rounded-lg p-4">
                                    <h5 className="font-medium text-gray-900 mb-2">AI Generated Feedback</h5>
                                    <div className="text-sm text-gray-700">
                                        {feedback.feedback ? (
                                            typeof feedback.feedback === 'string' 
                                                ? feedback.feedback 
                                                : JSON.stringify(feedback.feedback, null, 2)
                                        ) : (
                                            'No detailed feedback available'
                                        )}
                                    </div>
                                </div>
                            </div>
                        ))}
                    </div>
                )}
            </div>
        </div>
    );
}

export default InterviewFeedbackPage;