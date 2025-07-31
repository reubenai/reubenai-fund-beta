-- Create enum types for the platform
CREATE TYPE public.fund_type AS ENUM ('venture_capital', 'private_equity');
CREATE TYPE public.deal_status AS ENUM ('sourced', 'screening', 'due_diligence', 'investment_committee', 'approved', 'rejected', 'invested');
CREATE TYPE public.user_role AS ENUM ('admin', 'fund_manager', 'analyst', 'viewer');
CREATE TYPE public.deal_score_level AS ENUM ('exciting', 'promising', 'needs_development', 'not_aligned');

-- Organizations table
CREATE TABLE public.organizations (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL,
  domain TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- User profiles table
CREATE TABLE public.profiles (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL UNIQUE,
  organization_id UUID REFERENCES public.organizations(id) ON DELETE CASCADE,
  email TEXT NOT NULL,
  first_name TEXT,
  last_name TEXT,
  role public.user_role NOT NULL DEFAULT 'viewer',
  avatar_url TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Funds table
CREATE TABLE public.funds (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  organization_id UUID NOT NULL REFERENCES public.organizations(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  fund_type public.fund_type NOT NULL,
  description TEXT,
  target_size BIGINT,
  currency TEXT DEFAULT 'USD',
  is_active BOOLEAN DEFAULT false,
  created_by UUID NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Investment strategy/thesis table
CREATE TABLE public.investment_strategies (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  fund_id UUID NOT NULL REFERENCES public.funds(id) ON DELETE CASCADE,
  geography TEXT[],
  industries TEXT[],
  key_signals TEXT[],
  min_investment_amount BIGINT,
  max_investment_amount BIGINT,
  exciting_threshold INTEGER DEFAULT 85,
  promising_threshold INTEGER DEFAULT 70,
  needs_development_threshold INTEGER DEFAULT 50,
  strategy_notes TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Deals table
CREATE TABLE public.deals (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  fund_id UUID NOT NULL REFERENCES public.funds(id) ON DELETE CASCADE,
  company_name TEXT NOT NULL,
  website TEXT,
  location TEXT,
  industry TEXT,
  description TEXT,
  status public.deal_status DEFAULT 'sourced',
  deal_size BIGINT,
  valuation BIGINT,
  currency TEXT DEFAULT 'USD',
  overall_score INTEGER,
  score_level public.deal_score_level,
  created_by UUID NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Deal analysis table (5 key dimensions)
CREATE TABLE public.deal_analyses (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  deal_id UUID NOT NULL REFERENCES public.deals(id) ON DELETE CASCADE,
  thesis_alignment_score INTEGER,
  thesis_alignment_notes TEXT,
  leadership_score INTEGER,
  leadership_notes TEXT,
  market_score INTEGER,
  market_notes TEXT,
  product_score INTEGER,
  product_notes TEXT,
  financial_score INTEGER,
  financial_notes TEXT,
  traction_score INTEGER,
  traction_notes TEXT,
  analyzed_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Investment Committee meetings
CREATE TABLE public.ic_meetings (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  fund_id UUID NOT NULL REFERENCES public.funds(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  scheduled_date TIMESTAMP WITH TIME ZONE NOT NULL,
  agenda TEXT,
  created_by UUID NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- IC Meeting deals
CREATE TABLE public.ic_meeting_deals (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  meeting_id UUID NOT NULL REFERENCES public.ic_meetings(id) ON DELETE CASCADE,
  deal_id UUID NOT NULL REFERENCES public.deals(id) ON DELETE CASCADE,
  memo_content TEXT,
  decision TEXT,
  notes TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE(meeting_id, deal_id)
);

-- Deal documents
CREATE TABLE public.deal_documents (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  deal_id UUID NOT NULL REFERENCES public.deals(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  file_path TEXT NOT NULL,
  file_size BIGINT,
  content_type TEXT,
  uploaded_by UUID NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Deal notes
CREATE TABLE public.deal_notes (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  deal_id UUID NOT NULL REFERENCES public.deals(id) ON DELETE CASCADE,
  content TEXT NOT NULL,
  created_by UUID NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS on all tables
ALTER TABLE public.organizations ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.funds ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.investment_strategies ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.deals ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.deal_analyses ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.ic_meetings ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.ic_meeting_deals ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.deal_documents ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.deal_notes ENABLE ROW LEVEL SECURITY;

-- RLS Policies for Organizations
CREATE POLICY "Users can view their organization" ON public.organizations
  FOR SELECT USING (
    id IN (
      SELECT organization_id FROM public.profiles 
      WHERE user_id = auth.uid()
    )
  );

CREATE POLICY "Users can update their organization" ON public.organizations
  FOR UPDATE USING (
    id IN (
      SELECT organization_id FROM public.profiles 
      WHERE user_id = auth.uid() AND role IN ('admin', 'fund_manager')
    )
  );

-- RLS Policies for Profiles
CREATE POLICY "Users can view profiles in their organization" ON public.profiles
  FOR SELECT USING (
    organization_id IN (
      SELECT organization_id FROM public.profiles 
      WHERE user_id = auth.uid()
    )
  );

CREATE POLICY "Users can update their own profile" ON public.profiles
  FOR UPDATE USING (user_id = auth.uid());

CREATE POLICY "Users can insert their own profile" ON public.profiles
  FOR INSERT WITH CHECK (user_id = auth.uid());

-- RLS Policies for Funds
CREATE POLICY "Users can view funds in their organization" ON public.funds
  FOR SELECT USING (
    organization_id IN (
      SELECT organization_id FROM public.profiles 
      WHERE user_id = auth.uid()
    )
  );

CREATE POLICY "Fund managers can manage funds" ON public.funds
  FOR ALL USING (
    organization_id IN (
      SELECT organization_id FROM public.profiles 
      WHERE user_id = auth.uid() AND role IN ('admin', 'fund_manager')
    )
  );

-- RLS Policies for Investment Strategies
CREATE POLICY "Users can view strategies for accessible funds" ON public.investment_strategies
  FOR SELECT USING (
    fund_id IN (
      SELECT f.id FROM public.funds f
      JOIN public.profiles p ON f.organization_id = p.organization_id
      WHERE p.user_id = auth.uid()
    )
  );

CREATE POLICY "Fund managers can manage strategies" ON public.investment_strategies
  FOR ALL USING (
    fund_id IN (
      SELECT f.id FROM public.funds f
      JOIN public.profiles p ON f.organization_id = p.organization_id
      WHERE p.user_id = auth.uid() AND p.role IN ('admin', 'fund_manager')
    )
  );

-- RLS Policies for Deals
CREATE POLICY "Users can view deals in accessible funds" ON public.deals
  FOR SELECT USING (
    fund_id IN (
      SELECT f.id FROM public.funds f
      JOIN public.profiles p ON f.organization_id = p.organization_id
      WHERE p.user_id = auth.uid()
    )
  );

CREATE POLICY "Users can manage deals in accessible funds" ON public.deals
  FOR ALL USING (
    fund_id IN (
      SELECT f.id FROM public.funds f
      JOIN public.profiles p ON f.organization_id = p.organization_id
      WHERE p.user_id = auth.uid() AND p.role IN ('admin', 'fund_manager', 'analyst')
    )
  );

-- RLS Policies for Deal Analyses
CREATE POLICY "Users can view deal analyses for accessible deals" ON public.deal_analyses
  FOR SELECT USING (
    deal_id IN (
      SELECT d.id FROM public.deals d
      JOIN public.funds f ON d.fund_id = f.id
      JOIN public.profiles p ON f.organization_id = p.organization_id
      WHERE p.user_id = auth.uid()
    )
  );

-- Apply similar patterns for other tables...
CREATE POLICY "Users can manage deal analyses for accessible deals" ON public.deal_analyses
  FOR ALL USING (
    deal_id IN (
      SELECT d.id FROM public.deals d
      JOIN public.funds f ON d.fund_id = f.id
      JOIN public.profiles p ON f.organization_id = p.organization_id
      WHERE p.user_id = auth.uid() AND p.role IN ('admin', 'fund_manager', 'analyst')
    )
  );

-- Create updated_at trigger function
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create triggers for updated_at
CREATE TRIGGER update_organizations_updated_at BEFORE UPDATE ON public.organizations FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
CREATE TRIGGER update_profiles_updated_at BEFORE UPDATE ON public.profiles FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
CREATE TRIGGER update_funds_updated_at BEFORE UPDATE ON public.funds FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
CREATE TRIGGER update_investment_strategies_updated_at BEFORE UPDATE ON public.investment_strategies FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
CREATE TRIGGER update_deals_updated_at BEFORE UPDATE ON public.deals FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
CREATE TRIGGER update_deal_analyses_updated_at BEFORE UPDATE ON public.deal_analyses FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
CREATE TRIGGER update_ic_meetings_updated_at BEFORE UPDATE ON public.ic_meetings FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
CREATE TRIGGER update_ic_meeting_deals_updated_at BEFORE UPDATE ON public.ic_meeting_deals FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
CREATE TRIGGER update_deal_notes_updated_at BEFORE UPDATE ON public.deal_notes FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- Insert demo organization and user
INSERT INTO public.organizations (id, name, domain) 
VALUES ('550e8400-e29b-41d4-a716-446655440000', 'ReubenAI Demo', 'goreuben.com');

-- Function to handle new user registration
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  -- Check if this is the demo user
  IF NEW.email = 'demo@goreuben.com' THEN
    INSERT INTO public.profiles (user_id, organization_id, email, first_name, last_name, role)
    VALUES (
      NEW.id, 
      '550e8400-e29b-41d4-a716-446655440000',
      NEW.email,
      'Demo',
      'User',
      'fund_manager'
    );
  ELSE
    -- For other users, they'll need to be assigned to an organization later
    INSERT INTO public.profiles (user_id, email, first_name, last_name, role)
    VALUES (
      NEW.id,
      NEW.email,
      NEW.raw_user_meta_data ->> 'first_name',
      NEW.raw_user_meta_data ->> 'last_name',
      'viewer'
    );
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create trigger for new user registration
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();