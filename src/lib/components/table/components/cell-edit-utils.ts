import _ from 'lodash';

export function buildSubmittedRow<T extends object>(
  row: T,
  dataIndex: string | number | readonly (string | number)[],
  newValue: unknown
): T {
  return _.set(_.cloneDeep(row), dataIndex as any, newValue);
}
