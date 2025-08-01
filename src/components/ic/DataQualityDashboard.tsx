import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { 
  CheckCircle, 
  AlertTriangle, 
  XCircle, 
  Database, 
  Target, 
  BarChart3,
  Globe,
  FileText
} from "lucide-react";

interface DataSource {
  name: string;
  status: 'validated' | 'partial' | 'missing';
  confidence: number;
  lastUpdated?: string;
}

interface DataQualityDashboardProps {
  ragStatus: string;
  ragConfidence: number;
  thesisAlignment: number;
  dataSources: DataSource[];
  overallScore: number;
}

const DataQualityDashboard = ({ 
  ragStatus, 
  ragConfidence, 
  thesisAlignment, 
  dataSources, 
  overallScore 
}: DataQualityDashboardProps) => {
  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'validated':
        return <CheckCircle className="h-4 w-4 text-green-600" />;
      case 'partial':
        return <AlertTriangle className="h-4 w-4 text-yellow-600" />;
      case 'missing':
        return <XCircle className="h-4 w-4 text-red-600" />;
      default:
        return <AlertTriangle className="h-4 w-4 text-gray-600" />;
    }
  };

  const getStatusBadge = (status: string) => {
    const variants = {
      'validated': 'default',
      'partial': 'secondary', 
      'missing': 'destructive'
    } as const;
    
    return (
      <Badge variant={variants[status as keyof typeof variants] || 'secondary'}>
        {status}
      </Badge>
    );
  };

  const getRagColor = (ragStatus: string) => {
    switch (ragStatus?.toLowerCase()) {
      case 'green':
      case 'exciting':
        return 'text-green-600';
      case 'amber':
      case 'promising':
        return 'text-yellow-600';
      case 'red':
      case 'needs_development':
        return 'text-red-600';
      default:
        return 'text-gray-600';
    }
  };

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
      {/* RAG Status */}
      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-sm flex items-center gap-2">
            <Target className="h-4 w-4" />
            RAG Status
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className={`text-lg font-semibold ${getRagColor(ragStatus)}`}>
            {ragStatus?.toUpperCase() || 'N/A'}
          </div>
          <div className="text-sm text-muted-foreground">
            Confidence: {ragConfidence}%
          </div>
          <Progress value={ragConfidence} className="mt-2" />
        </CardContent>
      </Card>

      {/* Thesis Alignment */}
      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-sm flex items-center gap-2">
            <BarChart3 className="h-4 w-4" />
            Thesis Alignment
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-lg font-semibold text-blue-600">
            {thesisAlignment}%
          </div>
          <div className="text-sm text-muted-foreground">
            Strategy Match
          </div>
          <Progress value={thesisAlignment} className="mt-2" />
        </CardContent>
      </Card>

      {/* Overall Score */}
      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-sm flex items-center gap-2">
            <Globe className="h-4 w-4" />
            Overall Score
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-lg font-semibold text-purple-600">
            {overallScore}/100
          </div>
          <div className="text-sm text-muted-foreground">
            Composite Rating
          </div>
          <Progress value={overallScore} className="mt-2" />
        </CardContent>
      </Card>

      {/* Data Completeness */}
      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-sm flex items-center gap-2">
            <Database className="h-4 w-4" />
            Data Quality
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-2">
            {dataSources.map((source, index) => (
              <div key={index} className="flex items-center justify-between text-xs">
                <div className="flex items-center gap-1">
                  {getStatusIcon(source.status)}
                  <span>{source.name}</span>
                </div>
                {getStatusBadge(source.status)}
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default DataQualityDashboard;