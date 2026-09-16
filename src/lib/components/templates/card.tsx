import classNames from 'classnames';
import React from 'react';
import styled from 'styled-components';

interface CardProps {
  height?: string | number;
  className?: string;
  children?: React.ReactNode;
  clickable?: boolean;
  ghost?: boolean;
  header?: React.ReactNode;
  footer?: React.ReactNode;
  icon?: React.ReactNode;
  active?: boolean;
  hoverable?: boolean;
  disabled?: boolean;
  onClick?: () => void;
}

const CardWrapper = styled.div.attrs({
  className: 'template-card-wrapper'
})`
  overflow: hidden;
  display: flex;
  padding: 16px 16px;
  justify-content: flex-start;
  align-items: center;
  border: 1px solid var(--ant-color-border);
  border-radius: var(--ant-border-radius-lg);
  cursor: default;
  width: 100%;
  &.clickable:hover:not(.disabled) {
    background-color: var(--ant-color-fill-tertiary);
    transition: background-color 0.2s ease;
  }

  &.hoverable:hover:not(.disabled) {
    background-color: var(--ant-color-fill-tertiary);
    transition: background-color 0.2s ease;
  }

  &.ghost {
    background-color: transparent;
  }

  &.active {
    background-color: var(--ant-color-fill-tertiary);
  }

  &.clickable:not(.disabled) {
    cursor: pointer;
  }

  // Keyboard users need to SEE the tab stop the role/tabIndex above created.
  // focus-visible rather than focus, so the ring stays off mouse clicks.
  &:focus-visible {
    outline: 2px solid var(--ant-color-primary);
    outline-offset: 2px;
  }

  &.disabled {
    cursor: default;
    opacity: 0.6;
    pointer-events: none;
    border-style: dashed;
  }
`;

const CardContent = styled.div.attrs({
  className: 'template-card-content'
})`
  width: 100%;
  flex: 1;
  color: var(--ant-color-text-tertiary);
`;

const Inner = styled.div.attrs({
  className: 'template-card-inner'
})`
  display: flex;
  width: 100%;
  flex-direction: column;
  justify-content: flex-start;
  gap: 8px;
  height: 100%;
`;

const Icon = styled.div.attrs({
  className: 'template-card-icon'
})`
  display: flex;
  align-items: center;
  margin-right: 16px;
  font-size: 32px;
`;

const Header = styled.div.attrs({
  className: 'template-card-header'
})`
  font-weight: var(--font-weight-medium);
  font-size: var(--font-size-base);
  display: flex;
  align-items: center;
  justify-content: space-between;
`;

const Card: React.FC<CardProps> = (props) => {
  const {
    className,
    height,
    children,
    clickable = true,
    ghost = false,
    header,
    footer,
    icon,
    active,
    disabled,
    hoverable,
    onClick
  } = props;

  const handleClick = () => {
    if (disabled || !clickable) return;
    onClick?.();
  };

  // A clickable card is a real control, so it has to behave like one. This is a
  // `div` (a `button` cannot legally wrap the arbitrary content a card holds,
  // including its own action buttons), which means the button role, tab stop
  // and Enter/Space activation have to be supplied by hand. Without them a card
  // grid is unreachable by keyboard — and on the backends page the card IS the
  // only route into a backend's versions, so the whole flow was closed to
  // keyboard and screen-reader users.
  const interactive = clickable && !disabled;

  const handleKeyDown = (event: React.KeyboardEvent<HTMLDivElement>) => {
    if (!interactive) return;
    if (event.key !== 'Enter' && event.key !== ' ') return;
    // Space scrolls the page by default, and Enter would re-fire on a nested
    // control that already handled it.
    if (event.target !== event.currentTarget) return;
    event.preventDefault();
    onClick?.();
  };

  return (
    <CardWrapper
      className={classNames(className, {
        clickable: clickable,
        hoverable: hoverable,
        active: active,
        disabled: disabled,
        ghost: ghost
      })}
      style={{ height: height || '180px' }}
      onClick={handleClick}
      role={interactive ? 'button' : undefined}
      tabIndex={interactive ? 0 : undefined}
      onKeyDown={interactive ? handleKeyDown : undefined}
    >
      {icon && <Icon>{icon}</Icon>}
      <Inner>
        {header && <Header>{header}</Header>}
        {children && <CardContent>{children}</CardContent>}
        {footer}
      </Inner>
    </CardWrapper>
  );
};

export default Card;
