import { useEffect, useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router';
import { supabase } from '../api/supabase';

export default function AuthCallbackPage() {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const [status, setStatus] = useState('verifying'); // 'verifying' | 'success' | 'error'
  const [errorMsg, setErrorMsg] = useState('');

  useEffect(() => {
    if (window.location.hash.includes('access_token')) {
      // Implicit flow — SDK auto-processes hash, wait for SIGNED_IN event
      const { data: { subscription } } = supabase.auth.onAuthStateChange((_, session) => {
        if (session) {
          subscription.unsubscribe();
          clearTimeout(timer);
          setStatus('success');
          setTimeout(() => navigate('/'), 2000);
        }
      });
      const timer = setTimeout(() => {
        subscription.unsubscribe();
        setStatus('error');
        setErrorMsg('Email verification timed out. Please try signing in.');
      }, 10_000);
      return () => { subscription.unsubscribe(); clearTimeout(timer); };
    }

    // PKCE flow fallback
    const code = searchParams.get('code');
    if (!code) {
      setStatus('error');
      setErrorMsg('No verification code found in the URL.');
      return;
    }

    supabase.auth.exchangeCodeForSession(code).then(({ error }) => {
      if (error) {
        setStatus('error');
        setErrorMsg(error.message);
      } else {
        setStatus('success');
        setTimeout(() => navigate('/'), 2000);
      }
    });
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  return (
    <div className="flex flex-col items-center justify-center min-h-[40vh] text-center px-4">
      {status === 'verifying' && (
        <p className="text-gray-500 text-sm">Verifying your email…</p>
      )}
      {status === 'success' && (
        <div className="space-y-2">
          <p className="text-lg font-semibold text-green-700">Email verified!</p>
          <p className="text-sm text-gray-500">Redirecting you to the home page…</p>
        </div>
      )}
      {status === 'error' && (
        <div className="space-y-3">
          <p className="text-lg font-semibold text-red-600">Verification failed</p>
          <p className="text-sm text-gray-500">{errorMsg}</p>
          <button
            onClick={() => navigate('/')}
            className="text-sm underline text-[#E21833]"
          >
            Go to home page
          </button>
        </div>
      )}
    </div>
  );
}
