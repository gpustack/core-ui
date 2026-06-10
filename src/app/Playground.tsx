import React from 'react';
import YamlEditor from '../lib/components/yaml-editor';

function Playground() {
  const [value, setValue] = React.useState<string>('');
  const handleChange = (newValue: string | undefined) => {
    console.log('change value===', newValue);
    setValue(newValue || '');
  };

  const handleOnBlur = () => {
    console.log('onBlur value===');
  };

  const handleOnFocus = () => {
    console.log('onFocus value===');
  };

  return (
    <div style={{ width: 300, backgroundColor: '#383838', padding: 16 }}>
      <YamlEditor
        value={value}
        onChange={handleChange}
        onBlur={handleOnBlur}
        onFocus={handleOnFocus}
      ></YamlEditor>
    </div>
  );
}

export default Playground;
