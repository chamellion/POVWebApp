'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { FileText, FileDown, Upload, Download } from 'lucide-react';
import { toast } from 'sonner';
import { TestimonyExport, getTestimonyExports } from '@/lib/firestore';
import { format } from 'date-fns';

interface ExportHistoryProps {
  testimonies: Array<{ id?: string; name?: string; isAnonymous?: boolean }>; // Type for testimonies lookup
}

export default function ExportHistory({ testimonies }: ExportHistoryProps) {
  const [exports, setExports] = useState<TestimonyExport[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const fetchExports = async () => {
      try {
        const data = await getTestimonyExports();
        setExports(data);
      } catch (error) {
        console.error('Failed to fetch exports:', error);
        toast.error('Failed to fetch export history');
      } finally {
        setIsLoading(false);
      }
    };

    fetchExports();
  }, []);

  const getExportTypeIcon = (type: string) => {
    switch (type) {
      case 'pdf':
        return <FileText className="h-4 w-4" />;
      case 'word':
        return <FileDown className="h-4 w-4" />;
      case 'google_drive':
        return <Upload className="h-4 w-4" />;
      default:
        return <FileText className="h-4 w-4" />;
    }
  };

  const getExportTypeBadge = (type: string) => {
    const variants: Record<string, "default" | "secondary" | "destructive" | "outline"> = {
      pdf: 'default',
      word: 'secondary',
      google_drive: 'outline'
    };

    return (
      <Badge variant={variants[type] || 'outline'} className="flex items-center space-x-1">
        {getExportTypeIcon(type)}
        <span className="capitalize">{type.replace('_', ' ')}</span>
      </Badge>
    );
  };

  const getTestimonyNames = (testimonyIds: string[]) => {
    const names = testimonyIds.map(id => {
      const testimony = testimonies.find(t => t.id === id);
      return testimony ? (testimony.isAnonymous ? 'Anonymous' : testimony.name) : 'Unknown';
    });
    
    if (names.length <= 3) {
      return names.join(', ');
    }
    
    return `${names.slice(0, 3).join(', ')} +${names.length - 3} more`;
  };

  const downloadExportLog = () => {
    const csvContent = [
      ['Export Date', 'Admin Email', 'Export Type', 'Testimonies Count', 'Testimony IDs'].join(','),
      ...exports.map(exp => [
        exp.exportedAt ? format(exp.exportedAt.toDate(), 'yyyy-MM-dd HH:mm:ss') : 'N/A',
        exp.adminEmail,
        exp.exportType,
        exp.testimonyIds.length.toString(),
        exp.testimonyIds.join(';')
      ].join(','))
    ].join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `export_history_${format(new Date(), 'yyyy-MM-dd')}.csv`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    window.URL.revokeObjectURL(url);
    
    toast.success('Export history downloaded');
  };

  if (isLoading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Export History</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-center h-32">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle>Export History</CardTitle>
          <Button onClick={downloadExportLog} variant="outline" size="sm">
            <Download className="h-4 w-4 mr-2" />
            Download CSV
          </Button>
        </div>
      </CardHeader>
      <CardContent>
        {exports.length === 0 ? (
          <div className="text-center py-8">
            <FileText className="h-12 w-12 text-gray-400 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-gray-900 mb-2">No exports yet</h3>
            <p className="text-gray-500">Export history will appear here once you export testimonies.</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Date</TableHead>
                  <TableHead>Admin</TableHead>
                  <TableHead>Type</TableHead>
                  <TableHead>Testimonies</TableHead>
                  <TableHead>Count</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {exports.map((exp) => (
                  <TableRow key={exp.id}>
                    <TableCell className="whitespace-nowrap">
                      {exp.exportedAt ? format(exp.exportedAt.toDate(), 'MMM dd, yyyy HH:mm') : 'N/A'}
                    </TableCell>
                    <TableCell className="max-w-[200px] truncate">
                      {exp.adminEmail}
                    </TableCell>
                    <TableCell>
                      {getExportTypeBadge(exp.exportType)}
                    </TableCell>
                    <TableCell className="max-w-[300px]">
                      <div className="group relative">
                        <span className="truncate block">
                          {getTestimonyNames(exp.testimonyIds)}
                        </span>
                        <div className="absolute bottom-full left-0 mb-2 hidden group-hover:block bg-gray-900 text-white text-xs rounded py-1 px-2 z-10 max-w-xs">
                          {exp.testimonyIds.map(id => {
                            const testimony = testimonies.find(t => t.id === id);
                            return testimony ? (testimony.isAnonymous ? 'Anonymous' : testimony.name) : 'Unknown';
                          }).join(', ')}
                        </div>
                      </div>
                    </TableCell>
                    <TableCell>
                      <Badge variant="outline">{exp.testimonyIds.length}</Badge>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
