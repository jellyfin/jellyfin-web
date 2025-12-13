import taskButton from 'scripts/taskbutton';
import Events from 'utils/events';

function pluginImport(path) {
    // Structuring imports this way allows modules to be lazily imported at
    // runtime.  We can't directly call `import(path)` because webpack doesn't
    // know how to handle that.
    //
    // This returns a promise, so it is a bit different than the old globals:
    // ```
    // // Old
    // TaskButton({ ... });
    //
    // // New
    // pluginImport("scripts/taskbutton").then(TaskButton => {
    //     TaskButton.default({ ... });
    // });
    // ```
    switch (path) {
        case 'components/directorybrowser/directorybrowser':
            return import('components/directorybrowser/directorybrowser');
        case 'scripts/settings/userSettings':
            return import('scripts/settings/userSettings');
        case 'scripts/taskbutton':
            return import('scripts/taskbutton');
        case 'utils/events':
            return import('utils/events');
        default:
            console.warn(`Unable to import plugin ${path}.`);
            console.warn(
                'If you are writing a plugin and are trying to import a module '
                + 'at runtime, it needs to be registered in src/pluginImport.js'
                + ' in https://github.com/jellyfin/jellyfin-web'
            );
            throw new TypeError(`Unable to import plugin ${path}`);
    }
}

export default pluginImport;
window.pluginImport = pluginImport; // So plugins can use it

// Legacy properties for plugin imports that used to be globals
Object.defineProperty(window, 'Events', {
    'get': function() {
        console.warn(
            '`window.Events` is deprecated.  Use '
            + '`window.pluginImport(\'utils/events\')` instead.'
        );
        return Events;
    }
});

Object.defineProperty(window, 'TaskButton', {
    'get': function() {
        console.warn(
            '`window.TaskButton` is deprecated.  Use '
            + '`window.pluginImport(\'scripts/taskbutton\')` instead.'
        );
        return taskButton;
    }
});
