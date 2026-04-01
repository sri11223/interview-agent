"use client"
import { useUser } from '@/app/provider';
import { useRouter } from 'next/navigation';
import { useEffect } from 'react';

export default function AuthGuard({ children }) {
    const { isAuthenticated, loading } = useUser();
    const router = useRouter();

    useEffect(() => {
        if (!loading && !isAuthenticated) {
            console.log('AuthGuard: Not authenticated, redirecting to auth page. isAuthenticated:', isAuthenticated, 'loading:', loading);
            router.push('/auth');
        }
    }, [isAuthenticated, loading, router]);

    // Show loading while checking authentication
    if (loading) {
        return (
            <div className="flex items-center justify-center h-screen">
                <div className="text-lg">Checking authentication...</div>
            </div>
        );
    }

    // Show nothing if not authenticated (will redirect)
    if (!isAuthenticated) {
        return (
            <div className="flex items-center justify-center h-screen">
                <div className="text-lg">Redirecting to login...</div>
            </div>
        );
    }

    // Show children if authenticated
    return children;
}