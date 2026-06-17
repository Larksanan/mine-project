/* eslint-disable @typescript-eslint/no-explicit-any */
import React, { useContext } from 'react';
import { DropdownContext } from './Dropdown';

interface DropdownTriggerProps {
  children: React.ReactNode;
  className?: string;
  style?: React.CSSProperties;
}

const DropdownTrigger: React.FC<DropdownTriggerProps> = ({
  children,
  className,
  style,
  ...props
}) => {
  const { isOpen, setIsOpen } = useContext(DropdownContext);

  const handleClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    setIsOpen(!isOpen);
  };

  return (
    <div
      onClick={handleClick}
      className={className}
      style={style}
      role='button'
      tabIndex={0}
      onKeyDown={e => {
        if (e.key === 'Enter' || e.key === ' ') {
          handleClick(e as any);
        }
      }}
      {...props}
    >
      {children}
    </div>
  );
};

export default DropdownTrigger;
