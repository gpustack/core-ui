// @vitest-environment jsdom

import { ConfigProvider, message } from 'antd';
import {
  act,
  createElement,
  createRef,
  type ComponentProps,
  type RefAttributes,
  type RefObject
} from 'react';
import { createRoot, type Root } from 'react-dom/client';
import {
  afterEach,
  beforeEach,
  describe,
  expect,
  expectTypeOf,
  it,
  vi
} from 'vitest';
import DeleteModal from '../../delete-modal';
import ConfirmModal, { type ConfirmModalRef } from '../index';

const { saveScrollHeight, restoreScrollHeight } = vi.hoisted(() => ({
  saveScrollHeight: vi.fn(),
  restoreScrollHeight: vi.fn()
}));

vi.mock('../../../hooks/use-body-scroll', () => ({
  default: () => ({ saveScrollHeight, restoreScrollHeight })
}));

vi.mock('../../../hooks/useIntl', () => ({
  useIntl: () => ({ formatMessage: ({ id }: { id: string }) => id })
}));

vi.mock('antd-style', () => ({
  createStyles: () => () => ({ styles: {} })
}));

let root: Root;
let container: HTMLDivElement;
let ref: RefObject<ConfirmModalRef>;
let success: ReturnType<typeof vi.spyOn>;

const mount = (kind: 'confirm' | 'delete' = 'confirm') => {
  ref = createRef<ConfirmModalRef>();
  act(() => {
    root.render(
      createElement(
        ConfigProvider,
        { theme: { token: { motion: false } } },
        kind === 'delete'
          ? createElement(DeleteModal, { ref })
          : createElement(ConfirmModal, { ref })
      )
    );
  });
};

const show = (
  options: Partial<Parameters<ConfirmModalRef['show']>[0]> = {}
) => {
  act(() => ref.current!.show({ operation: 'test.operation', ...options }));
};

const button = (label = 'common.button.confirm') => {
  const found = Array.from(document.querySelectorAll('button')).find(
    (item) => item.textContent?.trim() === label
  );
  if (!found) throw new Error(`Missing modal button: ${label}`);
  return found;
};

const confirm = async (label = 'common.button.confirm') => {
  await act(async () => button(label).click());
};

const isOpen = () => {
  const wrapper = document.querySelector<HTMLElement>('.ant-modal-wrap');
  return !!wrapper && wrapper.style.display !== 'none';
};

beforeEach(() => {
  vi.clearAllMocks();
  (globalThis as any).IS_REACT_ACT_ENVIRONMENT = true;
  success = vi
    .spyOn(message, 'success')
    .mockImplementation(() => (() => {}) as any);
  vi.stubGlobal('matchMedia', () => ({
    matches: false,
    addListener: vi.fn(),
    removeListener: vi.fn(),
    addEventListener: vi.fn(),
    removeEventListener: vi.fn()
  }));
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

describe('ConfirmModal feedback', () => {
  it('defaults to neutral confirmation labels and silently completes an action', async () => {
    const onOk = vi.fn().mockResolvedValue(undefined);
    mount();
    show({ onOk });
    expect(document.querySelector('.title')?.textContent).toBe(
      'common.button.confirm'
    );
    expect(button().classList.contains('ant-btn-dangerous')).toBe(false);
    await confirm();
    expect(onOk).toHaveBeenCalledTimes(1);
    expect(success).not.toHaveBeenCalled();
    expect(isOpen()).toBe(false);
  });

  it('can acknowledge a notice without an action or success message', async () => {
    mount();
    show({ showCancel: false });
    expect(document.querySelectorAll('.ant-modal-footer button')).toHaveLength(
      1
    );
    await confirm();
    expect(success).not.toHaveBeenCalled();
    expect(restoreScrollHeight).toHaveBeenCalledTimes(1);
    expect(isOpen()).toBe(false);
  });

  it('emits success when a generic confirmation opts in', async () => {
    mount();
    show({ showSuccess: true, onOk: vi.fn().mockResolvedValue({ id: 1 }) });
    await confirm();
    expect(success).toHaveBeenCalledExactlyOnceWith('common.message.success');
  });

  it('does not leak success or button overrides into the next confirmation', async () => {
    mount();
    show({ showSuccess: true, okButtonProps: { danger: true } });
    expect(button().classList.contains('ant-btn-dangerous')).toBe(true);
    await confirm();
    show();
    expect(button().classList.contains('ant-btn-dangerous')).toBe(false);
    await confirm();
    expect(success).toHaveBeenCalledTimes(1);
  });

  it('waits for an async action with loading before closing and restoring scroll', async () => {
    let resolve!: () => void;
    const pending = new Promise<void>((done) => {
      resolve = done;
    });
    mount();
    show({ showSuccess: true, onOk: () => pending });
    await confirm();
    expect(saveScrollHeight).toHaveBeenCalledTimes(1);
    expect(button().classList.contains('ant-btn-loading')).toBe(true);
    expect(isOpen()).toBe(true);
    expect(success).not.toHaveBeenCalled();
    expect(restoreScrollHeight).not.toHaveBeenCalled();
    await act(async () => resolve());
    expect(success).toHaveBeenCalledTimes(1);
    expect(restoreScrollHeight).toHaveBeenCalledTimes(1);
    expect(isOpen()).toBe(false);
  });

  it('closes a rejected action without claiming success', async () => {
    mount();
    show({
      showSuccess: true,
      onOk: vi.fn().mockRejectedValue(new Error('request failed'))
    });
    await confirm();
    expect(success).not.toHaveBeenCalled();
    expect(restoreScrollHeight).toHaveBeenCalledTimes(1);
    expect(isOpen()).toBe(false);
  });

  it.each([
    { showSuccess: true, rejected: true, expected: 0 },
    { showSuccess: true, rejected: false, expected: 1 },
    { showSuccess: false, rejected: false, expected: 0 }
  ])(
    'handles batch outcomes with showSuccess=$showSuccess, rejected=$rejected',
    async ({ showSuccess, rejected, expected }) => {
      mount();
      show({
        showSuccess,
        onOk: () =>
          Promise.allSettled([
            Promise.resolve('first'),
            rejected
              ? Promise.reject(new Error('second failed'))
              : Promise.resolve('second')
          ])
      });
      await confirm();
      expect(success).toHaveBeenCalledTimes(expected);
      expect(isOpen()).toBe(false);
    }
  );
});

describe('DeleteModal compatibility', () => {
  it('retains delete labels, danger styling and success feedback by default', async () => {
    mount('delete');
    show({ onOk: vi.fn().mockResolvedValue(undefined) });
    expect(document.querySelector('.title')?.textContent).toBe(
      'common.title.delete.confirm'
    );
    expect(
      button('common.button.delete').classList.contains('ant-btn-dangerous')
    ).toBe(true);
    await confirm('common.button.delete');
    expect(success).toHaveBeenCalledExactlyOnceWith('common.message.success');
  });

  it('accepts legacy unknown refs and preserves an explicit undefined danger override', () => {
    expectTypeOf<ComponentProps<typeof DeleteModal>>().toEqualTypeOf<
      RefAttributes<unknown>
    >();
    const legacyRef = createRef<unknown>();
    act(() => root.render(createElement(DeleteModal, { ref: legacyRef })));
    ref = legacyRef as RefObject<ConfirmModalRef>;
    show({ okButtonProps: { danger: undefined } });
    expect(
      button('common.button.delete').classList.contains('ant-btn-dangerous')
    ).toBe(false);
  });

  it('allows delete feedback to be disabled for one invocation only', async () => {
    mount('delete');
    show({ showSuccess: false, okButtonProps: { danger: false } });
    expect(
      button('common.button.delete').classList.contains('ant-btn-dangerous')
    ).toBe(false);
    await confirm('common.button.delete');
    expect(success).not.toHaveBeenCalled();
    show();
    expect(
      button('common.button.delete').classList.contains('ant-btn-dangerous')
    ).toBe(true);
    await confirm('common.button.delete');
    expect(success).toHaveBeenCalledTimes(1);
  });

  it('preserves checkbox configuration, cancel callbacks and imperative hide', () => {
    const onCancel = vi.fn();
    mount('delete');
    show({
      onCancel,
      checkConfig: { checkText: 'test.checkbox', defautlChecked: true }
    });
    expect(ref.current!.configuration.checked).toBe(true);
    const checkbox = document.querySelector<HTMLInputElement>(
      'input[type="checkbox"]'
    );
    expect(checkbox?.checked).toBe(true);
    act(() => checkbox!.click());
    expect(ref.current!.configuration.checked).toBe(false);
    act(() => button('common.button.cancel').click());
    expect(onCancel).toHaveBeenCalledTimes(1);
    expect(restoreScrollHeight).toHaveBeenCalledTimes(1);
    expect(success).not.toHaveBeenCalled();
    show({ checkConfig: { checkText: 'test.checkbox', defautlChecked: true } });
    expect(ref.current!.configuration.checked).toBe(true);
    act(() => ref.current!.hide());
    expect(isOpen()).toBe(false);
    expect(restoreScrollHeight).toHaveBeenCalledTimes(2);
    expect(onCancel).toHaveBeenCalledTimes(1);
  });
});
