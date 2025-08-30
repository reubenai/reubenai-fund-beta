import React, { useState } from 'react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { DocumentUpload } from './DocumentUpload';
import { DocumentList } from './DocumentList';
import { DocumentViewer } from './DocumentViewer';
import { DocumentAnalysisIntegration } from './DocumentAnalysisIntegration';
import { Database } from '@/integrations/supabase/types';
import { 
  Brain, 
  FileText, 
  Upload, 
  BarChart3, 
  Zap,
  CheckCircle,
  AlertCircle,
  Clock,
  ArrowRight
} from 'lucide-react';

type DealDocument = Database['public']['Tables']['deal_documents']['Row'];

interface EnhancedDocumentManagerProps {
  dealId: string;
  companyName: string;
  className?: string;
}

export function EnhancedDocumentManager({ dealId, companyName, className }: EnhancedDocumentManagerProps) {
  const [refreshTrigger, setRefreshTrigger] = useState(0);
  const [selectedDocument, setSelectedDocument] = useState<DealDocument | null>(null);
  const [activeTab, setActiveTab] = useState('overview');

  const handleUploadComplete = () => {
    setRefreshTrigger(prev => prev + 1);
  };

  // Mock data for demonstration
  const documentStats = {
    total: 12,
    processed: 10,
    pending: 2,
    analysisScore: 85,
    lastUpdate: '2 hours ago'
  };

  const recentActivity = [
    { type: 'upload', document: 'Financial Statements Q3.pdf', time: '5 min ago', status: 'processed' },
    { type: 'analysis', document: 'Market Research.docx', time: '1 hour ago', status: 'complete' },
    { type: 'upload', document: 'Team Bios.pdf', time: '2 hours ago', status: 'processing' },
  ];

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'processed':
      case 'complete':
        return <CheckCircle className="w-4 h-4 text-green-500" />;
      case 'processing':
        return <Clock className="w-4 h-4 text-yellow-500" />;
      default:
        return <AlertCircle className="w-4 h-4 text-red-500" />;
    }
  };

  return (
    <div className={className}>
      <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
        <TabsList className="grid w-full grid-cols-4 mb-6">
          <TabsTrigger value="overview" className="flex items-center gap-2">
            <BarChart3 className="w-4 h-4" />
            Overview
          </TabsTrigger>
          <TabsTrigger value="list" className="flex items-center gap-2">
            <FileText className="w-4 h-4" />
            Documents
          </TabsTrigger>
          <TabsTrigger value="upload" className="flex items-center gap-2">
            <Upload className="w-4 h-4" />
            Upload
          </TabsTrigger>
          <TabsTrigger value="analysis" className="flex items-center gap-2">
            <Brain className="w-4 h-4" />
            AI Analysis
          </TabsTrigger>
        </TabsList>

        <TabsContent value="overview" className="space-y-6 animate-in fade-in-50 duration-300">
          {/* Stats Overview */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            <Card className="transition-all duration-200 hover:scale-105 hover:shadow-md">
              <CardContent className="p-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-muted-foreground">Total Documents</p>
                    <p className="text-2xl font-bold text-primary">{documentStats.total}</p>
                  </div>
                  <FileText className="w-8 h-8 text-primary" />
                </div>
              </CardContent>
            </Card>

            <Card className="transition-all duration-200 hover:scale-105 hover:shadow-md">
              <CardContent className="p-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-muted-foreground">Processed</p>
                    <p className="text-2xl font-bold text-green-600">{documentStats.processed}</p>
                  </div>
                  <CheckCircle className="w-8 h-8 text-green-600" />
                </div>
              </CardContent>
            </Card>

            <Card className="transition-all duration-200 hover:scale-105 hover:shadow-md">
              <CardContent className="p-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-muted-foreground">Pending</p>
                    <p className="text-2xl font-bold text-yellow-600">{documentStats.pending}</p>
                  </div>
                  <Clock className="w-8 h-8 text-yellow-600" />
                </div>
              </CardContent>
            </Card>

            <Card className="transition-all duration-200 hover:scale-105 hover:shadow-md">
              <CardContent className="p-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-muted-foreground">Analysis Score</p>
                    <p className="text-2xl font-bold text-blue-600">{documentStats.analysisScore}%</p>
                  </div>
                  <Brain className="w-8 h-8 text-blue-600" />
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Processing Status */}
          <Card className="bg-gradient-to-r from-blue-50 to-indigo-50">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Zap className="w-5 h-5 text-blue-600" />
                Document Processing Status
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div className="flex items-center justify-between text-sm">
                  <span>Processing Progress</span>
                  <span>{documentStats.processed}/{documentStats.total} complete</span>
                </div>
                <Progress 
                  value={(documentStats.processed / documentStats.total) * 100} 
                  className="h-2"
                />
                <p className="text-sm text-muted-foreground">
                  Last updated {documentStats.lastUpdate}
                </p>
              </div>
            </CardContent>
          </Card>

          {/* Recent Activity */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <ArrowRight className="w-5 h-5" />
                Recent Activity
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {recentActivity.map((activity, index) => (
                  <div 
                    key={index} 
                    className="flex items-center justify-between p-3 rounded-lg bg-muted/30 transition-all duration-200 hover:bg-muted/50"
                  >
                    <div className="flex items-center gap-3">
                      {getStatusIcon(activity.status)}
                      <div>
                        <p className="font-medium text-sm">{activity.document}</p>
                        <p className="text-xs text-muted-foreground capitalize">
                          {activity.type} • {activity.time}
                        </p>
                      </div>
                    </div>
                    <Badge 
                      variant={activity.status === 'complete' || activity.status === 'processed' ? 'default' : 'secondary'}
                      className="capitalize"
                    >
                      {activity.status}
                    </Badge>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>

          {/* Quick Actions */}
          <Card>
            <CardHeader>
              <CardTitle>Quick Actions</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                <Button 
                  variant="outline" 
                  className="transition-all duration-200 hover:scale-105"
                  onClick={() => setActiveTab('upload')}
                >
                  <Upload className="w-4 h-4 mr-2" />
                  Upload Documents
                </Button>
                <Button 
                  variant="outline" 
                  className="transition-all duration-200 hover:scale-105"
                  onClick={() => setActiveTab('analysis')}
                >
                  <Brain className="w-4 h-4 mr-2" />
                  Run AI Analysis
                </Button>
                <Button 
                  variant="outline" 
                  className="transition-all duration-200 hover:scale-105"
                  onClick={() => setActiveTab('list')}
                >
                  <FileText className="w-4 h-4 mr-2" />
                  View All Documents
                </Button>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
        
        <TabsContent value="list" className="space-y-4 animate-in fade-in-50 duration-300">
          <DocumentList
            dealId={dealId}
            companyName={companyName}
            onDocumentSelect={setSelectedDocument}
            refreshTrigger={refreshTrigger}
          />
        </TabsContent>
        
        <TabsContent value="upload" className="space-y-4 animate-in fade-in-50 duration-300">
          <DocumentUpload
            dealId={dealId}
            companyName={companyName}
            onUploadComplete={handleUploadComplete}
          />
        </TabsContent>

        <TabsContent value="analysis" className="space-y-4 animate-in fade-in-50 duration-300">
          <DocumentAnalysisIntegration
            dealId={dealId}
            documents={[]} // This will be populated from the DocumentList component
            onAnalysisTrigger={handleUploadComplete}
          />
        </TabsContent>
      </Tabs>

      {/* Document Viewer Modal */}
      {selectedDocument && (
        <DocumentViewer
          document={selectedDocument}
          onClose={() => setSelectedDocument(null)}
          dealId={dealId}
        />
      )}
    </div>
  );
}