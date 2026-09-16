import { Collapse, type CollapseProps } from 'antd';
import React from 'react';
import styled from 'styled-components';
import IconFont from '../../../lib/components/icon-font';

const CollapseInner = styled(Collapse)`
  .ant-collapse-header {
    display: flex;
    align-items: center;
    margin-bottom: 10px !important;
    padding-inline: 5px !important;
    padding-block: 8px !important;
    border-radius: var(--border-radius-base) !important;
    /* 500, not the 600 this used to hardcode. These headers sit INSIDE a
       drawer, and GSDrawer's own title is 14px/500 — the SAME size. So at
       600 the child heading was simply heavier than the title it lives under,
       with no size difference to justify it: a straight inversion.
       Both are structural titles, so both are 500. Note this leaves the two
       typographically identical, separated only by position and the rule under
       the drawer title; if that turns out to be too flat, the fix is to raise
       the DRAWER title to --font-size-large, not to put weight back here. */
    font-size: var(--font-size-base) !important;
    font-weight: var(--font-weight-medium) !important;
    &:hover {
      background-color: var(--ant-color-fill-tertiary) !important;
    }
  }

  .ant-collapse-body {
    padding-inline: 0 !important;
    padding-block: 0 !important;
  }
  .ant-collapse-header-text {
    display: flex;
    align-items: center;
    height: 24px;
  }
`;

const CollapsePanel: React.FC<{
  items: CollapseProps['items'];
  activeKey: string | string[];
  accordion?: boolean;
  defaultActiveKey?: string | string[];
  onChange?: (key: string | string[]) => void;
  styles?: Record<string, React.CSSProperties>;
}> = ({ items, activeKey, accordion, defaultActiveKey, onChange, styles }) => {
  return (
    <CollapseInner
      expandIconPlacement="start"
      bordered={false}
      ghost
      accordion={accordion}
      activeKey={activeKey}
      defaultActiveKey={defaultActiveKey}
      onChange={onChange}
      destroyOnHidden={false}
      styles={{
        ...styles,
        header: {
          backgroundColor: 'var(--ant-collapse-header-bg)'
        }
      }}
      expandIcon={({ isActive }) => (
        <IconFont
          type="icon-down"
          rotate={isActive ? 0 : -90}
          style={{ fontSize: '14px' }}
        ></IconFont>
      )}
      items={items}
    ></CollapseInner>
  );
};

export default CollapsePanel;
