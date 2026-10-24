---
name: Obsidian Telemetry
colors:
  surface: '#10131a'
  surface-dim: '#10131a'
  surface-bright: '#363941'
  surface-container-lowest: '#0b0e15'
  surface-container-low: '#191b23'
  surface-container: '#1d1f27'
  surface-container-high: '#272a32'
  surface-container-highest: '#32353d'
  on-surface: '#e1e2ec'
  on-surface-variant: '#b9cacb'
  inverse-surface: '#e1e2ec'
  inverse-on-surface: '#2d3038'
  outline: '#849495'
  outline-variant: '#3a494b'
  surface-tint: '#00dce6'
  primary: '#e0fdff'
  on-primary: '#00373a'
  primary-container: '#00f2fe'
  on-primary-container: '#006a70'
  inverse-primary: '#00696f'
  secondary: '#4edea3'
  on-secondary: '#003824'
  secondary-container: '#00a572'
  on-secondary-container: '#00311f'
  tertiary: '#fff5ee'
  on-tertiary: '#472a00'
  tertiary-container: '#ffd3a1'
  on-tertiary-container: '#875400'
  error: '#ffb4ab'
  on-error: '#690005'
  error-container: '#93000a'
  on-error-container: '#ffdad6'
  primary-fixed: '#6ff6ff'
  primary-fixed-dim: '#00dce6'
  on-primary-fixed: '#002022'
  on-primary-fixed-variant: '#004f53'
  secondary-fixed: '#6ffbbe'
  secondary-fixed-dim: '#4edea3'
  on-secondary-fixed: '#002113'
  on-secondary-fixed-variant: '#005236'
  tertiary-fixed: '#ffddb8'
  tertiary-fixed-dim: '#ffb95f'
  on-tertiary-fixed: '#2a1700'
  on-tertiary-fixed-variant: '#653e00'
  background: '#10131a'
  on-background: '#e1e2ec'
  surface-variant: '#32353d'
typography:
  display-lg:
    fontFamily: Space Grotesk
    fontSize: 48px
    fontWeight: '700'
    lineHeight: 56px
    letterSpacing: -0.03em
  display-lg-mobile:
    fontFamily: Space Grotesk
    fontSize: 32px
    fontWeight: '700'
    lineHeight: 40px
    letterSpacing: -0.02em
  headline-lg:
    fontFamily: Space Grotesk
    fontSize: 30px
    fontWeight: '600'
    lineHeight: 38px
    letterSpacing: -0.02em
  headline-md:
    fontFamily: Space Grotesk
    fontSize: 22px
    fontWeight: '600'
    lineHeight: 28px
    letterSpacing: -0.01em
  headline-sm:
    fontFamily: Space Grotesk
    fontSize: 18px
    fontWeight: '600'
    lineHeight: 24px
  body-lg:
    fontFamily: Inter
    fontSize: 16px
    fontWeight: '400'
    lineHeight: 24px
  body-md:
    fontFamily: Inter
    fontSize: 14px
    fontWeight: '400'
    lineHeight: 20px
  body-sm:
    fontFamily: Inter
    fontSize: 12px
    fontWeight: '400'
    lineHeight: 18px
  telemetry-xl:
    fontFamily: JetBrains Mono
    fontSize: 36px
    fontWeight: '700'
    lineHeight: 40px
    letterSpacing: -0.02em
  telemetry-md:
    fontFamily: JetBrains Mono
    fontSize: 18px
    fontWeight: '600'
    lineHeight: 24px
  telemetry-sm:
    fontFamily: JetBrains Mono
    fontSize: 13px
    fontWeight: '500'
    lineHeight: 16px
  label-caps:
    fontFamily: JetBrains Mono
    fontSize: 11px
    fontWeight: '600'
    lineHeight: 14px
    letterSpacing: 0.12em
rounded:
  sm: 0.125rem
  DEFAULT: 0.25rem
  md: 0.375rem
  lg: 0.5rem
  xl: 0.75rem
  full: 9999px
spacing:
  gutter: 1rem
  gutter-desktop: 1.5rem
  margin: 1rem
  margin-desktop: 2rem
  space-xs: 0.25rem
  space-sm: 0.5rem
  space-md: 1rem
  space-lg: 1.5rem
  space-xl: 2.5rem
---

## Brand & Style

This design system embodies an advanced electric vehicle telemetry and power simulation environment. It merges futuristic cockpit architecture with professional computational utility. Designed for automotive engineers, powertrain analysts, and EV performance specialists, the interface projects calculated authority, machine intelligence, and high-stakes clarity.

The visual style blends dark glassmorphism with high-contrast, technical HUD (Heads-Up Display) conventions:
- **Cockpit Glassmorphism:** Layered, semi-transparent obsidian surfaces float over an ambient void, framed by razor-thin luminescence rather than physical bevels.
- **HUD Precision:** Micro-grids, telemetry ticks, and segmented numeric indicators mimic collimated optical glass displays found in modern aerospace and conceptual hypercars.
- **Instrument Tactility:** Interactivity feels mechanical and weighted; states snap deliberately, avoiding bouncy or casual micro-interactions.

## Colors

The palette operates on high-contrast emissive principles against an abyss of layered obsidian shades. Color delivers operational status instantly:

- **Base Surfaces:**
  - `Void Base`: `#0a0d14` (Deep canvas root)
  - `Cockpit Surface Tier 1`: `#0f172a` (Translucent background for main instrument clusters)
  - `Cockpit Surface Tier 2`: `#131b2e` (Elevated card panels, dial wells, and telemetry bays)
- **Emissive Functional States:**
  - `Cyan Nominal` (`#00f2fe`): Primary telemetry readouts, optimal battery state of charge (SoC), operational current flow, and interactive focus.
  - `Emerald Regeneration` (`#10b981`): Dynamic braking recovery, energy harvest, thermal stabilization, and peak efficiency ranges.
  - `Amber Caution` (`#f59e0b` / `#fbbf24`): Thermal throttling, cell imbalance alerts, current spikes, and degraded range envelopes.
  - `Crimson Critical` (`#ef4444` / `#f43f5e`): Inverter faults, thermal runaway thresholds, cell breach warnings, and emergency disconnections.
- **HUD Neutrals & Grids:**
  - Micro-borders: `rgba(0, 242, 254, 0.15)`
  - Subdued telemetry readouts: `#64748b`
  - Crisp readouts & values: `#f8fafc`

## Typography

Typography delivers a clear division between structural interface comprehension and real-time computation:

- **Primary Headings (`Space Grotesk`):** Industrial, geometric, and forward-leaning. Used for cluster sections, module titles, and state transitions.
- **System Body (`Inter`):** Neutral and distortion-free. Handles analytical logs, diagnostics documentation, and explanatory tooltips.
- **Numeric & Telemetry Layer (`JetBrains Mono`):** Dedicated monospaced layout ensures rapid column scanning for voltages (V), kilowatt-hours (kWh), temperatures (°C), and discharge cycles without tabular jitter.
- **Labels & Micro-data:** Always set in `label-caps` (`JetBrains Mono`, uppercase, wide tracking) to emulate laser-etched avionics switchboards.

## Layout & Spacing

The simulator is built on an adaptive dense dashboard grid designed for multi-monitor setups and ultrawide telemetry screens, scaling down to tactical vehicle tablets:

- **Grid Structure:** 12-column dynamic grid on desktop, collapsing to 6 columns on tablet and a single vertical stack on mobile. Gutters stay compact (`1rem` to `1.5rem`) to maximize visual instrument density.
- **Cockpit Partitioning:** Panels span 3, 4, 6, or 12 columns. Critical real-time elements (such as State of Charge curves or live cell thermal maps) anchor central zones, while secondary parameter inputs dock into side control rails.
- **Rhythm & Padding:** Component internal padding uses strict multiples of `0.25rem`. Dense modules (e.g., cell matrix matrices) use `space-xs` and `space-sm`, while instrument cards use `space-md` or `space-lg` to separate display groups.

## Elevation & Depth

Visual hierarchy uses physical glass layering over ambient darkness, complemented by soft photonic glows rather than traditional drop shadows:

- **Surface Tiers:**
  - Base viewport: `#0a0d14` background.
  - Tier 1 Glass: `#0f172a` at 70% opacity with `16px` backdrop-filter blur.
  - Tier 2 Focused HUD Modules: `#131b2e` at 85% opacity with `24px` backdrop-filter blur.
- **Luminescent Contours:** Panels are defined by subtle inset borders (`1px solid rgba(0, 242, 254, 0.12)`). Elevated or selected states scale this to `rgba(0, 242, 254, 0.40)`.
- **Glow & Photon Cast:** Critical alerts and active telemetry cards cast soft, colored ambient halos (`box-shadow: 0 0 24px -4px rgba(0, 242, 254, 0.15)` for normal state, shifting to `rgba(239, 68, 68, 0.25)` under critical faults).

## Shapes

The interface embraces a low-radius, architectural profile (`roundedness: 1`). Soft bevels (`0.25rem` standard, `0.5rem` for primary chassis modules) communicate rigid hardware construction while preventing visually harsh corner clashes.

- **Chamfer Accents:** Select cockpit frames feature cut-corner HUD motifs (e.g., 45-degree corner clips) on telemetry readouts to reinforce military and experimental EV testing aesthetics.
- **Segmented Modules:** Progress bars, battery indicators, and power scales are constructed from discrete geometric segments separated by `2px` gaps rather than uninterrupted fluid bars.

## Components

### Buttons & Trigger Controls
- **Primary Action (Cyan HUD):** Translucent cyan core (`rgba(0, 242, 254, 0.1)`) with a crisp `1px` border of `#00f2fe`. Text in `JetBrains Mono` uppercase bold with a subtle cyan glow on hover (`0 0 12px rgba(0, 242, 254, 0.4)`).
- **Secondary / Abort Actions:** Dark obsidian fill with muted border (`rgba(255, 255, 255, 0.1)`). Critical buttons use `#ef4444` borders and crimson hover glares.
- **Tactile Simulator Toggles:** Rocker-style inputs with dual physical-state styling, featuring micro status LED pips that switch from dark gray to neon green or cyan when active.

### Segmented Gauges & Progress Indicators
- Battery charge, power output, and thermal meters use partitioned LED-bar styling.
- Segments illuminate progressively from left to right or radial outward. Color shifts dynamically along thresholds: `#00f2fe` (nominal 20-80%), `#10b981` (regeneration), `#f59e0b` (low capacity / warning), and `#ef4444` (depleted / critical thermal limit).

### Input Fields & Steppers
- Low-profile inputs set against `#0a0d14` inset wells.
- Monospaced typography with units fixed in a static, dimmed right-aligned label (e.g., `kW`, `mV`, `Nm`).
- Focus transitions trigger a sharp border shift from muted slate to `#00f2fe`.

### Status Chips & System Badges
- Compact capsules with `0.25rem` border radius, containing an illuminated pulse indicator (`6px` circular beacon).
- Backdrops use faint tinting matching state semantics (e.g., `rgba(16, 185, 129, 0.1)` for nominal health).

### Cockpit Cards & Telemetry Clusters
- Panels feature a top status header containing a monospaced module ID (e.g., `// BATTERY_PACK_A_THERMALS`) aligned opposite diagnostic status tags.
- Surface divides are marked with hairline cyan guides (`rgba(0, 242, 254, 0.1)`) rather than heavy spacers.