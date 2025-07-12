'use client';

import { useState, useEffect } from 'react';
import { useProtectedRoute } from '@/hooks/useProtectedRoute';
import DashboardLayout from '@/components/layout/DashboardLayout';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Plus, Edit, Trash2, MessageSquare } from 'lucide-react';
import { toast } from 'sonner';
import { Testimony, getDocuments, deleteDocument, testimoniesCollection } from '@/lib/firestore';
import TestimonyForm from './TestimonyForm';

export default function TestimoniesPage() {
  const { loading } = useProtectedRoute();
  const [testimonies, setTestimonies] = useState<Testimony[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [editingTestimony, setEditingTestimony] = useState<Testimony | null>(null);

  useEffect(() => {
    const fetchTestimonies = async () => {
      try {
        const data = await getDocuments<Testimony>(testimoniesCollection);
        setTestimonies(data);
      } catch {
        toast.error('Failed to fetch testimonies');
      } finally {
        setIsLoading(false);
      }
    };

    fetchTestimonies();
  }, []);

  const handleEdit = (testimony: Testimony) => {
    setEditingTestimony(testimony);
    setShowForm(true);
  };

  const handleDelete = async (id: string) => {
    if (confirm('Are you sure you want to delete this testimony?')) {
      try {
        await deleteDocument(testimoniesCollection, id);
        setTestimonies(testimonies.filter(testimony => testimony.id !== id));
        toast.success('Testimony deleted successfully');
      } catch {
        toast.error('Failed to delete testimony');
      }
    }
  };

  const handleFormSuccess = (testimony: Testimony) => {
    if (editingTestimony) {
      setTestimonies(testimonies.map(t => t.id === testimony.id ? testimony : t));
      setEditingTestimony(null);
    } else {
      setTestimonies([testimony, ...testimonies]);
    }
    setShowForm(false);
    toast.success(editingTestimony ? 'Testimony updated successfully' : 'Testimony added successfully');
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
            <h1 className="text-3xl font-bold text-gray-900">Testimonies</h1>
            <p className="text-gray-600 mt-2">Manage member testimonies and stories</p>
          </div>
          <Button onClick={() => setShowForm(true)}>
            <Plus className="h-4 w-4 mr-2" />
            Add Testimony
          </Button>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <Card>
            <CardContent className="p-6">
              <div className="flex items-center space-x-3">
                <div className="p-2 bg-blue-100 rounded-lg">
                  <MessageSquare className="h-6 w-6 text-blue-600" />
                </div>
                <div>
                  <p className="text-sm font-medium text-gray-600">Total Testimonies</p>
                  <p className="text-2xl font-bold text-gray-900">{testimonies.length}</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Testimonies Table */}
        <Card>
          <CardHeader>
            <CardTitle>All Testimonies</CardTitle>
          </CardHeader>
          <CardContent>
            {testimonies.length === 0 ? (
              <div className="text-center py-8">
                <MessageSquare className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                <h3 className="text-lg font-medium text-gray-900 mb-2">No testimonies yet</h3>
                <p className="text-gray-500 mb-4">Get started by adding your first member testimony.</p>
                <Button onClick={() => setShowForm(true)}>
                  <Plus className="h-4 w-4 mr-2" />
                  Add Testimony
                </Button>
              </div>
            ) : (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Member</TableHead>
                    <TableHead>Story</TableHead>
                    <TableHead>Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {testimonies.map((testimony) => (
                    <TableRow key={testimony.id}>
                      <TableCell>
                        <div className="flex items-center space-x-3">
                          <Avatar>
                            <AvatarImage src={testimony.photo || ''} />
                            <AvatarFallback>
                              {testimony.name.split(' ').map(n => n[0]).join('')}
                            </AvatarFallback>
                          </Avatar>
                          <div>
                            <p className="font-medium text-gray-900">{testimony.name}</p>
                          </div>
                        </div>
                      </TableCell>
                      <TableCell>
                        <p className="text-sm text-gray-600 max-w-md truncate">
                          {testimony.story}
                        </p>
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center space-x-2">
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => handleEdit(testimony)}
                          >
                            <Edit className="h-4 w-4" />
                          </Button>
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
            )}
          </CardContent>
        </Card>
      </div>

      {/* Form Dialog */}
      {showForm && (
        <TestimonyForm
          testimony={editingTestimony}
          onSuccess={handleFormSuccess}
          onCancel={() => {
            setShowForm(false);
            setEditingTestimony(null);
          }}
        />
      )}
    </DashboardLayout>
  );
} 