interface WatchRequest {
  id: number;
  token: any;
  cancel: () => void;
}

declare global {
  interface Window {
    __GPUSTACK_WATCH_REQUEST_CLEAR__: {
      watchIDValue: number;
      requestList: WatchRequest[];
    };
  }
}

window.__GPUSTACK_WATCH_REQUEST_CLEAR__ = {
  watchIDValue: 0,
  requestList: []
};

// Chunked watches are long-lived connections. Over HTTP/1.1 a browser allows
// only ~6 per host, so the cap has to leave room for ordinary requests —
// raising it would starve them. 4 watches + 2 spare is the budget.
//
// This means staying under the cap depends on pages releasing watches they
// don't need: see the pause/resume pair on useWatchList and the per-tab
// cancel/resume wiring in the models page.
export const MAX_WATCH_REQUESTS = 4;

export const updateWatchIDValue = () => {
  window.__GPUSTACK_WATCH_REQUEST_CLEAR__.watchIDValue =
    window.__GPUSTACK_WATCH_REQUEST_CLEAR__.watchIDValue + 1;
  return window.__GPUSTACK_WATCH_REQUEST_CLEAR__.watchIDValue;
};

export const updateWatchRequest = (watchToken: WatchRequest) => {
  window.__GPUSTACK_WATCH_REQUEST_CLEAR__.requestList.push(watchToken);
};

// NOTE: both removals below mutate the list in place. Reassigning
// `requestList` to a new array would orphan every reference callers already
// hold — and a stale snapshot makes the "at most 4 concurrent watches" guard
// read a frozen length, which then cancels freshly created watches.
export const cancelWatchRequest = (n: number) => {
  // cancel the before n requests
  const requestList = window.__GPUSTACK_WATCH_REQUEST_CLEAR__.requestList;
  const targets = requestList.slice(0, n);
  // detach before cancelling: each cancel() runs clearWatchRequestId, which
  // would splice the same array and shift the items still being iterated
  requestList.splice(0, targets.length);
  targets.forEach((item) => item?.cancel?.());
};

export const clearWatchRequestId = (id: number) => {
  const requestList = window.__GPUSTACK_WATCH_REQUEST_CLEAR__.requestList;
  const index = requestList.findIndex((item) => item.id === id);
  if (index > -1) {
    requestList.splice(index, 1);
  }
};
