import { Checkbox } from 'antd';
import AutoComplete from '../auto-complete';
import CInput from '../input';
import SealSelect from '../select';
import Slider from '../slider';
import Switch from '../switch';

const components: {
  InputNumber: typeof CInput.Number;
  Select: typeof SealSelect;
  Slider: React.ComponentType<typeof Slider>;
  TextArea: typeof CInput.TextArea;
  Input: typeof CInput.Input;
  Checkbox: typeof Checkbox;
  Switch: typeof Switch;
  AutoComplete: typeof AutoComplete;
} = {
  InputNumber: CInput.Number,
  Select: SealSelect,
  Slider: Slider as React.ComponentType<typeof Slider>,
  TextArea: CInput.TextArea,
  Input: CInput.Input,
  Checkbox: Checkbox,
  Switch: Switch,
  AutoComplete: AutoComplete
};

export default components;
