import { useState, useCallback } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetTrigger } from '@/components/ui/sheet';
import { MessageSquare, Star, Send, Bug, Lightbulb, Heart, Upload, X, Image } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';
import { useDropzone } from 'react-dropzone';

type FeedbackType = 'bug' | 'feature' | 'general' | 'love';
type Rating = 1 | 2 | 3 | 4 | 5;

interface UploadedImage {
  file: File;
  preview: string;
  uploading?: boolean;
  url?: string;
}

const feedbackTypes = [
  { id: 'bug' as FeedbackType, label: 'Bug Report', icon: Bug, color: 'destructive' },
  { id: 'feature' as FeedbackType, label: 'Feature Request', icon: Lightbulb, color: 'default' },
  { id: 'general' as FeedbackType, label: 'General Feedback', icon: MessageSquare, color: 'secondary' },
  { id: 'love' as FeedbackType, label: 'What I Love', icon: Heart, color: 'default' }
];

export function FeedbackWidget() {
  const [isOpen, setIsOpen] = useState(false);
  const [type, setType] = useState<FeedbackType>('general');
  const [rating, setRating] = useState<Rating | null>(null);
  const [message, setMessage] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [uploadedImages, setUploadedImages] = useState<UploadedImage[]>([]);
  const { toast } = useToast();

  const onDrop = useCallback((acceptedFiles: File[]) => {
    const newImages: UploadedImage[] = acceptedFiles
      .filter(file => file.type.startsWith('image/'))
      .slice(0, 3 - uploadedImages.length) // Max 3 images
      .map(file => ({
        file,
        preview: URL.createObjectURL(file),
        uploading: false
      }));
    
    setUploadedImages(prev => [...prev, ...newImages]);
  }, [uploadedImages.length]);

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: {
      'image/*': ['.png', '.jpg', '.jpeg', '.webp']
    },
    maxFiles: 3,
    disabled: uploadedImages.length >= 3
  });

  const removeImage = (index: number) => {
    setUploadedImages(prev => {
      const newImages = [...prev];
      URL.revokeObjectURL(newImages[index].preview);
      newImages.splice(index, 1);
      return newImages;
    });
  };

  const uploadImages = async (userId: string): Promise<string[]> => {
    if (uploadedImages.length === 0) return [];
    
    const uploadPromises = uploadedImages.map(async (image, index) => {
      const timestamp = Date.now();
      const fileName = `${userId}/${timestamp}-${index}-${image.file.name}`;
      
      const { data, error } = await supabase.storage
        .from('feedback-screenshots')
        .upload(fileName, image.file, {
          cacheControl: '3600',
          upsert: false
        });

      if (error) {
        console.error('Failed to upload image:', error);
        return null;
      }

      // Get public URL
      const { data: urlData } = supabase.storage
        .from('feedback-screenshots')
        .getPublicUrl(fileName);

      return urlData.publicUrl;
    });

    const urls = await Promise.all(uploadPromises);
    return urls.filter(url => url !== null) as string[];
  };

  const handleSubmit = async () => {
    if (!message.trim()) {
      toast({
        title: "Message required",
        description: "Please enter your feedback message.",
        variant: "destructive"
      });
      return;
    }

    setIsSubmitting(true);
    
    try {
      const { data: { user } } = await supabase.auth.getUser();
      const { data: currentFund } = await supabase
        .from('funds')
        .select('id, name')
        .limit(1)
        .maybeSingle();

      // Get user profile for additional info
      const { data: profile } = await supabase
        .from('profiles')
        .select('first_name, last_name')
        .eq('user_id', user?.id)
        .maybeSingle();

      // Upload screenshots first
      const imageUrls = await uploadImages(user?.id || 'anonymous');

      const feedbackData = {
        user_id: user?.id,
        fund_id: currentFund?.id || null,
        feedback_type: type,
        rating,
        message: message.trim(),
        page_url: window.location.href,
        user_agent: navigator.userAgent,
        metadata: {
          timestamp: new Date().toISOString(),
          pathname: window.location.pathname,
          referrer: document.referrer,
          screenshots: imageUrls
        }
      };

      // Save to database
      const { error } = await supabase
        .from('user_feedback')
        .insert(feedbackData);

      if (error) throw error;

      // Also create a support ticket for admin management
      const supportTicketData = {
        user_id: user.id,
        email: user.email || '',
        feedback_type: type,
        subject: `${type === 'bug' ? 'Bug Report' : 
                  type === 'feature' ? 'Feature Request' : 
                  type === 'love' ? 'Appreciation' : 'General Feedback'} from ${profile?.first_name || 'User'}`,
        message: message.trim(),
        priority: type === 'bug' ? 'high' : 'medium',
        fund_id: currentFund?.id || null,
        fund_name: currentFund?.name || null,
        rating: rating
      };

      await supabase
        .from('support_tickets')
        .insert(supportTicketData)
        .then(({ error: ticketError }) => {
          if (ticketError) {
            console.error('Failed to create support ticket:', ticketError);
          }
        });

      // Send email notification (don't block on this)
      if (user) {
        supabase.functions.invoke('send-feedback-notification', {
          body: {
            feedbackType: type,
            rating,
            message: message.trim(),
            userInfo: {
              id: user.id,
              email: user.email || '',
              firstName: profile?.first_name,
              lastName: profile?.last_name,
            },
            fundInfo: currentFund ? {
              id: currentFund.id,
              name: currentFund.name
            } : undefined,
            pageUrl: window.location.href,
            userAgent: navigator.userAgent,
            metadata: {
              timestamp: new Date().toISOString(),
              pathname: window.location.pathname,
              referrer: document.referrer,
              screenshots: imageUrls
            }
          }
        }).catch(error => {
          console.error('Failed to send feedback notification email:', error);
          // Don't show error to user - email notification is supplementary
        });
      }
      
      toast({
        title: "Thank you!",
        description: "Your feedback has been submitted successfully.",
      });
      
      // Reset form
      setType('general');
      setRating(null);
      setMessage('');
      setUploadedImages([]);
      // Clean up image previews
      uploadedImages.forEach(img => URL.revokeObjectURL(img.preview));
      setIsOpen(false);
    } catch (error) {
      console.error('Error submitting feedback:', error);
      toast({
        title: "Error",
        description: "Failed to submit feedback. Please try again.",
        variant: "destructive"
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const selectedType = feedbackTypes.find(t => t.id === type);

  return (
    <Sheet open={isOpen} onOpenChange={setIsOpen}>
      <SheetTrigger asChild>
        <Button
          variant="outline"
          size="sm"
          className="fixed bottom-4 right-4 z-40 shadow-lg"
        >
          <MessageSquare className="h-4 w-4 mr-2" />
          Feedback
        </Button>
      </SheetTrigger>
      
      <SheetContent className="w-96">
        <SheetHeader>
          <SheetTitle className="flex items-center gap-2">
            <MessageSquare className="h-5 w-5" />
            Share Your Feedback
          </SheetTitle>
        </SheetHeader>
        
        <div className="space-y-6 mt-6">
          {/* Feedback Type Selection */}
          <div className="space-y-3">
            <label className="text-sm font-medium">Feedback Type</label>
            <div className="grid grid-cols-2 gap-2">
              {feedbackTypes.map((feedbackType) => (
                <Button
                  key={feedbackType.id}
                  variant={type === feedbackType.id ? "default" : "outline"}
                  size="sm"
                  onClick={() => setType(feedbackType.id)}
                  className="justify-start gap-2"
                >
                  <feedbackType.icon className="h-4 w-4" />
                  {feedbackType.label}
                </Button>
              ))}
            </div>
          </div>
          
          {/* Rating */}
          <div className="space-y-3">
            <label className="text-sm font-medium">How would you rate your experience?</label>
            <div className="flex gap-1">
              {[1, 2, 3, 4, 5].map((star) => (
                <Button
                  key={star}
                  variant="ghost"
                  size="sm"
                  onClick={() => setRating(star as Rating)}
                  className="p-1 h-8 w-8"
                >
                  <Star
                    className={`h-5 w-5 ${
                      rating && star <= rating
                        ? 'fill-yellow-400 text-yellow-400'
                        : 'text-muted-foreground'
                    }`}
                  />
                </Button>
              ))}
            </div>
          </div>
          
          {/* Message */}
          <div className="space-y-3">
            <label className="text-sm font-medium">Your feedback</label>
            <Textarea
              placeholder={`Tell us about your ${selectedType?.label.toLowerCase()}...`}
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              rows={4}
              className="resize-none"
            />
          </div>
          
          {/* Screenshot Upload */}
          <div className="space-y-3">
            <label className="text-sm font-medium">Attach Screenshots (Optional)</label>
            <div
              {...getRootProps()}
              className={`border-2 border-dashed rounded-lg p-4 text-center cursor-pointer transition-colors ${
                isDragActive ? 'border-primary bg-primary/5' : 'border-muted-foreground/25 hover:border-primary/50'
              } ${uploadedImages.length >= 3 ? 'opacity-50 cursor-not-allowed' : ''}`}
            >
              <input {...getInputProps()} />
              <Upload className="h-8 w-8 mx-auto mb-2 text-muted-foreground" />
              <p className="text-sm text-muted-foreground">
                {isDragActive ? 'Drop images here...' : 'Drag & drop images or click to select'}
              </p>
              <p className="text-xs text-muted-foreground mt-1">
                PNG, JPG, WEBP up to 10MB ({uploadedImages.length}/3)
              </p>
            </div>
            
            {/* Image Previews */}
            {uploadedImages.length > 0 && (
              <div className="grid grid-cols-3 gap-2">
                {uploadedImages.map((image, index) => (
                  <div key={index} className="relative group">
                    <img
                      src={image.preview}
                      alt={`Screenshot ${index + 1}`}
                      className="w-full h-20 object-cover rounded border"
                    />
                    <Button
                      type="button"
                      variant="destructive"
                      size="sm"
                      className="absolute top-1 right-1 h-6 w-6 p-0 opacity-0 group-hover:opacity-100 transition-opacity"
                      onClick={() => removeImage(index)}
                    >
                      <X className="h-3 w-3" />
                    </Button>
                  </div>
                ))}
              </div>
            )}
          </div>
          
          {/* Submit */}
          <Button
            onClick={handleSubmit}
            disabled={isSubmitting || !message.trim()}
            className="w-full gap-2"
          >
            <Send className="h-4 w-4" />
            {isSubmitting ? 'Submitting...' : 'Submit Feedback'}
          </Button>
          
          <p className="text-xs text-muted-foreground text-center">
            Your feedback helps us improve ReubenAI for everyone.
          </p>
        </div>
      </SheetContent>
    </Sheet>
  );
}