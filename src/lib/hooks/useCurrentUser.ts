import type { CurrentUser } from '../context/CoreUIContext';
import useCoreUIContext from './useCoreUIContext';

export const useCurrentUser = (): CurrentUser | undefined => {
  const { hooks } = useCoreUIContext();
  // `hooks.useCurrentUser` is required on `CoreHooks`; the Context
  // default value returns `undefined` for hosts that haven't wired it.
  // Calling unconditionally keeps the hook call order stable.
  return hooks.useCurrentUser();
};

export default useCurrentUser;
