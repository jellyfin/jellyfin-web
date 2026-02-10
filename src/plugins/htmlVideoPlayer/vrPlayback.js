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
    /top[\s_.-]*(and)?[\s_.-]*bottom/i,
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

function drawIntoEye(ctx, videoElement, source, destination, circularMask) {
    const { sx, sy, sw, sh } = source;
    const { dx, dy, dw, dh } = destination;

    if (!circularMask) {
        ctx.drawImage(videoElement, sx, sy, sw, sh, dx, dy, dw, dh);
        return;
    }

    const radius = Math.min(dw, dh) * 0.48;
    const centerX = dx + (dw / 2);
    const centerY = dy + (dh / 2);

    ctx.save();
    ctx.beginPath();
    ctx.arc(centerX, centerY, radius, 0, Math.PI * 2);
    ctx.clip();
    ctx.drawImage(videoElement, sx, sy, sw, sh, dx, dy, dw, dh);
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
