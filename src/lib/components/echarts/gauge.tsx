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
          // The value arc lives HERE, not in `progress`: `axisLine` is
          // overwritten with two stops — the threshold colour up to the value,
          // neutral for the remainder — which is also what lets the needle's
          // `color: 'auto'` pick up the threshold colour, since 'auto' reads
          // the band the value lands in. The zone track declared in the config
          // is what this replaces.
          //
          // Divided by the merged `max` rather than a literal 100, so the stop
          // follows the scale it is drawn on instead of restating it. No clamp
          // here: echarts already pins each stop to [0, 1] (`GaugeView`
          // `Math.min(Math.max(colorList[i][0], 0), 1)`) and the pointer angle
          // to the axis extent (`linearMap(..., clamp = true)`), so an
          // out-of-range value renders as a full or empty arc with the needle
          // parked at the end — while the readout still shows the real number.
          axisLine: {
            ...combineGaugeConfig.axisLine,
            lineStyle: {
              ...combineGaugeConfig.axisLine.lineStyle,
              color: [
                [value / combineGaugeConfig.max, colorValue],
                [1, chartColorMap.gaugeBgColor]
              ]
            }
          },
          // Blanks the `progress` series, which would otherwise draw a second
          // arc on top of the one `axisLine` just painted. The needle keeps its
          // own colour because `pointer.itemStyle.color` is set explicitly.
          itemStyle: {
            color: 'transparent'
          },
          detail: {
            ...combineGaugeConfig.detail,
            rich: {
              ...combineGaugeConfig.detail.rich,
              value: {
                ...combineGaugeConfig.detail.rich.value,
                color: colorValue
              },
              unit: {
                ...combineGaugeConfig.detail.rich.unit,
                color: colorValue
              }
            },
            borderColor: colorValue,
            lineHeight: 20,
            height: 18,
            width: 50,
            formatter: labelFormatter || gaugeItemConfig.detail.formatter
          },
          data: [{ value }]
        }
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
