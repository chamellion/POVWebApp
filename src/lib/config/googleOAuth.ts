// Google OAuth Configuration for Google Drive Integration
export const GOOGLE_OAUTH_CONFIG = {
  clientId: process.env.NEXT_PUBLIC_GOOGLE_CLIENT_ID || '',
  clientSecret: process.env.GOOGLE_CLIENT_SECRET || '',
  redirectUri: process.env.NEXT_PUBLIC_GOOGLE_REDIRECT_URI || 'http://localhost:3000/auth/google/callback',
  scopes: [
    'https://www.googleapis.com/auth/drive.file',
    'https://www.googleapis.com/auth/userinfo.email'
  ],
  authUrl: 'https://accounts.google.com/o/oauth2/v2/auth',
  tokenUrl: 'https://oauth2.googleapis.com/token'
};

export interface GoogleAuthTokens {
  access_token: string;
  refresh_token?: string;
  expires_in: number;
  token_type: string;
  scope: string;
}

export const initiateGoogleOAuth = (): string => {
  if (!GOOGLE_OAUTH_CONFIG.clientId) {
    throw new Error('Google OAuth client ID is not configured. Please check your environment variables.');
  }

  const params = new URLSearchParams({
    client_id: GOOGLE_OAUTH_CONFIG.clientId,
    redirect_uri: GOOGLE_OAUTH_CONFIG.redirectUri,
    response_type: 'code',
    scope: GOOGLE_OAUTH_CONFIG.scopes.join(' '),
    access_type: 'offline',
    prompt: 'consent'
  });

  return `${GOOGLE_OAUTH_CONFIG.authUrl}?${params.toString()}`;
};

export const exchangeCodeForTokens = async (code: string): Promise<GoogleAuthTokens> => {
  if (!GOOGLE_OAUTH_CONFIG.clientId || !GOOGLE_OAUTH_CONFIG.clientSecret) {
    throw new Error('Google OAuth credentials are not configured. Please check your environment variables.');
  }

  const response = await fetch(GOOGLE_OAUTH_CONFIG.tokenUrl, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/x-www-form-urlencoded',
    },
    body: new URLSearchParams({
      client_id: GOOGLE_OAUTH_CONFIG.clientId,
      client_secret: GOOGLE_OAUTH_CONFIG.clientSecret,
      code,
      grant_type: 'authorization_code',
      redirect_uri: GOOGLE_OAUTH_CONFIG.redirectUri,
    }),
  });

  if (!response.ok) {
    const errorData = await response.json().catch(() => ({}));
    const errorMessage = errorData.error_description || errorData.error || response.statusText;
    throw new Error(`Failed to exchange code for tokens: ${errorMessage}`);
  }

  return response.json();
};

export const refreshAccessToken = async (refreshToken: string): Promise<GoogleAuthTokens> => {
  if (!GOOGLE_OAUTH_CONFIG.clientId || !GOOGLE_OAUTH_CONFIG.clientSecret) {
    throw new Error('Google OAuth credentials are not configured. Please check your environment variables.');
  }

  const response = await fetch(GOOGLE_OAUTH_CONFIG.tokenUrl, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/x-www-form-urlencoded',
    },
    body: new URLSearchParams({
      client_id: GOOGLE_OAUTH_CONFIG.clientId,
      client_secret: GOOGLE_OAUTH_CONFIG.clientSecret,
      refresh_token: refreshToken,
      grant_type: 'refresh_token',
    }),
  });

  if (!response.ok) {
    const errorData = await response.json().catch(() => ({}));
    const errorMessage = errorData.error_description || errorData.error || response.statusText;
    throw new Error(`Failed to refresh access token: ${errorMessage}`);
  }

  return response.json();
};

// Validate OAuth configuration
export const validateOAuthConfig = (): { isValid: boolean; errors: string[] } => {
  const errors: string[] = [];
  
  if (!GOOGLE_OAUTH_CONFIG.clientId) {
    errors.push('NEXT_PUBLIC_GOOGLE_CLIENT_ID is not set');
  }
  
  if (!GOOGLE_OAUTH_CONFIG.clientSecret) {
    errors.push('GOOGLE_CLIENT_SECRET is not set');
  }
  
  if (!GOOGLE_OAUTH_CONFIG.redirectUri) {
    errors.push('NEXT_PUBLIC_GOOGLE_REDIRECT_URI is not set');
  }
  
  return {
    isValid: errors.length === 0,
    errors
  };
};
