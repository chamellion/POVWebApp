'use client';

import { useState, useEffect } from 'react';
import { useProtectedRoute } from '@/hooks/useProtectedRoute';
import DashboardLayout from '@/components/layout/DashboardLayout';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { 
  Plus, 
  Edit, 
  Trash2, 
  Users, 
  MoveUp, 
  MoveDown,
  GripVertical,
  Eye,
  EyeOff,
  Search,
  UserCheck,
  UserX
} from 'lucide-react';
import { toast } from 'sonner';
import { 
  Leader, 
  getLeadersByCategory, 
  deleteLeader, 
  updateLeader, 
  subscribeToLeadersByCategory,
  migrateLeadersToNewStructure
} from '@/lib/firestore';
import LeaderForm from '@/app/dashboard/leaders/LeaderForm';

type LeaderCategory = 'pastor' | 'teamLead';

const categoryConfig = {
  pastor: {
    title: 'Pastors',
    description: 'Senior pastors and pastoral staff',
    icon: '👨‍💼',
    color: 'bg-blue-100 text-blue-800',
    collection: 'pastors'
  },
  teamLead: {
    title: 'Team Leads',
    description: 'Department and ministry team leaders',
    icon: '👥',
    color: 'bg-green-100 text-green-800',
    collection: 'teamLeads'
  }
};

export default function LeadersPage() {
  const { loading } = useProtectedRoute();
  const [pastors, setPastors] = useState<Leader[]>([]);
  const [teamLeads, setTeamLeads] = useState<Leader[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [editingLeader, setEditingLeader] = useState<Leader | null>(null);
  const [activeCategory, setActiveCategory] = useState<LeaderCategory>('pastor');
  const [searchTerm, setSearchTerm] = useState('');
  const [isMigrating, setIsMigrating] = useState(false);

  // Fetch leaders on component mount
  useEffect(() => {
    const fetchLeaders = async () => {
      try {
        const [pastorsData, teamLeadsData] = await Promise.all([
          getLeadersByCategory('pastor'),
          getLeadersByCategory('teamLead')
        ]);
        
        setPastors(pastorsData);
        setTeamLeads(teamLeadsData);
      } catch (error) {
        console.error('Error fetching leaders:', error);
        toast.error('Failed to fetch leaders');
      } finally {
        setIsLoading(false);
      }
    };

    fetchLeaders();
  }, []);

  // Set up real-time listeners
  useEffect(() => {
    const unsubscribePastors = subscribeToLeadersByCategory('pastor', (data) => {
      setPastors(data);
    });

    const unsubscribeTeamLeads = subscribeToLeadersByCategory('teamLead', (data) => {
      setTeamLeads(data);
    });

    return () => {
      unsubscribePastors();
      unsubscribeTeamLeads();
    };
  }, []);

  const getLeadersByCategoryLocal = (category: LeaderCategory) => {
    return category === 'pastor' ? pastors : teamLeads;
  };

  const getFilteredLeaders = (category: LeaderCategory) => {
    const leaders = getLeadersByCategoryLocal(category);
    if (!searchTerm) return leaders.filter(leader => leader.isActive);
    
    return leaders.filter(leader => 
      leader.isActive && 
      (leader.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
       leader.role.toLowerCase().includes(searchTerm.toLowerCase()))
    );
  };

  const getCategoryStats = (category: LeaderCategory) => {
    const leaders = getLeadersByCategoryLocal(category);
    return {
      total: leaders.length,
      active: leaders.filter(leader => leader.isActive).length,
      inactive: leaders.filter(leader => !leader.isActive).length
    };
  };

  const handleEdit = (leader: Leader) => {
    setEditingLeader(leader);
    setActiveCategory(leader.category);
    setShowForm(true);
  };

  const handleDelete = async (leader: Leader) => {
    if (confirm(`Are you sure you want to delete ${leader.name}?`)) {
      try {
        await deleteLeader(leader);
        toast.success('Leader deleted successfully');
      } catch (error) {
        console.error('Error deleting leader:', error);
        toast.error('Failed to delete leader');
      }
    }
  };

  const handleToggleVisibility = async (leader: Leader) => {
    try {
      await updateLeader({ ...leader, isActive: !leader.isActive });
      toast.success(`Leader ${leader.isActive ? 'hidden' : 'shown'} successfully`);
    } catch (error) {
      console.error('Error updating leader visibility:', error);
      toast.error('Failed to update leader visibility');
    }
  };

  const handleMove = async (leader: Leader, direction: 'up' | 'down') => {
    const leaders = getLeadersByCategoryLocal(leader.category);
    const activeLeaders = leaders.filter(l => l.isActive);
    const currentIndex = activeLeaders.findIndex(l => l.id === leader.id);
    
    if (
      (direction === 'up' && currentIndex === 0) ||
      (direction === 'down' && currentIndex === activeLeaders.length - 1)
    ) {
      return;
    }

    const targetIndex = direction === 'up' ? currentIndex - 1 : currentIndex + 1;
    const targetLeader = activeLeaders[targetIndex];

    try {
      // Swap orders
      await updateLeader({ ...leader, order: targetLeader.order });
      await updateLeader({ ...targetLeader, order: leader.order });
      toast.success('Leader reordered successfully');
    } catch (error) {
      console.error('Error reordering leader:', error);
      toast.error('Failed to reorder leader');
    }
  };

  const handleFormSuccess = () => {
    setEditingLeader(null);
    setShowForm(false);
    toast.success(editingLeader ? 'Leader updated successfully' : 'Leader added successfully');
  };

  const openNewLeaderForm = (category?: LeaderCategory) => {
    setEditingLeader(null);
    if (category) {
      setActiveCategory(category);
    }
    setShowForm(true);
  };

  const handleMigration = async () => {
    if (confirm('This will migrate existing leaders from the old structure to the new one. Continue?')) {
      setIsMigrating(true);
      try {
        await migrateLeadersToNewStructure();
        toast.success('Migration completed successfully! Please refresh the page.');
        // Refresh the data
        const [pastorsData, teamLeadsData] = await Promise.all([
          getLeadersByCategory('pastor'),
          getLeadersByCategory('teamLead')
        ]);
        setPastors(pastorsData);
        setTeamLeads(teamLeadsData);
      } catch (error) {
        console.error('Migration failed:', error);
        toast.error('Migration failed. Please try again.');
      } finally {
        setIsMigrating(false);
      }
    }
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
            <h1 className="text-3xl font-bold text-gray-900">Leaders</h1>
            <p className="text-gray-600 mt-2">Manage pastors and team leads</p>
          </div>
          <div className="flex items-center space-x-2">
            <Button 
              variant="outline" 
              onClick={handleMigration}
              disabled={isMigrating}
            >
              {isMigrating ? 'Migrating...' : 'Migrate Data'}
            </Button>
            <Button onClick={() => openNewLeaderForm()}>
              <Plus className="h-4 w-4 mr-2" />
              Add Leader
            </Button>
          </div>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {Object.entries(categoryConfig).map(([category, config]) => {
            const stats = getCategoryStats(category as LeaderCategory);
            return (
              <Card key={category}>
                <CardContent className="p-6">
                  <div className="flex items-center space-x-3">
                    <div className="text-2xl">{config.icon}</div>
                    <div className="flex-1">
                      <p className="text-sm font-medium text-gray-600">{config.title}</p>
                      <div className="flex items-center space-x-4 mt-1">
                        <div className="flex items-center space-x-1">
                          <UserCheck className="h-4 w-4 text-green-600" />
                          <span className="text-lg font-bold text-gray-900">{stats.active}</span>
                        </div>
                        <div className="flex items-center space-x-1">
                          <UserX className="h-4 w-4 text-gray-400" />
                          <span className="text-sm text-gray-500">{stats.inactive}</span>
                        </div>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>

        {/* Search */}
        <div className="relative">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
          <Input
            placeholder="Search leaders by name or role..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-10"
          />
        </div>

        {/* Leaders by Category */}
        <Tabs value={activeCategory} onValueChange={(value) => setActiveCategory(value as LeaderCategory)}>
          <TabsList className="grid w-full grid-cols-2">
            {Object.entries(categoryConfig).map(([category, config]) => (
              <TabsTrigger key={category} value={category} className="flex items-center space-x-2">
                <span>{config.icon}</span>
                <span>{config.title}</span>
              </TabsTrigger>
            ))}
          </TabsList>

          {Object.entries(categoryConfig).map(([category, config]) => {
            const filteredLeaders = getFilteredLeaders(category as LeaderCategory);
            const stats = getCategoryStats(category as LeaderCategory);

            return (
              <TabsContent key={category} value={category} className="space-y-4">
                <div className="flex items-center justify-between">
                  <div>
                    <h2 className="text-xl font-semibold text-gray-900">{config.title}</h2>
                    <p className="text-gray-600">{config.description}</p>
                  </div>
                  <Button 
                    onClick={() => openNewLeaderForm(category as LeaderCategory)}
                    size="sm"
                  >
                    <Plus className="h-4 w-4 mr-2" />
                    Add {config.title.slice(0, -1)}
                  </Button>
                </div>

                {/* Active Leaders */}
                <div className="space-y-4">
                  <h3 className="text-lg font-medium text-gray-900 flex items-center space-x-2">
                    <UserCheck className="h-5 w-5 text-green-600" />
                    <span>Active {config.title} ({filteredLeaders.length})</span>
                  </h3>
                  
                  {filteredLeaders.length === 0 ? (
                    <Card>
                      <CardContent className="p-8 text-center">
                        <Users className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                        <p className="text-gray-500">
                          {searchTerm ? 'No leaders found matching your search.' : `No active ${config.title.toLowerCase()} yet.`}
                        </p>
                        <Button 
                          onClick={() => openNewLeaderForm(category as LeaderCategory)}
                          className="mt-4"
                        >
                          <Plus className="h-4 w-4 mr-2" />
                          Add First {config.title.slice(0, -1)}
                        </Button>
                      </CardContent>
                    </Card>
                  ) : (
                    <div className="grid gap-4">
                      {filteredLeaders.map((leader, index) => (
                        <Card key={leader.id} className="relative">
                          <CardContent className="p-6">
                            <div className="flex items-center justify-between">
                              <div className="flex items-center space-x-4">
                                <GripVertical className="h-4 w-4 text-gray-400" />
                                <Avatar className="h-12 w-12">
                                  <AvatarImage 
                                    src={leader.image} 
                                    alt={leader.name}
                                    onError={(e) => {
                                      const target = e.target as HTMLImageElement;
                                      target.style.display = 'none';
                                    }}
                                  />
                                  <AvatarFallback>
                                    {leader.name.split(' ').map(n => n[0]).join('')}
                                  </AvatarFallback>
                                </Avatar>
                                <div className="flex-1">
                                  <h3 className="font-semibold text-gray-900">{leader.name}</h3>
                                  <Badge variant="secondary" className={config.color}>
                                    {leader.role}
                                  </Badge>
                                  {leader.customId && (
                                    <Badge variant="outline" className="ml-2 text-xs">
                                      Rank #{leader.customId}
                                    </Badge>
                                  )}
                                  <p className="text-sm text-gray-600 mt-1 max-w-md truncate">
                                    {leader.bio}
                                  </p>
                                </div>
                              </div>
                              
                              <div className="flex items-center space-x-2">
                                {/* Reorder buttons */}
                                <Button
                                  variant="ghost"
                                  size="sm"
                                  onClick={() => handleMove(leader, 'up')}
                                  disabled={index === 0}
                                >
                                  <MoveUp className="h-4 w-4" />
                                </Button>
                                <Button
                                  variant="ghost"
                                  size="sm"
                                  onClick={() => handleMove(leader, 'down')}
                                  disabled={index === filteredLeaders.length - 1}
                                >
                                  <MoveDown className="h-4 w-4" />
                                </Button>
                                
                                {/* Action buttons */}
                                <Button
                                  variant="ghost"
                                  size="sm"
                                  onClick={() => handleToggleVisibility(leader)}
                                >
                                  <EyeOff className="h-4 w-4" />
                                </Button>
                                <Button
                                  variant="ghost"
                                  size="sm"
                                  onClick={() => handleEdit(leader)}
                                >
                                  <Edit className="h-4 w-4" />
                                </Button>
                                <Button
                                  variant="ghost"
                                  size="sm"
                                  onClick={() => handleDelete(leader)}
                                  className="text-red-600 hover:text-red-700"
                                >
                                  <Trash2 className="h-4 w-4" />
                                </Button>
                              </div>
                            </div>
                          </CardContent>
                        </Card>
                      ))}
                    </div>
                  )}
                </div>

                {/* Inactive Leaders */}
                {stats.inactive > 0 && (
                  <div className="space-y-4">
                    <h3 className="text-lg font-medium text-gray-900 flex items-center space-x-2">
                      <UserX className="h-5 w-5 text-gray-400" />
                      <span>Inactive {config.title} ({stats.inactive})</span>
                    </h3>
                    
                                         <div className="grid gap-4">
                       {getLeadersByCategoryLocal(category as LeaderCategory)
                         .filter(leader => !leader.isActive)
                        .map((leader) => (
                          <Card key={leader.id} className="relative opacity-60">
                            <CardContent className="p-4">
                              <div className="flex items-center justify-between">
                                <div className="flex items-center space-x-3">
                                  <Avatar className="h-8 w-8">
                                    <AvatarImage 
                                      src={leader.image} 
                                      alt={leader.name}
                                      onError={(e) => {
                                        const target = e.target as HTMLImageElement;
                                        target.style.display = 'none';
                                      }}
                                    />
                                    <AvatarFallback>
                                      {leader.name.split(' ').map(n => n[0]).join('')}
                                    </AvatarFallback>
                                  </Avatar>
                                  <div>
                                    <p className="font-medium text-gray-900">{leader.name}</p>
                                    <Badge variant="outline">{leader.role}</Badge>
                                    {leader.customId && (
                                      <Badge variant="outline" className="ml-1 text-xs">
                                        Rank #{leader.customId}
                                      </Badge>
                                    )}
                                  </div>
                                </div>
                                <div className="flex items-center space-x-2">
                                  <Button
                                    variant="ghost"
                                    size="sm"
                                    onClick={() => handleToggleVisibility(leader)}
                                  >
                                    <Eye className="h-4 w-4" />
                                  </Button>
                                  <Button
                                    variant="ghost"
                                    size="sm"
                                    onClick={() => handleEdit(leader)}
                                  >
                                    <Edit className="h-4 w-4" />
                                  </Button>
                                </div>
                              </div>
                            </CardContent>
                          </Card>
                        ))}
                    </div>
                  </div>
                )}
              </TabsContent>
            );
          })}
        </Tabs>

        {/* Leader Form Modal */}
        {showForm && (
          <LeaderForm
            leader={editingLeader}
            defaultCategory={activeCategory}
            onSuccess={handleFormSuccess}
            onCancel={() => {
              setShowForm(false);
              setEditingLeader(null);
            }}
          />
        )}
      </div>
    </DashboardLayout>
  );
} 