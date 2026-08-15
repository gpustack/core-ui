import { useMemoizedFn } from 'ahooks';
import _ from 'lodash';
import { useEffect, useRef, useState } from 'react';
import useSetChunkRequest from '../../lib/hooks/use-chunk-request';
import usePageVisibility from '../../lib/hooks/use-page-visibility';
import useUpdateChunkedList from '../../lib/hooks/use-update-chunk-list';
import useCoreUIContext from './useCoreUIContext';

export default function useWatchList<T = Record<string, any>>(
  API: string,
  options?: {
    // set false when the caller already routes pause/resume by its own in-app
    // tab state, otherwise the listener here would resume an inactive tab
    pauseOnHidden?: boolean;
    // Gate the whole watch on a caller-side condition — a list page whose
    // current rows can't have any of these children shouldn't hold a stream
    // open for them. While false no request is made and the list stays empty;
    // flipping it to true starts the watch, which replays a full snapshot on
    // connect, so nothing has to be back-filled.
    enabled?: boolean;
  }
) {
  const { pauseOnHidden = true, enabled = true } = options || {};
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
      // unbounded: the watch replays every existing item as a CREATE event on
      // each (re)connect, so a finite limit would truncate that snapshot and
      // shrink the list right after a resume
      limit: Infinity,
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
    // re-watching is enough: the stream replays a full snapshot on connect and
    // the cache was dropped on hide, so the list rebuilds from it. Fetching the
    // list over REST here would only duplicate that snapshot.
    await createWatchChunkRequest();
  });

  usePageVisibility({
    enabled: pauseOnHidden && enabled,
    onHidden: cancelRequestsOnPageInactive,
    onVisible: resumeRequestsOnPageActive
  });

  useEffect(() => {
    if (!enabled) {
      // Same reasoning as the hide path: events fired while we are not
      // watching are never re-sent, so a kept list would go stale silently.
      // Re-enabling rebuilds it from the stream's own snapshot.
      cancelRequestsOnPageInactive();
      setWatchDataList([]);
      return;
    }
    createWatchChunkRequest();
    return () => {
      cancelWatch();
    };
  }, [enabled]);

  return {
    watchDataList,
    setWatchDataList,
    startWatch: createWatchChunkRequest,
    cancelWatch,
    cancelRequestsOnPageInactive,
    resumeRequestsOnPageActive,
    // not used by the pause/resume pair — exposed for callers that need to
    // re-align with the backend explicitly (note: untested path, `page: -1`)
    getAllDataList,
    deleteItemFromCache: handleDeleteItemFromCache
  };
}
