import "https://deno.land/x/xhr@0.1.0/mod.ts";
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.53.0';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;

const supabase = createClient(supabaseUrl, supabaseServiceKey);

// Versioned JSON Schemas for Engine Inputs/Outputs
const ENGINE_SCHEMAS = {
  "enhanced-deal-analysis:v1.0": {
    type: "object",
    required: ["executive_summary", "investment_thesis_alignment", "market_attractiveness", "product_strength_ip", "financial_feasibility", "team_leadership", "business_traction"],
    properties: {
      executive_summary: { type: "string", minLength: 100 },
      investment_thesis_alignment: {
        type: "object",
        required: ["score", "analysis", "key_points"],
        properties: {
          score: { type: "integer", minimum: 0, maximum: 100 },
          analysis: { type: "string", minLength: 50 },
          key_points: { type: "array", items: { type: "string" } }
        }
      },
      market_attractiveness: {
        type: "object", 
        required: ["score", "analysis"],
        properties: {
          score: { type: "integer", minimum: 0, maximum: 100 },
          analysis: { type: "string", minLength: 50 }
        }
      },
      product_strength_ip: {
        type: "object",
        required: ["score", "analysis"],
        properties: {
          score: { type: "integer", minimum: 0, maximum: 100 },
          analysis: { type: "string", minLength: 50 }
        }
      },
      financial_feasibility: {
        type: "object",
        required: ["score", "analysis"], 
        properties: {
          score: { type: "integer", minimum: 0, maximum: 100 },
          analysis: { type: "string", minLength: 50 }
        }
      },
      team_leadership: {
        type: "object",
        required: ["score", "analysis"],
        properties: {
          score: { type: "integer", minimum: 0, maximum: 100 },
          analysis: { type: "string", minLength: 50 }
        }
      },
      business_traction: {
        type: "object",
        required: ["score", "analysis"],
        properties: {
          score: { type: "integer", minimum: 0, maximum: 100 },
          analysis: { type: "string", minLength: 50 }
        }
      }
    }
  },
  "market-intelligence-engine:v1.0": {
    type: "object",
    required: ["market_size", "growth_potential", "competitive_landscape", "market_dynamics"],
    properties: {
      market_size: { type: "string", minLength: 20 },
      growth_potential: { type: "string", minLength: 20 },
      competitive_landscape: { type: "string", minLength: 50 },
      market_dynamics: { type: "object" }
    }
  },
  "financial-engine:v1.0": {
    type: "object",
    required: ["revenue_analysis", "cost_structure", "financial_projections", "unit_economics"],
    properties: {
      revenue_analysis: { type: "object" },
      cost_structure: { type: "object" },
      financial_projections: { type: "object" },
      unit_economics: { type: "object" }
    }
  },
  "team-research-engine:v1.0": {
    type: "object",
    required: ["founder_analysis", "team_composition", "advisory_board", "leadership_assessment"],
    properties: {
      founder_analysis: { type: "object" },
      team_composition: { type: "object" },
      advisory_board: { type: "object" },
      leadership_assessment: { type: "object" }
    }
  },
  "thesis-alignment-engine:v1.0": {
    type: "object",
    required: ["alignment_score", "thesis_match", "strategic_fit", "investment_rationale"],
    properties: {
      alignment_score: { type: "integer", minimum: 0, maximum: 100 },
      thesis_match: { type: "object" },
      strategic_fit: { type: "object" },
      investment_rationale: { type: "string", minLength: 100 }
    }
  }
};

interface QueueValidationRequest {
  engine_name: string;
  engine_version: string;
  payload: any;
  deal_id: string;
  fund_id: string;
}

interface QueueValidationResponse {
  valid: boolean;
  status: "draft" | "blocked" | "published";
  block_code?: "schema_error";
  errors?: string[];
  schema_version: string;
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { engine_name, engine_version, payload, deal_id, fund_id }: QueueValidationRequest = await req.json();
    
    console.log(`🔍 Queue Schema Validator: Validating ${engine_name}:${engine_version}`);
    
    const schemaKey = `${engine_name}:${engine_version}`;
    const schema = ENGINE_SCHEMAS[schemaKey];
    
    if (!schema) {
      return new Response(JSON.stringify({
        valid: false,
        status: "blocked",
        block_code: "schema_error",
        errors: [`No schema found for ${schemaKey}`],
        schema_version: "unknown"
      }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    // Validate payload against schema
    const validation = validateAgainstSchema(payload, schema);
    
    if (!validation.valid) {
      // Update analysis queue status to blocked
      await supabase
        .from('analysis_queue')
        .update({ 
          status: 'failed',
          error_message: `Schema validation failed: ${validation.errors.join(', ')}`
        })
        .eq('deal_id', deal_id);

      // Update deal status to blocked
      await supabase
        .from('deals')
        .update({ 
          analysis_queue_status: 'blocked'
        })
        .eq('id', deal_id);

      console.log(`❌ Schema validation failed for ${schemaKey}`);
      
      return new Response(JSON.stringify({
        valid: false,
        status: "blocked",
        block_code: "schema_error", 
        errors: validation.errors,
        schema_version: engine_version
      }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    // Schema validation passed
    console.log(`✅ Schema validation passed for ${schemaKey}`);
    
    return new Response(JSON.stringify({
      valid: true,
      status: "draft", // Can proceed to published after all engines complete
      schema_version: engine_version
    }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });

  } catch (error) {
    console.error('❌ Queue Schema Validation Error:', error);
    return new Response(JSON.stringify({
      valid: false,
      status: "blocked",
      block_code: "schema_error",
      errors: [error.message],
      schema_version: "unknown"
    }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});

function validateAgainstSchema(payload: any, schema: any): { valid: boolean; errors: string[] } {
  const errors: string[] = [];
  
  try {
    // Basic type checking
    if (schema.type && typeof payload !== schema.type) {
      errors.push(`Expected type ${schema.type}, got ${typeof payload}`);
      return { valid: false, errors };
    }

    // Required properties check
    if (schema.required && Array.isArray(schema.required)) {
      for (const requiredProp of schema.required) {
        if (!(requiredProp in payload)) {
          errors.push(`Missing required property: ${requiredProp}`);
        }
      }
    }

    // Properties validation
    if (schema.properties && typeof payload === 'object') {
      for (const [propName, propSchema] of Object.entries(schema.properties)) {
        if (propName in payload) {
          const propValidation = validateAgainstSchema(payload[propName], propSchema);
          if (!propValidation.valid) {
            errors.push(...propValidation.errors.map(err => `${propName}.${err}`));
          }
        }
      }
    }

    // Minimum/Maximum validation for integers
    if (schema.minimum !== undefined && typeof payload === 'number' && payload < schema.minimum) {
      errors.push(`Value ${payload} is below minimum ${schema.minimum}`);
    }
    if (schema.maximum !== undefined && typeof payload === 'number' && payload > schema.maximum) {
      errors.push(`Value ${payload} is above maximum ${schema.maximum}`);
    }

    // String length validation
    if (schema.minLength !== undefined && typeof payload === 'string' && payload.length < schema.minLength) {
      errors.push(`String length ${payload.length} is below minimum ${schema.minLength}`);
    }

    return { valid: errors.length === 0, errors };

  } catch (error) {
    errors.push(`Schema validation error: ${error.message}`);
    return { valid: false, errors };
  }
}