import CoreUIContext, { type CoreUIContextProps } from './CoreUIContext';

export const CoreUIProvider: React.FC<
  CoreUIContextProps & { children: React.ReactNode }
> = ({ children, ...config }) => {
  return (
    <CoreUIContext.Provider value={{ ...config }}>
      {children}
    </CoreUIContext.Provider>
  );
};
