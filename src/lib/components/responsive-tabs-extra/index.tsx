import React from 'react';
import useWindowResize from '../../hooks/use-window-resize';
import './index.less';

export type ResponsiveTabsExtraProps = {
  left?: React.ReactNode;
  right?: React.ReactNode;
  children: React.ReactElement;
};

const ResponsiveTabsExtra: React.FC<ResponsiveTabsExtraProps> = ({
  left,
  right,
  children
}) => {
  const { isMobile } = useWindowResize();
  const hasExtra = Boolean(left || right);

  if (isMobile && hasExtra) {
    return (
      <div className="responsive-tabs-extra">
        {React.cloneElement(children, { tabBarExtraContent: undefined })}
        <div className="responsive-tabs-extra__actions">
          {left}
          {right}
        </div>
      </div>
    );
  }

  if (!hasExtra) {
    return children;
  }

  return React.cloneElement(children, {
    tabBarExtraContent: { left, right }
  });
};

export default ResponsiveTabsExtra;
