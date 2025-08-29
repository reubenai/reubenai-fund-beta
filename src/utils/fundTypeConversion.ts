/**
 * Fund Type Conversion Utilities
 * Handles conversion between database format ('venture_capital'/'private_equity') 
 * and template format ('vc'/'pe')
 */

export type DatabaseFundType = 'venture_capital' | 'private_equity';
export type TemplateFundType = 'vc' | 'pe';
export type AnyFundType = DatabaseFundType | TemplateFundType;

/**
 * Converts database fund type to template fund type
 */
export function toTemplateFundType(fundType: AnyFundType): TemplateFundType {
  switch (fundType) {
    case 'venture_capital':
    case 'vc':
      return 'vc';
    case 'private_equity':
    case 'pe':
      return 'pe';
    default:
      console.warn(`Unknown fund type: ${fundType}, defaulting to 'vc'`);
      return 'vc';
  }
}

/**
 * Converts template fund type to database fund type
 */
export function toDatabaseFundType(fundType: AnyFundType): DatabaseFundType {
  switch (fundType) {
    case 'vc':
    case 'venture_capital':
      return 'venture_capital';
    case 'pe':
    case 'private_equity':
      return 'private_equity';
    default:
      console.warn(`Unknown fund type: ${fundType}, defaulting to 'venture_capital'`);
      return 'venture_capital';
  }
}

/**
 * Checks if fund type is valid
 */
export function isValidFundType(fundType: string): fundType is AnyFundType {
  return ['venture_capital', 'private_equity', 'vc', 'pe'].includes(fundType);
}