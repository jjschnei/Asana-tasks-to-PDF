"use client";

import { Suspense, useEffect } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';

function CallbackContent() {
  const router = useRouter();
  const searchParams = useSearchParams();

  useEffect(() => {
    const code = searchParams.get('code');
    
    if (code) {
      // Exchange the code for a token
      fetch('/api/auth/asana', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ code }),
      })
      .then(response => response.json())
      .then(data => {
        if (data.access_token) {
          // Use window.localStorage to avoid SSR issues
          window.localStorage.setItem('asana_access_token', data.access_token);
          router.push('/');
        } else {
          console.error('No access token received:', data);
          router.push('/?error=no_token');
        }
      })
      .catch(error => {
        console.error('Error in token exchange:', error);
        router.push('/?error=exchange_failed');
      });
    } else {
      console.error('No code received from Asana');
      router.push('/?error=no_code');
    }
  }, [searchParams, router]);

  return (
    <div className="flex items-center justify-center min-h-screen">
      <div className="text-center">
        <h1 className="text-xl font-bold mb-2">Authenticating...</h1>
        <p className="text-gray-600">Please wait while we complete the authentication process.</p>
      </div>
    </div>
  );
}

export default function CallbackPage() {
  return (
    <Suspense fallback={<div>Loading...</div>}>
      <CallbackContent />
    </Suspense>
  );
}