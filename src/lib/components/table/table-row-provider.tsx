import RowContext, { type RowContextType } from './row-context';

const TableRowProvider: React.FC<{
  value: RowContextType;
  children: React.ReactNode;
}> = ({ value, children }) => {
  return <RowContext.Provider value={value}>{children}</RowContext.Provider>;
};

export default TableRowProvider;
