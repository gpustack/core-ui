import { Skeleton } from 'antd';
import React from 'react';
import styled from 'styled-components';
import ResizeContainer from '../resize-container';

const SkeletonWrapper = styled.div`
  .ant-skeleton-paragraph {
    margin-bottom: 0;
  }
`;

interface CatalogSkeltonProps {
  skeletonProps?: any;
  skeletonStyle?: React.CSSProperties;
}

const CardSkelton: React.FC<CatalogSkeltonProps> = (props) => {
  return (
    <ResizeContainer
      dataList={Array(6).fill({ label: 'skeleton' })}
      renderItem={() => (
        <SkeletonWrapper>
          <Skeleton
            avatar={{
              size: 32
            }}
            paragraph={{ rows: 2 }}
            style={{
              // Mirrors `TemplateCard`'s own wrapper, which is what this
              // skeleton stands in for: same border, same 16px inset, and
              // the same `borderRadiusLG`. It used to read
              // `var(--border-radius-base)` — 4px against the card's 6px, so
              // the corners nudged when the real cards arrived. That custom
              // var is also defined only in the host app's global.less, not
              // in core-ui, so it is not a safe default here.
              border: '1px solid var(--ant-color-border)',
              borderRadius: 'var(--ant-border-radius-lg)',
              padding: '16px 16px',
              ...props.skeletonStyle
            }}
            {...(props.skeletonProps || {})}
          ></Skeleton>
        </SkeletonWrapper>
      )}
    ></ResizeContainer>
  );
};

export default CardSkelton;
