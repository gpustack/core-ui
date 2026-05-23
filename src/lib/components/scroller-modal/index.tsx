import { Modal, type ModalProps } from 'antd';
import React from 'react';
import styled from 'styled-components';
import useBodyScroll from '../../../lib/hooks/use-body-scroll';
import useOverlayScroller from '../../../lib/hooks/use-overlay-scroller';
import { ScrollerContext } from './use-scroller-context';

const Title = styled.div`
  display: flex;
  align-items: center;
  max-width: 360px;
  text-overflow: ellipsis;
  overflow: hidden;
  white-space: nowrap;
`;

const ScrollerModal = (
  props: ModalProps & { maxContentHeight?: number | string }
) => {
  const scroller = React.useRef<any>(null);
  const { saveScrollHeight, restoreScrollHeight } = useBodyScroll();
  const { initialize, destroyInstance, scrollToBottom } = useOverlayScroller();

  React.useEffect(() => {
    if (props.open) {
      saveScrollHeight();
    } else {
      restoreScrollHeight();
    }
  }, [props.open]);

  // init scroller, delay to ensure modal is fully open
  React.useEffect(() => {
    let timeout = null;
    if (props.open) {
      timeout = setTimeout(() => {
        if (scroller.current) {
          initialize(scroller.current);
        }
      }, 100);
    }
    return () => {
      if (timeout) {
        clearTimeout(timeout);
      }
      destroyInstance();
    };
  }, [props.open, initialize]);

  return (
    <Modal
      title={<Title>{props.title}</Title>}
      destroyOnHidden={true}
      styles={{
        container: {
          padding: 0
        },
        header: {
          padding: 'var(--ant-modal-content-padding)',
          paddingBottom: '0',
          marginBottom: 16
        },
        body: {
          padding: '0',
          paddingBlockEnd: props.footer ? '0' : '24px'
        },
        footer: props.footer
          ? {
              padding: '12px 24px 24px',
              margin: '0'
            }
          : {}
      }}
      {...props}
    >
      <ScrollerContext.Provider value={{ scrollToBottom }}>
        <div
          ref={scroller}
          data-overlayscrollbars-initialize
          className="overlay-scroller-wrapper"
          hidden={false}
          style={{
            paddingInline: 24,
            paddingBlockEnd: 0,
            maxHeight: props.maxContentHeight || 500,
            overflowY: 'auto',
            width: '100%'
          }}
        >
          {props.children}
        </div>
      </ScrollerContext.Provider>
    </Modal>
  );
};

export default ScrollerModal;
