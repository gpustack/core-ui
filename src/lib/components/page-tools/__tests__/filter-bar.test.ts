// @vitest-environment jsdom

import { ConfigProvider } from 'antd';
import { act, createElement } from 'react';
import { createRoot, type Root } from 'react-dom/client';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { FilterBar, type FilterBarProps } from '../index';

vi.mock('../../../hooks/useIntl', () => ({
  useIntl: () => ({ formatMessage: ({ id }: { id: string }) => id })
}));

let root: Root;
let container: HTMLDivElement;
const handlers = {
  handleInputChange: vi.fn(),
  handleSelectChange: vi.fn(),
  handleSearch: vi.fn(),
  handleClickPrimary: vi.fn(),
  handleDeleteByBatch: vi.fn()
};
const options = [
  { value: 'active', label: 'Active' },
  { value: 'expired', label: 'Expired' }
];

const renderExact = (props: FilterBarProps) => {
  act(() => {
    root.render(
      createElement(
        ConfigProvider,
        { theme: { token: { motion: false } } },
        createElement(FilterBar, props)
      )
    );
  });
};

const render = (props: Partial<FilterBarProps> = {}) =>
  renderExact({
    ...handlers,
    showSelect: true,
    selectOptions: options,
    buttonText: 'Create',
    ...props
  });

const searchInput = () =>
  container.querySelector<HTMLInputElement>('input.ant-input')!;
const selectInput = () =>
  container.querySelector<HTMLInputElement>('input[role="combobox"]')!;
const button = (name: string) => {
  const found = Array.from(container.querySelectorAll('button')).find(
    (element) =>
      element.getAttribute('aria-label') === name ||
      element.textContent?.trim() === name
  );
  if (!found) throw new Error(`Missing button: ${name}`);
  return found;
};
const typeSearch = (value: string) => {
  const input = searchInput();
  act(() => {
    Object.getOwnPropertyDescriptor(
      HTMLInputElement.prototype,
      'value'
    )!.set!.call(input, value);
    input.dispatchEvent(new Event('input', { bubbles: true }));
  });
};
const chooseStatus = async (label: string) => {
  await act(async () => {
    selectInput().dispatchEvent(new MouseEvent('mousedown', { bubbles: true }));
  });
  const option = Array.from(
    document.querySelectorAll<HTMLElement>('.ant-select-item-option')
  ).find((element) => element.getAttribute('title') === label);
  if (!option) throw new Error(`Missing status option: ${label}`);
  await act(async () => option.click());
};

beforeEach(() => {
  vi.clearAllMocks();
  (globalThis as any).IS_REACT_ACT_ENVIRONMENT = true;
  vi.stubGlobal('matchMedia', () => ({
    matches: false,
    addListener: vi.fn(),
    removeListener: vi.fn(),
    addEventListener: vi.fn(),
    removeEventListener: vi.fn()
  }));
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
  vi.useRealTimers();
  vi.restoreAllMocks();
  vi.unstubAllGlobals();
  delete (globalThis as any).IS_REACT_ACT_ENVIRONMENT;
});

describe('FilterBar legacy compatibility', () => {
  it('supports only required props without select or primary actions and does not refresh on Enter', () => {
    renderExact({
      handleInputChange: handlers.handleInputChange,
      handleSearch: handlers.handleSearch
    });
    expect(container.querySelector('.ant-select')).toBeNull();
    expect(container.querySelectorAll('button.ant-btn')).toHaveLength(1);
    expect(button('common.button.refresh')).toBeDefined();
    expect(searchInput().placeholder).toBe('common.filter.name');
    typeSearch('draft');
    act(() =>
      searchInput().dispatchEvent(
        new KeyboardEvent('keydown', {
          key: 'Enter',
          code: 'Enter',
          keyCode: 13,
          bubbles: true
        })
      )
    );
    expect(handlers.handleInputChange).toHaveBeenCalledTimes(1);
    expect(handlers.handleSearch).not.toHaveBeenCalled();
    act(() => button('common.button.refresh').click());
    expect(handlers.handleSearch).toHaveBeenCalledTimes(1);
  });

  it('keeps uncontrolled input and select editable and clearable with one event per action', async () => {
    render();
    typeSearch('screen');
    expect(searchInput().value).toBe('screen');
    expect(handlers.handleInputChange).toHaveBeenCalledTimes(1);
    act(() =>
      container.querySelector<HTMLElement>('.ant-input-clear-icon')!.click()
    );
    expect(searchInput().value).toBe('');
    expect(handlers.handleInputChange).toHaveBeenCalledTimes(2);

    await chooseStatus('Active');
    expect(handlers.handleSelectChange).toHaveBeenCalledExactlyOnceWith(
      'active',
      options[0]
    );
    expect(container.querySelector('.ant-select-content')?.textContent).toBe(
      'Active'
    );
    act(() =>
      container
        .querySelector<HTMLElement>('.ant-select-clear')!
        .dispatchEvent(new MouseEvent('mousedown', { bubbles: true }))
    );
    expect(handlers.handleSelectChange).toHaveBeenCalledTimes(2);
    expect(handlers.handleSelectChange.mock.calls[1]![0]).toBeUndefined();
    expect(container.querySelector('.ant-select-content-has-value')).toBeNull();
    act(() => button('common.button.refresh').click());
    expect(handlers.handleSearch).toHaveBeenCalledTimes(1);
  });

  it('keeps default sizes, spacing and legacy select.showSearch', () => {
    render({ select: { showSearch: true } });
    expect(
      searchInput().closest<HTMLElement>('.ant-input-affix-wrapper')!.style
        .width
    ).toBe('230px');
    expect(
      container.querySelector<HTMLElement>('.ant-select')!.style.width
    ).toBe('230px');
    expect(container.querySelector('.ant-select-lg')).toBeNull();
    expect(selectInput().readOnly).toBe(false);
    expect(
      container.querySelector<HTMLElement>('.ant-space')!.style.flexWrap
    ).toBe('');
    expect((container.firstElementChild as HTMLElement).style.marginTop).toBe(
      '0px'
    );
    expect(
      (container.firstElementChild as HTMLElement).style.marginBottom
    ).toBe('16px');
  });

  it('keeps primary and batch-delete behavior and honors left/right slots', () => {
    render({ rowSelection: { selectedRowKeys: [] } });
    act(() => button('Create').click());
    expect(handlers.handleClickPrimary).toHaveBeenCalledTimes(1);
    expect(button('common.button.delete').disabled).toBe(true);
    render({ rowSelection: { selectedRowKeys: [1, 2] } });
    const remove = button('common.button.delete(2)');
    expect(remove.disabled).toBe(false);
    expect(remove.classList.contains('ant-btn-dangerous')).toBe(true);
    act(() => remove.click());
    expect(handlers.handleDeleteByBatch).toHaveBeenCalledTimes(1);

    render({
      left: createElement('span', { id: 'custom-left' }, 'Custom filters'),
      right: createElement('button', { id: 'custom-right' }, 'Custom action'),
      leftSpaceProps: { className: 'unused-left-space' }
    });
    expect(container.querySelector('#custom-left')?.textContent).toBe(
      'Custom filters'
    );
    expect(container.querySelector('#custom-right')?.textContent).toBe(
      'Custom action'
    );
    expect(container.querySelector('input')).toBeNull();
    expect(container.querySelector('.unused-left-space')).toBeNull();
    expect(container.textContent).not.toContain('Create');
  });

  it('retains dropdown primary mode without creating an extra button wrapper', () => {
    render({
      actionType: 'dropdown',
      handleDeleteByBatch: undefined,
      actionItems: [
        {
          key: 'create',
          value: 'create',
          label: 'Create one',
          locale: false,
          icon: null
        }
      ]
    });
    expect(button('Create').classList.contains('ant-dropdown-trigger')).toBe(
      true
    );
    expect(
      button('Create').querySelector('[aria-label="down"]')
    ).not.toBeNull();
  });

  it('honors legacy left and right slots independently', () => {
    renderExact({
      handleInputChange: handlers.handleInputChange,
      handleSearch: handlers.handleSearch,
      handleClickPrimary: handlers.handleClickPrimary,
      buttonText: 'Legacy create',
      left: createElement('span', { id: 'only-left' }, 'Custom left')
    });
    expect(container.querySelector('#only-left')).not.toBeNull();
    expect(container.querySelector('input')).toBeNull();
    act(() => button('Legacy create').click());
    expect(handlers.handleClickPrimary).toHaveBeenCalledTimes(1);

    renderExact({
      handleInputChange: handlers.handleInputChange,
      handleSearch: handlers.handleSearch,
      handleClickPrimary: handlers.handleClickPrimary,
      buttonText: 'Hidden create',
      showSelect: true,
      selectOptions: options,
      right: createElement('button', { id: 'only-right' }, 'Custom right')
    });
    expect(container.querySelector('#only-left')).toBeNull();
    expect(container.querySelector('#only-right')).not.toBeNull();
    expect(searchInput()).toBeDefined();
    expect(selectInput()).toBeDefined();
    expect(container.textContent).not.toContain('Hidden create');
    act(() => button('common.button.refresh').click());
    expect(handlers.handleSearch).toHaveBeenCalledTimes(1);
  });

  it('preserves legacy widths, placeholders, icons and semantic styles/classes', () => {
    renderExact({
      handleInputChange: handlers.handleInputChange,
      handleSearch: handlers.handleSearch,
      handleClickPrimary: handlers.handleClickPrimary,
      showSelect: true,
      selectOptions: options,
      widths: { input: 280, select: 170 },
      inputHolder: 'Find deployment',
      selectHolder: 'Deployment status',
      select: { showSearch: true },
      buttonText: 'Run legacy action',
      buttonIcon: createElement('span', { id: 'legacy-icon' }, '!'),
      marginBottom: 24,
      classNames: {
        root: 'legacy-root',
        left: 'legacy-left',
        right: 'legacy-right'
      },
      styles: {
        root: { gap: 12 },
        left: { minWidth: 0 },
        right: { marginInlineStart: 'auto' }
      }
    });
    expect(searchInput().placeholder).toBe('Find deployment');
    expect(
      searchInput().closest<HTMLElement>('.ant-input-affix-wrapper')!.style
        .width
    ).toBe('280px');
    expect(
      container.querySelector<HTMLElement>('.ant-select')!.style.width
    ).toBe('170px');
    expect(
      container.querySelector('.ant-select-placeholder')?.textContent
    ).toBe('Deployment status');
    expect(selectInput().readOnly).toBe(false);
    expect(
      button('!Run legacy action').querySelector('#legacy-icon')
    ).not.toBeNull();
    const toolbar = container.querySelector<HTMLElement>('.legacy-root')!;
    expect(toolbar.style.marginTop).toBe('0px');
    expect(toolbar.style.marginBottom).toBe('24px');
    expect(toolbar.style.gap).toBe('12px');
    expect(
      container.querySelector<HTMLElement>('.legacy-left')!.style.minWidth
    ).toBe('0');
    expect(
      container.querySelector<HTMLElement>('.legacy-right')!.style
        .marginInlineStart
    ).toBe('auto');
  });

  it('keeps filters-button count and stops clear clicks from reopening filters', () => {
    const open = vi.fn();
    const clear = vi.fn();
    renderExact({
      handleInputChange: handlers.handleInputChange,
      handleSearch: handlers.handleSearch,
      filtersButtonProps: {
        show: true,
        count: 2,
        onClick: open,
        onClear: clear
      }
    });
    const filters = button('common.filter.label2');
    act(() => filters.click());
    expect(open).toHaveBeenCalledTimes(1);
    const clearIcon = filters.querySelector<HTMLElement>(
      '[aria-label="close-circle"]'
    )!;
    act(() => clearIcon.parentElement!.click());
    expect(clear).toHaveBeenCalledTimes(1);
    expect(open).toHaveBeenCalledTimes(1);
    expect(handlers.handleSearch).not.toHaveBeenCalled();
    expect(handlers.handleInputChange).not.toHaveBeenCalled();
  });

  it('preserves uncontrolled input, selected option and original nodes across legacy rerenders', async () => {
    const legacyProps: FilterBarProps = {
      handleInputChange: handlers.handleInputChange,
      handleSelectChange: handlers.handleSelectChange,
      handleSearch: handlers.handleSearch,
      showSelect: true,
      selectOptions: options
    };
    renderExact(legacyProps);
    typeSearch('persistent draft');
    await chooseStatus('Active');
    const input = searchInput();
    const comboInput = selectInput();
    const select = container.querySelector('.ant-select');
    renderExact({
      ...legacyProps,
      widths: { input: 240 },
      selectOptions: options.map((option) => ({ ...option })),
      styles: { root: { gap: 8 } }
    });
    expect(searchInput()).toBe(input);
    expect(selectInput()).toBe(comboInput);
    expect(container.querySelector('.ant-select')).toBe(select);
    expect(input.value).toBe('persistent draft');
    expect(container.querySelector('.ant-select-content')?.textContent).toBe(
      'Active'
    );
    expect(handlers.handleInputChange).toHaveBeenCalledTimes(1);
    expect(handlers.handleSelectChange).toHaveBeenCalledTimes(1);
    expect(handlers.handleSearch).not.toHaveBeenCalled();
  });

  it('dispatches one original MenuInfo when selecting a legacy dropdown primary action', async () => {
    vi.useFakeTimers();
    renderExact({
      handleInputChange: handlers.handleInputChange,
      handleSearch: handlers.handleSearch,
      handleClickPrimary: handlers.handleClickPrimary,
      buttonText: 'Legacy actions',
      actionType: 'dropdown',
      actionItems: [
        {
          key: 'from-template',
          value: 'from-template',
          label: 'From template',
          locale: false,
          icon: null
        }
      ]
    });
    act(() => {
      button('Legacy actions').dispatchEvent(
        new MouseEvent('mouseover', { bubbles: true })
      );
      vi.advanceTimersByTime(250);
    });
    const item = Array.from(
      document.querySelectorAll<HTMLElement>('[role="menuitem"]')
    ).find((element) => element.textContent === 'From template');
    expect(item).toBeDefined();
    await act(async () => item!.click());
    expect(handlers.handleClickPrimary).toHaveBeenCalledTimes(1);
    const args = handlers.handleClickPrimary.mock.calls[0]!;
    expect(args).toHaveLength(1);
    expect(args[0]).toEqual(
      expect.objectContaining({
        key: 'from-template',
        keyPath: ['from-template'],
        domEvent: expect.objectContaining({ type: 'click' })
      })
    );
    expect(handlers.handleSearch).not.toHaveBeenCalled();
  });
});

describe('FilterBar controlled props', () => {
  it('clears controlled values on rerender without remounting either control', () => {
    render({
      inputProps: { value: 'screen', 'aria-label': 'Search links' },
      selectProps: { value: 'active', 'aria-label': 'Link status' }
    });
    const input = searchInput();
    const select = container.querySelector('.ant-select');
    expect(input.value).toBe('screen');
    expect(input.getAttribute('aria-label')).toBe('Search links');
    expect(selectInput().getAttribute('aria-label')).toBe('Link status');
    expect(container.querySelector('.ant-select-content')?.textContent).toBe(
      'Active'
    );

    render({
      inputProps: { value: '', 'aria-label': 'Search links' },
      selectProps: { value: undefined, 'aria-label': 'Link status' }
    });
    expect(searchInput()).toBe(input);
    expect(container.querySelector('.ant-select')).toBe(select);
    expect(input.value).toBe('');
    expect(container.querySelector('.ant-select-content-has-value')).toBeNull();
  });

  it('forwards Enter, refresh loading and wrap with merged styles', () => {
    const enter = vi.fn();
    const props: Partial<FilterBarProps> = {
      widths: { input: 180, select: 150 },
      select: { showSearch: true },
      inputProps: { onPressEnter: enter, style: { maxWidth: '100%' } },
      selectProps: { showSearch: false, style: { maxWidth: '100%' } },
      refreshButtonProps: { loading: true, style: { marginTop: 3 } },
      leftSpaceProps: {
        wrap: true,
        size: 12,
        className: 'filter-controls',
        style: { maxWidth: '100%' }
      }
    };
    render(props);
    act(() =>
      searchInput().dispatchEvent(
        new KeyboardEvent('keydown', {
          key: 'Enter',
          code: 'Enter',
          keyCode: 13,
          bubbles: true
        })
      )
    );
    expect(enter).toHaveBeenCalledTimes(1);
    const refresh = button('common.button.refresh');
    expect(refresh.classList.contains('ant-btn-loading')).toBe(true);
    act(() => refresh.click());
    expect(handlers.handleSearch).not.toHaveBeenCalled();
    expect(refresh.style.color).toBe('var(--ant-color-text-tertiary)');
    expect(refresh.style.marginTop).toBe('3px');
    expect(
      searchInput().closest<HTMLElement>('.ant-input-affix-wrapper')!.style
        .width
    ).toBe('180px');
    expect(
      searchInput().closest<HTMLElement>('.ant-input-affix-wrapper')!.style
        .maxWidth
    ).toBe('100%');
    expect(
      container.querySelector<HTMLElement>('.ant-select')!.style.width
    ).toBe('150px');
    expect(
      container.querySelector<HTMLElement>('.ant-select')!.style.maxWidth
    ).toBe('100%');
    expect(selectInput().readOnly).toBe(true);
    const space = container.querySelector<HTMLElement>('.filter-controls')!;
    expect(space.style.flexWrap).toBe('wrap');
    expect(space.style.maxWidth).toBe('100%');

    render({
      ...props,
      refreshButtonProps: { loading: false, style: { color: 'red' } }
    });
    expect(button('common.button.refresh')).toBe(refresh);
    expect(refresh.style.color).toBe('red');
    act(() => refresh.click());
    expect(handlers.handleSearch).toHaveBeenCalledTimes(1);
  });

  it('keeps callbacks and options authoritative even for untyped prop objects', async () => {
    const overridden = vi.fn();
    render({
      inputProps: { onChange: overridden, style: { width: 190 } } as any,
      selectProps: {
        onChange: overridden,
        options: [{ value: 'wrong', label: 'Wrong' }],
        style: { width: 170 }
      } as any,
      refreshButtonProps: { onClick: overridden } as any
    });
    typeSearch('one');
    await chooseStatus('Expired');
    act(() => button('common.button.refresh').click());
    expect(handlers.handleInputChange).toHaveBeenCalledTimes(1);
    expect(handlers.handleSelectChange).toHaveBeenCalledExactlyOnceWith(
      'expired',
      options[1]
    );
    expect(handlers.handleSearch).toHaveBeenCalledTimes(1);
    expect(overridden).not.toHaveBeenCalled();
    expect(
      searchInput().closest<HTMLElement>('.ant-input-affix-wrapper')!.style
        .width
    ).toBe('190px');
    expect(
      container.querySelector<HTMLElement>('.ant-select')!.style.width
    ).toBe('170px');
  });
});
