import React from 'react';
import ReactDOM from 'react-dom';

export default (view, params, { detail }) => {
    if (detail.options?.pageComponent) {
        // Fetch and render the page component to the view
        import(/* webpackChunkName: "[request]" */ `./pages/${detail.options.pageComponent}`)
            .then(({ default: component }) => {
                ReactDOM.render(React.createElement(component, params), view);
            });

        // Unmount component when view is destroyed
        view.addEventListener('viewdestroy', () => {
            ReactDOM.unmountComponentAtNode(view);
        });
    }
};
