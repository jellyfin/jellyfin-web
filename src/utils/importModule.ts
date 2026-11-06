/**
 * MIT License
 *
 * Copyright (c) 2018 uupaa
 *
 * Permission is hereby granted, free of charge, to any person obtaining a copy
 * of this software and associated documentation files (the "Software"), to deal
 * in the Software without restriction, including without limitation the rights
 * to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
 * copies of the Software, and to permit persons to whom the Software is
 * furnished to do so, subject to the following conditions:
 *
 * The above copyright notice and this permission notice shall be included in all
 * copies or substantial portions of the Software.
 *
 * THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
 * IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
 * FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
 * AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
 * LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
 * OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE
 * SOFTWARE.
 */

// Adapted from @uupaa/dynamic-import-polyfill 1.0.2
// https://github.com/uupaa/dynamic-import-polyfill

/**
 * Resolves a url relative to the current document.
 * @param url The url to resolve.
 * @returns The absolute url.
 */
const toAbsoluteUrl = (url: string) => {
    const a = document.createElement('a');
    a.setAttribute('href', url);
    return (a.cloneNode(false) as HTMLAnchorElement).href;
};

/**
 * Checks if the browser supports module scripts.
 * Browsers without module support silently ignore `<script type="module">`
 * and fire neither `load` nor `error`.
 * @returns True if module scripts are supported.
 */
const supportsModuleScripts = () => 'noModule' in HTMLScriptElement.prototype;

/**
 * Imports an ES module at runtime without using the native `import()` syntax.
 * The bundle targets ES5, where `import()` is a syntax error, so the import happens
 * in a generated module script instead.
 * @param url The url of the module, relative to the current document.
 * @returns A promise resolving with the module namespace object.
 */
export const importModule = <T = unknown>(url: string): Promise<T> => {
    return new Promise((resolve, reject) => {
        if (!supportsModuleScripts()) {
            reject(new Error(`Failed to import: ${url} (module scripts are not supported)`));
            return;
        }

        // eslint-disable-next-line sonarjs/pseudo-random
        const vector = '$importModule$' + Math.random().toString(32).slice(2);
        const script = document.createElement('script');
        const globals = window as unknown as Record<string, unknown>;

        const destructor = () => {
            delete globals[vector];
            script.onerror = null;
            script.onload = null;
            script.remove();
            URL.revokeObjectURL(script.src);
        };

        script.type = 'module';
        script.onerror = () => {
            reject(new Error(`Failed to import: ${url}`));
            destructor();
        };
        script.onload = () => {
            // Errors while parsing or evaluating the module are reported to window.onerror,
            // but the loader script still fires load without exporting anything
            if (vector in globals) {
                resolve(globals[vector] as T);
            } else {
                reject(new Error(`Failed to import: ${url} (module failed to evaluate)`));
            }
            destructor();
        };

        // JSON.stringify escapes the url so it is always a valid string literal
        const loader = `import * as m from ${JSON.stringify(toAbsoluteUrl(url))}; window.${vector} = m;`;
        const blob = new Blob([loader], { type: 'text/javascript' });
        script.src = URL.createObjectURL(blob);

        document.head.appendChild(script);
    });
};
