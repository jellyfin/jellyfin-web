const VrProjectionId = Object.freeze({
    Off: 'off',
    Auto: 'auto',
    HalfSideBySide: 'half-sbs',
    FullSideBySide: 'full-sbs',
    HalfTopAndBottom: 'half-tab',
    FullTopAndBottom: 'full-tab',
    FisheyeSideBySide: 'fisheye-sbs',
    FisheyeTopAndBottom: 'fisheye-tab'
});

const LEFT_EYE_LAYER = 1;
const RIGHT_EYE_LAYER = 2;

const VR_PROJECTIONS = Object.freeze([
    {
        id: VrProjectionId.Off,
        labelKey: 'VrProjectionOff'
    },
    {
        id: VrProjectionId.Auto,
        labelKey: 'VrProjectionAuto'
    },
    {
        id: VrProjectionId.HalfSideBySide,
        labelKey: 'VrProjectionHalfSideBySide'
    },
    {
        id: VrProjectionId.FullSideBySide,
        labelKey: 'VrProjectionFullSideBySide'
    },
    {
        id: VrProjectionId.HalfTopAndBottom,
        labelKey: 'VrProjectionHalfTopAndBottom'
    },
    {
        id: VrProjectionId.FullTopAndBottom,
        labelKey: 'VrProjectionFullTopAndBottom'
    },
    {
        id: VrProjectionId.FisheyeSideBySide,
        labelKey: 'VrProjectionFisheyeSideBySide'
    },
    {
        id: VrProjectionId.FisheyeTopAndBottom,
        labelKey: 'VrProjectionFisheyeTopAndBottom'
    }
]);

const VR_PROJECTION_IDS = new Set(VR_PROJECTIONS.map(mode => mode.id));

const sideBySidePatterns = [
    /\bhsbs\b/i,
    /\bfsbs\b/i,
    /\bsbs\b/i,
    /side[\s_.-]*by[\s_.-]*side/i,
    /\bleft[\s_.-]*right\b/i,
    /\blr\b/i
];

const topBottomPatterns = [
    /\bhtab\b/i,
    /\bftab\b/i,
    /\btab\b/i,
    /\btb\b/i,
    /\bou\b/i,
    /\btop[\s_.-]*bottom\b/i,
    /\btop[\s_.-]*and[\s_.-]*bottom\b/i,
    /over[\s_.-]*under/i
];

const fullPatterns = [
    /\bfull\b/i,
    /\bfsbs\b/i,
    /\bftab\b/i
];

const fisheyePatterns = [
    /\bfisheye\b/i,
    /\bvr180\b/i,
    /\b180vr\b/i,
    /\b180[\s_.-]*(vr|fisheye)\b/i,
    /\b(vr|fisheye)[\s_.-]*180\b/i
];

function isMatch(text, patterns) {
    return patterns.some(pattern => pattern.test(text));
}

function getDetectionText(item, mediaSource) {
    return [
        item?.Video3DFormat,
        item?.Name,
        item?.OriginalTitle,
        item?.Path,
        mediaSource?.Path,
        mediaSource?.Name
    ]
        .filter(Boolean)
        .join(' ')
        .toLowerCase();
}

function getProjectionFromVideo3DFormat(video3DFormat) {
    switch ((video3DFormat || '').toLowerCase()) {
        case 'halfsidebyside':
            return VrProjectionId.HalfSideBySide;
        case 'fullsidebyside':
            return VrProjectionId.FullSideBySide;
        case 'halftopandbottom':
            return VrProjectionId.HalfTopAndBottom;
        case 'fulltopandbottom':
            return VrProjectionId.FullTopAndBottom;
        case 'mvc':
            // MVC is frame-packed and cannot be split from a flat decoded stream.
            return VrProjectionId.Off;
        default:
            return null;
    }
}

function resolveProjectionFromPatterns(text) {
    const hasSideBySide = isMatch(text, sideBySidePatterns);
    const hasTopBottom = isMatch(text, topBottomPatterns);
    const hasFisheye = isMatch(text, fisheyePatterns);
    const isFullLayout = isMatch(text, fullPatterns);

    if (hasFisheye && hasSideBySide) {
        return VrProjectionId.FisheyeSideBySide;
    }

    if (hasFisheye && hasTopBottom) {
        return VrProjectionId.FisheyeTopAndBottom;
    }

    if (hasSideBySide) {
        return isFullLayout ? VrProjectionId.FullSideBySide : VrProjectionId.HalfSideBySide;
    }

    if (hasTopBottom) {
        return isFullLayout ? VrProjectionId.FullTopAndBottom : VrProjectionId.HalfTopAndBottom;
    }

    return VrProjectionId.Off;
}

export function normalizeVrProjection(value) {
    if (!value) {
        return VrProjectionId.Off;
    }

    const normalized = String(value).toLowerCase();
    return VR_PROJECTION_IDS.has(normalized) ? normalized : VrProjectionId.Off;
}

export function getSupportedVrProjections() {
    return VR_PROJECTIONS;
}

export function detectVrProjection(item, mediaSource) {
    const fromMetadata = getProjectionFromVideo3DFormat(item?.Video3DFormat || mediaSource?.Video3DFormat);
    if (fromMetadata) {
        return fromMetadata;
    }

    return resolveProjectionFromPatterns(getDetectionText(item, mediaSource));
}

export function resolveVrProjection(setting, item, mediaSource) {
    const normalized = normalizeVrProjection(setting);
    if (normalized === VrProjectionId.Auto) {
        return detectVrProjection(item, mediaSource);
    }

    return normalized;
}

function getNavigatorXr() {
    if (typeof navigator === 'undefined') {
        return null;
    }

    // eslint-disable-next-line compat/compat
    return navigator.xr || null;
}

export function isImmersiveVrRuntimeAvailable() {
    return !!getNavigatorXr();
}

function applyTextureLayout(texture, layout) {
    if (!texture || !layout) {
        return;
    }

    texture.repeat.set(layout.repeatX, layout.repeatY);
    texture.offset.set(layout.offsetX, layout.offsetY);
    texture.needsUpdate = true;
}

function configureVideoTexture(THREE, texture) {
    texture.wrapS = THREE.ClampToEdgeWrapping;
    texture.wrapT = THREE.ClampToEdgeWrapping;
    texture.minFilter = THREE.LinearFilter;
    texture.magFilter = THREE.LinearFilter;
    texture.generateMipmaps = false;
    texture.flipY = true;

    if ('colorSpace' in texture && 'SRGBColorSpace' in THREE) {
        texture.colorSpace = THREE.SRGBColorSpace;
    } else if ('encoding' in texture && 'sRGBEncoding' in THREE) {
        texture.encoding = THREE.sRGBEncoding;
    }
}

function drawIntoEye(ctx, videoElement, source, destination, circularMask, mirrorX = false) {
    const { sx, sy, sw, sh } = source;
    const { dx, dy, dw, dh } = destination;

    if (!circularMask && !mirrorX) {
        ctx.drawImage(videoElement, sx, sy, sw, sh, dx, dy, dw, dh);
        return;
    }

    ctx.save();

    if (circularMask) {
        const radius = Math.min(dw, dh) * 0.48;
        const centerX = dx + (dw / 2);
        const centerY = dy + (dh / 2);
        ctx.beginPath();
        ctx.arc(centerX, centerY, radius, 0, Math.PI * 2);
        ctx.clip();
    }

    if (mirrorX) {
        ctx.translate(dx + dw, dy);
        ctx.scale(-1, 1);
        ctx.drawImage(videoElement, sx, sy, sw, sh, 0, 0, dw, dh);
    } else {
        ctx.drawImage(videoElement, sx, sy, sw, sh, dx, dy, dw, dh);
    }

    ctx.restore();
}

function drawSideBySide(ctx, videoElement, canvasWidth, canvasHeight, circularMask) {
    const sourceWidth = videoElement.videoWidth;
    const sourceHeight = videoElement.videoHeight;
    if (!sourceWidth || !sourceHeight) {
        return;
    }

    const eyeSourceWidth = sourceWidth / 2;
    const eyeDestinationWidth = canvasWidth / 2;

    drawIntoEye(
        ctx,
        videoElement,
        {
            sx: 0,
            sy: 0,
            sw: eyeSourceWidth,
            sh: sourceHeight
        },
        {
            dx: 0,
            dy: 0,
            dw: eyeDestinationWidth,
            dh: canvasHeight
        },
        circularMask
    );

    drawIntoEye(
        ctx,
        videoElement,
        {
            sx: eyeSourceWidth,
            sy: 0,
            sw: eyeSourceWidth,
            sh: sourceHeight
        },
        {
            dx: eyeDestinationWidth,
            dy: 0,
            dw: eyeDestinationWidth,
            dh: canvasHeight
        },
        circularMask
    );
}

function drawTopBottom(ctx, videoElement, canvasWidth, canvasHeight, circularMask) {
    const sourceWidth = videoElement.videoWidth;
    const sourceHeight = videoElement.videoHeight;
    if (!sourceWidth || !sourceHeight) {
        return;
    }

    const eyeSourceHeight = sourceHeight / 2;
    const eyeDestinationHeight = canvasHeight / 2;

    drawIntoEye(
        ctx,
        videoElement,
        {
            sx: 0,
            sy: 0,
            sw: sourceWidth,
            sh: eyeSourceHeight
        },
        {
            dx: 0,
            dy: 0,
            dw: canvasWidth,
            dh: eyeDestinationHeight
        },
        circularMask
    );

    drawIntoEye(
        ctx,
        videoElement,
        {
            sx: 0,
            sy: eyeSourceHeight,
            sw: sourceWidth,
            sh: eyeSourceHeight
        },
        {
            dx: 0,
            dy: eyeDestinationHeight,
            dw: canvasWidth,
            dh: eyeDestinationHeight
        },
        circularMask
    );
}

export class VrCanvasRenderer {
    #container;
    #videoElement;
    #canvas;
    #context;
    #projection = VrProjectionId.Off;
    #isRunning = false;
    #animationFrameId = null;
    #videoFrameCallbackId = null;

    constructor(container, videoElement) {
        this.#container = container;
        this.#videoElement = videoElement;

        const canvas = document.createElement('canvas');
        canvas.classList.add('htmlvideoplayer-vr-canvas', 'hide');
        canvas.setAttribute('aria-hidden', 'true');

        this.#canvas = canvas;
        this.#context = canvas.getContext('2d', {
            alpha: false,
            desynchronized: true
        });

        if (container) {
            container.appendChild(canvas);
        }
    }

    setVideoElement(videoElement) {
        if (this.#videoElement && this.#videoElement !== videoElement) {
            this.#videoElement.classList.remove('htmlvideoplayer-vr-source');
        }

        this.#videoElement = videoElement;
        this.#applyClassState();
    }

    getProjection() {
        return this.#projection;
    }

    setProjection(projection) {
        const normalized = normalizeVrProjection(projection);
        if (this.#projection === normalized) {
            return;
        }

        this.#projection = normalized;
        const isOff = normalized === VrProjectionId.Off;

        if (isOff) {
            this.#stop();
        } else {
            this.#start();
        }

        this.#applyClassState();

        if (!isOff) {
            this.#drawFrame();
        }
    }

    destroy() {
        this.#stop();

        if (this.#videoElement) {
            this.#videoElement.classList.remove('htmlvideoplayer-vr-source');
        }

        if (this.#container) {
            this.#container.classList.remove('videoPlayerContainer-vr');
        }

        if (this.#canvas?.parentNode) {
            this.#canvas.parentNode.removeChild(this.#canvas);
        }

        this.#canvas = null;
        this.#context = null;
        this.#container = null;
        this.#videoElement = null;
    }

    #applyClassState() {
        const isOff = this.#projection === VrProjectionId.Off;
        this.#canvas?.classList.toggle('hide', isOff);
        this.#container?.classList.toggle('videoPlayerContainer-vr', !isOff);
        this.#videoElement?.classList.toggle('htmlvideoplayer-vr-source', !isOff);
    }

    #start() {
        if (this.#isRunning) {
            return;
        }

        this.#isRunning = true;
    }

    #stop() {
        this.#isRunning = false;

        if (this.#animationFrameId != null) {
            cancelAnimationFrame(this.#animationFrameId);
            this.#animationFrameId = null;
        }

        if (this.#videoFrameCallbackId != null && this.#videoElement?.cancelVideoFrameCallback) {
            this.#videoElement.cancelVideoFrameCallback(this.#videoFrameCallbackId);
            this.#videoFrameCallbackId = null;
        }

        const canvas = this.#canvas;
        const ctx = this.#context;
        if (canvas && ctx) {
            ctx.clearRect(0, 0, canvas.width, canvas.height);
        }
    }

    #scheduleNextFrame() {
        if (!this.#isRunning) {
            return;
        }

        const videoElement = this.#videoElement;
        if (videoElement && typeof videoElement.requestVideoFrameCallback === 'function') {
            this.#videoFrameCallbackId = videoElement.requestVideoFrameCallback(() => {
                this.#videoFrameCallbackId = null;
                this.#drawFrame();
            });
            return;
        }

        this.#animationFrameId = requestAnimationFrame(() => {
            this.#animationFrameId = null;
            this.#drawFrame();
        });
    }

    #ensureCanvasSize() {
        const canvas = this.#canvas;
        if (!canvas) {
            return null;
        }

        const rect = canvas.getBoundingClientRect();
        const width = Math.max(1, Math.round(rect.width * (window.devicePixelRatio || 1)));
        const height = Math.max(1, Math.round(rect.height * (window.devicePixelRatio || 1)));

        if (canvas.width !== width || canvas.height !== height) {
            canvas.width = width;
            canvas.height = height;
        }

        return {
            width,
            height
        };
    }

    #drawFrame() {
        if (!this.#isRunning) {
            return;
        }

        const videoElement = this.#videoElement;
        const ctx = this.#context;
        const size = this.#ensureCanvasSize();

        if (!videoElement || !ctx || !size) {
            this.#scheduleNextFrame();
            return;
        }

        const { width, height } = size;

        ctx.fillStyle = '#000';
        ctx.fillRect(0, 0, width, height);

        if (videoElement.readyState < 2) {
            this.#scheduleNextFrame();
            return;
        }

        switch (this.#projection) {
            case VrProjectionId.HalfSideBySide:
            case VrProjectionId.FullSideBySide:
                drawSideBySide(ctx, videoElement, width, height, false);
                break;
            case VrProjectionId.HalfTopAndBottom:
            case VrProjectionId.FullTopAndBottom:
                drawTopBottom(ctx, videoElement, width, height, false);
                break;
            case VrProjectionId.FisheyeSideBySide:
                drawSideBySide(ctx, videoElement, width, height, true);
                break;
            case VrProjectionId.FisheyeTopAndBottom:
                drawTopBottom(ctx, videoElement, width, height, true);
                break;
            default:
                break;
        }

        this.#scheduleNextFrame();
    }
}

const MAX_EYE_TEXTURE_SIZE = 2048;
const IMMERSIVE_HEMISPHERE_YAW_OFFSET = Math.PI;
const IMMERSIVE_SWAP_EYES = false;
const IMMERSIVE_MIRROR_X = true;

function isTopBottomProjection(projection) {
    return projection === VrProjectionId.HalfTopAndBottom
        || projection === VrProjectionId.FullTopAndBottom
        || projection === VrProjectionId.FisheyeTopAndBottom;
}

function isFisheyeProjection(projection) {
    return projection === VrProjectionId.FisheyeSideBySide
        || projection === VrProjectionId.FisheyeTopAndBottom;
}

function getEyeSourceSize(videoElement, projection) {
    const sourceWidth = videoElement?.videoWidth || 0;
    const sourceHeight = videoElement?.videoHeight || 0;
    if (!sourceWidth || !sourceHeight) {
        return {
            width: 0,
            height: 0
        };
    }

    if (isTopBottomProjection(projection)) {
        return {
            width: sourceWidth,
            height: sourceHeight / 2
        };
    }

    return {
        width: sourceWidth / 2,
        height: sourceHeight
    };
}

function getEyeSourceRect(videoElement, projection, isRightEye) {
    const sourceWidth = videoElement?.videoWidth || 0;
    const sourceHeight = videoElement?.videoHeight || 0;
    if (!sourceWidth || !sourceHeight) {
        return null;
    }

    if (isTopBottomProjection(projection)) {
        const eyeSourceHeight = sourceHeight / 2;
        return {
            sx: 0,
            sy: isRightEye ? eyeSourceHeight : 0,
            sw: sourceWidth,
            sh: eyeSourceHeight
        };
    }

    const eyeSourceWidth = sourceWidth / 2;
    return {
        sx: isRightEye ? eyeSourceWidth : 0,
        sy: 0,
        sw: eyeSourceWidth,
        sh: sourceHeight
    };
}

function getEyeTextureSize(videoElement, projection) {
    const sourceSize = getEyeSourceSize(videoElement, projection);
    let width = Math.max(1, Math.round(sourceSize.width));
    let height = Math.max(1, Math.round(sourceSize.height));

    const scale = Math.min(1, MAX_EYE_TEXTURE_SIZE / width, MAX_EYE_TEXTURE_SIZE / height);
    if (scale < 1) {
        width = Math.max(1, Math.round(width * scale));
        height = Math.max(1, Math.round(height * scale));
    }

    return {
        width,
        height
    };
}

function drawEyeProjection(ctx, videoElement, projection, isRightEye, width, height) {
    const source = getEyeSourceRect(videoElement, projection, isRightEye);
    if (!source) {
        return;
    }

    drawIntoEye(
        ctx,
        videoElement,
        source,
        {
            dx: 0,
            dy: 0,
            dw: width,
            dh: height
        },
        isFisheyeProjection(projection),
        IMMERSIVE_MIRROR_X
    );
}

function isRightEyeCamera(cameraForEye, rightEyeCamera) {
    const viewportX = cameraForEye?.viewport?.x;
    let isRightEye = false;

    if (typeof viewportX === 'number') {
        isRightEye = viewportX > 0;
    } else if (rightEyeCamera && cameraForEye === rightEyeCamera) {
        isRightEye = true;
    }

    if (IMMERSIVE_SWAP_EYES) {
        isRightEye = !isRightEye;
    }

    return isRightEye;
}

export class VrImmersiveRenderer {
    #container;
    #videoElement;
    #projection = VrProjectionId.Off;
    #isSupported = null;
    #isRunning = false;
    #exitButtonLabel;

    #three;
    #renderer;
    #scene;
    #camera;
    #session;
    #leftMesh;
    #rightMesh;
    #leftTexture;
    #rightTexture;
    #leftCanvas;
    #rightCanvas;
    #leftContext;
    #rightContext;
    #hemisphereGeometry;
    #exitButton;
    #hasDomOverlay = false;
    #rightEyeCamera;

    constructor(container, videoElement, options = {}) {
        this.#container = container;
        this.#videoElement = videoElement;
        this.#exitButtonLabel = options.exitButtonLabel || 'Exit VR';
        this.#ensureExitButton();
    }

    setVideoElement(videoElement) {
        if (!videoElement || videoElement === this.#videoElement) {
            return;
        }

        this.#videoElement = videoElement;
        if (!this.#isRunning) {
            return;
        }

        this.#rebuildVideoTextures();
    }

    isActive() {
        const isPresenting = !!this.#renderer?.xr?.isPresenting;
        if (this.#isRunning && !isPresenting) {
            void this.#endActiveSession();
            return false;
        }

        return this.#isRunning && isPresenting;
    }

    getProjection() {
        return this.#projection;
    }

    async isSupported() {
        if (this.#isSupported != null) {
            return this.#isSupported;
        }

        const xr = getNavigatorXr();
        if (!xr) {
            this.#isSupported = false;
            return false;
        }

        try {
            this.#isSupported = await xr.isSessionSupported('immersive-vr');
        } catch (error) {
            console.debug('[VrImmersiveRenderer] isSessionSupported failed', error);
            this.#isSupported = false;
        }

        return this.#isSupported;
    }

    async start(projection) {
        if (this.#isRunning) {
            this.setProjection(projection);
            return true;
        }

        if (!(await this.isSupported())) {
            return false;
        }

        const xr = getNavigatorXr();
        if (!xr) {
            return false;
        }

        try {
            await this.#ensureThreeScene();

            const session = await this.#requestSession(xr);
            this.#session = session;
            this.#session.addEventListener('end', this.#onSessionEnd);
            this.#hasDomOverlay = !!session.domOverlayState;

            await this.#renderer.xr.setSession(session);
            this.#renderer.setAnimationLoop(this.#render);
            this.#isRunning = true;
            this.#setImmersiveUiVisible(true);
            this.setProjection(projection);
            return true;
        } catch (error) {
            console.error('[VrImmersiveRenderer] failed to start immersive session', error);
            this.#cleanupSessionState();
            return false;
        }
    }

    async stop() {
        if (!this.#isRunning) {
            return;
        }

        await this.#endActiveSession();
    }

    async toggle(projection) {
        if (this.#isRunning && !this.#renderer?.xr?.isPresenting) {
            await this.#endActiveSession();
        }

        if (this.#isRunning) {
            await this.stop();
            return false;
        }

        return this.start(projection);
    }

    destroy() {
        this.#cleanupSessionState();
        window.removeEventListener('resize', this.#onResize);

        if (this.#renderer?.xr) {
            this.#renderer.xr.removeEventListener('sessionend', this.#onRendererSessionEnd);
        }

        if (this.#renderer) {
            this.#renderer.dispose();

            if (this.#renderer.domElement?.parentNode) {
                this.#renderer.domElement.parentNode.removeChild(this.#renderer.domElement);
            }
        }

        if (this.#exitButton) {
            this.#exitButton.removeEventListener('click', this.#onExitButtonClick);
            if (this.#exitButton.parentNode) {
                this.#exitButton.parentNode.removeChild(this.#exitButton);
            }
        }

        this.#leftTexture?.dispose();
        this.#rightTexture?.dispose();
        this.#leftTexture = null;
        this.#rightTexture = null;

        this.#leftContext = null;
        this.#rightContext = null;
        this.#leftCanvas = null;
        this.#rightCanvas = null;

        this.#hemisphereGeometry?.dispose();
        this.#hemisphereGeometry = null;

        this.#three = null;
        this.#renderer = null;
        this.#scene = null;
        this.#camera = null;
        this.#leftMesh = null;
        this.#rightMesh = null;
        this.#session = null;
        this.#videoElement = null;
        this.#exitButton = null;
        this.#hasDomOverlay = false;
        this.#rightEyeCamera = null;
        this.#container = null;
    }

    setProjection(projection) {
        const normalized = normalizeVrProjection(projection);
        this.#projection = normalized;

        if (!this.#leftTexture || !this.#rightTexture || !this.#leftMesh || !this.#rightMesh) {
            return;
        }

        applyTextureLayout(this.#leftTexture, {
            repeatX: 1,
            repeatY: 1,
            offsetX: 0,
            offsetY: 0
        });
        applyTextureLayout(this.#rightTexture, {
            repeatX: 1,
            repeatY: 1,
            offsetX: 0,
            offsetY: 0
        });

        this.#leftMesh.geometry = this.#hemisphereGeometry;
        this.#rightMesh.geometry = this.#hemisphereGeometry;

        this.#updateEyeTextures();
    }

    async #ensureThreeScene() {
        if (this.#renderer && this.#scene && this.#camera) {
            return;
        }

        const THREE = await import('three');
        this.#three = THREE;

        const renderer = new THREE.WebGLRenderer({
            alpha: true,
            antialias: true
        });
        renderer.xr.enabled = true;
        renderer.xr.addEventListener('sessionend', this.#onRendererSessionEnd);
        renderer.domElement.classList.add('htmlvideoplayer-vr-immersive-canvas');
        renderer.setPixelRatio(window.devicePixelRatio || 1);
        this.#renderer = renderer;

        const size = this.#getCanvasSize();
        renderer.setSize(size.width, size.height, false);

        const scene = new THREE.Scene();
        this.#scene = scene;

        const camera = new THREE.PerspectiveCamera(90, size.width / size.height, 0.1, 1000);
        camera.position.set(0, 0, 0);
        camera.layers.enable(LEFT_EYE_LAYER);
        camera.layers.enable(RIGHT_EYE_LAYER);
        this.#camera = camera;

        // Front-facing 180deg dome. Previous phiStart value centered the dome to the side.
        this.#hemisphereGeometry = new THREE.SphereGeometry(50, 96, 64, 0, Math.PI, 0, Math.PI);

        this.#rebuildVideoTextures();

        if (this.#container) {
            this.#container.appendChild(renderer.domElement);
        }

        window.addEventListener('resize', this.#onResize);
    }

    #rebuildVideoTextures() {
        const THREE = this.#three;
        const scene = this.#scene;
        const videoElement = this.#videoElement;
        if (!THREE || !scene || !videoElement) {
            return;
        }

        this.#ensureEyeCanvasContext();
        this.#ensureEyeCanvasSize(getEyeTextureSize(videoElement, this.#projection));

        if (this.#leftMesh) {
            scene.remove(this.#leftMesh);
            this.#leftMesh.material?.dispose();
        }
        if (this.#rightMesh) {
            scene.remove(this.#rightMesh);
            this.#rightMesh.material?.dispose();
        }

        this.#leftTexture?.dispose();
        this.#rightTexture?.dispose();

        const leftTexture = new THREE.CanvasTexture(this.#leftCanvas);
        const rightTexture = new THREE.CanvasTexture(this.#rightCanvas);
        configureVideoTexture(THREE, leftTexture);
        configureVideoTexture(THREE, rightTexture);
        this.#leftTexture = leftTexture;
        this.#rightTexture = rightTexture;

        const leftMaterial = new THREE.MeshBasicMaterial({
            map: leftTexture,
            side: THREE.BackSide
        });
        const rightMaterial = new THREE.MeshBasicMaterial({
            map: rightTexture,
            side: THREE.BackSide
        });
        leftMaterial.depthTest = false;
        leftMaterial.depthWrite = false;
        rightMaterial.depthTest = false;
        rightMaterial.depthWrite = false;

        const leftMesh = new THREE.Mesh(this.#hemisphereGeometry, leftMaterial);
        const rightMesh = new THREE.Mesh(this.#hemisphereGeometry, rightMaterial);

        // Shift the 180 dome to the viewer's forward direction.
        leftMesh.rotation.y = IMMERSIVE_HEMISPHERE_YAW_OFFSET;
        rightMesh.rotation.y = IMMERSIVE_HEMISPHERE_YAW_OFFSET;

        leftMesh.layers.set(LEFT_EYE_LAYER);
        rightMesh.layers.set(RIGHT_EYE_LAYER);

        leftMesh.onBeforeRender = (_renderer, _scene, cameraForEye) => {
            const isRightEye = isRightEyeCamera(cameraForEye, this.#rightEyeCamera);
            leftMaterial.colorWrite = !isRightEye;
        };
        leftMesh.onAfterRender = () => {
            leftMaterial.colorWrite = true;
        };

        rightMesh.onBeforeRender = (_renderer, _scene, cameraForEye) => {
            const isRightEye = isRightEyeCamera(cameraForEye, this.#rightEyeCamera);
            rightMaterial.colorWrite = isRightEye;
        };
        rightMesh.onAfterRender = () => {
            rightMaterial.colorWrite = true;
        };

        this.#leftMesh = leftMesh;
        this.#rightMesh = rightMesh;

        scene.add(leftMesh);
        scene.add(rightMesh);

        this.setProjection(this.#projection);
    }

    #render = () => {
        if (!this.#renderer || !this.#scene || !this.#camera || !this.#isRunning) {
            return;
        }

        if (!this.#renderer.xr.isPresenting) {
            void this.#endActiveSession();
            return;
        }

        this.#updateEyeTextures();

        const xrCamera = this.#renderer.xr.getCamera(this.#camera);
        if (xrCamera?.isArrayCamera && xrCamera.cameras?.length >= 2) {
            this.#rightEyeCamera = xrCamera.cameras.find((cameraForEye) => (cameraForEye?.viewport?.x || 0) > 0) || xrCamera.cameras[1];
        } else {
            this.#rightEyeCamera = null;
        }

        this.#renderer.render(this.#scene, this.#camera);
    };

    #updateEyeTextures() {
        const videoElement = this.#videoElement;
        const leftContext = this.#leftContext;
        const rightContext = this.#rightContext;
        const leftCanvas = this.#leftCanvas;
        const rightCanvas = this.#rightCanvas;
        if (!videoElement || !leftContext || !rightContext || !leftCanvas || !rightCanvas) {
            return;
        }

        if (videoElement.readyState < 2) {
            return;
        }

        const textureSize = getEyeTextureSize(videoElement, this.#projection);
        this.#ensureEyeCanvasSize(textureSize);

        leftContext.fillStyle = '#000';
        leftContext.fillRect(0, 0, leftCanvas.width, leftCanvas.height);
        rightContext.fillStyle = '#000';
        rightContext.fillRect(0, 0, rightCanvas.width, rightCanvas.height);

        drawEyeProjection(leftContext, videoElement, this.#projection, false, leftCanvas.width, leftCanvas.height);
        drawEyeProjection(rightContext, videoElement, this.#projection, true, rightCanvas.width, rightCanvas.height);

        if (this.#leftTexture) {
            this.#leftTexture.needsUpdate = true;
        }
        if (this.#rightTexture) {
            this.#rightTexture.needsUpdate = true;
        }
    }

    async #requestSession(xr) {
        const optionalFeatures = ['local-floor', 'bounded-floor'];
        if (this.#container) {
            try {
                return await xr.requestSession('immersive-vr', {
                    optionalFeatures: optionalFeatures.concat(['dom-overlay']),
                    domOverlay: {
                        root: this.#container
                    }
                });
            } catch (error) {
                console.debug('[VrImmersiveRenderer] dom-overlay unavailable, retrying without it', error);
            }
        }

        return xr.requestSession('immersive-vr', {
            optionalFeatures
        });
    }

    #ensureEyeCanvasContext() {
        if (!this.#leftCanvas) {
            this.#leftCanvas = document.createElement('canvas');
        }
        if (!this.#rightCanvas) {
            this.#rightCanvas = document.createElement('canvas');
        }
        if (!this.#leftContext) {
            this.#leftContext = this.#leftCanvas.getContext('2d', {
                alpha: false,
                desynchronized: true
            });
        }
        if (!this.#rightContext) {
            this.#rightContext = this.#rightCanvas.getContext('2d', {
                alpha: false,
                desynchronized: true
            });
        }
    }

    #ensureEyeCanvasSize(size) {
        if (!size) {
            return;
        }

        const { width, height } = size;
        if (this.#leftCanvas && (this.#leftCanvas.width !== width || this.#leftCanvas.height !== height)) {
            this.#leftCanvas.width = width;
            this.#leftCanvas.height = height;
        }

        if (this.#rightCanvas && (this.#rightCanvas.width !== width || this.#rightCanvas.height !== height)) {
            this.#rightCanvas.width = width;
            this.#rightCanvas.height = height;
        }
    }

    #getCanvasSize() {
        const width = this.#container?.clientWidth || window.innerWidth || 1280;
        const height = this.#container?.clientHeight || window.innerHeight || 720;
        return {
            width: Math.max(width, 1),
            height: Math.max(height, 1)
        };
    }

    #setImmersiveUiVisible(isVisible) {
        const showOverlayUi = !!(isVisible && this.#hasDomOverlay);
        this.#container?.classList.toggle('videoPlayerContainer-vr-immersive', showOverlayUi);
        this.#exitButton?.classList.toggle('hide', !showOverlayUi);
    }

    #ensureExitButton() {
        if (!this.#container || this.#exitButton) {
            return;
        }

        const button = document.createElement('button');
        button.setAttribute('type', 'button');
        button.classList.add('htmlvideoplayer-vr-immersive-exit', 'hide');
        button.textContent = this.#exitButtonLabel;
        button.addEventListener('click', this.#onExitButtonClick);
        this.#container.appendChild(button);
        this.#exitButton = button;
    }

    #onExitButtonClick = () => {
        this.stop();
    };

    #onResize = () => {
        if (!this.#renderer || !this.#camera) {
            return;
        }

        const size = this.#getCanvasSize();
        this.#renderer.setSize(size.width, size.height, false);
        this.#camera.aspect = size.width / size.height;
        this.#camera.updateProjectionMatrix();
    };

    #onRendererSessionEnd = () => {
        this.#cleanupSessionState();
    };

    #onSessionEnd = () => {
        this.#cleanupSessionState();
    };

    async #endActiveSession() {
        const session = this.#session;
        this.#cleanupSessionState();

        if (!session) {
            return;
        }

        try {
            await session.end();
        } catch (error) {
            console.debug('[VrImmersiveRenderer] failed to end immersive session', error);
        }
    }

    #cleanupSessionState() {
        if (!this.#isRunning && !this.#session) {
            return;
        }

        if (this.#session) {
            this.#session.removeEventListener('end', this.#onSessionEnd);
        }

        if (this.#renderer) {
            this.#renderer.setAnimationLoop(null);
        }

        this.#setImmersiveUiVisible(false);
        this.#hasDomOverlay = false;
        this.#rightEyeCamera = null;
        this.#session = null;
        this.#isRunning = false;
    }
}
