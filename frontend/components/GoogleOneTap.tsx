'use client';

import { useEffect } from 'react';
import Script from 'next/script';
import { createClient } from '@/lib/supabase/client';
import { useRouter } from 'next/navigation';

export default function GoogleOneTap() {
  const supabase = createClient();
  const router = useRouter();

  const handleCredentialResponse = async (response: any) => {
    try {
      console.log('🌐 GoogleOneTap: Credential received');
      const { data, error } = await supabase.auth.signInWithIdToken({
        provider: 'google',
        token: response.credential,
      });

      if (error) throw error;

      if (data?.user) {
        console.log('✅ GoogleOneTap: Login successful');
        // Redirect to portal on success
        router.push('/portal');
      }
    } catch (error) {
      console.error('❌ GoogleOneTap Error:', error);
    }
  };

  useEffect(() => {
    // Initialize Google Identity Services when the script loads
    const initializeGsi = () => {
      if (!window.google) return;

      const clientId = process.env.NEXT_PUBLIC_GOOGLE_CLIENT_ID;
      
      if (!clientId) {
        console.warn('⚠️ GoogleOneTap: NEXT_PUBLIC_GOOGLE_CLIENT_ID is missing from .env');
        return;
      }

      window.google.accounts.id.initialize({
        client_id: clientId,
        callback: handleCredentialResponse,
        auto_select: true, // Automatically select if only one account is logged in
        cancel_on_tap_outside: false,
      });

      window.google.accounts.id.prompt((notification: any) => {
        if (notification.isNotDisplayed()) {
          console.log('ℹ️ GoogleOneTap: Prompt not displayed:', notification.getNotDisplayedReason());
        }
      });
    };

    // If script is already loaded by the time component mounts
    if (window.google) {
      initializeGsi();
    }
  }, []);

  return (
    <>
      <Script
        src="https://accounts.google.com/gsi/client"
        strategy="afterInteractive"
        onLoad={() => {
          // Trigger initialization once script is ready
          if (window.google) {
            const clientId = process.env.NEXT_PUBLIC_GOOGLE_CLIENT_ID;
            window.google.accounts.id.initialize({
              client_id: clientId,
              callback: handleCredentialResponse,
            });
            window.google.accounts.id.prompt();
          }
        }}
      />
    </>
  );
}

// Add global type for google
declare global {
  interface Window {
    google: any;
  }
}
