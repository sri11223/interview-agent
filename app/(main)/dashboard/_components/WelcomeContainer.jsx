"use client"
import { UserDetailContext } from '@/context/UserDetailContext'
import React, { useContext, useEffect } from 'react'
import Image from 'next/image'
import { GraduationCap } from 'lucide-react'

function WelcomeContainer(){
    const contextValue = useContext(UserDetailContext);
    const user = contextValue?.user;

    const getImageSrc = () => {
        return user?.picture || 
               user?.user_metadata?.picture || 
               user?.avatar_url || 
               user?.user_metadata?.avatar_url ||
               null;
    };

    const imageSource = getImageSrc();
    
    return(
        <div className='bg-white p-5 rounded-xl flex justify-between items-center'>
            <div>
               <h2 className='text-lg font-bold'>
                 Welcome Back, {user?.name || user?.user_metadata?.name || user?.email?.split('@')[0] || 'Student'}!
               </h2>
               <h2 className='text-gray-500 font-medium'>AI-Powered Interview Practice - Get Ready to Ace It!</h2>
            </div>
            {imageSource ? (
                <div className="mt-3">
                    <Image 
                        src={imageSource} 
                        alt='userAvatar' 
                        width={50} 
                        height={50}
                        className="rounded-full"
                    />
                </div>
            ) : (
                <div className="mt-3">
                    <div className="w-12 h-12 bg-blue-100 rounded-full flex items-center justify-center">
                        <GraduationCap className="h-6 w-6 text-blue-600" />
                    </div>
                </div>
            )}
        </div>
    )
}

export default WelcomeContainer