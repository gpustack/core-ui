import { type CancelTokenSource } from 'axios';
import { createContext } from 'react';
import { type TableFetchType } from '../types/table-fetch';

// static config
export interface CoreUIConfig {
  apiBaseUrl: string;
  iconUrl?: string;
  theme?: 'light' | 'realDark' | 'dark';
  isDarkTheme?: boolean;
  defaultColorPrimary?: string;
}

// i18n
export interface CoreUII18n {
  formatMessage: (descriptor: { id: string }, values?: any) => string;
}

// locale
export interface CoreUILocale {
  getAllLocales: () => string[];
  setLocale: (locale: string, reload?: boolean) => void;
}

export interface RequestOptions {
  method?: 'GET' | 'POST' | 'PUT' | 'DELETE' | 'PATCH';
  params?: Record<string, any>;
  data?: any;
  skipErrorHandler?: boolean;
  getResponse?: boolean;
  cancelToken?: CancelTokenSource;
  headers?: Record<string, string>;
  onDownloadProgress?: (progressEvent: any) => void;
}

export interface RequestService {
  <T = any>(url: string, options?: RequestOptions): Promise<T>;
}

export interface Services {
  request: RequestService;
  router?: {
    push: (path: string) => void;
    replace: (path: string) => void;
    goBack: () => void;
  };
}

export interface CurrentUser {
  // String IDs are common in modern IdPs (UUIDs etc.); numeric kept
  // for hosts whose user store still uses integer primary keys.
  id?: string | number;
  username?: string;
  fullName?: string;
  isAdmin?: boolean;
  // Hosts often pass through extra fields straight from their user
  // payload (avatar, email, etc.); keep the type open.
  [key: string]: any;
}

export interface CoreHooks {
  useIntl: () => CoreUII18n;
  // Read the signed-in user's profile. Required so the consumer hook
  // (`useCurrentUser`) can call it unconditionally — Rules of Hooks
  // forbid the optional-chained call. The Context default below
  // returns `undefined`, so a host that hasn't wired this still gets
  // a graceful no-op.
  useCurrentUser: () => CurrentUser | undefined;
  usePaginationStatus?: (key: string) => {
    pagination: any;
    getPaginationStatus: () => any;
    setPagination: (pagination: any) => void;
    getPagination: () => any;
    clearPagination: () => void;
  };
  useTabActive?: () => {
    setTabActive: (tabKey: string, value: any) => void;
    getTabActive: (tabKey: string) => any;
    tabsMap: Record<string, string>;
  };
  // Required so consumers can call `useTableFetch()` unconditionally
  // (Rules of Hooks). The Context default below throws at call time
  // if no host wired this — surfaces misconfiguration as a clear error
  // without breaking hook ordering.
  useTableFetch: TableFetchType;
  useUserSettings?: () => {
    userSettings: any;
    setUserSettings: any;
    setTheme: (mode: string) => void;
    isDarkTheme: boolean;
    themeData: any;
    componentSize: string;
  };
  useUserSettingsStorage?: () => {
    setStorageUserSettings: (value: Record<string, any>) => void;
    getStorageUserSettings: () => any;
  };
}
export interface CoreUISlots {
  ExtraContent?: React.ComponentType<{ isDarkTheme?: boolean }>;
}

// Access control wiring forwarded by the host (e.g. `@umijs/max`'s
// `plugin-access`). Optional so hosts that don't gate on permissions
// — or surfaces like the login page that run pre-auth — can omit it.
export interface CoreUIAccess {
  Access: React.ComponentType<{
    accessible: boolean;
    fallback?: React.ReactNode;
    children: React.ReactNode;
  }>;
  useAccess: () => Record<string, any>;
}

export interface CoreUIContextProps {
  config: CoreUIConfig;
  tokens?: Record<string, string>;
  i18n: CoreUII18n;
  locale: CoreUILocale;
  services: Services;
  hooks: CoreHooks;
  localStore?: {
    readColumnSettings: (key: string) => string[] | null;
    readState: (key: string) => void;
    writeColumnSettings: (key: string, value: any) => void;
    writeState: (key: string, value: any) => void;
  };
  slots?: CoreUISlots;
  access?: CoreUIAccess;
}

const CoreUIContext = createContext<CoreUIContextProps>({
  config: {
    apiBaseUrl: '',
    iconUrl: '',
    theme: 'light'
  },
  i18n: {
    formatMessage: (descriptor: { id: string }, values?: any) => descriptor.id
  },
  locale: {
    getAllLocales: () => [],
    setLocale: () => {}
  },
  hooks: {
    useIntl: () => ({
      locale: 'en-US',
      formatMessage: (descriptor: { id: string }, values?: any) => descriptor.id
    }),
    useCurrentUser: () => undefined,
    useTableFetch: (() => {
      throw new Error(
        'useTableFetch was not provided by the host CoreUIProvider'
      );
    }) as TableFetchType
  },
  tokens: {},
  services: {
    request: async <T = any>(
      url: string,
      options?: RequestOptions
    ): Promise<T> => {
      return Promise.resolve({} as T);
    }
  }
});

export default CoreUIContext;
