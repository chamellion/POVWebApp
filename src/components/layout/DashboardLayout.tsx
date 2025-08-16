'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useAuth } from '@/contexts/AuthContext';
import { Button } from '@/components/ui/button';
import { Sheet, SheetContent, SheetTrigger } from '@/components/ui/sheet';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuLabel, DropdownMenuSeparator, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import { Badge } from '@/components/ui/badge';
import { 
  Menu, 
  Users, 
  Calendar, 
  Image, 
  MessageSquare, 
  Settings, 
  LogOut, 
  User,
  ChevronDown,
  Sliders,
  Mail,
  Bell,
  Heart,
  Layout
} from 'lucide-react';
import { toast } from 'sonner';
import { NewsletterSignup, subscribeToNewsletterSignups, subscribeToTestimonies, subscribeToPrayerRequests } from '@/lib/firestore';

interface SidebarItem {
  title: string;
  href: string;
  icon: React.ComponentType<{ className?: string }>;
  badge?: number;
}

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [newsletterSignups, setNewsletterSignups] = useState<NewsletterSignup[]>([]);
  const [lastViewedNewsletterTimestamp, setLastViewedNewsletterTimestamp] = useState<number>(0);
  const [unreadTestimoniesCount, setUnreadTestimoniesCount] = useState<number>(0);
  const [unreadPrayerRequestsCount, setUnreadPrayerRequestsCount] = useState<number>(0);
  const pathname = usePathname();
  const { user, logout } = useAuth();

  useEffect(() => {
    // Only set up listeners if user is authenticated
    if (!user) {
      // Clear all data when user is not authenticated
      setNewsletterSignups([]);
      setUnreadTestimoniesCount(0);
      setUnreadPrayerRequestsCount(0);
      return;
    }

    // Load last viewed timestamp from localStorage
    const stored = localStorage.getItem('lastViewedNewsletterTimestamp');
    if (stored) {
      setLastViewedNewsletterTimestamp(parseInt(stored));
    }

    // Set up real-time listener for newsletter signups
    const unsubscribe = subscribeToNewsletterSignups((data) => {
      setNewsletterSignups(data);
      
      // Check for new signups and show notification
      const newSignups = data.filter(signup => 
        signup.createdAt && signup.createdAt.toMillis() > lastViewedNewsletterTimestamp
      );
      
      if (newSignups.length > 0 && lastViewedNewsletterTimestamp > 0) {
        toast.success(`${newSignups.length} new newsletter signup${newSignups.length > 1 ? 's' : ''}!`);
      }
    });

    // Set up real-time listener for testimonies
    const unsubscribeTestimonies = subscribeToTestimonies((data) => {
      const unreadCount = data.filter(testimony => !testimony.isRead).length;
      setUnreadTestimoniesCount(unreadCount);
    });

    // Set up real-time listener for prayer requests
    const unsubscribePrayerRequests = subscribeToPrayerRequests((data) => {
      const unreadCount = data.filter(request => !request.isRead).length;
      setUnreadPrayerRequestsCount(unreadCount);
    });

    return () => {
      unsubscribe();
      unsubscribeTestimonies();
      unsubscribePrayerRequests();
    };
  }, [user, lastViewedNewsletterTimestamp]);

  const getNewSignupsCount = () => {
    return newsletterSignups.filter(signup => 
      signup.createdAt && signup.createdAt.toMillis() > lastViewedNewsletterTimestamp
    ).length;
  };

  const sidebarItems: SidebarItem[] = [
    { title: 'Dashboard', href: '/dashboard', icon: Layout },
    { title: 'Carousel', href: '/dashboard/carousel', icon: Sliders },
    { title: 'Leaders', href: '/dashboard/leaders', icon: Users },
    { title: 'Events', href: '/dashboard/events', icon: Calendar },
    { title: 'Gallery', href: '/dashboard/gallery', icon: Image },
    { 
      title: 'Testimonies', 
      href: '/dashboard/testimonies', 
      icon: MessageSquare,
      badge: unreadTestimoniesCount
    },
    { 
      title: 'Prayer Requests', 
      href: '/dashboard/prayer-requests', 
      icon: Heart,
      badge: unreadPrayerRequestsCount
    },
    { 
      title: 'Newsletter', 
      href: '/dashboard/newsletter', 
      icon: Mail,
      badge: getNewSignupsCount()
    },
    { title: 'Settings', href: '/dashboard/settings', icon: Settings },
  ];

  const handleLogout = async () => {
    try {
      await logout();
      toast.success('Logged out successfully');
    } catch {
      toast.error('Logout failed');
    }
  };

  const SidebarContent = () => (
    <div className="flex flex-col h-full">
      {/* Logo */}
      <div className="flex items-center h-16 px-4 border-b">
        <div className="flex items-center space-x-2">
          <div className="w-8 h-8 bg-blue-600 rounded-lg flex items-center justify-center">
            <span className="text-white font-bold text-sm">R</span>
          </div>
          <div>
            <h1 className="font-semibold text-lg">RCCG POV</h1>
            <p className="text-xs text-muted-foreground">Admin Dashboard</p>
          </div>
        </div>
      </div>

      {/* Navigation */}
      <nav className="flex-1 px-4 py-6 space-y-2">
        {sidebarItems.map((item) => {
          const Icon = item.icon;
          const isActive = pathname === item.href;
          
          return (
            <Link
              key={item.href}
              href={item.href}
              className={`flex items-center justify-between px-3 py-2 rounded-lg text-sm font-medium transition-colors ${
                isActive
                  ? 'bg-blue-100 text-blue-700 border-r-2 border-blue-700'
                  : 'text-gray-700 hover:bg-gray-100'
              }`}
              onClick={() => setSidebarOpen(false)}
            >
              <div className="flex items-center space-x-3">
                <Icon className="h-5 w-5" />
                <span>{item.title}</span>
              </div>
              {item.badge && item.badge > 0 && (
                <Badge variant="destructive" className="text-xs">
                  {item.badge}
                </Badge>
              )}
            </Link>
          );
        })}
      </nav>

      {/* User Profile */}
      <div className="p-4 border-t">
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" className="w-full justify-start space-x-3 h-auto p-3">
              <Avatar className="h-8 w-8">
                <AvatarImage src={user?.photoURL || ''} />
                <AvatarFallback>
                  {user?.displayName?.charAt(0) || user?.email?.charAt(0) || 'U'}
                </AvatarFallback>
              </Avatar>
              <div className="flex-1 text-left">
                <p className="text-sm font-medium">
                  {user?.displayName || 'User'}
                </p>
                <p className="text-xs text-muted-foreground">
                  {user?.email}
                </p>
              </div>
              <ChevronDown className="h-4 w-4" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="w-56">
            <DropdownMenuLabel>My Account</DropdownMenuLabel>
            <DropdownMenuSeparator />
            <DropdownMenuItem>
              <User className="mr-2 h-4 w-4" />
              <span>Profile</span>
            </DropdownMenuItem>
            <DropdownMenuSeparator />
            <DropdownMenuItem onClick={handleLogout}>
              <LogOut className="mr-2 h-4 w-4" />
              <span>Log out</span>
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
    </div>
  );

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Mobile Sidebar */}
      <Sheet open={sidebarOpen} onOpenChange={setSidebarOpen}>
        <SheetTrigger asChild>
          <Button
            variant="ghost"
            size="sm"
            className="lg:hidden fixed top-4 left-4 z-50"
          >
            <Menu className="h-5 w-5" />
          </Button>
        </SheetTrigger>
        <SheetContent side="left" className="p-0 w-64">
          <SidebarContent />
        </SheetContent>
      </Sheet>

      {/* Desktop Sidebar */}
      <div className="hidden lg:flex lg:w-64 lg:flex-col lg:fixed lg:inset-y-0">
        <div className="flex flex-col flex-grow bg-white border-r border-gray-200">
          <SidebarContent />
        </div>
      </div>

      {/* Main Content */}
      <div className="lg:pl-64">
        {/* Top Bar */}
        <div className="sticky top-0 z-40 flex h-16 shrink-0 items-center gap-x-4 border-b border-gray-200 bg-white px-4 shadow-sm sm:gap-x-6 sm:px-6 lg:px-8">
          <div className="flex flex-1 gap-x-4 self-stretch lg:gap-x-6">
            <div className="flex flex-1"></div>
            <div className="flex items-center gap-x-4 lg:gap-x-6">
              {/* Notification Icon */}
              {getNewSignupsCount() > 0 && (
                <div className="relative">
                  <Bell className="h-5 w-5 text-gray-600" />
                  <Badge 
                    variant="destructive" 
                    className="absolute -top-2 -right-2 h-5 w-5 rounded-full p-0 flex items-center justify-center text-xs"
                  >
                    {getNewSignupsCount()}
                  </Badge>
                </div>
              )}
              {/* Mobile menu button */}
              <Button
                variant="ghost"
                size="sm"
                className="lg:hidden"
                onClick={() => setSidebarOpen(true)}
              >
                <Menu className="h-5 w-5" />
              </Button>
            </div>
          </div>
        </div>

        {/* Page Content */}
        <main className="py-6">
          <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
            {children}
          </div>
        </main>
      </div>
    </div>
  );
} 