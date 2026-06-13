---
name: PairPlate Design System
colors:
  surface: '#f8fafb'
  surface-dim: '#d8dadb'
  surface-bright: '#f8fafb'
  surface-container-lowest: '#ffffff'
  surface-container-low: '#f2f4f5'
  surface-container: '#eceeef'
  surface-container-high: '#e6e8e9'
  surface-container-highest: '#e1e3e4'
  on-surface: '#191c1d'
  on-surface-variant: '#414845'
  inverse-surface: '#2e3132'
  inverse-on-surface: '#eff1f2'
  outline: '#727975'
  outline-variant: '#c1c8c4'
  surface-tint: '#47645b'
  primary: '#47645b'
  on-primary: '#ffffff'
  primary-container: '#d1f2e6'
  on-primary-container: '#527066'
  inverse-primary: '#adcdc2'
  secondary: '#625b73'
  on-secondary: '#ffffff'
  secondary-container: '#e8defb'
  on-secondary-container: '#686179'
  tertiary: '#455f88'
  on-tertiary: '#ffffff'
  tertiary-container: '#e3ebff'
  on-tertiary-container: '#516a94'
  error: '#ba1a1a'
  on-error: '#ffffff'
  error-container: '#ffdad6'
  on-error-container: '#93000a'
  primary-fixed: '#c9eade'
  primary-fixed-dim: '#adcdc2'
  on-primary-fixed: '#022019'
  on-primary-fixed-variant: '#2f4c44'
  secondary-fixed: '#e8defb'
  secondary-fixed-dim: '#cbc2de'
  on-secondary-fixed: '#1e182d'
  on-secondary-fixed-variant: '#4a435a'
  tertiary-fixed: '#d6e3ff'
  tertiary-fixed-dim: '#adc7f7'
  on-tertiary-fixed: '#001b3c'
  on-tertiary-fixed-variant: '#2d476f'
  background: '#f8fafb'
  on-background: '#191c1d'
  surface-variant: '#e1e3e4'
typography:
  display-lg:
    fontFamily: Geist
    fontSize: 32px
    fontWeight: '600'
    lineHeight: '1.2'
    letterSpacing: 0.02em
  headline-md:
    fontFamily: Geist
    fontSize: 24px
    fontWeight: '500'
    lineHeight: '1.3'
    letterSpacing: 0.01em
  headline-sm:
    fontFamily: Geist
    fontSize: 20px
    fontWeight: '500'
    lineHeight: '1.4'
    letterSpacing: 0.01em
  body-lg:
    fontFamily: Geist
    fontSize: 16px
    fontWeight: '400'
    lineHeight: '1.6'
    letterSpacing: '0'
  body-md:
    fontFamily: Geist
    fontSize: 14px
    fontWeight: '400'
    lineHeight: '1.5'
    letterSpacing: '0'
  label-caps:
    fontFamily: Geist
    fontSize: 12px
    fontWeight: '600'
    lineHeight: '1.2'
    letterSpacing: 0.1em
  display-lg-mobile:
    fontFamily: Geist
    fontSize: 28px
    fontWeight: '600'
    lineHeight: '1.2'
    letterSpacing: 0.02em
rounded:
  sm: 0.25rem
  DEFAULT: 0.5rem
  md: 0.75rem
  lg: 1rem
  xl: 1.5rem
  full: 9999px
spacing:
  base: 4px
  xs: 8px
  sm: 12px
  md: 16px
  lg: 24px
  xl: 32px
  margin-mobile: 20px
  gutter-mobile: 12px
---

## Brand & Style

The design system is rooted in **Modern Minimalism** with a focus on wellness and interpersonal harmony. It prioritizes calmness over intensity, moving away from aggressive fitness metrics toward a shared lifestyle experience. The aesthetic is airy, utilizing generous whitespace and a "soft-luxury" feel to reduce cognitive load for couples managing their daily nutrition.

The target audience consists of health-conscious partners who value aesthetics and ease of use. The UI should feel like a high-end digital sanctuary—functional yet emotionally resonant. Visual depth is achieved through subtle tonal shifts rather than heavy borders, creating a seamless, integrated environment.

## Colors

The palette is anchored by a cool off-white (`#F7F9FA`) background to prevent screen glare and provide a premium, paper-like quality. 

- **Mint (#D1F2E6) & Soft Violet (#E9DFFC):** Used for non-functional accents, background washes, and decorative elements to evoke a sense of freshness and calm.
- **Shared Identity (Profile 1):** A deep, authoritative Navy (`#1A365D`) representing stability.
- **Shared Identity (Profile 2):** A vibrant yet sophisticated blend of Violet (`#805AD5`) and Pink (`#D53F8C`) representing energy.
- **System States:** Success and information states should utilize low-saturation variants of the Mint and Violet to maintain the minimalist ethos.

## Typography

This design system utilizes **Geist** for its technical precision and clean, modernist proportions. 

The hierarchy relies on **generous letter spacing** for all headings and labels to create an "editorial" feel. Display styles should be used sparingly for daily welcomes or macro summaries. For body text, a slightly increased line-height (1.6) ensures maximum readability during meal preparation or grocery shopping. Labels for meal times (Śniadanie, Kolacja, etc.) should consistently use the `label-caps` style to distinguish them from content.

## Layout & Spacing

As a mobile-first PWA, the layout follows a **fluid grid** model with a focus on bottom-heavy interactions. 

- **Safe Zones:** A 20px horizontal margin is maintained on all mobile screens.
- **Vertical Rhythm:** A strict 4px/8px baseline grid is used to align type and icons.
- **Touch Targets:** All interactive elements (toggles, chips, buttons) must maintain a minimum height of 48px, even if visually appearing smaller, to ensure ease of use.
- **Bottom Navigation:** Fixed at the bottom of the viewport with a subtle backdrop blur to allow content to flow underneath.

## Elevation & Depth

Visual hierarchy is established through **tonal layering** and **ambient shadows** rather than hard lines.

1.  **Level 0 (Surface):** The main background (`#F7F9FA`).
2.  **Level 1 (Cards):** Pure white (`#FFFFFF`) surfaces with a very soft, diffused shadow (Blur: 20px, Y: 4, Opacity: 4%, Color: Navy).
3.  **Level 2 (Active States/Modals):** Pure white with a more pronounced shadow and a 1px inner stroke in a very light grey or the primary Mint/Violet.

Glassmorphism is applied strictly to the Bottom Navigation Bar and Top Header to maintain context of the scroll position without cluttering the view.

## Shapes

The design system uses a **Rounded** shape language to reinforce the wellness and "soft" aesthetic.

- **Standard Cards:** 16px to 24px corner radius depending on the container size.
- **Inputs & Buttons:** 12px radius to provide a friendly but structured feel.
- **Profile Switchers/Avatars:** Circular (Pill-shaped) to distinguish human elements from data elements.
- **Macro Badges:** Small 8px radius or fully rounded pills.

## Components

- **Profile Switcher:** A prominent, elegant toggle at the top or within the navigation. It uses a soft transition between the Navy and Violet/Pink themes. When a profile is active, a subtle glow in the respective profile color is applied to the container.
- **Meal Chips:** Used for "Śniadanie," "Drugie śniadanie," etc. These are pill-shaped with a light-colored fill (Mint or Violet) and medium-weight Geist text.
- **Segmented Controls:** A soft-grey "track" with a white elevated "thumb" that slides between options. Used for switching between Daily/Weekly views.
- **Macro Badges:** Small, minimalist indicators for Protein, Carbs, and Fats. Instead of aggressive charts, use simple typography paired with a small colored dot or a low-opacity background fill.
- **Search Inputs:** Full-width with a 12px radius, utilizing a subtle magnifying glass icon and "Search ingredients..." placeholder in a light grey.
- **Toggles:** Oversized and "squishy" in feel, using the Mint color for the "On" state to signal a healthy/positive choice.
- **Lists:** Clean rows separated by whitespace or 0.5px light grey dividers. Each item should have a generous internal padding (16px).