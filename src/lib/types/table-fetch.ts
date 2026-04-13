type WatchConfig =
  | { watch?: false | undefined; API?: string; polling?: boolean }
  | { watch: true; API: string; polling?: false | undefined }
  | { polling: true; watch: false | undefined; API?: string };

type SortDirection = 'ascend' | 'descend' | null;

type EventsType = 'CREATE' | 'UPDATE' | 'DELETE' | 'INSERT';

export type UseTableFetchOptions<T> = {
  key?: string;
  fetchAPI: (params: any, options?: any) => Promise<Global.PageResponse<T>>;
  deleteAPI?: (id: number, params?: any) => Promise<any>;
  contentForDelete?: string;
  defaultData?: any[];
  events?: EventsType[];
  defaultQueryParams?: Record<string, any>;
  isInfiniteScroll?: boolean;
  updateManually?: boolean;
} & WatchConfig;

export type UseTableFetchReturn<T> = {
  dataSource: {
    dataList: T[];
    loading: boolean;
    loadend: boolean;
    total: number;
    totalPage: number;
  };
  rowSelection: ReturnType<
    typeof import('../hooks/use-table-row-selection').default
  >;
  sortOrder: ReturnType<
    typeof import('../hooks/use-table-sort').useTableMultiSort
  >['sortOrder'];
  queryParams: {
    page: number;
    perPage: number;
    search: string;
    sort_by: string;
    [key: string]: any;
  };
  modalRef: React.MutableRefObject<any>;
  extraStatus: Record<string, any>;
  TABLE_SORT_DIRECTIONS: SortDirection[];
  debounceFetchData: () => void;
  setDataSource: React.Dispatch<
    React.SetStateAction<UseTableFetchReturn<T>['dataSource']>
  >;
  setQueryParams: React.Dispatch<
    React.SetStateAction<UseTableFetchReturn<T>['queryParams']>
  >;
  handleDelete: (row: T & { name: string; id: number }, options?: any) => void;
  handleDeleteBatch: (options?: any) => void;
  fetchData: (
    externalParams?: { query: Record<string, any>; loadmore?: boolean },
    polling?: boolean
  ) => Promise<boolean>;
  handlePageChange: (page: number, pageSize: number) => void;
  handleTableChange: (
    pagination: any,
    filters: any,
    sorter: any,
    extra: any
  ) => void;
  handleSearch: () => void;
  handleQueryChange: (
    params: any,
    options?: { paginate?: boolean }
  ) => Promise<void>;
  loadMore: (nextPage: number) => void;
  cancelChunkRequest: () => void;
  createTableListChunkRequest: (params?: any) => Promise<void>;
  handleNameChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
};

export type TableFetchType = <T>(
  options: UseTableFetchOptions<T>
) => UseTableFetchReturn<T>;
