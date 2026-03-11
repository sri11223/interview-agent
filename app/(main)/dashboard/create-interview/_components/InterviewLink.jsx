"use client"
import React, { useState, useEffect } from 'react'
import { Button } from '@/components/ui/button'
import { Check, Clock, FileText, ArrowLeft, Plus, Play, GraduationCap } from 'lucide-react'
import { toast } from 'sonner'
import { useRouter } from 'next/navigation'

function InterviewLink({ interviewData, formData, onCreateNew }) {
    const router = useRouter()
    const [interviewLink, setInterviewLink] = useState('')
    const [interviewId, setInterviewId] = useState('')

    useEffect(() => {
        if (interviewData?.interview_id || interviewData?.id) {
            const id = interviewData.interview_id || interviewData.id
            setInterviewId(id)
            const baseUrl = typeof window !== 'undefined' ? window.location.origin : 'http://localhost:3000'
            setInterviewLink(`${baseUrl}/interview/${id}`)
        }
    }, [interviewData])

    const handleStartPractice = () => {
        if (interviewId) {
            router.push(`/interview/${interviewId}`)
        }
    }

    const handleBackToDashboard = () => {
        router.push('/dashboard')
    }

    const handleCreateNewPractice = () => {
        if (onCreateNew) {
            onCreateNew();
        } else {
            router.push('/dashboard')
        }
    }

    return (
        <div className="max-w-2xl mx-auto p-6 bg-white rounded-xl">
            {/* Success Header */}
            <div className="text-center mb-8">
                <div className="w-16 h-16 bg-green-500 rounded-full flex items-center justify-center mx-auto mb-4">
                    <Check className="w-8 h-8 text-white" />
                </div>
                <h1 className="text-2xl font-bold text-gray-900 mb-2">
                    Practice Session Ready!
                </h1>
                <p className="text-gray-600">
                    Your AI interview questions have been generated. Start practicing now!
                </p>
            </div>

            {/* Session Details */}
            <div className="bg-gray-50 rounded-lg p-6 mb-6">
                <h3 className="font-semibold text-lg mb-4">Session Details</h3>
                <div className="space-y-3">
                    <div className="flex items-center gap-3">
                        <GraduationCap className="w-5 h-5 text-blue-600" />
                        <span className="text-gray-700">
                            <strong>Category:</strong> {formData?.jobPosition || 'General'}
                        </span>
                    </div>
                    <div className="flex items-center gap-3">
                        <Clock className="w-5 h-5 text-blue-600" />
                        <span className="text-gray-700">
                            <strong>Duration:</strong> {formData?.duration || '30 Minutes'}
                        </span>
                    </div>
                    <div className="flex items-center gap-3">
                        <FileText className="w-5 h-5 text-blue-600" />
                        <span className="text-gray-700">
                            <strong>Questions:</strong> {interviewData?.questions?.length || interviewData?.database_record?.questionList?.length || 'Multiple'} questions
                        </span>
                    </div>
                </div>
            </div>

            {/* Tips */}
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-6">
                <h4 className="font-semibold text-blue-800 mb-2">Tips for Best Practice</h4>
                <ul className="text-sm text-blue-700 space-y-1">
                    <li>Find a quiet place with good internet</li>
                    <li>Have your webcam and microphone ready</li>
                    <li>Speak clearly and take your time thinking</li>
                    <li>Treat it like a real interview!</li>
                </ul>
            </div>

            {/* Action Buttons */}
            <div className="space-y-3">
                <Button 
                    onClick={handleStartPractice}
                    className="w-full py-6 text-lg bg-blue-600 hover:bg-blue-700"
                    disabled={!interviewId}
                >
                    <Play className="w-5 h-5 mr-2" />
                    Start Practice Now
                </Button>
                
                <div className="flex gap-3">
                    <Button
                        variant="outline"
                        onClick={handleCreateNewPractice}
                        className="flex-1"
                    >
                        <Plus className="w-4 h-4 mr-2" />
                        New Session
                    </Button>
                    <Button
                        variant="outline"
                        onClick={handleBackToDashboard}
                        className="flex-1"
                    >
                        <ArrowLeft className="w-4 h-4 mr-2" />
                        Dashboard
                    </Button>
                </div>
            </div>
        </div>
    )
}

export default InterviewLink
