import { Button, Space } from 'antd';
import React from 'react';
import styled from 'styled-components';
import { useIntl } from '../../../lib/hooks/useIntl';

type ModalFooterProps = {
  onOk?: () => void;
  onCancel?: () => void;
  cancelText?: string;
  okText?: string;
  htmlType?: 'button' | 'submit';
  okBtnProps?: any;
  cancelBtnProps?: any;
  loading?: boolean;
  style?: React.CSSProperties;
  showOkBtn?: boolean;
  showCancelBtn?: boolean;
  extra?: React.ReactNode;
  form?: any;
  description?: React.ReactNode;
  styles?: {
    wrapper?: React.CSSProperties;
  };
};

const Wrapper = styled.div`
  display: flex;
  justify-content: space-between;
  align-items: center;
  /* Across-group: the description/extra slot on the left vs the button group on
     the right. Has to stay clearly wider than the 16 inside the button group,
     which 20 no longer was. */
  gap: 24px;
`;

const ModalFooter: React.FC<ModalFooterProps> = ({
  onOk,
  onCancel,
  cancelText,
  okText,
  okBtnProps,
  cancelBtnProps,
  loading,
  htmlType = 'button',
  style,
  showOkBtn = true,
  styles,
  description,
  extra,
  showCancelBtn = true,
  form
}) => {
  const intl = useIntl();
  return (
    <Wrapper style={{ ...styles?.wrapper }}>
      <div>{description}</div>
      {/* 16. At the old 20 the pair read as two loose objects — that equalled
          the Wrapper's across-group gap and about matched the 24 a footer sits
          off the dialog wall, so nothing said the two buttons belonged
          together. 12 groups them harder but this same footer is what
          DeleteModal and every FormDrawer render, and there the primary is
          irreversible: separation between a destructive button and its Cancel
          is worth more than the last bit of grouping. 16 against the Wrapper's
          24 keeps within-group clearly tighter than across-group either way. */}
      <Space size={16} style={{ ...style }}>
        {showCancelBtn && (
          <Button
            onClick={onCancel}
            style={{ width: '88px' }}
            {...cancelBtnProps}
          >
            {cancelText || intl.formatMessage({ id: 'common.button.cancel' })}
          </Button>
        )}
        {extra}
        {showOkBtn && (
          <Button
            type="primary"
            onClick={onOk}
            style={{ width: '88px' }}
            loading={loading}
            htmlType={htmlType}
            {...okBtnProps}
          >
            {okText || intl.formatMessage({ id: 'common.button.save' })}
          </Button>
        )}
      </Space>
    </Wrapper>
  );
};

export default ModalFooter;
