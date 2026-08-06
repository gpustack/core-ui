// Dedicated entry for echarts-based chart components.
//
// echarts (~860KB parsed) is heavy and only needed on chart-rendering routes.
// Keeping these components OUT of the main barrel (`src/index.ts`) ensures a
// bare `import { IconFont } from '@gpustack/core-ui'` on the critical path does
// not drag echarts into the synchronous entry bundle. Consumers that render
// charts import them from '@gpustack/core-ui/charts' inside their (lazy) route.
export { default as BarChart } from './lib/components/echarts/bar-chart';
export { default as Chart } from './lib/components/echarts/chart';
export { default as GaugeChart } from './lib/components/echarts/gauge';
export { default as HBarChart } from './lib/components/echarts/h-bar';
export { default as LineChart } from './lib/components/echarts/line-chart';
export { default as MixLineBarChart } from './lib/components/echarts/mix-line-bar';
export { default as ScatterChart } from './lib/components/echarts/scatter';

// The pieces a bespoke chart needs, for a shape the components above don't
// cover. Without these a caller has only one way to draw one: `import * as
// echarts from 'echarts'`, which pulls the whole ~860KB package in alongside
// this tree-shaken instance and silently skips the registrations below.
//
// Build the option, then hand it to <Chart> — it owns init / setOption /
// throttled ResizeObserver / dispose, and gets that lifecycle right.
export { default as echarts } from './lib/components/echarts';
export type { ECOption } from './lib/components/echarts';

// Theme tokens for chart internals. echarts can't read CSS variables, so axis,
// tooltip and series colors have to be passed as resolved values — take them
// from here rather than hardcoding hex, or the chart won't follow dark mode.
export { default as useChartConfig } from './lib/components/echarts/config';
export type {
  AreaChartItemProps,
  ChartProps
} from './lib/components/echarts/types';
