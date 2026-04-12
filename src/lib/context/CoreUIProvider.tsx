import CoreUIContext, { type CoreUIContextProps } from './CoreUIContext';

export const CoreUIProvider: React.FC<{
  config: CoreUIContextProps;
  children: React.ReactNode;
}> = ({ config, children }) => {
  return (
    <CoreUIContext.Provider value={{ ...config }}>
      {children}
    </CoreUIContext.Provider>
  );
};
