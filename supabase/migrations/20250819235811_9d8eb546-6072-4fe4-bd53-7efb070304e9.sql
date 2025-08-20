-- Add founder diversity criteria to investment_strategies table
ALTER TABLE investment_strategies 
ADD COLUMN IF NOT EXISTS founder_diversity_criteria JSONB DEFAULT '{
  "enabled": false,
  "diversity_targets": {
    "women_led": false,
    "minority_led": false,
    "veteran_led": false,
    "lgbtq_led": false,
    "immigrant_entrepreneur_led": false,
    "underrepresented_founders": false
  },
  "diversity_scoring_weight": 0,
  "diversity_bonus_points": 0,
  "diversity_requirement_level": "bonus"
}'::jsonb;

-- Add founder diversity options to the existing enhanced_criteria structure
UPDATE investment_strategies 
SET enhanced_criteria = jsonb_set(
  enhanced_criteria,
  '{founder_diversity}',
  '{
    "enabled": false,
    "weight": 0,
    "criteria": {
      "women_led_companies": {"enabled": false, "weight": 20, "bonus_points": 5},
      "minority_led_companies": {"enabled": false, "weight": 20, "bonus_points": 5},
      "veteran_led_companies": {"enabled": false, "weight": 15, "bonus_points": 3},
      "lgbtq_led_companies": {"enabled": false, "weight": 15, "bonus_points": 3},
      "immigrant_entrepreneur_led": {"enabled": false, "weight": 15, "bonus_points": 3},
      "underrepresented_founders": {"enabled": false, "weight": 15, "bonus_points": 3}
    },
    "scoring_method": "bonus",
    "detection_keywords": {
      "women_led": ["female founder", "women-led", "female CEO", "women entrepreneur"],
      "minority_led": ["minority founder", "diverse founder", "black founder", "hispanic founder", "latino founder"],
      "veteran_led": ["veteran founder", "military background", "veteran-owned"],
      "lgbtq_led": ["LGBTQ founder", "LGBTQ+-led", "queer founder"],
      "immigrant_entrepreneur": ["immigrant founder", "immigrant entrepreneur", "international founder"]
    }
  }'::jsonb
)
WHERE enhanced_criteria IS NOT NULL;