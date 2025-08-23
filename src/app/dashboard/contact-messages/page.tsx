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
  MessageSquare,
  Mail,
  Phone
} from 'lucide-react';
import { toast } from 'sonner';
import { format } from 'date-fns';
import { 
  ContactMessage, 
  getContactMessagesWithFilters, 
  deleteDocument, 
  contactMessagesCollection,
  markContactMessageAsRead,
  markMultipleContactMessagesAsRead,
  subscribeToContactMessages,
  getUnreadContactMessagesCount
} from '@/lib/firestore';
import { logDelete, logUpdate } from '@/lib/firebase/logActivity';
import { useAuth } from '@/contexts/AuthContext';
import ExportModal from '@/components/ui/ExportModal';
import ExportHistory from '@/components/ui/ExportHistory';

type FilterType = 'all' | 'new' | 'read';

export default function ContactMessagesPage() {
  const { loading } = useProtectedRoute();
  const { user } = useAuth();
  
  const [contactMessages, setContactMessages] = useState<ContactMessage[]>([]);
  const [filteredContactMessages, setFilteredContactMessages] = useState<ContactMessage[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [showExportModal, setShowExportModal] = useState(false);
  const [selectedMessages, setSelectedMessages] = useState<Set<string>>(new Set());
  const [searchTerm, setSearchTerm] = useState('');
  const [filterType, setFilterType] = useState<FilterType>('all');
  const [dateFrom, setDateFrom] = useState('');
  const [dateTo, setDateTo] = useState('');
  const [expandedRows, setExpandedRows] = useState<Set<string>>(new Set());

  useEffect(() => {
    // Only set up listeners if user is authenticated
    if (!user) {
      setContactMessages([]);
      setFilteredContactMessages([]);
      setIsLoading(false);
      return;
    }

    const fetchData = async () => {
      try {
        const data = await getContactMessagesWithFilters();
        setContactMessages(data);
        setFilteredContactMessages(data);
        
        // Get unread count
        await getUnreadContactMessagesCount();
      } catch (error) {
        console.error('Failed to fetch contact messages:', error);
        
        // Provide more specific error messages
        if (error instanceof Error) {
          if (error.message.includes('permission')) {
            toast.error('Permission denied: Cannot access contact messages');
          } else if (error.message.includes('network')) {
            toast.error('Network error: Please check your connection');
          } else {
            toast.error(`Failed to fetch contact messages: ${error.message}`);
          }
        } else {
          toast.error('Failed to fetch contact messages');
        }
      } finally {
        setIsLoading(false);
      }
    };

    fetchData();

    // Set up real-time listener
    const unsubscribe = subscribeToContactMessages((data) => {
      setContactMessages(data);
      setFilteredContactMessages(data);
    });

    return () => unsubscribe();
  }, [user]);

  useEffect(() => {
    let filtered = contactMessages;

    // Apply search filter
    if (searchTerm) {
      filtered = filtered.filter(message => 
        (message.name && message.name.toLowerCase().includes(searchTerm.toLowerCase())) ||
        (message.email && message.email.toLowerCase().includes(searchTerm.toLowerCase())) ||
        (message.phone && message.phone.toLowerCase().includes(searchTerm.toLowerCase())) ||
        (message.subject && message.subject.toLowerCase().includes(searchTerm.toLowerCase())) ||
        (message.message && message.message.toLowerCase().includes(searchTerm.toLowerCase()))
      );
    }

    // Apply type filter
    if (filterType !== 'all') {
      switch (filterType) {
        case 'new':
          filtered = filtered.filter(message => message.status === 'new');
          break;
        case 'read':
          filtered = filtered.filter(message => message.status === 'read');
          break;
      }
    }

    // Apply date filter
    if (dateFrom || dateTo) {
      filtered = filtered.filter(message => {
        if (!message.createdAt) return false;
        const messageDate = message.createdAt.toDate();
        const fromDate = dateFrom ? new Date(dateFrom) : null;
        const endDate = dateTo ? new Date(dateTo) : null;
        
        if (fromDate && messageDate < fromDate) return false;
        if (endDate && messageDate > endDate) return false;
        
        return true;
      });
    }

    setFilteredContactMessages(filtered);
  }, [contactMessages, searchTerm, filterType, dateFrom, dateTo]);

  const handleSelectAll = (checked: boolean) => {
    if (checked) {
      setSelectedMessages(new Set(filteredContactMessages.map(m => m.id!)));
    } else {
      setSelectedMessages(new Set());
    }
  };

  const handleSelectMessage = (messageId: string, checked: boolean) => {
    const newSelected = new Set(selectedMessages);
    if (checked) {
      newSelected.add(messageId);
    } else {
      newSelected.delete(messageId);
    }
    setSelectedMessages(newSelected);
  };

  const handleMarkAsRead = async (messageId: string) => {
    if (!user) return;
    
    try {
      // Find the message to get its title for logging
      const message = contactMessages.find(m => m.id === messageId);
      const title = message?.subject || message?.name || 'Contact Message';
      
      await markContactMessageAsRead(messageId, user.uid, user.email || '');
      
      // Log the update activity
      await logUpdate('contactMessages', title, user.uid);
      
      toast.success('Contact message marked as read');
    } catch (error) {
      console.error('Failed to mark as read:', error);
      toast.error('Failed to mark as read');
    }
  };

  const handleMarkMultipleAsRead = async () => {
    if (!user || selectedMessages.size === 0) return;
    
    try {
      await markMultipleContactMessagesAsRead(
        Array.from(selectedMessages), 
        user.uid, 
        user.email || ''
      );
      
      // Log the bulk update activity
      await logUpdate('contactMessages', `${selectedMessages.size} contact messages`, user.uid, {
        action: 'bulk_mark_read',
        count: selectedMessages.size
      });
      
      toast.success(`${selectedMessages.size} contact message(s) marked as read`);
      setSelectedMessages(new Set());
    } catch (error) {
      console.error('Failed to mark multiple as read:', error);
      toast.error('Failed to mark as read');
    }
  };

  const handleDelete = async (messageId: string) => {
    if (!confirm('Are you sure you want to delete this contact message?')) return;
    
    try {
      // Find the message to get its title for logging
      const message = contactMessages.find(m => m.id === messageId);
      const title = message?.subject || message?.name || 'Contact Message';
      
      await deleteDocument(contactMessagesCollection, messageId);
      
      // Log the deletion activity
      await logDelete('contactMessages', title, user?.uid);
      
      toast.success('Contact message deleted');
    } catch (error) {
      console.error('Failed to delete:', error);
      toast.error('Failed to delete contact message');
    }
  };

  const handleDeleteMultiple = async () => {
    if (selectedMessages.size === 0) return;
    
    if (!confirm(`Are you sure you want to delete ${selectedMessages.size} contact message(s)?`)) return;
    
    try {
      const promises = Array.from(selectedMessages).map(id => 
        deleteDocument(contactMessagesCollection, id)
      );
      await Promise.all(promises);
      
      // Log the bulk deletion activity
      await logDelete('contactMessages', `${selectedMessages.size} contact messages`, user?.uid, {
        action: 'bulk_delete',
        count: selectedMessages.size
      });
      
      toast.success(`${selectedMessages.size} contact message(s) deleted`);
      setSelectedMessages(new Set());
    } catch (error) {
      console.error('Failed to delete multiple:', error);
      toast.error('Failed to delete contact messages');
    }
  };

  const toggleExpanded = (messageId: string) => {
    const newExpanded = new Set(expandedRows);
    if (newExpanded.has(messageId)) {
      newExpanded.delete(messageId);
    } else {
      newExpanded.add(messageId);
    }
    setExpandedRows(newExpanded);
  };

  const getStats = () => {
    const total = contactMessages.length;
    const unread = contactMessages.filter(m => m.status === 'new').length;
    const read = total - unread;
    
    return { total, unread, read };
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
            <h1 className="text-3xl font-bold tracking-tight">Contact Messages</h1>
            <p className="text-muted-foreground">
              Manage contact messages submitted through the website
            </p>
          </div>
          <div className="flex gap-2">
            {selectedMessages.size > 0 && (
              <>
                <Button
                  variant="outline"
                  onClick={handleMarkMultipleAsRead}
                  className="flex items-center gap-2"
                >
                  <Eye className="h-4 w-4" />
                  Mark as Read ({selectedMessages.size})
                </Button>
                <Button
                  variant="destructive"
                  onClick={handleDeleteMultiple}
                  className="flex items-center gap-2"
                >
                  <Trash2 className="h-4 w-4" />
                  Delete ({selectedMessages.size})
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
        <div className="grid gap-4 md:grid-cols-3">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total Messages</CardTitle>
              <MessageSquare className="h-4 w-4 text-muted-foreground" />
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
              <CardTitle className="text-sm font-medium">Read</CardTitle>
              <Eye className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-blue-600">{stats.read}</div>
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
                    placeholder="Search messages..."
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
                    <SelectItem value="all">All Messages</SelectItem>
                    <SelectItem value="new">Unread Only</SelectItem>
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

        {/* Contact Messages Table */}
        <Card>
          <CardHeader>
            <CardTitle>Contact Messages ({filteredContactMessages.length})</CardTitle>
          </CardHeader>
          <CardContent>
            {isLoading ? (
              <div className="flex items-center justify-center py-8">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-gray-900"></div>
              </div>
            ) : filteredContactMessages.length === 0 ? (
              <div className="text-center py-8 text-muted-foreground">
                <MessageSquare className="h-12 w-12 mx-auto mb-4 text-muted-foreground" />
                <p className="text-lg font-medium">No contact messages found</p>
                <p className="text-sm">
                  Contact messages are submitted via the website. Admins can manage them here.
                </p>
              </div>
            ) : (
              <div className="space-y-4">
                {/* Select All */}
                <div className="flex items-center space-x-2">
                  <Checkbox
                    id="select-all"
                    checked={selectedMessages.size === filteredContactMessages.length}
                    onCheckedChange={handleSelectAll}
                  />
                  <Label htmlFor="select-all">Select All</Label>
                </div>

                {/* Table */}
                <div className="border rounded-lg overflow-hidden">
                  <div className="overflow-x-auto min-w-full">
                    <div className="inline-block min-w-full align-middle">
                      <Table className="min-w-full">
                        <TableHeader>
                          <TableRow>
                            <TableHead className="w-12 px-3 py-3"></TableHead>
                            <TableHead className="w-48 px-3 py-3">Contact</TableHead>
                            <TableHead className="w-64 px-3 py-3">Subject</TableHead>
                            <TableHead className="w-80 px-3 py-3">Message</TableHead>
                            <TableHead className="w-32 px-3 py-3">Preferred Contact</TableHead>
                            <TableHead className="w-24 px-3 py-3">Created</TableHead>
                            <TableHead className="w-20 px-3 py-3">Status</TableHead>
                            <TableHead className="w-32 px-3 py-3">Actions</TableHead>
                          </TableRow>
                        </TableHeader>
                        <TableBody>
                          {filteredContactMessages.map((message) => (
                            <TableRow key={message.id} className={message.status === 'new' ? 'bg-orange-50' : ''}>
                              <TableCell className="px-3 py-3">
                                <Checkbox
                                  checked={selectedMessages.has(message.id!)}
                                  onCheckedChange={(checked) => 
                                    handleSelectMessage(message.id!, checked as boolean)
                                  }
                                />
                              </TableCell>
                              <TableCell className="px-3 py-3">
                                <div className="flex items-center gap-2">
                                  <Avatar className="h-6 w-6 flex-shrink-0">
                                    <AvatarFallback className="text-xs">
                                      {message.name.charAt(0).toUpperCase()}
                                    </AvatarFallback>
                                  </Avatar>
                                  <div className="min-w-0 flex-1">
                                    <div className="font-medium truncate">{message.name}</div>
                                    <div className="text-sm text-muted-foreground truncate">{message.email}</div>
                                    {message.phone && (
                                      <div className="text-xs text-muted-foreground truncate">{message.phone}</div>
                                    )}
                                  </div>
                                </div>
                              </TableCell>
                              <TableCell className="px-3 py-3">
                                <div className="max-w-full">
                                  <div className="truncate font-medium">
                                    {message.subject}
                                  </div>
                                </div>
                              </TableCell>
                              <TableCell className="px-3 py-3">
                                <div className="max-w-full">
                                  <div 
                                    className="cursor-pointer hover:text-blue-600 truncate"
                                    onClick={() => toggleExpanded(message.id!)}
                                  >
                                    {message.message.length > 80 
                                      ? `${message.message.substring(0, 80)}...` 
                                      : message.message
                                    }
                                  </div>
                                  {expandedRows.has(message.id!) && (
                                    <div className="mt-2 p-3 bg-gray-50 rounded text-sm whitespace-pre-wrap">
                                      {message.message}
                                    </div>
                                  )}
                                </div>
                              </TableCell>
                              <TableCell className="px-3 py-3">
                                <div className="flex items-center gap-1">
                                  {message.preferredContactMethod === 'email' && <Mail className="h-4 w-4 text-blue-600 flex-shrink-0" />}
                                  {message.preferredContactMethod === 'phone' && <Phone className="h-4 w-4 text-green-600 flex-shrink-0" />}
                                  {message.preferredContactMethod === 'either' && (
                                    <>
                                      <Mail className="h-4 w-4 text-blue-600 flex-shrink-0" />
                                      <Phone className="h-4 w-4 text-green-600 flex-shrink-0" />
                                    </>
                                  )}
                                  <span className="text-xs capitalize truncate">{message.preferredContactMethod}</span>
                                </div>
                              </TableCell>
                              <TableCell className="px-3 py-3">
                                {message.createdAt ? (
                                  <span className="text-sm">
                                    {format(message.createdAt.toDate(), 'MMM d, yyyy')}
                                  </span>
                                ) : (
                                  <span className="text-sm text-muted-foreground">—</span>
                                )}
                              </TableCell>
                              <TableCell className="px-3 py-3">
                                <Badge variant={message.status === 'read' ? 'default' : 'destructive'}>
                                  {message.status === 'read' ? 'Read' : 'Unread'}
                                </Badge>
                              </TableCell>
                              <TableCell className="px-3 py-3">
                                <div className="flex items-center gap-1">
                                  {message.status === 'new' ? (
                                    <Button
                                      variant="ghost"
                                      size="sm"
                                      onClick={() => handleMarkAsRead(message.id!)}
                                      className="h-8 w-8 p-0"
                                      title="Mark as read"
                                    >
                                      <Eye className="h-4 w-4" />
                                    </Button>
                                  ) : (
                                    <Button
                                      variant="ghost"
                                      size="sm"
                                      onClick={() => handleMarkAsRead(message.id!)}
                                      className="h-8 w-8 p-0"
                                      title="Mark as unread"
                                    >
                                      <EyeOff className="h-4 w-4" />
                                    </Button>
                                  )}
                                  <Button
                                    variant="ghost"
                                    size="sm"
                                    onClick={() => handleDelete(message.id!)}
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
                </div>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Export History */}
        <ExportHistory 
          collection="contact_messages_exports"
          contactMessages={contactMessages}
        />
      </div>

      {/* Export Modal */}
      <ExportModal
        isOpen={showExportModal}
        onClose={() => setShowExportModal(false)}
        items={selectedMessages.size > 0 
          ? filteredContactMessages.filter(m => selectedMessages.has(m.id!))
          : filteredContactMessages
        }
        exportType="contact_messages"
        onExportSuccess={() => {
          setShowExportModal(false);
          setSelectedMessages(new Set());
        }}
      />
    </DashboardLayout>
  );
}
