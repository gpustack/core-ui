import { Popover } from 'antd';
import type { PopoverProps } from 'antd/lib/popover';
import classNames from 'classnames';
import styles from './index.module.less';

const CPopover: React.FC<PopoverProps> = (props) => {
  const { className, children, style, ...restProps } = props;

  return (
    <div className="popover-wrapper">
      <Popover
        {...restProps}
        style={{ ...style }}
        data-maxHeight="300px"
        classNames={{
          root: classNames(className, styles.seal_custom_popover)
        }}
      >
        {children}
      </Popover>
    </div>
  );
};

export default CPopover;
