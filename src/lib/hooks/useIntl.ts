import { useMemo } from 'react';
import useCoreUIContext from './useCoreUIContext';

export const useIntl = () => {
  const { hooks } = useCoreUIContext();
  const i18n = hooks.useIntl();

  return useMemo(() => ({ ...i18n, locale: i18n.locale || 'en-US' }), [i18n]);
};

export default useIntl;
