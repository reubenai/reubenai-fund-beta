import React, { useCallback } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Upload, X, File, CheckCircle, AlertCircle, XCircle } from 'lucide-react';
import { useDropzone } from 'react-dropzone';

interface ParseResult {
  id: string;
  dealId?: string; // Added to store created deal ID
  data: any;
  status: 'success' | 'error' | 'warning';
  message: string;
  originalRow: any;
  pitchDeckFile?: File;
  removed?: boolean;
}

interface DealPreviewTableProps {
  deals: ParseResult[];
  onDealRemove: (dealId: string) => void;
  onPitchDeckUpload: (dealId: string, file: File) => void;
}

export const DealPreviewTable: React.FC<DealPreviewTableProps> = ({
  deals,
  onDealRemove,
  onPitchDeckUpload
}) => {
  const PitchDeckUploadCell: React.FC<{ deal: ParseResult }> = ({ deal }) => {
    const onDrop = useCallback((acceptedFiles: File[]) => {
      const file = acceptedFiles[0];
      if (file) {
        onPitchDeckUpload(deal.id, file);
      }
    }, [deal.id]);

    const { getRootProps, getInputProps, isDragActive } = useDropzone({
      onDrop,
      accept: {
        'application/pdf': ['.pdf'],
        'application/vnd.openxmlformats-officedocument.presentationml.presentation': ['.pptx'],
        'application/vnd.ms-powerpoint': ['.ppt']
      },
      maxFiles: 1,
      multiple: false
    });

    if (deal.removed) {
      return <div className="text-muted-foreground">Deal removed</div>;
    }

    if (deal.pitchDeckFile) {
      return (
        <div className="flex items-center gap-2">
          <File className="w-4 h-4 text-green-600" />
          <span className="text-sm text-green-600 font-medium">
            {deal.pitchDeckFile.name}
          </span>
          <Button
            variant="ghost"
            size="sm"
            onClick={() => onPitchDeckUpload(deal.id, null as any)} // Remove file
            className="h-6 w-6 p-0"
          >
            <X className="w-3 h-3" />
          </Button>
        </div>
      );
    }

    return (
      <div
        {...getRootProps()}
        className={`border border-dashed rounded-lg p-2 text-center cursor-pointer transition-colors
          ${isDragActive 
            ? 'border-primary bg-primary/5' 
            : 'border-muted-foreground/25 hover:border-muted-foreground/50'
          }`}
      >
        <input {...getInputProps()} />
        <div className="flex items-center justify-center gap-2">
          <Upload className="w-4 h-4 text-muted-foreground" />
          <span className="text-xs text-muted-foreground">
            {isDragActive ? 'Drop here' : 'Upload Pitch Deck'}
          </span>
        </div>
        <div className="text-xs text-muted-foreground mt-1">
          PDF, PPT, PPTX
        </div>
      </div>
    );
  };

  const activeDeals = deals.filter(deal => !deal.removed);
  const removedDeals = deals.filter(deal => deal.removed);

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'success':
        return <CheckCircle className="w-4 h-4 text-green-600" />;
      case 'warning':
        return <AlertCircle className="w-4 h-4 text-yellow-600" />;
      case 'error':
        return <XCircle className="w-4 h-4 text-red-600" />;
      default:
        return null;
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'success':
        return <Badge variant="outline" className="bg-green-50 text-green-700 border-green-200">Valid</Badge>;
      case 'warning':
        return <Badge variant="outline" className="bg-yellow-50 text-yellow-700 border-yellow-200">Warning</Badge>;
      case 'error':
        return <Badge variant="outline" className="bg-red-50 text-red-700 border-red-200">Error</Badge>;
      default:
        return null;
    }
  };

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center justify-between">
            <span>Review Deals & Add Pitch Decks</span>
            <div className="flex gap-2">
              <Badge variant="outline">
                {activeDeals.length} Active
              </Badge>
              {removedDeals.length > 0 && (
                <Badge variant="outline" className="bg-red-50 text-red-700 border-red-200">
                  {removedDeals.length} Removed
                </Badge>
              )}
            </div>
          </CardTitle>
        </CardHeader>
        <CardContent>
          {activeDeals.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              No valid deals to process. Please upload a file with valid deal data.
            </div>
          ) : (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className="w-12">Status</TableHead>
                    <TableHead>Company</TableHead>
                    <TableHead>Founder</TableHead>
                    <TableHead>Sector</TableHead>
                    <TableHead>Stage</TableHead>
                    <TableHead>Amount</TableHead>
                    <TableHead className="w-48">Pitch Deck</TableHead>
                    <TableHead className="w-12">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {activeDeals.map((deal) => (
                    <TableRow key={deal.id} className={deal.status === 'error' ? 'opacity-50' : ''}>
                      <TableCell>
                        <div className="flex items-center gap-2">
                          {getStatusIcon(deal.status)}
                          {getStatusBadge(deal.status)}
                        </div>
                      </TableCell>
                      <TableCell className="font-medium">
                        {deal.data.company || 'Unknown'}
                      </TableCell>
                      <TableCell>
                        {deal.data.founder || '-'}
                      </TableCell>
                      <TableCell>
                        {deal.data.sector || '-'}
                      </TableCell>
                      <TableCell>
                        {deal.data.stage || '-'}
                      </TableCell>
                      <TableCell>
                        {deal.data.amount ? `$${deal.data.amount.toLocaleString('en-US')}` : '-'}
                      </TableCell>
                      <TableCell>
                        <PitchDeckUploadCell deal={deal} />
                      </TableCell>
                      <TableCell>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => onDealRemove(deal.id)}
                          className="h-8 w-8 p-0 text-red-600 hover:text-red-700 hover:bg-red-50"
                          title="Remove deal"
                        >
                          <X className="w-4 h-4" />
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          )}

          {/* Summary */}
          <div className="mt-4 p-4 bg-muted/30 rounded-lg">
            <div className="flex items-center justify-between text-sm">
              <div className="flex gap-4">
                <span>
                  <strong>{activeDeals.filter(d => d.status === 'success').length}</strong> valid deals
                </span>
                <span>
                  <strong>{activeDeals.filter(d => d.pitchDeckFile).length}</strong> with pitch decks
                </span>
              </div>
              <div className="text-muted-foreground">
                {activeDeals.some(d => d.status === 'error') && (
                  <span className="text-red-600">
                    Deals with errors will not be processed
                  </span>
                )}
              </div>
            </div>
          </div>

          {/* Instructions */}
          <div className="mt-4 text-sm text-muted-foreground">
            <ul className="list-disc list-inside space-y-1">
              <li>Review each deal and remove any you don't want to process</li>
              <li>Upload pitch decks to improve ReubenAI analysis quality (optional)</li>
              <li>Only deals with "Valid" status will be processed</li>
              <li>Pitch decks will be analyzed for financial projections, team info, and market data</li>
            </ul>
          </div>
        </CardContent>
      </Card>

      {/* Removed Deals (if any) */}
      {removedDeals.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="text-red-700">Removed Deals ({removedDeals.length})</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              {removedDeals.map((deal) => (
                <div key={deal.id} className="flex items-center justify-between p-2 bg-red-50 rounded">
                  <span className="text-sm text-red-700">
                    {deal.data.company || 'Unknown Company'}
                  </span>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => onDealRemove(deal.id)} // This will toggle it back
                    className="text-red-600 hover:text-red-700"
                  >
                    Restore
                  </Button>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
};