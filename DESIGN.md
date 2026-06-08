---
name: Serene Capital
colors:
  surface: '#fbf9f3'
  surface-dim: '#dbdad4'
  surface-bright: '#fbf9f3'
  surface-container-lowest: '#ffffff'
  surface-container-low: '#f5f4ed'
  surface-container: '#efeee7'
  surface-container-high: '#eae8e2'
  surface-container-highest: '#e4e2dc'
  on-surface: '#1b1c18'
  on-surface-variant: '#46483e'
  inverse-surface: '#30312d'
  inverse-on-surface: '#f2f1ea'
  outline: '#77786d'
  outline-variant: '#c7c7ba'
  surface-tint: '#5b6240'
  primary: '#595f3d'
  on-primary: '#ffffff'
  primary-container: '#717854'
  on-primary-container: '#fcffe2'
  inverse-primary: '#c3caa1'
  secondary: '#5d5f5b'
  on-secondary: '#ffffff'
  secondary-container: '#e0e0db'
  on-secondary-container: '#62635f'
  tertiary: '#555f4e'
  on-tertiary: '#ffffff'
  tertiary-container: '#6e7865'
  on-tertiary-container: '#f8ffee'
  error: '#ba1a1a'
  on-error: '#ffffff'
  error-container: '#ffdad6'
  on-error-container: '#93000a'
  primary-fixed: '#e0e7bb'
  primary-fixed-dim: '#c3caa1'
  on-primary-fixed: '#181e04'
  on-primary-fixed-variant: '#434a2a'
  secondary-fixed: '#e3e3de'
  secondary-fixed-dim: '#c6c7c2'
  on-secondary-fixed: '#1a1c19'
  on-secondary-fixed-variant: '#454744'
  tertiary-fixed: '#dce6d0'
  tertiary-fixed-dim: '#c0cab5'
  on-tertiary-fixed: '#151e10'
  on-tertiary-fixed-variant: '#404a39'
  background: '#fbf9f3'
  on-background: '#1b1c18'
  surface-variant: '#e4e2dc'
typography:
  headline-xl:
    fontFamily: Hanken Grotesk
    fontSize: 40px
    fontWeight: '600'
    lineHeight: '1.2'
    letterSpacing: -0.02em
  headline-lg:
    fontFamily: Hanken Grotesk
    fontSize: 32px
    fontWeight: '600'
    lineHeight: '1.2'
    letterSpacing: -0.02em
  headline-lg-mobile:
    fontFamily: Hanken Grotesk
    fontSize: 24px
    fontWeight: '600'
    lineHeight: '1.2'
  headline-md:
    fontFamily: Hanken Grotesk
    fontSize: 20px
    fontWeight: '500'
    lineHeight: '1.4'
  body-lg:
    fontFamily: Inter
    fontSize: 18px
    fontWeight: '400'
    lineHeight: '1.6'
  body-md:
    fontFamily: Inter
    fontSize: 16px
    fontWeight: '400'
    lineHeight: '1.6'
  body-sm:
    fontFamily: Inter
    fontSize: 14px
    fontWeight: '400'
    lineHeight: '1.5'
  label-md:
    fontFamily: Geist
    fontSize: 14px
    fontWeight: '500'
    lineHeight: '1'
    letterSpacing: 0.02em
  label-sm:
    fontFamily: Geist
    fontSize: 12px
    fontWeight: '600'
    lineHeight: '1'
rounded:
  sm: 0.25rem
  DEFAULT: 0.5rem
  md: 0.75rem
  lg: 1rem
  xl: 1.5rem
  full: 9999px
spacing:
  unit: 4px
  container-padding-mobile: 1rem
  container-padding-desktop: 2.5rem
  gutter: 1.5rem
  section-gap: 3rem
---

## Brand & Style

The design system is centered on "Financial Wellness through Tranquility." It aims to reduce the anxiety typically associated with money management by employing a **Minimalist** aesthetic with a touch of **Soft-Modernism**. The target audience consists of professionals seeking a high-utility yet aesthetically calming environment to track wealth.

The UI evokes a sense of order and breathability. It utilizes heavy whitespace to prevent information density fatigue, ensuring that complex financial data feels approachable. The emotional response is one of confidence, clarity, and "digital quiet."

## Theme Modes

Balance is designed for **two rendered visual modes: Light Mode and Dark Mode**. Agents should assume every user-facing surface, component state, and data visualization must work in both modes unless a task explicitly says otherwise.

- **Light Mode** is the default Serene Capital expression: warm cream backgrounds, sage actions, forest emphasis, and soft white cards.
- **Dark Mode** keeps the same calm personality, but shifts surfaces into deep moss/forest tones with lighter sage accents and warm off-white text.
- **System preference exists, but it only chooses between these two rendered modes.** In implementation terms, user preference may be `light`, `dark`, or `system`, while the actual applied UI is always either light or dark.
- **Do not treat dark mode as an afterthought.** Avoid hardcoded white text, pure-black backgrounds, or light-only shadows/borders. Use theme tokens so contrast, hover states, overlays, charts, and focus rings remain legible in both modes.
- **Source of truth for runtime theme tokens lives in `app/globals.css`.** This document describes the visual direction; the concrete light and dark CSS variables are maintained in the global theme tokens.

## Colors

The palette is anchored by **Sage Green**, a color chosen for its association with growth and stability. To ensure accessibility and professional polish, the primary sage is slightly desaturated to `#8C936D`.

The token block at the top of this file should be read as the **light-mode reference palette**. Dark-mode equivalents follow the same semantic roles (`background`, `surface`, `primary`, `border`, `foreground`, and related container tokens), but are tuned to darker moss/forest surfaces in code.

- **Primary (Sage):** Used for primary actions, active states, and positive growth trends.
- **Secondary (Cream):** Used for the main application background to reduce eye strain compared to pure white.
- **Tertiary (Forest):** Used for high-contrast text, primary navigation, and deep-emphasis elements.
- **Neutral (Warm Gray):** Used for secondary text, borders, and UI scaffolding.
- **Semantic Accents:** Soft muted red for expenses and muted blue for investments.

## Typography

This design system uses a triple-font strategy to differentiate intent:
1. **Hanken Grotesk** for headlines provides a contemporary, sharp look for financial totals and section titles.
2. **Inter** for body copy ensures maximum legibility for transaction lists and long-form insights.
3. **Geist** for labels and data points provides a technical, monospaced-adjacent feel for numbers and metadata.

Numerical data should always utilize tabular figures (tnum) where possible to ensure that currency columns align perfectly.

## Layout & Spacing

The layout follows a **Fixed Grid** model on desktop (1280px max-width) and a **Fluid** model on mobile. A 12-column system is used for dashboards, with components typically spanning 4, 6, or 12 columns.

Spacing is generous, following an 8px base scale. The "Inner-Outer" rule applies: spacing between related elements (e.g., a label and an input) should be 8px (2 units), while spacing between unrelated card sections should be 32px or more. This creates clear visual groupings without the need for heavy dividers.

## Elevation & Depth

Depth is achieved through **Tonal Layers** and **Ambient Shadows**. 

- **Surface 0 (Background):** Secondary Cream (#F5F5F0).
- **Surface 1 (Cards/Containers):** Pure White (#FFFFFF) with a very soft, high-diffusion shadow: `0 4px 20px -2px rgba(45, 54, 39, 0.05)`.
- **Surface 2 (Popovers/Modals):** Pure White with a more pronounced shadow: `0 12px 40px -4px rgba(45, 54, 39, 0.1)`.

Avoid harsh black shadows; instead, use a hint of the Tertiary Forest green in the shadow color to maintain a natural, warm feel.

In **Dark Mode**, depth should rely more on tonal separation than brighter borders alone: elevated cards, drawers, dialogs, and overlays should feel layered through darker surface steps, controlled translucency, and softer black-based shadows rather than glowing outlines.

## Shapes

The shape language is purposefully **Rounded** to counter the "cold" nature of financial data. 

- **Standard Elements:** Buttons, inputs, and small cards use a 0.5rem (8px) radius.
- **Large Containers:** Dashboard widgets and main content areas use a 1rem (16px) radius.
- **Interactive States:** On hover, clickable cards may subtly increase in perceived depth rather than changing shape. 
- **Icons:** Use a 2px stroke weight with rounded caps and joins to match the typography.

## Components

### Buttons
Primary buttons use the Sage Green background with white text. They feature a subtle inner-glow on hover. Ghost buttons use a 1px border of the Neutral Gray with Forest Green text.

### Input Fields
Inputs should have a Secondary Cream background when inactive and a White background with a 2px Sage Green border when focused. Labels are always positioned above the input in the `label-md` Geist font.

### Cards
Cards are the primary vessel for data. They should have no border, a White background, and a 1rem corner radius. Padding inside cards should be a minimum of 24px.

### Data Visualization
Charts should use a simplified color palette: Sage Green for primary data, Forest Green for secondary comparisons, and a muted Cream-Gray for grid lines. Lines should be smoothed (interpolation) rather than jagged.

All chart strokes, fills, grid lines, labels, and highlights must be theme-aware. A chart that reads clearly in Light Mode must remain equally legible in Dark Mode without relying on opacity values that disappear against dark surfaces.

### Chips & Tags
Used for transaction categories. They should have a low-opacity background of the color they represent (e.g., 10% opacity Sage) with a high-opacity text of the same hue.
