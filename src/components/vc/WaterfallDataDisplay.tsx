import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { AlertCircle, Database, FileText, Linkedin, Building2, Search } from 'lucide-react';
import { useVCDatapointsWaterfall } from '@/hooks/useVCDatapointsWaterfall';

interface WaterfallDataDisplayProps {
  dealId: string;
}

const getSourceIcon = (source: string) => {
  switch (source.toLowerCase()) {
    case 'documents':
      return <FileText className="w-4 h-4" />;
    case 'crunchbase':
      return <Database className="w-4 h-4" />;
    case 'linkedin export':
    case 'linkedin profile':
      return <Linkedin className="w-4 h-4" />;
    case 'perplexity research':
      return <Search className="w-4 h-4" />;
    default:
      return <Building2 className="w-4 h-4" />;
  }
};

const getConfidenceBadgeVariant = (confidence: string) => {
  switch (confidence) {
    case 'high':
      return 'default';
    case 'medium':
      return 'secondary';
    case 'low':
      return 'outline';
    default:
      return 'outline';
  }
};

export function WaterfallDataDisplay({ dealId }: WaterfallDataDisplayProps) {
  const { data, isLoading, error } = useVCDatapointsWaterfall(dealId);

  if (isLoading) {
    return <div className="animate-pulse">Loading waterfall data...</div>;
  }

  if (error) {
    return (
      <Alert variant="destructive">
        <AlertCircle className="h-4 w-4" />
        <AlertDescription>Error loading data: {error}</AlertDescription>
      </Alert>
    );
  }

  if (!data) {
    return null;
  }

  return (
    <div className="space-y-4">
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">VC Data Points - Waterfall Extraction</CardTitle>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* Employee Count */}
          <div className="flex items-start justify-between">
            <div className="flex-1">
              <h4 className="font-medium text-sm mb-1">Employee Count</h4>
              <div className="flex items-center gap-2 mb-2">
                {data.employee_count.isFallback ? (
                  <Alert className="w-full">
                    <AlertCircle className="h-4 w-4" />
                    <AlertDescription className="text-sm">
                      {data.employee_count.value as string}
                    </AlertDescription>
                  </Alert>
                ) : (
                  <span className="text-2xl font-semibold">
                    {data.employee_count.value}
                  </span>
                )}
              </div>
              <div className="flex items-center gap-2">
                {getSourceIcon(data.employee_count.source)}
                <span className="text-sm text-muted-foreground">
                  From {data.employee_count.source}
                </span>
                <Badge variant={getConfidenceBadgeVariant(data.employee_count.confidence)}>
                  {data.employee_count.confidence} confidence
                </Badge>
              </div>
            </div>
          </div>

          {/* Founding Year */}
          <div className="flex items-start justify-between">
            <div className="flex-1">
              <h4 className="font-medium text-sm mb-1">Founding Year</h4>
              <div className="flex items-center gap-2 mb-2">
                {data.founding_year.isFallback ? (
                  <Alert className="w-full">
                    <AlertCircle className="h-4 w-4" />
                    <AlertDescription className="text-sm">
                      {data.founding_year.value as string}
                    </AlertDescription>
                  </Alert>
                ) : (
                  <span className="text-2xl font-semibold">
                    {data.founding_year.value}
                  </span>
                )}
              </div>
              <div className="flex items-center gap-2">
                {getSourceIcon(data.founding_year.source)}
                <span className="text-sm text-muted-foreground">
                  From {data.founding_year.source}
                </span>
                <Badge variant={getConfidenceBadgeVariant(data.founding_year.confidence)}>
                  {data.founding_year.confidence} confidence
                </Badge>
              </div>
            </div>
          </div>

          {/* Business Model */}
          <div className="flex items-start justify-between">
            <div className="flex-1">
              <h4 className="font-medium text-sm mb-1">Business Model</h4>
              <div className="mb-2">
                {data.business_model.isFallback ? (
                  <Alert className="w-full">
                    <AlertCircle className="h-4 w-4" />
                    <AlertDescription className="text-sm">
                      {data.business_model.value as string}
                    </AlertDescription>
                  </Alert>
                ) : (
                  <p className="text-sm">
                    {data.business_model.value}
                  </p>
                )}
              </div>
              <div className="flex items-center gap-2">
                {getSourceIcon(data.business_model.source)}
                <span className="text-sm text-muted-foreground">
                  From {data.business_model.source}
                </span>
                <Badge variant={getConfidenceBadgeVariant(data.business_model.confidence)}>
                  {data.business_model.confidence} confidence
                </Badge>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}