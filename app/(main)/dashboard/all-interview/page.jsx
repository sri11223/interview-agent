"use client"
import React, { useState, useEffect } from 'react'
import Link from 'next/link'
import { supabase } from '@/services/supabaseClient'
import { useUser } from '@/app/provider'
import InterviewCard from '../_components/InterviewCard'
import moment from 'moment'
import { toast } from 'sonner'

function AllInterviewPage() {
    const [interviewList, setInterviewList] = useState([]);
    const [loading, setLoading] = useState(true);
    const { user } = useUser();

    const GetAllInterviews = async () => {
        if (!user?.email) return;
        
        setLoading(true);
        try {
            let { data: Interviews, error } = await supabase
                .from('Interviews')
                .select('*')
                .eq('userEmail', user.email)
                .order('created_at', { ascending: false });

            if (error) {
                console.error('Error fetching interviews:', error);
                toast.error('Failed to load interviews');
                return;
            }

            console.log('All Interviews:', Interviews);
            setInterviewList(Interviews || []);
        } catch (err) {
            console.error('Error in GetAllInterviews:', err);
            toast.error('Failed to load interviews');
        } finally {
            setLoading(false);
        }
    }

    useEffect(() => {
        GetAllInterviews();
    }, [user]);

    if (loading) {
        return (
            <div className="p-6">
                <h2 className="text-2xl font-bold text-gray-900 mb-6">All Previously Created Interviews</h2>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {[...Array(6)].map((_, index) => (
                        <div key={index} className="bg-white rounded-lg border border-gray-200 p-6 animate-pulse">
                            <div className="flex justify-between items-start mb-4">
                                <div className="flex-1">
                                    <div className="h-6 bg-gray-200 rounded mb-2"></div>
                                    <div className="flex items-center gap-2">
                                        <div className="h-5 w-20 bg-gray-200 rounded-full"></div>
                                        <div className="h-4 w-12 bg-gray-200 rounded"></div>
                                    </div>
                                </div>
                                <div className="w-12 h-12 bg-gray-200 rounded-full"></div>
                            </div>
                            <div className="flex gap-2">
                                <div className="flex-1 h-10 bg-gray-200 rounded-md"></div>
                                <div className="flex-1 h-10 bg-gray-200 rounded-md"></div>
                            </div>
                        </div>
                    ))}
                </div>
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
                            {(user?.name || user?.email || 'A').charAt(0).toUpperCase()}
                        </span>
                    </div>
                </div>
            </div>

            <h2 className="text-2xl font-bold text-gray-900 mb-6">All Practice Sessions</h2>
            
            {interviewList.length === 0 ? (
                <div className="text-center py-12">
                    <div className="mx-auto w-24 h-24 bg-gray-100 rounded-full flex items-center justify-center mb-4">
                        <svg className="w-12 h-12 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                        </svg>
                    </div>
                    <h3 className="text-lg font-medium text-gray-900 mb-2">No interviews found</h3>
                    <p className="text-gray-600 mb-6">Get started by creating your first interview.</p>
                    <Link 
                        href="/dashboard/create-interview" 
                        className="inline-flex items-center px-4 py-2 bg-blue-600 text-white text-sm font-medium rounded-md hover:bg-blue-700 transition-colors duration-200"
                    >
                        Create New Interview
                    </Link>
                </div>
            ) : (
                <>
                    <div className="mb-4 text-sm text-gray-600">
                        Showing {interviewList.length} interview{interviewList.length !== 1 ? 's' : ''}
                    </div>
                    
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                        {interviewList.map((interview, index) => (
                            <InterviewCard key={interview.interview_id || index} interview={interview} />
                        ))}
                    </div>
                </>
            )}
        </div>
    );
}

export default AllInterviewPage;
