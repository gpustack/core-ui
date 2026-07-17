import type { TimePickerProps } from 'antd';
import { TimePicker } from 'antd';
import type { RangePickerTimeProps } from 'antd/es/time-picker';
import React, { forwardRef } from 'react';
import { PickerField, type SealPickerProps } from './date-picker';

/**
 * Floating-label shell for antd's TimePicker / TimePicker.RangePicker.
 * antd's TimePicker is a DatePicker under the hood (same `.ant-picker` markup),
 * so it reuses `PickerField` and the shared date-picker styles verbatim — only
 * the underlying `Picker` differs.
 */
const SealTimePicker: React.FC<TimePickerProps & SealPickerProps> = forwardRef(
  (props, ref) => <PickerField {...props} Picker={TimePicker} ref={ref} />
);

const SealTimeRangePicker: React.FC<
  RangePickerTimeProps<any> & SealPickerProps
> = forwardRef((props, ref) => (
  <PickerField {...props} Picker={TimePicker.RangePicker} ref={ref} />
));

type SealTimePickerType = typeof SealTimePicker & {
  RangePicker: typeof SealTimeRangePicker;
};

(SealTimePicker as SealTimePickerType).RangePicker = SealTimeRangePicker;

export { SealTimeRangePicker as TimeRangePicker };
export default SealTimePicker as SealTimePickerType;
