import {
  ScrollerContext,
  type ScrollerContextProps
} from './use-scroller-context';

const InfiniteScrollerProvider: React.FC<
  { value: ScrollerContextProps } & { children: React.ReactNode }
> = ({ children, value }) => {
  return (
    <ScrollerContext.Provider value={value}>
      {children}
    </ScrollerContext.Provider>
  );
};

export default InfiniteScrollerProvider;
