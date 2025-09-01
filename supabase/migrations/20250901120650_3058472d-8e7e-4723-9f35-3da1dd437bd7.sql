-- Create the missing trigger on deals table to call our VC processing function
CREATE TRIGGER trigger_vc_processing_on_deal_creation
  AFTER INSERT ON public.deals
  FOR EACH ROW
  EXECUTE FUNCTION public.unified_vc_trigger_on_deal_creation();