'use client';

import { useState, useEffect } from 'react';
import { useProtectedRoute } from '@/hooks/useProtectedRoute';
import DashboardLayout from '@/components/layout/DashboardLayout';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Checkbox } from '@/components/ui/checkbox';
import { 
  Trash2, 
  Search, 
  Filter, 
  Download, 
  Eye,
  EyeOff,
  User,
  Users,
  Edit,
  Heart
} from 'lucide-react';
import { toast } from 'sonner';
import { format } from 'date-fns';
import { 
  PrayerRequest, 
  getPrayerRequestsWithFilters, 
  deleteDocument, 
  prayerRequestsCollection,
  markPrayerRequestAsRead,
  markMultiplePrayerRequestsAsRead,
  subscribeToPrayerRequests,
  getUnreadPrayerRequestsCount
} from '@/lib/firestore';
import { useAuth } from '@/contexts/AuthContext';
import ExportModal from '@/components/ui/ExportModal';
import ExportHistory from '@/components/ui/ExportHistory';
import PrayerRequestForm from './PrayerRequestForm';

type FilterType = 'all' | 'anonymous' | 'non-anonymous' | 'unread' | 'read';

export default function PrayerRequestsPage() {
  const { loading } = useProtectedRoute();
  const { user } = useAuth();
  
  const [prayerRequests, setPrayerRequests] = useState<PrayerRequest[]>([]);
  const [filteredPrayerRequests, setFilteredPrayerRequests] = useState<PrayerRequest[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [showExportModal, setShowExportModal] = useState(false);
  const [selectedRequests, setSelectedRequests] = useState<Set<string>>(new Set());
  const [searchTerm, setSearchTerm] = useState('');
  const [filterType, setFilterType] = useState<FilterType>('all');
  const [dateFrom, setDateFrom] = useState('');
  const [dateTo, setDateTo] = useState('');
  const [expandedRows, setExpandedRows] = useState<Set<string>>(new Set());
  const [editingRequest, setEditingRequest] = useState<PrayerRequest | null>(null);
  const [showEditForm, setShowEditForm] = useState(false);

  useEffect(() => {
    // Only set up listeners if user is authenticated
    if (!user) {
      setPrayerRequests([]);
      setFilteredPrayerRequests([]);
      setIsLoading(false);
      return;
    }

    const fetchData = async () => {
      try {
        const data = await getPrayerRequestsWithFilters();
        setPrayerRequests(data);
        setFilteredPrayerRequests(data);
        
        // Get unread count
        await getUnreadPrayerRequestsCount();
      } catch (error) {
        console.error('Failed to fetch prayer requests:', error);
        toast.error('Failed to fetch prayer requests');
      } finally {
        setIsLoading(false);
      }
    };

    fetchData();

    // Set up real-time listener
    const unsubscribe = subscribeToPrayerRequests((data) => {
      setPrayerRequests(data);
      setFilteredPrayerRequests(data);
    });

    return () => unsubscribe();
  }, [user]);

  useEffect(() => {
    let filtered = prayerRequests;

    // Apply search filter
    if (searchTerm) {
      filtered = filtered.filter(request => 
        (request.name && request.name.toLowerCase().includes(searchTerm.toLowerCase())) ||
        request.request.toLowerCase().includes(searchTerm.toLowerCase()) ||
        (request.email && request.email.toLowerCase().includes(searchTerm.toLowerCase()))
      );
    }

    // Apply type filter
    if (filterType !== 'all') {
      switch (filterType) {
        case 'anonymous':
          filtered = filtered.filter(request => request.isAnonymous);
          break;
        case 'non-anonymous':
          filtered = filtered.filter(request => !request.isAnonymous);
          break;
        case 'unread':
          filtered = filtered.filter(request => !request.isRead);
          break;
        case 'read':
          filtered = filtered.filter(request => request.isRead);
          break;
      }
    }

    // Apply date filter
    if (dateFrom || dateTo) {
      filtered = filtered.filter(request => {
        if (!request.createdAt) return false;
        const requestDate = request.createdAt.toDate();
        const fromDate = dateFrom ? new Date(dateFrom) : null;
        const toDate = dateTo ? new Date(dateTo) : null;
        
        if (fromDate && requestDate < fromDate) return false;
        if (toDate && requestDate > toDate) return false;
        
        return true;
      });
    }

    setFilteredPrayerRequests(filtered);
  }, [prayerRequests, searchTerm, filterType, dateFrom, dateTo]);

  const handleSelectAll = (checked: boolean) => {
    if (checked) {
      setSelectedRequests(new Set(filteredPrayerRequests.map(r => r.id!)));
    } else {
      setSelectedRequests(new Set());
    }
  };

  const handleSelectRequest = (requestId: string, checked: boolean) => {
    const newSelected = new Set(selectedRequests);
    if (checked) {
      newSelected.add(requestId);
    } else {
      newSelected.delete(requestId);
    }
    setSelectedRequests(newSelected);
  };

  const handleMarkAsRead = async (requestId: string) => {
    if (!user) return;
    
    try {
      await markPrayerRequestAsRead(requestId, user.uid, user.email || '');
      toast.success('Prayer request marked as read');
    } catch (error) {
      console.error('Failed to mark as read:', error);
      toast.error('Failed to mark as read');
    }
  };

  const handleMarkMultipleAsRead = async () => {
    if (!user || selectedRequests.size === 0) return;
    
    try {
      await markMultiplePrayerRequestsAsRead(
        Array.from(selectedRequests), 
        user.uid, 
        user.email || ''
      );
      toast.success(`${selectedRequests.size} prayer request(s) marked as read`);
      setSelectedRequests(new Set());
    } catch (error) {
      console.error('Failed to mark multiple as read:', error);
      toast.error('Failed to mark as read');
    }
  };

  const handleDelete = async (requestId: string) => {
    if (!confirm('Are you sure you want to delete this prayer request?')) return;
    
    try {
      await deleteDocument(prayerRequestsCollection, requestId);
      toast.success('Prayer request deleted');
    } catch (error) {
      console.error('Failed to delete:', error);
      toast.error('Failed to delete prayer request');
    }
  };

  const handleDeleteMultiple = async () => {
    if (selectedRequests.size === 0) return;
    
    if (!confirm(`Are you sure you want to delete ${selectedRequests.size} prayer request(s)?`)) return;
    
    try {
      const promises = Array.from(selectedRequests).map(id => 
        deleteDocument(prayerRequestsCollection, id)
      );
      await Promise.all(promises);
      toast.success(`${selectedRequests.size} prayer request(s) deleted`);
      setSelectedRequests(new Set());
    } catch (error) {
      console.error('Failed to delete multiple:', error);
      toast.error('Failed to delete prayer requests');
    }
  };

  const handleEdit = (request: PrayerRequest) => {
    setEditingRequest(request);
    setShowEditForm(true);
  };

  const handleEditSuccess = () => {
    setShowEditForm(false);
    setEditingRequest(null);
    toast.success('Prayer request updated successfully');
  };

  const toggleExpanded = (requestId: string) => {
    const newExpanded = new Set(expandedRows);
    if (newExpanded.has(requestId)) {
      newExpanded.delete(requestId);
    } else {
      newExpanded.add(requestId);
    }
    setExpandedRows(newExpanded);
  };

  const getStats = () => {
    const total = prayerRequests.length;
    const unread = prayerRequests.filter(r => !r.isRead).length;
    const anonymous = prayerRequests.filter(r => r.isAnonymous).length;
    const named = total - anonymous;
    
    return { total, unread, anonymous, named };
  };

  const stats = getStats();

  if (loading) {
    return (
      <DashboardLayout>
        <div className="flex items-center justify-center min-h-screen">
          <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-gray-900"></div>
        </div>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout>
      <div className="container mx-auto py-6 space-y-6">
        {/* Header */}
        <div className="flex justify-between items-center">
          <div>
            <h1 className="text-3xl font-bold tracking-tight">Prayer Requests</h1>
            <p className="text-muted-foreground">
              Manage prayer requests submitted through the website
            </p>
          </div>
          <div className="flex gap-2">
            {selectedRequests.size > 0 && (
              <>
                <Button
                  variant="outline"
                  onClick={handleMarkMultipleAsRead}
                  className="flex items-center gap-2"
                >
                  <Eye className="h-4 w-4" />
                  Mark as Read ({selectedRequests.size})
                </Button>
                <Button
                  variant="destructive"
                  onClick={handleDeleteMultiple}
                  className="flex items-center gap-2"
                >
                  <Trash2 className="h-4 w-4" />
                  Delete ({selectedRequests.size})
                </Button>
              </>
            )}
            <Button
              onClick={() => setShowExportModal(true)}
              className="flex items-center gap-2"
            >
              <Download className="h-4 w-4" />
              Export
            </Button>
          </div>
        </div>

        {/* Stats Cards */}
        <div className="grid gap-4 md:grid-cols-4">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total Requests</CardTitle>
              <Heart className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats.total}</div>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Unread</CardTitle>
              <EyeOff className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-orange-600">{stats.unread}</div>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Named Requests</CardTitle>
              <User className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-blue-600">{stats.named}</div>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Anonymous</CardTitle>
              <Users className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-gray-600">{stats.anonymous}</div>
            </CardContent>
          </Card>
        </div>

        {/* Filters */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Filter className="h-5 w-5" />
              Filters
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid gap-4 md:grid-cols-4">
              <div className="space-y-2">
                <Label htmlFor="search">Search</Label>
                <div className="relative">
                  <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
                  <Input
                    id="search"
                    placeholder="Search requests..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="pl-8"
                  />
                </div>
              </div>
              <div className="space-y-2">
                <Label htmlFor="filter">Filter Type</Label>
                <Select value={filterType} onValueChange={(value: FilterType) => setFilterType(value)}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Requests</SelectItem>
                    <SelectItem value="anonymous">Anonymous Only</SelectItem>
                    <SelectItem value="non-anonymous">Named Only</SelectItem>
                    <SelectItem value="unread">Unread Only</SelectItem>
                    <SelectItem value="read">Read Only</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label htmlFor="dateFrom">From Date</Label>
                <Input
                  id="dateFrom"
                  type="date"
                  value={dateFrom}
                  onChange={(e) => setDateFrom(e.target.value)}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="dateTo">To Date</Label>
                <Input
                  id="dateTo"
                  type="date"
                  value={dateTo}
                  onChange={(e) => setDateTo(e.target.value)}
                />
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Prayer Requests Table */}
        <Card>
          <CardHeader>
            <CardTitle>Prayer Requests ({filteredPrayerRequests.length})</CardTitle>
          </CardHeader>
          <CardContent>
            {isLoading ? (
              <div className="flex items-center justify-center py-8">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-gray-900"></div>
              </div>
            ) : filteredPrayerRequests.length === 0 ? (
              <div className="text-center py-8 text-muted-foreground">
                <Heart className="h-12 w-12 mx-auto mb-4 text-muted-foreground" />
                <p className="text-lg font-medium">No prayer requests found</p>
                <p className="text-sm">
                  Prayer requests are submitted via the website. Admins can manage them here.
                </p>
              </div>
            ) : (
              <div className="space-y-4">
                {/* Select All */}
                <div className="flex items-center space-x-2">
                  <Checkbox
                    id="select-all"
                    checked={selectedRequests.size === filteredPrayerRequests.length}
                    onCheckedChange={handleSelectAll}
                  />
                  <Label htmlFor="select-all">Select All</Label>
                </div>

                {/* Table */}
                <div className="border rounded-lg">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead className="w-12"></TableHead>
                        <TableHead>Request</TableHead>
                        <TableHead>Name</TableHead>
                        <TableHead>Email</TableHead>
                        <TableHead>Created</TableHead>
                        <TableHead>Status</TableHead>
                        <TableHead className="w-32">Actions</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {filteredPrayerRequests.map((request) => (
                        <TableRow key={request.id} className={!request.isRead ? 'bg-orange-50' : ''}>
                          <TableCell>
                            <Checkbox
                              checked={selectedRequests.has(request.id!)}
                              onCheckedChange={(checked) => 
                                handleSelectRequest(request.id!, checked as boolean)
                              }
                            />
                          </TableCell>
                          <TableCell>
                            <div className="max-w-xs">
                              <div 
                                className="cursor-pointer hover:text-blue-600"
                                onClick={() => toggleExpanded(request.id!)}
                              >
                                {request.request.length > 100 
                                  ? `${request.request.substring(0, 100)}...` 
                                  : request.request
                                }
                              </div>
                              {expandedRows.has(request.id!) && (
                                <div className="mt-2 p-3 bg-gray-50 rounded text-sm">
                                  {request.request}
                                </div>
                              )}
                            </div>
                          </TableCell>
                          <TableCell>
                            {request.isAnonymous ? (
                              <Badge variant="secondary">Anonymous</Badge>
                            ) : (
                              <div className="flex items-center gap-2">
                                <Avatar className="h-6 w-6">
                                  <AvatarFallback className="text-xs">
                                    {request.name?.charAt(0).toUpperCase() || '?'}
                                  </AvatarFallback>
                                </Avatar>
                                <span>{request.name || 'Unknown'}</span>
                              </div>
                            )}
                          </TableCell>
                          <TableCell>
                            {request.email ? (
                              <span className="text-sm text-muted-foreground">{request.email}</span>
                            ) : (
                              <span className="text-sm text-muted-foreground">—</span>
                            )}
                          </TableCell>
                          <TableCell>
                            {request.createdAt ? (
                              <span className="text-sm">
                                {format(request.createdAt.toDate(), 'MMM d, yyyy')}
                              </span>
                            ) : (
                              <span className="text-sm text-muted-foreground">—</span>
                            )}
                          </TableCell>
                          <TableCell>
                            <Badge variant={request.isRead ? 'default' : 'destructive'}>
                              {request.isRead ? 'Read' : 'Unread'}
                            </Badge>
                          </TableCell>
                          <TableCell>
                            <div className="flex items-center gap-1">
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => handleEdit(request)}
                                className="h-8 w-8 p-0"
                              >
                                <Edit className="h-4 w-4" />
                              </Button>
                              {!request.isRead ? (
                                <Button
                                  variant="ghost"
                                  size="sm"
                                  onClick={() => handleMarkAsRead(request.id!)}
                                  className="h-8 w-8 p-0"
                                  title="Mark as read"
                                >
                                  <Eye className="h-4 w-4" />
                                </Button>
                              ) : (
                                <Button
                                  variant="ghost"
                                  size="sm"
                                  onClick={() => handleMarkAsRead(request.id!)}
                                  className="h-8 w-8 p-0"
                                  title="Mark as unread"
                                >
                                  <EyeOff className="h-4 w-4" />
                                </Button>
                              )}
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => handleDelete(request.id!)}
                                className="h-8 w-8 p-0 text-red-600 hover:text-red-700"
                                title="Delete"
                              >
                                <Trash2 className="h-4 w-4" />
                              </Button>
                            </div>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Export History */}
        <ExportHistory 
          collection="prayer_requests_exports"
          prayerRequests={prayerRequests}
        />
      </div>

      {/* Export Modal */}
      <ExportModal
        isOpen={showExportModal}
        onClose={() => setShowExportModal(false)}
        items={selectedRequests.size > 0 
          ? filteredPrayerRequests.filter(r => selectedRequests.has(r.id!))
          : filteredPrayerRequests
        }
        exportType="prayer_requests"
        onExportSuccess={() => {
          setShowExportModal(false);
          setSelectedRequests(new Set());
        }}
      />

      {/* Edit Form */}
      <PrayerRequestForm
        prayerRequest={editingRequest}
        isOpen={showEditForm}
        onClose={() => {
          setShowEditForm(false);
          setEditingRequest(null);
        }}
        onSuccess={handleEditSuccess}
      />
    </DashboardLayout>
  );
}
