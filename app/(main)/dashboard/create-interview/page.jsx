"use client"
import React from 'react'
import { ArrowLeft } from 'lucide-react'
import { useRouter, useSearchParams } from 'next/navigation'
import FormContainer from './_components/FormContainer'

function CreateInterview() {
    const router = useRouter()
    const searchParams = useSearchParams()
    const category = searchParams.get('category') || 'Development'

    return (
        <div className="max-w-4xl mx-auto px-4 md:px-8 py-8 pb-20">
            <button 
                onClick={() => router.push('/dashboard')} 
                className='flex items-center gap-2 text-gray-500 hover:text-gray-900 transition-colors mb-6 font-medium'
            >
                <ArrowLeft className='w-4 h-4' />
                Back to Dashboard
            </button>
            
            <FormContainer selectedCategory={category} />
        </div>
    )
}

export default CreateInterview