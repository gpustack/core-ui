import { ExclamationCircleFilled } from '@ant-design/icons';
import {
  Button,
  Checkbox,
  Modal,
  Space,
  message,
  type ModalFuncProps
} from 'antd';
import { createStyles } from 'antd-style';
import { forwardRef, useImperativeHandle, useState } from 'react';
import styled from 'styled-components';
import useBodyScroll from '../../../lib/hooks/use-body-scroll';
import { useIntl } from '../../../lib/hooks/useIntl';

const useStyles = createStyles(({ css }) => ({
  'delete-modal-content': css`
    display: flex;
    font-size: var(--font-size-middle);
    .anticon {
      font-size: 20px;
      margin-right: 10px;
      color: var(--ant-color-warning);
    }
    .title {
      display: flex;
      align-items: center;
      font-weight: var(--font-weight-500);
    }
  `,
  content: css`
    padding-top: 15px;
    padding-left: 30px;
    color: var(--ant-color-text-secondary);
    white-space: pre-line;
    word-break: normal;
    overflow-wrap: break-word;
    hyphens: auto;
    span {
      color: var(--ant-color-text);
      display: flex;
      margin-top: 8px;
    }
  `,
  checkboxWrapper: css`
    margin-top: 20px;
    margin-left: 30px;
    display: flex;
    justify-content: flex-start;
    align-items: center;
    .check-text {
      font-weight: 700;
      color: var(--ant-color-warning);
    }
  `
}));

const CheckboxWrapper = styled.div`
  margin-top: 20px;
  margin-left: 30px;
  display: flex;
  justify-content: flex-start;
  align-items: center;
  .check-text {
    font-weight: 700;
    color: var(--ant-color-warning);
  }
`;

export interface DeleteModalOptions {
  content?: string;
  selection?: boolean;
  name?: string;
  okText?: string;
  cancelText?: string;
  title?: string;
  operation: string;
  tips?: React.ReactNode;
  checkConfig?: {
    checkText: string;
    defautlChecked: boolean;
  };
  // Footer controls. The dialog defaults to a delete confirmation — Cancel
  // plus a danger primary OK — so callers reusing it for a softer action
  // (a revert, an acknowledge-only notice) can drop a button or restyle it.
  //
  // `okButtonProps` / `cancelButtonProps` come from `ModalFuncProps` and are
  // spread over the defaults, so `{ danger: false }` un-reds the OK button.
  // `onClick` and the OK button's `loading` stay owned by the component.
  showOk?: boolean;
  showCancel?: boolean;
}

interface Configuration {
  checked: boolean;
}

// default need to pass content and operation
const DeleteModal = forwardRef((props, ref) => {
  const intl = useIntl();
  const { styles } = useStyles();
  const { saveScrollHeight, restoreScrollHeight } = useBodyScroll();
  const [visible, setVisible] = useState(false);
  const [configuration, setConfiguration] = useState<Configuration>({
    checked: false
  });
  const [delLoading, setDelLoading] = useState(false);
  const [config, setConfig] = useState<ModalFuncProps & DeleteModalOptions>(
    {} as any
  );

  const show = (data: ModalFuncProps & DeleteModalOptions) => {
    saveScrollHeight();
    setConfig(data);
    setConfiguration({
      checked: data.checkConfig?.defautlChecked || false
    });
    setVisible(true);
  };

  const hide = () => {
    setVisible(false);
    restoreScrollHeight();
  };

  const handleCancel = () => {
    setVisible(false);
    config.onCancel?.();
    restoreScrollHeight();
  };

  const handleOk = async () => {
    try {
      setDelLoading(true);
      const res = await config.onOk?.();
      const isArray = Array.isArray(res);
      if (isArray) {
        const allSuccess = res.every(
          (item: any) => item?.status === 'fulfilled'
        );
        if (allSuccess) {
          message.success(intl.formatMessage({ id: 'common.message.success' }));
        }
      } else {
        message.success(intl.formatMessage({ id: 'common.message.success' }));
      }
    } catch (error) {
      // Handle error if needed
    } finally {
      setVisible(false);
      setDelLoading(false);
      restoreScrollHeight();
    }
  };

  useImperativeHandle(ref, () => ({
    show,
    hide,
    configuration
  }));

  return (
    <Modal
      style={{
        top: '20%'
      }}
      open={visible}
      onOk={handleOk}
      onCancel={handleCancel}
      destroyOnHidden={false}
      closeIcon={false}
      mask={{
        closable: false
      }}
      keyboard={false}
      width={460}
      styles={{
        footer: {
          marginTop: '20px'
        }
      }}
      footer={
        <Space size={20}>
          {config.showCancel !== false && (
            <Button
              size="middle"
              {...config.cancelButtonProps}
              onClick={handleCancel}
            >
              {config.cancelText
                ? intl.formatMessage({ id: config.cancelText })
                : intl.formatMessage({ id: 'common.button.cancel' })}
            </Button>
          )}
          {config.showOk !== false && (
            <Button
              type="primary"
              size="middle"
              danger
              {...config.okButtonProps}
              onClick={handleOk}
              loading={delLoading}
            >
              {config.okText
                ? intl.formatMessage({ id: config.okText })
                : intl.formatMessage({ id: 'common.button.delete' })}
            </Button>
          )}
        </Space>
      }
    >
      <div className={styles['delete-modal-content']}>
        <span className="title">
          <ExclamationCircleFilled />
          <span>
            {config.title
              ? intl.formatMessage({ id: config.title })
              : intl.formatMessage({ id: 'common.title.delete.confirm' })}
          </span>
        </span>
      </div>
      <div
        className={styles['content']}
        dangerouslySetInnerHTML={{
          __html: config.content
            ? intl.formatMessage(
                {
                  id: config.operation || ''
                },
                {
                  type: intl.formatMessage({ id: config.content }),
                  name: config.name
                }
              )
            : ''
        }}
      ></div>
      {config.checkConfig && (
        <div className={styles.checkboxWrapper}>
          <Checkbox
            checked={configuration.checked}
            onChange={(e) =>
              setConfiguration({
                checked: e.target.checked
              })
            }
          >
            <span className="check-text">
              {intl.formatMessage({ id: config.checkConfig?.checkText })}
            </span>
          </Checkbox>
        </div>
      )}
      {config.tips && (
        <div className={styles.checkboxWrapper}>
          <span className="check-text">{config.tips}</span>
        </div>
      )}
    </Modal>
  );
});

export default DeleteModal;
