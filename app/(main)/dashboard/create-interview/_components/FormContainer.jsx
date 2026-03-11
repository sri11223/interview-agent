"use client"
import React, { useState } from 'react'
import { Textarea } from '@/components/ui/textarea'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { Button } from '@/components/ui/button'
import { Loader2, Play } from 'lucide-react'
import { PracticeCategories, PracticeLanguages, DifficultyLevels } from '@/services/Constants'
import { supabase } from '@/services/supabaseClient'
import { useUser } from '@/app/provider'
import { useRouter } from 'next/navigation'
import { toast } from 'sonner'

function FormContainer({ initialCategory }) {
    const router = useRouter()
    const { user } = useUser()
    const [selectedCategory, setSelectedCategory] = useState(initialCategory || '')
    const [selectedLanguage, setSelectedLanguage] = useState('')
    const [selectedDifficulty, setSelectedDifficulty] = useState('Intermediate')
    const [duration, setDuration] = useState('')
    const [topics, setTopics] = useState('')
    const [loading, setLoading] = useState(false)

    const handleStartInterview = async () => {
        if (!selectedCategory) {
            toast.error('Please select a practice category')
            return
        }
        if (!duration) {
            toast.error('Please select a session duration')
            return
        }

        setLoading(true)
        try {
            const { data: { session } } = await supabase.auth.getSession()
            if (!session?.user) {
                toast.error('Please login to start a practice session')
                setLoading(false)
                return
            }

            const currentUser = user || session.user
            const interviewId = crypto.randomUUID()

            let description = `Practice category: ${selectedCategory}.`
            if (selectedLanguage) description += ` Programming language: ${selectedLanguage}.`
            if (selectedDifficulty) description += ` Difficulty: ${selectedDifficulty}.`
            if (topics) description += ` Focus topics: ${topics}.`

            const interviewType = (selectedCategory === 'Behavioral') ? 'Behavioral' : 'Technical, Problem Solving'

            const { error } = await supabase.from('Interviews').insert([{
                interview_id: interviewId,
                jobPosition: selectedCategory,
                jobDescription: description,
                duration: duration,
                type: interviewType,
                questionList: [],
                userEmail: currentUser.email,
            }])

            if (error) {
                console.error('Failed to create interview:', error)
                toast.error(`Failed to create session: ${error.message}`)
                setLoading(false)
                return
            }

            const name = currentUser.user_metadata?.name || currentUser.user_metadata?.full_name || currentUser.email?.split('@')[0] || 'Student'
            router.push(`/interview/${interviewId}/start?name=${encodeURIComponent(name)}&email=${encodeURIComponent(currentUser.email)}`)
        } catch (err) {
            console.error('Error starting interview:', err)
            toast.error('Something went wrong. Please try again.')
            setLoading(false)
        }
    }

    return (
        <div className='p-5 bg-white rounded-xl'>
            {/* Category Selection */}
            <div>
                <h2 className='text-sm font-medium mb-3'>Practice Category</h2>
                <div className='grid grid-cols-2 gap-3'>
                    {PracticeCategories.map((cat) => (
                        <div
                            key={cat.title}
                            className={`flex items-center gap-3 p-4 rounded-lg border-2 cursor-pointer transition-all ${
                                selectedCategory === cat.title 
                                    ? 'border-blue-500 bg-blue-50' 
                                    : 'border-gray-200 hover:border-gray-300'
                            }`}
                            onClick={() => setSelectedCategory(cat.title)}
                        >
                            <cat.icon className={`h-6 w-6 ${selectedCategory === cat.title ? 'text-blue-600' : 'text-gray-500'}`} />
                            <div>
                                <h3 className='font-medium'>{cat.title}</h3>
                                <p className='text-xs text-gray-500'>{cat.description}</p>
                            </div>
                        </div>
                    ))}
                </div>
            </div>

            {/* Language Selection */}
            <div className='mt-5'>
                <h2 className='text-sm font-medium mb-3'>Programming Language (optional)</h2>
                <div className='flex gap-3 flex-wrap'>
                    {PracticeLanguages.map((lang) => (
                        <div
                            key={lang.title}
                            className={`flex items-center gap-2 px-4 py-2 rounded-lg border-2 cursor-pointer transition-all ${
                                selectedLanguage === lang.title 
                                    ? 'border-blue-500 bg-blue-50' 
                                    : 'border-gray-200 hover:border-gray-300'
                            }`}
                            onClick={() => setSelectedLanguage(prev => prev === lang.title ? '' : lang.title)}
                        >
                            <span className='text-lg'>{lang.icon}</span>
                            <span className='font-medium'>{lang.title}</span>
                        </div>
                    ))}
                </div>
            </div>

            {/* Difficulty Selection */}
            <div className='mt-5'>
                <h2 className='text-sm font-medium mb-3'>Difficulty Level</h2>
                <div className='flex gap-3'>
                    {DifficultyLevels.map((level) => (
                        <div
                            key={level.title}
                            className={`px-4 py-2 rounded-lg border-2 cursor-pointer transition-all ${
                                selectedDifficulty === level.title 
                                    ? 'border-blue-500 bg-blue-50 font-medium' 
                                    : 'border-gray-200 hover:border-gray-300'
                            }`}
                            onClick={() => setSelectedDifficulty(level.title)}
                        >
                            {level.title}
                        </div>
                    ))}
                </div>
            </div>

            {/* Additional topic details */}
            <div className='mt-5'>
                <h2 className='text-sm font-medium'>Specific Topics (optional)</h2>
                <Textarea 
                    placeholder='e.g., Focus on React hooks, REST APIs, binary trees...' 
                    className='h-[100px] mt-2'
                    onChange={(e) => setTopics(e.target.value)}
                />
            </div>

            {/* Duration */}
            <div className='mt-5'>
                <h2 className='text-sm font-medium'>Session Duration</h2>
                <Select onValueChange={(value) => setDuration(value)}>
                    <SelectTrigger className="w-full mt-2">
                        <SelectValue placeholder="Select Duration" />
                    </SelectTrigger>
                    <SelectContent>
                        <SelectItem value="5 Minutes">5 minutes (Quick)</SelectItem>
                        <SelectItem value="15 Minutes">15 minutes</SelectItem>
                        <SelectItem value="30 Minutes">30 minutes (Recommended)</SelectItem>
                        <SelectItem value="45 Minutes">45 minutes</SelectItem>
                        <SelectItem value="60 Minutes">1 hour</SelectItem>
                    </SelectContent>
                </Select>
            </div>

            <div className='mt-8'>
                <Button 
                    className='flex items-center gap-2 w-full justify-center py-6 text-lg'
                    onClick={handleStartInterview}
                    disabled={loading}
                >
                    {loading ? (
                        <>
                            <Loader2 className='h-5 w-5 animate-spin'/>
                            Starting Interview...
                        </>
                    ) : (
                        <>
                            <Play className='h-5 w-5'/>
                            Start Interview
                        </>
                    )}
                </Button>
            </div>
        </div>
    )
}

export default FormContainer