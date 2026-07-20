import { PluginType } from 'constants/pluginType';

type StarShape = 'circle' | 'x' | 'plus';

interface Star {
    x: number;
    y: number;
    radius: number;
    maxAlpha: number;
    hue: number;
    sat: number;
    shape: StarShape;
    fadeIn: number;
    hold: number;
    fadeOut: number;
    totalLife: number;
    age: number;
}

interface Meteor {
    x: number;
    y: number;
    vx: number;
    vy: number;
    length: number;
    life: number;
    maxLife: number;
    hue: number;
}

const CONFIG = {
    maxStarsNormal: 100,
    maxStarsReducedMotion: 90,
    // Share of stars rendered as "x" / "+" diffraction spikes instead of plain dots.
    starShapeChance: { x: 0.11, plus: 0.11 },
    meteor: {
        minIntervalMs: 50 * 1000,
        maxIntervalMs: 180 * 1000,
        speedMinPxPerMs: 0.9,
        speedMaxPxPerMs: 1.6,
        lengthMin: 190,
        lengthMax: 1700,
        lineWidth: 2
    }
};

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

// Picks a realistic star color: mostly whitish, some blueish (hot stars like
// Sirius/Rigel), some reddish (cool stars like Betelgeuse/Antares).
function pickStarPalette(): { hue: number; sat: number } {
    const r = Math.random();
    if (r < 0.15) {
        return { hue: randomBetween(0, 25), sat: randomBetween(75, 95) }; // reddish
    }
    if (r < 0.30) {
        return { hue: randomBetween(200, 230), sat: randomBetween(75, 95) }; // blueish
    }
    return { hue: randomBetween(40, 60), sat: randomBetween(5, 20) }; // whitish/neutral (majority)
}

function pickStarShape(): StarShape {
    const r = Math.random();
    if (r < CONFIG.starShapeChance.x) return 'x';
    if (r < CONFIG.starShapeChance.x + CONFIG.starShapeChance.plus) return 'plus';
    return 'circle';
}

class StarfieldScreensaver {
    name = 'Starfield';
    type = PluginType.Screensaver;
    id = 'starfieldscreensaver';
    supportsAnonymous = true;

    private rafId: number | null = null;
    private spawnTimeoutId: ReturnType<typeof setTimeout> | null = null;
    private meteorTimeoutId: ReturnType<typeof setTimeout> | null = null;
    private resizeHandler: (() => void) | null = null;
    private container: HTMLDivElement | null = null;
    private canvas: HTMLCanvasElement | null = null;
    private ctx: CanvasRenderingContext2D | null = null;
    private stars: Star[] = [];
    private meteors: Meteor[] = [];
    private width = 0;
    private height = 0;
    private lastFrameTime = 0;
    private prefersReducedMotion = false;

    private readonly spawnStar = (): void => {
        if (!this.width || !this.height) return;

        const fadeIn = randomBetween(600, 1600);
        const hold = randomBetween(200, 900);
        const fadeOut = randomBetween(800, 2200);
        const palette = pickStarPalette();

        this.stars.push({
            x: randomBetween(0, this.width),
            y: randomBetween(0, this.height),
            radius: randomBetween(0.6, 2.1),
            maxAlpha: randomBetween(0.35, 1),
            hue: palette.hue,
            sat: palette.sat,
            shape: pickStarShape(),
            fadeIn,
            hold,
            fadeOut,
            totalLife: fadeIn + hold + fadeOut,
            age: 0
        });
    };

    private readonly scheduleNextSpawn = (delayOverride?: number): void => {
        // The spawn interval is derived from the desired star count: average
        // star lifetime (fadeIn+hold+fadeOut, ~3150ms on average) divided by
        // the target count. This keeps the steady-state population (new
        // stars balancing fading-out stars) actually close to
        // maxStarsNormal/maxStarsReducedMotion, instead of the limit having
        // no real effect.
        const maxConcurrent = this.prefersReducedMotion
            ? CONFIG.maxStarsReducedMotion
            : CONFIG.maxStarsNormal;
        const avgStarLifetimeMs = 3150;
        const targetInterval = avgStarLifetimeMs / Math.max(1, maxConcurrent);
        const delay = delayOverride ?? randomBetween(targetInterval * 0.5, targetInterval * 1.5);

        this.spawnTimeoutId = setTimeout(() => {
            this.spawnStar();
            this.scheduleNextSpawn();
        }, delay);
    };

    private readonly spawnMeteor = (): void => {
        if (!this.width || !this.height) return;

        // Meteor flies diagonally from top to bottom, sometimes coming from
        // the left, sometimes from the right.
        const angle = randomBetween(20, 50) * (Math.PI / 180);
        const dir = Math.random() < 0.5 ? 1 : -1;
        const speed = randomBetween(CONFIG.meteor.speedMinPxPerMs, CONFIG.meteor.speedMaxPxPerMs);
        const startX = dir === 1
            ? randomBetween(-100, this.width * 0.4)
            : randomBetween(this.width * 0.6, this.width + 100);
        const startY = randomBetween(-50, this.height * 0.3);

        this.meteors.push({
            x: startX,
            y: startY,
            vx: dir * speed * Math.cos(angle),
            vy: speed * Math.sin(angle),
            length: randomBetween(CONFIG.meteor.lengthMin, CONFIG.meteor.lengthMax),
            life: 0,
            maxLife: randomBetween(600, 1000),
            hue: randomBetween(195, 225)
        });
    };

    private readonly scheduleNextMeteor = (): void => {
        const delay = randomBetween(CONFIG.meteor.minIntervalMs, CONFIG.meteor.maxIntervalMs);
        this.meteorTimeoutId = setTimeout(() => {
            this.spawnMeteor();
            this.scheduleNextMeteor();
        }, delay);
    };

    private readonly drawStar = (star: Star, alpha: number): void => {
        const { ctx } = this;
        if (!ctx) return;

        ctx.save();
        if (star.maxAlpha > 0.7) {
            ctx.shadowBlur = star.radius * 5;
            ctx.shadowColor = `hsla(${star.hue}, ${star.sat}%, 88%, ${alpha * 0.6})`;
        }
        const color = `hsla(${star.hue}, ${star.sat}%, 88%, ${alpha})`;

        if (star.shape === 'circle') {
            ctx.beginPath();
            ctx.fillStyle = color;
            ctx.arc(star.x, star.y, star.radius, 0, Math.PI * 2);
            ctx.fill();
        } else {
            // "x"/"+" stars are drawn as soft diffraction spikes that fade
            // out towards the tip (similar to how bright stars look in
            // photos) rather than hard, evenly thick lines.
            const dirs: [number, number][] = star.shape === 'x'
                ? [[0.7071, 0.7071], [0.7071, -0.7071], [-0.7071, 0.7071], [-0.7071, -0.7071]]
                : [[1, 0], [-1, 0], [0, 1], [0, -1]];
            const tipDist = star.radius * 3.2;
            const baseWidth = Math.max(0.5, star.radius * 0.9);

            // Soft, bright core in the center.
            ctx.beginPath();
            ctx.fillStyle = color;
            ctx.arc(star.x, star.y, star.radius * 0.7, 0, Math.PI * 2);
            ctx.fill();

            for (const [dx, dy] of dirs) {
                const tipX = star.x + dx * tipDist;
                const tipY = star.y + dy * tipDist;
                const perpX = -dy * (baseWidth / 2);
                const perpY = dx * (baseWidth / 2);
                const gradient = ctx.createLinearGradient(star.x, star.y, tipX, tipY);
                gradient.addColorStop(0, color);
                gradient.addColorStop(1, `hsla(${star.hue}, ${star.sat}%, 88%, 0)`);

                ctx.beginPath();
                ctx.moveTo(star.x + perpX, star.y + perpY);
                ctx.lineTo(tipX, tipY);
                ctx.lineTo(star.x - perpX, star.y - perpY);
                ctx.closePath();
                ctx.fillStyle = gradient;
                ctx.fill();
            }
        }
        ctx.restore();
    };

    private readonly drawMeteors = (dt: number): void => {
        const { ctx } = this;
        if (!ctx) return;

        for (let i = this.meteors.length - 1; i >= 0; i--) {
            const meteor = this.meteors[i];
            meteor.life += dt;
            meteor.x += meteor.vx * dt;
            meteor.y += meteor.vy * dt;

            const lifeRatio = meteor.life / meteor.maxLife;
            if (
                lifeRatio >= 1
                || meteor.x < -200
                || meteor.x > this.width + 200
                || meteor.y > this.height + 200
            ) {
                this.meteors.splice(i, 1);
                continue;
            }

            // Quick fade-in, then fade-out towards the end of the trajectory.
            const alpha = lifeRatio < 0.15
                ? lifeRatio / 0.15
                : (lifeRatio > 0.7 ? Math.max(0, 1 - (lifeRatio - 0.7) / 0.3) : 1);

            const angle = Math.atan2(meteor.vy, meteor.vx);
            const tailX = meteor.x - Math.cos(angle) * meteor.length;
            const tailY = meteor.y - Math.sin(angle) * meteor.length;

            const gradient = ctx.createLinearGradient(meteor.x, meteor.y, tailX, tailY);
            gradient.addColorStop(0, `hsla(${meteor.hue}, 70%, 95%, ${alpha})`);
            gradient.addColorStop(1, `hsla(${meteor.hue}, 70%, 95%, 0)`);

            ctx.save();
            ctx.strokeStyle = gradient;
            ctx.lineWidth = CONFIG.meteor.lineWidth;
            ctx.lineCap = 'round';
            ctx.shadowBlur = 8;
            ctx.shadowColor = `hsla(${meteor.hue}, 70%, 95%, ${alpha * 0.8})`;
            ctx.beginPath();
            ctx.moveTo(meteor.x, meteor.y);
            ctx.lineTo(tailX, tailY);
            ctx.stroke();
            ctx.restore();
        }
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
            this.drawStar(star, alpha);
        }

        this.drawMeteors(dt);
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

        if (this.meteorTimeoutId !== null) {
            clearTimeout(this.meteorTimeoutId);
            this.meteorTimeoutId = null;
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
        this.meteors = [];
        this.scheduleNextSpawn(0);
        this.scheduleNextMeteor();
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
        this.meteors = [];

        return Promise.resolve();
    };
}

export default StarfieldScreensaver;
