import {
  PageContainer,
  RouteContext,
  type PageContainerProps,
  type RouteContextType
} from '@ant-design/pro-components';
import { Divider } from 'antd';
import classNames from 'classnames';
import { useContext, useEffect, useRef } from 'react';
import useOverlayScroller from '../../hooks/use-overlay-scroller';
import pageBoxCss from './page-box.module.less';

export const PageContainerInner: React.FC<
  PageContainerProps & {
    paddingInlinePageContainerContent?: number;
    extraContentRender?: () => React.ReactNode;
    leftContent?: React.ReactNode;
    rightContent?: React.ReactNode;
    styles?: {
      containerWrapper?: React.CSSProperties;
    };
  }
> = ({
  children,
  styles,
  title,
  leftContent,
  rightContent,
  paddingInlinePageContainerContent = 24,
  extraContentRender,
  ...rest
}) => {
  const { initialize: initialize } = useOverlayScroller({
    defer: false
  });
  const pageContext = useContext(RouteContext) as RouteContextType;
  const contentWrapperRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (contentWrapperRef.current) {
      const ins = initialize(contentWrapperRef.current);
      window.__GPUSTACK_BODY_SCROLLER__ = ins;
    }
  }, [initialize, contentWrapperRef]);

  return (
    <div className={pageBoxCss.containerWrapper}>
      <PageContainer
        {...rest}
        fixedHeader={false}
        title={false}
        pageHeaderRender={false}
        style={{
          flex: 1
        }}
        token={{
          paddingInlinePageContainerContent: paddingInlinePageContainerContent
        }}
      >
        <div className={pageBoxCss.title}>
          <div className={pageBoxCss.left}>
            {leftContent || pageContext.title}
          </div>
          <div className={pageBoxCss.right}>
            {rightContent && (
              <div>
                {rightContent}
                <Divider orientation="vertical" style={{ margin: '0 16px' }} />
              </div>
            )}
            {extraContentRender && extraContentRender()}
          </div>
        </div>
        <div
          className={classNames(pageBoxCss.contentWrapper)}
          style={styles?.containerWrapper}
          ref={contentWrapperRef}
        >
          {children}
        </div>
      </PageContainer>
    </div>
  );
};

export const PageBox: React.FC<{
  children: React.ReactNode;
  style?: React.CSSProperties;
}> = ({ children, style }) => {
  return <div style={style}>{children}</div>;
};

export default PageContainerInner;
