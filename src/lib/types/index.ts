export type StatusType =
  | 'error'
  | 'warning'
  | 'transitioning'
  | 'success'
  | 'inactive';

type SchemaType =
  | 'Input'
  | 'InputNumber'
  | 'TextArea'
  | 'Select'
  | 'Slider'
  | 'Textarea'
  | 'Checkbox'
  | 'Switch'
  | 'AutoComplete';

export interface ParamsSchema {
  type: SchemaType;
  name: string;
  label: {
    text: string;
    isLocalized?: boolean;
  };
  initAttrs?: (meta: any) => Record<string, any>;
  dependencies?: string[];
  style?: React.CSSProperties;
  options?: Global.BaseOption<string | number | null>[];
  value?: string | number | boolean | string[];
  min?: number;
  max?: number;
  step?: number;
  disabled?: boolean;
  disabledConfig?: {
    depends: string[];
    when: (values: Record<string, any>) => boolean;
  };
  defaultValue?: string | number | boolean;
  required?: boolean;
  rules: {
    required: boolean;
    message?: string;
    formatter?: (value: any) => any;
  }[];
  placeholder?: React.ReactNode;
  attrs?: Record<string, any>;
  formItemAttrs?: Record<string, any>;
  description?: {
    text: string;
    html?: boolean;
    isLocalized?: boolean;
    isLink?: boolean;
  };
}
