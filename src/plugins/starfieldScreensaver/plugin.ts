import { PluginType } from 'constants/pluginType';

interface Star {
    x: number;
    y: number;
    radius: number;
    maxAlpha: number;
    hue: number;
    fadeIn: number;
    hold: number;
    fadeOut: number;
    totalLife: number;
    age: number;
}

interface ScreensaverPlugin {
    name: string;
    type: PluginType;
    id: string;
    supportsAnonymous: boolean;
    show: () => void;
    hide: () => Promise<void>;
}

export default function (this: ScreensaverPlugin) {
    const self = this;

    self.name = 'Starfield';
    self.type = PluginType.Screensaver;
    self.id = 'starfieldscreensaver';
    self.supportsAnonymous = true;

    let rafId: number | null = null;
    let spawnTimeoutId: ReturnType<typeof setTimeout> | null = null;
    let resizeHandler: (() => void) | null = null;
    let container: HTMLDivElement | null = null;
    let canvas: HTMLCanvasElement | null = null;
    let ctx: CanvasRenderingContext2D | null = null;
    let stars: Star[] = [];
    let width = 0;
    let height = 0;
    let lastFrameTime = 0;
    let prefersReducedMotion = false;

    function randomBetween(min: number, max: number): number {
        return min + Math.random() * (max - min);
    }

    function easeInOut(t: number): number {
        const clamped = Math.min(Math.max(t, 0), 1);
        return clamped < 0.5
            ? 2 * clamped * clamped
            : 1 - Math.pow(-2 * clamped + 2, 2) / 2;
    }

    function alphaForStar(star: Star, age: number): number {
        const { fadeIn, hold, fadeOut, maxAlpha } = star;

        if (age < fadeIn) {
            return maxAlpha * easeInOut(age / fadeIn);
        }
        if (age < fadeIn + hold) {
            return maxAlpha;
        }
        const fadeOutAge = age - fadeIn - hold;
        return maxAlpha * (1 - easeInOut(fadeOutAge / fadeOut));
    }

    function spawnStar(): void {
        if (!width || !height) return;

        const fadeIn = randomBetween(600, 1600);
        const hold = randomBetween(200, 900);
        const fadeOut = randomBetween(800, 2200);

        stars.push({
            x: Math.random() * width,
            y: Math.random() * height,
            radius: randomBetween(0.6, 1.8),
            maxAlpha: randomBetween(0.35, 1),
            hue: randomBetween(200, 220),
            fadeIn,
            hold,
            fadeOut,
            totalLife: fadeIn + hold + fadeOut,
            age: 0
        });
    }

    function scheduleNextSpawn(delayOverride?: number): void {
        const delay = delayOverride ?? randomBetween(80, 260);

        spawnTimeoutId = setTimeout(() => {
            spawnStar();

            const maxConcurrent = prefersReducedMotion ? 12 : 45;
            if (stars.length < maxConcurrent) {
                scheduleNextSpawn();
            } else {
                scheduleNextSpawn(randomBetween(200, 400));
            }
        }, delay);
    }

    function draw(dt: number): void {
        if (!ctx) return;

        ctx.fillStyle = '#000';
        ctx.fillRect(0, 0, width, height);

        for (let i = stars.length - 1; i >= 0; i--) {
            const star = stars[i];
            star.age += dt;

            if (star.age >= star.totalLife) {
                stars.splice(i, 1);
                continue;
            }

            const alpha = alphaForStar(star, star.age);

            ctx.beginPath();
            ctx.fillStyle = `hsla(${star.hue}, 60%, 90%, ${alpha})`;
            ctx.arc(star.x, star.y, star.radius, 0, Math.PI * 2);
            ctx.fill();

            if (star.maxAlpha > 0.7) {
                ctx.beginPath();
                ctx.fillStyle = `hsla(${star.hue}, 60%, 90%, ${alpha * 0.15})`;
                ctx.arc(star.x, star.y, star.radius * 3, 0, Math.PI * 2);
                ctx.fill();
            }
        }
    }

    function tick(now: number): void {
        const dt = now - (lastFrameTime || now);
        lastFrameTime = now;

        draw(dt);

        rafId = requestAnimationFrame(tick);
    }

    function resizeCanvas(): void {
        if (!canvas || !ctx) return;

        const dpr = window.devicePixelRatio || 1;
        width = window.innerWidth;
        height = window.innerHeight;

        canvas.width = width * dpr;
        canvas.height = height * dpr;
        ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    }

    function buildDom(): void {
        container = document.createElement('div');
        container.classList.add('starfieldScreensaver');
        container.style.position = 'fixed';
        container.style.top = '0';
        container.style.left = '0';
        container.style.width = '100%';
        container.style.height = '100%';
        container.style.backgroundColor = '#000';
        container.style.zIndex = '99999';

        canvas = document.createElement('canvas');
        canvas.style.display = 'block';
        canvas.style.width = '100%';
        canvas.style.height = '100%';
        container.appendChild(canvas);

        document.body.appendChild(container);

        ctx = canvas.getContext('2d');
    }

    function stopTimers(): void {
        if (rafId !== null) {
            cancelAnimationFrame(rafId);
            rafId = null;
        }

        if (spawnTimeoutId !== null) {
            clearTimeout(spawnTimeoutId);
            spawnTimeoutId = null;
        }

        if (resizeHandler) {
            window.removeEventListener('resize', resizeHandler);
            resizeHandler = null;
        }
    }

    self.show = function (): void {
        prefersReducedMotion = !!(window.matchMedia
            && window.matchMedia('(prefers-reduced-motion: reduce)').matches);

        buildDom();
        resizeCanvas();

        resizeHandler = () => resizeCanvas();
        window.addEventListener('resize', resizeHandler);

        stars = [];
        scheduleNextSpawn(0);
        lastFrameTime = performance.now();
        rafId = requestAnimationFrame(tick);
    };

    self.hide = function (): Promise<void> {
        stopTimers();

        if (container?.parentNode) {
            container.parentNode.removeChild(container);
        }

        container = null;
        canvas = null;
        ctx = null;
        stars = [];

        return Promise.resolve();
    };
}
