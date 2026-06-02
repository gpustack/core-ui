import React from 'react';
import { MultipleSelect } from '../lib/components';

function Playground() {
  const [value, setValue] = React.useState<string[]>([]);
  const handleChange = (newValue: string[]) => {
    setValue(newValue);
  };
  return (
    <div style={{ width: 300 }}>
      <MultipleSelect
        label="Number"
        mode="multiple"
        allowClear
        maxTagCount={'responsive'}
        suffixIcon={'ss'}
        options={[
          { label: 'One', value: '1' },
          { label: 'Two', value: '2' },
          { label: 'Three', value: '3' },
          { label: 'Four', value: '4' },
          { label: 'Five', value: '5' }
        ]}
        value={value}
        onChange={handleChange}
      ></MultipleSelect>
    </div>
  );
}

export default Playground;
