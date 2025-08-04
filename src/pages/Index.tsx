import { useEffect, useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Building2, TrendingUp, FileText, Users, Zap, Target, BarChart3, Plus, BookOpen, Video, MessageSquare, HelpCircle, Search } from 'lucide-react';
import { useAuth } from '@/hooks/useAuth';
import { useFund } from '@/contexts/FundContext';
import { supabase } from '@/integrations/supabase/client';
import { Link } from 'react-router-dom';
import { FundCreationWizard } from '@/components/funds/FundCreationWizard';
import { Breadcrumbs } from '@/components/ui/breadcrumbs';

const Index = () => {
  const { user } = useAuth();
  const { funds } = useFund();
  const [profile, setProfile] = useState<any>(null);
  const [showFundWizard, setShowFundWizard] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState<any[]>([]);
  const [isSearching, setIsSearching] = useState(false);
  const [stats, setStats] = useState({
    activeFunds: 0,
    activeDeals: 0,
    aiAnalysis: 0,
    investmentCommittee: 0,
  });

  useEffect(() => {
    if (user) {
      fetchUserData();
    }
  }, [user]);

  useEffect(() => {
    // Update stats when funds change
    setStats(prev => ({
      ...prev,
      activeFunds: funds.length,
    }));
  }, [funds]);

  const fetchUserData = async () => {
    // Fetch user profile
    const { data: profileData } = await supabase
      .from('profiles')
      .select('*')
      .eq('user_id', user?.id)
      .single();
    
    setProfile(profileData);
  };

  const handleSearch = async (query: string) => {
    if (!query.trim()) {
      setSearchResults([]);
      return;
    }
    
    setIsSearching(true);
    try {
      // Search across deals, companies, and documents
      const { data: deals } = await supabase
        .from('deals')
        .select('id, company_name, description, industry, stage')
        .ilike('company_name', `%${query}%`)
        .limit(5);
      
      const { data: documents } = await supabase
        .from('deal_documents')
        .select('id, file_name, document_type, deal_id')
        .ilike('file_name', `%${query}%`)
        .limit(5);
      
      const results = [
        ...(deals || []).map((deal: any) => ({ ...deal, type: 'deal' })),
        ...(documents || []).map((doc: any) => ({ ...doc, type: 'document' }))
      ];
      
      setSearchResults(results);
    } catch (error) {
      console.error('Search error:', error);
    } finally {
      setIsSearching(false);
    }
  };

  const quickActions = [
    { title: 'Investment Strategy', icon: Target, href: '/strategy', description: 'Define and manage your investment criteria' },
    { title: 'Deal Pipeline', icon: TrendingUp, href: '/pipeline', description: 'Manage deal flow and opportunities' },
    { title: 'Investment Committee', icon: Users, href: '/ic', description: 'IC investment decisions and evaluations' },
    { title: 'AI Analysis', icon: Zap, href: '/pipeline', description: 'AI-powered deal scoring and intelligence' },
  ];

  return (
    <div className="bg-slate-50/30 ml-12">
      <div className="px-6 py-6 min-h-screen">
        <Breadcrumbs />
        {/* Top Bar with What is ReubenAI Button */}
        <div className="flex justify-end mb-8">
          <Link to="/what-is-reubenai">
            <Button variant="outline" size="sm" className="gap-2 bg-white hover:bg-slate-50">
              <HelpCircle className="h-4 w-4" />
              What is ReubenAI?
            </Button>
          </Link>
        </div>

        {/* Welcome Header */}
        <div className="mb-8">
          <div className="flex items-center gap-2 mb-2">
            <div className="w-6 h-6 bg-emerald-500 rounded flex items-center justify-center">
              <span className="text-white text-xs font-bold">R</span>
            </div>
          <h1 className="text-3xl font-semibold text-slate-900">
            Welcome back, {profile?.first_name || user?.email?.split('@')[0] || 'demo'}
          </h1>
          </div>
          <p className="text-slate-600">
            Your AI-powered investment platform for smarter decisions
          </p>
        </div>

      {/* Search Section */}
      <div className="mb-8">
        <div className="relative max-w-2xl">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-slate-400" />
          <Input
            placeholder="Search deals, companies, documents..."
            value={searchQuery}
            onChange={(e) => {
              setSearchQuery(e.target.value);
              handleSearch(e.target.value);
            }}
            className="pl-10 h-12 bg-white border-slate-200 focus:border-emerald-300 focus:ring-emerald-100"
          />
          {isSearching && (
            <div className="absolute right-3 top-1/2 transform -translate-y-1/2">
              <div className="animate-spin h-4 w-4 border-2 border-emerald-500 border-t-transparent rounded-full"></div>
            </div>
          )}
        </div>
        
        {/* Search Results */}
        {searchResults.length > 0 && (
          <div className="mt-4 bg-white border border-slate-200 rounded-lg shadow-sm max-w-2xl">
            <div className="p-4 border-b border-slate-100">
              <h3 className="font-medium text-slate-900">Search Results</h3>
            </div>
            <div className="max-h-64 overflow-y-auto">
              {searchResults.map((result, index) => (
                <Link
                  key={index}
                  to={result.type === 'deal' ? `/pipeline?deal=${result.id}` : `/pipeline?deal=${result.deal_id}`}
                  className="block p-4 hover:bg-slate-50 border-b border-slate-100 last:border-b-0"
                >
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 bg-slate-100 rounded-lg flex items-center justify-center">
                      {result.type === 'deal' ? (
                        <Building2 className="h-4 w-4 text-slate-600" />
                      ) : (
                        <FileText className="h-4 w-4 text-slate-600" />
                      )}
                    </div>
                    <div className="flex-1">
                      <h4 className="font-medium text-slate-900">
                        {result.type === 'deal' ? result.company_name : result.file_name}
                      </h4>
                      <p className="text-sm text-slate-600">
                        {result.type === 'deal' ? `${result.industry} • ${result.stage}` : `Document • ${result.document_type}`}
                      </p>
                    </div>
                  </div>
                </Link>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* Quick Explore */}
      <div className="mb-8">
        <h2 className="text-lg font-medium text-slate-900 mb-4">Quick Explore</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          {quickActions.map((action, index) => (
            <Link 
              key={index}
              to={action.href}
              className="group bg-white p-6 border border-slate-200 rounded-lg hover:shadow-sm hover:border-slate-300 transition-all duration-200"
            >
              <div className="w-12 h-12 bg-slate-800 rounded-lg flex items-center justify-center mb-4">
                <action.icon className="h-6 w-6 text-white" />
              </div>
              <h3 className="font-semibold text-slate-900 mb-2">{action.title}</h3>
              <p className="text-sm text-slate-600 leading-relaxed">{action.description}</p>
            </Link>
          ))}
        </div>
      </div>

      {/* Your Funds */}
      <div className="mb-8">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-medium text-slate-900">Your Funds ({funds.length})</h2>
          <Button 
            onClick={() => setShowFundWizard(true)}
            size="sm"
            className="gap-2"
          >
            <Plus className="h-4 w-4" />
            Create Fund
          </Button>
        </div>

        {/* Admin Table View */}
        {(profile?.role === 'super_admin' || profile?.role === 'admin') ? (
          <div className="bg-white border border-slate-200 rounded-lg">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Fund Name</TableHead>
                  <TableHead>Type</TableHead>
                  <TableHead>Size</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Organization</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {funds.map((fund) => (
                  <TableRow key={fund.id}>
                    <TableCell>
                      <div>
                        <div className="font-medium text-slate-900">{fund.name}</div>
                        <div className="text-sm text-slate-600 line-clamp-1">
                          {fund.description || 'Investment fund focused on exceptional opportunities.'}
                        </div>
                      </div>
                    </TableCell>
                    <TableCell>
                      <Badge variant="outline">
                        {fund.fund_type.replace('_', ' ').replace(/\b\w/g, l => l.toUpperCase())}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <span className="font-medium">
                        {fund.target_size ? `$${(fund.target_size / 1000000).toFixed(0)}M` : 'TBD'}
                      </span>
                    </TableCell>
                    <TableCell>
                      <Badge variant={fund.is_active ? "default" : "secondary"}>
                        {fund.is_active ? 'Active' : 'Inactive'}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <span className="text-sm text-slate-600">{fund.organization_id}</span>
                    </TableCell>
                    <TableCell className="text-right">
                      <div className="flex gap-2 justify-end">
                        <Link to={`/pipeline?fund=${fund.id}`}>
                          <Button variant="ghost" size="sm" className="text-emerald-600 hover:text-emerald-700 hover:bg-emerald-50">
                            Pipeline
                          </Button>
                        </Link>
                        <Link to={`/strategy?fund=${fund.id}`}>
                          <Button variant="outline" size="sm">
                            Strategy
                          </Button>
                        </Link>
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        ) : (
          /* Regular User Card View */
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {funds.map((fund) => (
              <div key={fund.id} className={`bg-white p-6 border rounded-lg hover:shadow-md transition-all ${
                fund.is_active ? 'border-emerald-200 ring-2 ring-emerald-100 shadow-sm' : 'border-slate-200'
              }`}>
                <div className="flex items-start justify-between mb-4">
                  <div className="flex-1">
                    <div className="flex items-center gap-3 mb-2">
                      <h3 className="font-semibold text-slate-900">{fund.name}</h3>
                      <span className="inline-flex items-center px-2 py-1 bg-emerald-50 border border-emerald-200 rounded text-xs font-medium text-emerald-700">
                        {fund.fund_type.replace('_', ' ').replace(/\b\w/g, l => l.toUpperCase())}
                      </span>
                    </div>
                    <p className="text-sm text-slate-600 mb-4 line-clamp-2">
                      {fund.description || 'Investment fund focused on exceptional opportunities.'}
                    </p>
                  </div>
                </div>
                
                <div className="grid grid-cols-2 gap-4 mb-4 pb-4 border-b border-slate-100">
                  <div>
                    <p className="text-xs text-slate-500 uppercase tracking-wide mb-1">Fund Size</p>
                    <p className="text-sm font-semibold text-slate-900">
                      {fund.target_size ? `$${(fund.target_size / 1000000).toFixed(0)}M` : 'TBD'}
                    </p>
                  </div>
                  <div>
                    <p className="text-xs text-slate-500 uppercase tracking-wide mb-1">Status</p>
                    <p className="text-sm font-semibold text-slate-900">{fund.is_active ? 'Active' : 'Inactive'}</p>
                  </div>
                </div>
                
                <div className="flex gap-2">
                  <Link to={`/pipeline?fund=${fund.id}`} className="flex-1">
                    <Button variant="ghost" size="sm" className="w-full text-sm text-emerald-600 hover:text-emerald-700 hover:bg-emerald-50">
                      View Pipeline
                    </Button>
                  </Link>
                  <Link to={`/strategy?fund=${fund.id}`}>
                    <Button variant="outline" size="sm" className="text-sm">
                      Strategy
                    </Button>
                  </Link>
                </div>
              </div>
            ))}
            
            {/* Create New Fund Card */}
            <div className="bg-white border-2 border-dashed border-slate-300 rounded-lg p-6 flex flex-col items-center justify-center hover:border-emerald-300 hover:bg-emerald-50/30 transition-colors cursor-pointer" 
                 onClick={() => setShowFundWizard(true)}>
              <div className="w-12 h-12 bg-slate-100 rounded-lg flex items-center justify-center mb-3">
                <Plus className="h-6 w-6 text-slate-400" />
              </div>
              <h3 className="font-medium text-slate-900 mb-1">Create New Fund</h3>
              <p className="text-sm text-slate-600 text-center">Set up a new investment fund with AI-powered criteria</p>
            </div>
          </div>
        )}
      </div>

      {/* Help & Support */}
      <div className="mb-8">
        <div className="flex items-center gap-2 mb-4">
          <div className="w-5 h-5 bg-blue-100 rounded-full flex items-center justify-center">
            <span className="text-blue-600 text-xs">?</span>
          </div>
          <h2 className="text-lg font-medium text-slate-900">Help & Support</h2>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <Link to="/help" className="bg-white p-6 border border-slate-200 rounded-lg text-center hover:shadow-sm hover:border-slate-300 transition-all duration-200">
            <div className="w-12 h-12 bg-slate-100 rounded-lg flex items-center justify-center mx-auto mb-4">
              <BookOpen className="h-6 w-6 text-slate-600" />
            </div>
            <h3 className="font-semibold text-slate-900 mb-2">Guides & Tutorials</h3>
            <p className="text-sm text-slate-600">Learn how to configure investment criteria and use our AI engine</p>
          </Link>
          
          <div className="bg-white p-6 border border-slate-200 rounded-lg text-center opacity-50 cursor-not-allowed">
            <div className="w-12 h-12 bg-slate-100 rounded-lg flex items-center justify-center mx-auto mb-4">
              <Video className="h-6 w-6 text-slate-600" />
            </div>
            <h3 className="font-semibold text-slate-900 mb-2">Video Tutorials</h3>
            <p className="text-sm text-slate-600 mb-3">Watch step-by-step videos on deal sourcing and pipeline management</p>
            <span className="inline-flex items-center px-2 py-1 bg-slate-50 border border-slate-200 rounded text-xs font-medium text-slate-600">
              Coming Soon
            </span>
          </div>
          
          <Link to="/help" className="bg-white p-6 border border-slate-200 rounded-lg text-center hover:shadow-sm hover:border-slate-300 transition-all duration-200">
            <div className="w-12 h-12 bg-slate-100 rounded-lg flex items-center justify-center mx-auto mb-4">
              <MessageSquare className="h-6 w-6 text-slate-600" />
            </div>
            <h3 className="font-semibold text-slate-900 mb-2">Contact Support</h3>
            <p className="text-sm text-slate-600">Get instant help from our team via chat or submit a support request</p>
          </Link>
        </div>
      </div>

        {/* Need Help Getting Started */}
        <div className="bg-white p-8 border border-slate-200 rounded-lg text-center mb-8">
          <h3 className="text-lg font-semibold text-slate-900 mb-2">Need Help Getting Started?</h3>
          <p className="text-slate-600 mb-6">Explore our resources to take the most of Reuben AI's powerful features</p>
          <div className="flex items-center justify-center gap-3">
            <Link to="/help">
              <Button variant="outline" size="sm">
                View How Reuben Works
              </Button>
            </Link>
            <Link to="/help">
              <Button size="sm" className="bg-emerald-600 hover:bg-emerald-700 text-white">
                View Help Center
              </Button>
            </Link>
          </div>
        </div>

        <FundCreationWizard 
          isOpen={showFundWizard} 
          onClose={() => setShowFundWizard(false)} 
        />
      </div>
    </div>
  );
};

export default Index;
