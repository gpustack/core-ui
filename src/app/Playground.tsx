import React from 'react';
import { HighlightCode } from '../lib/components';

function Playground() {
  const [value, setValue] = React.useState<string[]>([]);
  const handleChange = (newValue: string[]) => {
    setValue(newValue);
  };
  return (
    <div style={{ width: 300, backgroundColor: '#383838', padding: 16 }}>
      <HighlightCode
        code={'sdfasdfasdfasdfasdfasdfasdfasdfasdfasdfasdfasdfsadfasdf'}
        lang="text"
        theme="dark"
        copyable
      />
    </div>
  );
}

export default Playground;
