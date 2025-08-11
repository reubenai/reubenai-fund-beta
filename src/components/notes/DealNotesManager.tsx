import React, { useState, useEffect } from 'react';
import { format } from 'date-fns';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Separator } from '@/components/ui/separator';
import { 
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { 
  Plus, 
  MessageSquare, 
  User, 
  Calendar,
  Tag,
  Search,
  Filter,
  StickyNote,
  Users,
  TrendingUp,
  AlertTriangle,
  CheckCircle,
  Clock
} from 'lucide-react';
import { useAuth } from '@/hooks/useAuth';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';
import { usePermissions } from '@/hooks/usePermissions';

interface DealNote {
  id: string;
  content: string;
  created_at: string;
  created_by: string;
  deal_id: string;
  updated_at: string;
  tags?: string[];
  category?: string;
  sentiment?: 'positive' | 'negative' | 'neutral';
}

interface DealNotesManagerProps {
  dealId: string;
  companyName: string;
}

const NOTE_CATEGORIES = [
  { value: 'founder_meeting', label: 'Founder Meeting', icon: Users },
  { value: 'market_insights', label: 'Market Insights', icon: TrendingUp },
  { value: 'team_assessment', label: 'Team Assessment', icon: User },
  { value: 'product_feedback', label: 'Product Feedback', icon: CheckCircle },
  { value: 'financial_observations', label: 'Financial Observations', icon: TrendingUp },
  { value: 'competitive_intelligence', label: 'Competitive Intelligence', icon: AlertTriangle },
  { value: 'due_diligence', label: 'Due Diligence', icon: Search },
  { value: 'other', label: 'General Notes', icon: StickyNote }
];

const SENTIMENT_OPTIONS = [
  { value: 'positive', label: 'Positive', color: 'bg-green-100 text-green-800' },
  { value: 'negative', label: 'Negative', color: 'bg-red-100 text-red-800' },
  { value: 'neutral', label: 'Neutral', color: 'bg-gray-100 text-gray-800' }
];

export function DealNotesManager({ dealId, companyName }: DealNotesManagerProps) {
  const [notes, setNotes] = useState<DealNote[]>([]);
  const [loading, setLoading] = useState(true);
  const [isAdding, setIsAdding] = useState(false);
  const [newNote, setNewNote] = useState('');
  const [newTags, setNewTags] = useState('');
  const [newCategory, setNewCategory] = useState('');
  const [newSentiment, setNewSentiment] = useState<string>('');
  const [searchQuery, setSearchQuery] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('all');
  const [sentimentFilter, setSentimentFilter] = useState('all');
  
  const { user } = useAuth();
  const { toast } = useToast();
  const permissions = usePermissions();

  useEffect(() => {
    loadNotes();
  }, [dealId]);

  const loadNotes = async () => {
    try {
      setLoading(true);
      const { data, error } = await supabase
        .from('deal_notes')
        .select('*')
        .eq('deal_id', dealId)
        .order('created_at', { ascending: false });

      if (error) throw error;
      setNotes((data as any[])?.map((note: any) => ({
        ...note,
        sentiment: note.sentiment as 'positive' | 'negative' | 'neutral' || 'neutral',
        tags: note.tags || [],
        category: note.category || 'other'
      })) || []);
    } catch (error) {
      console.error('Error loading notes:', error);
      toast({
        title: "Error",
        description: "Failed to load notes",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  const addNote = async () => {
    if (!newNote.trim() || !user) return;
    
    if (!permissions.canCreateNotes) {
      toast({
        title: "Permission Denied",
        description: "You don't have permission to create notes",
        variant: "destructive"
      });
      return;
    }

    try {
      setIsAdding(true);
      
      const noteData = {
        deal_id: dealId,
        content: newNote.trim(),
        created_by: user.id,
        tags: newTags ? newTags.split(',').map(tag => tag.trim()).filter(Boolean) : [],
        category: newCategory || 'other',
        sentiment: newSentiment || 'neutral'
      };

      const { data, error } = await supabase
        .from('deal_notes')
        .insert([noteData])
        .select('*')
        .single();

      if (error) throw error;

      // Note saved successfully - database trigger will handle analysis queuing
      const addedNote = {
        ...data,
        sentiment: data.sentiment as 'positive' | 'negative' | 'neutral' || 'neutral',
        tags: data.tags || [],
        category: data.category || 'other'
      };

      setNotes(prev => [addedNote, ...prev]);
      setNewNote('');
      setNewTags('');
      setNewCategory('');
      setNewSentiment('');
      
      toast({
        title: "Note Added",
        description: "Your note has been saved successfully. Analysis will be triggered automatically if needed."
      });
    } catch (error) {
      console.error('Error adding note:', error);
      toast({
        title: "Error",
        description: "Failed to add note",
        variant: "destructive"
      });
    } finally {
      setIsAdding(false);
    }
  };

  const filteredNotes = notes.filter(note => {
    const matchesSearch = !searchQuery || 
      note.content.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (note.tags && note.tags.some(tag => tag.toLowerCase().includes(searchQuery.toLowerCase())));
    
    const matchesCategory = categoryFilter === 'all' || note.category === categoryFilter;
    const matchesSentiment = sentimentFilter === 'all' || note.sentiment === sentimentFilter;
    
    return matchesSearch && matchesCategory && matchesSentiment;
  });

  const getCategoryInfo = (category: string) => {
    return NOTE_CATEGORIES.find(cat => cat.value === category) || NOTE_CATEGORIES[NOTE_CATEGORIES.length - 1];
  };

  const getSentimentInfo = (sentiment: string) => {
    return SENTIMENT_OPTIONS.find(opt => opt.value === sentiment) || SENTIMENT_OPTIONS[2];
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center p-8">
        <Clock className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Add New Note */}
      {permissions.canCreateNotes && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Plus className="h-5 w-5" />
              Add New Note
            </CardTitle>
          </CardHeader>
        <CardContent className="space-y-4">
          <div>
            <Label htmlFor="note-content">Note Content</Label>
            <Textarea
              id="note-content"
              placeholder="Share your observations, insights, or feedback about this deal..."
              value={newNote}
              onChange={(e) => setNewNote(e.target.value)}
              rows={4}
            />
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <Label htmlFor="note-category">Category</Label>
              <Select value={newCategory} onValueChange={setNewCategory}>
                <SelectTrigger>
                  <SelectValue placeholder="Select category" />
                </SelectTrigger>
                <SelectContent>
                  {NOTE_CATEGORIES.map((category) => {
                    const Icon = category.icon;
                    return (
                      <SelectItem key={category.value} value={category.value}>
                        <div className="flex items-center gap-2">
                          <Icon className="h-4 w-4" />
                          {category.label}
                        </div>
                      </SelectItem>
                    );
                  })}
                </SelectContent>
              </Select>
            </div>

            <div>
              <Label htmlFor="note-sentiment">Sentiment</Label>
              <Select value={newSentiment} onValueChange={setNewSentiment}>
                <SelectTrigger>
                  <SelectValue placeholder="Select sentiment" />
                </SelectTrigger>
                <SelectContent>
                  {SENTIMENT_OPTIONS.map((option) => (
                    <SelectItem key={option.value} value={option.value}>
                      <Badge className={option.color} variant="secondary">
                        {option.label}
                      </Badge>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div>
              <Label htmlFor="note-tags">Tags (comma-separated)</Label>
              <Input
                id="note-tags"
                placeholder="e.g. founder, product-market-fit, concerns"
                value={newTags}
                onChange={(e) => setNewTags(e.target.value)}
              />
            </div>
          </div>

          <Button 
            onClick={addNote} 
            disabled={!newNote.trim() || isAdding}
            className="w-full"
          >
            {isAdding ? 'Adding...' : 'Add Note'}
          </Button>
        </CardContent>
      </Card>
      )}

      {/* Filters */}
      <Card>
        <CardContent className="pt-6">
          <div className="flex flex-col md:flex-row gap-4">
            <div className="flex-1">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Search notes..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-10"
                />
              </div>
            </div>
            
            <Select value={categoryFilter} onValueChange={setCategoryFilter}>
              <SelectTrigger className="w-[200px]">
                <SelectValue placeholder="Filter by category" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Categories</SelectItem>
                {NOTE_CATEGORIES.map((category) => (
                  <SelectItem key={category.value} value={category.value}>
                    {category.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>

            <Select value={sentimentFilter} onValueChange={setSentimentFilter}>
              <SelectTrigger className="w-[150px]">
                <SelectValue placeholder="Filter by sentiment" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Sentiments</SelectItem>
                {SENTIMENT_OPTIONS.map((option) => (
                  <SelectItem key={option.value} value={option.value}>
                    {option.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      {/* Notes List */}
      <div className="space-y-4">
        {filteredNotes.length > 0 ? (
          filteredNotes.map((note) => {
            const categoryInfo = getCategoryInfo(note.category || 'other');
            const sentimentInfo = getSentimentInfo(note.sentiment || 'neutral');
            const CategoryIcon = categoryInfo.icon;
            
            return (
              <Card key={note.id}>
                <CardContent className="pt-6">
                  <div className="flex items-start gap-4">
                    <div className="w-10 h-10 bg-primary/10 rounded-full flex items-center justify-center flex-shrink-0">
                      <CategoryIcon className="h-5 w-5 text-primary" />
                    </div>
                    
                    <div className="flex-1 space-y-3">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <Badge variant="outline">{categoryInfo.label}</Badge>
                          <Badge className={sentimentInfo.color} variant="secondary">
                            {sentimentInfo.label}
                          </Badge>
                        </div>
                        <div className="text-sm text-muted-foreground">
                          {format(new Date(note.created_at), 'MMM d, yyyy at h:mm a')}
                        </div>
                      </div>
                      
                      <p className="text-sm leading-relaxed">{note.content}</p>
                      
                      {note.tags && note.tags.length > 0 && (
                        <div className="flex items-center gap-2 flex-wrap">
                          <Tag className="h-4 w-4 text-muted-foreground" />
                          {note.tags.map((tag, index) => (
                            <Badge key={index} variant="secondary" className="text-xs">
                              {tag}
                            </Badge>
                          ))}
                        </div>
                      )}
                      
                       <div className="flex items-center gap-2 text-xs text-muted-foreground pt-2 border-t">
                         <User className="h-3 w-3" />
                         <span>Added by {note.created_by === user?.id ? 'you' : 'team member'}</span>
                       </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            );
          })
        ) : (
          <Card>
            <CardContent className="py-12 text-center">
              <MessageSquare className="h-12 w-12 text-muted-foreground/50 mx-auto mb-4" />
              <p className="text-muted-foreground">
                {searchQuery || categoryFilter !== 'all' || sentimentFilter !== 'all'
                  ? 'No notes match your current filters'
                  : 'No notes added yet for this deal'
                }
              </p>
              {searchQuery || categoryFilter !== 'all' || sentimentFilter !== 'all' ? (
                <Button
                  variant="outline"
                  size="sm"
                  className="mt-2"
                  onClick={() => {
                    setSearchQuery('');
                    setCategoryFilter('all');
                    setSentimentFilter('all');
                  }}
                >
                  Clear Filters
                </Button>
              ) : null}
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
}