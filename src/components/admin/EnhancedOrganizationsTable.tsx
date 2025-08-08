import { useState } from 'react';
import { Search, Edit, Save, X, Building2, Calendar, Globe } from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';

interface Organization {
  id: string;
  name: string;
  domain: string | null;
  created_at: string;
  updated_at: string;
}

interface EnhancedOrganizationsTableProps {
  organizations: Organization[];
  onUpdateOrganization: (org: Organization) => void;
  loading: boolean;
}

export function EnhancedOrganizationsTable({ 
  organizations, 
  onUpdateOrganization, 
  loading 
}: EnhancedOrganizationsTableProps) {
  const [searchTerm, setSearchTerm] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const [editingOrg, setEditingOrg] = useState<Organization | null>(null);
  const itemsPerPage = 10;

  // Filter organizations based on search term
  const filteredOrganizations = organizations.filter(org =>
    org.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    (org.domain && org.domain.toLowerCase().includes(searchTerm.toLowerCase()))
  );

  // Calculate pagination
  const totalPages = Math.ceil(filteredOrganizations.length / itemsPerPage);
  const startIndex = (currentPage - 1) * itemsPerPage;
  const paginatedOrganizations = filteredOrganizations.slice(startIndex, startIndex + itemsPerPage);

  const handleSaveEdit = () => {
    if (editingOrg) {
      onUpdateOrganization(editingOrg);
      setEditingOrg(null);
    }
  };

  const handleCancelEdit = () => {
    setEditingOrg(null);
  };

  return (
    <Card className="border-0 shadow-sm">
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle className="text-lg font-medium flex items-center gap-2">
              <Building2 className="h-5 w-5" />
              Organizations
            </CardTitle>
            <CardDescription>
              Manage existing organizations ({organizations.length} total)
            </CardDescription>
          </div>
        </div>
        
        {/* Search Bar */}
        <div className="relative">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search organizations by name or domain..."
            value={searchTerm}
            onChange={(e) => {
              setSearchTerm(e.target.value);
              setCurrentPage(1); // Reset to first page when searching
            }}
            className="pl-10"
          />
        </div>
      </CardHeader>
      
      <CardContent>
        {loading ? (
          <div className="flex items-center justify-center py-8">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
          </div>
        ) : paginatedOrganizations.length === 0 ? (
          <div className="text-center py-8 text-muted-foreground">
            {searchTerm ? 'No organizations match your search.' : 'No organizations found.'}
          </div>
        ) : (
          <>
            {/* Table */}
            <div className="rounded-md border">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Organization</TableHead>
                    <TableHead>Domain</TableHead>
                    <TableHead>Created</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead className="text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {paginatedOrganizations.map((org) => (
                    <TableRow key={org.id}>
                      <TableCell>
                        {editingOrg?.id === org.id ? (
                          <Input
                            value={editingOrg.name}
                            onChange={(e) => setEditingOrg({ ...editingOrg, name: e.target.value })}
                            placeholder="Organization name"
                            className="w-full"
                          />
                        ) : (
                          <div>
                            <div className="font-medium">{org.name}</div>
                            <div className="text-sm text-muted-foreground">
                              ID: {org.id.slice(0, 8)}...
                            </div>
                          </div>
                        )}
                      </TableCell>
                      <TableCell>
                        {editingOrg?.id === org.id ? (
                          <Input
                            value={editingOrg.domain || ''}
                            onChange={(e) => setEditingOrg({ ...editingOrg, domain: e.target.value })}
                            placeholder="Domain"
                            className="w-full"
                          />
                        ) : (
                          <div className="flex items-center gap-2">
                            {org.domain ? (
                              <>
                                <Globe className="h-4 w-4 text-muted-foreground" />
                                <span>{org.domain}</span>
                              </>
                            ) : (
                              <span className="text-muted-foreground">No domain</span>
                            )}
                          </div>
                        )}
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-2">
                          <Calendar className="h-4 w-4 text-muted-foreground" />
                          <span>{new Date(org.created_at).toLocaleDateString()}</span>
                        </div>
                      </TableCell>
                      <TableCell>
                        <Badge variant="secondary">
                          Active
                        </Badge>
                      </TableCell>
                      <TableCell className="text-right">
                        {editingOrg?.id === org.id ? (
                          <div className="flex gap-2 justify-end">
                            <Button size="sm" onClick={handleSaveEdit} className="h-8 px-3">
                              <Save className="h-4 w-4" />
                            </Button>
                            <Button size="sm" variant="outline" onClick={handleCancelEdit} className="h-8 px-3">
                              <X className="h-4 w-4" />
                            </Button>
                          </div>
                        ) : (
                          <Button size="sm" variant="outline" onClick={() => setEditingOrg(org)} className="h-8 px-3">
                            <Edit className="h-4 w-4" />
                          </Button>
                        )}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>

            {/* Pagination */}
            {totalPages > 1 && (
              <div className="flex items-center justify-between px-2 py-4">
                <div className="text-sm text-muted-foreground">
                  Showing {startIndex + 1} to {Math.min(startIndex + itemsPerPage, filteredOrganizations.length)} of{' '}
                  {filteredOrganizations.length} organizations
                </div>
                <div className="flex gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setCurrentPage(prev => Math.max(prev - 1, 1))}
                    disabled={currentPage === 1}
                  >
                    Previous
                  </Button>
                  <div className="flex items-center gap-1">
                    {Array.from({ length: totalPages }, (_, i) => i + 1).map((page) => (
                      <Button
                        key={page}
                        variant={currentPage === page ? "default" : "outline"}
                        size="sm"
                        onClick={() => setCurrentPage(page)}
                        className="w-8"
                      >
                        {page}
                      </Button>
                    ))}
                  </div>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setCurrentPage(prev => Math.min(prev + 1, totalPages))}
                    disabled={currentPage === totalPages}
                  >
                    Next
                  </Button>
                </div>
              </div>
            )}
          </>
        )}
      </CardContent>
    </Card>
  );
}