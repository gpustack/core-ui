import React from 'react';
export interface ComponentProps {
  size: 'small' | 'medium' | 'large';
  variant: 'primary' | 'secondary' | 'success' | 'danger' | 'warning' | 'info';
}

export const Button: React.FC<ComponentProps> = () => {
  return <div>Button Component</div>;
};

export default Button;
