import { useMemoizedFn } from 'ahooks';
import _ from 'lodash';
import { useEffect, useRef, useState } from 'react';
import useSetChunkRequest from '../../lib/hooks/use-chunk-request';
import useUpdateChunkedList from '../../lib/hooks/use-update-chunk-list';
import useCoreUIContext from './useCoreUIContext';

export default function useWatchList<T = Record<string, any>>(API: string) {
  const watchAPI = API;
  const { services } = useCoreUIContext();
  const { request } = services;
  const [watchDataList, setWatchDataList] = useState<T[]>([]);
  const chunkRequestRef = useRef<any>(null);
  const listRequestTokenRef = useRef<any>(null);

  const { setChunkRequest, createAxiosToken } = useSetChunkRequest();

  const { updateChunkedList, cacheDataListRef: cacheWatchDataListRef } =
    useUpdateChunkedList({
      dataList: watchDataList,
      limit: 100,
      setDataList: setWatchDataList
    });

  const updateWatchDataListHandler = (list: any) => {
    // filter the data
    _.each(list, (data: any) => {
      updateChunkedList(data);
    });
  };

  const createWatchChunkRequest = useMemoizedFn(async () => {
    chunkRequestRef.current?.current?.cancel?.();
    try {
      chunkRequestRef.current = setChunkRequest({
        url: `${watchAPI}`,
        params: {},
        handler: updateWatchDataListHandler
      });
    } catch (error) {
      // ignore
    }
  });

  const cancelWatch = useMemoizedFn(() => {
    chunkRequestRef.current?.current?.cancel?.();
    listRequestTokenRef.current?.cancel?.();
  });

  const queryAllDataList = async (
    params: Global.SearchParams,
    options?: any
  ) => {
    return request<Global.PageResponse<T>>(watchAPI, {
      params,
      method: 'GET',
      cancelToken: options?.token
    });
  };

  const handleDeleteItemFromCache = (id: number) => {
    cacheWatchDataListRef.current = cacheWatchDataListRef.current.filter(
      (item) => item.id !== id
    );
    setWatchDataList(cacheWatchDataListRef.current);
  };

  const getAllDataList = useMemoizedFn(async () => {
    try {
      listRequestTokenRef.current?.cancel?.();
      listRequestTokenRef.current = createAxiosToken();
      const params = {
        page: -1
      };
      const res: any = await queryAllDataList(params, {
        token: listRequestTokenRef.current.token
      });
      cacheWatchDataListRef.current = res.items || [];
      setWatchDataList(res.items || []);
    } catch (error) {
      // ignore
    }
  });

  // Pause/resume for when the page is hidden or its tab is switched away. The
  // caller owns the `visibilitychange` listener, because a page with several
  // watches has to route by which tab is active.
  const cancelRequestsOnPageInactive = useMemoizedFn(() => {
    cancelWatch();
    // drop the cache: DELETE events fired while we were not watching are never
    // re-sent, so items deleted in the meantime would linger forever. Resume
    // rebuilds the baseline from a fresh snapshot instead.
    cacheWatchDataListRef.current = [];
  });

  const resumeRequestsOnPageActive = useMemoizedFn(async () => {
    await getAllDataList();
    await createWatchChunkRequest();
  });

  useEffect(() => {
    createWatchChunkRequest();
    return () => {
      cancelWatch();
    };
  }, []);

  return {
    watchDataList,
    setWatchDataList,
    startWatch: createWatchChunkRequest,
    cancelWatch,
    cancelRequestsOnPageInactive,
    resumeRequestsOnPageActive,
    deleteItemFromCache: handleDeleteItemFromCache
  };
}
