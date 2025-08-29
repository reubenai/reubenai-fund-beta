-- Create trigger to automatically start waterfall processing on deal creation
CREATE OR REPLACE TRIGGER trigger_waterfall_processing_on_deal_creation
  AFTER INSERT ON public.deals
  FOR EACH ROW
  EXECUTE FUNCTION public.queue_waterfall_processing();