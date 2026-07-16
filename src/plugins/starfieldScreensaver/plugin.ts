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

function randomBetween(min: number, max: number): number {
    // Cosmetic randomness only (star position/timing) - not security-sensitive.
    return min + Math.random() * (max - min); // NOSONAR
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

class StarfieldScreensaver {
    name = 'Starfield';
    type = PluginType.Screensaver;
    id = 'starfieldscreensaver';
    supportsAnonymous = true;

    private rafId: number | null = null;
    private spawnTimeoutId: ReturnType<typeof setTimeout> | null = null;
    private resizeHandler: (() => void) | null = null;
    private container: HTMLDivElement | null = null;
    private canvas: HTMLCanvasElement | null = null;
    private ctx: CanvasRenderingContext2D | null = null;
    private stars: Star[] = [];
    private width = 0;
    private height = 0;
    private lastFrameTime = 0;
    private prefersReducedMotion = false;

    private readonly spawnStar = (): void => {
        if (!this.width || !this.height) return;

        const fadeIn = randomBetween(600, 1600);
        const hold = randomBetween(200, 900);
        const fadeOut = randomBetween(800, 2200);

        this.stars.push({
            x: randomBetween(0, this.width),
            y: randomBetween(0, this.height),
            radius: randomBetween(0.6, 1.8),
            maxAlpha: randomBetween(0.35, 1),
            hue: randomBetween(200, 220),
            fadeIn,
            hold,
            fadeOut,
            totalLife: fadeIn + hold + fadeOut,
            age: 0
        });
    };

    private readonly scheduleNextSpawn = (delayOverride?: number): void => {
        const delay = delayOverride ?? randomBetween(80, 260);

        this.spawnTimeoutId = setTimeout(() => {
            this.spawnStar();

            const maxConcurrent = this.prefersReducedMotion ? 12 : 45;
            if (this.stars.length < maxConcurrent) {
                this.scheduleNextSpawn();
            } else {
                this.scheduleNextSpawn(randomBetween(200, 400));
            }
        }, delay);
    };

    private readonly draw = (dt: number): void => {
        const { ctx } = this;
        if (!ctx) return;

        ctx.fillStyle = '#000';
        ctx.fillRect(0, 0, this.width, this.height);

        for (let i = this.stars.length - 1; i >= 0; i--) {
            const star = this.stars[i];
            star.age += dt;

            if (star.age >= star.totalLife) {
                this.stars.splice(i, 1);
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
    };

    private readonly tick = (now: number): void => {
        const dt = now - (this.lastFrameTime || now);
        this.lastFrameTime = now;

        this.draw(dt);

        this.rafId = requestAnimationFrame(this.tick);
    };

    private readonly resizeCanvas = (): void => {
        const { canvas, ctx } = this;
        if (!canvas || !ctx) return;

        const dpr = window.devicePixelRatio || 1;
        this.width = window.innerWidth;
        this.height = window.innerHeight;

        canvas.width = this.width * dpr;
        canvas.height = this.height * dpr;
        ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    };

    private buildDom(): void {
        this.container = document.createElement('div');
        this.container.classList.add('starfieldScreensaver');
        this.container.style.position = 'fixed';
        this.container.style.top = '0';
        this.container.style.left = '0';
        this.container.style.width = '100%';
        this.container.style.height = '100%';
        this.container.style.backgroundColor = '#000';
        this.container.style.zIndex = '99999';

        this.canvas = document.createElement('canvas');
        this.canvas.style.display = 'block';
        this.canvas.style.width = '100%';
        this.canvas.style.height = '100%';
        this.container.appendChild(this.canvas);

        document.body.appendChild(this.container);

        this.ctx = this.canvas.getContext('2d');
    }

    private stopTimers(): void {
        if (this.rafId !== null) {
            cancelAnimationFrame(this.rafId);
            this.rafId = null;
        }

        if (this.spawnTimeoutId !== null) {
            clearTimeout(this.spawnTimeoutId);
            this.spawnTimeoutId = null;
        }

        if (this.resizeHandler) {
            window.removeEventListener('resize', this.resizeHandler);
            this.resizeHandler = null;
        }
    }

    readonly show = (): void => {
        this.prefersReducedMotion = !!window.matchMedia?.('(prefers-reduced-motion: reduce)').matches;

        this.buildDom();
        this.resizeCanvas();

        this.resizeHandler = () => this.resizeCanvas();
        window.addEventListener('resize', this.resizeHandler);

        this.stars = [];
        this.scheduleNextSpawn(0);
        this.lastFrameTime = performance.now();
        this.rafId = requestAnimationFrame(this.tick);
    };

    readonly hide = (): Promise<void> => {
        this.stopTimers();

        this.container?.remove();

        this.container = null;
        this.canvas = null;
        this.ctx = null;
        this.stars = [];

        return Promise.resolve();
    };
}

export default StarfieldScreensaver;
