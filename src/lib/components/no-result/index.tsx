import { PlusOutlined } from '@ant-design/icons';
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
      /* Neutral, not the brand primary. This glyph is decoration — it names
         the empty noun and cannot be clicked — but at 42px it carried 293px2
         of fully-saturated primary against the 195px2 in the CTA text below
         it, so the inert thing outweighed the one action by 1.5x. 11 of the
         34 call sites that pass an image have no CTA at all, which left a
         42px brand-coloured glyph as the only saturated thing on the page
         with nothing to click.

         The hue also already means something on a bare glyph here: it is the
         table header's sorter-active state. (SectionHeader's icon is primary
         too, but contained in a colorPrimaryBg chip, which reads as a badge
         rather than a state.)

         colorIcon is antd's token for a non-interactive icon and resolves to
         the same value as colorTextTertiary: 3.35:1 light, 4.40:1 dark, both
         clear of WCAG 1.4.11's 3:1 for graphics. Not colorTextQuaternary —
         1.83 / 2.27 fails that bar and the glyph disappears. */
      color: var(--ant-color-icon);
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
    // Leading icon on the CTA. Defaults to a plus, which fits 23 of the 24
    // call sites ("Add Now", "Add Cache Service", "Create Your First
    // Cluster", "Add Worker"…). Pass something else — or `null` for none —
    // where the CTA is not a create; billing/index's "Go to Global Settings"
    // is the one such case today, and it still takes the default.
    //
    // Checked against `undefined` rather than `??` precisely so `null` can
    // mean none; FilterBar's `buttonIcon ?? <PlusOutlined />` cannot express
    // that.
    buttonIcon?: React.ReactNode;
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
    buttonIcon,
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
    // Default (neutral), not primary, and not the `variant="filled"` this
    // used to be.
    //
    // Not primary because this CTA is almost never the view's only way to
    // act: of the 24 call sites that pass one, 23 fire the SAME handler as a
    // primary button already on screen — FilterBar's `handleClickPrimary`, or
    // one the page hand-rolls into `right={...}` (kv-cache, gpu-service
    // instances, budget-tab, periodic-allowance-tab, license all do the
    // latter). Making this solid too put two identical brand-blue blocks in
    // one otherwise-empty view. The toolbar button is the one that has to
    // stay primary — it is still there once rows exist. The lone exception is
    // billing/index, whose CTA navigates to /settings; if that page wants
    // emphasis it belongs at the call site, not here.
    //
    // Not `variant="filled"` because its label measured 3.60:1 in light and
    // 2.55:1 in dark against its own fill — 14px body text under AA's 4.5,
    // and dark under even the 3:1 graphics bar. Its fill was 1.11:1 against
    // the page, so it carried no mass either and lost the block to the
    // decorative icon above it. Default has a real border, so it survives a
    // blur as a shape, and its label is 16.5:1 / 10.4:1.
    //
    // `color="primary" variant="outlined"` was the other candidate and is
    // worse: blue-on-container is 3.91:1 light / 3.32:1 dark, which keeps the
    // AA failure in a new outfit.
    return (
      <Button
        icon={buttonIcon === undefined ? <PlusOutlined /> : buttonIcon}
        onClick={onClick}
      >
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
          {/* `colorTextSecondary`, not `type="secondary"`. antd resolves that
              prop to `colorTextDescription` — rgba(0,0,0,.45), which measured
              3.35:1 here against the page. This is 14px resting body text, so
              AA wants 4.5, and under a blur the line was the first thing in
              the block to disappear. The token is 6.89:1 light / 7.69:1 dark,
              and it is the same correction already applied to the field
              descriptions on Branding, License and Billing Settings. */}
          <Typography.Text style={{ color: 'var(--ant-color-text-secondary)' }}>
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
