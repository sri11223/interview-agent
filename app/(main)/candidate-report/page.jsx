'use client'
import React, { useState, useEffect } from 'react'
import { useSearchParams } from 'next/navigation'
import { supabase } from '@/services/supabaseClient'
import { useUser } from '@/app/provider'
import moment from 'moment'

function CandidateReport() {
    const { user } = useUser();
    const searchParams = useSearchParams();
    const interviewId = searchParams.get('interview_id');
    const candidateId = searchParams.get('candidate_id');
    
    const [candidate, setCandidate] = useState(null);
    const [interview, setInterview] = useState(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        if (user?.email && interviewId && candidateId) {
            GetCandidateReport();
        }
    }, [user, interviewId, candidateId]);

    const GetCandidateReport = async () => {
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

            // Get candidate feedback
            const { data: candidateData, error: candidateError } = await supabase
                .from('interview_feedback')
                .select('*')
                .eq('id', candidateId)
                .eq('interview_id', interviewId)
                .single();

            if (!candidateError && candidateData) {
                setCandidate(candidateData);
            }

        } catch (err) {
            console.error('Error in GetCandidateReport:', err);
        } finally {
            setLoading(false);
        }
    };

    const renderFeedback = (feedback) => {
        if (!feedback) return 'No feedback available';
        
        if (typeof feedback === 'string') {
            return feedback;
        }
        
        if (typeof feedback === 'object') {
            return (
                <div className="space-y-4">
                    {feedback.summary && (
                        <div>
                            <h4 className="font-medium text-gray-900">Summary</h4>
                            <p className="text-gray-700">{feedback.summary}</p>
                        </div>
                    )}
                    
                    {(feedback.rating || feedback.ratings) && (
                        <div>
                            <h4 className="font-medium text-gray-900 mb-2">Ratings</h4>
                            <div className="space-y-2">
                                {Object.entries(feedback.rating || feedback.ratings || {}).map(([skill, rating]) => (
                                    <div key={skill} className="flex justify-between">
                                        <span className="capitalize">{skill.replace(/([A-Z])/g, ' $1').trim()}</span>
                                        <span className="font-medium">{rating}/10</span>
                                    </div>
                                ))}
                            </div>
                        </div>
                    )}
                    
                    {(feedback.Recommendation || feedback.recommendation) && (
                        <div>
                            <h4 className="font-medium text-gray-900">Recommendation</h4>
                            <div className="flex items-center gap-2">
                                <span className={`px-3 py-1 rounded-full text-sm font-medium ${
                                    (feedback.Recommendation || feedback.recommendation) === 'Excellent' 
                                        ? 'bg-green-100 text-green-800' 
                                        : (feedback.Recommendation || feedback.recommendation) === 'Needs More Practice'
                                        ? 'bg-red-100 text-red-800'
                                        : 'bg-yellow-100 text-yellow-800'
                                }`}>
                                    {feedback.Recommendation || feedback.recommendation}
                                </span>
                            </div>
                            {(feedback.RecommendationMsg || feedback.recommendationMsg) && (
                                <p className="text-gray-700 mt-2">{feedback.RecommendationMsg || feedback.recommendationMsg}</p>
                            )}
                        </div>
                    )}
                </div>
            );
        }
        
        return JSON.stringify(feedback, null, 2);
    };

    if (loading) {
        return (
            <div className="p-6">
                <div className="animate-pulse space-y-6">
                    <div className="h-8 bg-gray-200 rounded w-1/3"></div>
                    <div className="h-64 bg-gray-200 rounded"></div>
                </div>
            </div>
        );
    }

    if (!candidate || !interview) {
        return (
            <div className="p-6 text-center">
                <h2 className="text-xl font-semibold text-gray-900">Report not found</h2>
                <p className="text-gray-600 mt-2">The candidate report you're looking for doesn't exist.</p>
                <button 
                    onClick={() => window.close()}
                    className="mt-4 text-blue-600 hover:text-blue-800"
                >
                    Close Window
                </button>
            </div>
        );
    }

    const candidateName = candidate.userName || candidate.candidate_name || 'Unknown Candidate';

    return (
        <div className="p-6 max-w-4xl mx-auto">
            {/* Header */}
            <div className="mb-6">
                <button 
                    onClick={() => window.close()}
                    className="text-blue-600 hover:text-blue-800 mb-4 inline-block"
                >
                    ← Close Window
                </button>
                <h1 className="text-2xl font-bold text-gray-900">Session Report</h1>
                <p className="text-gray-600">Detailed practice performance and feedback</p>
            </div>

            {/* Candidate Info Card */}
            <div className="bg-white rounded-lg border border-gray-200 p-6 mb-6">
                <div className="flex items-start gap-4">
                    <div className="w-16 h-16 bg-blue-500 rounded-full flex items-center justify-center">
                        <span className="text-white font-medium text-xl">
                            {candidateName.charAt(0).toUpperCase()}
                        </span>
                    </div>
                    <div className="flex-1">
                        <h2 className="text-xl font-semibold text-gray-900 mb-1">
                            {candidateName}
                        </h2>
                        <p className="text-gray-600 mb-2">{candidate.userEmail || 'No email provided'}</p>
                        <div className="flex items-center gap-4 text-sm text-gray-600">
                            <span>Position: {interview.jobPosition}</span>
                            <span>Completed: {moment(candidate.created_at).format('MMM DD, YYYY HH:mm')}</span>
                            <span>Duration: {interview.duration} minutes</span>
                        </div>
                    </div>
                    <div className="text-right">
                        <div className="text-2xl font-bold text-green-600 mb-1">
                            {candidate.rating || 'N/A'}/10
                        </div>
                        <div className="text-sm text-gray-600">Overall Score</div>
                    </div>
                </div>
            </div>

            {/* Feedback Section */}
            <div className="bg-white rounded-lg border border-gray-200 p-6 mb-6">
                <h3 className="text-lg font-semibold text-gray-900 mb-4">AI Generated Feedback</h3>
                <div className="prose max-w-none">
                    {renderFeedback(candidate.feedback)}
                </div>
            </div>

            {/* Conversation Transcript (if available) */}
            {candidate.conversation_transcript && (
                <div className="bg-white rounded-lg border border-gray-200 p-6">
                    <h3 className="text-lg font-semibold text-gray-900 mb-4">Interview Transcript</h3>
                    <div className="bg-gray-50 rounded-lg p-4 max-h-96 overflow-y-auto">
                        <pre className="text-sm text-gray-700 whitespace-pre-wrap">
                            {candidate.conversation_transcript}
                        </pre>
                    </div>
                </div>
            )}

            {/* Actions */}
            <div className="mt-6 flex gap-4">
                <button
                    onClick={() => window.print()}
                    className="px-4 py-2 bg-blue-600 text-white text-sm font-medium rounded-md hover:bg-blue-700 transition-colors duration-200"
                >
                    Print Report
                </button>
                <button
                    onClick={() => {
                        const reportData = {
                            candidate: candidateName,
                            position: interview.jobPosition,
                            score: candidate.rating,
                            date: moment(candidate.created_at).format('MMM DD, YYYY'),
                            feedback: candidate.feedback
                        };
                        const dataStr = JSON.stringify(reportData, null, 2);
                        const dataBlob = new Blob([dataStr], {type: 'application/json'});
                        const url = URL.createObjectURL(dataBlob);
                        const link = document.createElement('a');
                        link.href = url;
                        link.download = `${candidateName}-report.json`;
                        link.click();
                    }}
                    className="px-4 py-2 border border-gray-300 text-gray-700 text-sm font-medium rounded-md hover:bg-gray-50 transition-colors duration-200"
                >
                    Download JSON
                </button>
            </div>
        </div>
    );
}

export default CandidateReport;