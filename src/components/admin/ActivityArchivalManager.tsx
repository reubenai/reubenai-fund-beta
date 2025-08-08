import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Switch } from '@/components/ui/switch';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Badge } from '@/components/ui/badge';
import { toast } from 'sonner';
import { 
  Archive, 
  ArchiveRestore, 
  Database, 
  Settings,
  Play,
  AlertCircle,
  TrendingUp,
  Clock,
  HardDrive
} from 'lucide-react';
import { useActivityArchival } from '@/hooks/useActivityArchival';

export function ActivityArchivalManager() {
  const {
    loading,
    stats,
    configs,
    getArchivalStats,
    getArchivalConfigs,
    updateArchivalConfig,
    runArchivalProcess,
    restoreArchivedActivities
  } = useActivityArchival();

  const [selectedConfig, setSelectedConfig] = useState<any>(null);
  const [isConfigModalOpen, setIsConfigModalOpen] = useState(false);
  const [configUpdates, setConfigUpdates] = useState({
    retention_days: 0,
    is_active: true,
    description: ''
  });

  useEffect(() => {
    getArchivalStats();
    getArchivalConfigs();
  }, []);

  const handleConfigUpdate = async () => {
    if (!selectedConfig) return;

    const success = await updateArchivalConfig(selectedConfig.id, configUpdates);
    if (success) {
      setIsConfigModalOpen(false);
      setSelectedConfig(null);
    }
  };

  const handleRunArchival = async () => {
    if (confirm('Are you sure you want to run the archival process? This will move old activities to the archive based on current retention policies.')) {
      await runArchivalProcess();
    }
  };

  const formatBytes = (bytes: number) => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  const formatDuration = (hours: number) => {
    if (hours < 24) return `${hours.toFixed(1)}h`;
    return `${(hours / 24).toFixed(1)}d`;
  };

  return (
    <div className="space-y-6">
      {/* Stats Cards */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Active Activities</CardTitle>
            <Database className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats?.active_activities?.toLocaleString() || 0}</div>
            <p className="text-xs text-muted-foreground">
              Currently in main table
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Archived Activities</CardTitle>
            <Archive className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats?.archived_activities?.toLocaleString() || 0}</div>
            <p className="text-xs text-muted-foreground">
              In archive storage
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Archive Size</CardTitle>
            <HardDrive className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {stats?.archive_size_estimate?.size_mb?.toFixed(1) || 0} MB
            </div>
            <p className="text-xs text-muted-foreground">
              Storage used by archive
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Active Configs</CardTitle>
            <Settings className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats?.archival_configs || 0}</div>
            <p className="text-xs text-muted-foreground">
              Retention policies active
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Action Buttons */}
      <div className="flex gap-4">
        <Button 
          onClick={handleRunArchival}
          disabled={loading}
          className="flex items-center gap-2"
        >
          <Play className="h-4 w-4" />
          Run Archival Process
        </Button>
        <Button 
          variant="outline"
          onClick={() => getArchivalStats()}
          disabled={loading}
          className="flex items-center gap-2"
        >
          <TrendingUp className="h-4 w-4" />
          Refresh Stats
        </Button>
      </div>

      {/* Archive Information */}
      {stats && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <AlertCircle className="h-5 w-5" />
              Archive Information
            </CardTitle>
            <CardDescription>
              Current state of activity archival system
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label className="text-sm font-medium">Oldest Active Activity</Label>
                <p className="text-sm text-muted-foreground">
                  {stats.oldest_active_activity 
                    ? new Date(stats.oldest_active_activity).toLocaleDateString()
                    : 'No active activities'
                  }
                </p>
              </div>
              <div>
                <Label className="text-sm font-medium">Newest Archived Activity</Label>
                <p className="text-sm text-muted-foreground">
                  {stats.newest_archived_activity 
                    ? new Date(stats.newest_archived_activity).toLocaleDateString()
                    : 'No archived activities'
                  }
                </p>
              </div>
            </div>

            <div className="p-4 bg-muted rounded-lg">
              <h4 className="font-medium mb-2">Archive Performance Impact</h4>
              <p className="text-sm text-muted-foreground">
                Archiving moves older activities to a separate table, improving query performance on recent data.
                The archive preserves all data for compliance and investigation purposes while keeping the main
                activity table optimized for daily operations.
              </p>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Retention Configurations */}
      <Card>
        <CardHeader>
          <CardTitle>Retention Configurations</CardTitle>
          <CardDescription>
            Manage how long different types of activities are kept in the main table
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Activity Type</TableHead>
                <TableHead>Priority</TableHead>
                <TableHead>Retention Period</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Description</TableHead>
                <TableHead>Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {configs.map((config) => (
                <TableRow key={config.id}>
                  <TableCell className="font-medium">
                    {config.activity_type.replace('_', ' ')}
                  </TableCell>
                  <TableCell>
                    <Badge 
                      variant={config.priority === 'high' ? 'default' : 
                               config.priority === 'medium' ? 'secondary' : 'outline'}
                    >
                      {config.priority}
                    </Badge>
                  </TableCell>
                  <TableCell>
                    {config.retention_days} days
                  </TableCell>
                  <TableCell>
                    <Badge variant={config.is_active ? 'default' : 'secondary'}>
                      {config.is_active ? 'Active' : 'Inactive'}
                    </Badge>
                  </TableCell>
                  <TableCell className="max-w-xs truncate">
                    {config.description || '-'}
                  </TableCell>
                  <TableCell>
                    <Dialog open={isConfigModalOpen && selectedConfig?.id === config.id} onOpenChange={setIsConfigModalOpen}>
                      <DialogTrigger asChild>
                        <Button 
                          variant="outline" 
                          size="sm"
                          onClick={() => {
                            setSelectedConfig(config);
                            setConfigUpdates({
                              retention_days: config.retention_days,
                              is_active: config.is_active,
                              description: config.description || ''
                            });
                          }}
                        >
                          Edit
                        </Button>
                      </DialogTrigger>
                      <DialogContent>
                        <DialogHeader>
                          <DialogTitle>
                            Edit Retention Policy: {config.activity_type} ({config.priority})
                          </DialogTitle>
                          <DialogDescription>
                            Configure how long this type of activity is kept in the main table
                          </DialogDescription>
                        </DialogHeader>
                        
                        <div className="space-y-4">
                          <div>
                            <Label htmlFor="retention-days">Retention Period (days)</Label>
                            <Input
                              id="retention-days"
                              type="number"
                              value={configUpdates.retention_days}
                              onChange={(e) => setConfigUpdates(prev => ({
                                ...prev,
                                retention_days: parseInt(e.target.value) || 0
                              }))}
                              min="1"
                              max="3650"
                            />
                            <p className="text-xs text-muted-foreground mt-1">
                              Activities older than this will be archived
                            </p>
                          </div>

                          <div className="flex items-center space-x-2">
                            <Switch
                              id="is-active"
                              checked={configUpdates.is_active}
                              onCheckedChange={(checked) => setConfigUpdates(prev => ({
                                ...prev,
                                is_active: checked
                              }))}
                            />
                            <Label htmlFor="is-active">Policy Active</Label>
                          </div>

                          <div>
                            <Label htmlFor="description">Description</Label>
                            <Textarea
                              id="description"
                              value={configUpdates.description}
                              onChange={(e) => setConfigUpdates(prev => ({
                                ...prev,
                                description: e.target.value
                              }))}
                              placeholder="Optional description for this retention policy"
                            />
                          </div>

                          <div className="flex gap-2">
                            <Button onClick={handleConfigUpdate} disabled={loading}>
                              Save Changes
                            </Button>
                            <Button 
                              variant="outline" 
                              onClick={() => setIsConfigModalOpen(false)}
                            >
                              Cancel
                            </Button>
                          </div>
                        </div>
                      </DialogContent>
                    </Dialog>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>

          {configs.length === 0 && (
            <div className="text-center py-8 text-muted-foreground">
              No retention configurations found
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}