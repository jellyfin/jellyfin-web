import { render, RenderOptions } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import React, { PropsWithChildren, ReactNode } from 'react';
import { MemoryRouter, MemoryRouterProps } from 'react-router-dom';

export type RouterRenderOptions = Omit<RenderOptions, 'wrapper'>
    & Pick<MemoryRouterProps, 'initialEntries' | 'initialIndex'>;

const future = {
    // eslint-disable-next-line @typescript-eslint/naming-convention
    v7_startTransition: true,
    // eslint-disable-next-line @typescript-eslint/naming-convention
    v7_relativeSplatPath: true
};

/** Render with an isolated router and user session; rerender retains router state. */
export function renderWithRouter(ui: ReactNode, options: RouterRenderOptions = {}) {
    const { initialEntries = [ '/' ], initialIndex, ...renderOptions } = options;
    const user = userEvent.setup();
    const Wrapper = ({ children }: PropsWithChildren) => (
        <MemoryRouter initialEntries={initialEntries} initialIndex={initialIndex} future={future}>
            {children}
        </MemoryRouter>
    );

    return {
        ...render(ui, { ...renderOptions, wrapper: Wrapper }),
        user
    };
}
