/**
 * @jest-environment jsdom
 */
import React, { ReactNode } from 'react';
import { renderHook, RenderHookOptions } from '@testing-library/react';

interface WrapperProps {
  children: ReactNode;
}

export const createHookTestWrapper = (
  Wrapper?: React.ComponentType<WrapperProps>
) => {
  // eslint-disable-next-line react/display-name
  return ({ children }: WrapperProps) => {
    if (Wrapper) {
      return <Wrapper>{children}</Wrapper>;
    }
    return <>{children}</>;
  };
};

export const renderHookWithWrapper = <TProps, TResult>(
  hook: (props: TProps) => TResult,
  options?: RenderHookOptions<TProps>
) => {
  const wrapper = options?.wrapper;
  return renderHook(hook, {
    ...options,
    wrapper: wrapper ? wrapper : createHookTestWrapper(),
  });
};

describe('Hook Test Utils', () => {
  it('exports helper functions', () => {
    expect(createHookTestWrapper).toBeDefined();
    expect(renderHookWithWrapper).toBeDefined();
  });
});
