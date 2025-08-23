'use client';

import { useEffect, useState } from 'react';
import { useRouter, usePathname } from 'next/navigation';
import { useAuth } from '@/contexts/AuthContext';
import { checkUserProfileExists, getUserProfile } from '@/lib/firestore';

export function useProfileRedirect() {
  const { user, loading: authLoading } = useAuth();
  const router = useRouter();
  const pathname = usePathname();
  const [loading, setLoading] = useState(true);
  const [profileComplete, setProfileComplete] = useState(false);

  useEffect(() => {
    const checkProfile = async () => {
      if (authLoading) return;
      
      if (!user) {
        setLoading(false);
        return;
      }

      try {
        setLoading(true);
        
        // Check if profile exists and is complete
        const profileExists = await checkUserProfileExists(user.uid);
        
        if (!profileExists) {
          setProfileComplete(false);
          // Redirect to profile page if not on it already
          if (pathname !== '/dashboard/profile') {
            router.push('/dashboard/profile');
          }
          return;
        }

        // Profile exists, check if it's complete
        const profile = await getUserProfile(user.uid);
        const isComplete = Boolean(profile && 
          profile.firstName && 
          profile.firstName.trim() !== '' && 
          profile.lastName && 
          profile.lastName.trim() !== '');

        setProfileComplete(isComplete);

        if (!isComplete) {
          // Profile exists but is incomplete, redirect to profile
          if (pathname !== '/dashboard/profile') {
            router.push('/dashboard/profile');
          }
          return;
        }

        // Profile is complete, allow access to dashboard
        // If user is on profile page and profile is complete, redirect to dashboard
        if (pathname === '/dashboard/profile') {
          router.push('/dashboard');
        }

      } catch (error) {
        console.error('Error checking user profile:', error);
        // On error, assume profile is incomplete and redirect
        setProfileComplete(false);
        if (pathname !== '/dashboard/profile') {
          router.push('/dashboard/profile');
        }
      } finally {
        setLoading(false);
      }
    };

    checkProfile();
  }, [user, authLoading, router, pathname]);

  return { loading, profileComplete };
}

// Hook to check if user can access dashboard routes
export function useDashboardAccess() {
  const { user, loading: authLoading } = useAuth();
  const router = useRouter();
  const pathname = usePathname();
  const [canAccess, setCanAccess] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const checkAccess = async () => {
      if (authLoading) return;
      
      if (!user) {
        setCanAccess(false);
        setLoading(false);
        return;
      }

      try {
        setLoading(true);
        
        // Check if profile exists and is complete
        const profileExists = await checkUserProfileExists(user.uid);
        
        if (!profileExists) {
          setCanAccess(false);
          if (pathname !== '/dashboard/profile') {
            router.push('/dashboard/profile');
          }
          return;
        }

        // Profile exists, check if it's complete
        const profile = await getUserProfile(user.uid);
        const isComplete = Boolean(profile && 
          profile.firstName && 
          profile.firstName.trim() !== '' && 
          profile.lastName && 
          profile.lastName.trim() !== '');

        setCanAccess(isComplete);

        if (!isComplete) {
          // Profile exists but is incomplete, redirect to profile
          if (pathname !== '/dashboard/profile') {
            router.push('/dashboard/profile');
          }
        }

      } catch (error) {
        console.error('Error checking dashboard access:', error);
        setCanAccess(false);
        if (pathname !== '/dashboard/profile') {
          router.push('/dashboard/profile');
        }
      } finally {
        setLoading(false);
      }
    };

    checkAccess();
  }, [user, authLoading, router, pathname]);

  return { canAccess, loading };
}
