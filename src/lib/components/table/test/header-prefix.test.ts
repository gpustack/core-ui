import { Checkbox } from 'antd';
import { isValidElement, type ReactElement, type ReactNode } from 'react';
import { describe, expect, it, vi } from 'vitest';

// HeaderPrefix's only hook. Stubbing it makes the component a plain function of
// its props, so the tests below can call it directly and inspect the element
// tree it returns — no DOM, matching this package's `environment: 'node'` setup.
vi.mock('../../../hooks/useIntl', () => {
  const useIntl = () => ({
    formatMessage: ({ id }: { id: string }) => id,
    locale: 'en-US'
  });
  return { useIntl, default: useIntl };
});

const { default: HeaderPrefix } = await import('../components/header-prefix');

// The header prefix nests at most two levels (wrapper > [span, Checkbox]), but
// walk the whole tree so the search doesn't depend on that shape.
const findCheckbox = (node: ReactNode): ReactElement | null => {
  if (Array.isArray(node)) {
    for (const child of node) {
      const found = findCheckbox(child);
      if (found) return found;
    }
    return null;
  }
  if (!isValidElement(node)) return null;
  if (node.type === Checkbox) return node;
  return findCheckbox((node.props as { children?: ReactNode }).children);
};

const render = (props: Parameters<typeof HeaderPrefix>[0]) =>
  HeaderPrefix(props) as ReactElement | null;

const selectionProps = {
  hasColumns: true,
  enableSelection: true,
  onSelectAll: vi.fn(),
  selectAll: true,
  indeterminate: false,
  disabled: false,
  prefixWidth: 40
};

describe('HeaderPrefix', () => {
  // The regression: this branch used to render a bare `<Checkbox disabled />`.
  // Uncontrolled and unwired, it ticked on click and selected nothing — every
  // table with `rowSelection` but no `expandable` had a dead select-all.
  it('wires the select-all checkbox when selection is on without expansion', () => {
    const checkbox = findCheckbox(render(selectionProps));

    expect(checkbox).not.toBeNull();
    expect(checkbox!.props).toMatchObject({
      onChange: selectionProps.onSelectAll,
      checked: true,
      indeterminate: false,
      disabled: false
    });
  });

  it('forwards the indeterminate and disabled states on that same branch', () => {
    const checkbox = findCheckbox(
      render({
        ...selectionProps,
        selectAll: false,
        indeterminate: true,
        disabled: true
      })
    );

    expect(checkbox!.props).toMatchObject({
      checked: false,
      indeterminate: true,
      disabled: true
    });
  });

  // The branch that was already correct — kept so the two stay in step.
  it('wires the checkbox identically when expansion is also on', () => {
    const checkbox = findCheckbox(
      render({ ...selectionProps, expandable: true })
    );

    expect(checkbox!.props).toMatchObject({
      onChange: selectionProps.onSelectAll,
      checked: true,
      indeterminate: false,
      disabled: false
    });
  });

  it('renders no checkbox when selection is off', () => {
    expect(
      findCheckbox(render({ hasColumns: true, expandable: true }))
    ).toBeNull();
    expect(render({ hasColumns: true })).toBeNull();
  });

  it('renders nothing before the columns are known', () => {
    expect(render({ ...selectionProps, hasColumns: false })).toBeNull();
  });
});
