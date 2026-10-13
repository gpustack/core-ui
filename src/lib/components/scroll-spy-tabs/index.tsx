import { useMemoizedFn } from 'ahooks';
import _ from 'lodash';
import React, {
  forwardRef,
  useEffect,
  useImperativeHandle,
  useRef
} from 'react';
import styled from 'styled-components';
import SegmentLine from '../../../lib/components/segment-line';
import useFieldScroll from './use-field-scroll';

const SegmentedHeader = styled.div<{ $top?: number }>`
  position: sticky;
  top: ${(props) => props.$top || 0}px;
  z-index: 10;
  margin-bottom: 16px;
  border-bottom: 1px solid var(--ant-color-split);
  background-color: var(--ant-color-bg-elevated);
`;

/**
 * ScrollSpyTabs component
 * defaultTarget: The default active target tab in uncontrolled mode
 * value: The active target tab in controlled mode
 * onChange: Called when a tab is clicked or handleTargetChange is invoked
 * segmentedTop: { // Mostlty, It's always a constants.
 *   top: number; // The top offset for the sticky header
 *   offsetTop: number; // The offset top for the target
 * }
 * getScrollElementScrollableHeight: function to get the scrollable height of the scroll element
 * segmentOptions.field: The target data-field={segmentOptions.field} to scroll to
 * activeKey: The current active keys for collapsible sections
 * setActiveKey: The function to set active keys for collapsible sections
 */
interface ScrollSpyTabsProps {
  ref?: any;
  children?: React.ReactNode;
  defaultTarget?: string;
  value?: string;
  onChange?: (value: string) => void;
  segmentedTop: {
    top: number;
    offsetTop: number;
  };
  activeKey: string[];
  setActiveKey: (keys: string[]) => void;
  getScrollElementScrollableHeight?: () => {
    scrollHeight: number;
    scrollTop: number;
  };
  segmentOptions: {
    label: string;
    value: string;
    icon?: React.ReactNode;
    field: string;
  }[];
}

const ScrollSpyTabs: React.FC<ScrollSpyTabsProps> = forwardRef(
  (
    {
      getScrollElementScrollableHeight,
      segmentedTop,
      segmentOptions,
      defaultTarget,
      value,
      onChange,
      activeKey,
      setActiveKey,
      children
    },
    ref
  ) => {
    const [target, setTarget] = React.useState<string>(
      defaultTarget || segmentOptions[0]?.value || ''
    );
    const selectedTarget = value ?? target;
    const requestedTargetRef = useRef<string>();

    const { scrollToSegment, holderHeight, containerRef, holderRef } =
      useFieldScroll({
        activeKey,
        setActiveKey,
        segmentOptions,
        segmentedTop: segmentedTop,
        getScrollElementScrollableHeight: getScrollElementScrollableHeight
      });

    const scrollToTarget = useMemoizedFn((val: string) => {
      if (value === undefined) {
        setTarget(val);
      }
      scrollToSegment(val, { offsetTop: segmentedTop.offsetTop });
    });
    // Keep legacy uncontrolled selection in sync with throttled scrolling.
    const [throttleScrollToSegment] = React.useState(() =>
      _.throttle(scrollToTarget, 500, { trailing: true })
    );

    // A parent selection or removed option supersedes queued navigation.
    useEffect(() => {
      const requestedTarget = requestedTargetRef.current;
      if (
        requestedTarget !== undefined &&
        ((value !== undefined && value !== requestedTarget) ||
          !segmentOptions.some((option) => option.value === requestedTarget))
      ) {
        throttleScrollToSegment.cancel();
      }
    }, [value, segmentOptions, throttleScrollToSegment]);

    useEffect(
      () => () => throttleScrollToSegment.cancel(),
      [throttleScrollToSegment]
    );

    const handleTargetChange = (val: string) => {
      requestedTargetRef.current = val;
      onChange?.(val);
      throttleScrollToSegment(val);
    };

    useImperativeHandle(ref, () => ({
      handleTargetChange
    }));

    return (
      <div ref={containerRef}>
        {segmentOptions.length > 0 && (
          <SegmentedHeader $top={segmentedTop.top}>
            <SegmentLine
              theme={'light'}
              value={selectedTarget}
              onChange={(val) => handleTargetChange(String(val))}
              options={segmentOptions}
            />
          </SegmentedHeader>
        )}
        {children}
        <div
          ref={holderRef}
          className="holder"
          style={{ height: holderHeight }}
        ></div>
      </div>
    );
  }
);

export default ScrollSpyTabs;
