"use client"
import React from 'react'
import WelcomeContainer from '../_components/WelcomeContainer'
import { ArrowLeft } from 'lucide-react'
import { useRouter, useSearchParams } from 'next/navigation'
import FormContainer from './_components/FormContainer'

function CreateInterview() {
    const router = useRouter();
    const searchParams = useSearchParams();

    return (
        <div>
            <div className='mt-1'>
                <WelcomeContainer/>
            </div>
            <div className='mt-1 px-10 md:px-24 lg:px-44 xl:px-56'>
                <div className='flex gap-5 items-center'> 
                    <ArrowLeft onClick={() => router.push('/dashboard')} className='cursor-pointer'/>
                    <h2 className='font-bold text-2xl'>Start Practice Interview</h2>
                </div>
                <div className='my-6'>
                    <FormContainer initialCategory={searchParams.get('category')} />
                </div>
            </div>
        </div>
    )
}

export default CreateInterview