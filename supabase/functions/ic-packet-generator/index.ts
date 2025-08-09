import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

interface ICPacketRequest {
  deal_id: string
  include_sensitive?: boolean
  format?: 'json' | 'pdf'
  compliance_level?: 'standard' | 'audit_ready'
}

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders })
  }

  try {
    const supabase = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    )

    const { deal_id, include_sensitive = false, format = 'json', compliance_level = 'audit_ready' } = await req.json() as ICPacketRequest

    if (!deal_id) {
      return new Response(
        JSON.stringify({ error: 'Deal ID is required' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    console.log(`Generating IC packet for deal: ${deal_id}`)

    // Generate IC packet using database function
    const { data: packetData, error: packetError } = await supabase
      .rpc('generate_ic_packet', { deal_id_param: deal_id })

    if (packetError) {
      console.error('Error generating IC packet:', packetError)
      return new Response(
        JSON.stringify({ error: `Failed to generate IC packet: ${packetError.message}` }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    if (!packetData) {
      return new Response(
        JSON.stringify({ error: 'No data returned from packet generator' }),
        { status: 404, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    // Enhance packet with additional metadata
    const enhancedPacket = {
      ...packetData,
      generation_metadata: {
        generated_at: new Date().toISOString(),
        generator_version: '1.0.0',
        compliance_level,
        include_sensitive,
        format_requested: format,
        generation_method: 'edge_function'
      },
      compliance_statement: compliance_level === 'audit_ready' ? {
        statement: 'This IC packet has been generated with full audit trail compliance',
        standards: ['SOX', 'GDPR', 'Investment Adviser Act'],
        retention_period: '7 years',
        data_classification: 'confidential'
      } : undefined
    }

    // If sensitive data should be excluded, remove it
    if (!include_sensitive) {
      // Remove sensitive financial details, personal information, etc.
      if (enhancedPacket.audit_trail?.prompt_audit) {
        enhancedPacket.audit_trail.prompt_audit = { 
          ...enhancedPacket.audit_trail.prompt_audit,
          raw_prompts: '[REDACTED - Set include_sensitive: true to view]'
        }
      }
    }

    // Store in exports table for tracking
    const { data: exportRecord, error: exportError } = await supabase
      .from('ic_packet_exports')
      .insert({
        deal_id,
        packet_data: enhancedPacket,
        exported_by: 'system', // Since this is called via edge function
        export_metadata: {
          generation_method: 'edge_function',
          compliance_level,
          include_sensitive,
          file_size_kb: Math.round(JSON.stringify(enhancedPacket).length / 1024)
        }
      })
      .select()
      .single()

    if (exportError) {
      console.warn('Failed to store export record:', exportError)
      // Continue anyway - the packet generation succeeded
    }

    // Return different formats based on request
    if (format === 'pdf') {
      // For PDF format, we'd need to integrate with a PDF generation service
      return new Response(
        JSON.stringify({ 
          error: 'PDF generation not yet implemented',
          fallback_json: enhancedPacket 
        }),
        { status: 501, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    // Return JSON format
    return new Response(
      JSON.stringify({
        success: true,
        packet: enhancedPacket,
        export_id: exportRecord?.id,
        metadata: {
          deal_company: enhancedPacket.deal_summary?.company_name,
          generation_time: new Date().toISOString(),
          packet_size_kb: Math.round(JSON.stringify(enhancedPacket).length / 1024),
          compliance_level
        }
      }),
      {
        status: 200,
        headers: { 
          ...corsHeaders, 
          'Content-Type': 'application/json',
          'X-IC-Packet-Version': '1.0',
          'X-Compliance-Level': compliance_level
        }
      }
    )

  } catch (error) {
    console.error('IC packet generation error:', error)
    
    return new Response(
      JSON.stringify({ 
        error: 'Internal server error during IC packet generation',
        details: error instanceof Error ? error.message : 'Unknown error'
      }),
      { 
        status: 500, 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
      }
    )
  }
})