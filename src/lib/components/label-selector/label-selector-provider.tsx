import {
  LabelSelectorContext,
  type LabelSelectorContextProps
} from './context';

const LabelSelectorProvider: React.FC<{
  children: React.ReactNode;
  value: LabelSelectorContextProps;
}> = ({ children, value }) => {
  return (
    <LabelSelectorContext.Provider value={value}>
      {children}
    </LabelSelectorContext.Provider>
  );
};

export default LabelSelectorProvider;
