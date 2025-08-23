'use client';

import { useState, useEffect } from 'react';
import { useProtectedRoute } from '@/hooks/useProtectedRoute';
import DashboardLayout from '@/components/layout/DashboardLayout';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Checkbox } from '@/components/ui/checkbox';
import { 
  Trash2, 
  MessageSquare, 
  Search, 
  Filter, 
  Download, 
  Eye,
  EyeOff,
  User,
  Users
} from 'lucide-react';
import { toast } from 'sonner';
import { format } from 'date-fns';
import { 
  Testimony, 
  getTestimoniesWithFilters, 
  deleteDocument, 
  testimoniesCollection,
  markTestimonyAsRead,
  markMultipleTestimoniesAsRead,
  subscribeToTestimonies,
  getUnreadTestimoniesCount
} from '@/lib/firestore';
import { logDelete, logUpdate } from '@/lib/firebase/logActivity';
import { useAuth } from '@/contexts/AuthContext';
import ExportModal from '@/components/ui/ExportModal';
import ExportHistory from '@/components/ui/ExportHistory';

type FilterType = 'all' | 'anonymous' | 'non-anonymous' | 'unread' | 'read' | 'allow-sharing' | 'no-sharing';

export default function TestimoniesPage() {
  const { loading } = useProtectedRoute();
  const { user } = useAuth();
  
  // Debug authentication state
  console.log('🔐 TestimoniesPage Auth State:', {
    user: !!user,
    uid: user?.uid,
    email: user?.email,
    loading
  });
  const [testimonies, setTestimonies] = useState<Testimony[]>([]);
  const [filteredTestimonies, setFilteredTestimonies] = useState<Testimony[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [showExportModal, setShowExportModal] = useState(false);
  const [selectedTestimonies, setSelectedTestimonies] = useState<Set<string>>(new Set());
  const [searchTerm, setSearchTerm] = useState('');
  const [filterType, setFilterType] = useState<FilterType>('all');
  const [dateFrom, setDateFrom] = useState('');
  const [dateTo, setDateTo] = useState('');
  const [expandedRows, setExpandedRows] = useState<Set<string>>(new Set());

  useEffect(() => {
    // Only set up listeners if user is authenticated
    if (!user) {
      console.log('🔐 TestimoniesPage: No user, clearing data and skipping listeners');
      setTestimonies([]);
      setFilteredTestimonies([]);
      setIsLoading(false);
      return;
    }

    const fetchData = async () => {
      try {
        console.log('🔍 Fetching testimonies...');
        const data = await getTestimoniesWithFilters();
        console.log('✅ Testimonies fetched successfully:', data.length);
        setTestimonies(data);
        setFilteredTestimonies(data);
        
        // Get unread count
        console.log('🔍 Getting unread count...');
        await getUnreadTestimoniesCount();
        console.log('✅ Unread count retrieved');
      } catch (error) {
        console.error('❌ Failed to fetch testimonies:', error);
        console.error('Error details:', {
          message: error instanceof Error ? error.message : 'Unknown error',
          code: (error as { code?: string })?.code,
          stack: error instanceof Error ? error.stack : undefined
        });
        toast.error('Failed to fetch testimonies');
      } finally {
        setIsLoading(false);
      }
    };

    fetchData();

    // Set up real-time listener
    console.log('🔍 Setting up testimonies listener...');
    const unsubscribe = subscribeToTestimonies((data) => {
      console.log('📡 Testimonies listener update:', data.length);
      setTestimonies(data);
      setFilteredTestimonies(data);
      
      // Update unread count - no action needed
    });

    return () => unsubscribe();
  }, [user]);

  // Apply filters and search
  useEffect(() => {
    let filtered = [...testimonies];

    // Apply filter type
    switch (filterType) {
      case 'anonymous':
        filtered = filtered.filter(t => t.isAnonymous);
        break;
      case 'non-anonymous':
        filtered = filtered.filter(t => !t.isAnonymous);
        break;
      case 'unread':
        filtered = filtered.filter(t => !(t.isRead ?? false));
        break;
      case 'read':
        filtered = filtered.filter(t => t.isRead ?? false);
        break;
      case 'allow-sharing':
        filtered = filtered.filter(t => t.allowSharing ?? false);
        break;
      case 'no-sharing':
        filtered = filtered.filter(t => !(t.allowSharing ?? false));
        break;
    }

    // Apply date range filter
    if (dateFrom || dateTo) {
      filtered = filtered.filter(testimony => {
        if (!testimony.createdAt) return false;
        
        const testimonyDate = testimony.createdAt.toDate();
        const fromDate = dateFrom ? new Date(dateFrom) : null;
        const toDate = dateTo ? new Date(dateTo) : null;
        
        if (fromDate && testimonyDate < fromDate) return false;
        if (toDate && testimonyDate > toDate) return false;
        
        return true;
      });
    }

    // Apply search
    if (searchTerm) {
      filtered = filtered.filter(testimony => {
        const searchLower = searchTerm.toLowerCase();
        const name = testimony.isAnonymous ? 'Anonymous' : testimony.name;
        const testimonyText = testimony.testimony || testimony.story || '';
        return (
          name.toLowerCase().includes(searchLower) ||
          testimonyText.toLowerCase().includes(searchLower)
        );
      });
    }

    setFilteredTestimonies(filtered);
  }, [testimonies, filterType, dateFrom, dateTo, searchTerm]);

  const handleDelete = async (id: string) => {
    if (confirm('Are you sure you want to delete this testimony?')) {
      try {
        // Find the testimony to get its title for logging
        const testimony = testimonies.find(t => t.id === id);
        const title = testimony?.name || testimony?.testimony?.substring(0, 50) || 'Untitled';
        
        await deleteDocument(testimoniesCollection, id);
        
        // Log the deletion activity
        await logDelete('testimonies', title, user?.uid);
        
        toast.success('Testimony deleted successfully');
      } catch (error) {
        console.error('Failed to delete testimony:', error);
        toast.error('Failed to delete testimony');
      }
    }
  };

  const handleMarkAsRead = async (testimonyId: string) => {
    if (!user) return;
    
    try {
      // Find the testimony to get its title for logging
      const testimony = testimonies.find(t => t.id === testimonyId);
      const title = testimony?.name || testimony?.testimony?.substring(0, 50) || 'Untitled';
      
      await markTestimonyAsRead(testimonyId, user.uid, user.email || '');
      
      // Log the update activity
      await logUpdate('testimonies', title, user.uid);
      
      toast.success('Testimony marked as read');
    } catch (error) {
      console.error('Failed to mark as read:', error);
      toast.error('Failed to mark as read');
    }
  };

  const handleBulkMarkAsRead = async () => {
    if (!user || selectedTestimonies.size === 0) return;
    
    try {
      await markMultipleTestimoniesAsRead(Array.from(selectedTestimonies), user.uid, user.email || '');
      
      // Log the bulk update activity
      await logUpdate('testimonies', `${selectedTestimonies.size} testimonies`, user.uid, {
        action: 'bulk_mark_read',
        count: selectedTestimonies.size
      });
      
      setSelectedTestimonies(new Set());
      toast.success(`${selectedTestimonies.size} testimonies marked as read`);
    } catch (error) {
      console.error('Failed to mark as read:', error);
      toast.error('Failed to mark as read');
    }
  };

  const handleSelectAll = () => {
    if (selectedTestimonies.size === filteredTestimonies.length) {
      setSelectedTestimonies(new Set());
    } else {
      setSelectedTestimonies(new Set(filteredTestimonies.map(t => t.id!)));
    }
  };

  const handleSelectTestimony = (testimonyId: string) => {
    const newSelected = new Set(selectedTestimonies);
    if (newSelected.has(testimonyId)) {
      newSelected.delete(testimonyId);
    } else {
      newSelected.add(testimonyId);
    }
    setSelectedTestimonies(newSelected);
  };

  const toggleExpandedRow = (testimonyId: string) => {
    const newExpanded = new Set(expandedRows);
    if (newExpanded.has(testimonyId)) {
      newExpanded.delete(testimonyId);
    } else {
      newExpanded.add(testimonyId);
    }
    setExpandedRows(newExpanded);
  };

  const getFilteredStats = () => {
    const total = filteredTestimonies.length;
    const anonymous = filteredTestimonies.filter(t => t.isAnonymous).length;
    const unread = filteredTestimonies.filter(t => !(t.isRead ?? false)).length;
    const allowSharing = filteredTestimonies.filter(t => t.allowSharing ?? false).length;

    return { total, anonymous, unread, allowSharing };
  };

  const stats = getFilteredStats();

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
            <h1 className="text-3xl font-bold text-gray-900">Testimonies</h1>
            <p className="text-gray-600 mt-2">Manage member testimonies and stories</p>
          </div>
          <div className="flex items-center space-x-2">
            <Button 
              variant="outline" 
              onClick={() => setShowExportModal(true)}
              disabled={testimonies.length === 0}
            >
              <Download className="h-4 w-4 mr-2" />
              Export
            </Button>
          </div>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
          <Card>
            <CardContent className="p-6">
              <div className="flex items-center space-x-3">
                <div className="p-2 bg-blue-100 rounded-lg">
                  <MessageSquare className="h-6 w-6 text-blue-600" />
                </div>
                <div>
                  <p className="text-sm font-medium text-gray-600">Total</p>
                  <p className="text-2xl font-bold text-gray-900">{stats.total}</p>
                </div>
              </div>
            </CardContent>
          </Card>
          
          <Card>
            <CardContent className="p-6">
              <div className="flex items-center space-x-3">
                <div className="p-2 bg-green-100 rounded-lg">
                  <User className="h-6 w-6 text-green-600" />
                </div>
                <div>
                  <p className="text-sm font-medium text-gray-600">Anonymous</p>
                  <p className="text-2xl font-bold text-gray-900">{stats.anonymous}</p>
                </div>
              </div>
            </CardContent>
          </Card>
          
          <Card>
            <CardContent className="p-6">
              <div className="flex items-center space-x-3">
                <div className="p-2 bg-yellow-100 rounded-lg">
                  <Eye className="h-6 w-6 text-yellow-600" />
                </div>
                <div>
                  <p className="text-sm font-medium text-gray-600">Unread</p>
                  <p className="text-2xl font-bold text-gray-900">{stats.unread}</p>
                </div>
              </div>
            </CardContent>
          </Card>
          
          <Card>
            <CardContent className="p-6">
              <div className="flex items-center space-x-3">
                <div className="p-2 bg-purple-100 rounded-lg">
                  <Users className="h-6 w-6 text-purple-600" />
                </div>
                <div>
                  <p className="text-sm font-medium text-gray-600">Shareable</p>
                  <p className="text-2xl font-bold text-gray-900">{stats.allowSharing}</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Filters and Search */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center space-x-2">
              <Filter className="h-5 w-5" />
              <span>Filters & Search</span>
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
              {/* Search */}
              <div className="space-y-2">
                <Label htmlFor="search">Search</Label>
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                  <Input
                    id="search"
                    placeholder="Search testimonies..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="pl-10"
                  />
                </div>
              </div>

              {/* Filter Type */}
              <div className="space-y-2">
                <Label htmlFor="filter-type">Filter Type</Label>
                <Select value={filterType} onValueChange={(value: FilterType) => setFilterType(value)}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Testimonies</SelectItem>
                    <SelectItem value="anonymous">Anonymous Only</SelectItem>
                    <SelectItem value="non-anonymous">Non-Anonymous Only</SelectItem>
                    <SelectItem value="unread">Unread Only</SelectItem>
                    <SelectItem value="read">Read Only</SelectItem>
                    <SelectItem value="allow-sharing">Shareable Only</SelectItem>
                    <SelectItem value="no-sharing">Non-Shareable Only</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              {/* Date From */}
              <div className="space-y-2">
                <Label htmlFor="date-from">From Date</Label>
                <Input
                  id="date-from"
                  type="date"
                  value={dateFrom}
                  onChange={(e) => setDateFrom(e.target.value)}
                />
              </div>

              {/* Date To */}
              <div className="space-y-2">
                <Label htmlFor="date-to">To Date</Label>
                <Input
                  id="date-to"
                  type="date"
                  value={dateTo}
                  onChange={(e) => setDateTo(e.target.value)}
                />
              </div>
            </div>

            {/* Clear Filters */}
            {(filterType !== 'all' || dateFrom || dateTo || searchTerm) && (
              <Button
                variant="outline"
                size="sm"
                onClick={() => {
                  setFilterType('all');
                  setDateFrom('');
                  setDateTo('');
                  setSearchTerm('');
                }}
              >
                Clear Filters
              </Button>
            )}
          </CardContent>
        </Card>

        {/* Main Content Tabs */}
        <Tabs defaultValue="testimonies" className="space-y-6">
          <TabsList>
            <TabsTrigger value="testimonies">Testimonies</TabsTrigger>
            <TabsTrigger value="export-history">Export History</TabsTrigger>
          </TabsList>

          <TabsContent value="testimonies" className="space-y-6">
            {/* Bulk Actions */}
            {selectedTestimonies.size > 0 && (
              <Card>
                <CardContent className="p-4">
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-gray-600">
                      {selectedTestimonies.size} testimonie{selectedTestimonies.size !== 1 ? 's' : ''} selected
                    </span>
                    <div className="flex items-center space-x-2">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={handleBulkMarkAsRead}
                      >
                        <Eye className="h-4 w-4 mr-2" />
                        Mark as Read
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => setShowExportModal(true)}
                      >
                        <Download className="h-4 w-4 mr-2" />
                        Export Selected
                      </Button>
                    </div>
                  </div>
                </CardContent>
              </Card>
            )}

            {/* Testimonies Table */}
            <Card>
              <CardHeader>
                <CardTitle>All Testimonies</CardTitle>
              </CardHeader>
              <CardContent>
                {filteredTestimonies.length === 0 ? (
                  <div className="text-center py-8">
                    <MessageSquare className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                    <h3 className="text-lg font-medium text-gray-900 mb-2">
                      {testimonies.length === 0 ? 'No testimonies yet' : 'No testimonies match your filters'}
                    </h3>
                    <p className="text-gray-500 mb-4">
                      {testimonies.length === 0 
                        ? 'Testimonies will appear here once they are submitted through the client app.'
                        : 'Try adjusting your search or filter criteria.'
                      }
                    </p>
                  </div>
                ) : (
                  <div className="overflow-x-auto">
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead className="w-12">
                            <Checkbox
                              checked={selectedTestimonies.size === filteredTestimonies.length}
                              onCheckedChange={handleSelectAll}
                            />
                          </TableHead>
                          <TableHead>Member</TableHead>
                          <TableHead>Testimony</TableHead>
                          <TableHead>Status</TableHead>
                          <TableHead>Date</TableHead>
                          <TableHead>Actions</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {filteredTestimonies.map((testimony) => (
                          <TableRow 
                            key={testimony.id}
                            className={`${!(testimony.isRead ?? false) ? 'bg-blue-50' : ''} hover:bg-gray-50`}
                          >
                            <TableCell>
                              <Checkbox
                                checked={selectedTestimonies.has(testimony.id!)}
                                onCheckedChange={() => handleSelectTestimony(testimony.id!)}
                              />
                            </TableCell>
                            <TableCell>
                              <div className="flex items-center space-x-3">
                                <Avatar>
                                  <AvatarImage src={testimony.photo || ''} />
                                  <AvatarFallback>
                                    {testimony.isAnonymous 
                                      ? 'A' 
                                      : testimony.name.split(' ').map(n => n[0]).join('')
                                    }
                                  </AvatarFallback>
                                </Avatar>
                                <div>
                                  <p className="font-medium text-gray-900">
                                    {testimony.isAnonymous ? 'Anonymous' : testimony.name}
                                  </p>
                                  <div className="flex items-center space-x-2 mt-1">
                                    {testimony.isAnonymous && (
                                      <Badge variant="outline" className="text-xs">
                                        Anonymous
                                      </Badge>
                                    )}
                                    {(testimony.allowSharing ?? false) && (
                                      <Badge variant="secondary" className="text-xs">
                                        Shareable
                                      </Badge>
                                    )}
                                  </div>
                                </div>
                              </div>
                            </TableCell>
                            <TableCell>
                              <div className="max-w-md">
                                <p className="text-sm text-gray-600 truncate">
                                  {testimony.testimony || testimony.story || 'No testimony text'}
                                </p>
                                <Button
                                  variant="ghost"
                                  size="sm"
                                  onClick={() => toggleExpandedRow(testimony.id!)}
                                  className="mt-1 p-0 h-auto text-blue-600 hover:text-blue-800"
                                >
                                  {expandedRows.has(testimony.id!) ? 'Show less' : 'Show more'}
                                </Button>
                              </div>
                            </TableCell>
                            <TableCell>
                              <div className="flex items-center space-x-2">
                                {(testimony.isRead ?? false) ? (
                                  <Badge variant="secondary" className="text-xs">
                                    <Eye className="h-3 w-3 mr-1" />
                                    Read
                                  </Badge>
                                ) : (
                                  <Badge variant="destructive" className="text-xs">
                                    <EyeOff className="h-3 w-3 mr-1" />
                                    Unread
                                  </Badge>
                                )}
                              </div>
                            </TableCell>
                            <TableCell>
                              <div className="text-sm text-gray-600">
                                {testimony.createdAt ? (
                                  <div>
                                    <div>{format(testimony.createdAt.toDate(), 'MMM dd, yyyy')}</div>
                                    <div className="text-xs text-gray-400">
                                      {format(testimony.createdAt.toDate(), 'HH:mm')}
                                    </div>
                                  </div>
                                ) : (
                                  'N/A'
                                )}
                              </div>
                            </TableCell>
                            <TableCell>
                              <div className="flex items-center space-x-2">
                                {!(testimony.isRead ?? false) && (
                                  <Button
                                    variant="ghost"
                                    size="sm"
                                    onClick={() => handleMarkAsRead(testimony.id!)}
                                    title="Mark as read"
                                  >
                                    <Eye className="h-4 w-4" />
                                  </Button>
                                )}
                                <Button
                                  variant="ghost"
                                  size="sm"
                                  onClick={() => handleDelete(testimony.id!)}
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
                )}

                {/* Expanded Row Content */}
                {filteredTestimonies.map((testimony) => 
                  expandedRows.has(testimony.id!) && (
                    <div key={`expanded-${testimony.id}`} className="mt-4 p-4 bg-gray-50 rounded-lg">
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div>
                          <h4 className="font-medium text-gray-900 mb-2">Full Testimony</h4>
                          <p className="text-gray-700 whitespace-pre-wrap">{testimony.testimony || testimony.story || 'No testimony text'}</p>
                        </div>
                        <div>
                          <h4 className="font-medium text-gray-900 mb-2">Details</h4>
                          <div className="space-y-2 text-sm">
                            <div>
                              <span className="font-medium">Member:</span>{' '}
                              {testimony.isAnonymous ? 'Anonymous' : testimony.name}
                            </div>
                            <div>
                              <span className="font-medium">Anonymous:</span>{' '}
                              {testimony.isAnonymous ? 'Yes' : 'No'}
                            </div>
                            <div>
                              <span className="font-medium">Allow Sharing:</span>{' '}
                              {testimony.allowSharing ? 'Yes' : 'No'}
                            </div>
                            <div>
                              <span className="font-medium">Status:</span>{' '}
                              {(testimony.isRead ?? false) ? 'Read' : 'Unread'}
                            </div>
                            {testimony.photo && (
                              <div>
                                <span className="font-medium">Photo:</span>{' '}
                                <a 
                                  href={testimony.photo} 
                                  target="_blank" 
                                  rel="noopener noreferrer"
                                  className="text-blue-600 hover:underline"
                                >
                                  View Photo
                                </a>
                              </div>
                            )}
                          </div>
                        </div>
                      </div>
                    </div>
                  )
                )}
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="export-history">
            <ExportHistory testimonies={testimonies} />
          </TabsContent>
        </Tabs>
      </div>

      {/* Export Modal */}
      {showExportModal && (
        <ExportModal
          isOpen={showExportModal}
          onClose={() => setShowExportModal(false)}
          items={selectedTestimonies.size > 0 
            ? filteredTestimonies.filter(t => selectedTestimonies.has(t.id!))
            : filteredTestimonies
          }
          exportType="testimonies"
          onExportSuccess={() => {
            setShowExportModal(false);
            setSelectedTestimonies(new Set());
          }}
        />
      )}
    </DashboardLayout>
  );
} 