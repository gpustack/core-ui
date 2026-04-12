export const breakpoints = {
  xs: 0,
  sm: 576,
  md: 768,
  lg: 992,
  xl: 1200,
  xxl: 1600
};

export const WatchEventType = {
  CREATE: 1,
  UPDATE: 2,
  DELETE: 3
};

import { type StatusType } from '../types';

export const StatusColorMap: Record<
  StatusType,
  { text: string; bg: string; border?: string }
> = {
  error: {
    text: `var(--ant-red-6)`,
    bg: `var(--ant-red-1)`
  },
  warning: {
    text: `var(--ant-orange-6)`,
    bg: `var(--ant-orange-1)`
  },
  transitioning: {
    text: `var(--ant-blue-6)`,
    bg: `var(--ant-blue-1)`
  },
  success: {
    text: `var(--ant-color-success)`,
    bg: `var(--ant-color-success-bg)`
  },
  inactive: {
    text: `var(--ant-color-text-tertiary)`,
    border: `var(--ant-color-border)`,
    bg: `var(--ant-color-fill)`
  }
};

export const StatusMaps: Record<string, StatusType> = {
  error: 'error',
  warning: 'warning',
  transitioning: 'transitioning',
  success: 'success',
  inactive: 'inactive'
};
