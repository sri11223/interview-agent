"use client"
import React, { useState, useEffect } from 'react'
import NextLink from 'next/link'
import { GraduationCap, Play, Clock, BarChart3, ChevronRight } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { supabase } from '@/services/supabaseClient'
import { useUser } from '@/app/provider'
import moment from 'moment'
import { useRouter } from 'next/navigation'

function LatestInterviewsList() {
    const [interviewList, setInterviewList] = useState([]);
    const { user } = useUser();
    const router = useRouter();

    const GetInterviewList = async () => {
        if (!user?.email) return;
        
        try {
            let { data: Interviews, error } = await supabase
                .from('Interviews')
                .select('*')
                .eq('userEmail', user.email)
                .order('created_at', { ascending: false })
                .limit(6);

            if (error) {
                console.error('Error fetching interviews:', error);
                return;
            }

            setInterviewList(Interviews || []);
        } catch (err) {
            console.error('Error in GetInterviewList:', err);
        }
    }

    useEffect(() => {
        if (user) {
            GetInterviewList();
        }
    }, [user]);

    return (
        <div className='my-5'>
            <div className='flex justify-between items-center mb-6'>
                <h2 className='text-2xl font-extrabold text-gray-900 tracking-tight'>Recent Practice Sessions</h2>
                {interviewList?.length > 0 && (
                    <NextLink href="/dashboard/all-interview" className='text-blue-600 hover:text-blue-700 text-sm font-semibold flex items-center gap-1 group'>
                        View All
                        <ChevronRight className='w-4 h-4 transition-transform group-hover:translate-x-1' />
                    </NextLink>
                )}
            </div>
            
            {interviewList?.length === 0 &&
                <div className='p-12 flex flex-col gap-4 items-center justify-center mt-5 bg-white rounded-2xl shadow-sm border border-gray-100 text-center'>
                    <div className="w-20 h-20 bg-blue-50 rounded-full flex items-center justify-center">
                        <GraduationCap className='h-10 w-10 text-blue-600' />
                    </div>
                    <div>
                        <h2 className='text-xl font-bold text-gray-900'>No practice sessions yet!</h2>
                        <p className='text-gray-500 mt-1 max-w-sm mx-auto'>Start your first AI mock interview and track your progress here.</p>
                    </div>
                    <Button asChild className="mt-2 button-primary px-8">
                        <NextLink href="/dashboard/create-interview">Start Practicing</NextLink>
                    </Button>
                </div>
            }
            
            {interviewList && interviewList.length > 0 &&
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {interviewList.map((interview, index) => (
                        <PracticeCard 
                            interview={interview} 
                            key={interview.interview_id || index}
                            onRetry={() => router.push(`/dashboard/create-interview?category=${encodeURIComponent(interview.jobPosition)}`)}
                        />
                    ))}
                </div>
            }
        </div>
    )
}

function PracticeCard({ interview, onRetry }) {
    return (
        <div className="bg-white border hover:border-blue-200 rounded-2xl p-6 hover:shadow-lg transition-all duration-300 group flex flex-col h-full">
            <div className="flex justify-between items-start mb-4">
                <div className="bg-gradient-to-r from-blue-50 to-indigo-50 text-blue-700 px-3 py-1 rounded-md text-xs font-semibold uppercase tracking-wider">
                    {moment(interview.created_at).format('MMM DD, YYYY')}
                </div>
            </div>
            
            <h3 className="font-extrabold text-xl text-gray-900 mb-3 flex-shrink-0 line-clamp-2">
                {interview.jobPosition || 'Practice Session'}
            </h3>
            
            <div className="flex items-center gap-4 text-gray-500 text-sm mb-6 mt-auto">
                <div className="flex items-center gap-1.5 bg-gray-50 px-2.5 py-1 rounded-md">
                    <Clock className="w-4 h-4 text-gray-400" />
                    <span className="font-medium">{interview.duration || 'N/A'} min</span>
                </div>
                <div className="flex items-center gap-1.5 bg-gray-50 px-2.5 py-1 rounded-md">
                    <BarChart3 className="w-4 h-4 text-gray-400" />
                    <span className="font-medium">{interview.type || 'General'}</span>
                </div>
            </div>
            
            <Button
                variant="outline"
                className="w-full justify-center gap-2 group-hover:bg-blue-600 group-hover:text-white transition-colors"
                onClick={onRetry}
            >
                <Play className="w-4 h-4 fill-current" />
                Practice Again
            </Button>
        </div>
    );
}

export default LatestInterviewsList