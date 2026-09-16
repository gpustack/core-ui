import { CloseOutlined } from '@ant-design/icons';
import { Button, Drawer, type DrawerProps } from 'antd';
import React from 'react';
import { useEscHint } from '../../../lib/hooks/use-esc-hint';
import { useIntl } from '../../../lib/hooks/useIntl';

/**
 * use ColumnWrapper to wrap content in Drawer with scroller
 * 57px is the height of header
 * @param props
 * @returns
 */
const GSDrawer = (props: DrawerProps) => {
  const { title, closable = true, mask, styles, ...restProps } = props;
  const intl = useIntl();
  const resolvedStyles = typeof styles === 'function' ? undefined : styles;
  const { EscHint } = useEscHint({
    enabled: !props.keyboard && props.open
  });
  const handleCancel = (e: React.MouseEvent<HTMLElement>) => {
    props.onClose?.(e);
  };

  return (
    <>
      <Drawer
        {...restProps}
        styles={{
          wrapper: {
            ...resolvedStyles?.wrapper
          },
          root: {
            ...resolvedStyles?.root
          },
          body: {
            height: 'calc(100vh - 57px)',
            paddingBlock: 16,
            paddingInline: 0,
            overflowX: 'hidden',
            ...resolvedStyles?.body
          },
          section: {
            borderRadius: '6px 0 0 6px',
            ...resolvedStyles?.section
          }
        }}
        closable={false}
        mask={mask}
        title={
          <div className="flex-between flex-center">
            <span
              style={{
                color: 'var(--ant-color-text)',
                // Title tier is one weight product-wide: page title, drawer
                // title and section title are all `medium`.
                fontWeight: 'var(--font-weight-medium)',
                fontSize: 'var(--font-size-base)'
              }}
            >
              {title}
            </span>
            {closable && (
              <Button
                type="text"
                size="small"
                onClick={handleCancel}
                aria-label={intl.formatMessage({ id: 'common.button.close' })}
              >
                <CloseOutlined></CloseOutlined>
              </Button>
            )}
          </div>
        }
      >
        {restProps.children}
        {EscHint}
      </Drawer>
    </>
  );
};

export default GSDrawer;
