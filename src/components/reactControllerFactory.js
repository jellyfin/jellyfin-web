import React from 'react';
import ReactDOM from 'react-dom';

// TODO: Probably need to rehydrate on view restores

export default (view, params, { detail }) => {
    if (detail.options?.pageComponent) {
        import(/* webpackChunkName: "[request]" */ `./pages/${detail.options.pageComponent}`)
            .then(({ default: component }) => {
                ReactDOM.render(React.createElement(component), view);
            });
    }
};
