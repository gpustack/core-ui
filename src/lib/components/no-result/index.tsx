import { Button, Empty, type EmptyProps, Typography } from 'antd';
import _ from 'lodash';
import React, { useMemo } from 'react';
import styled from 'styled-components';

const StyledEmpty = styled(Empty)`
  display: flex;
  flex-direction: column;
  justify-content: center;
  align-items: center;
  margin-block: 60px 32px;
  .ant-empty-image {
    margin-bottom: 0;
    height: auto;
    line-height: 1;
    font-size: 42px;
    .anticon {
      color: var(--ant-color-primary);
    }
  }
  .ant-empty-footer {
    display: flex;
  }
`;

const ImageWrapper = styled.div`
  margin-bottom: 16px;
  display: flex;
  justify-content: center;
  align-items: center;
`;

const SimpleImageWrapper = styled.div`
  margin-bottom: 8px;
  display: flex;
  justify-content: center;
  align-items: center;
`;

const Description = styled.div`
  display: flex;
  flex-direction: column;
  gap: 12px;
  justify-content: center;
  align-items: center;
`;

const NoResult: React.FC<
  EmptyProps & {
    title?: React.ReactNode;
    subTitle?: React.ReactNode;
    noFoundText?: React.ReactNode;
    filters?: Record<string, any>;
    loading?: boolean;
    loadend?: boolean;
    dataSource?: any[];
    buttonText?: React.ReactNode;
    onClick?: () => void;
    // Center the empty state within a box of this height. Number → px,
    // string → used as-is (e.g. '40vh', 'calc(100vh - 300px)'). Omit to
    // keep the default top-aligned layout.
    minHeight?: number | string;
  }
> = (props) => {
  const {
    filters,
    noFoundText,
    loadend,
    loading,
    dataSource,
    buttonText,
    onClick,
    minHeight
  } = props;

  const hasFilters = useMemo(() => {
    const filterValues = _.omit(filters, ['page', 'perPage']);

    return Object.values(filterValues || {}).some((value) => {
      if (Array.isArray(value)) {
        return value.length > 0;
      }

      return !!value;
    });
  }, [filters]);

  const renderChildren = () => {
    if (!buttonText || !onClick) return null;
    return (
      <Button color="primary" variant="filled" onClick={onClick}>
        {buttonText}
      </Button>
    );
  };

  if (loading || !loadend || dataSource?.length) {
    return <span></span>;
  }

  const emptyEl = (
    <StyledEmpty
      // Drop the fixed top margin when centered, so the content sits in
      // the true middle of the height box rather than 60px below it.
      style={minHeight != null ? { marginBlock: 0 } : undefined}
      image={
        hasFilters ? (
          <SimpleImageWrapper>
            {Empty.PRESENTED_IMAGE_SIMPLE}
          </SimpleImageWrapper>
        ) : (
          <ImageWrapper>{props.image}</ImageWrapper>
        )
      }
      description={
        <Description>
          {!hasFilters && (
            <Typography.Text style={{ fontSize: '16px', fontWeight: 500 }}>
              {props.title}
            </Typography.Text>
          )}
          <Typography.Text type="secondary">
            {hasFilters ? noFoundText : props.subTitle}
          </Typography.Text>
        </Description>
      }
    >
      {!hasFilters && renderChildren()}
    </StyledEmpty>
  );

  // Opt-in vertical centering: with a `minHeight` the empty content is
  // centered inside a box of that height, so it no longer clings to the
  // top of a tall, otherwise-blank list area. Off by default so modal /
  // embedded tables keep their compact empty state. React appends `px`
  // to a numeric minHeight; a string is used as-is ('40vh', 'calc(...)').
  //
  // Optical centering: a geometrically-centered block reads as too low, so
  // the bottom padding lifts the content ~1/12 of the box height above dead
  // center (justify-content: center shifts the block up by paddingBottom/2).
  return minHeight != null ? (
    <div
      style={{
        display: 'flex',
        flexDirection: 'column',
        justifyContent: 'center',
        alignItems: 'center',
        minHeight,
        paddingBottom:
          typeof minHeight === 'number'
            ? minHeight / 6
            : `calc(${minHeight} / 6)`
      }}
    >
      {emptyEl}
    </div>
  ) : (
    emptyEl
  );
};

export default NoResult;
