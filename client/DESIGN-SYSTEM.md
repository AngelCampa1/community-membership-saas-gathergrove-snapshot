# GatherGrove Design System

## Overview
This document outlines the design system conventions, patterns, and standards used throughout the GatherGrove application.

---

## Z-Index Scale

The z-index scale ensures proper layering of UI elements. Always use these predefined values to maintain consistency and prevent conflicts.

### Scale Definition

| Level | Value | Usage | Examples |
|-------|-------|-------|----------|
| **Base** | `0` | Default layer, normal document flow | Most components, cards, text |
| **Dropdown** | `10` | Tooltips, popovers, dropdown menus | Tooltip overlays, select dropdowns |
| **Sticky** | `20` | Sticky positioned elements | Sticky table headers, floating action buttons |
| **Fixed UI** | `30` | Fixed position UI elements | Fixed notifications, floating widgets |
| **Overlay** | `40` | Page overlays, mobile menu backgrounds | Mobile menu backdrop, modal overlays |
| **Modal** | `50` | Modal dialogs, headers | Main navigation header, dialog content |
| **Notification** | `60` | Toast notifications, alerts | Success/error toasts (reserved for future use) |

### Usage Examples

```tsx
// Header (z-50)
<header className="sticky top-0 z-50 w-full">

// Mobile menu overlay (z-40)
<div className="fixed inset-0 z-40 bg-black/50">

// Mobile menu content (z-50 - above overlay)
<div className="fixed top-0 left-0 z-50 h-screen">

// Tooltip (z-10)
<div className="absolute z-10 rounded shadow-lg">

// Modal dialog (z-50)
<div className="fixed top-[50%] left-[50%] z-50">
```

### Best Practices

1. **Increments of 10**: Always use increments of 10 to allow for intermediate values if needed
2. **Document Deviations**: If you need a custom z-index between levels, document why
3. **Avoid High Values**: Never use arbitrary high values like `z-999` or `z-9999`
4. **Context Stacking**: Remember that z-index only works within the same stacking context
5. **Use Classes**: Prefer Tailwind utilities (`z-10`, `z-20`, etc.) over inline styles

---

## Color System

### Primary Palette
- **Primary**: Green (#10B981) - Used for CTAs, primary actions
- **Primary Foreground**: White - Text on primary backgrounds

### Semantic Colors
- **Success**: Green (#10B981) - Positive feedback, confirmations
- **Error/Destructive**: Red (#EF4444) - Errors, destructive actions
- **Warning**: Amber (#F59E0B) - Warnings, cautions
- **Info**: Blue (#3B82F6) - Informational messages

### Neutral Palette
- **Background**: Dynamic (light/Light-Only Mode)
- **Foreground**: Dynamic text color
- **Muted**: Subtle backgrounds
- **Border**: Border colors

### Icon Gradient Backgrounds

Standard pattern for icon containers:

```tsx
// Light backgrounds - use /10 opacity
<div className="p-1.5 rounded-lg bg-gradient-to-br from-primary/10 to-success/10">
  <Icon className="h-4 w-4 text-primary" />
</div>

// Dark sections or emphasis - use /20 opacity
<div className="p-2 rounded-lg bg-gradient-to-br from-primary/20 to-success/20">
  <Icon className="h-5 w-5 text-primary" />
</div>

// Color-specific gradients using semantic colors
// Primary: from-primary/10 to-primary/20
// Success: from-success/10 to-success/20
// Secondary: from-secondary/10 to-secondary/20
// Warning: from-warning/10 to-warning/20
```

**Rule**: Use `/10` for light backgrounds, `/20` for dark or emphasized sections.

---

## Typography Scale

### Headings

| Element | Classes | Usage |
|---------|---------|-------|
| H1 | `text-3xl lg:text-4xl font-bold` | Page titles, main headings |
| H2 | `text-2xl lg:text-3xl font-semibold` | Section headings |
| H3 | `text-xl lg:text-2xl font-semibold` | Subsection headings |
| H4 | `text-lg font-semibold` | Card titles, smaller headings |

### Body Text

| Type | Classes | Usage |
|------|---------|-------|
| Large | `text-lg` | Intro paragraphs, emphasis |
| Base | `text-base` | Default paragraph text |
| Small | `text-sm` | Helper text, captions |
| Extra Small | `text-xs` | Metadata, timestamps |

### Text Colors

| Type | Class | Usage |
|------|-------|-------|
| Primary | `text-foreground` | Main body text |
| Muted | `text-muted-foreground` | Secondary text |
| Destructive | `text-destructive` | Error messages |
| Success | `text-success` | Success messages |
| Warning | `text-warning` | Warning messages |
| Primary accent | `text-primary` | Primary accent text |
| Secondary accent | `text-secondary` | Secondary accent text |

---

## Spacing System

### Gap Utilities
Consistent gap scale for flex/grid layouts:
- `gap-1` (4px) - Tight spacing
- `gap-2` (8px) - Small spacing
- `gap-3` (12px) - Default spacing
- `gap-4` (16px) - Standard spacing
- `gap-6` (24px) - Large spacing
- `gap-8` (32px) - Extra large spacing
- `gap-12` (48px) - Section spacing

### Padding/Margin
Follow the same scale as gaps for consistency:
- `p-2` / `m-2` (8px)
- `p-4` / `m-4` (16px)
- `p-6` / `m-6` (24px)
- `p-8` / `m-8` (32px)

---

## Component Patterns

### Buttons

#### Sizes
- `size="icon"` - Icon-only buttons (44x44px minimum for accessibility)
- `size="sm"` - Small buttons (h-8)
- `size="default"` - Standard buttons (h-9)
- `size="lg"` - Large buttons (h-10)

#### Variants
- `variant="default"` - Primary action (green)
- `variant="outline"` - Secondary action
- `variant="ghost"` - Tertiary action
- `variant="destructive"` - Delete/cancel actions
- `variant="glass"` - Glassmorphism effect
- `variant="glass-primary"` - Glassmorphism with primary colors

### Cards

#### Variants
- `Card` - Standard card
- `CardGlass` - Glassmorphism card
- `CardGlassSoft` - Subtle glass effect
- `CardGlassStrong` - Strong glass effect

#### Hover Pattern
```tsx
className="glass border-border/50 hover:glass-strong hover:scale-[1.02] hover:-translate-y-1 transition-all duration-300"
```

### Badges

#### Interactive vs Static
```tsx
// Static badge
<Badge variant="secondary">Label</Badge>

// Interactive badge (clickable)
<Badge variant="secondary" onClick={handleClick}>
  Clickable
</Badge>

// Automatically becomes button when onClick provided
```

---

## Animation & Transitions

### Standard Timing
- **Fast**: `duration-200` (200ms) - Micro-interactions
- **Default**: `duration-300` (300ms) - Most transitions
- **Slow**: `duration-500` (500ms) - Page transitions

### Transition Properties
Use specific properties for better performance:
- `transition-colors` - Color changes only
- `transition-transform` - Transform changes only
- `transition-opacity` - Opacity changes only
- `transition-all` - Multiple properties (use sparingly)

### Hover Animations
```tsx
// Standard button hover
className="hover:-translate-y-0.5 active:translate-y-0 active:scale-95 transition-all duration-300"

// Card hover
className="hover:scale-[1.02] hover:-translate-y-1 hover:shadow-xl transition-all duration-300"
```

### Reduced Motion
All animations respect `prefers-reduced-motion` via global CSS. No additional code needed.

---

## Accessibility

### Touch Targets
- **Minimum**: 44x44px for all interactive elements
- Use `min-h-[44px] min-w-[44px]` for icon buttons
- Ensure adequate spacing between touch targets

### ARIA Labels
Always provide ARIA labels for icon-only buttons:
```tsx
<Button size="icon" aria-label="Edit event">
  <Edit className="h-4 w-4" />
</Button>
```

### Focus States
All interactive elements have focus-visible states via:
- `focus-visible:ring-2`
- `focus-visible:ring-ring`
- `focus-visible:ring-offset-2`

### Color Contrast
- **AA Standard**: 4.5:1 for normal text, 3:1 for large text
- **AAA Standard**: 7:1 for normal text, 4.5:1 for large text
- All critical text meets WCAG AA, most meets AAA

---

## Light-Only Mode

### Implementation
The app uses `light-theme-only` for Light-Only Mode:
- System preference detection
- Manual toggle support
- No flash of wrong theme (FOUC prevention)

### Color Variables
All colors use CSS custom properties that adapt:
```tsx
// Uses theme-aware variables
className="bg-background text-foreground border-border"
```

### Gradients in Light-Only Mode
```tsx
// Automatically adjusts opacity and colors
className="bg-gradient-to-r from-primary to-emerald-600"
```

---

## Responsive Design

### Breakpoints
- `sm`: 640px - Small tablets
- `md`: 768px - Tablets
- `lg`: 1024px - Laptops
- `xl`: 1280px - Desktops
- `2xl`: 1536px - Large screens

### Mobile-First Approach
Default styles are mobile, use breakpoint prefixes to override:
```tsx
className="text-sm md:text-base lg:text-lg"
className="grid-cols-1 md:grid-cols-2 lg:grid-cols-4"
```

### Container
Maximum width container with responsive padding:
```tsx
className="container mx-auto px-4 sm:px-6 lg:px-8"
```

---

## File Organization

### Component Structure
```
components/
├── ui/             # Base UI components
├── features/       # Feature-specific components
├── shared/         # Shared across features
├── analytics/      # Analytics components
├── events/         # Event components
└── members/        # Member components
```

### Naming Conventions
- **PascalCase**: Component files (`EventCard.tsx`)
- **camelCase**: Utility files (`apiClient.ts`)
- **kebab-case**: CSS files (`globals.css`)

---

## Performance Best Practices

### Image Optimization
- Use Next.js `<Image>` component
- Provide `width` and `height`
- Use `loading="lazy"` for below-fold images
- Use modern formats (WebP, AVIF)

### Code Splitting
- Use `dynamic()` for heavy components
- Lazy load below-the-fold content
- Separate vendor bundles

### Animation Performance
- Prefer `transform` and `opacity` (GPU-accelerated)
- Avoid animating `width`, `height`, `top`, `left`
- Use `will-change` sparingly
- Always provide `transition-duration`

---

## Testing Standards

### Component Testing
- Test all interactive states (hover, focus, disabled)
- Test keyboard navigation
- Test screen reader compatibility
- Test responsive breakpoints

### Accessibility Testing
- Run WAVE or axe-core
- Test with keyboard only
- Test with screen reader (NVDA/VoiceOver)
- Verify color contrast ratios

---

## Resources

### Tools
- **Tailwind CSS Docs**: https://tailwindcss.com/docs
- **Radix UI**: https://www.radix-ui.com/
- **Next.js**: https://nextjs.org/docs
- **WCAG Guidelines**: https://www.w3.org/WAI/WCAG21/quickref/

### Internal
- Component examples in Storybook (future)
- Design tokens documentation (future)
- Accessibility audit reports

---

## Version History

- **v1.0** (2025-11-22): Initial design system documentation
  - Z-index scale defined
  - Color system documented
  - Typography standards set
  - Component patterns established
  - Accessibility guidelines added
  - Reduced motion support implemented

---

**Maintained by**: GatherGrove Development Team
**Last Updated**: November 22, 2025
