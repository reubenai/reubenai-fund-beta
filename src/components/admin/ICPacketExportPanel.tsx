import React, { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { 
  Download, 
  Package, 
  FileText, 
  Shield, 
  Clock,
  CheckCircle,
  AlertTriangle
} from 'lucide-react';

interface ICPacketExport {
  id: string;
  deal_id: string;
  packet_data: any; // Using any to handle the dynamic JSON structure from database
  export_metadata: {
    exported_by_name?: string;
    file_size_kb?: number;
  };
  expires_at: string;
  created_at: string;
}

export function ICPacketExportPanel() {
  const [dealId, setDealId] = useState('');
  const [loading, setLoading] = useState(false);
  const [exports, setExports] = useState<ICPacketExport[]>([]);
  const [loadingExports, setLoadingExports] = useState(false);

  React.useEffect(() => {
    fetchRecentExports();
  }, []);

  const fetchRecentExports = async () => {
    try {
      setLoadingExports(true);
      const { data, error } = await supabase
        .from('ic_packet_exports')
        .select(`
          id,
          deal_id,
          packet_data,
          export_metadata,
          expires_at,
          created_at
        `)
        .order('created_at', { ascending: false })
        .limit(10);

      if (error) throw error;
      setExports((data || []).map(exp => ({
        ...exp,
        packet_data: exp.packet_data as any,
        export_metadata: exp.export_metadata as any
      })));
    } catch (error) {
      console.error('Error fetching exports:', error);
    } finally {
      setLoadingExports(false);
    }
  };

  const exportICPacket = async () => {
    if (!dealId.trim()) {
      toast.error('Please enter a deal ID');
      return;
    }

    try {
      setLoading(true);

      // Generate IC packet using database function
      const { data: packetData, error: packetError } = await supabase
        .rpc('generate_ic_packet', { deal_id_param: dealId });

      if (packetError) throw packetError;

      if (!packetData) {
        throw new Error('No packet data generated');
      }

      // Save to exports table
      const user = (await supabase.auth.getUser()).data.user;
      const { data: exportRecord, error: exportError } = await supabase
        .from('ic_packet_exports')
        .insert({
          deal_id: dealId,
          fund_id: (packetData as any)?.deal_summary?.fund_id || 'unknown',
          packet_data: packetData,
          exported_by: user?.id || 'system',
          export_metadata: {
            exported_by_name: user?.email || 'system',
            file_size_kb: Math.round(JSON.stringify(packetData).length / 1024),
            export_method: 'admin_panel'
          }
        })
        .select()
        .single();

      if (exportError) throw exportError;

      // Create downloadable file
      const filename = `ic-packet-${(packetData as any)?.deal_summary?.company_name?.toLowerCase()?.replace(/\s+/g, '-') || 'unknown'}-${new Date().toISOString().split('T')[0]}.json`;
      
      const blob = new Blob([JSON.stringify(packetData, null, 2)], { 
        type: 'application/json' 
      });
      
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = filename;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);

      toast.success(`IC packet exported for ${(packetData as any)?.deal_summary?.company_name || 'deal'}`);
      setDealId('');
      fetchRecentExports();
    } catch (error: any) {
      console.error('Error exporting IC packet:', error);
      toast.error(`Export failed: ${error.message || 'Unknown error'}`);
    } finally {
      setLoading(false);
    }
  };

  const downloadExistingPacket = async (exportId: string, companyName: string) => {
    try {
      const { data, error } = await supabase
        .from('ic_packet_exports')
        .select('packet_data')
        .eq('id', exportId)
        .single();

      if (error) throw error;

      const filename = `ic-packet-${companyName.toLowerCase().replace(/\s+/g, '-')}-redownload.json`;
      
      const blob = new Blob([JSON.stringify(data.packet_data, null, 2)], { 
        type: 'application/json' 
      });
      
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = filename;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);

      toast.success('Packet re-downloaded successfully');
    } catch (error) {
      console.error('Error downloading packet:', error);
      toast.error('Failed to download packet');
    }
  };

  const isExpired = (expiresAt: string) => {
    return new Date(expiresAt) < new Date();
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  return (
    <div className="space-y-6">
      {/* Export New Packet */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Package className="h-5 w-5" />
            Export New IC Packet
          </CardTitle>
          <CardDescription>
            Generate a comprehensive investment committee packet with audit trail
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid w-full items-center gap-1.5">
            <Label htmlFor="deal-id">Deal ID</Label>
            <div className="flex gap-2">
              <Input
                id="deal-id"
                placeholder="Enter deal UUID..."
                value={dealId}
                onChange={(e) => setDealId(e.target.value)}
                className="flex-1"
              />
              <Button 
                onClick={exportICPacket}
                disabled={loading || !dealId.trim()}
              >
                {loading ? (
                  <>
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                    Exporting...
                  </>
                ) : (
                  <>
                    <Download className="h-4 w-4 mr-2" />
                    Export
                  </>
                )}
              </Button>
            </div>
          </div>

          <Alert>
            <FileText className="h-4 w-4" />
            <AlertDescription>
              IC packets include: deal summary, analysis report, evidence appendix, 
              mandate snapshot, complete audit trail, and routing timeline.
            </AlertDescription>
          </Alert>
        </CardContent>
      </Card>

      {/* Recent Exports */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Clock className="h-5 w-5" />
            Recent Exports
          </CardTitle>
          <CardDescription>
            Previously generated IC packets (automatically expire after 7 days)
          </CardDescription>
        </CardHeader>
        <CardContent>
          {loadingExports ? (
            <div className="flex items-center justify-center p-8">
              <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-primary"></div>
            </div>
          ) : exports.length === 0 ? (
            <p className="text-center text-muted-foreground py-8">
              No IC packets exported yet
            </p>
          ) : (
            <div className="space-y-3">
              {exports.map((exportRecord) => {
                const expired = isExpired(exportRecord.expires_at);
                const companyName = exportRecord.packet_data.deal_summary.company_name;
                
                return (
                  <div 
                    key={exportRecord.id}
                    className={`flex items-center justify-between p-4 border rounded-lg ${expired ? 'bg-muted/50' : 'bg-background'}`}
                  >
                    <div className="flex-1">
                      <div className="flex items-center gap-3 mb-2">
                        <h4 className="font-medium">{companyName}</h4>
                        <Badge variant={expired ? 'secondary' : 'default'}>
                          {exportRecord.packet_data.deal_summary.rag_status || 'Unknown'}
                        </Badge>
                        {exportRecord.packet_data.metadata.compliance_status === 'audit_ready' && (
                          <Badge variant="outline" className="text-green-600">
                            <Shield className="h-3 w-3 mr-1" />
                            Audit Ready
                          </Badge>
                        )}
                      </div>
                      
                      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm text-muted-foreground">
                        <div>
                          <span className="font-medium">Industry:</span><br />
                          {exportRecord.packet_data.deal_summary.industry || 'Not specified'}
                        </div>
                        <div>
                          <span className="font-medium">Score:</span><br />
                          {exportRecord.packet_data.deal_summary.overall_score || 'N/A'}
                        </div>
                        <div>
                          <span className="font-medium">Exported:</span><br />
                          {formatDate(exportRecord.created_at)}
                        </div>
                        <div>
                          <span className="font-medium">Size:</span><br />
                          {exportRecord.export_metadata.file_size_kb || 0}KB
                        </div>
                      </div>
                    </div>

                    <div className="flex items-center gap-2">
                      {expired ? (
                        <Badge variant="destructive">
                          <AlertTriangle className="h-3 w-3 mr-1" />
                          Expired
                        </Badge>
                      ) : (
                        <>
                          <Badge variant="default">
                            <CheckCircle className="h-3 w-3 mr-1" />
                            Active
                          </Badge>
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => downloadExistingPacket(exportRecord.id, companyName)}
                          >
                            <Download className="h-4 w-4 mr-1" />
                            Download
                          </Button>
                        </>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Export Format Information */}
      <Card>
        <CardHeader>
          <CardTitle>IC Packet Contents</CardTitle>
          <CardDescription>
            Comprehensive institutional-grade documentation for investment decisions
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <h4 className="font-semibold mb-3">Core Analysis</h4>
              <ul className="text-sm space-y-1 text-muted-foreground">
                <li>• Deal summary and key metrics</li>
                <li>• Multi-dimensional scoring breakdown</li>
                <li>• Enhanced analysis with AI insights</li>
                <li>• Investment recommendation</li>
              </ul>
            </div>
            
            <div>
              <h4 className="font-semibold mb-3">Evidence & Compliance</h4>
              <ul className="text-sm space-y-1 text-muted-foreground">
                <li>• Evidence appendix with sources</li>
                <li>• Confidence scores and validation</li>
                <li>• Mandate snapshot for reproducibility</li>
                <li>• Complete audit trail</li>
              </ul>
            </div>
            
            <div>
              <h4 className="font-semibold mb-3">Audit Trail</h4>
              <ul className="text-sm space-y-1 text-muted-foreground">
                <li>• Model executions and versions</li>
                <li>• Prompt audit and parameters</li>
                <li>• Cost tracking and degradation events</li>
                <li>• Routing timeline and status changes</li>
              </ul>
            </div>
            
            <div>
              <h4 className="font-semibold mb-3">Metadata</h4>
              <ul className="text-sm space-y-1 text-muted-foreground">
                <li>• Export timestamp and version</li>
                <li>• Fund strategy and thresholds</li>
                <li>• Recency compliance status</li>
                <li>• Digital signature ready</li>
              </ul>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}