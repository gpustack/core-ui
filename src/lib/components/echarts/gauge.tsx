import React from 'react';
import Chart from '../../../lib/components/echarts/chart';
import useChartConfig from '../../../lib/components/echarts/config';
import EmptyData from '../../../lib/components/empty-data';
import { type ChartProps } from './types';

const GaugeChart: React.FC<Omit<ChartProps, 'seriesData' | 'xAxisData'>> = (
  props
) => {
  const {
    gaugeItemConfig,
    gaugeThresholdColor,
    buildGaugeThresholdMarks,
    title: titleConfig,
    chartColorMap
  } = useChartConfig();
  const { value, height, width, labelFormatter, title, color, gaugeConfig } =
    props;
  const titleText = typeof title === 'string' ? title : title?.text;

  if (!value && value !== 0) {
    return <EmptyData height={height} title={titleText}></EmptyData>;
  }

  const setDataOptions = () => {
    // The thresholds live in `useChartConfig` now. This file used to carry its
    // own `strokeColorFunc` with the same green/amber/red as three hardcoded
    // `rgba(...)` literals — a fourth private copy of the product's semantic
    // colours, and one that disagreed with the others by 20% alpha.
    const colorValue = color || gaugeThresholdColor(value);
    const combineGaugeConfig = {
      ...gaugeItemConfig,
      ...gaugeConfig
    };

    return {
      title: {
        ...titleConfig,
        text: titleText,
        textStyle: {
          fontSize: 12,
          color: chartColorMap.colorSecondary,
          fontWeight: 400
        },
        top: 10,
        left: 'center',
        ...(typeof title === 'object' ? title : {})
      },
      series: [
        {
          ...combineGaugeConfig,
          z: 2,
          // The value arc is drawn by `progress`, which is what it is for. The
          // previous version painted it into `axisLine` as a two-stop gradient
          // stop and then had to blank the real series out with a transparent
          // `itemStyle` — two mechanisms fighting for one arc.
          progress: {
            ...combineGaugeConfig.progress,
            itemStyle: { color: colorValue }
          },
          detail: {
            ...combineGaugeConfig.detail,
            rich: {
              ...combineGaugeConfig.detail.rich,
              // The number carries the threshold signal now that the track is
              // neutral; the unit stays recessive.
              value: {
                ...combineGaugeConfig.detail.rich.value,
                color: colorValue
              }
            },
            formatter: labelFormatter || gaugeItemConfig.detail.formatter
          },
          data: [{ value }]
        },
        // The 50 / 80 notches only mean something while the arc is threshold-
        // coloured. A caller that forces `color` is saying this gauge is not
        // about the utilization bands, so the marks would be annotating a
        // boundary that no longer exists.
        ...(color ? [] : [buildGaugeThresholdMarks(combineGaugeConfig)])
      ]
    };
  };

  const dataOptions: any = setDataOptions();

  return (
    <Chart
      height={height}
      options={dataOptions}
      width={width || '100%'}
    ></Chart>
  );
};

export default GaugeChart;
