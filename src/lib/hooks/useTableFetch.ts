import type { TableFetchType } from '../types/table-fetch';
import useCoreUIContext from './useCoreUIContext';

// Stable re-export of the host-injected `useTableFetch` so plugins
// don't have to reach into `hooks.useTableFetch(...)` themselves.
// `hooks.useTableFetch` is required on `CoreHooks`; the Context default
// throws at call time when no host has wired it, which surfaces a
// misconfigured host as a clear error without violating the Rules of
// Hooks (the call here is unconditional).
export const useTableFetch: TableFetchType = ((opts) => {
  const { hooks } = useCoreUIContext();
  return hooks.useTableFetch(opts);
}) as TableFetchType;

export default useTableFetch;
