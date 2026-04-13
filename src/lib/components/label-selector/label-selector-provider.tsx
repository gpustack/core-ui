import {
  LabelSelectorContext,
  type LabelSelectorContextProps
} from './context';

const LabelSelectorProvider: React.FC<
  LabelSelectorContextProps & { children: React.ReactNode }
> = ({ children, ...contextValue }) => {
  return (
    <LabelSelectorContext.Provider value={contextValue}>
      {children}
    </LabelSelectorContext.Provider>
  );
};

export default LabelSelectorProvider;
