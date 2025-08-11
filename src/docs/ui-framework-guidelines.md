# UI Framework Guidelines for AI Analysis Components

## Design System Principles

### Color Palette & Semantic Tokens
```css
/* Always use semantic tokens from index.css */
--primary: /* Main brand color - use for primary actions */
--primary-foreground: /* Text on primary backgrounds */
--muted: /* Subtle backgrounds and secondary elements */
--muted-foreground: /* Secondary text content */
--accent: /* Accent highlights and status indicators */
--destructive: /* Error states and warnings */
--success: /* Success states and positive indicators */
```

### Typography & Spacing
- **Headers**: Use consistent font weights (semibold for main titles, medium for section headers)
- **Body Text**: Use `text-muted-foreground` for secondary information
- **Spacing**: Follow 4px grid system (p-2, p-4, p-6, p-8, space-y-4, gap-3)

## Component Patterns for AI Analysis

### Assessment Card Layout
```tsx
<Card className="border-0 shadow-sm">
  <CardContent className="pt-6 space-y-6">
    {/* Overall Status Header */}
    <div className="flex items-center justify-between p-4 rounded-lg border bg-muted/30">
      <div className="flex items-center gap-3">
        <div className="p-2 rounded-full bg-background">
          <Icon className="h-5 w-5" />
        </div>
        <div>
          <p className="font-medium">Assessment Title</p>
          <p className="text-sm text-muted-foreground">Based on X factors</p>
        </div>
      </div>
      <div className="text-right">
        <Badge variant="outline" className={statusColors}>Status</Badge>
        <div className="flex items-center gap-2">
          <Progress value={score} className="w-24" />
          <span className="text-sm font-medium">{score}%</span>
        </div>
      </div>
    </div>

    {/* Individual Checks */}
    <div className="space-y-3">
      <h4 className="font-medium text-sm text-muted-foreground">Assessment Factors</h4>
      {/* Factor items */}
    </div>

    {/* Insights Section */}
    <div className="p-4 rounded-lg bg-muted/30 border">
      <h4 className="font-medium text-sm mb-2">Insights</h4>
      {/* Status-specific insights */}
    </div>
  </CardContent>
</Card>
```

### Status Badge Colors
```tsx
const statusColors = {
  'Excellent': 'bg-emerald-100 text-emerald-700 border-emerald-200',
  'Strong': 'bg-blue-100 text-blue-700 border-blue-200', 
  'Good': 'bg-green-100 text-green-700 border-green-200',
  'Moderate': 'bg-amber-100 text-amber-700 border-amber-200',
  'Fair': 'bg-yellow-100 text-yellow-700 border-yellow-200',
  'Weak': 'bg-red-100 text-red-700 border-red-200',
  'Poor': 'bg-red-100 text-red-700 border-red-200'
};
```

### Factor Assessment Item
```tsx
<div className="flex items-center justify-between p-3 rounded-lg border">
  <div className="flex items-center gap-3">
    <div className="flex items-center gap-2">
      <FactorIcon className="h-4 w-4" />
      <StatusIcon aligned={factor.aligned} />
    </div>
    <div>
      <p className="font-medium text-sm">{factor.criterion}</p>
      <p className="text-xs text-muted-foreground">{factor.reasoning}</p>
    </div>
  </div>
  <div className="text-right">
    <span className="text-xs text-muted-foreground">Weight: {factor.weight}%</span>
    <div className="text-xs font-medium">{factor.score}/100</div>
  </div>
</div>
```

### Loading States
```tsx
// Assessment Loading
<Card>
  <CardContent>
    <div className="flex items-center justify-center py-8">
      <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
    </div>
  </CardContent>
</Card>

// Empty/Error State
<div className="flex items-center justify-center py-8 text-muted-foreground">
  <div className="text-center">
    <AlertTriangle className="h-12 w-12 mx-auto mb-4 opacity-50" />
    <p className="text-lg font-medium">Analysis unavailable</p>
    <p className="text-sm">Trigger AI analysis to assess this factor</p>
  </div>
</div>
```

### Progress Indicators
```tsx
// Score with progress bar
<div className="flex items-center gap-2">
  <Progress value={score} className="w-24" />
  <span className="text-sm font-medium">{score}%</span>
</div>

// Weight indicators
<span className="text-xs text-muted-foreground">Weight: {weight}%</span>
```

## Null Data Handling

### Scoring for Missing Data
- **Null values should contribute to scoring with partial scores (40-50 points)**
- **Never treat null as "aligned" - always mark as false for alignment**
- **Provide clear reasoning explaining data is missing**

```tsx
const factorStrong = data && (/* validation logic */);
checks.push({
  criterion: 'Factor Name',
  aligned: factorStrong || false, // Never true for null data
  reasoning: factorStrong 
    ? 'Strong factor validation message'
    : data 
      ? 'Moderate factor validation message' 
      : 'Factor data not available - analysis needed',
  score: factorStrong ? 85 : data ? 60 : 45 // Partial score for null
});
```

## Consistency Requirements

### Icons
- Use Lucide React icons consistently
- 4x4 for factor icons, 5x5 for section headers, 12x12 for empty states
- Maintain semantic meaning (Shield for security, Users for team, etc.)

### Animation
- Use `animate-spin` for loading spinners
- Use `transition-transform` for interactive elements
- Keep animations subtle and purposeful

### Responsive Design
- Use responsive grid layouts (`lg:grid-cols-3`, `sm:grid-cols-2`)
- Ensure mobile-first approach with proper breakpoints
- Test layouts at different screen sizes

## Best Practices

1. **Semantic HTML**: Use proper heading hierarchy and ARIA labels
2. **Error Handling**: Always provide fallback states and error messages
3. **Performance**: Implement proper loading states and avoid layout shifts
4. **Accessibility**: Ensure proper color contrast and keyboard navigation
5. **Consistency**: Follow established patterns across all analysis components

## Component Composition

When building new assessment components:
1. Start with the established Card layout pattern
2. Use consistent spacing and typography
3. Implement proper null data handling
4. Include loading and error states
5. Follow the status badge color system
6. Add appropriate insights based on assessment results

This framework ensures all AI analysis components maintain visual consistency and provide excellent user experience across the platform.