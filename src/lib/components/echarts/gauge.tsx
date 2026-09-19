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
          axisLine: {
            ...combineGaugeConfig.axisLine,
            lineStyle: {
              ...combineGaugeConfig.axisLine.lineStyle,
              color: [
                [value / 100, colorValue],
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
