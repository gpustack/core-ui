import { Radio } from 'antd';
import { createStyles } from 'antd-style';
import React from 'react';

export interface CardRadioOption<T extends string | number = string> {
  label: React.ReactNode;
  value: T;
  description?: React.ReactNode;
  disabled?: boolean;
  // Optional corner badge (e.g. an "Experimental" tag). Pass any node —
  // a ThemeTag / antd Tag / plain text — pinned to the card's top-right.
  badge?: React.ReactNode;
}

// Styleable DOM slots. `root` is the group container, `card` each
// option box, and `radio`/`content`/`title`/`description`/`badge` the
// pieces inside a card.
export type CardRadioSlot =
  | 'root'
  | 'card'
  | 'radio'
  | 'content'
  | 'title'
  | 'description'
  | 'badge';

export interface CardRadioGroupProps<T extends string | number = string> {
  // Injected by Form.Item (value/onChange). Standalone use works too.
  value?: T;
  onChange?: (value: T) => void;
  options?: CardRadioOption<T>[];
  disabled?: boolean;
  // Cards share the row equally by default. Set a number to lay them out
  // in a fixed-column grid instead (useful when there are many options).
  columns?: number;
  className?: string;
  // Per-slot overrides, following antd's semantic-DOM API: inline styles
  // via `styles`, extra class names via `classNames`. Both merge with
  // (and win over) the component's own styling.
  styles?: Partial<Record<CardRadioSlot, React.CSSProperties>>;
  classNames?: Partial<Record<CardRadioSlot, string>>;
}

const useStyles = createStyles(({ css, token }) => ({
  group: css`
    display: flex;
    gap: 16px;
    width: 100%;
  `,
  grid: css`
    display: grid;
    gap: 16px;
    width: 100%;
  `,
  card: css`
    position: relative;
    flex: 1;
    min-width: 0;
    display: flex;
    align-items: flex-start;
    gap: 8px;
    padding: 12px 16px;
    border: 1px solid ${token.colorBorder};
    border-radius: ${token.borderRadiusLG}px;
    background-color: ${token.colorBgContainer};
    cursor: pointer;
    transition:
      border-color 0.2s,
      background-color 0.2s;

    &:hover {
      border-color: ${token.colorPrimaryHover};
    }
  `,
  cardActive: css`
    border-color: ${token.colorPrimary};
    background-color: ${token.colorPrimaryBg};

    &:hover {
      border-color: ${token.colorPrimary};
    }
  `,
  cardDisabled: css`
    cursor: not-allowed;
    opacity: 0.6;

    &:hover {
      border-color: ${token.colorBorder};
    }
  `,
  radio: css`
    /* Strip the wrapper's trailing margin so the flex gap owns the
       spacing. */
    margin-top: 0px;
    margin-inline-end: 0;
    pointer-events: none;

    .ant-radio {
      border-width: 1.5px;
    }
  `,
  content: css`
    display: flex;
    flex-direction: column;
    gap: 4px;
    min-width: 0;
  `,
  title: css`
    font-weight: 500;
    line-height: 1.4;
    color: ${token.colorText};
  `,
  desc: css`
    font-size: 12px;
    line-height: 1.5;
    color: ${token.colorTextSecondary};
  `,
  badge: css`
    position: absolute;
    top: 8px;
    right: 8px;
    /* Let the card own the click; the badge is decorative. */
    pointer-events: none;
  `
}));

// A radio group rendered as selectable cards: each option shows a radio
// dot, a title, and an optional description, with the whole card
// clickable. Binds through `value`/`onChange`, so it drops into a
// `Form.Item` in place of an antd `Radio.Group`.
function CardRadioGroup<T extends string | number = string>(
  props: CardRadioGroupProps<T>
) {
  const {
    value,
    onChange,
    options = [],
    disabled,
    columns,
    className,
    styles: slotStyles,
    classNames: slotClassNames
  } = props;
  const { styles: classes, cx } = useStyles();

  const handleSelect = (option: CardRadioOption<T>) => {
    if (disabled || option.disabled || option.value === value) return;
    onChange?.(option.value);
  };

  return (
    <div
      role="radiogroup"
      className={cx(
        columns ? classes.grid : classes.group,
        className,
        slotClassNames?.root
      )}
      style={{
        ...(columns
          ? { gridTemplateColumns: `repeat(${columns}, minmax(0, 1fr))` }
          : undefined),
        ...slotStyles?.root
      }}
    >
      {options.map((option) => {
        const checked = option.value === value;
        const isDisabled = disabled || option.disabled;
        return (
          <div
            key={option.value}
            role="radio"
            aria-checked={checked}
            aria-disabled={isDisabled}
            tabIndex={isDisabled ? -1 : 0}
            className={cx(
              classes.card,
              {
                [classes.cardActive]: checked,
                [classes.cardDisabled]: isDisabled
              },
              slotClassNames?.card
            )}
            style={slotStyles?.card}
            onClick={() => handleSelect(option)}
            onKeyDown={(e) => {
              if (e.key === 'Enter' || e.key === ' ') {
                e.preventDefault();
                handleSelect(option);
              }
            }}
          >
            {option.badge != null && (
              <div
                className={cx(classes.badge, slotClassNames?.badge)}
                style={slotStyles?.badge}
              >
                {option.badge}
              </div>
            )}
            <Radio
              checked={checked}
              disabled={isDisabled}
              className={cx(classes.radio, slotClassNames?.radio)}
              style={slotStyles?.radio}
              onChange={() => {}}
            />
            <div
              className={cx(classes.content, slotClassNames?.content)}
              style={slotStyles?.content}
            >
              <div
                className={cx(classes.title, slotClassNames?.title)}
                style={slotStyles?.title}
              >
                {option.label}
              </div>
              {option.description != null && (
                <div
                  className={cx(classes.desc, slotClassNames?.description)}
                  style={slotStyles?.description}
                >
                  {option.description}
                </div>
              )}
            </div>
          </div>
        );
      })}
    </div>
  );
}

export default CardRadioGroup;
