'use client';

import { useProtectedRoute } from '@/hooks/useProtectedRoute';
import DashboardLayout from '@/components/layout/DashboardLayout';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Users, Calendar, Image, Plus, ArrowRight, Sliders } from 'lucide-react';
import Link from 'next/link';

export default function DashboardPage() {
  const { user, loading } = useProtectedRoute();

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
      title: 'Carousel',
      value: '3',
      description: 'Homepage slides',
      icon: Sliders,
      href: '/dashboard/carousel',
    },
    {
      title: 'Leaders',
      value: '12',
      description: 'Church leaders',
      icon: Users,
      href: '/dashboard/leaders',
    },
    {
      title: 'Events',
      value: '8',
      description: 'Upcoming events',
      icon: Calendar,
      href: '/dashboard/events',
    },
    {
      title: 'Gallery',
      value: '45',
      description: 'Community photos',
      icon: Image,
      href: '/dashboard/gallery',
    },
  ];

  const quickActions = [
    {
      title: 'Manage Carousel',
      description: 'Update homepage slides',
      href: '/dashboard/carousel',
      icon: Sliders,
    },
    {
      title: 'Add New Leader',
      description: 'Add a new church leader',
      href: '/dashboard/leaders/new',
      icon: Plus,
    },
    {
      title: 'Create Event',
      description: 'Schedule a new event',
      href: '/dashboard/events/new',
      icon: Plus,
    },
    {
      title: 'Upload Photo',
      description: 'Add to community gallery',
      href: '/dashboard/gallery/new',
      icon: Plus,
    },
  ];

  return (
    <DashboardLayout>
      <div className="space-y-6">
        {/* Welcome Header */}
        <div>
          <h1 className="text-3xl font-bold text-gray-900">
            Welcome back, {user?.displayName?.split(' ')[0] || 'Admin'}!
          </h1>
          <p className="text-gray-600 mt-2">
            Manage your church content and keep your community updated.
          </p>
        </div>

        {/* Stats Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {stats.map((stat) => {
            const Icon = stat.icon;
            return (
              <Link key={stat.title} href={stat.href}>
                <Card className="hover:shadow-md transition-shadow cursor-pointer">
                  <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                    <CardTitle className="text-sm font-medium text-gray-600">
                      {stat.title}
                    </CardTitle>
                    <Icon className="h-4 w-4 text-gray-400" />
                  </CardHeader>
                  <CardContent>
                    <div className="text-2xl font-bold text-gray-900">{stat.value}</div>
                    <p className="text-xs text-gray-500">{stat.description}</p>
                  </CardContent>
                </Card>
              </Link>
            );
          })}
        </div>

        {/* Quick Actions */}
        <div>
          <h2 className="text-xl font-semibold text-gray-900 mb-4">Quick Actions</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            {quickActions.map((action) => {
              const Icon = action.icon;
              return (
                <Link key={action.title} href={action.href}>
                  <Card className="hover:shadow-md transition-shadow cursor-pointer">
                    <CardContent className="p-6">
                      <div className="flex items-center space-x-3">
                        <div className="p-2 bg-blue-100 rounded-lg">
                          <Icon className="h-5 w-5 text-blue-600" />
                        </div>
                        <div className="flex-1">
                          <h3 className="font-medium text-gray-900">{action.title}</h3>
                          <p className="text-sm text-gray-500">{action.description}</p>
                        </div>
                        <ArrowRight className="h-4 w-4 text-gray-400" />
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
          <h2 className="text-xl font-semibold text-gray-900 mb-4">Recent Activity</h2>
          <Card>
            <CardContent className="p-6">
              <div className="space-y-4">
                <div className="flex items-center space-x-3">
                  <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                  <span className="text-sm text-gray-600">
                    New carousel slide &quot;Welcome to RCCG&quot; was added
                  </span>
                  <span className="text-xs text-gray-400 ml-auto">1 hour ago</span>
                </div>
                <div className="flex items-center space-x-3">
                  <div className="w-2 h-2 bg-blue-500 rounded-full"></div>
                  <span className="text-sm text-gray-600">
                    New event &quot;Sunday Service&quot; was created
                  </span>
                  <span className="text-xs text-gray-400 ml-auto">2 hours ago</span>
                </div>
                <div className="flex items-center space-x-3">
                  <div className="w-2 h-2 bg-purple-500 rounded-full"></div>
                  <span className="text-sm text-gray-600">
                    Photo uploaded to Community Gallery
                  </span>
                  <span className="text-xs text-gray-400 ml-auto">4 hours ago</span>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </DashboardLayout>
  );
} 