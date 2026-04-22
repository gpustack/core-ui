import useCoreUIContext from './useCoreUIContext';

export const useIntl = () => {
  const { hooks } = useCoreUIContext();
  const i18n = hooks?.useIntl?.();

  const tl = (descriptor: { id: string }, values?: any) => {
    if (i18n && i18n.formatMessage) {
      return i18n.formatMessage(descriptor, values);
    }
    return descriptor.id;
  };

  return {
    ...i18n,
    locale: i18n?.locale || 'en-US',
    formatMessage: tl
  };
};

export default useIntl;
