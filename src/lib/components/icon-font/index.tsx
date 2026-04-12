import useCoreUIContext from '@/lib/hooks/useCoreUIContext';
import { createFromIconfontCN } from '@ant-design/icons';
import React, { useRef } from 'react';
import './iconfont/iconfont.js';

type IconFontProps = {
  type: string;
  rotate?: number;
} & React.HTMLAttributes<HTMLElement>;

const IconFont: React.FC<IconFontProps> = (props) => {
  const { config } = useCoreUIContext();
  const { iconUrl } = config;
  const { type, rotate, ...restProps } = props;

  const IconFontCN = useRef(
    createFromIconfontCN({
      scriptUrl: iconUrl || ''
    })
  ).current;

  return <IconFontCN type={type} rotate={rotate || 0} {...restProps} />;
};

export default IconFont;
