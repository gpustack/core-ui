import React from 'react';
import { describe, expect, it } from 'vitest';
import {
  flattenMobileColumnLabel,
  getMobileCardColumns,
  getMobileColumnGroups,
  getMobileColumnLabel,
  isOperationColumn
} from './mobile-card-utils';

describe('mobile-card-utils', () => {
  it('detects operation columns', () => {
    expect(isOperationColumn({ key: 'operation' })).toBe(true);
    expect(isOperationColumn({ dataIndex: 'operations' })).toBe(true);
    expect(isOperationColumn({ fixed: 'right', dataIndex: 'foo' })).toBe(true);
    expect(isOperationColumn({ dataIndex: 'name' })).toBe(false);
  });

  it('groups columns with primary as first column', () => {
    const columns = [
      { dataIndex: 'name', key: 'name' },
      { dataIndex: 'status', key: 'status' },
      { dataIndex: 'operation', key: 'operation' }
    ];
    const groups = getMobileColumnGroups(columns);
    expect(groups.primaryColumn?.dataIndex).toBe('name');
    expect(groups.operationColumn?.dataIndex).toBe('operation');
    expect(groups.detailColumns).toHaveLength(1);
    expect(groups.detailColumns[0].dataIndex).toBe('status');
  });

  it('uses mobileCard primary override', () => {
    const columns = [
      { dataIndex: 'source', key: 'source' },
      {
        dataIndex: 'worker_id',
        key: 'worker_id',
        mobileCard: 'primary' as const
      },
      { dataIndex: 'operation', key: 'operation' }
    ];
    const groups = getMobileColumnGroups(columns);
    expect(groups.primaryColumn?.dataIndex).toBe('worker_id');
  });

  it('keeps responsive table columns in mobile cards', () => {
    const columns = [
      { dataIndex: 'name', key: 'name' },
      {
        dataIndex: 'created_at',
        key: 'created_at',
        responsive: ['md'] as const
      },
      { dataIndex: 'operation', key: 'operation' }
    ];
    const visible = getMobileCardColumns(columns, 390);
    expect(visible.map((col) => col.dataIndex)).toEqual([
      'name',
      'created_at',
      'operation'
    ]);
  });

  it('hides columns marked as mobileCard hidden', () => {
    const columns = [
      { dataIndex: 'name', key: 'name' },
      {
        dataIndex: 'created_at',
        key: 'created_at',
        mobileCard: 'hidden' as const
      },
      { dataIndex: 'operation', key: 'operation' }
    ];
    const visible = getMobileCardColumns(columns, 390);
    expect(visible.map((col) => col.dataIndex)).toEqual(['name', 'operation']);
  });

  it('prefers mobileTitle for card labels', () => {
    expect(
      getMobileColumnLabel({
        mobileTitle: 'Model Name',
        title: 'Ignored'
      })
    ).toBe('Model Name');
  });

  it('flattens table header wrappers for card labels', () => {
    const label = flattenMobileColumnLabel(
      React.createElement(
        'span',
        null,
        React.createElement('span', { 'data-overflow': true }, 'TTFT'),
        React.createElement('span', { className: 'sub-title' }, 'Avg (ms)')
      )
    );

    expect(label).toEqual([
      React.createElement(React.Fragment, { key: 0 }, 'TTFT'),
      React.createElement(
        React.Fragment,
        { key: 1 },
        React.createElement('span', { className: 'sub-title' }, 'Avg (ms)')
      )
    ]);
  });
});
