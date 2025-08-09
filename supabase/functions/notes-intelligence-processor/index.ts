import "https://deno.land/x/xhr@0.1.0/mod.ts";
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.53.0';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
const openAIApiKey = Deno.env.get('OPENAI_API_KEY')!;

const supabase = createClient(supabaseUrl, supabaseServiceKey);

interface NotesIntelligenceRequest {
  dealId: string;
  fundId?: string;
  noteId?: string; // For single note analysis
  action?: 'analyze_single' | 'analyze_all' | 'get_insights';
}

interface NotesIntelligence {
  deal_id: string;
  note_count: number;
  sentiment_analysis: {
    overall_sentiment: 'positive' | 'neutral' | 'negative';
    confidence: number;
    sentiment_breakdown: {
      positive_notes: number;
      neutral_notes: number;
      negative_notes: number;
    };
  };
  key_insights: {
    themes: string[];
    concerns: string[];
    opportunities: string[];
    risk_flags: string[];
  };
  category_analysis: {
    [category: string]: {
      note_count: number;
      sentiment: 'positive' | 'neutral' | 'negative';
      key_points: string[];
    };
  };
  timeline_analysis: {
    trend: 'improving' | 'stable' | 'declining';
    key_events: Array<{
      date: string;
      event: string;
      impact: 'positive' | 'neutral' | 'negative';
    }>;
  };
  actionable_items: string[];
  investment_implications: {
    supports_investment: boolean;
    confidence: number;
    key_factors: string[];
    concerns: string[];
  };
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { dealId, fundId, noteId, action = 'analyze_all' }: NotesIntelligenceRequest = await req.json();
    
    if (!dealId) {
      throw new Error('dealId is required');
    }

    console.log('📝 Notes Intelligence Processor: Starting analysis for deal:', dealId);

    // Fetch deal notes
    let notesQuery = supabase
      .from('deal_notes')
      .select('*')
      .eq('deal_id', dealId)
      .order('created_at', { ascending: true });

    if (noteId) {
      notesQuery = notesQuery.eq('id', noteId);
    }

    const { data: notes, error: notesError } = await notesQuery;

    if (notesError) {
      throw new Error(`Failed to fetch notes: ${notesError.message}`);
    }

    if (!notes || notes.length === 0) {
      console.log('No notes found for deal:', dealId);
      return new Response(JSON.stringify({
        deal_id: dealId,
        note_count: 0,
        message: 'No notes available for analysis'
      }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    // Get fund strategy for context
    const { data: fundData } = await supabase
      .from('deals')
      .select(`
        fund_id,
        funds (
          fund_type,
          investment_strategies (
            fund_type,
            enhanced_criteria
          )
        )
      `)
      .eq('id', dealId)
      .single();

    const fundType = fundData?.funds?.investment_strategies?.fund_type || 'vc';

    // Process notes through OpenAI for intelligence extraction
    const notesIntelligence = await processNotesWithAI(notes, fundType);

    // Store the intelligence summary back to the database
    await storeNotesIntelligence(dealId, notesIntelligence);

    // Trigger deal reanalysis if significant changes detected
    if (notesIntelligence.investment_implications.confidence > 0.7) {
      await triggerDealReanalysis(dealId, 'notes_intelligence_update');
    }

    console.log('✅ Notes intelligence analysis completed for deal:', dealId);

    return new Response(JSON.stringify(notesIntelligence), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });

  } catch (error) {
    console.error('❌ Error in notes intelligence processor:', error);
    return new Response(JSON.stringify({ 
      error: error.message,
      details: 'Notes intelligence processing failed'
    }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});

async function processNotesWithAI(notes: any[], fundType: string): Promise<NotesIntelligence> {
  const notesContent = notes.map(note => ({
    id: note.id,
    category: note.category,
    content: note.content,
    sentiment: note.sentiment,
    tags: note.tags,
    created_at: note.created_at,
    author: note.created_by
  }));

  const prompt = `
# Notes Intelligence Analysis - ${fundType.toUpperCase()} Fund

## Task
Analyze the following deal notes to extract intelligence that will inform investment decision-making for a ${fundType === 'vc' ? 'venture capital' : 'private equity'} fund.

## Notes Data
${JSON.stringify(notesContent, null, 2)}

## Analysis Requirements

1. **Sentiment Analysis**: Determine overall sentiment and confidence level
2. **Key Insights**: Extract themes, concerns, opportunities, and risk flags
3. **Category Analysis**: Analyze notes by category (meetings, due diligence, financial, etc.)
4. **Timeline Analysis**: Identify trends and key events over time
5. **Investment Implications**: Assess whether notes support or concern the investment

## Response Format
Return a JSON object with the following structure:

{
  "deal_id": "string",
  "note_count": number,
  "sentiment_analysis": {
    "overall_sentiment": "positive" | "neutral" | "negative",
    "confidence": number (0-1),
    "sentiment_breakdown": {
      "positive_notes": number,
      "neutral_notes": number,
      "negative_notes": number
    }
  },
  "key_insights": {
    "themes": ["string"],
    "concerns": ["string"],
    "opportunities": ["string"],
    "risk_flags": ["string"]
  },
  "category_analysis": {
    "category_name": {
      "note_count": number,
      "sentiment": "positive" | "neutral" | "negative",
      "key_points": ["string"]
    }
  },
  "timeline_analysis": {
    "trend": "improving" | "stable" | "declining",
    "key_events": [
      {
        "date": "string",
        "event": "string",
        "impact": "positive" | "neutral" | "negative"
      }
    ]
  },
  "actionable_items": ["string"],
  "investment_implications": {
    "supports_investment": boolean,
    "confidence": number (0-1),
    "key_factors": ["string"],
    "concerns": ["string"]
  }
}

## Analysis Guidelines
- Focus on ${fundType === 'vc' ? 'growth potential, innovation, and scalability' : 'operational performance, market position, and value creation'}
- Identify patterns that could impact investment decisions
- Flag any red flags or concerning trends
- Highlight positive developments and opportunities
- Consider the chronological evolution of sentiment and key metrics
- Be objective and evidence-based in your analysis
`;

  try {
    const response = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${openAIApiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'gpt-4o-mini',
        messages: [
          {
            role: 'system',
            content: 'You are an expert investment analyst specializing in extracting actionable intelligence from deal notes and documentation. Your analysis directly informs investment committee decisions.'
          },
          {
            role: 'user',
            content: prompt
          }
        ],
        temperature: 0.3,
        max_tokens: 2000,
        response_format: { type: 'json_object' }
      }),
    });

    if (!response.ok) {
      throw new Error(`OpenAI API error: ${response.status}`);
    }

    const data = await response.json();
    const analysis = JSON.parse(data.choices[0].message.content);
    
    // Ensure deal_id is set correctly
    analysis.deal_id = notes[0]?.deal_id || 'unknown';
    analysis.note_count = notes.length;

    return analysis as NotesIntelligence;

  } catch (error) {
    console.error('Error processing notes with AI:', error);
    
    // Return basic analysis as fallback
    return {
      deal_id: notes[0]?.deal_id || 'unknown',
      note_count: notes.length,
      sentiment_analysis: {
        overall_sentiment: 'neutral',
        confidence: 0.5,
        sentiment_breakdown: {
          positive_notes: 0,
          neutral_notes: notes.length,
          negative_notes: 0
        }
      },
      key_insights: {
        themes: ['Notes analysis unavailable'],
        concerns: ['AI analysis failed'],
        opportunities: [],
        risk_flags: ['Unable to process notes intelligence']
      },
      category_analysis: {},
      timeline_analysis: {
        trend: 'stable',
        key_events: []
      },
      actionable_items: ['Review notes intelligence processing'],
      investment_implications: {
        supports_investment: false,
        confidence: 0.3,
        key_factors: [],
        concerns: ['Notes intelligence processing failed']
      }
    };
  }
}

async function storeNotesIntelligence(dealId: string, intelligence: NotesIntelligence): Promise<void> {
  try {
    // Store in fund memory for pattern recognition
    const { data: dealData } = await supabase
      .from('deals')
      .select('fund_id, company_name, industry')
      .eq('id', dealId)
      .single();

    if (dealData) {
      await supabase.from('fund_memory_entries').insert({
        fund_id: dealData.fund_id,
        deal_id: dealId,
        memory_type: 'notes_intelligence',
        title: `Notes Intelligence: ${dealData.company_name}`,
        description: 'AI-processed insights from deal notes',
        memory_content: {
          type: 'notes_intelligence',
          deal_id: dealId,
          company_name: dealData.company_name,
          industry: dealData.industry,
          ...intelligence
        },
        confidence_score: Math.round(intelligence.investment_implications.confidence * 100),
        importance_level: intelligence.investment_implications.confidence > 0.7 ? 'high' : 'medium',
        contextual_tags: [
          'notes_intelligence',
          intelligence.sentiment_analysis.overall_sentiment,
          dealData.industry || 'unknown_industry',
          `${intelligence.note_count}_notes`
        ],
        ai_service_name: 'notes-intelligence-processor'
      });
    }

    console.log('✅ Notes intelligence stored successfully');
  } catch (error) {
    console.error('Error storing notes intelligence:', error);
  }
}

async function triggerDealReanalysis(dealId: string, reason: string): Promise<void> {
  try {
    // Queue the deal for reanalysis due to significant note updates
    await supabase.rpc('queue_deal_analysis', {
      deal_id_param: dealId,
      trigger_reason_param: reason,
      priority_param: 'high',
      delay_minutes: 2
    });

    console.log('✅ Deal reanalysis triggered due to notes intelligence updates');
  } catch (error) {
    console.error('Error triggering deal reanalysis:', error);
  }
}