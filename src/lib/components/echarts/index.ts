import type {
  BarSeriesOption,
  GaugeSeriesOption,
  LineSeriesOption,
  PieSeriesOption,
  ScatterSeriesOption
} from 'echarts/charts';
import {
  BarChart,
  GaugeChart,
  LineChart,
  PieChart,
  ScatterChart
} from 'echarts/charts';
import type {
  GridComponentOption,
  TitleComponentOption,
  TooltipComponentOption
} from 'echarts/components';
import {
  GridComponent,
  LegendComponent,
  MarkAreaComponent,
  MarkLineComponent,
  TitleComponent,
  TooltipComponent
} from 'echarts/components';
import type { ComposeOption } from 'echarts/core';
import * as echarts from 'echarts/core';
import { LabelLayout, UniversalTransition } from 'echarts/features';
import { CanvasRenderer } from 'echarts/renderers';

type ECOption = ComposeOption<
  | BarSeriesOption
  | LineSeriesOption
  | TitleComponentOption
  | TooltipComponentOption
  | GridComponentOption
  | GaugeSeriesOption
  | ScatterSeriesOption
  | PieSeriesOption
>;

// register components and charts
//
// A missing registration fails SILENTLY — echarts drops the option and TS can't
// catch it, because markLine/markArea are declared on SeriesOption and so type
// as valid whether or not their component is installed. Anything a chart puts in
// its option has to be listed here.
//
// AxisPointerComponent is deliberately absent: GridComponent's install already
// pulls it in, so `tooltip.axisPointer` works without a separate entry.
//
// Dataset / Transform / DataZoom are absent because nothing uses them — every
// chart here passes `series.data` directly. Add them back with the chart that
// needs them; an unused registration is bundle weight on every chart route.
echarts.use([
  LegendComponent,
  TitleComponent,
  TooltipComponent,
  GridComponent,
  // Reference lines and shaded x-ranges (a target line, an overload region).
  MarkLineComponent,
  MarkAreaComponent,
  BarChart,
  LineChart,
  ScatterChart,
  PieChart,
  GaugeChart,
  LabelLayout,
  UniversalTransition,
  CanvasRenderer
]);

export type { ECOption };

export default echarts;
