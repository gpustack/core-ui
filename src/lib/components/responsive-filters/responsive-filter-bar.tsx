import { createStyles } from 'antd-style';
import classNames from 'classnames';
import type { ComponentProps } from 'react';
import { FilterBar } from '../page-tools';

const useStyles = createStyles(({ css, token }) => ({
  root: css`
    gap: ${token.margin}px;
    flex-wrap: wrap;
  `,
  left: css`
    flex: 1;
    min-width: min(100%, 180px);
  `,
  right: css`
    flex-shrink: 0;
    max-width: 100%;
  `
}));

/** Allocates the space left over after the toolbar's right actions. */
const ResponsiveFilterBar = ({
  classNames: customClassNames,
  ...props
}: ComponentProps<typeof FilterBar>) => {
  const { styles } = useStyles();
  return (
    <FilterBar
      {...props}
      classNames={{
        root: classNames(styles.root, customClassNames?.root),
        left: classNames(styles.left, customClassNames?.left),
        right: classNames(styles.right, customClassNames?.right)
      }}
    />
  );
};

export default ResponsiveFilterBar;
