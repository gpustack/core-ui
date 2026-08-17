import classNames from 'classnames';
import { startTransition, useEffect, useMemo, useState } from 'react';
import styled from 'styled-components';
import CopyButton from '../copy-button';
import {
  getCommonHighlighter,
  getFullHighlighter,
  loadFullHighlighter,
  warnUnknownLanguage
} from './highlighter';
import { escapeHtml } from './utils';

interface CodeViewerProps {
  code: string;
  copyValue?: string;
  lang: string;
  autodetect?: boolean;
  ignoreIllegals?: boolean;
  copyable?: boolean;
  height?: string | number;
  theme?: 'light' | 'dark';
  style?: React.CSSProperties;
  xScrollable?: boolean;
}

interface CodeHeaderProps {
  copyValue?: string;
  copyable?: boolean;
  lang: string;
  theme: 'light' | 'dark';
}

const CodeHeaderWrapper = styled.div`
  display: flex;
  justify-content: space-between;
  align-items: center;
  height: 32px;
  padding: 0 12px;
  font-size: 12px;
  color: var(--ant-color-text-tertiary);
  background-color: #fafafa;
  border-top-left-radius: 4px;
  border-top-right-radius: 4px;
  &.dark {
    background-color: var(--color-editor-header-bg);
    color: rgba(255, 255, 255, 0.65);
  }
`;

const Wrapper = styled.div`
  border-radius: var(--border-radius-mini);
  &:hover {
    .custome-scrollbar {
      &::-webkit-scrollbar-thumb {
        background-color: var(--color-scrollbar-thumb);
        border-radius: 4px;
      }
    }
  }
`;

const CodeHeader: React.FC<CodeHeaderProps> = ({
  copyValue,
  lang,
  theme,
  copyable
}) => {
  if (!copyable) {
    return null;
  }
  return (
    <CodeHeaderWrapper
      className={classNames({
        dark: theme === 'dark',
        light: theme === 'light'
      })}
    >
      <span>{lang}</span>
      <CopyButton
        text={copyValue || ''}
        size="small"
        style={{
          color: '#abb2bf',
          backgroundColor: theme === 'dark' ? 'transparent' : '#fff'
        }}
      ></CopyButton>
    </CodeHeaderWrapper>
  );
};

const CodeViewer: React.FC<CodeViewerProps> = (props) => {
  const {
    code = '',
    copyValue,
    lang,
    autodetect = true,
    ignoreIllegals = true,
    copyable = true,
    height = 'auto',
    style,
    xScrollable = false
  } = props || {};

  // Flips once the full build lands, to re-run the highlight below.
  const [fullLoaded, setFullLoaded] = useState(() => !!getFullHighlighter());
  const hljs = (fullLoaded && getFullHighlighter()) || getCommonHighlighter();

  const autodetectLang = autodetect && !lang;
  // Autodetection scores every registered language, so it only means something
  // against the full build.
  const needsFullHighlighter =
    !fullLoaded && (autodetectLang || !hljs.getLanguage(lang));

  useEffect(() => {
    if (!needsFullHighlighter) {
      return;
    }
    let alive = true;
    loadFullHighlighter()
      .then(() => {
        if (alive) {
          // A long document can hold many code blocks — let React interrupt
          // the re-highlight instead of committing them in one blocking pass.
          startTransition(() => setFullLoaded(true));
        }
      })
      .catch(() => {
        // The block is already readable as plain text; nothing to degrade to.
      });
    return () => {
      alive = false;
    };
  }, [needsFullHighlighter]);

  const highlightedCode = useMemo(() => {
    const cannotDetectLanguage = !autodetectLang && !hljs.getLanguage(lang);
    // `hljs` carries the block's padding and overflow rules, so it stays on
    // even in the plain-text fallback — dropping it would resize the block
    // when the full build arrives.
    const className = cannotDetectLanguage ? 'hljs' : `hljs ${lang}`;

    // No idea what language to use, return raw code
    if (cannotDetectLanguage) {
      if (fullLoaded) {
        warnUnknownLanguage(lang);
      }
      return {
        value: escapeHtml(code),
        className: className
      };
    }

    if (autodetectLang) {
      const result = hljs.highlightAuto(code);
      return {
        value: result.value,
        className: className
      };
    }
    const result = hljs.highlight(code, {
      language: lang,
      ignoreIllegals: true
    });
    return {
      value: result.value,
      className: className
    };
  }, [code, lang, autodetectLang, hljs, fullLoaded]);

  return (
    <Wrapper>
      <CodeHeader
        copyValue={copyValue || code || ''}
        lang={lang}
        copyable={copyable}
        theme={props.theme || 'light'}
      ></CodeHeader>
      <pre
        className={classNames(
          'code-pre custome-scrollbar custom-scrollbar-horizontal ',
          {
            dark: props.theme === 'dark',
            light: props.theme === 'light',
            'x-scrollable': xScrollable
          }
        )}
        style={{
          marginBottom: 0,
          height: height,
          ...style
        }}
      >
        <code
          style={{
            minHeight: height,
            ...(xScrollable ? { width: 'max-content' } : {})
          }}
          className={classNames(highlightedCode.className, {
            dark: props.theme === 'dark',
            light: props.theme === 'light'
          })}
          dangerouslySetInnerHTML={{
            __html: highlightedCode.value
          }}
        ></code>
      </pre>
    </Wrapper>
  );
};

export default CodeViewer;
