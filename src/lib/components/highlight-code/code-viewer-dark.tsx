import CodeViewer from './code-viewer';
import './styles/dark.less';

interface CodeViewerProps {
  code: string;
  copyValue?: string;
  lang: string;
  autodetect?: boolean;
  ignoreIllegals?: boolean;
  copyable?: boolean;
  height?: string | number;
  style?: React.CSSProperties;
  xScrollable?: boolean;
  showHeader?: boolean;
}
const DarkViewer: React.FC<CodeViewerProps> = (props) => {
  const {
    code,
    copyValue,
    lang,
    autodetect,
    ignoreIllegals,
    copyable,
    height = 'auto',
    xScrollable = false,
    showHeader = true
  } = props || {};

  return (
    <CodeViewer
      style={props.style}
      height={height}
      code={code}
      copyValue={copyValue}
      lang={lang}
      theme="dark"
      autodetect={autodetect}
      ignoreIllegals={ignoreIllegals}
      copyable={copyable}
      xScrollable={xScrollable}
      showHeader={showHeader}
    ></CodeViewer>
  );
};

export default DarkViewer;
