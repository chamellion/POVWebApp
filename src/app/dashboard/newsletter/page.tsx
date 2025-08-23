'use client';

import { useState, useEffect } from 'react';
import { useProtectedRoute } from '@/hooks/useProtectedRoute';
import { useAuth } from '@/contexts/AuthContext';
import DashboardLayout from '@/components/layout/DashboardLayout';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Mail, Trash2, Download, Eye } from 'lucide-react';
import { toast } from 'sonner';
import { NewsletterSignup, getNewsletterSignups, deleteNewsletterSignup, subscribeToNewsletterSignups } from '@/lib/firestore';
import { Timestamp } from 'firebase/firestore';

export default function NewsletterPage() {
  const { loading } = useProtectedRoute();
  const { user } = useAuth();
  const [signups, setSignups] = useState<NewsletterSignup[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [lastViewedTimestamp, setLastViewedTimestamp] = useState<number>(0);

  useEffect(() => {
    // Only set up listeners if user is authenticated
    if (!user) {
      setSignups([]);
      setIsLoading(false);
      return;
    }

    // Load last viewed timestamp from localStorage
    const stored = localStorage.getItem('lastViewedNewsletterTimestamp');
    if (stored) {
      setLastViewedTimestamp(parseInt(stored));
    }

    const fetchSignups = async () => {
      try {
        const data = await getNewsletterSignups();
        setSignups(data);
      } catch {
        toast.error('Failed to fetch newsletter signups');
      } finally {
        setIsLoading(false);
      }
    };

    fetchSignups();

    // Set up real-time listener
    const unsubscribe = subscribeToNewsletterSignups((data) => {
      setSignups(data);
      
      // Check for new signups and show notification
      const newSignups = data.filter(signup => 
        signup.createdAt && signup.createdAt.toMillis() > lastViewedTimestamp
      );
      
      if (newSignups.length > 0 && lastViewedTimestamp > 0) {
        toast.success(`${newSignups.length} new newsletter signup${newSignups.length > 1 ? 's' : ''}!`);
      }
    });

    return () => unsubscribe();
  }, [user, lastViewedTimestamp]);

  const handleDelete = async (id: string) => {
    if (confirm('Are you sure you want to delete this signup?')) {
      try {
        await deleteNewsletterSignup(id);
        setSignups(signups.filter(signup => signup.id !== id));
        toast.success('Signup deleted successfully');
      } catch {
        toast.error('Failed to delete signup');
      }
    }
  };

  const handleMarkAsViewed = () => {
    const now = Date.now();
    setLastViewedTimestamp(now);
    localStorage.setItem('lastViewedNewsletterTimestamp', now.toString());
    toast.success('Marked as viewed');
  };

  const handleExportCSV = () => {
    const csvContent = [
      'Email,Signup Date',
      ...signups.map(signup => 
        `${signup.email},${signup.createdAt ? new Date(signup.createdAt.toMillis()).toLocaleDateString() : 'N/A'}`
      )
    ].join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `newsletter-signups-${new Date().toISOString().split('T')[0]}.csv`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    window.URL.revokeObjectURL(url);
  };

  const formatDate = (timestamp: Timestamp | null | undefined) => {
    if (!timestamp) return 'N/A';
    return new Date(timestamp.toMillis()).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  const getNewSignupsCount = () => {
    return signups.filter(signup => 
      signup.createdAt && signup.createdAt.toMillis() > lastViewedTimestamp
    ).length;
  };

  if (loading || isLoading) {
    return (
      <DashboardLayout>
        <div className="flex items-center justify-center h-64">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
        </div>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">Newsletter Signups</h1>
            <p className="text-gray-600 mt-2">Manage newsletter subscriptions</p>
          </div>
          <div className="flex space-x-2">
            <Button variant="outline" onClick={handleMarkAsViewed}>
              <Eye className="h-4 w-4 mr-2" />
              Mark as Viewed
            </Button>
            <Button variant="outline" onClick={handleExportCSV}>
              <Download className="h-4 w-4 mr-2" />
              Export CSV
            </Button>
          </div>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <Card>
            <CardContent className="p-6">
              <div className="flex items-center space-x-3">
                <div className="p-2 bg-blue-100 rounded-lg">
                  <Mail className="h-6 w-6 text-blue-600" />
                </div>
                <div>
                  <p className="text-sm font-medium text-gray-600">Total Signups</p>
                  <p className="text-2xl font-bold text-gray-900">{signups.length}</p>
                </div>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-6">
              <div className="flex items-center space-x-3">
                <div className="p-2 bg-green-100 rounded-lg">
                  <Mail className="h-6 w-6 text-green-600" />
                </div>
                <div>
                  <p className="text-sm font-medium text-gray-600">New Signups</p>
                  <p className="text-2xl font-bold text-gray-900">
                    {getNewSignupsCount()}
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Signups Table */}
        <Card>
          <CardHeader>
            <CardTitle>All Signups</CardTitle>
          </CardHeader>
          <CardContent>
            {signups.length === 0 ? (
              <div className="text-center py-8">
                <Mail className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                <h3 className="text-lg font-medium text-gray-900 mb-2">No signups yet</h3>
                <p className="text-gray-500">Newsletter signups will appear here when people subscribe.</p>
              </div>
            ) : (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Email</TableHead>
                    <TableHead>Signup Date</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {signups.map((signup) => {
                    const isNew = signup.createdAt && signup.createdAt.toMillis() > lastViewedTimestamp;
                    return (
                      <TableRow key={signup.id}>
                        <TableCell>
                          <div className="flex items-center space-x-2">
                            <span className="font-medium text-gray-900">{signup.email}</span>
                            {isNew && (
                              <Badge variant="default" className="text-xs">
                                New
                              </Badge>
                            )}
                          </div>
                        </TableCell>
                        <TableCell>
                          <span className="text-sm text-gray-600">
                            {formatDate(signup.createdAt)}
                          </span>
                        </TableCell>
                        <TableCell>
                          <Badge variant={isNew ? "default" : "secondary"}>
                            {isNew ? 'New' : 'Viewed'}
                          </Badge>
                        </TableCell>
                        <TableCell>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => handleDelete(signup.id!)}
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </TableCell>
                      </TableRow>
                    );
                  })}
                </TableBody>
              </Table>
            )}
          </CardContent>
        </Card>
      </div>
    </DashboardLayout>
  );
}
