"use client"
import { UserDetailContext } from '@/context/UserDetailContext'
import React, { useContext } from 'react'
import Image from 'next/image'
import { Sparkles, Trophy } from 'lucide-react'

function WelcomeContainer(){
    const contextValue = useContext(UserDetailContext);
    const user = contextValue?.user;

    const firstName = user?.name?.split(' ')[0] || user?.user_metadata?.name?.split(' ')[0] || user?.email?.split('@')[0] || 'there';
    
    return(
        <div className='relative overflow-hidden bg-gradient-to-r from-blue-600 via-indigo-600 to-violet-600 p-8 rounded-2xl shadow-lg border border-blue-500/30 text-white'>
            <div className="absolute top-0 right-0 -mt-10 -mr-10 opacity-10">
                <Trophy className="w-56 h-56" />
            </div>
            
            <div className='relative z-10 flex flex-col gap-2 max-w-2xl'>
               <div className="flex items-center gap-2 mb-1 text-blue-100 font-semibold tracking-wide uppercase text-sm">
                 <Sparkles className="w-4 h-4 text-yellow-300" /> Let's get to work
               </div>
               <h2 className='text-3xl font-extrabold tracking-tight'>
                 Welcome back, {firstName}!
               </h2>
               <p className='text-blue-100/90 text-lg font-medium leading-relaxed mt-1'>
                 You're doing great. Pick a category from your Practice Hub and get one step closer to landing your dream role!
               </p>
            </div>
        </div>
    )
}

export default WelcomeContainer