import _ from 'lodash';
import React, { useMemo } from 'react';
import Chart from '../../../lib/components/echarts/chart';
import useChartConfig from '../../../lib/components/echarts/config';
import EmptyData from '../../../lib/components/empty-data';
import { type ChartProps } from './types';

const BarChart: React.FC<ChartProps> = (props) => {
  const {
    seriesData,
    xAxisData,
    height,
    width,
    labelFormatter,
    legendData,
    title,
    stack = 'total'
  } = props;
  const {
    barItemConfig,
    grid,
    legend,
    title: titleConfig,
    tooltip,
    xAxis,
    yAxis
  } = useChartConfig();

  const titleText =
    typeof title === 'string' ? title : ((title?.text as string) ?? '');

  const dataOptions = useMemo((): any => {
    const options = {
      title: {
        text: ''
      },
      grid,
      tooltip: {
        ...tooltip
      },
      xAxis: {
        ...xAxis,
        axisLabel: {
          ...xAxis.axisLabel,
          formatter: labelFormatter
        },
        data: []
      },
      yAxis,
      legend: {
        ...legend,
        data: []
      },

      series: []
    };
    const data = _.map(seriesData, (item: any) => {
      const { stack: itemStack, ...rest } = item;
      const resolvedStack = itemStack ?? stack;
      return {
        ...rest,
        ...barItemConfig,
        ...(resolvedStack === false ? {} : { stack: resolvedStack }),
        itemStyle: {
          color: item.color
        }
      };
    });
    return {
      ...options,
      animation: false,
      title: {
        ...titleConfig,
        text: titleText
      },
      yAxis: {
        ...options.yAxis
      },
      xAxis: {
        ...options.xAxis,
        data: xAxisData
      },
      series: data
    };
  }, [
    seriesData,
    xAxisData,
    title,
    labelFormatter,
    tooltip,
    grid,
    xAxis,
    yAxis,
    legend,
    barItemConfig,
    stack
  ]);

  return (
    <>
      {!seriesData.length ? (
        <EmptyData height={height} title={titleText}></EmptyData>
      ) : (
        <Chart
          height={height}
          options={dataOptions}
          width={width || '100%'}
        ></Chart>
      )}
    </>
  );
};

export default BarChart;
