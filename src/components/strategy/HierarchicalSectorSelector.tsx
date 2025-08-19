import { useState } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { ChevronDown, ChevronRight, Check, X } from 'lucide-react';
import { ENHANCED_INDUSTRIES, IndustryHierarchy } from '@/constants/enhancedIndustries';

interface HierarchicalSectorSelectorProps {
  selectedSectors: string[];
  onSelectionChange: (sectors: string[]) => void;
  fundType?: 'vc' | 'pe';
}

export function HierarchicalSectorSelector({ 
  selectedSectors, 
  onSelectionChange,
  fundType 
}: HierarchicalSectorSelectorProps) {
  const [expandedIndustries, setExpandedIndustries] = useState<Set<string>>(new Set());

  const toggleIndustryExpansion = (industryName: string) => {
    const newExpanded = new Set(expandedIndustries);
    if (newExpanded.has(industryName)) {
      newExpanded.delete(industryName);
    } else {
      newExpanded.add(industryName);
    }
    setExpandedIndustries(newExpanded);
  };

  const isIndustrySelected = (industry: IndustryHierarchy): boolean => {
    return selectedSectors.includes(industry.canonical);
  };

  const isSectorSelected = (sectorName: string): boolean => {
    return selectedSectors.includes(sectorName);
  };

  const getSelectedSectorsInIndustry = (industry: IndustryHierarchy): number => {
    return industry.sectors.filter(sector => selectedSectors.includes(sector)).length;
  };

  const toggleIndustrySelection = (industry: IndustryHierarchy) => {
    const isSelected = isIndustrySelected(industry);
    let newSelection = [...selectedSectors];

    if (isSelected) {
      // Remove the industry and all its sectors
      newSelection = newSelection.filter(item => 
        item !== industry.canonical && !industry.sectors.includes(item)
      );
    } else {
      // Add the industry (this represents selecting the entire industry)
      newSelection = newSelection.filter(item => !industry.sectors.includes(item));
      newSelection.push(industry.canonical);
    }

    onSelectionChange(newSelection);
  };

  const toggleSectorSelection = (industry: IndustryHierarchy, sectorName: string) => {
    let newSelection = [...selectedSectors];
    const isSelected = isSectorSelected(sectorName);
    const industrySelected = isIndustrySelected(industry);

    if (isSelected) {
      // Remove the sector
      newSelection = newSelection.filter(item => item !== sectorName);
    } else {
      // Remove industry-level selection if it exists, then add specific sector
      if (industrySelected) {
        newSelection = newSelection.filter(item => item !== industry.canonical);
      }
      newSelection.push(sectorName);
    }

    onSelectionChange(newSelection);
  };

  const removeSelection = (item: string) => {
    const newSelection = selectedSectors.filter(selected => selected !== item);
    onSelectionChange(newSelection);
  };

  const getRelevanceColor = (industry: IndustryHierarchy): string => {
    if (!fundType) return 'border-border';
    
    const relevance = fundType === 'vc' ? industry.vcRelevance : industry.peRelevance;
    if (relevance >= 8) return 'border-green-200 bg-green-50';
    if (relevance >= 6) return 'border-yellow-200 bg-yellow-50';
    return 'border-border';
  };

  return (
    <div className="space-y-4">
      {/* Selection Summary */}
      {selectedSectors.length > 0 && (
        <div className="flex flex-wrap gap-2 p-4 bg-muted/30 rounded-lg">
          <span className="text-sm font-medium text-muted-foreground mr-2">Selected:</span>
          {selectedSectors.map((item) => (
            <Badge key={item} variant="secondary" className="flex items-center gap-1">
              {item}
              <Button
                variant="ghost"
                size="sm"
                className="h-auto p-0 w-4 h-4 hover:bg-destructive hover:text-destructive-foreground"
                onClick={() => removeSelection(item)}
              >
                <X className="w-3 h-3" />
              </Button>
            </Badge>
          ))}
        </div>
      )}

      {/* Industry Cards */}
      <div className="grid gap-3">
        {ENHANCED_INDUSTRIES.map((industry) => {
          const isExpanded = expandedIndustries.has(industry.canonical);
          const isSelected = isIndustrySelected(industry);
          const selectedSectorCount = getSelectedSectorsInIndustry(industry);
          const hasSelectedSectors = selectedSectorCount > 0;

          return (
            <Card 
              key={industry.canonical} 
              className={`transition-all duration-200 ${getRelevanceColor(industry)} ${
                isSelected || hasSelectedSectors ? 'ring-2 ring-primary/20' : ''
              }`}
            >
              <CardContent className="p-4">
                {/* Industry Header */}
                <div className="flex items-center justify-between mb-2">
                  <div className="flex items-center gap-3 flex-1">
                    <Button
                      variant="ghost"
                      size="sm"
                      className="h-auto p-1"
                      onClick={() => toggleIndustryExpansion(industry.canonical)}
                    >
                      {isExpanded ? (
                        <ChevronDown className="w-4 h-4" />
                      ) : (
                        <ChevronRight className="w-4 h-4" />
                      )}
                    </Button>
                    
                    <div className="flex-1">
                      <div className="flex items-center gap-2">
                        <h3 className="font-medium text-sm">{industry.canonical}</h3>
                      </div>
                      <p className="text-xs text-muted-foreground mt-1">{industry.description}</p>
                    </div>
                  </div>

                  {/* Selection Indicators */}
                  <div className="flex items-center gap-2">
                    {hasSelectedSectors && !isSelected && (
                      <Badge variant="outline" className="text-xs">
                        {selectedSectorCount} sector{selectedSectorCount !== 1 ? 's' : ''}
                      </Badge>
                    )}
                    <Button
                      variant={isSelected ? "default" : "outline"}
                      size="sm"
                      onClick={() => toggleIndustrySelection(industry)}
                      className="h-8"
                    >
                      {isSelected && <Check className="w-3 h-3 mr-1" />}
                      {isSelected ? 'Selected' : 'Select All'}
                    </Button>
                  </div>
                </div>

                {/* Expanded Sectors */}
                {isExpanded && (
                  <div className="mt-4 pt-4 border-t">
                    <p className="text-xs text-muted-foreground mb-3">
                      Select specific sectors ({industry.sectors.length} available):
                    </p>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                      {industry.sectors.map((sector) => {
                        const sectorSelected = isSectorSelected(sector);
                        return (
                          <Button
                            key={sector}
                            variant={sectorSelected ? "default" : "ghost"}
                            size="sm"
                            className="justify-start h-auto py-2 px-3 text-xs"
                            onClick={() => toggleSectorSelection(industry, sector)}
                            disabled={isSelected}
                          >
                            {sectorSelected && <Check className="w-3 h-3 mr-2" />}
                            {sector}
                          </Button>
                        );
                      })}
                    </div>
                    {isSelected && (
                      <p className="text-xs text-muted-foreground mt-2 italic">
                        Industry-level selection includes all sectors
                      </p>
                    )}
                  </div>
                )}
              </CardContent>
            </Card>
          );
        })}
      </div>
    </div>
  );
}