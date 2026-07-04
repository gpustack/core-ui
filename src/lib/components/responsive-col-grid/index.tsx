import { Col, Row } from 'antd';
import React, { useMemo } from 'react';
import { colSpanFromColumns } from './responsive-col-grid-utils';

export type ResponsiveColGridPreset = {
  xs?: number;
  sm?: number;
  md?: number;
  lg?: number;
  xl?: number;
};

export type ResponsiveColGridProps = {
  cols?: ResponsiveColGridPreset;
  gap?: number;
  className?: string;
  children: React.ReactNode;
};

const DEFAULT_COLS: ResponsiveColGridPreset = { xs: 1, md: 2, lg: 3 };

const ResponsiveColGrid: React.FC<ResponsiveColGridProps> = ({
  cols = DEFAULT_COLS,
  gap = 16,
  className,
  children
}) => {
  const items = useMemo(
    () => React.Children.toArray(children).filter(Boolean),
    [children]
  );

  const spans = useMemo(
    () => ({
      xs: colSpanFromColumns(cols.xs ?? cols.sm ?? 1),
      sm: colSpanFromColumns(cols.sm ?? cols.xs ?? 1),
      md: colSpanFromColumns(cols.md ?? cols.sm ?? 2),
      lg: colSpanFromColumns(cols.lg ?? cols.md ?? 3),
      xl: colSpanFromColumns(cols.xl ?? cols.lg ?? cols.md ?? 3)
    }),
    [cols]
  );

  return (
    <Row gutter={[gap, gap]} className={className}>
      {items.map((child, index) => (
        <Col
          key={index}
          xs={spans.xs}
          sm={spans.sm}
          md={spans.md}
          lg={spans.lg}
          xl={spans.xl}
        >
          {child}
        </Col>
      ))}
    </Row>
  );
};

export default ResponsiveColGrid;
