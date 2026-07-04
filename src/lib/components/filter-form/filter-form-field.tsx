import classNames from 'classnames';
import React from 'react';
import fieldCss from './filter-form-field.module.less';

export type FilterFormFieldProps = {
  label: React.ReactNode;
  children: React.ReactNode;
  /** Remove top margin on the first field in a drawer form. */
  first?: boolean;
};

const FilterFormField: React.FC<FilterFormFieldProps> = ({
  label,
  children,
  first = false
}) => {
  return (
    <div className={fieldCss.filterFormField}>
      <span
        className={classNames(fieldCss.label, first && fieldCss.labelFirst)}
      >
        {label}
      </span>
      {children}
    </div>
  );
};

export default FilterFormField;
