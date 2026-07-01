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
