import { Document, Packer, Paragraph, TextRun, AlignmentType, HeadingLevel } from 'docx';
import { format } from 'date-fns';
import { Testimony, PrayerRequest } from '../firestore';

// Dynamic import for pdfmake to avoid SSR issues
// eslint-disable-next-line @typescript-eslint/no-explicit-any
let pdfMake: any = null;

// Initialize pdfmake
const initializePdfMake = async () => {
  if (!pdfMake) {
    try {
      console.log('Initializing pdfmake...');
      
      // Import pdfmake
      const pdfMakeModule = await import('pdfmake/build/pdfmake');
      pdfMake = pdfMakeModule.default || pdfMakeModule;
      console.log('pdfmake imported successfully:', !!pdfMake);
      
      // Import and set up fonts
      const pdfFontsModule = await import('pdfmake/build/vfs_fonts');
      const pdfFonts = pdfFontsModule.default || pdfFontsModule;
      console.log('pdfFonts imported successfully:', !!pdfFonts);
      
      // Set up the virtual file system for fonts
      if (pdfMake && pdfFonts) {
        try {
          // For pdfmake 0.2.20, the fonts are directly accessible
          if (pdfFonts.vfs) {
            pdfMake.vfs = pdfFonts.vfs;
            console.log('Fonts loaded successfully, vfs keys:', Object.keys(pdfMake.vfs).length);
            
            // Verify that we have the basic fonts we need
            const fontKeys = Object.keys(pdfMake.vfs);
            if (fontKeys.length === 0) {
              console.warn('No fonts loaded, PDF may have limited styling');
            } else {
              console.log('Available fonts:', fontKeys.slice(0, 5)); // Show first 5 fonts
            }
          } else {
            // Fallback: create a basic vfs with minimal fonts
            pdfMake.vfs = {};
            console.log('Using fallback vfs (no fonts)');
          }
        } catch (fontError) {
          console.warn('Font loading failed, using fallback:', fontError);
          // Fallback: create a basic vfs
          pdfMake.vfs = {};
        }
      } else {
        throw new Error('PDF libraries failed to load properly');
      }
    } catch (error) {
      console.error('Failed to initialize pdfmake:', error);
      throw new Error('PDF generation is not available. Please try Word export instead.');
    }
  }
  return { pdfMake };
};

export interface ExportOptions {
  includePhotos: boolean;
  includeMetadata: boolean;
  churchName?: string;
  churchLogo?: string;
}

// PDF Export using pdfmake
export const exportToPDF = async (
  testimonies: Testimony[], 
  options: ExportOptions = { includePhotos: false, includeMetadata: true }
): Promise<Blob> => {
  try {
    // Initialize pdfmake
    const { pdfMake: pdfMakeInstance } = await initializePdfMake();
    
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const docDefinition: any = {
      content: [
        // Header
        {
          text: options.churchName || 'Church Testimonies',
          style: 'header',
          alignment: 'center',
          margin: [0, 0, 0, 20]
        },
        
        // Metadata
        ...(options.includeMetadata ? [{
          text: `Generated on ${format(new Date(), 'PPP')}`,
          style: 'metadata',
          alignment: 'right',
          margin: [0, 0, 0, 20]
        }] : []),
        
        // Testimonies Table
        {
          table: {
            headerRows: 1,
            widths: ['*', '*', 'auto'],
            body: [
              // Header row
              [
                { text: 'Member', style: 'tableHeader' },
                { text: 'Testimony', style: 'tableHeader' },
                { text: 'Date', style: 'tableHeader' }
              ],
              // Data rows
              ...testimonies.map(testimony => [
                { 
                  text: testimony.isAnonymous ? 'Anonymous' : testimony.name, 
                  style: 'tableCell' 
                },
                              { 
                text: (testimony.testimony || testimony.story || '').length > 200 
                  ? (testimony.testimony || testimony.story || '').substring(0, 200) + '...' 
                  : (testimony.testimony || testimony.story || ''), 
                style: 'tableCell' 
              },
                { 
                  text: testimony.createdAt 
                    ? format(testimony.createdAt.toDate(), 'MMM dd, yyyy') 
                    : 'N/A', 
                  style: 'tableCell' 
                }
              ])
            ]
          },
          layout: 'lightHorizontalLines'
        }
      ],
      styles: {
        header: {
          fontSize: 24,
          color: '#1f2937'
        },
        metadata: {
          fontSize: 10,
          color: '#6b7280'
        },
        tableHeader: {
          fontSize: 12,
          color: '#ffffff',
          fillColor: '#3b82f6'
        },
        tableCell: {
          fontSize: 10,
          color: '#374151'
        }
      }
      // Removed defaultStyle font to avoid font loading issues
    };

    return new Promise((resolve, reject) => {
      try {
        console.log('Creating PDF document...');
        const pdfDoc = pdfMakeInstance.createPdf(docDefinition);
        console.log('PDF document created, getting blob...');
        
        pdfDoc.getBlob((blob: Blob) => {
          console.log('PDF blob generated successfully, size:', blob.size);
          resolve(blob);
        });
      } catch (error) {
        console.error('Error in PDF generation:', error);
        reject(new Error(`PDF generation failed: ${error instanceof Error ? error.message : 'Unknown error'}`));
      }
    });
  } catch (error) {
    console.error('PDF export error:', error);
    throw new Error(`PDF export failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
  }
};

// PDF Export for Prayer Requests using pdfmake
export const exportPrayerRequestsToPDF = async (
  prayerRequests: PrayerRequest[], 
  options: ExportOptions = { includePhotos: false, includeMetadata: true }
): Promise<Blob> => {
  try {
    // Initialize pdfmake
    const { pdfMake: pdfMakeInstance } = await initializePdfMake();
    
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const docDefinition: any = {
      content: [
        // Header
        {
          text: options.churchName || 'Church Prayer Requests',
          style: 'header',
          alignment: 'center',
          margin: [0, 0, 0, 20]
        },
        
        // Metadata
        ...(options.includeMetadata ? [{
          text: `Generated on ${format(new Date(), 'PPP')}`,
          style: 'metadata',
          alignment: 'right',
          margin: [0, 0, 0, 20]
        }] : []),
        
        // Prayer Requests Table
        {
          table: {
            headerRows: 1,
            widths: ['*', '*', '*', 'auto'],
            body: [
              // Header row
              [
                { text: 'Name', style: 'tableHeader' },
                { text: 'Request', style: 'tableHeader' },
                { text: 'Email', style: 'tableHeader' },
                { text: 'Date', style: 'tableHeader' }
              ],
              // Data rows
              ...prayerRequests.map(request => [
                { 
                  text: request.isAnonymous ? 'Anonymous' : (request.name || 'N/A'), 
                  style: 'tableCell' 
                },
                { 
                  text: request.request.length > 150 
                    ? request.request.substring(0, 150) + '...' 
                    : request.request, 
                  style: 'tableCell' 
                },
                { 
                  text: request.isAnonymous ? 'N/A' : (request.email || 'N/A'), 
                  style: 'tableCell' 
                },
                { 
                  text: request.createdAt 
                    ? format(request.createdAt.toDate(), 'MMM dd, yyyy') 
                    : 'N/A', 
                  style: 'tableCell' 
                }
              ])
            ]
          },
          layout: 'lightHorizontalLines'
        }
      ],
      styles: {
        header: {
          fontSize: 24,
          color: '#1f2937'
        },
        metadata: {
          fontSize: 10,
          color: '#6b7280'
        },
        tableHeader: {
          fontSize: 12,
          color: '#ffffff',
          fillColor: '#3b82f6'
        },
        tableCell: {
          fontSize: 10,
          color: '#374151'
        }
      }
    };

    return new Promise((resolve, reject) => {
      try {
        console.log('Creating PDF document for prayer requests...');
        const pdfDoc = pdfMakeInstance.createPdf(docDefinition);
        console.log('PDF document created, getting blob...');
        
        pdfDoc.getBlob((blob: Blob) => {
          console.log('PDF blob generated successfully, size:', blob.size);
          resolve(blob);
        });
      } catch (error) {
        console.error('Error in PDF generation for prayer requests:', error);
        reject(new Error(`PDF generation failed: ${error instanceof Error ? error.message : 'Unknown error'}`));
      }
    });
  } catch (error) {
    console.error('PDF export error for prayer requests:', error);
    throw new Error(`PDF export failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
  }
};

// Word Document Export using docx
export const exportToWord = async (
  testimonies: Testimony[], 
  options: ExportOptions = { includePhotos: false, includeMetadata: true }
): Promise<Blob> => {
  const children = [
    // Title
    new Paragraph({
      text: options.churchName || 'Church Testimonies',
      heading: HeadingLevel.HEADING_1,
      alignment: AlignmentType.CENTER,
      spacing: { after: 400 }
    }),
    
    // Metadata
    ...(options.includeMetadata ? [
      new Paragraph({
        text: `Generated on ${format(new Date(), 'PPP')}`,
        alignment: AlignmentType.RIGHT,
        spacing: { after: 400 }
      })
    ] : []),
    
    // Testimonies
    ...testimonies.flatMap((testimony, index) => [
      new Paragraph({
        text: `Testimony ${index + 1}`,
        heading: HeadingLevel.HEADING_2,
        spacing: { before: 400, after: 200 }
      }),
      
      new Paragraph({
        children: [
          new TextRun({
            text: 'Member: ',
            bold: true
          }),
          new TextRun({
            text: testimony.isAnonymous ? 'Anonymous' : testimony.name
          })
        ],
        spacing: { after: 200 }
      }),
      
      new Paragraph({
        children: [
          new TextRun({
            text: 'Date: ',
            bold: true
          }),
          new TextRun({
            text: testimony.createdAt 
              ? format(testimony.createdAt.toDate(), 'PPP') 
              : 'N/A'
          })
        ],
        spacing: { after: 200 }
      }),
      
      new Paragraph({
        children: [
          new TextRun({
            text: 'Story:',
            bold: true
          })
        ],
        spacing: { after: 200 }
      }),
      
      new Paragraph({
        text: testimony.testimony || testimony.story || 'No testimony text',
        spacing: { after: 400 }
      })
    ])
  ];

  const doc = new Document({
    sections: [{
      properties: {},
      children
    }]
  });

  return await Packer.toBlob(doc);
};

// Word Document Export for Prayer Requests using docx
export const exportPrayerRequestsToWord = async (
  prayerRequests: PrayerRequest[], 
  options: ExportOptions = { includePhotos: false, includeMetadata: true }
): Promise<Blob> => {
  const children = [
    // Title
    new Paragraph({
      text: options.churchName || 'Church Prayer Requests',
      heading: HeadingLevel.HEADING_1,
      alignment: AlignmentType.CENTER,
      spacing: { after: 400 }
    }),
    
    // Metadata
    ...(options.includeMetadata ? [
      new Paragraph({
        text: `Generated on ${format(new Date(), 'PPP')}`,
        alignment: AlignmentType.RIGHT,
        spacing: { after: 400 }
      })
    ] : []),
    
    // Prayer Requests
    ...prayerRequests.flatMap((request, index) => [
      new Paragraph({
        text: `Prayer Request ${index + 1}`,
        heading: HeadingLevel.HEADING_2,
        spacing: { before: 400, after: 200 }
      }),
      
      new Paragraph({
        children: [
          new TextRun({
            text: 'Name: ',
            bold: true
          }),
          new TextRun({
            text: request.isAnonymous ? 'Anonymous' : (request.name || 'N/A')
          })
        ],
        spacing: { after: 200 }
      }),
      
      new Paragraph({
        children: [
          new TextRun({
            text: 'Email: ',
            bold: true
          }),
          new TextRun({
            text: request.isAnonymous ? 'N/A' : (request.email || 'N/A')
          })
        ],
        spacing: { after: 200 }
      }),
      
      new Paragraph({
        children: [
          new TextRun({
            text: 'Date: ',
            bold: true
          }),
          new TextRun({
            text: request.createdAt 
              ? format(request.createdAt.toDate(), 'PPP') 
              : 'N/A'
          })
        ],
        spacing: { after: 200 }
      }),
      
      new Paragraph({
        children: [
          new TextRun({
            text: 'Request:',
            bold: true
          })
        ],
        spacing: { after: 200 }
      }),
      
      new Paragraph({
        text: request.request,
        spacing: { after: 400 }
      })
    ])
  ];

  const doc = new Document({
    sections: [{
      properties: {},
      children
    }]
  });

  return await Packer.toBlob(doc);
};



// Download file utility
export const downloadFile = (blob: Blob, fileName: string): void => {
  const url = window.URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = fileName;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  window.URL.revokeObjectURL(url);
};

// Generate filename with timestamp
export const generateFileName = (prefix: string, extension: string): string => {
  const timestamp = format(new Date(), 'yyyy-MM-dd_HH-mm-ss');
  return `${prefix}_${timestamp}.${extension}`;
};
