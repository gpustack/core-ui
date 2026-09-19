import { theme } from 'antd';
import { isFunction } from 'lodash';
import { useMemo } from 'react';
import { useCoreUIContext } from '../../../lib/hooks';
import { escapeHtml, formatLargeNumber } from '../../../lib/utils';

export const grid = {
  left: 0,
  right: 0,
  bottom: 20,
  containLabel: true
};

export default function useChartConfig() {
  const { config } = useCoreUIContext();
  const { isDarkTheme, theme: uiTheme } = config;
  const { useToken } = theme;
  const { token } = useToken();

  const chartColorMap = useMemo(() => {
    return {
      titleColor: token.colorText,
      splitLineColor: token.colorBorder,
      tickLineColor: token.colorSplit,
      axislabelColor: token.colorTextTertiary,
      colorSecondary: token.colorTextSecondary,
      colorTertiary: token.colorTextTertiary,
      gaugeBgColor: token.colorFillSecondary,
      // Utilization thresholds: green under 50%, amber to 80%, red past it.
      // These used to be three hardcoded `rgba(...)` literals baked into the
      // gauge's track — a third private copy of the product's semantic colors,
      // alongside `StatusColorMap` and the backends palette. Reading them off
      // the antd token means one rebrand reaches all of them. (ECharts can't
      // resolve CSS variables, so the token's resolved JS value is passed.)
      gaugeNormalColor: token.colorSuccess,
      gaugeWarningColor: token.colorWarning,
      gaugeCriticalColor: token.colorError,
      // The gauge's tick marks are notched OUT of the zone track rather than
      // drawn beside it — they are the surface showing through, which is why
      // they are white-ish rather than a border colour. Dark mode cannot use
      // the same trick at full strength (the track is dark, so an opaque white
      // notch would be louder than the track it interrupts), hence the alphas.
      gaugeSplitLineColor: isDarkTheme
        ? 'rgba(255,255,255,.3)'
        : 'rgba(255, 255, 255, 1)',
      gaugeSplitLineColor2: isDarkTheme
        ? 'rgba(255,255,255,.5)'
        : 'rgba(255, 255, 255, 1)',
      colorBgContainerHover: isDarkTheme ? '#424242' : '#fff'
    };
  }, [uiTheme, isDarkTheme]);

  const tooltip = {
    trigger: 'axis',
    backgroundColor: chartColorMap.colorBgContainerHover,
    borderColor: 'transparent',
    // Returns raw HTML that ECharts renders via innerHTML, so every
    // interpolated value goes through escapeHtml.
    formatter(params: any, callback?: (val: any) => any) {
      let result = `<span class="tooltip-x-name">${escapeHtml(params[0].axisValue)}</span>`;
      let visibleItemCount = 0;

      params.forEach((item: any) => {
        const value = isFunction(callback)
          ? callback?.(item.data.value)
          : item.data?.value;

        if (value === null || value === undefined) {
          return;
        }

        visibleItemCount += 1;
        const borderRadius = item.seriesType === 'bar' ? '2px' : '8px';

        result += `<span class="tooltip-item">
          <span class="tooltip-item-name">
            <span class="tooltip-item-dot" style="border-radius:${borderRadius};background-color:${escapeHtml(item.color)};"></span>
            <span class="tooltip-item-title">${escapeHtml(item.seriesName)}</span>:
          </span>
            <span class="tooltip-value">${escapeHtml(value)}</span>
      </span>`;
      });

      const wrapperClassName =
        visibleItemCount >= 12
          ? 'tooltip-wrapper tooltip-grid'
          : 'tooltip-wrapper';

      return `<div class="${wrapperClassName}">${result}</div>`;
    }
  };

  const legend = {
    itemWidth: 8,
    itemHeight: 8,
    itemGap: 12,
    textStyle: {
      color: chartColorMap.axislabelColor
    }
  };

  const xAxis = {
    type: 'category',
    axisTick: {
      show: true,
      lineStyle: {
        color: chartColorMap.tickLineColor
      }
    },
    axisLabel: {
      color: chartColorMap.axislabelColor,
      fontSize: 12
    },
    axisLine: {
      show: false
    }
  };

  const yAxis = {
    nameTextStyle: {
      padding: [0, 0, 0, -20]
    },
    splitLine: {
      show: true,
      lineStyle: {
        type: 'dashed',
        color: chartColorMap.splitLineColor
      }
    },
    axisLabel: {
      color: chartColorMap.axislabelColor,
      fontSize: 12,
      formatter: formatLargeNumber
    },
    axisTick: {
      show: false
    },
    type: 'value'
  };

  // Left-aligned and one step up from the axis labels. It used to be 12px and
  // centred, which made the chart's own title SMALLER than the numbers on its
  // y-axis and floated it away from the plot's left edge — the title now starts
  // on the same vertical line the axis labels do.
  const title = {
    show: true,
    left: 0,
    textStyle: {
      fontSize: 14,
      fontWeight: 500,
      color: chartColorMap.titleColor
    },
    text: ''
  };

  const barItemConfig = {
    type: 'bar',
    barMaxWidth: 20,
    barMinWidth: 8,
    barGap: '30%',
    barCategoryGap: '50%'
  };

  const lineItemConfig = {
    type: 'line',
    smooth: true,
    showSymbol: false,
    itemStyle: {},
    lineStyle: {
      width: 1.5,
      opacity: 0.7
    }
  };

  /**
   * A utilization gauge: needle, tick marks and a tri-colour zone track.
   *
   *  - the TRACK is split green / amber / red at the same 50 and 80 the
   *    thresholds use, so the remaining headroom is readable at rest.
   *  - `gauge.tsx` then overwrites `axisLine` with a two-stop
   *    `[[value, colour], [1, grey]]` and blanks the `progress` series, so what
   *    actually ships is a value arc over a neutral remainder.
   *  - the NEEDLE and the five ticks / labels give the dial its instrument
   *    reading; the readout sits below the centre to clear them.
   *
   * A single-ring variant (no needle, neutral track, notches at 50 / 80) was
   * tried and reverted by product decision. Do not re-derive it from the
   * arguments in this file's history without asking.
   */
  const GAUGE_RING_WIDTH = 12;
  // 50 and 80 themselves stay in the LOWER band (`<= 50` green, `<= 80` amber),
  // so a worker sitting on a round 80% does not change colour.
  const gaugeThresholds: [number, number] = [50, 80];

  const gaugeThresholdColor = (value: number) => {
    const [warning, critical] = gaugeThresholds;
    if (value > critical) return chartColorMap.gaugeCriticalColor;
    if (value > warning) return chartColorMap.gaugeWarningColor;
    return chartColorMap.gaugeNormalColor;
  };

  const gaugeItemConfig = {
    type: 'gauge',
    radius: '88%',
    center: ['50%', '65%'],
    startAngle: 190,
    endAngle: -10,
    min: 0,
    max: 100,
    splitNumber: 5,
    // Drawn, then hidden: `gauge.tsx` sets a series-level transparent
    // `itemStyle`, so the value arc comes from `axisLine` instead. Kept
    // declared because echarts still needs the geometry to lay the dial out.
    progress: {
      show: true,
      roundCap: false,
      width: GAUGE_RING_WIDTH
    },
    pointer: {
      length: '80%',
      width: 4,
      itemStyle: {
        // 'auto' takes the colour of the `axisLine` band the value lands in,
        // which `gauge.tsx` has already rewritten to the threshold colour.
        color: 'auto'
      }
    },
    axisLine: {
      roundCap: false,
      lineStyle: {
        width: GAUGE_RING_WIDTH,
        // The zone track. `gauge.tsx` replaces this wholesale with the value
        // arc, so these three stops only show through where that override is
        // not applied. Sourced from the tokens rather than the three hardcoded
        // `rgba(...)` literals this used to carry, which were a private copy of
        // the product's green/amber/red.
        color: [
          [0.5, chartColorMap.gaugeNormalColor],
          [0.8, chartColorMap.gaugeWarningColor],
          [1, chartColorMap.gaugeCriticalColor]
        ]
      }
    },
    axisTick: {
      distance: -11,
      length: 6,
      splitNumber: 5,
      lineStyle: {
        width: 1.5,
        color: chartColorMap.gaugeSplitLineColor
      }
    },
    splitLine: {
      distance: -5,
      length: 5,
      lineStyle: {
        width: 1.5,
        color: chartColorMap.gaugeSplitLineColor2
      }
    },
    axisLabel: {
      distance: 14,
      color: chartColorMap.axislabelColor,
      fontSize: 12
    },
    detail: {
      lineHeight: 40,
      height: 40,
      // Below the centre, because the needle owns the middle of the dial.
      offsetCenter: [5, 30],
      valueAnimation: false,
      fontSize: 20,
      color: chartColorMap.titleColor,
      formatter(value: any) {
        return '{value|' + value + '}{unit|%}';
      },
      rich: {
        value: {
          fontSize: 16,
          fontWeight: 500,
          color: chartColorMap.titleColor
        },
        unit: {
          fontSize: 14,
          color: chartColorMap.titleColor,
          fontWeight: 500,
          padding: [0, 0, 0, 2]
        }
      }
    }
  };

  return {
    token,
    tooltip,
    grid,
    legend,
    xAxis,
    yAxis,
    title,
    chartColorMap,
    barItemConfig,
    lineItemConfig,
    gaugeItemConfig,
    gaugeThresholdColor,
    isDark: isDarkTheme
  };
}
