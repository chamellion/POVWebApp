'use client';

import { useState, useEffect } from 'react';
import { useProfileRedirect } from '@/hooks/useProfileRedirect';
import DashboardLayout from '@/components/layout/DashboardLayout';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Save, User, Lock } from 'lucide-react';
import { toast } from 'sonner';
import { 
  User as UserType,
  getUserProfile,
  createUserProfile,
  updateUserProfile
} from '@/lib/firestore';
import { useAuth } from '@/contexts/AuthContext';
import { Timestamp } from 'firebase/firestore';
import { logUpdate } from '@/lib/firebase/logActivity';

export default function ProfilePage() {
  const { loading, profileComplete } = useProfileRedirect();
  const { user, changePassword } = useAuth();
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [isChangingPassword, setIsChangingPassword] = useState(false);
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  
  const [userProfile, setUserProfile] = useState<UserType>({
    firstName: '',
    lastName: '',
    phone: '',
    role: '',
    email: '',
    createdAt: Timestamp.now(),
    updatedAt: Timestamp.now(),
  });

    useEffect(() => {
    const fetchProfile = async () => {
      if (!user?.uid) return;
      
      try {
        setIsLoading(true);
        
        // Always set the email from Firebase Auth
        const email = user.email || '';
        
        const existingProfile = await getUserProfile(user.uid);
        if (existingProfile) {
          // Profile exists, use it but ensure email is from Firebase Auth
          setUserProfile({
            ...existingProfile,
            email,
          });
        } else {
          // Profile doesn't exist yet, set default with user's email
          setUserProfile({
            firstName: '',
            lastName: '',
            phone: '',
            role: '',
            email,
            createdAt: Timestamp.now(),
            updatedAt: Timestamp.now(),
          });
        }
      } catch {
        console.log('Profile does not exist yet, using defaults');
        // Profile doesn't exist yet, set default with user's email
        setUserProfile({
          firstName: '',
          lastName: '',
          phone: '',
          role: '',
          email: user.email || '',
          createdAt: Timestamp.now(),
          updatedAt: Timestamp.now(),
        });
      } finally {
        setIsLoading(false);
      }
    };

    fetchProfile();
  }, [user]);

  const handleSaveProfile = async () => {
    if (!user?.uid) return;
    
    // Validate required fields
    if (!userProfile.firstName.trim() || !userProfile.lastName.trim()) {
      toast.error('First Name and Last Name are required');
      return;
    }
    
    setIsSaving(true);
    try {
      const profileData = {
        firstName: userProfile.firstName.trim(),
        lastName: userProfile.lastName.trim(),
        phone: userProfile.phone?.trim() || '',
        role: userProfile.role?.trim() || '',
        email: userProfile.email,
      };

      // Check if profile exists, create or update accordingly
      const existingProfile = await getUserProfile(user.uid);
      if (existingProfile) {
        await updateUserProfile(user.uid, profileData);
        // Log the update activity
        await logUpdate('users', `${profileData.firstName} ${profileData.lastName}`, user.uid, {
          action: 'profile_update',
          fields: Object.keys(profileData).filter(key => key !== 'email')
        });
      } else {
        await createUserProfile(user.uid, profileData);
        // Log the create activity
        await logUpdate('users', `${profileData.firstName} ${profileData.lastName}`, user.uid, {
          action: 'profile_create'
        });
      }
      
      toast.success('Profile saved successfully');
      
      // Redirect to dashboard after successful profile save
      setTimeout(() => {
        window.location.href = '/dashboard';
      }, 1000);
      
    } catch (error) {
      console.error('Failed to save profile:', error);
      toast.error('Failed to save profile');
    } finally {
      setIsSaving(false);
    }
  };

  const handleChangePassword = async () => {
    if (!user?.uid) return;
    
    if (newPassword !== confirmPassword) {
      toast.error('Passwords do not match');
      return;
    }
    
    if (newPassword.length < 6) {
      toast.error('Password must be at least 6 characters');
      return;
    }
    
    setIsChangingPassword(true);
    try {
      await changePassword(newPassword);
      toast.success('Password changed successfully');
      setNewPassword('');
      setConfirmPassword('');
    } catch (error) {
      console.error('Failed to change password:', error);
      toast.error('Failed to change password');
    } finally {
      setIsChangingPassword(false);
    }
  };

  if (loading || isLoading) {
    return (
      <DashboardLayout>
        <div className="flex items-center justify-center h-64">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
        </div>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">User Profile</h1>
            <p className="text-gray-600 mt-2">
              {profileComplete 
                ? 'Your profile is complete. You can update your information below.'
                : 'Please complete your profile to access the dashboard.'
              }
            </p>
          </div>
        </div>

        {/* User Profile Section */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center space-x-2">
              <User className="h-5 w-5" />
              <span>Personal Information</span>
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="firstName">First Name *</Label>
                <Input
                  id="firstName"
                  placeholder="Enter your first name"
                  value={userProfile.firstName}
                  onChange={(e) => setUserProfile(prev => ({ ...prev, firstName: e.target.value }))}
                  required
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="lastName">Last Name *</Label>
                <Input
                  id="lastName"
                  placeholder="Enter your last name"
                  value={userProfile.lastName}
                  onChange={(e) => setUserProfile(prev => ({ ...prev, lastName: e.target.value }))}
                  required
                />
              </div>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="phone">Phone (Optional)</Label>
                <Input
                  id="phone"
                  type="tel"
                  placeholder="+44 7700 900123"
                  value={userProfile.phone}
                  onChange={(e) => setUserProfile(prev => ({ ...prev, phone: e.target.value }))}
                />
                <p className="text-xs text-gray-500">UK format recommended</p>
              </div>
              <div className="space-y-2">
                <Label htmlFor="role">Role (Optional)</Label>
                <Input
                  id="role"
                  placeholder="e.g., Administrator, Pastor, Staff"
                  value={userProfile.role}
                  onChange={(e) => setUserProfile(prev => ({ ...prev, role: e.target.value }))}
                />
              </div>
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="email">Email</Label>
              <Input
                id="email"
                type="email"
                value={userProfile.email}
                disabled
                className="bg-gray-50"
              />
              <p className="text-xs text-gray-500">Email cannot be changed</p>
            </div>
            
            <div className="flex justify-end">
              <Button onClick={handleSaveProfile} disabled={isSaving}>
                <Save className="h-4 w-4 mr-2" />
                {isSaving ? 'Saving...' : 'Save Profile'}
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* Change Password Section */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center space-x-2">
              <Lock className="h-5 w-5" />
              <span>Change Password</span>
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="newPassword">New Password</Label>
                <Input
                  id="newPassword"
                  type="password"
                  placeholder="Enter new password"
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="confirmPassword">Confirm New Password</Label>
                <Input
                  id="confirmPassword"
                  type="password"
                  placeholder="Confirm new password"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                />
              </div>
            </div>
            
            <div className="flex justify-end">
              <Button onClick={handleChangePassword} disabled={isChangingPassword}>
                <Lock className="h-4 w-4 mr-2" />
                {isChangingPassword ? 'Changing...' : 'Change Password'}
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    </DashboardLayout>
  );
}
