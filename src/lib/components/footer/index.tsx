import { useIntl } from '@/lib/hooks/useIntl';
import { Button, Divider, Modal, Typography } from 'antd';
import { createStyles } from 'antd-style';
import styled from 'styled-components';

const CompanyWrapper = styled.div`
  display: flex;
  align-items: center;
  gap: 4px;
  padding-inline: 0 8px;
`;

const useStyles = createStyles(({ token, css }) => ({
  footer: css`
    bottom: 0;
    width: 100%;
    background-color: transparent;
    padding: 20px 0;
    text-align: center;
    font-size: var(--font-size-middle);
    color: ${token.colorTextTertiary};
  `,
  'footer-content-left-text': {
    display: 'flex',
    justifyContent: 'center',
    alignItems: 'center'
  }
}));

const Footer: React.FC<{
  version?: string;
  documentation: string;
  showVersion?: () => void;
}> = ({ version, documentation, showVersion }) => {
  const intl = useIntl();
  const [modal, contextHolder] = Modal.useModal();
  const { styles } = useStyles();

  const showVersionModal = () => {
    showVersion?.();
  };

  return (
    <>
      {contextHolder}
      <div className={styles.footer}>
        <div className="footer-content">
          <div className="footer-content-left">
            <div className={styles['footer-content-left-text']}>
              <CompanyWrapper>
                <span>&copy;</span>
                <span> {new Date().getFullYear()}</span>
                <Typography.Link
                  href="https://gpustack.ai"
                  target="_blank"
                  rel="noopener noreferrer"
                >
                  {intl.formatMessage({ id: 'settings.company' })}
                </Typography.Link>
              </CompanyWrapper>
              <Divider orientation="vertical" />
              <Button
                type="link"
                size="small"
                href={documentation}
                target="_blank"
              >
                {intl.formatMessage({ id: 'common.button.help' })}
              </Button>
              <Divider orientation="vertical" />
              <Button type="link" size="small" onClick={showVersion}>
                {version}
              </Button>
            </div>
          </div>
        </div>
      </div>
    </>
  );
};

export default Footer;
