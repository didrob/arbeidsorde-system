import { useState, useEffect } from 'react';
import { useAuth } from '@/hooks/useAuth';
import { api } from '@/lib/api';
import { useToast } from '@/hooks/use-toast';

export interface UserProfile {
  id: string;
  user_id: string;
  full_name: string | null;
  phone: string | null;
  role: string;
  organization_id: string | null;
  site_id: string | null;
  avatar_url: string | null;
  is_active: boolean;
  created_at: string;
  updated_at: string;
  // Joined data
  organization?: { name: string; id: string } | null;
  site?: { name: string; id: string } | null;
}

export interface UpdateProfileData {
  full_name?: string;
  phone?: string;
  avatar_url?: string;
}

export function useUserProfile() {
  const { user } = useAuth();
  const { toast } = useToast();
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState(true);
  const [updating, setUpdating] = useState(false);

  const fetchProfile = async () => {
    if (!user) {
      setProfile(null);
      setLoading(false);
      return;
    }

    try {
      setLoading(true);
      const response = await api.getCurrentUser();
      
      if (response.success && response.data) {
        setProfile(response.data);
      } else {
        console.error('Failed to fetch profile:', response.error);
        toast({
          variant: 'destructive',
          title: 'Feil ved lasting av profil',
          description: response.error?.message || 'Kunne ikke laste profildata'
        });
      }
    } catch (error) {
      console.error('Error fetching profile:', error);
      toast({
        variant: 'destructive',
        title: 'Feil ved lasting av profil',
        description: 'En uventet feil oppstod'
      });
    } finally {
      setLoading(false);
    }
  };

  const updateProfile = async (data: UpdateProfileData) => {
    if (!user || !profile) return;

    try {
      setUpdating(true);
      const response = await api.updateProfile(data);
      
      if (response.success && response.data) {
        setProfile(response.data);
        toast({
          title: 'Profil oppdatert',
          description: 'Endringene er lagret'
        });
        return { success: true };
      } else {
        toast({
          variant: 'destructive',
          title: 'Feil ved oppdatering',
          description: response.error?.message || 'Kunne ikke oppdatere profil'
        });
        return { success: false, error: response.error };
      }
    } catch (error) {
      console.error('Error updating profile:', error);
      toast({
        variant: 'destructive',
        title: 'Feil ved oppdatering',
        description: 'En uventet feil oppstod'
      });
      return { success: false, error };
    } finally {
      setUpdating(false);
    }
  };

  const uploadAvatar = async (file: File) => {
    if (!user) return { success: false };

    try {
      setUpdating(true);
      const response = await api.uploadAvatar(file);
      
      if (response.success && response.data) {
        setProfile(prev => prev ? { ...prev, avatar_url: response.data.avatar_url } : null);
        toast({
          title: 'Profilbilde oppdatert',
          description: 'Nytt profilbilde er lastet opp'
        });
        return { success: true, avatar_url: response.data.avatar_url };
      } else {
        toast({
          variant: 'destructive',
          title: 'Feil ved opplasting',
          description: response.error?.message || 'Kunne ikke laste opp profilbilde'
        });
        return { success: false, error: response.error };
      }
    } catch (error) {
      console.error('Error uploading avatar:', error);
      toast({
        variant: 'destructive',
        title: 'Feil ved opplasting',
        description: 'En uventet feil oppstod'
      });
      return { success: false, error };
    } finally {
      setUpdating(false);
    }
  };

  useEffect(() => {
    fetchProfile();
  }, [user]);

  return {
    profile,
    loading,
    updating,
    updateProfile,
    uploadAvatar,
    refetch: fetchProfile
  };
}