'use client'
import React, { useState, useEffect } from 'react'
import { useParams } from 'next/navigation'
import { supabase } from '@/services/supabaseClient'
import { useUser } from '@/app/provider'
import moment from 'moment'
import CandidateList from './_components/CandidateList'

function InterviewDetail() {
    const { user, isAuthenticated, loading: authLoading } = useUser();
    const { interview_id } = useParams();
    
    const [interview, setInterview] = useState(null);
    const [candidates, setCandidates] = useState([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        if (isAuthenticated && user?.email && interview_id) {
            GetInterviewDetail();
        } else if (!authLoading && !isAuthenticated) {
            console.log('User not authenticated');
        }
    }, [user, interview_id, isAuthenticated, authLoading]);

    const GetInterviewDetail = async () => {
        setLoading(true);
        try {
            // Get interview details
            const { data: interviewData, error: interviewError } = await supabase
                .from('Interviews')
                .select('*')
                .eq('userEmail', user?.email)
                .eq('interview_id', interview_id)
                .single();

            if (interviewError) {
                console.error('Error fetching interview:', interviewError);
                return;
            }

            setInterview(interviewData);

            // Get candidates/feedback for this interview
            console.log("🔍 Fetching candidates for interview_id:", interview_id);
            
            const { data: feedbackData, error: feedbackError } = await supabase
                .from('interview-feedback')  // Note: using hyphen, not underscore
                .select('*')
                .eq('interview_id', interview_id)
                .order('created_at', { ascending: false });

            console.log("📊 Feedback query result:", { feedbackData, feedbackError });

            if (!feedbackError && feedbackData) {
                console.log(`✅ Found ${feedbackData.length} candidates for this interview`);
                setCandidates(feedbackData);
            } else {
                console.log("❌ No feedback data found:", feedbackError?.message || "No error, but no data");
                // If no feedback table or no data, set empty candidates
                setCandidates([]);
            }

        } catch (err) {
            console.error('Error in GetInterviewDetail:', err);
        } finally {
            setLoading(false);
        }
    };

    if (loading) {
        return (
            <div className="p-6">
                <div className="animate-pulse space-y-6">
                    <div className="h-8 bg-gray-200 rounded w-1/3"></div>
                    <div className="h-64 bg-gray-200 rounded"></div>
                    <div className="h-32 bg-gray-200 rounded"></div>
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
                    ← Back to Scheduled Interviews
                </a>
            </div>
        );
    }

    return (
        <div className="p-6">
            {/* Welcome Header Section */}
            <div className="bg-white rounded-lg border border-gray-200 p-6 mb-6">
                <div className="flex justify-between items-center">
                    <div>
                        <h1 className="text-2xl font-bold text-gray-900 mb-2">
                            Welcome Back, {user?.name || user?.email?.split('@')[0]?.toUpperCase() || 'User'}!
                        </h1>
                        <p className="text-gray-600">
                            AI-Powered Interview Practice
                        </p>
                    </div>
                    <div className="w-12 h-12 bg-gray-200 rounded-full flex items-center justify-center">
                        <span className="text-gray-600 font-medium text-lg">
                            {(user?.name || user?.email || 'S').charAt(0).toUpperCase()}
                        </span>
                    </div>
                </div>
            </div>

            <h1 className="text-2xl font-bold text-gray-900 mb-6">Session Detail</h1>

            {/* Interview Details Section */}
            <div className="bg-white rounded-lg border border-gray-200 p-6 mb-6">
                <div className="mb-6">
                    <h2 className="text-xl font-semibold text-gray-900 mb-4">
                        {interview.jobPosition || 'Interview Position'}
                    </h2>
                    
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-6">
                        {/* Duration */}
                        <div>
                            <h3 className="text-sm font-medium text-gray-500 mb-1">Duration</h3>
                            <div className="flex items-center text-gray-900">
                                <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <circle cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="2" />
                                    <path stroke="currentColor" strokeWidth="2" d="M12 6v6l4 2" />
                                </svg>
                                {interview.duration || 'N/A'} Min
                            </div>
                        </div>

                        {/* Created On */}
                        <div>
                            <h3 className="text-sm font-medium text-gray-500 mb-1">Created On</h3>
                            <div className="flex items-center text-gray-900">
                                <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <rect x="3" y="4" width="18" height="18" rx="2" ry="2" stroke="currentColor" strokeWidth="2" />
                                    <line x1="16" y1="2" x2="16" y2="6" stroke="currentColor" strokeWidth="2" />
                                    <line x1="8" y1="2" x2="8" y2="6" stroke="currentColor" strokeWidth="2" />
                                    <line x1="3" y1="10" x2="21" y2="10" stroke="currentColor" strokeWidth="2" />
                                </svg>
                                {moment(interview.created_at).format('MMM DD, YYYY')}
                            </div>
                        </div>

                        {/* Type */}
                        <div>
                            <h3 className="text-sm font-medium text-gray-500 mb-1">Type</h3>
                            <div className="flex items-center text-gray-900">
                                <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <circle cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="2" />
                                    <circle cx="12" cy="10" r="3" stroke="currentColor" strokeWidth="2" />
                                    <path d="M7 20.662V19a2 2 0 0 1 2-2h6a2 2 0 0 1 2 2v1.662" stroke="currentColor" strokeWidth="2" />
                                </svg>
                                {interview.type || 'Technical'}
                            </div>
                        </div>
                    </div>

                    {/* Job Description */}
                    {interview.jobDescription && (
                        <div className="mb-6">
                            <h3 className="text-sm font-medium text-gray-500 mb-2">Job Description</h3>
                            <p className="text-gray-900">{interview.jobDescription}</p>
                        </div>
                    )}

                    {/* Interview Questions */}
                    <div>
                        <h3 className="text-sm font-medium text-gray-500 mb-3">Interview Questions</h3>
                        <div className="space-y-3">
                            {interview.questionList && Array.isArray(interview.questionList) && interview.questionList.length > 0 ? (
                                interview.questionList.map((question, index) => (
                                    <div key={index} className="text-sm text-gray-700">
                                        <span className="font-medium">{index + 1}.</span>
                                        {typeof question === 'object' && question.question 
                                            ? question.question 
                                            : typeof question === 'string' 
                                                ? question 
                                                : 'Question not available'}
                                    </div>
                                ))
                            ) : (
                                <p className="text-sm text-gray-500">No questions available for this interview.</p>
                            )}
                        </div>
                    </div>
                </div>
            </div>

            {/* Candidates Section */}
            <CandidateList candidates={candidates} interviewId={interview_id} />
        </div>
    );
}

export default InterviewDetail;