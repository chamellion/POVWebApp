# Google OAuth Setup Guide for Google Drive Integration

## Overview
This guide explains how to set up Google OAuth to enable Google Drive export functionality in the church dashboard.

## Prerequisites
- Google Cloud Console account
- Access to create OAuth 2.0 credentials
- Domain verification (for production)

## Step-by-Step Setup

### 1. Create Google Cloud Project
1. Go to [Google Cloud Console](https://console.cloud.google.com/)
2. Create a new project or select an existing one
3. Enable the Google Drive API:
   - Navigate to "APIs & Services" > "Library"
   - Search for "Google Drive API"
   - Click "Enable"

### 2. Configure OAuth Consent Screen
1. Go to "APIs & Services" > "OAuth consent screen"
2. Choose "External" user type
3. Fill in required information:
   - App name: "Church Dashboard"
   - User support email: Your email
   - Developer contact information: Your email
4. Add scopes:
   - `https://www.googleapis.com/auth/drive.file`
   - `https://www.googleapis.com/auth/userinfo.email`
5. Add test users (your email addresses)
6. Save and continue

### 3. Create OAuth 2.0 Credentials
1. Go to "APIs & Services" > "Credentials"
2. Click "Create Credentials" > "OAuth 2.0 Client IDs"
3. Choose "Web application"
4. Configure authorized redirect URIs:
   - Development: `http://localhost:3000/auth/google/callback`
   - Production: `https://yourdomain.com/auth/google/callback`
5. Copy the Client ID and Client Secret

### 4. Configure Environment Variables
Add these to your `.env.local` file:

```bash
# Google OAuth Configuration
NEXT_PUBLIC_GOOGLE_CLIENT_ID=your_client_id_here
GOOGLE_CLIENT_SECRET=your_client_secret_here
NEXT_PUBLIC_GOOGLE_REDIRECT_URI=http://localhost:3000/auth/google/callback
```

For production, update the redirect URI to match your domain.

### 5. Test the Integration
1. Start your development server
2. Navigate to Dashboard > Testimonies
3. Click "Export" > Select "Drive" format
4. Click "Connect Google Drive"
5. Complete the OAuth flow
6. Test uploading a file to Google Drive

## Troubleshooting

### Common Issues

#### "Missing required parameter: client_id"
- Verify `NEXT_PUBLIC_GOOGLE_CLIENT_ID` is set correctly
- Check that the environment variable is loaded
- Restart your development server

#### "Redirect URI mismatch"
- Ensure the redirect URI in Google Cloud Console matches exactly
- Check for trailing slashes or protocol differences
- Verify both development and production URIs are added

#### "OAuth consent screen not configured"
- Complete the OAuth consent screen setup
- Add your email as a test user
- Wait for changes to propagate (may take a few minutes)

#### "Insufficient permissions"
- Verify the correct scopes are added to OAuth consent screen
- Check that the Google Drive API is enabled
- Ensure the API is enabled for your project

### Debug Steps
1. Check browser console for error messages
2. Verify environment variables are loaded
3. Check Google Cloud Console for API quotas
4. Test with a simple OAuth flow first

## Security Considerations

### Environment Variables
- Never commit `.env.local` to version control
- Use different credentials for development and production
- Rotate credentials regularly

### OAuth Scopes
- Only request necessary scopes
- `drive.file` scope limits access to files created by the app
- `userinfo.email` scope provides basic user information

### Production Deployment
- Use HTTPS in production
- Verify your domain in Google Cloud Console
- Set appropriate OAuth consent screen restrictions

## Production Checklist
- [ ] Domain verified in Google Cloud Console
- [ ] Production redirect URI configured
- [ ] OAuth consent screen published
- [ ] Environment variables set in production
- [ ] HTTPS enabled
- [ ] Test OAuth flow in production environment

## Support
If you encounter issues:
1. Check the troubleshooting section above
2. Review Google Cloud Console logs
3. Verify API quotas and billing
4. Check Google's OAuth documentation
5. Contact Google Cloud support if needed

## Additional Resources
- [Google OAuth 2.0 Documentation](https://developers.google.com/identity/protocols/oauth2)
- [Google Drive API Documentation](https://developers.google.com/drive/api)
- [Google Cloud Console](https://console.cloud.google.com/)
- [OAuth Consent Screen Guide](https://support.google.com/cloud/answer/6158849)
