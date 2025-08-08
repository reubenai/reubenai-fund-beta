import React from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Calendar, User, FileText, RotateCcw } from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';
import { usePermissions } from '@/hooks/usePermissions';

interface MemoVersion {
  id: string;
  version: number;
  content: any;
  created_at: string;
  description?: string;
}

interface MemoVersionHistoryModalProps {
  isOpen: boolean;
  onClose: () => void;
  versions: MemoVersion[];
  currentVersion: number;
  isLoading: boolean;
  onRestoreVersion: (versionId: string) => Promise<void>;
  dealName: string;
}

export default function MemoVersionHistoryModal({
  isOpen,
  onClose,
  versions,
  currentVersion,
  isLoading,
  onRestoreVersion,
  dealName
}: MemoVersionHistoryModalProps) {
  const { canRestoreVersions } = usePermissions();
  
  const handleRestore = async (versionId: string, version: number) => {
    const confirmed = window.confirm(
      `Restore to version ${version}? This will replace the current memo content.`
    );
    
    if (confirmed) {
      try {
        await onRestoreVersion(versionId);
        onClose();
      } catch (error) {
        console.error('Failed to restore version:', error);
      }
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-4xl max-h-[80vh]">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <FileText className="h-5 w-5" />
            Version History - {dealName}
          </DialogTitle>
          <DialogDescription>
            View and restore previous versions of this investment memo
          </DialogDescription>
        </DialogHeader>

        <ScrollArea className="h-[60vh] pr-4">
          {isLoading ? (
            <div className="flex items-center justify-center p-8">
              <div className="text-center">
                <div className="animate-spin h-8 w-8 border-b-2 border-primary rounded-full mx-auto mb-4"></div>
                <p className="text-muted-foreground">Loading version history...</p>
              </div>
            </div>
          ) : versions.length === 0 ? (
            <div className="text-center p-8">
              <FileText className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
              <h3 className="text-lg font-medium mb-2">No Versions Yet</h3>
              <p className="text-muted-foreground">
                Memo versions will appear here once you save or regenerate content.
              </p>
            </div>
          ) : (
            <div className="space-y-4">
              {versions.map((version) => (
                <Card 
                  key={version.id}
                  className={`relative ${version.version === currentVersion ? 'ring-2 ring-primary' : ''}`}
                >
                  <CardHeader className="pb-3">
                    <div className="flex items-center justify-between">
                      <CardTitle className="text-lg flex items-center gap-2">
                        Version {version.version}
                        {version.version === currentVersion && (
                          <Badge variant="default" className="text-xs">
                            Current
                          </Badge>
                        )}
                      </CardTitle>
                      <div className="flex gap-2">
                        {version.version !== currentVersion && canRestoreVersions && (
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => handleRestore(version.id, version.version)}
                            className="flex items-center gap-1"
                          >
                            <RotateCcw className="h-3 w-3" />
                            Restore
                          </Button>
                        )}
                      </div>
                    </div>
                  </CardHeader>
                  
                  <CardContent className="pt-0">
                    <div className="space-y-3">
                      <div className="flex items-center gap-4 text-sm text-muted-foreground">
                        <div className="flex items-center gap-1">
                          <Calendar className="h-3 w-3" />
                          {formatDistanceToNow(new Date(version.created_at), { addSuffix: true })}
                        </div>
                        <div className="flex items-center gap-1">
                          <User className="h-3 w-3" />
                          System
                        </div>
                      </div>
                      
                      {version.description && (
                        <p className="text-sm text-muted-foreground">
                          {version.description}
                        </p>
                      )}
                      
                      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-xs">
                        {Object.entries(version.content || {}).map(([key, value]) => (
                          <div key={key} className="bg-muted rounded p-2">
                            <div className="font-medium capitalize mb-1">
                              {key.replace(/_/g, ' ')}
                            </div>
                            <div className="text-muted-foreground truncate">
                              {typeof value === 'string' 
                                ? value.slice(0, 50) + (value.length > 50 ? '...' : '')
                                : 'Complex data'
                              }
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </ScrollArea>

        <div className="flex justify-end gap-2 pt-4 border-t">
          <Button variant="outline" onClick={onClose}>
            Close
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}