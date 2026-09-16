import classNames from 'classnames';
import React from 'react';
import styles from './index.module.less';

interface SectionTitleProps extends React.HTMLAttributes<HTMLDivElement> {
  children?: React.ReactNode;
  /**
   * Inline action beside the title — most often a `type="link"` add button for
   * an append-list section.
   */
  extra?: React.ReactNode;
}

/**
 * The heading above a group of fields or a block of content.
 *
 * This exists because there was no shared one, and pages invented their own:
 * several local `SectionTitle`s, a `SubTitle`, a `GroupTitle`, a
 * `TitleWrapper`, and a long tail of one-off `font-weight: 600` / `700` rules.
 * That is why group titles differed from page to page — and why fixing them one
 * at a time would not hold.
 *
 * Weight is fixed at `medium` (500), matching the page title and the drawer
 * title. If a section needs more emphasis than its neighbours, give it more
 * space or a rule above it — not more weight.
 */
const SectionTitle: React.FC<SectionTitleProps> = ({
  children,
  extra,
  className,
  ...rest
}) => {
  return (
    <div className={classNames(styles['section-title'], className)} {...rest}>
      <span>{children}</span>
      {extra && <span className={styles.extra}>{extra}</span>}
    </div>
  );
};

export default SectionTitle;
