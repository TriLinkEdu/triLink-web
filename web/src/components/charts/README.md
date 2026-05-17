# Charts

## Decision (Plan F)

The frontend ships **without a charts dependency** today. `recharts` was
removed in Plan C because it was installed but never imported.

When charts are needed:

1. Prefer **plain SVG components** for very simple visualizations (bar, line)
   built against the shadcn token set. This keeps the bundle small and
   matches the dashboard aesthetic.
2. For richer interactive analytics (admin dashboards), install **Recharts
   v3** and add a thin wrapper here that maps the shadcn color tokens
   (`var(--color-primary-600)` etc.) into the chart props. Do this in a
   single place so charts theme correctly when dark mode is enabled.

## Why not Chart.js / ApexCharts

- Both pull in canvas/SVG rendering + their own DOM layer; Recharts composes
  with React/SVG which fits our component model.
- We already use Radix + lucide; sticking with React-native primitives keeps
  the rendering pipeline coherent (CSS variables theming everywhere).
