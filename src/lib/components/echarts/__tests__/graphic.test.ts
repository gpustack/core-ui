import { SVGRenderer } from 'echarts/renderers';
import { describe, expect, it } from 'vitest';
import echarts, { type ECOption } from '..';

echarts.use([SVGRenderer]);

describe('chart graphics', () => {
  it('renders a donut total with the shared component registrations', () => {
    const chart = echarts.init(null, undefined, {
      renderer: 'svg',
      ssr: true,
      width: 240,
      height: 240
    });
    const options: ECOption = {
      animation: false,
      graphic: {
        type: 'text',
        left: 'center',
        top: 'middle',
        style: { text: '12.5M tokens' }
      },
      series: [
        { type: 'pie', radius: ['60%', '80%'], data: [{ value: 12500000 }] }
      ]
    };
    try {
      chart.setOption(options);
      expect(chart.renderToSVGString()).toContain('12.5M tokens');
    } finally {
      chart.dispose();
    }
  });
});
