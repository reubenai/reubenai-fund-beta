-- Phase 2: Deal Analysis Consistency Migration

-- 1. Add analysis freshness tracking columns
ALTER TABLE public.deals 
ADD COLUMN IF NOT EXISTS last_analysis_trigger timestamp with time zone,
ADD COLUMN IF NOT EXISTS analysis_queue_status text DEFAULT 'pending',
ADD COLUMN IF NOT EXISTS auto_analysis_enabled boolean DEFAULT true;

-- 2. Add document upload tracking for re-analysis
ALTER TABLE public.deal_documents 
ADD COLUMN IF NOT EXISTS triggers_reanalysis boolean DEFAULT true,
ADD COLUMN IF NOT EXISTS last_analysis_impact timestamp with time zone;

-- 3. Create analysis queue table for batching
CREATE TABLE IF NOT EXISTS public.analysis_queue (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  deal_id uuid NOT NULL REFERENCES public.deals(id) ON DELETE CASCADE,
  fund_id uuid NOT NULL,
  priority text NOT NULL DEFAULT 'normal', -- 'high', 'normal', 'low'
  trigger_reason text NOT NULL, -- 'new_deal', 'document_upload', 'manual', 'scheduled'
  scheduled_for timestamp with time zone NOT NULL DEFAULT now() + interval '5 minutes',
  status text NOT NULL DEFAULT 'queued', -- 'queued', 'processing', 'completed', 'failed'
  attempts integer NOT NULL DEFAULT 0,
  max_attempts integer NOT NULL DEFAULT 3,
  error_message text,
  metadata jsonb DEFAULT '{}',
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  updated_at timestamp with time zone NOT NULL DEFAULT now(),
  started_at timestamp with time zone,
  completed_at timestamp with time zone
);

-- Enable RLS on analysis_queue
ALTER TABLE public.analysis_queue ENABLE ROW LEVEL SECURITY;

-- RLS policies for analysis_queue
CREATE POLICY "Users can view analysis queue for accessible funds" 
ON public.analysis_queue 
FOR SELECT 
USING (is_reuben_admin() OR (fund_id IN ( 
  SELECT f.id FROM funds f 
  JOIN profiles p ON f.organization_id = p.organization_id 
  WHERE p.user_id = auth.uid()
)));

CREATE POLICY "Users can manage analysis queue with proper access" 
ON public.analysis_queue 
FOR ALL 
USING (is_reuben_admin() OR (fund_id IN ( 
  SELECT f.id FROM funds f 
  JOIN profiles p ON f.organization_id = p.organization_id 
  WHERE p.user_id = auth.uid() AND p.role = ANY(ARRAY['super_admin'::user_role, 'admin'::user_role, 'fund_manager'::user_role, 'analyst'::user_role])
)));

-- 4. Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_analysis_queue_status_scheduled ON public.analysis_queue(status, scheduled_for);
CREATE INDEX IF NOT EXISTS idx_analysis_queue_deal_fund ON public.analysis_queue(deal_id, fund_id);
CREATE INDEX IF NOT EXISTS idx_deals_analysis_status ON public.deals(analysis_queue_status, last_analysis_trigger);
CREATE INDEX IF NOT EXISTS idx_deal_documents_analysis ON public.deal_documents(deal_id, triggers_reanalysis);

-- 5. Function to queue deal for analysis
CREATE OR REPLACE FUNCTION public.queue_deal_analysis(
  deal_id_param uuid,
  trigger_reason_param text DEFAULT 'manual',
  priority_param text DEFAULT 'normal',
  delay_minutes integer DEFAULT 5
) RETURNS uuid
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
DECLARE
  queue_id uuid;
  deal_fund_id uuid;
  existing_queue_id uuid;
BEGIN
  -- Get fund_id for the deal
  SELECT fund_id INTO deal_fund_id 
  FROM public.deals 
  WHERE id = deal_id_param;
  
  IF deal_fund_id IS NULL THEN
    RAISE EXCEPTION 'Deal not found: %', deal_id_param;
  END IF;
  
  -- Check if deal is already queued and not completed
  SELECT id INTO existing_queue_id
  FROM public.analysis_queue 
  WHERE deal_id = deal_id_param 
    AND status IN ('queued', 'processing')
    AND scheduled_for > now() - interval '1 hour'
  ORDER BY created_at DESC 
  LIMIT 1;
  
  -- If already queued recently, return existing queue ID
  IF existing_queue_id IS NOT NULL THEN
    RETURN existing_queue_id;
  END IF;
  
  -- Insert new queue entry
  INSERT INTO public.analysis_queue (
    deal_id,
    fund_id,
    priority,
    trigger_reason,
    scheduled_for,
    metadata
  ) VALUES (
    deal_id_param,
    deal_fund_id,
    priority_param,
    trigger_reason_param,
    now() + (delay_minutes * interval '1 minute'),
    jsonb_build_object(
      'queued_by', auth.uid(),
      'delay_minutes', delay_minutes,
      'original_trigger', trigger_reason_param
    )
  ) RETURNING id INTO queue_id;
  
  -- Update deal status
  UPDATE public.deals 
  SET 
    analysis_queue_status = 'queued',
    last_analysis_trigger = now(),
    updated_at = now()
  WHERE id = deal_id_param;
  
  RETURN queue_id;
END;
$$;

-- 6. Function to auto-queue new deals (called by trigger)
CREATE OR REPLACE FUNCTION public.auto_queue_new_deal_analysis()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
BEGIN
  -- Only queue if auto-analysis is enabled and deal is newly created
  IF NEW.auto_analysis_enabled = true AND TG_OP = 'INSERT' THEN
    -- Queue with 5 minute delay for new deals
    PERFORM public.queue_deal_analysis(
      NEW.id,
      'new_deal',
      'normal',
      5
    );
  END IF;
  
  RETURN NEW;
END;
$$;

-- 7. Function to queue re-analysis on document upload
CREATE OR REPLACE FUNCTION public.auto_queue_document_reanalysis()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
DECLARE
  deal_auto_analysis boolean;
BEGIN
  -- Check if the deal has auto-analysis enabled
  SELECT auto_analysis_enabled INTO deal_auto_analysis
  FROM public.deals 
  WHERE id = NEW.deal_id;
  
  -- Only queue if document triggers reanalysis and deal allows auto-analysis
  IF NEW.triggers_reanalysis = true AND deal_auto_analysis = true THEN
    -- Queue with 2 minute delay for document uploads (higher priority)
    PERFORM public.queue_deal_analysis(
      NEW.deal_id,
      'document_upload',
      'high',
      2
    );
    
    -- Update document to track analysis impact
    NEW.last_analysis_impact = now();
  END IF;
  
  RETURN NEW;
END;
$$;

-- 8. Create triggers
DROP TRIGGER IF EXISTS trigger_auto_queue_new_deal ON public.deals;
CREATE TRIGGER trigger_auto_queue_new_deal
  AFTER INSERT ON public.deals
  FOR EACH ROW
  EXECUTE FUNCTION public.auto_queue_new_deal_analysis();

DROP TRIGGER IF EXISTS trigger_auto_queue_document_reanalysis ON public.deal_documents;
CREATE TRIGGER trigger_auto_queue_document_reanalysis
  AFTER INSERT ON public.deal_documents
  FOR EACH ROW
  EXECUTE FUNCTION public.auto_queue_document_reanalysis();

-- 9. Function to process analysis queue (for background job)
CREATE OR REPLACE FUNCTION public.process_analysis_queue(
  batch_size integer DEFAULT 5,
  max_concurrent integer DEFAULT 2
) RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
DECLARE
  queue_record record;
  processed_count integer := 0;
  failed_count integer := 0;
  result jsonb;
  current_concurrent integer;
BEGIN
  -- Check current processing count
  SELECT COUNT(*) INTO current_concurrent
  FROM public.analysis_queue 
  WHERE status = 'processing';
  
  -- Don't process if we're at max concurrent
  IF current_concurrent >= max_concurrent THEN
    RETURN jsonb_build_object(
      'status', 'throttled',
      'message', 'Max concurrent analysis jobs reached',
      'current_concurrent', current_concurrent,
      'max_concurrent', max_concurrent
    );
  END IF;
  
  -- Process queued items
  FOR queue_record IN
    SELECT * FROM public.analysis_queue
    WHERE status = 'queued'
      AND scheduled_for <= now()
      AND attempts < max_attempts
    ORDER BY 
      CASE priority 
        WHEN 'high' THEN 1
        WHEN 'normal' THEN 2
        WHEN 'low' THEN 3
        ELSE 4
      END,
      scheduled_for ASC
    LIMIT batch_size
  LOOP
    BEGIN
      -- Update status to processing
      UPDATE public.analysis_queue 
      SET 
        status = 'processing',
        started_at = now(),
        attempts = attempts + 1,
        updated_at = now()
      WHERE id = queue_record.id;
      
      -- Update deal status
      UPDATE public.deals 
      SET analysis_queue_status = 'processing'
      WHERE id = queue_record.deal_id;
      
      processed_count := processed_count + 1;
      
    EXCEPTION WHEN OTHERS THEN
      -- Mark as failed
      UPDATE public.analysis_queue 
      SET 
        status = 'failed',
        error_message = SQLERRM,
        updated_at = now(),
        completed_at = now()
      WHERE id = queue_record.id;
      
      failed_count := failed_count + 1;
    END;
  END LOOP;
  
  RETURN jsonb_build_object(
    'processed', processed_count,
    'failed', failed_count,
    'current_concurrent', current_concurrent,
    'timestamp', now()
  );
END;
$$;

-- 10. Function to mark analysis as completed
CREATE OR REPLACE FUNCTION public.complete_analysis_queue_item(
  queue_id_param uuid,
  success boolean DEFAULT true,
  error_message_param text DEFAULT NULL
) RETURNS boolean
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
DECLARE
  queue_deal_id uuid;
BEGIN
  -- Get the deal_id and update queue status
  UPDATE public.analysis_queue 
  SET 
    status = CASE WHEN success THEN 'completed' ELSE 'failed' END,
    error_message = error_message_param,
    completed_at = now(),
    updated_at = now()
  WHERE id = queue_id_param
  RETURNING deal_id INTO queue_deal_id;
  
  IF queue_deal_id IS NULL THEN
    RETURN false;
  END IF;
  
  -- Update deal status
  UPDATE public.deals 
  SET 
    analysis_queue_status = CASE WHEN success THEN 'completed' ELSE 'failed' END,
    updated_at = now()
  WHERE id = queue_deal_id;
  
  -- Update analysis version if successful
  IF success THEN
    UPDATE public.deal_analyses 
    SET analysis_version = analysis_version + 1
    WHERE deal_id = queue_deal_id;
  END IF;
  
  RETURN true;
END;
$$;

-- 11. Add updated_at trigger for analysis_queue
DROP TRIGGER IF EXISTS update_analysis_queue_updated_at ON public.analysis_queue;
CREATE TRIGGER update_analysis_queue_updated_at
  BEFORE UPDATE ON public.analysis_queue
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();