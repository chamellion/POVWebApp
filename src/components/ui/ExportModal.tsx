'use client';

import { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Input } from '@/components/ui/input';
import { FileText, FileDown, Upload, Loader2, ExternalLink } from 'lucide-react';
import { toast } from 'sonner';
import { Testimony } from '@/lib/firestore';
import { 
  exportToPDF, 
  exportToWord, 
  uploadToGoogleDrive, 
  downloadFile, 
  generateFileName,
  ExportOptions 
} from '@/lib/utils/exportUtils';
import { logTestimonyExport } from '@/lib/firestore';
import { useAuth } from '@/contexts/AuthContext';
import { initiateGoogleOAuth, validateOAuthConfig } from '@/lib/config/googleOAuth';

interface ExportModalProps {
  isOpen: boolean;
  onClose: () => void;
  testimonies: Testimony[];
  selectedTestimonies: string[];
}

export default function ExportModal({ 
  isOpen, 
  onClose, 
  testimonies, 
  selectedTestimonies 
}: ExportModalProps) {
  const { user } = useAuth();
  const [exportType, setExportType] = useState<'pdf' | 'word' | 'google_drive'>('word');
  const [isExporting, setIsExporting] = useState(false);
  const [isPdfLoading, setIsPdfLoading] = useState(false);
  const [pdfAvailable, setPdfAvailable] = useState(true);
  const [isCheckingPdf, setIsCheckingPdf] = useState(true);
  const [exportOptions, setExportOptions] = useState<ExportOptions>({
    includePhotos: false,
    includeMetadata: true,
    churchName: 'RCCG POV',
    churchLogo: ''
  });
  const [googleDriveToken, setGoogleDriveToken] = useState('');

  // Check PDF availability on mount
  useEffect(() => {
    const checkPdfAvailability = async () => {
      try {
        // Try to import pdfmake to check if it's available
        await import('pdfmake/build/pdfmake');
        setPdfAvailable(true);
      } catch (error) {
        console.warn('PDF export not available:', error);
        setPdfAvailable(false);
        // If PDF is not available, switch to Word
        if (exportType === 'pdf') {
          setExportType('word');
        }
      } finally {
        setIsCheckingPdf(false);
      }
    };

    checkPdfAvailability();
  }, [exportType]);

  // Handle OAuth callback message
  useEffect(() => {
    const handleMessage = (event: MessageEvent) => {
      if (event.data.type === 'GOOGLE_OAUTH_SUCCESS') {
        const { tokens } = event.data;
        setGoogleDriveToken(tokens.access_token);
        toast.success('Google Drive connected successfully!');
      }
    };

    window.addEventListener('message', handleMessage);
    return () => window.removeEventListener('message', handleMessage);
  }, []);

  const testimoniesToExport = selectedTestimonies.length > 0 
    ? testimonies.filter(t => selectedTestimonies.includes(t.id!))
    : testimonies;

  const handleGoogleOAuth = () => {
    try {
      // Validate OAuth configuration first
      const configValidation = validateOAuthConfig();
      if (!configValidation.isValid) {
        toast.error(`Google OAuth not configured: ${configValidation.errors.join(', ')}`);
        return;
      }

      const authUrl = initiateGoogleOAuth();
      window.open(authUrl, '_blank', 'width=600,height=600');
    } catch (error) {
      console.error('Google OAuth error:', error);
      toast.error(`Failed to initiate Google OAuth: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  };

  const handleExport = async () => {
    if (!user) {
      toast.error('User not authenticated');
      return;
    }

    setIsExporting(true);
    try {
      let file: Blob;
      let fileName: string;

      switch (exportType) {
        case 'pdf':
          try {
            setIsPdfLoading(true);
            file = await exportToPDF(testimoniesToExport, exportOptions);
            fileName = generateFileName('testimonies', 'pdf');
            downloadFile(file, fileName);
          } catch (error) {
            console.error('PDF export error:', error);
            const errorMessage = error instanceof Error ? error.message : 'Unknown error';
            toast.error(`PDF export failed: ${errorMessage}. Please try Word export instead.`);
            return;
          } finally {
            setIsPdfLoading(false);
          }
          break;

        case 'word':
          file = await exportToWord(testimoniesToExport, exportOptions);
          fileName = generateFileName('testimonies', 'docx');
          downloadFile(file, fileName);
          break;

        case 'google_drive':
          if (!googleDriveToken) {
            toast.error('Google Drive access token required');
            return;
          }
          file = await exportToWord(testimoniesToExport, exportOptions);
          fileName = generateFileName('testimonies', 'docx');
          const fileId = await uploadToGoogleDrive(file, fileName, googleDriveToken);
          toast.success(`Uploaded to Google Drive! File ID: ${fileId}`);
          break;
      }

      // Log the export (optional - don't block export if logging fails)
      console.log('🔍 About to log export, user state:', {
        uid: user?.uid,
        email: user?.email,
        isAuthenticated: !!user
      });
      
      // Only attempt to log if user is still authenticated
      if (user?.uid && user?.email) {
        try {
          await logTestimonyExport({
            adminId: user.uid,
            adminEmail: user.email,
            exportType,
            testimonyIds: testimoniesToExport.map(t => t.id!)
          });
          console.log('✅ Export logged successfully');
        } catch (loggingError) {
          console.warn('⚠️ Export logging failed (export still successful):', loggingError);
          console.warn('⚠️ Logging error details:', {
            error: loggingError,
            userState: { uid: user?.uid, email: user?.email },
            exportType,
            testimonyCount: testimoniesToExport.length
          });
          // Don't show error to user since export succeeded
        }
      } else {
        console.warn('⚠️ Skipping export logging - user not authenticated:', {
          uid: user?.uid,
          email: user?.email
        });
      }

      toast.success(`Testimonies exported successfully as ${exportType.toUpperCase()}`);
      onClose();
    } catch (error) {
      console.error('Export error:', error);
      toast.error(`Failed to export testimonies: ${error instanceof Error ? error.message : 'Unknown error'}`);
    } finally {
      setIsExporting(false);
    }
  };

  const getExportIcon = () => {
    switch (exportType) {
      case 'pdf':
        return <FileText className="h-5 w-5" />;
      case 'word':
        return <FileDown className="h-5 w-5" />;
      case 'google_drive':
        return <Upload className="h-5 w-5" />;
      default:
        return <FileText className="h-5 w-5" />;
    }
  };

  const getExportButtonText = () => {
    if (isExporting) return 'Exporting...';
    if (exportType === 'pdf' && isPdfLoading) return 'Generating PDF...';
    switch (exportType) {
      case 'pdf':
        return 'Download PDF';
      case 'word':
        return 'Download Word Document';
      case 'google_drive':
        return 'Upload to Google Drive';
      default:
        return 'Export';
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>Export Testimonies</DialogTitle>
        </DialogHeader>

        <div className="space-y-6">
          {/* Export Type Selection */}
          <div className="space-y-3">
            <Label>Export Format</Label>
            <div className="grid grid-cols-3 gap-2">
              {[
                { value: 'pdf' as const, label: 'PDF', icon: FileText, disabled: !pdfAvailable || isCheckingPdf },
                { value: 'word' as const, label: 'Word', icon: FileDown, disabled: false },
                { value: 'google_drive' as const, label: 'Drive', icon: Upload, disabled: false }
              ].map(({ value, label, icon: Icon, disabled }) => (
                <Button
                  key={value}
                  variant={exportType === value ? 'default' : 'outline'}
                  size="sm"
                  onClick={() => {
                    if (value === 'pdf' && !pdfAvailable) {
                      toast.error('PDF export is not available. Please use Word export instead.');
                      return;
                    }
                    setExportType(value);
                  }}
                  disabled={disabled}
                  className="flex flex-col items-center space-y-1 h-auto py-3"
                >
                  <Icon className="h-4 w-4" />
                  <span className="text-xs">
                    {label}
                    {value === 'pdf' && isCheckingPdf && (
                      <span className="inline-flex items-center ml-1">
                        <Loader2 className="h-3 w-3 animate-spin" />
                      </span>
                    )}
                  </span>
                </Button>
              ))}
            </div>
            <p className="text-xs text-gray-500">
              {isCheckingPdf 
                ? 'Checking PDF export availability...'
                : pdfAvailable 
                  ? 'PDF export is available and ready to use'
                  : 'PDF export is not available. Please use Word export instead.'
              }
            </p>
          </div>

          {/* Export Options */}
          <div className="space-y-4">
            <Label>Export Options</Label>
            
            <div className="flex items-center justify-between">
              <Label htmlFor="include-metadata" className="text-sm">
                Include metadata
              </Label>
              <Switch
                id="include-metadata"
                checked={exportOptions.includeMetadata}
                onCheckedChange={(checked) => 
                  setExportOptions(prev => ({ ...prev, includeMetadata: checked }))
                }
              />
            </div>

            <div className="flex items-center justify-between">
              <Label htmlFor="include-photos" className="text-sm">
                Include photos
              </Label>
              <Switch
                id="include-photos"
                checked={exportOptions.includePhotos}
                onCheckedChange={(checked) => 
                  setExportOptions(prev => ({ ...prev, includePhotos: checked }))
                }
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="church-name" className="text-sm">
                Church Name
              </Label>
              <Input
                id="church-name"
                value={exportOptions.churchName}
                onChange={(e) => 
                  setExportOptions(prev => ({ ...prev, churchName: e.target.value }))
                }
                placeholder="Enter church name"
              />
            </div>
          </div>

          {/* Google Drive Token Input */}
          {exportType === 'google_drive' && (
            <div className="space-y-2">
              <Label htmlFor="drive-token" className="text-sm">
                Google Drive Access
              </Label>
              <div className="space-y-2">
                <Button
                  type="button"
                  variant="outline"
                  onClick={handleGoogleOAuth}
                  className="w-full"
                >
                  <ExternalLink className="h-4 w-4 mr-2" />
                  Connect Google Drive
                </Button>
                <Input
                  id="drive-token"
                  type="password"
                  value={googleDriveToken}
                  onChange={(e) => setGoogleDriveToken(e.target.value)}
                  placeholder="Or enter access token manually"
                />
                <p className="text-xs text-gray-500">
                  Connect your Google Drive account or manually enter an access token
                </p>
              </div>
            </div>
          )}

          {/* Export Summary */}
          <div className="bg-gray-50 p-3 rounded-lg">
            <p className="text-sm text-gray-600">
              Exporting {testimoniesToExport.length} testimonie{testimoniesToExport.length !== 1 ? 's' : ''}
              {selectedTestimonies.length > 0 && (
                <span className="text-blue-600 font-medium">
                  {' '}({selectedTestimonies.length} selected)
                </span>
              )}
            </p>
            {exportType === 'pdf' && !pdfAvailable && (
              <p className="text-xs text-red-600 mt-1">
                ❌ PDF export is not available
              </p>
            )}
          </div>

          {/* Actions */}
          <div className="flex justify-end space-x-2">
            <Button variant="outline" onClick={onClose} disabled={isExporting}>
              Cancel
            </Button>
            <Button 
              onClick={handleExport} 
              disabled={isExporting || isPdfLoading || (exportType === 'google_drive' && !googleDriveToken)}
              className="min-w-[120px]"
            >
              {isExporting || isPdfLoading ? (
                <Loader2 className="h-4 w-4 animate-spin mr-2" />
              ) : (
                getExportIcon()
              )}
              {getExportButtonText()}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
