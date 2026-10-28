// @vitest-environment jsdom

import { ConfigProvider } from 'antd';
import { act, createElement, type ComponentProps } from 'react';
import { createRoot, type Root } from 'react-dom/client';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import DropdownButtons from '../index';

const mocks = vi.hoisted(() => ({
  access: {} as Record<string, boolean>,
  formatMessage: vi.fn(({ id }: { id: string }) => {
    if (!id) throw new Error('Only actions have message ids');
    return id;
  })
}));

vi.mock('../../../hooks/useIntl', () => ({
  useIntl: () => ({ formatMessage: mocks.formatMessage })
}));
vi.mock('../../../hooks/useAccess', () => ({
  default: () => mocks.access
}));

type Items = ComponentProps<typeof DropdownButtons>['items'];
const divider = { type: 'divider' as const };
const action = (key: string) => ({ key, label: key, locale: false });
const onSelect = vi.fn();
let root: Root;
let container: HTMLDivElement;

const render = (items: Items) => {
  act(() => {
    root.render(
      createElement(
        ConfigProvider,
        { theme: { token: { motion: false } } },
        createElement(DropdownButtons, {
          items,
          trigger: ['click'],
          onSelect
        })
      )
    );
  });
};

const openMenu = async () => {
  const more = container.querySelector<HTMLButtonElement>(
    'button[aria-label="common.button.more"]'
  );
  expect(more).not.toBeNull();
  await act(async () => more!.click());
  const menu = document.querySelector<HTMLElement>('[role="menu"]');
  expect(menu).not.toBeNull();
  return menu!;
};

const menuEntries = (menu: HTMLElement) =>
  Array.from(
    menu.querySelectorAll('[role="menuitem"], [role="separator"]')
  ).map((item) =>
    item.getAttribute('role') === 'separator' ? 'divider' : item.textContent
  );

beforeEach(() => {
  vi.clearAllMocks();
  mocks.access = {};
  (globalThis as any).IS_REACT_ACT_ENVIRONMENT = true;
  vi.stubGlobal(
    'ResizeObserver',
    class {
      observe() {}
      unobserve() {}
      disconnect() {}
    }
  );
  const getComputedStyle = window.getComputedStyle;
  vi.spyOn(window, 'getComputedStyle').mockImplementation((element) =>
    getComputedStyle(element)
  );
  container = document.createElement('div');
  document.body.appendChild(container);
  root = createRoot(container);
});

afterEach(() => {
  act(() => root.unmount());
  container.remove();
  vi.restoreAllMocks();
  vi.unstubAllGlobals();
  delete (globalThis as any).IS_REACT_ACT_ENVIRONMENT;
});

describe('DropdownButtons divider groups', () => {
  it('renders flat groups with native separators and selects the original action once', async () => {
    const deleteItem = {
      ...action('delete'),
      props: { danger: true },
      onClick: vi.fn()
    };
    const primary = { key: 'edit', label: 'common.button.edit' };
    render([
      primary,
      action('view logs'),
      action('download logs'),
      { ...divider, key: 'danger-divider' },
      deleteItem
    ]);
    act(() => container.querySelector('button')!.click());
    expect(onSelect).toHaveBeenCalledExactlyOnceWith('edit', primary);
    onSelect.mockClear();

    const menu = await openMenu();
    expect(menuEntries(menu)).toEqual([
      'view logs',
      'download logs',
      'divider',
      'delete'
    ]);
    expect(menu.querySelector('.ant-dropdown-menu-submenu')).toBeNull();
    expect(
      mocks.formatMessage.mock.calls.every(([message]) => !!message.id)
    ).toBe(true);
    await act(async () =>
      menu.querySelector<HTMLElement>('[role="separator"]')!.click()
    );
    expect(onSelect).not.toHaveBeenCalled();
    const deleteButton = Array.from(
      menu.querySelectorAll<HTMLElement>('[role="menuitem"]')
    ).find((item) => item.textContent === 'delete')!;
    expect(
      deleteButton.classList.contains('ant-dropdown-menu-item-danger')
    ).toBe(true);
    await act(async () => deleteButton.click());
    expect(onSelect).toHaveBeenCalledExactlyOnceWith('delete', deleteItem);
    expect(deleteItem.onClick).not.toHaveBeenCalled();
  });

  it('removes boundary and consecutive dividers after extracting the primary action', async () => {
    const items: Items = [
      divider,
      action('edit'),
      divider,
      divider,
      action('view'),
      divider,
      divider,
      action('delete'),
      divider
    ];
    render(items);
    expect(container.querySelector('button')!.getAttribute('aria-label')).toBe(
      'edit'
    );
    expect(menuEntries(await openMenu())).toEqual([
      'view',
      'divider',
      'delete'
    ]);
    expect(items).toHaveLength(9);
    expect(items[0]).toBe(divider);
  });

  it('cleans up empty groups after permission filtering and updates when access changes', async () => {
    const restricted = (key: string) => ({
      ...action(key),
      label: 'restricted',
      access: 'manage'
    });
    const items = [
      action('edit'),
      divider,
      restricted('first'),
      divider,
      action('view'),
      divider,
      restricted('middle'),
      divider,
      action('delete'),
      divider,
      restricted('last'),
      divider
    ];
    render(items);
    expect(menuEntries(await openMenu())).toEqual([
      'view',
      'divider',
      'delete'
    ]);
    mocks.access = { manage: true };
    render(items);
    expect(menuEntries(document.querySelector('[role="menu"]')!)).toEqual([
      'restricted',
      'divider',
      'view',
      'divider',
      'restricted',
      'divider',
      'delete',
      'divider',
      'restricted'
    ]);
  });

  it('uses the first visible action as the primary button when earlier groups are hidden', async () => {
    const hidden = { ...action('hidden'), access: 'manage' };
    const primary = action('view');
    render([divider, hidden, divider, primary, divider, action('delete')]);
    expect(container.querySelector('button')!.getAttribute('aria-label')).toBe(
      'view'
    );
    act(() => container.querySelector('button')!.click());
    expect(onSelect).toHaveBeenCalledExactlyOnceWith('view', primary);
    expect(menuEntries(await openMenu())).toEqual(['delete']);
  });

  it('renders just the primary button when dividers surround the only visible action', () => {
    const primary = action('edit');
    const hidden = { ...action('hidden'), access: 'manage' };
    render([divider, primary, divider, hidden, divider]);
    expect(container.querySelectorAll('button')).toHaveLength(1);
    act(() => container.querySelector('button')!.click());
    expect(onSelect).toHaveBeenCalledExactlyOnceWith('edit', primary);
    expect(container.querySelector('.ant-dropdown-trigger')).toBeNull();
  });

  it.each([undefined, [], [divider, null, divider]])(
    'renders no controls when there are no actions: %j',
    (items) => {
      render(items);
      expect(container.querySelector('button')).toBeNull();
      expect(onSelect).not.toHaveBeenCalled();
      expect(mocks.formatMessage).not.toHaveBeenCalled();
    }
  );

  it('preserves flat menus without dividers', async () => {
    render([action('edit'), action('view'), action('delete')]);
    expect(menuEntries(await openMenu())).toEqual(['view', 'delete']);
  });
});
