import React, { createContext, useState } from 'react';

interface DropdownContextType {
  isOpen: boolean;
  setIsOpen: (value: boolean) => void;
}

export const DropdownContext = createContext<DropdownContextType>({
  isOpen: false,
  setIsOpen: () => {},
});

interface DropdownProps {
  children: React.ReactNode;
}

const Dropdown: React.FC<DropdownProps> = ({ children }) => {
  const [isOpen, setIsOpen] = useState(false);

  return (
    <DropdownContext.Provider value={{ isOpen, setIsOpen }}>
      <div className='relative inline-block text-left'>{children}</div>
    </DropdownContext.Provider>
  );
};

export default Dropdown;
