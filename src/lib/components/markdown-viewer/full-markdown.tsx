import { sanitizeUrl } from '@braintree/sanitize-url';
// NOTE: KaTeX stylesheet is intentionally NOT imported here.
// Vite library mode base64-inlines all CSS url() assets, so importing
// 'katex/dist/katex.min.css' would bake ~1.4MB of fonts into the shared
// index.css and block first paint on every page. Consumers that render
// math must import 'katex/dist/katex.min.css' themselves, lazily, in the
// route/component where FullMarkdown is used.
import React, { useMemo } from 'react';
import ReactMarkdown from 'react-markdown';
import rehypeKatex from 'rehype-katex';
import remarkBreaks from 'remark-breaks';
import remarkGfm from 'remark-gfm';
import remarkMath from 'remark-math';
import styled from 'styled-components';
import HighlightCode from '../highlight-code';
import './index.less';
import { escapeBrackets, escapeDollarNumber, escapeMhchem } from './utils';

interface FullMarkdownProps {
  content: string;
  theme?: 'light' | 'dark';
}

const Wrapper = styled.div.attrs(() => ({
  className: 'markdown-viewer'
}))``;

const CodeViewer = (props: any) => {
  const { children, className, node, theme, ...rest } = props;
  const match = /language-(\w+)/.exec(className || '');
  return match ? (
    <HighlightCode code={children} lang={match[1]} theme={theme} />
  ) : (
    <code {...rest} className={className}>
      {children}
    </code>
  );
};

const FullMarkdown: React.FC<FullMarkdownProps> = ({ content, theme }) => {
  const escapedContent = useMemo(() => {
    return escapeMhchem(escapeBrackets(escapeDollarNumber(content)));
  }, [content]);

  return (
    <Wrapper>
      <ReactMarkdown
        remarkPlugins={[[remarkMath], remarkGfm, remarkBreaks]}
        rehypePlugins={[rehypeKatex]}
        components={{
          code(props) {
            return <CodeViewer {...props} theme={theme}></CodeViewer>;
          },
          a: ({ href, children, ...props }) => (
            <a
              href={sanitizeUrl(href)}
              {...props}
              target="_blank"
              rel="noopener noreferrer"
            >
              {children}
            </a>
          )
        }}
      >
        {escapedContent}
      </ReactMarkdown>
    </Wrapper>
  );
};

export default FullMarkdown;
