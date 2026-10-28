import _, { throttle } from 'lodash';
import React, {
  forwardRef,
  useEffect,
  useImperativeHandle,
  useRef
} from 'react';
import echarts, { type ECOption } from '.';

const Chart: React.FC<{
  options: ECOption;
  chartHeight?: number;
  height: number | string;
  width: number | string;
  ref?: any;
}> = forwardRef(({ options, width, height, chartHeight }, ref) => {
  const container = useRef<HTMLDivElement>(null);
  const chart = useRef<echarts.EChartsType>();
  const resizeObserver = useRef<ResizeObserver>();
  const finished = useRef(false);

  // `chart` is exposed as a GETTER, not a snapshot. `useImperativeHandle` runs
  // in the layout-effect phase, but the instance is created in the passive
  // effect below — so on the first mount a plain `{ chart: chart.current }`
  // handed the parent `{ chart: undefined }`, and because it is a value it
  // stayed undefined until some later render happened to re-run this hook.
  //
  // A parent that reads the instance from its own mount effect therefore got
  // nothing and, if that effect was its only chance to run, silently skipped
  // its work. That is what blanked the usage donuts until the window was
  // resized: their geometry patch ran once, found no instance, and returned.
  useImperativeHandle(ref, () => ({
    get chart() {
      return chart.current;
    }
  }));

  const init = () => {
    if (container.current) {
      chart.current?.clear();
      chart.current = echarts.init(container.current);
    }
  };

  const resize = () => {
    const host = container.current;
    if (!host || !chart.current || !host.clientWidth || !host.clientHeight)
      return;
    // Resolve percentage dimensions before laying out axes and graphic overlays.
    chart.current.resize({
      width: host.clientWidth,
      height: host.clientHeight
    });
  };

  const setOption = (options: ECOption) => {
    if (!chart.current) return;
    chart.current.setOption(options, { notMerge: true, lazyUpdate: false });
    resize();
  };

  useEffect(() => {
    const handleOnFinished = () => {
      if (!chart.current || finished.current) return;

      const currentChart = chart.current;
      const optionsYAxis = currentChart.getOption()?.yAxis;

      if (
        !optionsYAxis ||
        !Array.isArray(optionsYAxis) ||
        optionsYAxis.length < 2
      )
        return;
      //  @ts-expect-error: getModel is missing in currentChart
      const model = currentChart.getModel();

      const yAxisModels = [
        model.getComponent('yAxis', 0),
        model.getComponent('yAxis', 1)
      ];

      if (!yAxisModels[0] || !yAxisModels[1]) return;

      const axes = yAxisModels.map((m) => m.axis);

      const intervals = axes.map((axis) => axis.scale.getInterval());
      const ticksList = axes.map((axis) => axis.scale.getTicks());
      const counts = ticksList.map((t) => t.length);

      const unifiedCount = Math.max(counts[0], counts[1]);

      const newMax0 = intervals[0] * (unifiedCount - 1);
      const newMax1 = intervals[1] * (unifiedCount - 1);

      // if newMax0 equal to maxValue0, and newMax1 equal to maxValue1, do not update yAxis
      if (counts[0] === counts[1]) return;

      const yAxis: any[] = [{}, {}];

      if (counts[0] < unifiedCount) {
        yAxis[0].max = _.round(newMax0, 2);
        yAxis[0].interval = intervals[0];
        yAxis[0].splitNumber = unifiedCount;
      }

      if (counts[1] < unifiedCount) {
        yAxis[1].max = _.round(newMax1, 2);
        yAxis[1].interval = intervals[1];
        yAxis[1].splitNumber = unifiedCount;
      }
      finished.current = true;

      currentChart.setOption({
        yAxis: yAxis
      });
    };

    if (container.current) {
      init();
      chart.current?.on('finished', handleOnFinished);
    }

    return () => {
      chart.current?.off('finished', handleOnFinished);
      chart.current?.dispose();
    };
  }, []);

  useEffect(() => {
    finished.current = false;
    setOption(options);
  }, [options]);

  useEffect(() => {
    const handleResize = throttle(resize, 100);

    if (container.current) {
      resizeObserver.current = new ResizeObserver(handleResize);
      resizeObserver.current.observe(container.current);
    }
    return () => {
      resizeObserver.current?.disconnect();
      resizeObserver.current = undefined;
      handleResize.cancel();
    };
  }, []);

  return (
    <div className="chart-wrapper" style={{ width: width, height }}>
      <div
        ref={container}
        style={{ width: width, height: chartHeight || height }}
      ></div>
    </div>
  );
});

export default Chart;
