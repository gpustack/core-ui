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
      // The threshold notches are cut in the surface the gauge sits on, so they
      // read as a gap in the ring on both the neutral track and the value arc.
      // Every gauge in the product is inside a `CardWrapper`, whose background
      // is this same token.
      gaugeMarkColor: token.colorBgContainer,
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
   * A utilization gauge: ONE ring, no needle.
   *
   *  - the TRACK is neutral and spans the whole range, so the scale's two ends
   *    are visible without axis labels.
   *  - the value ARC covers it up to the value, in the colour of whichever
   *    threshold band the value falls in.
   *  - two hairline NOTCHES sit at 50 and 80, cut in the card's own background
   *    colour. They answer "how far to the next band" — the one question the
   *    arc alone cannot — and because they are a gap rather than a fill, they
   *    read the same whether the arc has reached them or not.
   *
   * Two heavier designs were tried and rejected. A tri-colour zone TRACK under
   * the arc puts two rings on screen segmented differently, and at ~190px the
   * eye cannot tell which one it is meant to read. The original NEEDLE (with
   * five ticks and five labels) states the value a third time, and its labels
   * eat enough of the diameter that the readout has to move off-centre, landing
   * it in the same row and nearly the same size as the `0` and `100` labels —
   * the chart's own headline number reduced to axis chrome.
   */
  // Stated once and read by the track, the value arc and the threshold notches,
  // so the arc can never end up a hairline narrower than the track it sits on.
  //
  // Squeezed from both sides: past ~12 the ring starts to dominate the card and
  // the threshold notches stretch into long slots rather than reading as marks;
  // below ~8 the colour loses too much area to register at a glance and the
  // notches get too short to see. It briefly sat at 8 for a reason that no
  // longer applies — while the ends were round, 8 was the only width whose cap
  // radius (`width / 2`) landed on `--border-radius-base`. The ends are square
  // now, so nothing ties the width to the radius scale any more.
  const GAUGE_RING_WIDTH = 10;
  // 50 and 80 themselves stay in the LOWER band (`<= 50` green, `<= 80` amber),
  // matching the `strokeColorFunc` this replaced, so a worker sitting on a round
  // 80% does not change colour from what it showed before.
  const gaugeThresholds: [number, number] = [50, 80];

  const gaugeThresholdColor = (value: number) => {
    const [warning, critical] = gaugeThresholds;
    if (value > critical) return chartColorMap.gaugeCriticalColor;
    if (value > warning) return chartColorMap.gaugeWarningColor;
    return chartColorMap.gaugeNormalColor;
  };

  // Half-width of a notch as a fraction of the range. At the sizes the gauge is
  // used (radius ~85px, 200° of sweep) the full 0.007 lands at roughly 2px of
  // arc — the same hairline gap used to separate adjacent fills elsewhere.
  const GAUGE_MARK_HALF_WIDTH = 0.0035;

  /**
   * A second, silent gauge series whose only job is to notch the ring at each
   * threshold. It has to be its own series: the notches below the current value
   * would be painted over by the value arc if they lived in the first series'
   * `axisLine`, which is why `z` lifts this one above it.
   *
   * Geometry is copied from the series it annotates rather than restated, so a
   * caller passing `gaugeConfig` to move or resize the gauge cannot leave the
   * notches orbiting the old centre.
   */
  const buildGaugeThresholdMarks = (base: any) => {
    const min = base.min ?? 0;
    const max = base.max ?? 100;
    const stops: [number, string][] = [];

    gaugeThresholds.forEach((threshold) => {
      const at = (threshold - min) / (max - min);
      stops.push([at - GAUGE_MARK_HALF_WIDTH, 'transparent']);
      stops.push([at + GAUGE_MARK_HALF_WIDTH, chartColorMap.gaugeMarkColor]);
    });
    stops.push([1, 'transparent']);

    return {
      type: 'gauge',
      radius: base.radius,
      center: base.center,
      startAngle: base.startAngle,
      endAngle: base.endAngle,
      min,
      max,
      z: (base.z ?? 2) + 1,
      silent: true,
      progress: { show: false },
      pointer: { show: false },
      axisTick: { show: false },
      splitLine: { show: false },
      axisLabel: { show: false },
      detail: { show: false },
      axisLine: {
        roundCap: false,
        lineStyle: {
          width: base.axisLine?.lineStyle?.width ?? GAUGE_RING_WIDTH,
          color: stops
        }
      },
      data: []
    };
  };

  const gaugeItemConfig = {
    type: 'gauge',
    radius: '92%',
    center: ['50%', '68%'],
    startAngle: 190,
    endAngle: -10,
    min: 0,
    max: 100,
    // Square ends, same width as `axisLine` so the arc sits exactly on the
    // track instead of leaving a hairline of it showing either side.
    //
    // `roundCap` is the only cap control echarts gives, and it is a BOOLEAN:
    // `true` swaps the Sector for a `Sausage`, whose half-circle end is always
    // `width / 2` — there is no in-between. A 4px half-circle on an 8px stroke
    // read as too bulbous, and the way to get a smaller radius is to stop using
    // the gauge's own renderer and draw the arc as a `custom` series `sector`
    // (its `cornerRadius` is free). That was rejected: it moves the geometry —
    // centre, radius, angles, and the readout's position — out of echarts and
    // into us, including honouring a caller's `gaugeConfig.radius`, for the sake
    // of 2px of corner.
    //
    // A side effect worth keeping: a zero-length square sector draws nothing, so
    // a 0% gauge is an empty track. With `roundCap` it left a lone dot.
    progress: {
      show: true,
      roundCap: false,
      width: GAUGE_RING_WIDTH,
      itemStyle: {
        color: (params: any) => gaugeThresholdColor(params?.value ?? 0)
      }
    },
    pointer: {
      show: false
    },
    // Just the unfilled remainder. The version before this expressed the value
    // arc HERE as a two-stop gradient and then had to blank the real `progress`
    // series with a transparent `itemStyle` — two mechanisms fighting over one
    // arc. Each does its own job now, and the thresholds are a third series.
    axisLine: {
      roundCap: false,
      lineStyle: {
        width: GAUGE_RING_WIDTH,
        color: [[1, chartColorMap.gaugeBgColor]]
      }
    },
    axisTick: {
      show: false
    },
    splitLine: {
      show: false
    },
    axisLabel: {
      show: false
    },
    detail: {
      lineHeight: 28,
      height: 28,
      offsetCenter: [0, 4],
      valueAnimation: false,
      color: chartColorMap.titleColor,
      formatter(value: any) {
        return '{value|' + value + '}{unit|%}';
      },
      // The readout is the gauge's whole point, so it gets the hero treatment:
      // the number dominant, the unit a smaller secondary glyph beside it.
      rich: {
        value: {
          fontSize: 22,
          fontWeight: 500,
          color: chartColorMap.titleColor
        },
        unit: {
          fontSize: 13,
          color: chartColorMap.colorTertiary,
          fontWeight: 400,
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
    buildGaugeThresholdMarks,
    isDark: isDarkTheme
  };
}
