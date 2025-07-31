import { Target, TrendingUp, Users, Brain, BarChart3, Briefcase, PieChart, Settings, Plug, HelpCircle, BookOpen, LogOut, Building2 } from 'lucide-react';
import { NavLink, useLocation } from 'react-router-dom';
import { useAuth } from '@/hooks/useAuth';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import {
  Sidebar,
  SidebarContent,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarHeader,
  SidebarFooter,
  useSidebar,
} from "@/components/ui/sidebar";
import { Button } from '@/components/ui/button';
import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';

// Core Functions - Large Cards
const coreFunctions = [
  { title: "Investment Strategy", url: "/dashboard", icon: Target, description: "Define criteria & focus", badge: "Core" },
  { title: "Deal Pipeline", url: "/deals", icon: TrendingUp, description: "Manage opportunities", badge: "Active" },
  { title: "Investment Committee", url: "/investment-committee", icon: Users, description: "Run IC sessions", badge: "Core" },
];

// Secondary Functions - Grid Cards
const secondaryFunctions = [
  { title: "AI Intelligence", url: "/founder-scoring", icon: Brain, description: "AI insights", badge: "AI" },
  { title: "Deal Management", url: "/deals", icon: Briefcase, description: "Track deals", badge: "Active" },
  { title: "Portfolio", url: "/portfolio", icon: PieChart, description: "Monitor investments", badge: "Soon" },
];

// Administration Items
const adminItems = [
  { title: "Settings", url: "/settings", icon: Settings },
  { title: "Integrations", url: "/integrations", icon: Plug },
];

// Support Items
const supportItems = [
  { title: "Help & Support", url: "/help", icon: HelpCircle },
  { title: "Documentation", url: "/docs", icon: BookOpen },
];

export function AppSidebar() {
  const { state } = useSidebar();
  const location = useLocation();
  const { user, signOut } = useAuth();
  const currentPath = location.pathname;
  const collapsed = state === 'collapsed';
  const [profile, setProfile] = useState<any>(null);
  const [funds, setFunds] = useState<any[]>([]);
  const [selectedFund, setSelectedFund] = useState<string>('');

  useEffect(() => {
    if (user) {
      fetchUserData();
    }
  }, [user]);

  const fetchUserData = async () => {
    const { data: profileData } = await supabase
      .from('profiles')
      .select('*')
      .eq('user_id', user?.id)
      .single();
    
    setProfile(profileData);

    if (profileData?.organization_id) {
      const { data: fundsData } = await supabase
        .from('funds')
        .select('*')
        .eq('organization_id', profileData.organization_id)
        .eq('is_active', true);
      
      setFunds(fundsData || []);
    }
  };

  const isActive = (path: string) => currentPath === path;
  const handleSignOut = async () => {
    await signOut();
  };

  if (collapsed) {
    return (
      <Sidebar className="w-14" collapsible="icon">
        <SidebarContent className="bg-sidebar">
          {/* Mini Logo */}
          <SidebarHeader className="p-2">
            <div className="w-10 h-10 bg-primary rounded-xl flex items-center justify-center mx-auto">
              <span className="text-sm font-bold text-primary-foreground">R</span>
            </div>
          </SidebarHeader>

          {/* Mini Navigation */}
          <SidebarGroup>
            <SidebarGroupContent>
              <SidebarMenu>
                {coreFunctions.map((item) => (
                  <SidebarMenuItem key={item.title}>
                    <SidebarMenuButton asChild>
                      <NavLink 
                        to={item.url} 
                        className={isActive(item.url) ? "bg-sidebar-accent text-sidebar-primary" : "hover:bg-sidebar-accent/50"}
                        title={item.title}
                      >
                        <item.icon className="h-4 w-4" />
                      </NavLink>
                    </SidebarMenuButton>
                  </SidebarMenuItem>
                ))}
              </SidebarMenu>
            </SidebarGroupContent>
          </SidebarGroup>

          <SidebarFooter className="p-2">
            <Button
              variant="ghost"
              size="sm"
              onClick={handleSignOut}
              className="w-full justify-center"
              title="Sign Out"
            >
              <LogOut className="h-4 w-4" />
            </Button>
          </SidebarFooter>
        </SidebarContent>
      </Sidebar>
    );
  }

  return (
    <Sidebar className="w-80" collapsible="icon">
      <SidebarContent className="bg-sidebar">
        {/* Header with Logo and Fund Switcher */}
        <SidebarHeader className="p-6 border-b border-sidebar-border">
          <div className="flex items-center space-x-3 mb-4">
            <div className="w-10 h-10 bg-primary rounded-xl flex items-center justify-center">
              <span className="text-lg font-bold text-primary-foreground">R</span>
            </div>
            <div>
              <h1 className="font-bold text-lg text-sidebar-foreground">ReubenAI</h1>
              <p className="text-xs text-muted-foreground">Investment Platform</p>
            </div>
          </div>

          {/* Fund Switcher */}
          {funds.length > 0 && (
            <Select value={selectedFund} onValueChange={setSelectedFund}>
              <SelectTrigger className="w-full">
                <div className="flex items-center gap-2">
                  <Building2 className="h-4 w-4" />
                  <SelectValue placeholder="Select Fund" />
                </div>
              </SelectTrigger>
              <SelectContent>
                {funds.map((fund) => (
                  <SelectItem key={fund.id} value={fund.id}>
                    {fund.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          )}
        </SidebarHeader>

        {/* Core Functions - Large Cards */}
        <SidebarGroup>
          <SidebarGroupLabel>Core Functions</SidebarGroupLabel>
          <SidebarGroupContent className="space-y-2">
            {coreFunctions.map((item) => (
              <NavLink key={item.title} to={item.url}>
                <Card className={`cursor-pointer transition-all duration-200 hover:shadow-md ${
                  isActive(item.url) ? 'bg-primary/10 border-primary/30' : 'hover:bg-muted/50'
                }`}>
                  <CardHeader className="p-4">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center space-x-3">
                        <div className="w-8 h-8 bg-primary/20 rounded-lg flex items-center justify-center">
                          <item.icon className="h-4 w-4 text-primary" />
                        </div>
                        <div>
                          <CardTitle className="text-sm font-medium">{item.title}</CardTitle>
                          <CardDescription className="text-xs">{item.description}</CardDescription>
                        </div>
                      </div>
                      <Badge variant="secondary" className="text-xs">
                        {item.badge}
                      </Badge>
                    </div>
                  </CardHeader>
                </Card>
              </NavLink>
            ))}
          </SidebarGroupContent>
        </SidebarGroup>

        {/* Secondary Functions - Grid Cards */}
        <SidebarGroup>
          <SidebarGroupLabel>Secondary Functions</SidebarGroupLabel>
          <SidebarGroupContent>
            <div className="grid grid-cols-2 gap-2">
              {secondaryFunctions.map((item) => (
                <NavLink key={item.title} to={item.url}>
                  <Card className="cursor-pointer transition-all duration-200 hover:shadow-sm hover:bg-muted/50 h-full">
                    <CardContent className="p-3 text-center">
                      <div className="w-6 h-6 bg-muted rounded-md flex items-center justify-center mx-auto mb-2">
                        <item.icon className="h-3 w-3 text-muted-foreground" />
                      </div>
                      <div className="space-y-1">
                        <p className="text-xs font-medium">{item.title}</p>
                        <p className="text-xs text-muted-foreground">{item.description}</p>
                        <Badge variant="outline" className="text-xs">
                          {item.badge}
                        </Badge>
                      </div>
                    </CardContent>
                  </Card>
                </NavLink>
              ))}
            </div>
          </SidebarGroupContent>
        </SidebarGroup>

        {/* Administration */}
        <SidebarGroup>
          <SidebarGroupLabel>Administration</SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu>
              {adminItems.map((item) => (
                <SidebarMenuItem key={item.title}>
                  <SidebarMenuButton asChild>
                    <NavLink 
                      to={item.url} 
                      className={isActive(item.url) ? "bg-sidebar-accent text-sidebar-primary font-medium" : "hover:bg-sidebar-accent/50"}
                    >
                      <item.icon className="h-4 w-4" />
                      <span>{item.title}</span>
                    </NavLink>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              ))}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>

        {/* Support */}
        <SidebarGroup>
          <SidebarGroupLabel>Support</SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu>
              {supportItems.map((item) => (
                <SidebarMenuItem key={item.title}>
                  <SidebarMenuButton asChild>
                    <NavLink 
                      to={item.url} 
                      className="hover:bg-sidebar-accent/50"
                    >
                      <item.icon className="h-4 w-4" />
                      <span>{item.title}</span>
                    </NavLink>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              ))}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>

        {/* User Footer */}
        <SidebarFooter className="p-4 border-t border-sidebar-border mt-auto">
          <div className="flex items-center space-x-3 mb-3">
            <Avatar className="h-8 w-8">
              <AvatarImage src={profile?.avatar_url} />
              <AvatarFallback>
                {profile?.first_name?.[0]}{profile?.last_name?.[0]}
              </AvatarFallback>
            </Avatar>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium text-sidebar-foreground truncate">
                {profile?.first_name} {profile?.last_name}
              </p>
              <p className="text-xs text-muted-foreground truncate">
                {profile?.role || 'User'}
              </p>
            </div>
          </div>
          <Button
            variant="ghost"
            size="sm"
            onClick={handleSignOut}
            className="w-full justify-start text-sidebar-foreground hover:bg-sidebar-accent/50"
          >
            <LogOut className="h-4 w-4 mr-2" />
            Sign Out
          </Button>
        </SidebarFooter>
      </SidebarContent>
    </Sidebar>
  );
}