import './loading.scss';

let loader: HTMLDivElement | undefined;

function createLoader(): HTMLDivElement {
    const elem = document.createElement('div');
    elem.setAttribute('dir', 'ltr');
    elem.classList.add('spinner-container');
    elem.classList.add('custom-jellyfin-logo-spinner');

    elem.innerHTML = `
        <svg width="80" height="80" viewBox="-4 -4 80 80" fill="none" xmlns="http://www.w3.org/2000/svg">
        <defs>
            <linearGradient id="grad1" x1="11.9999" y1="30.0006" x2="71.9989" y2="63.0024" gradientUnits="userSpaceOnUse">
                <stop stop-color="#AA5CC3"/>
                <stop offset="1" stop-color="#00A4DC"/>
            </linearGradient>
            <linearGradient id="grad2" x1="12" y1="29.9992" x2="71.999" y2="63.001" gradientUnits="userSpaceOnUse">
                <stop stop-color="#AA5CC3"/>
                <stop offset="1" stop-color="#00A4DC"/>
            </linearGradient>
        </defs>
            <g class="spinner-inner-triangle">
                <path d="M24.2116 49.1581C22.6599 46.0424 32.8378 27.5879 35.9999 27.5879C39.1666 27.5895 49.3228 46.0764 47.7882 49.1581C46.2536 52.2398 25.7632 52.2738 24.2116 49.1581Z" 
                    fill="url(#grad1)"/>
            </g>
            <g class="spinner-outer-triangle">
                <path fill-rule="evenodd" clip-rule="evenodd" 
                d="M0.481861 64.9951C-4.19479 55.6047 26.4765 0 36 0C45.5328 0 76.153 55.713 71.5274 64.9951C66.9018 74.2773 5.15852 74.3856 0.481861 64.9951ZM12.7358 56.847C15.8005 62.9995 56.2536 62.9314 59.2843 56.847C62.3149 50.761 42.2515 14.2605 36.0093 14.2605C29.767 14.2605 9.67118 50.6944 12.7358 56.847Z" 
                fill="url(#grad2)"/>
            </g>
        </svg>
    `;

    document.body.appendChild(elem);
    return elem;
}

export function show() {
    if (!loader) {
        loader = createLoader();
    }

    loader.classList.remove('spinner-is-hidding'); // Ensure the 'spinner-is-hidding' class is removed if a show() is called quickly after a hide()
    loader.classList.add('spinner-is-active');
}

export function hide() {
    if (loader) {
        // Start the exit animation
        loader.classList.add('spinner-is-hidding');

        setTimeout(() => {
            if (loader!.classList.contains('spinner-is-hidding')) {
                loader!.classList.remove('spinner-is-active', 'spinner-is-hidding');
            }
        }, 600); // Wait slightly longer than the 500ms CSS transition
    }
}

const loading = {
    show,
    hide
};

window.Loading = loading;

export default loading;
