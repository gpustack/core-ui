import React from 'react';
import contentCss from './style.module.less';

const ContentWrapper: React.FC<{
  children: React.ReactNode;
  title: React.ReactNode;
  titleStyle?: React.CSSProperties;
  contentStyle?: React.CSSProperties;
}> = ({ children, title = false, titleStyle, contentStyle }) => {
  return (
    <div className={contentCss['content-wrapper']}>
      {title && (
        <div className={contentCss['title']} style={{ ...titleStyle }}>
          {title}
        </div>
      )}
      <div className={contentCss['content']} style={{ ...contentStyle }}>
        {children}
      </div>
    </div>
  );
};

export default ContentWrapper;
