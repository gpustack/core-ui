import { DeleteOutlined } from '@ant-design/icons';
import { Button, Input, Tooltip } from 'antd';
import { forwardRef } from 'react';
import styled from 'styled-components';
import { useIntl } from '../../hooks/useIntl';

const ImgInputWrapper = styled.div`
  position: relative;
  .del-btn {
    display: none;
    position: absolute;
    right: 8px;
    top: 50%;
    transform: translateY(-50%);
    border-radius: var(--ant-border-radius);
    background: var(--ant-color-bg-container);
  }
  &:hover {
    .del-btn {
      display: flex;
    }
  }
`;

export interface ImageURLInputProps {
  /** Whether the invalid-url tooltip / error state is shown */
  open?: boolean;
  inputProps?: Record<string, any>;
  /** Commit the typed url (fired on blur and on Enter) */
  onSubmit: (e: any) => void;
  /** Discard the url input */
  onClose: (e?: any) => void;
  onEscape: (e: any) => void;
}

const ImageURLInput = forwardRef<any, ImageURLInputProps>(
  ({ open = false, inputProps, onSubmit, onClose, onEscape }, ref) => {
    const intl = useIntl();

    return (
      <Tooltip
        open={open}
        title={intl.formatMessage({
          id: 'playground.uploadImage.url.invalid'
        })}
      >
        <ImgInputWrapper>
          <Input
            {...inputProps}
            ref={ref}
            status={open ? 'error' : ''}
            placeholder={intl.formatMessage({
              id: 'playground.uploadImage.url.holder'
            })}
            style={{ width: 360, height: 32 }}
            onBlur={onSubmit}
            onPressEnter={onSubmit}
            onKeyDown={onEscape}
          ></Input>
          <div className="del-btn">
            <Button
              onClick={onClose}
              icon={<DeleteOutlined />}
              size="small"
              type="text"
            ></Button>
          </div>
        </ImgInputWrapper>
      </Tooltip>
    );
  }
);

export default ImageURLInput;
