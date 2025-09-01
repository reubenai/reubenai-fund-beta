import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

interface PostProcessRequest {
  dealId?: string
  recordId?: string
  forceReprocess?: boolean
}

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders })
  }

  try {
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
    
    const supabase = createClient(supabaseUrl, supabaseServiceKey)

    // Parse request body
    let requestBody: PostProcessRequest = {}
    
    if (req.method === 'POST') {
      try {
        const body = await req.text()
        if (body) {
          requestBody = JSON.parse(body)
        }
      } catch (e) {
        console.log('No valid JSON body provided, processing all pending records')
      }
    }

    const { dealId, recordId, forceReprocess } = requestBody

    console.log('🚀 Starting Perplexity founder enrichment post-processing...')
    console.log('Request params:', { dealId, recordId, forceReprocess })

    // Build query conditions
    let query = supabase
      .from('deal_enrichment_perplexity_founder_export_vc')
      .select('*')

    if (recordId) {
      query = query.eq('id', recordId)
    } else if (dealId) {
      query = query.eq('deal_id', dealId)
    }

    if (!forceReprocess) {
      query = query.in('processing_status', ['raw', 'pending'])
    }

    // Add a reasonable limit to prevent overwhelming the system
    query = query.limit(50)

    const { data: records, error: fetchError } = await query

    if (fetchError) {
      console.error('❌ Error fetching records:', fetchError)
      return new Response(
        JSON.stringify({ success: false, error: `Failed to fetch records: ${fetchError.message}` }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    if (!records || records.length === 0) {
      console.log('ℹ️ No records found to process')
      return new Response(
        JSON.stringify({ success: true, message: 'No records found to process', processedCount: 0 }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    console.log(`📋 Found ${records.length} records to process`)

    let processedCount = 0
    let errorCount = 0
    const errors: string[] = []

    // Process each record
    for (const record of records) {
      try {
        console.log(`🔄 Processing record ${record.id} for deal ${record.deal_id}`)

        // Update status to processing
        await supabase
          .from('deal_enrichment_perplexity_founder_export_vc')
          .update({ processing_status: 'processing' })
          .eq('id', record.id)

        // Extract and process the raw response
        if (!record.raw_perplexity_response) {
          console.error(`❌ No raw response found for record ${record.id}`)
          await supabase
            .from('deal_enrichment_perplexity_founder_export_vc')
            .update({ processing_status: 'failed' })
            .eq('id', record.id)
          errorCount++
          errors.push(`Record ${record.id}: No raw response data`)
          continue
        }

        // Parse the Perplexity response
        let parsedData: any
        try {
          // Handle different response formats
          if (typeof record.raw_perplexity_response === 'string') {
            parsedData = JSON.parse(record.raw_perplexity_response)
          } else {
            parsedData = record.raw_perplexity_response
          }

          // Extract the actual JSON content from choices
          let jsonContent: any
          if (parsedData.choices && parsedData.choices[0] && parsedData.choices[0].message) {
            const messageContent = parsedData.choices[0].message.content
            if (typeof messageContent === 'string') {
              // Try to parse JSON from the message content
              const jsonMatch = messageContent.match(/\{[\s\S]*\}/)
              if (jsonMatch) {
                jsonContent = JSON.parse(jsonMatch[0])
              } else {
                jsonContent = JSON.parse(messageContent)
              }
            } else {
              jsonContent = messageContent
            }
          } else {
            jsonContent = parsedData
          }

          console.log(`✅ Successfully parsed JSON for record ${record.id}`)

          // Extract structured data from the parsed JSON
          const processedData = await processPerplexityFounderResponse(jsonContent, record.deal_id, record.snapshot_id)

          // Generate JSON analysis format
          const founderAnalysisJSON = buildFounderAnalysisJSON(jsonContent);

          // Update the record with processed data
          const updateData = {
            // Track record data
            track_record: processedData.track_record || null,
            
            // Team leadership data  
            team_leadership: processedData.team_leadership || null,
            previous_roles: processedData.previous_roles || null,
            leadership_experience: processedData.leadership_experience || null,
            
            // Market knowledge data
            market_knowledge: processedData.market_knowledge || null,
            thought_leadership: processedData.thought_leadership || null,
            
            // Innovation expertise data
            innovation_expertise: processedData.innovation_expertise || null,
            technical_skills: processedData.technical_skills || null,
            academic_background: processedData.academic_background || null,
            certifications: processedData.certifications || null,
            
            // JSON analysis format
            deal_enrichment_perplexity_founder_export_vc_json: founderAnalysisJSON,
            
            // Quality metrics
            data_quality_score: processedData.data_quality_score || 0,
            confidence_score: processedData.confidence_score || 50,
            subcategory_confidence: processedData.subcategory_confidence || {},
            subcategory_sources: processedData.subcategory_sources || {},
            
            // Status and metadata
            processing_status: 'processed',
            processed_at: new Date().toISOString()
          }

          const { error: updateError } = await supabase
            .from('deal_enrichment_perplexity_founder_export_vc')
            .update(updateData)
            .eq('id', record.id)

          if (updateError) {
            console.error(`❌ Error updating record ${record.id}:`, updateError)
            await supabase
              .from('deal_enrichment_perplexity_founder_export_vc')
              .update({ processing_status: 'failed' })
              .eq('id', record.id)
            errorCount++
            errors.push(`Record ${record.id}: Update failed - ${updateError.message}`)
          } else {
            console.log(`✅ Successfully processed record ${record.id}`)
            processedCount++
          }

        } catch (parseError) {
          console.error(`❌ Error parsing JSON for record ${record.id}:`, parseError)
          await supabase
            .from('deal_enrichment_perplexity_founder_export_vc')
            .update({ processing_status: 'failed' })
            .eq('id', record.id)
          errorCount++
          errors.push(`Record ${record.id}: JSON parsing failed - ${parseError.message}`)
        }

      } catch (recordError) {
        console.error(`❌ Error processing record ${record.id}:`, recordError)
        await supabase
          .from('deal_enrichment_perplexity_founder_export_vc')
          .update({ processing_status: 'failed' })
          .eq('id', record.id)
        errorCount++
        errors.push(`Record ${record.id}: Processing failed - ${recordError.message}`)
      }
    }

    console.log(`🏁 Post-processing completed. Processed: ${processedCount}, Errors: ${errorCount}`)

    return new Response(
      JSON.stringify({
        success: true,
        message: `Post-processing completed`,
        processedCount,
        errorCount,
        totalRecords: records.length,
        errors: errors.length > 0 ? errors : undefined
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )

  } catch (error) {
    console.error('❌ Post-processor error:', error)
    return new Response(
      JSON.stringify({ success: false, error: error.message }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )
  }
})

// Helper function to process Perplexity founder response
async function processPerplexityFounderResponse(jsonData: any, dealId: string, snapshotId?: string) {
  console.log('🔄 Processing Perplexity founder response for deal:', dealId)

  // Extract and structure the data based on the JSON format
  const processedData: any = {
    deal_id: dealId,
    snapshot_id: snapshotId
  }

  try {
    // Extract track record information
    if (jsonData.track_record) {
      processedData.track_record = jsonData.track_record
    }

    // Extract team leadership information
    if (jsonData.team_leadership) {
      processedData.team_leadership = jsonData.team_leadership
      
      // Also extract specific arrays for compatibility
      if (jsonData.team_leadership.data?.previous_roles) {
        processedData.previous_roles = jsonData.team_leadership.data.previous_roles
      }
      if (jsonData.team_leadership.data?.leadership_experience) {
        processedData.leadership_experience = jsonData.team_leadership.data.leadership_experience
      }
    }

    // Extract market knowledge information
    if (jsonData.market_knowledge) {
      processedData.market_knowledge = jsonData.market_knowledge
      
      // Extract thought leadership specifically
      if (jsonData.market_knowledge.data?.thought_leadership) {
        processedData.thought_leadership = jsonData.market_knowledge.data.thought_leadership
      }
    }

    // Extract innovation expertise information
    if (jsonData.innovation_expertise) {
      processedData.innovation_expertise = jsonData.innovation_expertise
      
      // Extract specific arrays for compatibility
      if (jsonData.innovation_expertise.data?.technical_skills) {
        processedData.technical_skills = jsonData.innovation_expertise.data.technical_skills
      }
      if (jsonData.innovation_expertise.data?.academic_background) {
        processedData.academic_background = jsonData.innovation_expertise.data.academic_background
      }
      if (jsonData.innovation_expertise.data?.certifications) {
        processedData.certifications = jsonData.innovation_expertise.data.certifications
      }
    }

    // Calculate data quality and confidence scores
    processedData.data_quality_score = calculateFounderDataQualityWithSubcategories(jsonData)
    processedData.confidence_score = calculateFounderConfidenceScore(jsonData)
    
    // Extract subcategory confidence and sources
    processedData.subcategory_confidence = extractSubcategoryConfidence(jsonData)
    processedData.subcategory_sources = extractSubcategorySources(jsonData)

    console.log('✅ Successfully processed Perplexity founder data')
    
  } catch (error) {
    console.error('❌ Error processing founder data:', error)
    throw error
  }

  return processedData
}

// Helper function to calculate data quality score
function calculateFounderDataQualityWithSubcategories(data: any): number {
  let score = 0
  const maxScore = 100

  // Track Record (25 points)
  if (data.track_record?.data) {
    if (data.track_record.data.exit_history?.length > 0) score += 10
    if (data.track_record.data.value_creation) score += 15
  }

  // Team Leadership (25 points)  
  if (data.team_leadership?.data) {
    if (data.team_leadership.data.team_building) score += 10
    if (data.team_leadership.data.previous_roles?.length > 0) score += 8
    if (data.team_leadership.data.leadership_experience) score += 7
  }

  // Market Knowledge (25 points)
  if (data.market_knowledge?.data) {
    if (data.market_knowledge.data.market_knowledge) score += 15
    if (data.market_knowledge.data.thought_leadership) score += 10
  }

  // Innovation Expertise (25 points)
  if (data.innovation_expertise?.data) {
    if (data.innovation_expertise.data.technical_skills?.length > 0) score += 8
    if (data.innovation_expertise.data.innovation_record) score += 10
    if (data.innovation_expertise.data.academic_background) score += 7
  }

  return Math.min(score, maxScore)
}

// Helper function to calculate confidence score
function calculateFounderConfidenceScore(data: any): number {
  const confidenceLevels = []

  // Extract confidence from each subcategory
  if (data.track_record?.confidence) {
    confidenceLevels.push(mapConfidenceToNumber(data.track_record.confidence))
  }
  if (data.team_leadership?.confidence) {
    confidenceLevels.push(mapConfidenceToNumber(data.team_leadership.confidence))
  }
  if (data.market_knowledge?.confidence) {
    confidenceLevels.push(mapConfidenceToNumber(data.market_knowledge.confidence))
  }
  if (data.innovation_expertise?.confidence) {
    confidenceLevels.push(mapConfidenceToNumber(data.innovation_expertise.confidence))
  }

  if (confidenceLevels.length === 0) return 50 // Default confidence

  // Return average confidence
  return Math.round(confidenceLevels.reduce((a, b) => a + b, 0) / confidenceLevels.length)
}

// Helper function to extract subcategory confidence
function extractSubcategoryConfidence(data: any): any {
  const confidence: any = {}

  if (data.track_record?.confidence) {
    confidence.track_record = data.track_record.confidence
  }
  if (data.team_leadership?.confidence) {
    confidence.team_leadership = data.team_leadership.confidence
  }
  if (data.market_knowledge?.confidence) {
    confidence.market_knowledge = data.market_knowledge.confidence
  }
  if (data.innovation_expertise?.confidence) {
    confidence.innovation_expertise = data.innovation_expertise.confidence
  }

  return confidence
}

// Helper function to extract subcategory sources
function extractSubcategorySources(data: any): any {
  const sources: any = {}

  if (data.track_record?.sources) {
    sources.track_record = data.track_record.sources
  }
  if (data.team_leadership?.sources) {
    sources.team_leadership = data.team_leadership.sources
  }
  if (data.market_knowledge?.sources) {
    sources.market_knowledge = data.market_knowledge.sources
  }
  if (data.innovation_expertise?.sources) {
    sources.innovation_expertise = data.innovation_expertise.sources
  }

  return sources
}

// Helper function to map confidence strings to numbers
function mapConfidenceToNumber(confidence: string): number {
  const lowerConf = confidence.toLowerCase()
  if (lowerConf.includes('high')) return 85
  if (lowerConf.includes('medium')) return 65
  if (lowerConf.includes('low')) return 35
  return 50 // Default
}

// Helper function to build founder analysis JSON in flat format
function buildFounderAnalysisJSON(founderData: any): any {
  const analysisJSON: any = {};
  
  // Extract data from subcategories
  const teamData = founderData.team_leadership?.data || {};
  const innovationData = founderData.innovation_expertise?.data || {};
  const marketData = founderData.market_knowledge?.data || {};
  const trackData = founderData.track_record?.data || {};
  
  // Map to flat structure similar to company enrichment
  analysisJSON["Previous Roles"] = teamData.previous_roles || "No previous role data available";
  analysisJSON["Leadership Experience"] = teamData.leadership_experience?.summary || "No leadership experience data available";
  analysisJSON["Technical Skills"] = innovationData.technical_skills || "No technical skills data available";
  analysisJSON["Market Knowledge"] = marketData.market_knowledge?.industries || "No market knowledge data available";
  analysisJSON["Innovation Record"] = innovationData.innovation_record?.patents || innovationData.innovation_record?.innovations || "No innovation record data available";
  analysisJSON["Academic Background"] = innovationData.academic_background?.degrees || "No academic background data available";
  analysisJSON["Certifications"] = innovationData.certifications || "No certifications data available";
  analysisJSON["Thought Leadership"] = marketData.thought_leadership?.publications || marketData.thought_leadership?.speaking_engagements || "No thought leadership data available";
  analysisJSON["Exit History"] = trackData.exit_history || "No exit history data available";
  analysisJSON["Value Creation"] = trackData.value_creation?.summary || "No value creation data available";
  analysisJSON["Team Building"] = teamData.team_building?.summary || "No team building data available";
  
  // Additional relevant fields
  analysisJSON["Industry Recognition"] = marketData.thought_leadership?.media_appearances || "No industry recognition data available";
  analysisJSON["Investment Track Record"] = trackData.value_creation?.financial_achievements || "No investment track record data available";  
  analysisJSON["Network Strength"] = teamData.team_building?.notable_hires || "No network strength data available";
  
  // Add metadata
  analysisJSON["metadata"] = {
    "source": "perplexity_api",
    "version": "1.0",
    "last_updated": new Date().toISOString(),
    "overall_confidence": founderData.metadata?.overall_confidence || "Medium",
    "data_completeness_percentage": Math.round(calculateFounderDataQualityWithSubcategories(founderData))
  };
  
  return analysisJSON;
}