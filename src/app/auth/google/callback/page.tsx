'use client';

import { useEffect, useState, Suspense } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Loader2, CheckCircle, XCircle } from 'lucide-react';
import { exchangeCodeForTokens } from '@/lib/config/googleOAuth';

function GoogleOAuthCallbackContent() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const [status, setStatus] = useState<'loading' | 'success' | 'error'>('loading');
  const [errorMessage, setErrorMessage] = useState('');

  useEffect(() => {
    const handleCallback = async () => {
      const code = searchParams.get('code');
      const error = searchParams.get('error');

      if (error) {
        setStatus('error');
        setErrorMessage(error);
        return;
      }

      if (!code) {
        setStatus('error');
        setErrorMessage('No authorization code received');
        return;
      }

      try {
        const tokens = await exchangeCodeForTokens(code);
        
        // Store tokens securely (you might want to store these in a secure backend)
        localStorage.setItem('googleDriveTokens', JSON.stringify(tokens));
        
        setStatus('success');
        
        // Close the popup window after a short delay
        setTimeout(() => {
          if (window.opener) {
            window.opener.postMessage({ type: 'GOOGLE_OAUTH_SUCCESS', tokens }, '*');
            window.close();
          } else {
            router.push('/dashboard/testimonies');
          }
        }, 2000);
      } catch (error) {
        console.error('OAuth callback error:', error);
        setStatus('error');
        setErrorMessage(error instanceof Error ? error.message : 'Failed to complete OAuth');
      }
    };

    handleCallback();
  }, [searchParams, router]);

  if (status === 'loading') {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <Card className="w-full max-w-md">
          <CardHeader>
            <CardTitle className="text-center">Connecting to Google Drive</CardTitle>
          </CardHeader>
          <CardContent className="text-center">
            <Loader2 className="h-8 w-8 animate-spin mx-auto mb-4 text-blue-600" />
            <p className="text-gray-600">Please wait while we complete the connection...</p>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (status === 'success') {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <Card className="w-full max-w-md">
          <CardHeader>
            <CardTitle className="text-center text-green-600">Connection Successful!</CardTitle>
          </CardHeader>
          <CardContent className="text-center">
            <CheckCircle className="h-12 w-12 mx-auto mb-4 text-green-600" />
            <p className="text-gray-600 mb-4">
              Your Google Drive account has been connected successfully.
            </p>
            <p className="text-sm text-gray-500">
              This window will close automatically...
            </p>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50">
      <Card className="w-full max-w-md">
        <CardHeader>
          <CardTitle className="text-center text-red-600">Connection Failed</CardTitle>
        </CardHeader>
        <CardContent className="text-center">
          <XCircle className="h-12 w-12 mx-auto mb-4 text-red-600" />
          <p className="text-gray-600 mb-4">
            Failed to connect to Google Drive: {errorMessage}
          </p>
          <Button 
            onClick={() => window.close()}
            className="w-full"
          >
            Close Window
          </Button>
        </CardContent>
      </Card>
    </div>
  );
}

export default function GoogleOAuthCallback() {
  return (
    <Suspense fallback={
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <Card className="w-full max-w-md">
          <CardHeader>
            <CardTitle className="text-center">Loading...</CardTitle>
          </CardHeader>
          <CardContent className="text-center">
            <Loader2 className="h-8 w-8 animate-spin mx-auto mb-4 text-blue-600" />
            <p className="text-gray-600">Please wait...</p>
          </CardContent>
        </Card>
      </div>
    }>
      <GoogleOAuthCallbackContent />
    </Suspense>
  );
}
