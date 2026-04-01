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
import { Loader2, Play, Sparkles } from 'lucide-react'
import { PracticeCategories, PracticeLanguages, DifficultyLevels } from '@/services/Constants'
import { supabase } from '@/services/supabaseClient'
import { useUser } from '@/app/provider'
import { useRouter } from 'next/navigation'
import { toast } from 'sonner'

const themeMap = {
    'System Design': {
        bg: 'bg-purple-50',
        lightBg: 'bg-purple-100',
        text: 'text-purple-700',
        border: 'border-purple-200',
        activeBorder: 'border-purple-500',
        activeBg: 'bg-purple-50',
        button: 'bg-purple-600 hover:bg-purple-700 focus:ring-purple-500',
        shadow: 'shadow-purple-100'
    },
    'DSA': {
        bg: 'bg-green-50',
        lightBg: 'bg-green-100',
        text: 'text-green-700',
        border: 'border-green-200',
        activeBorder: 'border-green-500',
        activeBg: 'bg-green-50',
        button: 'bg-green-600 hover:bg-green-700 focus:ring-green-500',
        shadow: 'shadow-green-100'
    },
    'Development': {
        bg: 'bg-blue-50',
        lightBg: 'bg-blue-100',
        text: 'text-blue-700',
        border: 'border-blue-200',
        activeBorder: 'border-blue-500',
        activeBg: 'bg-blue-50',
        button: 'bg-blue-600 hover:bg-blue-700 focus:ring-blue-500',
        shadow: 'shadow-blue-100'
    },
    'Behavioral': {
        bg: 'bg-orange-50',
        lightBg: 'bg-orange-100',
        text: 'text-orange-700',
        border: 'border-orange-200',
        activeBorder: 'border-orange-500',
        activeBg: 'bg-orange-50',
        button: 'bg-orange-600 hover:bg-orange-700 focus:ring-orange-500',
        shadow: 'shadow-orange-100'
    }
}

const systemTypeOptions = [
    'Low-Level Design (LLD)',
    'High-Level Design (HLD)',
    'Distributed Systems',
    'Scalability & Performance',
    'Database Design',
    'API Design'
]

const domainOptions = [
    'Frontend (React, HTML/CSS, JS)',
    'Backend (Node.js, Spring Boot, Django)',
    'Full Stack',
    'Mobile Development',
    'APIs & Microservices'
]

function FormContainer({ selectedCategory }) {
    const router = useRouter()
    const { user } = useUser()
    const [selectedLanguage, setSelectedLanguage] = useState('')
    const [selectedSystemType, setSelectedSystemType] = useState('')
    const [selectedDomain, setSelectedDomain] = useState('')
    const [selectedDifficulty, setSelectedDifficulty] = useState('Intermediate')
    const [duration, setDuration] = useState('')
    const [topics, setTopics] = useState('')
    const [loading, setLoading] = useState(false)

    const theme = themeMap[selectedCategory] || themeMap['Development']
    const CatInfo = PracticeCategories.find(c => c.title === selectedCategory) || PracticeCategories.find(c => c.title === 'Development')
    const Icon = CatInfo.icon

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
            if (selectedLanguage && !['System Design', 'Development'].includes(selectedCategory)) description += ` Programming language: ${selectedLanguage}.`
            if (selectedSystemType && selectedCategory === 'System Design') description += ` System type: ${selectedSystemType}.`
            if (selectedDomain && selectedCategory === 'Development') description += ` Domain: ${selectedDomain}.`
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
        <div className={`p-8 md:p-10 bg-white border-2 ${theme.border} shadow-xl shadow-sm ${theme.shadow} rounded-[2rem]`}>
            
            {/* Minimal Headers */}
            <div className={`mb-10 w-full rounded-3xl p-8 ${theme.lightBg} border-2 ${theme.border} flex flex-col md:flex-row items-center gap-6 relative overflow-hidden`}>
                <div className={`w-20 h-20 rounded-2xl flex items-center justify-center bg-white shadow-sm shrink-0 border ${theme.border}`}>
                    <Icon className={`w-10 h-10 ${theme.text}`} />
                </div>
                <div className='relative z-10'>
                    <div className={`text-sm font-bold uppercase tracking-wider mb-2 ${theme.text}`}>Preparing Session For</div>
                    <h2 className='text-3xl md:text-4xl font-extrabold text-gray-900'>{selectedCategory}</h2>
                    <p className='text-gray-600 font-medium md:text-lg mt-2 max-w-xl'>{CatInfo.description}</p>
                </div>
                <Sparkles className={`w-64 h-64 absolute -right-20 -bottom-20 opacity-[0.04] text-gray-900`} />
            </div>

            <div className='grid grid-cols-1 md:grid-cols-2 gap-10'>
                {/* Left Column: Logic */}
                <div className='space-y-10'>
                    {/* Language / System Type / Domain Selection */}
                    {selectedCategory === 'System Design' ? (
                        <div>
                            <h2 className='text-sm font-extrabold text-gray-700 uppercase tracking-widest mb-4'>System Type</h2>
                            <div className='grid grid-cols-2 gap-3'>
                                {systemTypeOptions.map((type) => (
                                    <div
                                        key={type}
                                        className={`flex items-center justify-center text-center gap-3 px-3 py-4 rounded-xl border-2 cursor-pointer transition-all duration-200 font-bold ${
                                            selectedSystemType === type 
                                                ? `${theme.activeBorder} ${theme.activeBg} ${theme.text} scale-[1.02]` 
                                                : 'border-gray-100 hover:border-gray-300 text-gray-600 bg-gray-50'
                                        }`}
                                        onClick={() => setSelectedSystemType(prev => prev === type ? '' : type)}
                                    >
                                        <span className='text-[13px]'>{type}</span>
                                    </div>
                                ))}
                            </div>
                        </div>
                    ) : selectedCategory === 'Development' ? (
                        <div>
                            <h2 className='text-sm font-extrabold text-gray-700 uppercase tracking-widest mb-4'>Domain</h2>
                            <div className='grid grid-cols-1 gap-3'>
                                {domainOptions.map((domain) => (
                                    <div
                                        key={domain}
                                        className={`flex items-center gap-3 px-5 py-4 rounded-xl border-2 cursor-pointer transition-all duration-200 font-bold ${
                                            selectedDomain === domain 
                                                ? `${theme.activeBorder} ${theme.activeBg} ${theme.text} scale-[1.02]` 
                                                : 'border-gray-100 hover:border-gray-300 text-gray-600 bg-gray-50'
                                        }`}
                                        onClick={() => setSelectedDomain(prev => prev === domain ? '' : domain)}
                                    >
                                        <span className='text-[13px]'>{domain}</span>
                                    </div>
                                ))}
                            </div>
                        </div>
                    ) : selectedCategory !== 'Behavioral' ? (
                        <div>
                            <h2 className='text-sm font-extrabold text-gray-700 uppercase tracking-widest mb-4'>Programming Language</h2>
                            <div className='grid grid-cols-2 gap-3'>
                                {PracticeLanguages.map((lang) => (
                                    <div
                                        key={lang.title}
                                        className={`flex items-center justify-center text-center gap-3 px-5 py-4 rounded-xl border-2 cursor-pointer transition-all duration-200 font-bold ${
                                            selectedLanguage === lang.title 
                                                ? `${theme.activeBorder} ${theme.activeBg} ${theme.text} scale-[1.02]` 
                                                : 'border-gray-100 hover:border-gray-300 text-gray-600 bg-gray-50'
                                        }`}
                                        onClick={() => setSelectedLanguage(prev => prev === lang.title ? '' : lang.title)}
                                    >
                                        <span>{lang.title}</span>
                                    </div>
                                ))}
                            </div>
                        </div>
                    ) : null}

                    {/* Difficulty Selection */}
                    <div>
                        <h2 className='text-sm font-extrabold text-gray-700 uppercase tracking-widest mb-4'>Difficulty Level</h2>
                        <div className='flex flex-col gap-3'>
                            {DifficultyLevels.map((level) => (
                                <div
                                    key={level.title}
                                    className={`px-6 py-4 rounded-xl border-2 cursor-pointer transition-all duration-200 font-bold ${
                                        selectedDifficulty === level.title 
                                            ? `${theme.activeBorder} ${theme.activeBg} ${theme.text} scale-[1.02]` 
                                            : 'border-gray-100 hover:border-gray-300 text-gray-600 bg-gray-50'
                                    }`}
                                    onClick={() => setSelectedDifficulty(level.title)}
                                >
                                    {level.title}
                                </div>
                            ))}
                        </div>
                    </div>
                </div>

                {/* Right Column: Settings */}
                <div className='space-y-10'>
                    {/* Additional topic details */}
                    <div>
                        <h2 className='text-sm font-extrabold text-gray-700 uppercase tracking-widest mb-4'>Specific Topics <span className='text-gray-400 font-medium normal-case'>(optional)</span></h2>
                        <Textarea 
                            placeholder={selectedCategory === 'Behavioral' ? 'e.g. Focus on conflict resolution...' : 'e.g. Focus on React hooks, REST APIs...'} 
                            className='h-[160px] resize-none border-2 border-gray-200 focus-visible:ring-0 focus-visible:border-gray-400 rounded-xl transition-colors bg-gray-50 text-gray-800 font-medium text-base p-4'
                            onChange={(e) => setTopics(e.target.value)}
                        />
                    </div>

                    {/* Duration */}
                    <div>
                        <h2 className='text-sm font-extrabold text-gray-700 uppercase tracking-widest mb-4'>Session Duration <span className='text-red-500'>*</span></h2>
                        <Select onValueChange={(value) => setDuration(value)}>
                            <SelectTrigger className="w-full h-14 border-2 border-gray-200 rounded-xl bg-gray-50 focus:bg-white focus:ring-0 font-bold text-gray-800 text-base">
                                <SelectValue placeholder="Select Duration" />
                            </SelectTrigger>
                            <SelectContent className="rounded-xl border-2 overflow-hidden shadow-xl">
                                <SelectItem value="5 Minutes" className="font-bold py-3 text-base">5 minutes <span className="text-gray-400 font-medium">(Quick Practice)</span></SelectItem>
                                <SelectItem value="15 Minutes" className="font-bold py-3 text-base">15 minutes <span className="text-gray-400 font-medium">(Standard)</span></SelectItem>
                                <SelectItem value="30 Minutes" className="font-bold py-3 text-base">30 minutes <span className="text-gray-400 font-medium">(Deep Dive)</span></SelectItem>
                                <SelectItem value="45 Minutes" className="font-bold py-3 text-base">45 minutes <span className="text-gray-400 font-medium">(Full Mock)</span></SelectItem>
                                <SelectItem value="60 Minutes" className="font-bold py-3 text-base">1 hour <span className="text-gray-400 font-medium">(Exhaustive)</span></SelectItem>
                            </SelectContent>
                        </Select>
                    </div>
                </div>

            </div>

            <div className='mt-12 pt-8 border-t border-gray-100 flex justify-end'>
                <Button 
                    className={`w-full md:w-auto px-10 py-7 flex items-center justify-center gap-3 text-xl font-bold rounded-2xl transition-all duration-300 shadow-xl active:scale-95 text-white ${theme.button}`}
                    onClick={handleStartInterview}
                    disabled={loading}
                >
                    {loading ? (
                        <>
                            <Loader2 className='h-6 w-6 animate-spin'/>
                            Preparing...
                        </>
                    ) : (
                        <>
                            Start {selectedCategory} Session
                            <Play className='h-6 w-6 fill-current'/>
                        </>
                    )}
                </Button>
            </div>
        </div>
    )
}

export default FormContainer