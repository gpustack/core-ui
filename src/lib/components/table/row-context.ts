import React from 'react';

export interface RowContextType {
  row: Record<string, any>;
  mobile?: boolean;
  /** Mobile card cell alignment; body values default to right. */
  mobileAlign?: 'left' | 'right';
  onCell?: (
    record: any,
    data: { dataIndex: string; newValue: any; oldValue: any }
  ) => any;
}

const RowContext = React.createContext<RowContextType>({} as RowContextType);

export default RowContext;
