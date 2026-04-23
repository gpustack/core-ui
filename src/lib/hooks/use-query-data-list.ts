import { useRequest } from 'ahooks';
import { message } from 'antd';
import { type CancelTokenSource } from 'axios';
import { useEffect, useRef, useState } from 'react';
import { createAxiosToken } from '../../lib/hooks/use-chunk-request';

/**

 *  generic hook to query data list
 * @template ListItem
 * @param Params - query params type, e.g. { page: number; perPage: number }
 * @param option.fetchList: (params, extra) => Promise<{ items: ListItem[] }>
 * @returns loading, dataList, fetchData, cancelRequest
 */
type QueryResponse<ListItem, T extends 'array' | 'object'> = T extends 'array'
  ? ListItem[]
  : Global.PageResponse<ListItem>;

export function useQueryDataList<
  ListItem,
  Params = any,
  T extends 'array' | 'object' = 'array'
>(option: {
  key: string;
  responseType?: T;
  fetchList: (
    params: Params,
    options?: any
  ) => Promise<Global.PageResponse<ListItem>>;
  getLabel?: (item: ListItem) => string;
  getValue?: (item: ListItem) => any;
  errorMsg?: string;
  debounceWait?: number;
}): {
  loading: boolean;
  dataList: Array<ListItem & { label: string; value: any }>;
  cancelRequest: () => void;
  fetchData: (
    params: Params,
    extra?: any
  ) => Promise<QueryResponse<ListItem, T>>;
} {
  const {
    key,
    fetchList,
    getLabel,
    getValue,
    responseType = 'array' as T,
    errorMsg
  } = option;

  const axiosTokenRef = useRef<CancelTokenSource | null>(null);
  const [dataList, setDataList] = useState<
    Array<ListItem & { label: string; value: any }>
  >([]);

  const { runAsync, loading, cancel } = useRequest(
    async (
      params: Params,
      extra?: any
    ): Promise<QueryResponse<ListItem, T>> => {
      axiosTokenRef.current?.cancel();
      axiosTokenRef.current = createAxiosToken();

      const res = await fetchList(params, {
        token: axiosTokenRef.current?.token,
        ...(extra || {})
      });

      setDataList(
        res.items?.map((item: ListItem) => ({
          ...item,
          label: getLabel ? getLabel(item) : (item as any).name,
          value: getValue ? getValue(item) : (item as any).id
        })) || []
      );

      if (responseType === 'array') {
        return (res.items || []) as QueryResponse<ListItem, T>;
      }

      return res as QueryResponse<ListItem, T>;
    },
    {
      manual: true,
      debounceWait: option.debounceWait || 300,
      onError: (error) => {
        message.error(
          error?.message || errorMsg || `Failed to fetch ${key} list`
        );
        setDataList([]);
      }
    }
  );

  const fetchData = (params: Params, extra?: any) => runAsync(params, extra);

  const cancelRequest = () => {
    cancel();
    axiosTokenRef.current?.cancel();
  };

  useEffect(() => {
    return () => {
      cancel();
      axiosTokenRef.current?.cancel();
    };
  }, [cancel]);

  return {
    loading,
    dataList,
    cancelRequest,
    fetchData
  };
}

export function useQueryData<Detail, Params = any>(option: {
  key: string;
  delay?: number;
  fetchDetail: (params: Params, options?: any) => Promise<Detail>;
  getData?: (response: Detail, params?: any) => any;
  errorMsg?: string;
}): {
  loading: boolean;
  detailData: Detail;
  cancelRequest: () => void;
  fetchData: (params: Params, extra?: any) => Promise<Detail>;
} {
  const { key, fetchDetail, getData, errorMsg, delay } = option;
  const axiosTokenRef = useRef<CancelTokenSource | null>(null);
  const [detailData, setDetailData] = useState<Detail>({} as Detail);

  const {
    runAsync: fetchData,
    loading,
    cancel
  } = useRequest(
    async (params: Params, extra?: any) => {
      axiosTokenRef.current?.cancel();
      axiosTokenRef.current = createAxiosToken();
      const res = await fetchDetail(params, {
        token: axiosTokenRef.current?.token,
        ...(extra || {})
      });

      if (delay) {
        await new Promise((resolve) => {
          setTimeout(resolve, delay);
        });
      }

      setDetailData(getData ? getData(res, params) : res);

      return res;
    },
    {
      manual: true,
      onSuccess: () => {},
      onError: (error) => {
        message.error(
          error?.message || errorMsg || `Failed to fetch ${key} data`
        );
        setDetailData({} as Detail);
      }
    }
  );

  const cancelRequest = () => {
    cancel();
    axiosTokenRef.current?.cancel();
  };

  useEffect(() => {
    return () => {
      cancelRequest();
    };
  }, []);

  return {
    loading,
    detailData,
    cancelRequest,
    fetchData
  };
}
