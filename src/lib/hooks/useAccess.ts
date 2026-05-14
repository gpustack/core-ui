import useCoreUIContext from './useCoreUIContext';

export const useAccess = (): Record<string, any> => {
  const { access } = useCoreUIContext();
  return access?.useAccess?.() ?? {};
};

export default useAccess;
