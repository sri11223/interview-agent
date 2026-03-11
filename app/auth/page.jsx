"use client"
import Image from 'next/image'
import React, { useEffect, useState } from 'react'
import { Button } from '@/components/ui/button'
import { supabase } from '@/services/supabaseClient'
import { useRouter } from 'next/navigation'

function Login() {
    const router = useRouter()
    const [debugInfo, setDebugInfo] = useState('')

    useEffect(() => {
        // Debug Supabase connection
        const checkSupabaseConnection = async () => {
            try {
                const { data, error } = await supabase.auth.getSession()
                setDebugInfo(`Supabase connected: ${!error}`)
                if (error) {
                    console.error('Supabase connection error:', error)
                    setDebugInfo(`Supabase error: ${error.message}`)
                }
            } catch (err) {
                console.error('Supabase check failed:', err)
                setDebugInfo(`Connection failed: ${err.message}`)
            }
        }
        
        checkSupabaseConnection()

        // Check if user is already logged in
        const checkUser = async () => {
            const { data: { user } } = await supabase.auth.getUser()
            if (user) {
                router.push('/dashboard')
            }
        }
        checkUser()

        // Listen for auth changes
        const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
            console.log('Auth state change:', event, session)
            if (event === 'SIGNED_IN' && session) {
                router.push('/dashboard')
            }
        })

        return () => subscription.unsubscribe()
    }, [router])

    const signInWithGoogle = async () => {
        try {
            console.log('Attempting Google sign in...');
            const { data, error } = await supabase.auth.signInWithOAuth({
                provider: 'google',
                options: {
                    redirectTo: `${window.location.origin}/dashboard`,
                    queryParams: {
                        access_type: 'offline',
                        prompt: 'consent',
                    }
                }
            })

            if (error) {
                console.error('Google Auth Error:', error.message);
                alert(`Authentication Error: ${error.message}`);
            } else {
                console.log('Google Auth Success:', data);
            }
        } catch (err) {
            console.error('Unexpected error during Google sign in:', err);
            alert(`Unexpected error: ${err.message}`);
        }
    }



    return (
        <div className="flex items-center justify-center h-screen bg-[#f9f9f9]">
            <div className="flex flex-col items-center border rounded-2xl p-6 w-[350px] shadow-md bg-white">
                
                {/* Logo */}
                <Image
                    src={'/logo1.png'}
                    alt='logo1'
                    width={140}
                    height={40}
                    className="mb-4"
                />

                {/* Illustration */}
                <div className="flex items-center flex-col">
                    <Image
                        src={'/login.jpg'}
                        alt='Login'
                        width={280}
                        height={180}
                        className="rounded-xl"
                    />

                    <h2 className="text-xl font-bold text-center mt-4">
                        Welcome to PrepAI
                    </h2>
                    <p className="text-gray-500 text-center text-sm">
                        Sign in to start practicing interviews
                    </p>

                    <Button className="mt-6 w-full text-sm h-10"
                    onClick={signInWithGoogle}>
                        Login with Google
                    </Button>
                    
                    {/* Debug Info */}
                    {debugInfo && (
                        <div className="mt-4 p-2 bg-gray-100 rounded text-xs text-gray-600">
                            Debug: {debugInfo}
                        </div>
                    )}
                </div>
            </div>
        </div>
    )
}

export default Login;
