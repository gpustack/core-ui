import type { DatePickerProps } from 'antd';
import { DatePicker, Form } from 'antd';
import type { RangePickerProps } from 'antd/es/date-picker';
import React, {
  forwardRef,
  useEffect,
  useImperativeHandle,
  useRef,
  useState
} from 'react';
import { isNotEmptyValue } from '../../../lib/utils/index';
import { type SealFormItemProps } from './types';
import Wrapper from './wrapper';
import styles from './wrapper/date-picker.module.less';

type SealPickerProps = SealFormItemProps & {
  alwaysFocus?: boolean;
  ref?: any;
  style?: React.CSSProperties;
};

/**
 * Shared floating-label shell for antd's single DatePicker and RangePicker.
 * `Picker` is the antd component to render; everything else mirrors SealSelect:
 * a `Wrapper` draws the bordered box + floating label, and an `isFocus` state
 * machine keeps the label raised whenever the field is focused, open, or filled.
 */
const PickerField: React.FC<
  Record<string, any> & SealPickerProps & { Picker: React.ComponentType<any> }
> = forwardRef((props, ref) => {
  const {
    Picker,
    label,
    placeholder,
    required,
    description,
    labelExtra,
    isInFormItems = true,
    checkStatus,
    allowNull,
    alwaysFocus = false,
    style,
    ...rest
  } = props;

  const [isFocus, setIsFocus] = useState(false);
  const pickerRef = useRef<any>(null);
  // Latest value, kept in a ref so blur/close handlers don't read the stale
  // `props.value` from before the parent has re-rendered with a just-picked date.
  const valueRef = useRef(props.value);

  let status = '';
  // status can be driven by the enclosing Form.Item, like the other fields.
  const statusData = Form?.Item?.useStatus?.();
  status = props.status || (isInFormItems ? statusData?.status : '') || '';

  const hasValue = (value: any) =>
    isNotEmptyValue(value) || (allowNull && value === null);

  useEffect(() => {
    valueRef.current = props.value;
    if (hasValue(props.value) || (allowNull && props.value === undefined)) {
      setIsFocus(true);
    }
  }, [props.value, allowNull]);

  const handleClickWrapper = () => {
    if (!props.disabled && !isFocus) {
      pickerRef.current?.focus?.();
      setIsFocus(true);
    }
  };

  const handleChange = (value: any, dateString: any) => {
    valueRef.current = value;
    setIsFocus(hasValue(value) || alwaysFocus);
    props.onChange?.(value, dateString);
  };

  const handleOnFocus = (e: any) => {
    setIsFocus(true);
    props.onFocus?.(e);
  };

  const handleOnBlur = (e: any) => {
    if (!hasValue(valueRef.current)) {
      setIsFocus(false);
    }
    props.onBlur?.(e);
  };

  const handleOpenChange = (open: boolean) => {
    if (open) {
      setIsFocus(true);
    } else if (!hasValue(valueRef.current)) {
      setIsFocus(false);
    }
    props.onOpenChange?.(open);
  };

  useImperativeHandle(ref, () => ({
    focus: () => pickerRef.current?.focus?.(),
    blur: () => pickerRef.current?.blur?.()
  }));

  return (
    <div className={styles.pickerWrapper} style={style}>
      <Wrapper
        status={checkStatus || status}
        label={label}
        labelExtra={labelExtra}
        isFocus={alwaysFocus || isFocus}
        required={required}
        description={description}
        disabled={props.disabled}
        onClick={handleClickWrapper}
      >
        <Picker
          {...rest}
          ref={pickerRef}
          // label already lives in the floating Wrapper label
          placeholder={isFocus || !label ? placeholder : ''}
          onChange={handleChange}
          onFocus={handleOnFocus}
          onBlur={handleOnBlur}
          onOpenChange={handleOpenChange}
        />
      </Wrapper>
    </div>
  );
});

const SealDatePicker: React.FC<DatePickerProps & SealPickerProps> = forwardRef(
  (props, ref) => <PickerField {...props} Picker={DatePicker} ref={ref} />
);

const SealRangePicker: React.FC<RangePickerProps & SealPickerProps> =
  forwardRef((props, ref) => (
    <PickerField {...props} Picker={DatePicker.RangePicker} ref={ref} />
  ));

type SealDatePickerType = typeof SealDatePicker & {
  RangePicker: typeof SealRangePicker;
};

(SealDatePicker as SealDatePickerType).RangePicker = SealRangePicker;

export { SealRangePicker as RangePicker };
export default SealDatePicker as SealDatePickerType;
