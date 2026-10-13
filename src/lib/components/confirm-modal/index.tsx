import { ExclamationCircleFilled } from '@ant-design/icons';
import {
  Button,
  Checkbox,
  ConfigProvider,
  Modal,
  Space,
  message,
  theme,
  type ModalFuncProps
} from 'antd';
import { createStyles } from 'antd-style';
import { forwardRef, useImperativeHandle, useState } from 'react';
import useBodyScroll from '../../../lib/hooks/use-body-scroll';
import { useIntl } from '../../../lib/hooks/useIntl';

const useStyles = createStyles(({ css }) => ({
  'confirm-modal-content': css`
    display: flex;
    font-size: var(--font-size-base);
    /* The semantic warning colour, NOT --color-status-warning-text.
       That step is solved for 12px TEXT sitting on the warning TINT; this is a
       28px filled GRAPHIC on the modal's own surface, so the step was tuned for
       neither the size, the role, nor the background — it rendered a muddy
       #ad4e00 at 5.43:1 where a warning glyph wants to be vivid.
       It also disagreed with the rest of this very component, which already
       themes its buttons from token.colorWarning.
       3:1 does not bind here: the icon sits beside a title that states the
       action in words, so it reinforces rather than carries. Same call as
       StatusDot. */
    .anticon {
      font-size: 28px;
      margin-right: 12px;
      color: var(--ant-color-warning);
    }
    .title {
      display: flex;
      align-items: center;
      font-weight: var(--font-weight-medium);
      font-size: var(--font-size-large);
    }
  `,
  content: css`
    padding-top: 20px;
    color: var(--ant-color-text-secondary);
    white-space: pre-line;
    word-break: normal;
    overflow-wrap: break-word;
    hyphens: auto;
    > span {
      color: var(--ant-color-text);
      display: flex;
      margin-top: 16px;
      background-color: var(--ant-color-fill-tertiary);
      padding: 8px 12px;
      border-radius: var(--ant-border-radius);
    }
  `,
  checkboxWrapper: css`
    margin-top: 20px;
    display: flex;
    justify-content: flex-start;
    align-items: center;
    .check-text {
      font-weight: 500;
      width: 100%;
    }
  `
}));

export interface ConfirmModalOptions {
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
  // Footer controls can hide or restyle either action. The component owns
  // button onClick handlers and the OK button loading state.
  showOk?: boolean;
  showCancel?: boolean;
  showSuccess?: boolean;
}

interface Configuration {
  checked: boolean;
}

export interface ConfirmModalRef {
  show: (data: ModalFuncProps & ConfirmModalOptions) => void;
  hide: () => void;
  configuration: Configuration;
}

interface ConfirmModalDefaults {
  title: string;
  okText: string;
  danger: boolean;
  showSuccess: boolean;
}

// Shared by the neutral confirmation and the legacy delete adapter.
export const createConfirmModal = (defaultOptions: ConfirmModalDefaults) =>
  forwardRef<ConfirmModalRef>((_props, ref) => {
    const intl = useIntl();
    const { styles } = useStyles();
    // Read from the theme rather than the `--ant-color-warning` CSS var:
    // antd derives the component's own hover / focus colours from these
    // token values, and it can't compute anything from a `var()` string.
    const { token } = theme.useToken();
    const { saveScrollHeight, restoreScrollHeight } = useBodyScroll();
    const [visible, setVisible] = useState(false);
    const [configuration, setConfiguration] = useState<Configuration>({
      checked: false
    });
    const [loading, setLoading] = useState(false);
    const [config, setConfig] = useState<
      Partial<ModalFuncProps & ConfirmModalOptions>
    >({});

    const show = (data: ModalFuncProps & ConfirmModalOptions) => {
      saveScrollHeight();
      setConfig({
        ...data,
        showSuccess: data.showSuccess ?? defaultOptions.showSuccess,
        okButtonProps: {
          danger: defaultOptions.danger,
          ...data.okButtonProps
        }
      });
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
        setLoading(true);
        const res = await config.onOk?.();
        const allSuccess =
          !Array.isArray(res) ||
          res.every((item: any) => item?.status === 'fulfilled');
        if (config.showSuccess && allSuccess) {
          message.success(intl.formatMessage({ id: 'common.message.success' }));
        }
      } catch (error) {
        // Handle error if needed
      } finally {
        setVisible(false);
        setLoading(false);
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
          container: {
            borderRadius: 'var(--border-radius-modal)'
          },
          footer: {
            marginTop: '20px'
          }
        }}
        footer={
          // Match ModalFooter spacing and inherit the app's button size.
          // A minimum width keeps short labels aligned while longer actions grow.
          <Space size={16}>
            {config.showCancel !== false && (
              <Button
                style={{ minWidth: 88 }}
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
                style={{ minWidth: 88 }}
                {...config.okButtonProps}
                onClick={handleOk}
                loading={loading}
              >
                {config.okText
                  ? intl.formatMessage({ id: config.okText })
                  : intl.formatMessage({ id: defaultOptions.okText })}
              </Button>
            )}
          </Space>
        }
      >
        <div className={styles['confirm-modal-content']}>
          <span className="title">
            <ExclamationCircleFilled />
            <span>
              {config.title
                ? intl.formatMessage({ id: config.title })
                : intl.formatMessage({ id: defaultOptions.title })}
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
            {/* Confirmation checkboxes retain the warning colour used by
              destructive actions.
              Done by remapping the component's primary tokens instead of
              overriding `.ant-checkbox-*` selectors: antd 6 dropped
              `.ant-checkbox-inner` and moved those styles onto
              `.ant-checkbox`, and the token route survives that kind of
              rename — it also covers hover / focus-ring in one go. */}
            <ConfigProvider
              theme={{
                components: {
                  Checkbox: {
                    colorPrimary: token.colorWarning,
                    colorPrimaryHover: token.colorWarningHover,
                    colorPrimaryBorder: token.colorWarningBorder,
                    // The tick itself: antd draws it with `colorWhite`, so
                    // that is the token to remap to get body-text colour.
                    colorWhite: token.colorText
                  }
                }
              }}
            >
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
            </ConfigProvider>
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

const ConfirmModal = createConfirmModal({
  title: 'common.button.confirm',
  okText: 'common.button.confirm',
  danger: false,
  showSuccess: false
});

export default ConfirmModal;
