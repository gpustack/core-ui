import TableContext from './table-context';

type TableProviderProps = {
  value: {
    allChildren?: Record<string, any>[];
    setDisableExpand?: (row: any) => boolean;
  };
  children: React.ReactNode;
};

const TableProvider: React.FC<TableProviderProps> = ({ value, children }) => {
  return (
    <TableContext.Provider value={value}>{children}</TableContext.Provider>
  );
};

export default TableProvider;
