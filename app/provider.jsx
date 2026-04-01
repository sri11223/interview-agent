"use client"
import { UserDetailContext } from '../context/UserDetailContext';
import { supabase } from '../services/supabaseClient';
import React, { useEffect, useState, useContext } from 'react';
import { useRouter } from 'next/navigation';
import LoadingSpinner from '../components/LoadingSpinner';

function Provider({ children }) {
    const [user, setUser] = useState(null);
    const [loading, setLoading] = useState(true);
    const [session, setSession] = useState(null);
    const router = useRouter();

    useEffect(() => {
        let mounted = true;

        const checkSession = async () => {
            const { data: { session } } = await supabase.auth.getSession();
            if (!mounted) return;
            
            setSession(session);
            if (session?.user) {
                setUser({
                    email: session.user.email,
                    name: session.user.user_metadata?.name || 'User',
                    picture: session.user.user_metadata?.picture
                });
                handleUserSession(session.user);
            }

            const isOauthCallback = typeof window !== 'undefined' && 
                (window.location.hash.includes('access_token=') || window.location.search.includes('code='));
                
            if (!isOauthCallback && !session) {
                setLoading(false);
            }
            if (session) {
                setLoading(false);
            }
            
            if (isOauthCallback && !session) {
                // Fallback timeout in case `SIGNED_IN` event never fires
                setTimeout(() => {
                    if (mounted) setLoading(false);
                }, 5000);
            }
        };

        checkSession();

        const { data: { subscription } } = supabase.auth.onAuthStateChange(async (event, session) => {
            console.log('Auth state change:', event, session?.user?.email);
            if (!mounted) return;

            setSession(session);
            
            if (event === 'SIGNED_IN' && session) {
                setUser({
                    email: session.user.email,
                    name: session.user.user_metadata?.name || 'User',
                    picture: session.user.user_metadata?.picture
                });
                handleUserSession(session.user);
                setLoading(false);
            } else if (event === 'SIGNED_OUT') {
                setUser(null);
                setSession(null);
                setLoading(false);
            }
        });

        return () => {
            mounted = false;
            subscription.unsubscribe();
        };
    }, []);

    const handleUserSession = async (authUser) => {
        try {
            const { data: users, error: selectError } = await supabase
                .from('Users')
                .select("*")
                .eq('email', authUser.email)
                .limit(1);

            if (selectError) {
                console.warn('Database select error (non-critical):', selectError);
                return;
            }

            if (users?.length === 0) {
                const { data, error: insertError } = await supabase.from("Users")
                    .insert([
                        {
                            name: authUser.user_metadata?.name,
                            email: authUser.email, 
                            picture: authUser.user_metadata?.picture
                        }
                    ])
                    .select();
                
                if (!insertError && data) {
                    setUser(data[0]);
                }
            } else {
                setUser(users[0]);
            }
        } catch (error) {
            console.warn('User session handling failed:', error);
        }
    };

    if (loading) {
        return <LoadingSpinner message="Initializing your session..." fullScreen={true} />;
    }

    return (
        <UserDetailContext.Provider value={{ 
            user, 
            setUser, 
            session, 
            loading,
            isAuthenticated: !!session
        }}>
            {children}
        </UserDetailContext.Provider>
    );
}

export default Provider;

export const useUser = () => {
    const context = useContext(UserDetailContext);
    if (!context) {
        throw new Error('useUser must be used within a Provider');
    }
    return context;
}
