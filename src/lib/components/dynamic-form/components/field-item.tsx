import ComponentsMap from '@/lib/components/form/config/components';
import { SealFormItemProps } from '@/lib/components/form/types';
import { Form } from 'antd';
import React from 'react';

interface FieldItemProps extends SealFormItemProps {
  widget: keyof typeof ComponentsMap;
  name: string;
}

const FieldItem: React.FC<FieldItemProps> = (props) => {
  const { name, widget, required = [], ...rest } = props;

  const Component = ComponentsMap[widget];

  return <Form.Item name={name}></Form.Item>;
};

export default FieldItem;
