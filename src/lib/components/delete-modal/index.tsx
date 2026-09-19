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
  'delete-modal-content': css`
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
  // Read from the theme rather than the `--ant-color-warning` CSS var:
  // antd derives the component's own hover / focus colours from these
  // token values, and it can't compute anything from a `var()` string.
  const { token } = theme.useToken();
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
        container: {
          borderRadius: 'var(--border-radius-modal)'
        },
        footer: {
          marginTop: '20px'
        }
      }}
      footer={
        // 16, matching ModalFooter. This dialog is the reason it is not tighter:
        // the primary here deletes, so Cancel needs room from it.
        //
        // No `size`: the app runs inside `componentSize="large"`, so these
        // inherit 40px / radius 6 like every other dialog's actions. They used
        // to opt out to `middle`, which left the one irreversible confirmation
        // in the product wearing its smallest action buttons, and put a radius
        // of 4 inside a 12 modal — the widest nesting jump anywhere here.
        //
        // `minWidth`, not ModalFooter's fixed `width: 88`: `okText` comes from
        // the caller and already includes 'Reset to default' and
        // 'Delete (Recreate)'. Short labels land on the same 88 either way;
        // long ones grow instead of breaking. It also equalises the pair —
        // left to their natural widths, Cancel and Delete differ by 2.6px,
        // which reads as a mistake rather than as a size.
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
          {/* The checkbox gates a destructive confirmation, so it ticks
              warning-coloured rather than in the app's primary colour.
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

export default DeleteModal;
