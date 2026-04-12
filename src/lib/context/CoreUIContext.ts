import { type CancelTokenSource } from 'axios';
import { createContext } from 'react';
import { type TableFetchType } from '../types/table-fetch';

// static config
export interface CoreUIConfig {
  apiBaseUrl: string;
  iconUrl?: string;
  theme?: 'light' | 'dark';
  isDarkTheme?: boolean;
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
}

export interface CoreHooks {
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
  useTableFetch?: TableFetchType;
  useUserSettings?: () => {
    userSettings: any;
    setUserSettings: any;
    setTheme: (mode: string) => void;
    isDarkTheme: boolean;
    themeData: any;
    componentSize: string;
  };
}
export interface CoreUIContextProps {
  config: CoreUIConfig;
  tokens?: Record<string, string>;
  i18n: CoreUII18n;
  locale: CoreUILocale;
  services: Services;
  hooks?: CoreHooks;
  localStore?: {
    readColumnSettings: (key: string) => string[] | null;
    readState: (key: string) => void;
    writeColumnSettings: (key: string, value: any) => void;
    writeState: (key: string, value: any) => void;
  };
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
