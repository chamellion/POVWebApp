'use client';

import { useProtectedRoute } from '@/hooks/useProtectedRoute';
import DashboardLayout from '@/components/layout/DashboardLayout';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { 
  Users, 
  Calendar, 
  Image, 
  ArrowRight, 
  Sliders, 
  MessageSquare, 
  Heart, 
  Mail,
  Layout,
  TrendingUp,
  Activity,
  Clock,
  AlertCircle,
  CheckCircle
} from 'lucide-react';
import Link from 'next/link';
import { useCollectionCounts } from '@/hooks/useCollectionCount';
import { useRecentActivity } from '@/hooks/useRecentActivity';
import { getRelativeTime } from '@/lib/utils/timeUtils';

export default function DashboardPage() {
  const { user, loading } = useProtectedRoute();
  const { counts, loading: countsLoading, error: countsError } = useCollectionCounts();
  const { activities, loading: activitiesLoading, error: activitiesError } = useRecentActivity();

  if (loading) {
    return (
      <DashboardLayout>
        <div className="flex items-center justify-center h-64">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
        </div>
      </DashboardLayout>
    );
  }

  const stats = [
    {
      title: 'Carousel Slides',
      value: countsLoading ? '...' : counts.carousel.toString(),
      description: 'Homepage slides',
      icon: Sliders,
      href: '/dashboard/carousel',
      color: 'bg-blue-500',
      textColor: 'text-blue-500',
    },
    {
      title: 'Church Leaders',
      value: countsLoading ? '...' : counts.leaders.toString(),
      description: 'Pastors and leaders',
      icon: Users,
      href: '/dashboard/leaders',
      color: 'bg-green-500',
      textColor: 'text-green-500',
    },
    {
      title: 'Events',
      value: countsLoading ? '...' : counts.events.toString(),
      description: 'Upcoming events',
      icon: Calendar,
      href: '/dashboard/events',
      color: 'bg-purple-500',
      textColor: 'text-purple-500',
    },
    {
      title: 'Gallery Items',
      value: countsLoading ? '...' : counts.gallery.toString(),
      description: 'Community photos',
      icon: Image,
      href: '/dashboard/gallery',
      color: 'bg-orange-500',
      textColor: 'text-orange-500',
    },
    {
      title: 'Testimonies',
      value: countsLoading ? '...' : counts.testimonies.toString(),
      description: 'Member stories',
      icon: MessageSquare,
      href: '/dashboard/testimonies',
      color: 'bg-indigo-500',
      textColor: 'text-indigo-500',
    },
    {
      title: 'Prayer Requests',
      value: countsLoading ? '...' : counts.prayerRequests.toString(),
      description: 'Prayer needs',
      icon: Heart,
      href: '/dashboard/prayer-requests',
      color: 'bg-red-500',
      textColor: 'text-red-500',
    },
    {
      title: 'Newsletter Signups',
      value: countsLoading ? '...' : counts.newsletterSignups.toString(),
      description: 'Subscribers',
      icon: Mail,
      href: '/dashboard/newsletter',
      color: 'bg-teal-500',
      textColor: 'text-teal-500',
    },
  ];

  const quickActions = [
    {
      title: 'Manage Carousel',
      description: 'Update homepage slides',
      href: '/dashboard/carousel',
      icon: Sliders,
      color: 'bg-blue-100 text-blue-600',
    },
    {
      title: 'Manage Leaders',
      description: 'Update church leadership',
      href: '/dashboard/leaders',
      icon: Users,
      color: 'bg-green-100 text-green-600',
    },
    {
      title: 'Manage Events',
      description: 'Schedule and update events',
      href: '/dashboard/events',
      icon: Calendar,
      color: 'bg-purple-100 text-purple-600',
    },
    {
      title: 'Manage Gallery',
      description: 'Upload and organize photos',
      href: '/dashboard/gallery',
      icon: Image,
      color: 'bg-orange-100 text-orange-600',
    },
    {
      title: 'View Testimonies',
      description: 'Read member stories',
      href: '/dashboard/testimonies',
      icon: MessageSquare,
      color: 'bg-indigo-100 text-indigo-600',
    },
    {
      title: 'Prayer Requests',
      description: 'Review prayer needs',
      href: '/dashboard/prayer-requests',
      icon: Heart,
      color: 'bg-red-100 text-red-600',
    },
  ];

  const getCollectionIcon = (collectionName: string) => {
    switch (collectionName) {
      case 'carousel': return <Sliders className="h-4 w-4" />;
      case 'events': return <Calendar className="h-4 w-4" />;
      case 'testimonies': return <MessageSquare className="h-4 w-4" />;
      case 'prayerRequests': return <Heart className="h-4 w-4" />;
      case 'gallery': return <Image className="h-4 w-4" />;
      default: return <Activity className="h-4 w-4" />;
    }
  };

  const getCollectionColor = (collectionName: string) => {
    switch (collectionName) {
      case 'carousel': return 'bg-blue-100 text-blue-800';
      case 'events': return 'bg-purple-100 text-purple-800';
      case 'testimonies': return 'bg-indigo-100 text-indigo-800';
      case 'prayerRequests': return 'bg-red-100 text-red-800';
      case 'gallery': return 'bg-orange-100 text-orange-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  return (
    <DashboardLayout>
      <div className="space-y-8">
        {/* Welcome Header */}
        <div className="bg-gradient-to-r from-blue-600 to-purple-600 rounded-xl p-8 text-white">
          <div className="flex items-center space-x-3 mb-4">
            <Layout className="h-8 w-8" />
            <h1 className="text-3xl font-bold">
              Welcome back, {user?.displayName?.split(' ')[0] || 'Admin'}!
            </h1>
          </div>
          <p className="text-blue-100 text-lg">
            Manage your church content and keep your community updated.
          </p>
          <div className="mt-4 flex items-center space-x-2 text-blue-100">
            <Clock className="h-4 w-4" />
            <span>Last updated: {new Date().toLocaleDateString()}</span>
          </div>
        </div>

        {/* Error Handling */}
        {countsError && (
          <Card className="border-red-200 bg-red-50">
            <CardContent className="p-4">
              <div className="flex items-center space-x-2 text-red-700">
                <AlertCircle className="h-5 w-5" />
                <span>Error loading dashboard data: {countsError}</span>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Stats Grid */}
        <div>
          <div className="flex items-center space-x-2 mb-6">
            <TrendingUp className="h-6 w-6 text-gray-600" />
            <h2 className="text-2xl font-bold text-gray-900">Overview Statistics</h2>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            {stats.map((stat) => {
              const Icon = stat.icon;
              return (
                <Link key={stat.title} href={stat.href}>
                  <Card className="hover:shadow-lg transition-all duration-200 cursor-pointer border-0 bg-white shadow-sm hover:shadow-md">
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                      <CardTitle className="text-sm font-medium text-gray-600">
                        {stat.title}
                      </CardTitle>
                      <div className={`p-2 rounded-lg ${stat.color}`}>
                        <Icon className="h-4 w-4 text-white" />
                      </div>
                    </CardHeader>
                    <CardContent>
                      <div className="text-3xl font-bold text-gray-900 mb-1">
                        {countsLoading ? (
                          <div className="animate-pulse bg-gray-200 h-8 w-16 rounded"></div>
                        ) : (
                          stat.value
                        )}
                      </div>
                      <p className="text-xs text-gray-500">{stat.description}</p>
                    </CardContent>
                  </Card>
                </Link>
              );
            })}
          </div>
        </div>

        {/* Quick Actions */}
        <div>
          <div className="flex items-center space-x-2 mb-6">
            <Activity className="h-6 w-6 text-gray-600" />
            <h2 className="text-2xl font-bold text-gray-900">Quick Actions</h2>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {quickActions.map((action) => {
              const Icon = action.icon;
              return (
                <Link key={action.title} href={action.href}>
                  <Card className="hover:shadow-lg transition-all duration-200 cursor-pointer border-0 bg-white shadow-sm hover:shadow-md group">
                    <CardContent className="p-6">
                      <div className="flex items-center space-x-4">
                        <div className={`p-3 rounded-lg ${action.color} group-hover:scale-110 transition-transform duration-200`}>
                          <Icon className="h-6 w-6" />
                        </div>
                        <div className="flex-1">
                          <h3 className="font-semibold text-gray-900 group-hover:text-blue-600 transition-colors">
                            {action.title}
                          </h3>
                          <p className="text-sm text-gray-500">{action.description}</p>
                        </div>
                        <ArrowRight className="h-4 w-4 text-gray-400 group-hover:text-blue-600 group-hover:translate-x-1 transition-all duration-200" />
                      </div>
                    </CardContent>
                  </Card>
                </Link>
              );
            })}
          </div>
        </div>

        {/* Recent Activity */}
        <div>
          <div className="flex items-center space-x-2 mb-6">
            <Clock className="h-6 w-6 text-gray-600" />
            <h2 className="text-2xl font-bold text-gray-900">Recent Activity</h2>
          </div>
          
          <Card className="border-0 bg-white shadow-sm">
            <CardContent className="p-6">
              {activitiesLoading ? (
                <div className="space-y-4">
                  {[...Array(5)].map((_, i) => (
                    <div key={i} className="flex items-center space-x-3">
                      <div className="animate-pulse bg-gray-200 rounded-full h-2 w-2"></div>
                      <div className="animate-pulse bg-gray-200 h-4 flex-1 rounded"></div>
                      <div className="animate-pulse bg-gray-200 h-3 w-20 rounded"></div>
                    </div>
                  ))}
                </div>
              ) : activitiesError ? (
                <div className="text-center py-8 text-gray-500">
                  <AlertCircle className="h-12 w-12 mx-auto mb-4 text-gray-300" />
                  <p>Failed to load recent activity</p>
                </div>
              ) : activities.length === 0 ? (
                <div className="text-center py-8 text-gray-500">
                  <Activity className="h-12 w-12 mx-auto mb-4 text-gray-300" />
                  <p>No recent activity</p>
                </div>
              ) : (
                <div className="space-y-4">
                  {activities.map((activity) => (
                    <div key={activity.id} className="flex items-center space-x-3 p-3 rounded-lg hover:bg-gray-50 transition-colors">
                      <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                      <div className="flex-1">
                        <div className="flex items-center space-x-2">
                          <Badge 
                            variant="secondary" 
                            className={`text-xs ${getCollectionColor(activity.collection)}`}
                          >
                            {getCollectionIcon(activity.collection)}
                            <span className="ml-1 capitalize">{activity.collection.replace(/([A-Z])/g, ' $1').trim()}</span>
                          </Badge>
                                                     <span className="text-sm text-gray-600">
                             {activity.description} &quot;{activity.title}&quot; was added
                           </span>
                        </div>
                      </div>
                      <span className="text-xs text-gray-400 whitespace-nowrap">
                        {getRelativeTime(activity.timestamp)}
                      </span>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </div>

        {/* System Status */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <Card className="border-0 bg-white shadow-sm">
            <CardContent className="p-6">
              <div className="flex items-center space-x-3">
                <CheckCircle className="h-8 w-8 text-green-500" />
                <div>
                  <h3 className="font-semibold text-gray-900">System Status</h3>
                  <p className="text-sm text-gray-500">All systems operational</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="border-0 bg-white shadow-sm">
            <CardContent className="p-6">
              <div className="flex items-center space-x-3">
                <Users className="h-8 w-8 text-blue-500" />
                <div>
                  <h3 className="font-semibold text-gray-900">Active Users</h3>
                  <p className="text-sm text-gray-500">You are currently online</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="border-0 bg-white shadow-sm">
            <CardContent className="p-6">
              <div className="flex items-center space-x-3">
                <Clock className="h-8 w-8 text-purple-500" />
                <div>
                  <h3 className="font-semibold text-gray-900">Last Backup</h3>
                  <p className="text-sm text-gray-500">Today at 2:00 AM</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </DashboardLayout>
  );
} 