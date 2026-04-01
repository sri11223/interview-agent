"use client"
import React, { useEffect, useState } from 'react'
import Link from 'next/link'
import { useRouter, useSearchParams } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { supabase } from '@/services/supabaseClient'
import { GraduationCap, ArrowRight, Mic, Brain, Code2, Star, Sparkles, Loader2, Mail } from 'lucide-react'
import { toast } from 'sonner'

function AuthPage() {
    const router = useRouter()
    const searchParams = useSearchParams()
    const mode = searchParams.get('mode') // 'signin' or 'signup' (default)

    const isSignIn = mode === 'signin'

    const [email, setEmail] = useState('')
    const [password, setPassword] = useState('')
    const [loading, setLoading] = useState(false)

    useEffect(() => {
        const checkUser = async () => {
            const { data: { user } } = await supabase.auth.getUser()
            if (user) {
                router.push('/dashboard')
            }
        }
        checkUser()

        const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
            if (event === 'SIGNED_IN' && session) {
                router.push('/dashboard')
            }
        })

        return () => subscription.unsubscribe()
    }, [router])

    const handleEmailAuth = async (e) => {
        e.preventDefault()
        if (!email || !password) {
            toast.error('Please enter both email and password.')
            return
        }
        setLoading(true)
        try {
            if (isSignIn) {
                const { error } = await supabase.auth.signInWithPassword({ email, password })
                if (error) throw error
            } else {
                const { data, error } = await supabase.auth.signUp({
                    email,
                    password,
                    options: {
                        emailRedirectTo: `${window.location.origin}/dashboard`
                    }
                })
                if (error) throw error

                // Supabase returns an empty identities array if the user already exists
                if (data?.user?.identities?.length === 0) {
                    toast.error('This email is already registered. Please log in instead.', {
                        action: {
                            label: 'Log in',
                            onClick: () => router.push('/auth?mode=signin')
                        }
                    })
                    setLoading(false)
                    return
                }

                toast.success('Success! Check your email to confirm your account.')
            }
        } catch (err) {
            if (err.message === 'User already registered' || err.message.includes('already registered')) {
                toast.error('This email is already registered. Please log in instead.', {
                    action: {
                        label: 'Log in',
                        onClick: () => router.push('/auth?mode=signin')
                    }
                })
            } else if (err.message === 'Invalid login credentials') {
                toast.error('Incorrect email or password. Please try again.')
            } else {
                toast.error(err.message || 'An error occurred during authentication.')
            }
        } finally {
            setLoading(false)
        }
    }

    const signInWithGoogle = async () => {
        try {
            const { error } = await supabase.auth.signInWithOAuth({
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
                console.error('Google Auth Error:', error.message)
            }
        } catch (err) {
            console.error('Unexpected error during Google sign in:', err)
        }
    }

    return (
        <div className="min-h-screen bg-slate-50 selection:bg-blue-200 selection:text-blue-900 font-sans overflow-hidden flex flex-col">
            {/* Decorative Background Elements */}
            <div className="fixed top-0 left-0 w-full h-full overflow-hidden -z-10 pointer-events-none">
                <div className="absolute -top-[20%] -left-[10%] w-[50%] h-[50%] rounded-full bg-blue-400/20 blur-[120px]" />
                <div className="absolute top-[20%] -right-[10%] w-[40%] h-[40%] rounded-full bg-purple-400/20 blur-[120px]" />
                <div className="absolute -bottom-[10%] left-[20%] w-[60%] h-[40%] rounded-full bg-indigo-400/10 blur-[100px]" />
            </div>

            {/* Navbar - Glassmorphic */}
            <nav className="w-full top-0 z-50 py-4 px-6 md:px-12 backdrop-blur-xl bg-white/70 border-b border-gray-200/50">
                <div className="max-w-7xl mx-auto flex items-center justify-between">
                    <Link href="/" className="flex items-center gap-3">
                        <div className="bg-gradient-to-tr from-blue-600 to-indigo-600 p-2.5 rounded-xl shadow-md shadow-blue-200">
                            <GraduationCap className="h-6 w-6 text-white" />
                        </div>
                        <span className="text-2xl font-extrabold bg-clip-text text-transparent bg-gradient-to-r from-gray-900 to-gray-700 tracking-tight">PrepAI</span>
                    </Link>
                    <div className="flex items-center gap-4">
                        {isSignIn ? (
                            <Link href="/auth?mode=signup">
                                <Button className="rounded-xl px-6 bg-gray-900 hover:bg-gray-800 text-white font-bold transition-all shadow-md active:scale-95">
                                    Start Free
                                </Button>
                            </Link>
                        ) : (
                            <Link href="/auth?mode=signin" className="text-sm font-bold text-gray-600 hover:text-gray-900 transition-colors">
                                Log in
                            </Link>
                        )}
                    </div>
                </div>
            </nav>

            <div className="flex-1 flex flex-col md:flex-row items-center justify-center p-6 md:p-12 gap-12 lg:gap-24 max-w-7xl mx-auto w-full">

                {/* Left: Branding & Info */}
                <div className="hidden md:flex flex-col gap-8 w-full max-w-lg animate-fade-in-up">
                    <div className="inline-flex max-w-fit items-center gap-2.5 bg-white border border-blue-100 text-blue-700 px-5 py-2.5 rounded-full text-sm font-bold shadow-sm shadow-blue-50/50">
                        <Sparkles className="h-4 w-4 text-blue-500" /> Unlock Your Potential
                    </div>
                    
                    {isSignIn ? (
                        <>
                            <h1 className="text-5xl lg:text-6xl font-extrabold text-gray-900 leading-[1.1] tracking-tight">
                                Welcome back to <br />
                                <span className="text-transparent bg-clip-text bg-gradient-to-r from-blue-600 via-indigo-600 to-purple-600">
                                    PrepAI
                                </span>
                            </h1>
                            <p className="text-xl text-gray-600 font-medium max-w-md leading-relaxed">
                                Pick up right where you left off. Continue your interview practice and track your progress.
                            </p>
                        </>
                    ) : (
                        <>
                            <h1 className="text-5xl lg:text-6xl font-extrabold text-gray-900 leading-[1.1] tracking-tight">
                                Master your next <br />
                                <span className="text-transparent bg-clip-text bg-gradient-to-r from-blue-600 via-indigo-600 to-purple-600">
                                    Tech Interview
                                </span>
                            </h1>
                            <p className="text-xl text-gray-600 font-medium max-w-md leading-relaxed">
                                Create your free account and start practicing with an intelligent voice AI.
                            </p>
                        </>
                    )}

                    <div className="grid grid-cols-2 gap-4 mt-4">
                        {[
                            { icon: Mic, label: 'Voice AI', color: 'bg-blue-50', text: 'text-blue-700', border: 'border-blue-200' },
                            { icon: Brain, label: 'Algorithms', color: 'bg-green-50', text: 'text-green-700', border: 'border-green-200' },
                            { icon: Code2, label: 'System Design', color: 'bg-purple-50', text: 'text-purple-700', border: 'border-purple-200' },
                            { icon: Star, label: 'Live Feedback', color: 'bg-orange-50', text: 'text-orange-700', border: 'border-orange-200' },
                        ].map((item) => (
                            <div key={item.label} className={`flex items-center gap-3 bg-white rounded-2xl p-4 border-2 ${item.border} shadow-sm transition-transform hover:-translate-y-1`}>
                                <div className={`w-10 h-10 rounded-xl ${item.color} flex items-center justify-center`}>
                                    <item.icon className={`h-5 w-5 ${item.text}`} />
                                </div>
                                <span className="text-sm font-extrabold text-gray-900">{item.label}</span>
                            </div>
                        ))}
                    </div>
                </div>

                {/* Right: Auth Card */}
                <div className="w-full max-w-[440px]">
                    <div className="relative">
                        <div className="absolute -inset-1 bg-gradient-to-r from-blue-600 to-indigo-600 rounded-[2.5rem] blur opacity-20" />
                        <div className="relative bg-white border border-gray-100 rounded-[2rem] shadow-2xl p-10 lg:p-12">
                            
                            {/* Mobile logo */}
                            <div className="flex items-center justify-center gap-3 mb-8 md:hidden">
                                <div className="bg-gradient-to-tr from-blue-600 to-indigo-600 p-2.5 rounded-xl shadow-md shadow-blue-200">
                                    <GraduationCap className="h-6 w-6 text-white" />
                                </div>
                                <span className="text-2xl font-extrabold bg-clip-text text-transparent bg-gradient-to-r from-gray-900 to-gray-700">PrepAI</span>
                            </div>

                            <div className="text-center mb-10">
                                <h2 className="text-3xl font-extrabold text-gray-900 tracking-tight mb-3">
                                    {isSignIn ? 'Sign in' : 'Create an account'}
                                </h2>
                                <p className="text-gray-500 font-medium">
                                    {isSignIn ? 'Welcome back! Please enter your details.' : 'Start your prep journey in seconds.'}
                                </p>
                            </div>

                            <div className="space-y-6">
                                <form onSubmit={handleEmailAuth} className="space-y-4">
                                    <div className="space-y-3">
                                        <Input 
                                            type="email" 
                                            placeholder="Email address" 
                                            value={email}
                                            onChange={(e) => setEmail(e.target.value)}
                                            required
                                            className="h-12 px-4 rounded-xl border-2 border-gray-200 focus-visible:ring-0 focus-visible:border-blue-500 bg-gray-50/50 focus:bg-white transition-all text-base"
                                        />
                                        <Input 
                                            type="password" 
                                            placeholder="Password" 
                                            value={password}
                                            onChange={(e) => setPassword(e.target.value)}
                                            required
                                            className="h-12 px-4 rounded-xl border-2 border-gray-200 focus-visible:ring-0 focus-visible:border-blue-500 bg-gray-50/50 focus:bg-white transition-all text-base"
                                        />
                                    </div>
                                    <Button 
                                        type="submit" 
                                        className="w-full h-12 rounded-xl text-base font-bold bg-blue-600 hover:bg-blue-700 text-white shadow-md transition-all active:scale-95 flex items-center justify-center gap-2"
                                        disabled={loading}
                                    >
                                        {loading ? <Loader2 className="h-5 w-5 animate-spin" /> : <Mail className="h-5 w-5" />}
                                        {isSignIn ? 'Sign in with Email' : 'Sign up with Email'}
                                    </Button>
                                </form>

                                {/* Divider */}
                                <div className="relative my-8">
                                    <div className="absolute inset-0 flex items-center">
                                        <div className="w-full border-t-2 border-gray-100" />
                                    </div>
                                    <div className="relative flex justify-center text-sm">
                                        <span className="bg-white px-4 font-bold text-gray-400 uppercase tracking-widest">
                                            or
                                        </span>
                                    </div>
                                </div>

                                {/* Google Auth Button */}
                                <Button
                                    onClick={signInWithGoogle}
                                    variant="outline"
                                    type="button"
                                    className="w-full h-14 rounded-xl text-base font-bold border-2 border-gray-200 hover:border-gray-300 hover:bg-gray-50 transition-all gap-4"
                                >
                                    <svg className="w-6 h-6" viewBox="0 0 24 24">
                                        <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92a5.06 5.06 0 0 1-2.2 3.32v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.1z" fill="#4285F4" />
                                        <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853" />
                                        <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05" />
                                        <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335" />
                                    </svg>
                                    Continue with Google
                                </Button>
                            </div>

                            {/* Toggle link */}
                            {isSignIn ? (
                                <Link href="/auth?mode=signup" className="block text-center mt-6">
                                    <span className="text-gray-500 font-medium">New to PrepAI?</span>{' '}
                                    <span className="text-blue-600 font-bold hover:text-blue-700 hover:underline">Sign up for free</span>
                                </Link>
                            ) : (
                                <Link href="/auth?mode=signin" className="block text-center mt-6">
                                    <span className="text-gray-500 font-medium">Already have an account?</span>{' '}
                                    <span className="text-blue-600 font-bold hover:text-blue-700 hover:underline">Log in here</span>
                                </Link>
                            )}

                        </div>
                    </div>
                </div>
            </div>
            
            {/* Footer note */}
            <p className="text-sm font-medium text-gray-400 text-center pb-8">
                By continuing, you agree to PrepAI&apos;s <span className="underline hover:text-gray-600 cursor-pointer">Terms</span> and <span className="underline hover:text-gray-600 cursor-pointer">Privacy Policy</span>.
            </p>
        </div>
    )
}

export default AuthPage;
