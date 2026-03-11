import React, { useState, useEffect } from 'react'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { Button } from '@/components/ui/button'
import { ArrowRight, Monitor, Brain, Code2, User2 } from 'lucide-react'
import { PracticeCategories, PracticeLanguages, DifficultyLevels } from '@/services/Constants'

const categoryDescriptions = {
    'System Design': 'Practice system design interview questions covering scalability, microservices, databases, caching, load balancing, and distributed system concepts.',
    'DSA': 'Practice Data Structures & Algorithms questions including arrays, linked lists, trees, graphs, dynamic programming, sorting, and searching.',
    'Development': 'Practice web/app development questions covering frontend, backend, APIs, databases, deployment, and full-stack engineering concepts.',
    'Behavioral': 'Practice behavioral and HR interview questions about teamwork, leadership, conflict resolution, and professional growth.',
}

function FormContainer({onHandleInputChange, GoToNext, initialCategory}) {
    const [selectedCategory, setSelectedCategory] = useState(initialCategory || '');
    const [selectedLanguage, setSelectedLanguage] = useState('');
    const [selectedDifficulty, setSelectedDifficulty] = useState('');
    const [interviewType, setInterviewType] = useState([]);

    // Auto-fill when category is selected
    useEffect(() => {
        if (selectedCategory) {
            onHandleInputChange('jobPosition', selectedCategory);
            const desc = categoryDescriptions[selectedCategory] || '';
            const langStr = selectedLanguage ? ` Focus on ${selectedLanguage} language.` : '';
            const diffStr = selectedDifficulty ? ` Difficulty: ${selectedDifficulty}.` : '';
            onHandleInputChange('jobDescription', desc + langStr + diffStr);
        }
    }, [selectedCategory, selectedLanguage, selectedDifficulty]);

    useEffect(() => {
        if(interviewType.length > 0) {
            onHandleInputChange('type', interviewType)
        }
    }, [interviewType])

    // Auto-set interview type based on category
    useEffect(() => {
        if (selectedCategory === 'System Design') {
            setInterviewType(['Technical', 'Problem Solving']);
        } else if (selectedCategory === 'DSA') {
            setInterviewType(['Technical', 'Problem Solving']);
        } else if (selectedCategory === 'Development') {
            setInterviewType(['Technical']);
        } else if (selectedCategory === 'Behavioral') {
            setInterviewType(['Behavioral']);
        }
    }, [selectedCategory]);

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
                    onChange={(event) => {
                        const base = categoryDescriptions[selectedCategory] || '';
                        const langStr = selectedLanguage ? ` Focus on ${selectedLanguage} language.` : '';
                        const diffStr = selectedDifficulty ? ` Difficulty: ${selectedDifficulty}.` : '';
                        const custom = event.target.value ? ` Additional focus: ${event.target.value}` : '';
                        onHandleInputChange('jobDescription', base + langStr + diffStr + custom);
                    }}
                />
            </div>

            {/* Duration */}
            <div className='mt-5'>
                <h2 className='text-sm font-medium'>Session Duration</h2>
                <Select onValueChange={(value)=>onHandleInputChange('duration',value)}>
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

            <div className='mt-8 flex-justify-end' onClick={()=>GoToNext()}>
                <Button className='flex items-center gap-2 w-full justify-center'>
                    Generate Practice Questions
                    <ArrowRight className='h-4 w-4'/>
                </Button>
            </div>
        </div>
    )
}

export default FormContainer