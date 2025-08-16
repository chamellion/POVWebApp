'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { FileText, FileDown, Download } from 'lucide-react';
import { toast } from 'sonner';
import { TestimonyExport, getTestimonyExports, PrayerRequestExport, getPrayerRequestExports } from '@/lib/firestore';
import { format } from 'date-fns';

interface ExportHistoryProps {
  testimonies?: Array<{ id?: string; name?: string; isAnonymous?: boolean }>; // Type for testimonies lookup
  prayerRequests?: Array<{ id?: string; name?: string | null; isAnonymous?: boolean }>; // Type for prayer requests lookup
  collection?: 'testimonies_exports' | 'prayer_requests_exports';
}

export default function ExportHistory({ testimonies, prayerRequests, collection }: ExportHistoryProps) {
  const [exports, setExports] = useState<(TestimonyExport | PrayerRequestExport)[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const fetchExports = async () => {
      try {
        let data;
        if (collection === 'prayer_requests_exports') {
          data = await getPrayerRequestExports();
        } else {
          data = await getTestimonyExports();
        }
        setExports(data);
      } catch (error) {
        console.error('Failed to fetch exports:', error);
        toast.error('Failed to fetch export history');
      } finally {
        setIsLoading(false);
      }
    };

    fetchExports();
  }, [collection]);

  const getExportTypeIcon = (type: string) => {
    switch (type) {
      case 'pdf':
        return <FileText className="h-4 w-4" />;
      case 'word':
        return <FileDown className="h-4 w-4" />;

      default:
        return <FileText className="h-4 w-4" />;
    }
  };

  const getExportTypeBadge = (type: string) => {
    const variants: Record<string, "default" | "secondary" | "destructive" | "outline"> = {
      pdf: 'default',
      word: 'secondary'
    };

    return (
      <Badge variant={variants[type] || 'outline'} className="flex items-center space-x-1">
        {getExportTypeIcon(type)}
        <span className="capitalize">{type.replace('_', ' ')}</span>
      </Badge>
    );
  };

  const getItemNames = (itemIds: (string | undefined)[]) => {
    const validIds = itemIds.filter((id): id is string => id !== undefined);
    
    if (collection === 'prayer_requests_exports' && prayerRequests) {
      const names = validIds.map(id => {
        const request = prayerRequests.find(r => r.id === id);
        return request ? (request.isAnonymous ? 'Anonymous' : (request.name || 'Unknown')) : 'Unknown';
      });
      
      if (names.length <= 3) {
        return names.join(', ');
      }
      return `${names.slice(0, 3).join(', ')} +${names.length - 3} more`;
    } else if (testimonies) {
      const names = validIds.map(id => {
        const testimony = testimonies.find(t => t.id === id);
        return testimony ? (testimony.isAnonymous ? 'Anonymous' : testimony.name) : 'Unknown';
      });
      
      if (names.length <= 3) {
        return names.join(', ');
      }
      return `${names.slice(0, 3).join(', ')} +${names.length - 3} more`;
    }
    
    return 'No items';
  };

  const downloadExportLog = () => {
    const itemType = collection === 'prayer_requests_exports' ? 'Prayer Requests' : 'Testimonies';
    const csvContent = [
      ['Export Date', 'Admin Email', 'Export Type', `${itemType} Count`, `${itemType} IDs`].join(','),
      ...exports.map(exp => {
        const itemIds = 'testimonyIds' in exp ? exp.testimonyIds : exp.prayerRequestIds;
        return [
          exp.exportedAt ? format(exp.exportedAt.toDate(), 'yyyy-MM-dd HH:mm:ss') : 'N/A',
          exp.adminEmail,
          exp.exportType,
          itemIds.length.toString(),
          itemIds.join(';')
        ].join(',');
      })
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
            <p className="text-gray-500">
              Export history will appear here once you export {collection === 'prayer_requests_exports' ? 'prayer requests' : 'testimonies'}.
            </p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Date</TableHead>
                  <TableHead>Admin</TableHead>
                  <TableHead>Type</TableHead>
                  <TableHead>{collection === 'prayer_requests_exports' ? 'Prayer Requests' : 'Testimonies'}</TableHead>
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
                          {getItemNames('testimonyIds' in exp ? exp.testimonyIds : exp.prayerRequestIds)}
                        </span>
                        <div className="absolute bottom-full left-0 mb-2 hidden group-hover:block bg-gray-900 text-white text-xs rounded py-1 px-2 z-10 max-w-xs">
                          {('testimonyIds' in exp ? exp.testimonyIds : exp.prayerRequestIds).map(id => {
                            if (collection === 'prayer_requests_exports' && prayerRequests) {
                              const request = prayerRequests.find(r => r.id === id);
                              return request ? (request.isAnonymous ? 'Anonymous' : (request.name || 'Unknown')) : 'Unknown';
                            } else if (testimonies) {
                              const testimony = testimonies.find(t => t.id === id);
                              return testimony ? (testimony.isAnonymous ? 'Anonymous' : testimony.name) : 'Unknown';
                            }
                            return 'Unknown';
                          }).join(', ')}
                        </div>
                      </div>
                    </TableCell>
                    <TableCell>
                      <Badge variant="outline">{('testimonyIds' in exp ? exp.testimonyIds : exp.prayerRequestIds).length}</Badge>
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
