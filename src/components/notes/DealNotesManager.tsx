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
  Clock,
  Edit,
  Trash2,
  Save,
  X
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
  profiles?: {
    first_name?: string;
    last_name?: string;
  };
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
  { value: 'positive', label: 'Positive', className: 'bg-green-100 text-green-800', icon: CheckCircle },
  { value: 'negative', label: 'Negative', className: 'bg-red-100 text-red-800', icon: AlertTriangle },
  { value: 'neutral', label: 'Neutral', className: 'bg-gray-100 text-gray-800', icon: null }
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
  const [editingNote, setEditingNote] = useState<string | null>(null);
  const [editContent, setEditContent] = useState<string>('');
  const [editCategory, setEditCategory] = useState<string>('');
  const [editSentiment, setEditSentiment] = useState<string>('');
  const [editTags, setEditTags] = useState<string>('');
  const [deletingNote, setDeletingNote] = useState<string | null>(null);
  
  const { user } = useAuth();
  const { toast } = useToast();
  const permissions = usePermissions();

  useEffect(() => {
    loadNotes();
  }, [dealId]);

  const loadNotes = async () => {
    try {
      setLoading(true);
      
      // First try to load notes without the profiles join to isolate the issue
      const { data, error } = await supabase
        .from('deal_notes')
        .select('*')
        .eq('deal_id', dealId)
        .order('created_at', { ascending: false });

      if (error) {
        console.error('Database error loading notes:', error);
        throw error;
      }

      console.log('Notes loaded successfully:', data?.length, 'notes found');
      
      // Then try to get profile information separately
      const notesWithProfiles = await Promise.all(
        (data || []).map(async (note) => {
          try {
            const { data: profile } = await supabase
              .from('profiles')
              .select('first_name, last_name')
              .eq('user_id', note.created_by)
              .single();
              
            return {
              ...note,
              sentiment: note.sentiment as 'positive' | 'negative' | 'neutral' || 'neutral',
              tags: note.tags || [],
              category: note.category || 'other',
              profiles: profile ? { 
                first_name: profile.first_name, 
                last_name: profile.last_name 
              } : null
            };
          } catch (profileError) {
            console.warn('Could not load profile for note:', note.id, profileError);
            return {
              ...note,
              sentiment: note.sentiment as 'positive' | 'negative' | 'neutral' || 'neutral',
              tags: note.tags || [],
              category: note.category || 'other',
              profiles: null
            };
          }
        })
      );
      
      setNotes(notesWithProfiles);
    } catch (error) {
      console.error('Error loading notes:', error);
      toast({
        title: "Error",
        description: `Failed to load notes: ${error instanceof Error ? error.message : 'Unknown error'}`,
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
        description: "Failed to add note. Please try again.",
        variant: "destructive"
      });
    } finally {
      setIsAdding(false);
    }
  };

  const canEditNote = (note: DealNote) => {
    if (!user) return false;
    if (permissions.canEditAllNotes) return true;
    if (permissions.canEditOwnNotes && note.created_by === user.id) return true;
    return false;
  };

  const canDeleteNote = (note: DealNote) => {
    if (!user) return false;
    if (permissions.canDeleteAllNotes) return true;
    if (permissions.canDeleteOwnNotes && note.created_by === user.id) return true;
    return false;
  };

  const startEditing = (note: DealNote) => {
    setEditingNote(note.id);
    setEditContent(note.content);
    setEditCategory(note.category || 'other');
    setEditSentiment(note.sentiment || 'neutral');
    setEditTags(note.tags?.join(', ') || '');
  };

  const cancelEditing = () => {
    setEditingNote(null);
    setEditContent('');
    setEditCategory('');
    setEditSentiment('');
    setEditTags('');
  };

  const saveEdit = async (noteId: string) => {
    if (!user || !editContent.trim()) return;

    try {
      const tagsArray = editTags.split(',').map(tag => tag.trim()).filter(tag => tag.length > 0);
      
      const { error } = await supabase
        .from('deal_notes')
        .update({
          content: editContent.trim(),
          category: editCategory,
          sentiment: editSentiment,
          tags: tagsArray,
          updated_at: new Date().toISOString()
        })
        .eq('id', noteId);

      if (error) throw error;

      // Update local state
      setNotes(prevNotes => 
        prevNotes.map(note => 
          note.id === noteId 
            ? { 
                ...note, 
                content: editContent.trim(),
                category: editCategory,
                sentiment: editSentiment as 'positive' | 'negative' | 'neutral',
                tags: tagsArray,
                updated_at: new Date().toISOString()
              }
            : note
        )
      );

      cancelEditing();
      
      toast({
        title: "Note Updated",
        description: "Your note has been updated successfully."
      });
    } catch (error) {
      console.error('Error updating note:', error);
      toast({
        title: "Error",
        description: "Failed to update note. Please try again.",
        variant: "destructive"
      });
    }
  };

  const deleteNote = async (noteId: string) => {
    if (!user) return;

    try {
      const { error } = await supabase
        .from('deal_notes')
        .delete()
        .eq('id', noteId);

      if (error) throw error;

      // Update local state
      setNotes(prevNotes => prevNotes.filter(note => note.id !== noteId));
      setDeletingNote(null);
      
      toast({
        title: "Note Deleted",
        description: "The note has been deleted successfully."
      });
    } catch (error) {
      console.error('Error deleting note:', error);
      toast({
        title: "Error",
        description: "Failed to delete note. Please try again.",
        variant: "destructive"
      });
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

  const getCategoryInfo = (category?: string) => {
    return NOTE_CATEGORIES.find(cat => cat.value === category) || NOTE_CATEGORIES[NOTE_CATEGORIES.length - 1];
  };

  const getSentimentInfo = (sentiment?: string) => {
    return SENTIMENT_OPTIONS.find(opt => opt.value === sentiment) || SENTIMENT_OPTIONS[2];
  };

  const getDisplayName = (profiles?: { first_name?: string; last_name?: string } | null) => {
    if (!profiles) return 'Unknown User';
    const firstName = profiles.first_name || '';
    const lastName = profiles.last_name || '';
    return `${firstName} ${lastName}`.trim() || 'Unknown User';
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
                        <div className="flex items-center gap-2">
                          {option.icon && <option.icon className="h-4 w-4" />}
                          {option.label}
                        </div>
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
            const categoryInfo = getCategoryInfo(note.category);
            const sentimentInfo = getSentimentInfo(note.sentiment);
            const isEditing = editingNote === note.id;
            const isOwner = user?.id === note.created_by;
            
            return (
              <Card key={note.id} className="p-4">
                <div className="flex items-start justify-between">
                  <div className="flex items-center gap-2 mb-2">
                    {!isEditing ? (
                      <>
                        <categoryInfo.icon className="h-4 w-4 text-muted-foreground" />
                        <Badge variant="outline">{categoryInfo.label}</Badge>
                        <Badge className={sentimentInfo.className}>
                          {sentimentInfo.icon && <sentimentInfo.icon className="h-3 w-3 mr-1" />}
                          {sentimentInfo.label}
                        </Badge>
                      </>
                    ) : (
                      <div className="flex items-center gap-2">
                        <Select value={editCategory} onValueChange={setEditCategory}>
                          <SelectTrigger className="w-40">
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            {NOTE_CATEGORIES.map((category) => (
                              <SelectItem key={category.value} value={category.value}>
                                <div className="flex items-center gap-2">
                                  <category.icon className="h-4 w-4" />
                                  {category.label}
                                </div>
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                        <Select value={editSentiment} onValueChange={setEditSentiment}>
                          <SelectTrigger className="w-32">
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            {SENTIMENT_OPTIONS.map((sentiment) => (
                              <SelectItem key={sentiment.value} value={sentiment.value}>
                                <div className="flex items-center gap-2">
                                  {sentiment.icon && <sentiment.icon className="h-4 w-4" />}
                                  {sentiment.label}
                                </div>
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>
                    )}
                  </div>
                  <div className="flex items-center gap-2">
                    {!isEditing ? (
                      <span className="text-xs text-muted-foreground">
                        {format(new Date(note.created_at), 'MMM d, yyyy h:mm a')}
                      </span>
                    ) : null}
                    {!isEditing && canEditNote(note) && (
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => startEditing(note)}
                        className="h-8 w-8 p-0"
                      >
                        <Edit className="h-4 w-4" />
                      </Button>
                    )}
                    {!isEditing && canDeleteNote(note) && (
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => setDeletingNote(note.id)}
                        className="h-8 w-8 p-0 text-destructive hover:text-destructive"
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    )}
                    {isEditing && (
                      <div className="flex gap-1">
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => saveEdit(note.id)}
                          className="h-8 w-8 p-0 text-green-600 hover:text-green-700"
                        >
                          <Save className="h-4 w-4" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={cancelEditing}
                          className="h-8 w-8 p-0"
                        >
                          <X className="h-4 w-4" />
                        </Button>
                      </div>
                    )}
                  </div>
                </div>
                
                {isEditing ? (
                  <div className="space-y-3">
                    <Textarea
                      value={editContent}
                      onChange={(e) => setEditContent(e.target.value)}
                      placeholder="Edit your note..."
                      className="min-h-[100px]"
                    />
                    <Input
                      value={editTags}
                      onChange={(e) => setEditTags(e.target.value)}
                      placeholder="Tags (comma-separated)"
                    />
                  </div>
                ) : (
                  <p className="text-sm mb-3 whitespace-pre-wrap">{note.content}</p>
                )}
                
                {!isEditing && note.tags && note.tags.length > 0 && (
                  <div className="flex flex-wrap gap-1 mb-3">
                    {note.tags.map((tag, index) => (
                      <Badge key={index} variant="secondary" className="text-xs">
                        <Tag className="h-3 w-3 mr-1" />
                        {tag}
                      </Badge>
                    ))}
                  </div>
                )}
                
                {!isEditing && (
                  <div className="flex items-center justify-between text-xs text-muted-foreground">
                  <div className="flex items-center gap-1">
                    <User className="h-3 w-3" />
                    <span>{getDisplayName(note.profiles)}</span>
                    {isOwner && <Badge variant="outline" className="text-xs ml-2">You</Badge>}
                  </div>
                    {note.updated_at !== note.created_at && (
                      <div className="flex items-center gap-1">
                        <Calendar className="h-3 w-3" />
                        <span>Edited {format(new Date(note.updated_at), 'MMM d')}</span>
                      </div>
                    )}
                  </div>
                )}
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

      {/* Delete Confirmation Dialog */}
      {deletingNote && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-background p-6 rounded-lg shadow-lg max-w-md w-full mx-4">
            <div className="flex items-center gap-3 mb-4">
              <AlertTriangle className="h-6 w-6 text-destructive" />
              <h3 className="text-lg font-semibold">Delete Note</h3>
            </div>
            <p className="text-muted-foreground mb-6">
              Are you sure you want to delete this note? This action cannot be undone.
            </p>
            <div className="flex justify-end gap-3">
              <Button
                variant="outline"
                onClick={() => setDeletingNote(null)}
              >
                Cancel
              </Button>
              <Button
                variant="destructive"
                onClick={() => deleteNote(deletingNote)}
              >
                Delete
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}