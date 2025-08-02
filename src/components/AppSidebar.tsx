import { Target, TrendingUp, Users, Brain, BarChart3, Briefcase, PieChart, Settings, Plug, HelpCircle, BookOpen, LogOut, Building2, Shield } from 'lucide-react';
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
import { useFund } from '@/contexts/FundContext';
import { supabase } from '@/integrations/supabase/client';

// Core Functions - Large Cards
const coreFunctions = [
  { title: "Investment Strategy", url: "/strategy", icon: Target, description: "Define criteria & focus", beta: true },
  { title: "Deal Pipeline", url: "/deals", icon: TrendingUp, description: "Manage opportunities", beta: true },
  { title: "Investment Committee", url: "/ic", icon: Users, description: "Run IC sessions", beta: true },
];

// Secondary Functions - Grid Cards  
const secondaryFunctions = [
  { title: "Analytics", url: "/analytics", icon: BarChart3, description: "LP-ready metrics", badge: "Soon", disabled: true },
  { title: "Fund Memory", url: "/fund-memory", icon: Brain, description: "Institutional intelligence", badge: "Soon", disabled: true },
  { title: "Due Diligence Hub", url: "/dd", icon: Briefcase, description: "DD workflows", badge: "Soon", disabled: true },
  { title: "LP Reporting", url: "/lp-reporting", icon: PieChart, description: "LP reports", badge: "Soon", disabled: true },
];

// Administration Items
const adminItems = [
  { title: "Settings", url: "/settings", icon: Settings },
  { title: "Integrations", url: "/integrations", icon: Plug, badge: "Soon", disabled: true },
];

// Support Items
const supportItems = [
  { title: "Help & Support", url: "/help", icon: HelpCircle },
  { title: "Documentation", url: "/docs", icon: BookOpen, badge: "Soon", disabled: true },
];

export function AppSidebar() {
  const { open, toggleSidebar } = useSidebar();
  const location = useLocation();
  const { user, signOut } = useAuth();
  const { funds, selectedFund, setSelectedFund } = useFund();
  const currentPath = location.pathname;
  const [profile, setProfile] = useState<any>(null);

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
  };

  const isActive = (path: string) => currentPath === path;
  const handleSignOut = async () => {
    await signOut();
  };

  if (!open) {
    return (
      <Sidebar className="w-14 border-r border-border/50" collapsible="icon">
        <SidebarContent className="bg-sidebar">
          {/* Mini Logo */}
          <SidebarHeader className="p-3 border-b border-border/50">
            <div className="w-8 h-8 bg-primary rounded-lg flex items-center justify-center mx-auto">
              <span className="text-sm font-bold text-primary-foreground">R</span>
            </div>
          </SidebarHeader>

          {/* Mini Navigation */}
          <SidebarGroup className="px-2 py-4">
            <SidebarGroupContent>
              <SidebarMenu className="space-y-2">
                {coreFunctions.map((item) => (
                  <SidebarMenuItem key={item.title}>
                    <SidebarMenuButton asChild>
                      <NavLink 
                        to={item.url} 
                        className={`w-full h-10 rounded-md flex items-center justify-center transition-all ${
                          isActive(item.url) 
                            ? "bg-primary/10 text-primary border border-primary/20" 
                            : "hover:bg-muted/50 text-muted-foreground hover:text-foreground"
                        }`}
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

          <SidebarFooter className="p-2 mt-auto">
            <Button
              variant="ghost"
              size="sm"
              onClick={handleSignOut}
              className="w-full h-10 justify-center hover:bg-destructive/10 hover:text-destructive"
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
    <Sidebar className="w-72 border-r border-border/50" collapsible="icon">
      <SidebarContent className="bg-sidebar/50 backdrop-blur-sm">
        {/* Header with Logo and Fund Switcher */}
        <SidebarHeader className="p-6 border-b border-border/50">
          <div className="flex items-center space-x-3 mb-6">
            <div className="w-10 h-10 bg-gradient-to-br from-primary to-primary/80 rounded-xl flex items-center justify-center shadow-sm">
              <span className="text-lg font-bold text-primary-foreground">R</span>
            </div>
            <div>
              <h1 className="font-bold text-lg text-foreground tracking-tight">ReubenAI</h1>
              <p className="text-xs text-muted-foreground font-medium">Investment Platform</p>
            </div>
          </div>

          {/* Fund Switcher */}
          {funds.length > 0 && (
            <Select 
              value={selectedFund?.id || ''} 
              onValueChange={(fundId) => {
                const fund = funds.find(f => f.id === fundId);
                setSelectedFund(fund || null);
              }}
            >
              <SelectTrigger className="w-full bg-background/80 border-border/60 h-10">
                <div className="flex items-center gap-2">
                  <Building2 className="h-4 w-4 text-muted-foreground" />
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

        {/* Core Functions - Clean List */}
        <SidebarGroup className="px-4 py-4">
          <SidebarGroupLabel className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-3">
            Core Functions
          </SidebarGroupLabel>
          <SidebarGroupContent className="space-y-1">
              {coreFunctions.map((item) => (
                <NavLink key={item.title} to={item.url}>
                  <div 
                    className={`group relative flex items-center space-x-3 rounded-lg px-3 py-3 text-sm transition-all duration-200 ${
                      isActive(item.url) 
                        ? 'bg-primary/10 text-primary border border-primary/20 shadow-sm' 
                        : 'hover:bg-muted/50 text-foreground hover:shadow-sm'
                    }`}
                    data-tour={item.title === 'Investment Strategy' ? 'strategy' : item.title === 'Deal Pipeline' ? 'pipeline' : undefined}
                  >
                  <div className={`flex h-6 w-6 items-center justify-center rounded-md transition-colors ${
                    isActive(item.url) ? 'bg-primary/20' : 'bg-muted/80 group-hover:bg-muted'
                  }`}>
                    <item.icon className={`h-3.5 w-3.5 ${
                      isActive(item.url) ? 'text-primary' : 'text-muted-foreground group-hover:text-foreground'
                    }`} />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <p className="font-medium truncate">{item.title}</p>
                      {(item as any).beta && (
                        <Badge variant="secondary" className="text-xs px-1.5 py-0.5 font-medium bg-accent-orange/10 text-accent-orange border-accent-orange/20">
                          beta
                        </Badge>
                      )}
                    </div>
                    <p className="text-xs text-muted-foreground truncate">{item.description}</p>
                  </div>
                </div>
              </NavLink>
            ))}
          </SidebarGroupContent>
        </SidebarGroup>

        {/* Secondary Functions - Compact Grid */}
        <SidebarGroup className="px-4 py-2">
          <SidebarGroupLabel className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-3">
            Analytics & Insights
          </SidebarGroupLabel>
          <SidebarGroupContent>
            <div className="grid grid-cols-2 gap-2">
              {secondaryFunctions.map((item) => (
                <div key={item.title} className="h-full">
                  <div className={`group relative rounded-lg border border-border/60 p-3 text-center transition-all duration-200 h-full flex flex-col justify-between ${item.disabled ? 'opacity-50 cursor-not-allowed bg-muted/20' : 'bg-background/80 hover:border-border hover:bg-background hover:shadow-sm cursor-pointer'}`}>
                    <div className="flex flex-col items-center flex-1">
                      <div className={`w-5 h-5 rounded-md flex items-center justify-center mx-auto mb-2 ${item.disabled ? 'bg-muted/50' : 'bg-muted/80 group-hover:bg-muted'} transition-colors`}>
                        <item.icon className={`h-3 w-3 ${item.disabled ? 'text-muted-foreground/50' : 'text-muted-foreground group-hover:text-foreground'} transition-colors`} />
                      </div>
                      <p className={`text-xs font-medium mb-1 ${item.disabled ? 'text-muted-foreground/50' : 'text-foreground'}`}>{item.title}</p>
                      <p className={`text-xs ${item.disabled ? 'text-muted-foreground/50' : 'text-muted-foreground'} text-center flex-1`}>{item.description}</p>
                    </div>
                    {(item as any).badge && (
                      <div className="mt-2">
                        <Badge variant="outline" className={`text-xs font-medium ${item.disabled ? 'opacity-50' : ''}`}>
                          {(item as any).badge}
                        </Badge>
                      </div>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </SidebarGroupContent>
        </SidebarGroup>

        {/* Administration & Support */}
        <SidebarGroup className="px-4 py-2">
          <SidebarGroupLabel className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-3">
            System
          </SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu className="space-y-1">
              {/* Show Admin Dashboard only for super_admin */}
              {profile?.role === 'super_admin' && (
                <SidebarMenuItem>
                  <SidebarMenuButton asChild>
                    <NavLink 
                      to="/admin" 
                      className={`flex items-center space-x-3 rounded-md px-3 py-2 text-sm transition-all duration-200 ${
                        isActive('/admin') 
                          ? "bg-primary/10 text-primary border border-primary/20" 
                          : "hover:bg-muted/50 text-muted-foreground hover:text-foreground"
                      }`}
                    >
                      <Shield className="h-4 w-4" />
                      <span className="font-medium">Admin Dashboard</span>
                    </NavLink>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              )}
              {[...adminItems, ...supportItems].map((item) => (
                <SidebarMenuItem key={item.title}>
                  <SidebarMenuButton asChild>
                    {(item as any).disabled ? (
                      <div className={`flex items-center justify-between space-x-3 rounded-md px-3 py-2 text-sm opacity-50 cursor-not-allowed text-muted-foreground`}>
                        <div className="flex items-center space-x-3">
                          <item.icon className="h-4 w-4" />
                          <span className="font-medium">{item.title}</span>
                        </div>
                        {(item as any).badge && (
                          <Badge variant="outline" className="text-xs">
                            {(item as any).badge}
                          </Badge>
                        )}
                      </div>
                    ) : (
                      <NavLink 
                        to={item.url} 
                        className={`flex items-center space-x-3 rounded-md px-3 py-2 text-sm transition-all duration-200 ${
                          isActive(item.url) 
                            ? "bg-primary/10 text-primary border border-primary/20" 
                            : "hover:bg-muted/50 text-muted-foreground hover:text-foreground"
                        }`}
                        data-tour={item.title === 'Help & Support' ? 'help' : undefined}
                      >
                        <item.icon className="h-4 w-4" />
                        <span className="font-medium">{item.title}</span>
                      </NavLink>
                    )}
                  </SidebarMenuButton>
                </SidebarMenuItem>
              ))}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>

        {/* User Footer */}
        <SidebarFooter className="p-4 border-t border-border/50 mt-auto">
          <div className="flex items-center space-x-3 mb-4">
            <Avatar className="h-9 w-9 ring-2 ring-border/50">
              <AvatarImage src={profile?.avatar_url} />
              <AvatarFallback className="bg-primary/10 text-primary font-semibold">
                {profile?.first_name?.[0]}{profile?.last_name?.[0]}
              </AvatarFallback>
            </Avatar>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-semibold text-foreground truncate">
                {profile?.first_name} {profile?.last_name}
              </p>
              <p className="text-xs text-muted-foreground truncate font-medium">
                {profile?.role || 'User'}
              </p>
            </div>
          </div>
          <Button
            variant="ghost"
            size="sm"
            onClick={handleSignOut}
            className="w-full justify-start text-muted-foreground hover:text-destructive hover:bg-destructive/5 transition-colors"
          >
            <LogOut className="h-4 w-4 mr-2" />
            Sign Out
          </Button>
          
          {/* Copyright */}
          <div className="text-center pt-3 border-t border-border/30">
            <p className="text-xs text-muted-foreground">© 2025 ReubenAI</p>
          </div>
        </SidebarFooter>
      </SidebarContent>
    </Sidebar>
  );
}