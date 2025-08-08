import React, { useState, useEffect } from 'react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { 
  User, 
  Bell, 
  Shield, 
  Download, 
  Trash2,
  Moon,
  Sun,
  Monitor,
  Settings2,
  Database,
  Eye,
  EyeOff,
  Smartphone,
  Laptop,
  LogOut,
  Users
} from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { useAuth } from '@/hooks/useAuth';
import { useUserRole } from '@/hooks/useUserRole';
import { supabase } from '@/integrations/supabase/client';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from '@/components/ui/alert-dialog';
import TeamManagement from '@/components/settings/TeamManagement';

interface UserProfile {
  id: string;
  user_id: string;
  organization_id: string;
  email: string;
  first_name: string | null;
  last_name: string | null;
  role: string;
  avatar_url: string | null;
  created_at: string;
  updated_at: string;
}

interface NotificationSettings {
  email: boolean;
  push: boolean;
  deals: boolean;
  meetings: boolean;
  system: boolean;
}

interface UserPreferences {
  theme: string;
  timezone: string;
  defaultPipelineView: string;
}

interface ActiveSession {
  id: string;
  device: string;
  browser: string;
  os: string;
  location: string;
  lastActive: string;
  current: boolean;
}

export default function Settings() {
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [isProfileLoading, setIsProfileLoading] = useState(false);
  const [notifications, setNotifications] = useState<NotificationSettings>({
    email: true,
    push: true,
    deals: true,
    meetings: true,
    system: false
  });
  const [preferences, setPreferences] = useState<UserPreferences>({
    theme: 'system',
    timezone: 'utc',
    defaultPipelineView: 'kanban'
  });
  const [activeSessions, setActiveSessions] = useState<ActiveSession[]>([]);
  
  // Password change states
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPasswords, setShowPasswords] = useState(false);
  const [isChangingPassword, setIsChangingPassword] = useState(false);

  // Form data states
  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');

  const { toast } = useToast();
  const { user, signOut } = useAuth();
  const { role } = useUserRole();

  // Check if user can manage team
  const canManageTeam = role === 'admin' || role === 'fund_manager' || role === 'super_admin';

  useEffect(() => {
    if (user) {
      fetchUserProfile();
      loadUserPreferences();
      loadNotificationSettings();
      fetchActiveSessions();
    }
  }, [user]);

  const fetchUserProfile = async () => {
    if (!user) return;

    try {
      const { data, error } = await supabase
        .from('profiles')
        .select('*')
        .eq('user_id', user.id)
        .single();

      if (error) throw error;

      setProfile(data);
      setFirstName(data.first_name || '');
      setLastName(data.last_name || '');
    } catch (error) {
      console.error('Error fetching profile:', error);
      toast({
        title: "Error",
        description: "Failed to load profile information",
        variant: "destructive"
      });
    }
  };

  const loadUserPreferences = () => {
    const savedPreferences = localStorage.getItem('userPreferences');
    if (savedPreferences) {
      setPreferences(JSON.parse(savedPreferences));
    }
  };

  const loadNotificationSettings = () => {
    const savedNotifications = localStorage.getItem('notificationSettings');
    if (savedNotifications) {
      setNotifications(JSON.parse(savedNotifications));
    }
  };

  const fetchActiveSessions = async () => {
    // Mock active sessions data since Supabase doesn't expose session management
    const mockSessions: ActiveSession[] = [
      {
        id: '1',
        device: 'MacBook Pro',
        browser: 'Chrome',
        os: 'macOS',
        location: 'San Francisco, CA',
        lastActive: new Date().toISOString(),
        current: true
      }
    ];
    setActiveSessions(mockSessions);
  };

  const handleProfileSave = async () => {
    if (!user || !profile) return;

    setIsProfileLoading(true);
    try {
      const { error } = await supabase
        .from('profiles')
        .update({
          first_name: firstName,
          last_name: lastName,
          updated_at: new Date().toISOString()
        })
        .eq('user_id', user.id);

      if (error) throw error;

      setProfile(prev => prev ? {
        ...prev,
        first_name: firstName,
        last_name: lastName,
        updated_at: new Date().toISOString()
      } : null);

      toast({
        title: "Profile Updated",
        description: "Your profile information has been saved successfully.",
      });
    } catch (error) {
      console.error('Error updating profile:', error);
      toast({
        title: "Error",
        description: "Failed to update profile information",
        variant: "destructive"
      });
    } finally {
      setIsProfileLoading(false);
    }
  };

  const handleNotificationSave = () => {
    localStorage.setItem('notificationSettings', JSON.stringify(notifications));
    toast({
      title: "Notifications Updated",
      description: "Your notification preferences have been saved.",
    });
  };

  const handlePreferencesSave = () => {
    localStorage.setItem('userPreferences', JSON.stringify(preferences));
    
    // Apply theme immediately
    if (preferences.theme === 'dark') {
      document.documentElement.classList.add('dark');
    } else if (preferences.theme === 'light') {
      document.documentElement.classList.remove('dark');
    } else {
      // System theme
      if (window.matchMedia('(prefers-color-scheme: dark)').matches) {
        document.documentElement.classList.add('dark');
      } else {
        document.documentElement.classList.remove('dark');
      }
    }

    toast({
      title: "Preferences Updated",
      description: "Your display preferences have been saved.",
    });
  };

  const handlePasswordChange = async () => {
    if (!currentPassword || !newPassword || !confirmPassword) {
      toast({
        title: "Error",
        description: "Please fill in all password fields",
        variant: "destructive"
      });
      return;
    }

    if (newPassword !== confirmPassword) {
      toast({
        title: "Error",
        description: "New passwords do not match",
        variant: "destructive"
      });
      return;
    }

    if (newPassword.length < 6) {
      toast({
        title: "Error",
        description: "Password must be at least 6 characters long",
        variant: "destructive"
      });
      return;
    }

    setIsChangingPassword(true);
    try {
      const { error } = await supabase.auth.updateUser({
        password: newPassword
      });

      if (error) throw error;

      setCurrentPassword('');
      setNewPassword('');
      setConfirmPassword('');
      setShowPasswords(false);

      toast({
        title: "Password Updated",
        description: "Your password has been changed successfully.",
      });
    } catch (error: any) {
      console.error('Error changing password:', error);
      toast({
        title: "Error",
        description: error.message || "Failed to change password",
        variant: "destructive"
      });
    } finally {
      setIsChangingPassword(false);
    }
  };

  const handleExportData = async () => {
    if (!user) return;

    try {
      // Create a comprehensive data export
      const exportData = {
        profile: profile,
        preferences: preferences,
        notifications: notifications,
        exportDate: new Date().toISOString(),
        userId: user.id
      };

      const dataStr = JSON.stringify(exportData, null, 2);
      const dataBlob = new Blob([dataStr], { type: 'application/json' });
      const url = URL.createObjectURL(dataBlob);
      
      const link = document.createElement('a');
      link.href = url;
      link.download = `reuben-ai-data-export-${new Date().toISOString().split('T')[0]}.json`;
      link.click();
      
      URL.revokeObjectURL(url);

      toast({
        title: "Export Complete",
        description: "Your data has been exported successfully.",
      });
    } catch (error) {
      console.error('Error exporting data:', error);
      toast({
        title: "Export Failed",
        description: "Failed to export your data",
        variant: "destructive"
      });
    }
  };

  const handleDeleteAccount = () => {
    toast({
      title: "Account Deletion",
      description: "Please contact support at hello@goreuben.com to delete your account.",
      variant: "destructive"
    });
  };

  const handleSignOutFromDevice = async (sessionId: string) => {
    if (sessionId === '1') { // Current session
      await signOut();
    } else {
      // Remove from mock sessions
      setActiveSessions(prev => prev.filter(s => s.id !== sessionId));
      toast({
        title: "Session Ended",
        description: "You have been signed out of that device.",
      });
    }
  };

  return (
    <div className="space-y-6 pr-8 max-w-4xl">
      <div>
        <h1 className="text-2xl font-semibold text-foreground">Settings</h1>
        <p className="text-muted-foreground mt-1">Manage your account and platform preferences</p>
      </div>

      <Tabs defaultValue="profile" className="space-y-6">
        <TabsList className="h-12 w-auto bg-background border rounded-lg p-1">
          <TabsTrigger value="profile" className="h-10 px-6 rounded-md text-sm font-medium data-[state=active]:bg-card data-[state=active]:shadow-sm">
            <User className="h-4 w-4 mr-2" />
            Profile
          </TabsTrigger>
          <TabsTrigger value="notifications" className="h-10 px-6 rounded-md text-sm font-medium data-[state=active]:bg-card data-[state=active]:shadow-sm">
            <Bell className="h-4 w-4 mr-2" />
            Notifications
          </TabsTrigger>
          <TabsTrigger value="preferences" className="h-10 px-6 rounded-md text-sm font-medium data-[state=active]:bg-card data-[state=active]:shadow-sm">
            <Settings2 className="h-4 w-4 mr-2" />
            Preferences
          </TabsTrigger>
          {canManageTeam && (
            <TabsTrigger value="team" className="h-10 px-6 rounded-md text-sm font-medium data-[state=active]:bg-card data-[state=active]:shadow-sm">
              <Users className="h-4 w-4 mr-2" />
              Team
            </TabsTrigger>
          )}
          <TabsTrigger value="security" className="h-10 px-6 rounded-md text-sm font-medium data-[state=active]:bg-card data-[state=active]:shadow-sm">
            <Shield className="h-4 w-4 mr-2" />
            Security
          </TabsTrigger>
          <TabsTrigger value="data" className="h-10 px-6 rounded-md text-sm font-medium data-[state=active]:bg-card data-[state=active]:shadow-sm">
            <Database className="h-4 w-4 mr-2" />
            Data
          </TabsTrigger>
        </TabsList>

        <TabsContent value="profile" className="space-y-6">
          <Card className="border-0 shadow-sm">
            <CardHeader>
              <CardTitle>Profile Information</CardTitle>
              <CardDescription>Update your account profile information</CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="firstName">First Name</Label>
                  <Input 
                    id="firstName" 
                    value={firstName}
                    onChange={(e) => setFirstName(e.target.value)}
                    className="mt-2" 
                    placeholder="Enter your first name"
                  />
                </div>
                <div>
                  <Label htmlFor="lastName">Last Name</Label>
                  <Input 
                    id="lastName" 
                    value={lastName}
                    onChange={(e) => setLastName(e.target.value)}
                    className="mt-2" 
                    placeholder="Enter your last name"
                  />
                </div>
              </div>
              <div>
                <Label htmlFor="email">Email Address</Label>
                <Input 
                  id="email" 
                  type="email"
                  value={profile?.email || user?.email || ''}
                  disabled
                  className="mt-2 bg-muted" 
                />
                <p className="text-xs text-muted-foreground mt-1">
                  Contact support to change your email address
                </p>
              </div>
              <div>
                <Label htmlFor="role">Role</Label>
                <div className="mt-2">
                  <Badge variant="outline">{profile?.role || 'Loading...'}</Badge>
                </div>
              </div>
              <Button 
                onClick={handleProfileSave}
                disabled={isProfileLoading}
                className="w-fit"
              >
                {isProfileLoading ? 'Saving...' : 'Save Changes'}
              </Button>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="notifications" className="space-y-6">
          <Card className="border-0 shadow-sm">
            <CardHeader>
              <CardTitle>Notification Preferences</CardTitle>
              <CardDescription>Choose how you want to be notified about activity</CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <div>
                    <Label className="text-sm font-medium">Email Notifications</Label>
                    <p className="text-xs text-muted-foreground">Receive notifications via email</p>
                  </div>
                  <Switch 
                    checked={notifications.email}
                    onCheckedChange={(checked) => 
                      setNotifications(prev => ({ ...prev, email: checked }))
                    }
                  />
                </div>
                <Separator />
                <div className="flex items-center justify-between">
                  <div>
                    <Label className="text-sm font-medium">Push Notifications</Label>
                    <p className="text-xs text-muted-foreground">Receive browser push notifications</p>
                  </div>
                  <Switch 
                    checked={notifications.push}
                    onCheckedChange={(checked) => 
                      setNotifications(prev => ({ ...prev, push: checked }))
                    }
                  />
                </div>
                <Separator />
                <div className="flex items-center justify-between">
                  <div>
                    <Label className="text-sm font-medium">Deal Updates</Label>
                    <p className="text-xs text-muted-foreground">Notifications about deal changes and analysis</p>
                  </div>
                  <Switch 
                    checked={notifications.deals}
                    onCheckedChange={(checked) => 
                      setNotifications(prev => ({ ...prev, deals: checked }))
                    }
                  />
                </div>
                <Separator />
                <div className="flex items-center justify-between">
                  <div>
                    <Label className="text-sm font-medium">IC Meetings</Label>
                    <p className="text-xs text-muted-foreground">Notifications about upcoming meetings and votes</p>
                  </div>
                  <Switch 
                    checked={notifications.meetings}
                    onCheckedChange={(checked) => 
                      setNotifications(prev => ({ ...prev, meetings: checked }))
                    }
                  />
                </div>
                <Separator />
                <div className="flex items-center justify-between">
                  <div>
                    <Label className="text-sm font-medium">System Updates</Label>
                    <p className="text-xs text-muted-foreground">Product updates and maintenance notifications</p>
                  </div>
                  <Switch 
                    checked={notifications.system}
                    onCheckedChange={(checked) => 
                      setNotifications(prev => ({ ...prev, system: checked }))
                    }
                  />
                </div>
              </div>
              <Button onClick={handleNotificationSave} className="w-fit">
                Save Preferences
              </Button>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="preferences" className="space-y-6">
          <Card className="border-0 shadow-sm">
            <CardHeader>
              <CardTitle>Display Preferences</CardTitle>
              <CardDescription>Customize your platform experience</CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div>
                <Label className="text-sm font-medium">Theme</Label>
                <Select value={preferences.theme} onValueChange={(value) => setPreferences(prev => ({ ...prev, theme: value }))}>
                  <SelectTrigger className="w-[200px] mt-2">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="light">
                      <div className="flex items-center gap-2">
                        <Sun className="h-4 w-4" />
                        Light
                      </div>
                    </SelectItem>
                    <SelectItem value="dark">
                      <div className="flex items-center gap-2">
                        <Moon className="h-4 w-4" />
                        Dark
                      </div>
                    </SelectItem>
                    <SelectItem value="system">
                      <div className="flex items-center gap-2">
                        <Monitor className="h-4 w-4" />
                        System
                      </div>
                    </SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label className="text-sm font-medium">Timezone</Label>
                <Select value={preferences.timezone} onValueChange={(value) => setPreferences(prev => ({ ...prev, timezone: value }))}>
                  <SelectTrigger className="w-[200px] mt-2">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="utc">UTC</SelectItem>
                    <SelectItem value="est">Eastern Time</SelectItem>
                    <SelectItem value="pst">Pacific Time</SelectItem>
                    <SelectItem value="gmt">GMT</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label className="text-sm font-medium">Default Pipeline View</Label>
                <Select value={preferences.defaultPipelineView} onValueChange={(value) => setPreferences(prev => ({ ...prev, defaultPipelineView: value }))}>
                  <SelectTrigger className="w-[200px] mt-2">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="kanban">Kanban</SelectItem>
                    <SelectItem value="list">List</SelectItem>
                    <SelectItem value="table">Table</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <Button onClick={handlePreferencesSave} className="w-fit">
                Save Preferences
              </Button>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="security" className="space-y-6">
          <Card className="border-0 shadow-sm">
            <CardHeader>
              <CardTitle>Security Settings</CardTitle>
              <CardDescription>Manage your account security</CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div>
                <Label className="text-sm font-medium mb-4 block">Change Password</Label>
                <div className="space-y-4">
                  <div>
                    <Label htmlFor="currentPassword" className="text-xs">Current Password</Label>
                    <div className="relative">
                      <Input 
                        id="currentPassword"
                        type={showPasswords ? "text" : "password"}
                        value={currentPassword}
                        onChange={(e) => setCurrentPassword(e.target.value)}
                        className="mt-1 pr-10" 
                        placeholder="Enter current password"
                      />
                      <Button
                        type="button"
                        variant="ghost"
                        size="sm"
                        className="absolute right-0 top-1 h-8 w-8 px-0"
                        onClick={() => setShowPasswords(!showPasswords)}
                      >
                        {showPasswords ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                      </Button>
                    </div>
                  </div>
                  <div>
                    <Label htmlFor="newPassword" className="text-xs">New Password</Label>
                    <Input 
                      id="newPassword"
                      type={showPasswords ? "text" : "password"}
                      value={newPassword}
                      onChange={(e) => setNewPassword(e.target.value)}
                      className="mt-1" 
                      placeholder="Enter new password"
                    />
                  </div>
                  <div>
                    <Label htmlFor="confirmPassword" className="text-xs">Confirm New Password</Label>
                    <Input 
                      id="confirmPassword"
                      type={showPasswords ? "text" : "password"}
                      value={confirmPassword}
                      onChange={(e) => setConfirmPassword(e.target.value)}
                      className="mt-1" 
                      placeholder="Confirm new password"
                    />
                  </div>
                  <Button 
                    onClick={handlePasswordChange}
                    disabled={isChangingPassword}
                    className="w-fit"
                  >
                    {isChangingPassword ? 'Changing...' : 'Change Password'}
                  </Button>
                </div>
              </div>
              <Separator />
              <div>
                <Label className="text-sm font-medium">Two-Factor Authentication</Label>
                <div className="flex items-center justify-between mt-2">
                  <p className="text-sm text-muted-foreground">Add an extra layer of security to your account</p>
                  <Button variant="outline" size="sm" disabled>
                    Setup 2FA (Coming Soon)
                  </Button>
                </div>
              </div>
              <Separator />
              <div>
                <Label className="text-sm font-medium">Active Sessions</Label>
                <div className="mt-2 space-y-2">
                  {activeSessions.map((session) => (
                    <div key={session.id} className="flex items-center justify-between p-3 bg-muted/30 rounded-lg">
                      <div className="flex items-center gap-3">
                        <div className="p-2 bg-background rounded">
                          {session.device.includes('MacBook') || session.device.includes('Windows') ? 
                            <Laptop className="h-4 w-4" /> : 
                            <Smartphone className="h-4 w-4" />
                          }
                        </div>
                        <div>
                          <p className="text-sm font-medium">
                            {session.current ? 'Current Session' : session.device}
                          </p>
                          <p className="text-xs text-muted-foreground">
                            {session.browser} on {session.os} • {session.location}
                          </p>
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        {session.current ? (
                          <Badge variant="secondary">Active</Badge>
                        ) : (
                          <AlertDialog>
                            <AlertDialogTrigger asChild>
                              <Button variant="outline" size="sm">
                                <LogOut className="h-4 w-4" />
                              </Button>
                            </AlertDialogTrigger>
                            <AlertDialogContent>
                              <AlertDialogHeader>
                                <AlertDialogTitle>Sign out from device?</AlertDialogTitle>
                                <AlertDialogDescription>
                                  This will end the session on {session.device}. You'll need to sign in again on that device.
                                </AlertDialogDescription>
                              </AlertDialogHeader>
                              <AlertDialogFooter>
                                <AlertDialogCancel>Cancel</AlertDialogCancel>
                                <AlertDialogAction onClick={() => handleSignOutFromDevice(session.id)}>
                                  Sign Out
                                </AlertDialogAction>
                              </AlertDialogFooter>
                            </AlertDialogContent>
                          </AlertDialog>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="data" className="space-y-6">
          <Card className="border-0 shadow-sm">
            <CardHeader>
              <CardTitle>Data Management</CardTitle>
              <CardDescription>Export your data or delete your account</CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div>
                <Label className="text-sm font-medium">Export Data</Label>
                <p className="text-sm text-muted-foreground mt-1 mb-4">
                  Download a copy of your profile, preferences, and settings data
                </p>
                <Button onClick={handleExportData} className="gap-2">
                  <Download className="h-4 w-4" />
                  Export All Data
                </Button>
              </div>
              <Separator />
              <div>
                <Label className="text-sm font-medium text-destructive">Danger Zone</Label>
                <div className="mt-4 p-4 border border-destructive/20 rounded-lg bg-destructive/5">
                  <h4 className="text-sm font-medium text-destructive mb-2">Delete Account</h4>
                  <p className="text-sm text-muted-foreground mb-4">
                    Permanently delete your account and all associated data. This action cannot be undone.
                  </p>
                  <AlertDialog>
                    <AlertDialogTrigger asChild>
                      <Button variant="destructive" className="gap-2">
                        <Trash2 className="h-4 w-4" />
                        Delete Account
                      </Button>
                    </AlertDialogTrigger>
                    <AlertDialogContent>
                      <AlertDialogHeader>
                        <AlertDialogTitle>Are you sure you want to delete your account?</AlertDialogTitle>
                        <AlertDialogDescription>
                          This action cannot be undone. This will permanently delete your account and remove all your data from our servers.
                        </AlertDialogDescription>
                      </AlertDialogHeader>
                      <AlertDialogFooter>
                        <AlertDialogCancel>Cancel</AlertDialogCancel>
                        <AlertDialogAction onClick={handleDeleteAccount} className="bg-destructive text-destructive-foreground hover:bg-destructive/90">
                          Delete Account
                        </AlertDialogAction>
                      </AlertDialogFooter>
                    </AlertDialogContent>
                  </AlertDialog>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {canManageTeam && (
          <TabsContent value="team" className="space-y-6">
            <TeamManagement />
          </TabsContent>
        )}
      </Tabs>
    </div>
  );
}