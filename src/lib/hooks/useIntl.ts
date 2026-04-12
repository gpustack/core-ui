import useCoreUIContext from './useCoreUIContext';

export const useIntl = () => {
  const { i18n } = useCoreUIContext();

  const tl = (descriptor: { id: string }, values?: any) => {
    if (i18n && i18n.formatMessage) {
      return i18n.formatMessage(descriptor, values);
    }
    return descriptor.id;
  };

  return {
    ...i18n,
    formatMessage: tl
  };
};

export default useIntl;
