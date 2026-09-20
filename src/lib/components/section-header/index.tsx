import classNames from 'classnames';
import React from 'react';
import styles from './index.module.less';

interface SectionHeaderProps extends React.HTMLAttributes<HTMLDivElement> {
  /**
   * Usually an `IconFont`. Optional, but see the note in the stylesheet: the
   * icon is what keeps this header's rule from reading as one more row
   * separator, so leave it out only in a card that has no internal dividers.
   */
  icon?: React.ReactNode;
  title: React.ReactNode;
  description?: React.ReactNode;
  /** Inline action beside the description — a preview button, a help link. */
  extra?: React.ReactNode;
}

/**
 * The heading BAR at the top of a settings card: icon, title, description and
 * a rule that closes it off.
 *
 * Distinct from `SectionTitle`, and the two are easy to confuse — the split is:
 *
 *   * `SectionTitle` — a bare heading above a group of fields, inside a form
 *     or a drawer. No container of its own, no rule, no icon.
 *   * `SectionHeader` — the top of a bordered card that holds a settings
 *     group. Carries the rule and the icon.
 *
 * Extracted because Branding, Billing Settings and Preferences each grew their
 * own: Branding's had a gradient icon chip and a description, Billing's was a
 * bare title over a rule, and Preferences kept its title outside the card
 * entirely because there was no in-card treatment that did not shout. Three
 * shapes for one role, in three tabs of the same page.
 */
const SectionHeader: React.FC<SectionHeaderProps> = ({
  icon,
  title,
  description,
  extra,
  className,
  ...rest
}) => (
  <div className={classNames(styles['section-header'], className)} {...rest}>
    {icon && <div className={styles.icon}>{icon}</div>}
    <div className={styles.body}>
      <h3 className={styles.title}>{title}</h3>
      {(description || extra) && (
        <div className={styles.description}>
          {description}
          {extra}
        </div>
      )}
    </div>
  </div>
);

export default SectionHeader;
