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
    console.log('🔄 ClinicContext: Refreshing data...');
    try {
      // First check if we have a session to avoid throwing AuthSessionMissingError
      const { data: { session } } = await supabase.auth.getSession();
      
      if (!session) {
        console.log('ℹ️ ClinicContext: No active user session');
        setUser(null);
        setClinic(null);
        setDoctors([]);
        setLoading(false);
        return;
      }

      // We have a session, safe to get the secure user object
      const { data: { user }, error: userError } = await supabase.auth.getUser();
      if (userError) {
        console.error('❌ ClinicContext: Auth error:', userError);
        setUser(null);
        setLoading(false);
        return;
      }
      
      setUser(user);

      console.log('👤 ClinicContext: User found, fetching clinic data...', user.id);
      const { data: clinicData, error: clinicError } = await supabase
        .from('clinics')
        .select('*')
        .eq('owner_user_id', user.id)
        .single();

      if (clinicError) {
        console.error('❌ ClinicContext: Clinic fetch error:', clinicError);
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
    } catch (e) {
      console.error('🔥 ClinicContext: Critical error in refresh:', e);
    } finally {
      setLoading(false);
      console.log('✅ ClinicContext: Refresh operation complete');
    }
  };

  useEffect(() => { refresh(); }, []);

  return (
    <ClinicContext.Provider value={{ clinic, doctors, loading, user, refresh }}>
      {children}
    </ClinicContext.Provider>
  );
}

export const useClinic = () => useContext(ClinicContext);
