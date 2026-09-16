import { Tag } from 'antd';
import React from 'react';
import ColumnWrapper from '../column-wrapper';
import ModalFooter from '../modal-footer';
import GSDrawer from '../scroller-modal/gs-drawer';

const ModalFooterStyle = {
  padding: '16px 24px 8px',
  display: 'flex',
  justifyContent: 'flex-end'
};

type AddModalProps = {
  title: React.ReactNode;
  open: boolean;
  onCancel?: () => void;
  children?: React.ReactNode;
  onSubmit?: () => void;
  width?: number | string;
  footer?: React.ReactNode;
  subTitle?: React.ReactNode;
  loading?: boolean;
  /**
   * Allow Esc and a mask click to close the drawer.
   *
   * Off by default, because the common case here is a long multi-step form
   * (cluster creation, node pools) where a stray Esc throws away real work —
   * `GSDrawer` shows the "Esc is disabled" hint in that state rather than
   * silently swallowing the key.
   *
   * Turn it ON for a drawer that holds a field or two and nothing a user would
   * mind retyping. Blanket-guarding those is the case this prop exists to fix:
   * a one-field label editor cost the same two clicks to escape as a ten-step
   * provisioning wizard.
   */
  dismissible?: boolean;
};
const FormDrawer: React.FC<AddModalProps> = ({
  title,
  open,
  onCancel,
  onSubmit,
  children,
  width = 600,
  subTitle,
  footer,
  loading,
  dismissible = false
}) => {
  return (
    <GSDrawer
      title={
        <>
          {title}
          {subTitle && (
            <Tag
              variant="outlined"
              style={{
                fontSize: 12,
                fontWeight: 400,
                marginLeft: 8,
                borderRadius: 4,
                borderColor: 'var(--ant-color-border-secondary)',
                color: 'var(--ant-color-text-secondary)'
              }}
            >
              {subTitle}
            </Tag>
          )}
        </>
      }
      open={open}
      onClose={onCancel}
      destroyOnHidden={true}
      mask={{
        closable: dismissible
      }}
      keyboard={dismissible}
      styles={{
        wrapper: { width }
      }}
      footer={false}
    >
      <ColumnWrapper
        styles={{
          container: { paddingBlock: 0 }
        }}
        footer={
          footer ?? (
            <ModalFooter
              onOk={onSubmit}
              onCancel={onCancel}
              loading={loading}
              style={ModalFooterStyle}
            ></ModalFooter>
          )
        }
      >
        {children}
      </ColumnWrapper>
    </GSDrawer>
  );
};

export default FormDrawer;
