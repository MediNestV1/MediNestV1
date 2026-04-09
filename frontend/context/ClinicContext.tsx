'use client';

import { createContext, useContext, useEffect, useState, ReactNode } from 'react';
import { createClient } from '@/lib/supabase';

interface Doctor {
  id: string;
  name: string;
  qualification?: string;
  specialty?: string;
  contact?: string;
  is_active: boolean;
  display_order: number;
}

interface Clinic {
  id: string;
  name: string;
  name_hindi?: string;
  phone?: string;
  address?: string;
  tagline?: string;
  email: string;
  status: 'pending' | 'active' | 'suspended';
  owner_user_id: string;
  created_at: string;
}

interface ClinicContextType {
  clinic: Clinic | null;
  doctors: Doctor[];
  loading: boolean;
  user: any;
  refresh: () => Promise<void>;
}

const ClinicContext = createContext<ClinicContextType>({
  clinic: null,
  doctors: [],
  loading: true,
  user: null,
  refresh: async () => {},
});

export function ClinicProvider({ children }: { children: ReactNode }) {
  const [clinic, setClinic] = useState<Clinic | null>(null);
  const [doctors, setDoctors] = useState<Doctor[]>([]);
  const [loading, setLoading] = useState(true);
  const [user, setUser] = useState<any>(null);

  const supabase = createClient();

  const refresh = async () => {
    setLoading(true);
    try {
      const { data: { user }, error: userError } = await supabase.auth.getUser();
      
      if (userError) {
        if (userError.name !== 'AuthSessionMissingError') {
          console.error('❌ ClinicContext: Auth error:', userError);
        }
        setUser(null);
        setClinic(null);
        setDoctors([]);
        return;
      }
      
      setUser(user);
      if (!user) {
        setClinic(null);
        setDoctors([]);
        return;
      }

      console.log('👤 ClinicContext: User found, fetching clinic data...', user.id);
      const { data: clinicData, error: clinicError } = await supabase
        .from('clinics')
        .select('*')
        .eq('owner_user_id', user.id)
        .single();

      if (clinicError) {
        if (clinicError.code !== 'PGRST116') {
          console.error('❌ ClinicContext: Clinic fetch error:', clinicError);
        }
        setClinic(null);
      } else {
        console.log('🏥 ClinicContext: Clinic data loaded:', clinicData.name);
        setClinic(clinicData);

        const { data: doctorData, error: docError } = await supabase
          .from('clinic_doctors')
          .select('*')
          .eq('clinic_id', clinicData.id)
          .eq('is_active', true)
          .order('display_order');
        
        if (docError) console.error('❌ ClinicContext: Doctors fetch error:', docError);
        setDoctors(doctorData || []);
      }
    } catch (e: any) {
      console.error('🔥 ClinicContext: Critical error in refresh:', e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    refresh();

    // Listen for auth changes to sync state instantly
    const { data: { subscription } } = supabase.auth.onAuthStateChange((event) => {
      if (event === 'SIGNED_IN' || event === 'SIGNED_OUT' || event === 'USER_UPDATED') {
        refresh();
      }
    });

    return () => {
      subscription.unsubscribe();
    };
  }, []);

  return (
    <ClinicContext.Provider value={{ clinic, doctors, loading, user, refresh }}>
      {children}
    </ClinicContext.Provider>
  );
}

export const useClinic = () => useContext(ClinicContext);
