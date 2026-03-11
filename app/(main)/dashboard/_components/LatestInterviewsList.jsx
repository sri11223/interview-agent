"use client"
import React, { useState, useEffect } from 'react'
import NextLink from 'next/link'
import { GraduationCap, Play, Clock, BarChart3 } from 'lucide-react'
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
            <h2 className='font-bold text-2xl mb-5'>Recent Practice Sessions</h2>
            {interviewList?.length === 0 &&
                <div className='p-8 flex flex-col gap-3 items-center justify-center mt-5 bg-white rounded-xl border' >
                    <GraduationCap className='h-12 w-12 text-blue-500' />
                    <h2 className='text-lg font-medium'>No practice sessions yet!</h2>
                    <p className='text-gray-500 text-sm'>Start your first AI mock interview</p>
                    <Button asChild>
                        <NextLink href="/dashboard/create-interview">Start Practicing</NextLink>
                    </Button>
                </div>
            }
            {interviewList && interviewList.length > 0 &&
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
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
        <div className="bg-white border rounded-xl p-5 hover:shadow-md transition-shadow">
            <div className="flex justify-between items-start mb-3">
                <div className="bg-blue-100 text-blue-700 px-3 py-1 rounded-full text-xs font-medium">
                    {moment(interview.created_at).format('DD MMM YYYY')}
                </div>
            </div>
            
            <h3 className="font-bold text-lg text-gray-800 mb-1">
                {interview.jobPosition || 'Practice Session'}
            </h3>
            
            <div className="flex items-center gap-3 text-gray-500 text-sm mb-4">
                <div className="flex items-center gap-1">
                    <Clock className="w-3.5 h-3.5" />
                    <span>{interview.duration || 'N/A'}</span>
                </div>
                <div className="flex items-center gap-1">
                    <BarChart3 className="w-3.5 h-3.5" />
                    <span>{interview.type || 'General'}</span>
                </div>
            </div>
            
            <div className="flex gap-2">
                <Button
                    variant="outline"
                    size="sm"
                    className="flex-1 flex items-center gap-2"
                    onClick={onRetry}
                >
                    <Play className="w-4 h-4" />
                    Practice Again
                </Button>
            </div>
        </div>
    );
}

export default LatestInterviewsList