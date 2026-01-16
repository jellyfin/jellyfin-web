/* frequencyAnalyzerWorker.js — Off-screen-canvas worker */
/* global scheme, colors */

let canvas;
let ctx;
let fftSize;
let minDecibels;
let maxDecibels;
let alpha;
let width;
let height;
let dpr;
let colorScheme = 'spectrum';
let colorSolid = '#1ED24B';
let colorLow = '#1ED24B';
let colorMid = '#FFD700';
let colorHigh = '#FF3232';

/**
 * Interpolates between two colors based on ratio
 * @param {string} color1 - Hex color start
 * @param {string} color2 - Hex color end
 * @param {number} ratio - Interpolation ratio (0-1)
 * @returns {string} RGB color string
 */
function interpolateColor(color1, color2, ratio) {
    const hex2rgb = (hex) => {
        const r = parseInt(hex.substring(1, 3), 16);
        const g = parseInt(hex.substring(3, 5), 16);
        const b = parseInt(hex.substring(5, 7), 16);
        return [r, g, b];
    };

    const [r1, g1, b1] = hex2rgb(color1);
    const [r2, g2, b2] = hex2rgb(color2);

    const r = Math.round(r1 + (r2 - r1) * ratio);
    const g = Math.round(g1 + (g2 - g1) * ratio);
    const b = Math.round(b1 + (b2 - b1) * ratio);

    return `rgb(${r}, ${g}, ${b})`;
}

globalThis.onmessage = function (event) {
    if (event.data.type === 'resize') {
        ({ width, height, dpr } = event.data);
        canvas.width = width * dpr;
        canvas.height = height * dpr;
        ctx.scale(dpr, dpr);
        return;
    }

    ({ canvas, fftSize, minDecibels, maxDecibels, alpha, width, height, dpr, colorScheme: scheme, colors } = event.data);
    if (scheme) colorScheme = scheme;
    if (colors) {
        colorSolid = colors.solid || colorSolid;
        colorLow = colors.low || colorLow;
        colorMid = colors.mid || colorMid;
        colorHigh = colors.high || colorHigh;
    }
    ctx = canvas.getContext('2d');
    canvas.width = width * dpr;
    canvas.height = height * dpr;
    ctx.scale(dpr, dpr);
    const previousBarHeights = new Float32Array(fftSize / 2);
    const sampleRate = 44100; // Default sample rate, adjust as needed
    const nyquist = sampleRate * 2;
    const MIN_FREQUENCY = 60;
    const MAX_FREQUENCY = nyquist;

    const clippingDecibel = 12;
    const nearClippingDecibel = -64;
    const amplitudeDecibels = [-90, -80, -70, -60, -50, -40, -30];

    const pinkNoiseReference = new Float32Array(fftSize / 2);
    for (let i = 0; i < fftSize / 2; i++) {
        const frequency = (i * nyquist) / (fftSize / 2);
        const pinkNoiseLevel = -10 * Math.log10(frequency || 1);
        pinkNoiseReference[i] = pinkNoiseLevel;
    }

    const draw = (data) => {
        if (!data || data.length === 0) return;

        const canvasWidth = ctx.canvas.width / dpr;
        const canvasHeight = ctx.canvas.height / dpr;

        ctx.clearRect(0, 0, canvasWidth, canvasHeight);

        const minBarWidth = Math.max(2, canvasWidth / 200);
        const barGap = Math.max(1, canvasWidth / 400);

        const maxBars = 96;
        const minBars = 16;
        const availableWidth = canvasWidth;
        const numberOfBars = Math.max(
            minBars,
            Math.min(
                maxBars,
                Math.floor(availableWidth / (minBarWidth + barGap))
            )
        );

        const frequencies = [];
        const xPositions = [];

        const logMinFreq = Math.log(MIN_FREQUENCY);
        const logMaxFreq = Math.log(MAX_FREQUENCY);

        for (let i = 0; i <= numberOfBars; i++) {
            const normPosition = i / numberOfBars;
            const scaledPosition = (Math.exp(alpha * normPosition) - 1) / (Math.exp(alpha) - 1);
            const frequency = MIN_FREQUENCY + scaledPosition * (MAX_FREQUENCY - MIN_FREQUENCY);
            frequencies.push(frequency);

            const freqForLog = Math.max(frequency, MIN_FREQUENCY);
            const x = ((Math.log(freqForLog) - logMinFreq) / (logMaxFreq - logMinFreq)) * canvasWidth;
            xPositions.push(x);
        }

        for (let i = 0; i < numberOfBars; i++) {
            const xLeft = xPositions[i];
            const xRight = xPositions[i + 1];
            let barWidth = xRight - xLeft - barGap;
            barWidth = Math.max(0, barWidth);
            const x = xLeft + barGap / 2;

            const bin = Math.floor(((frequencies[i] - MIN_FREQUENCY) / (nyquist - MIN_FREQUENCY)) * (fftSize / 2));
            const safeBin = Math.max(0, Math.min(bin, (fftSize / 2) - 1));

            const value = data[safeBin];
            const targetHeight = (value / 255) * canvasHeight;

            const currentHeight = previousBarHeights[i] || 0;
            const barHeight = currentHeight + (targetHeight - currentHeight) * 0.3;
            previousBarHeights[i] = barHeight;

            const pinkNoiseLevel = pinkNoiseReference[safeBin];
            const clippingLevel = pinkNoiseLevel + clippingDecibel;
            const nearClippingLevel = pinkNoiseLevel + nearClippingDecibel;

            const actualDecibel = minDecibels + (value / 255) * (maxDecibels - minDecibels);
            let fillColor = '';

            if (colorScheme === 'spectrum') {
                // Dynamic spectrum: Green → Yellow → Red based on intensity
                if (actualDecibel <= nearClippingLevel) {
                    const ratio = (actualDecibel - minDecibels) / (nearClippingLevel - minDecibels);
                    const saturation = 30 + ratio * 70;
                    fillColor = `hsl(120, ${saturation}%, 50%)`;
                } else if (actualDecibel > nearClippingLevel && actualDecibel < clippingLevel) {
                    const ratio = (actualDecibel - nearClippingLevel) / (clippingLevel - nearClippingLevel);
                    const hue = 120 - 120 * Math.min(ratio, 1);
                    fillColor = `hsl(${hue}, 100%, 50%)`;
                } else {
                    fillColor = 'hsl(0, 100%, 50%)';
                }
            } else if (colorScheme === 'gradient') {
                // Custom gradient: interpolate between low/mid/high colors
                const ratio = (actualDecibel - minDecibels) / (maxDecibels - minDecibels);
                const clamped = Math.min(Math.max(ratio, 0), 1);
                if (clamped < 0.5) {
                    // Low to Mid (0-50%)
                    fillColor = interpolateColor(colorLow, colorMid, clamped * 2);
                } else {
                    // Mid to High (50-100%)
                    fillColor = interpolateColor(colorMid, colorHigh, (clamped - 0.5) * 2);
                }
            } else if (colorScheme === 'solid' || colorScheme === 'albumArt') {
                // Solid or album art fallback
                fillColor = colorSolid;
            } else {
                // Fallback to solid color
                fillColor = colorSolid;
            }

            ctx.fillStyle = fillColor;
            ctx.fillRect(x, canvasHeight - barHeight, barWidth, barHeight);
        }

        const fontSize = Math.max(10, canvasHeight / 80);
        ctx.fillStyle = 'rgba(255, 255, 255, 0.4)';
        ctx.font = `${fontSize}px Noto Sans`;
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';

        amplitudeDecibels.forEach((decibel) => {
            const value = ((decibel - minDecibels) / (maxDecibels - minDecibels)) * 255;
            let y = canvasHeight - (value / 255) * canvasHeight;
            y = Math.min(Math.max(y, fontSize / 2), canvasHeight - fontSize / 2);
            const textX = Math.min(30, canvasWidth - fontSize * 2);

            ctx.beginPath();
            ctx.moveTo(0, y);
            ctx.lineTo(8, y);
            ctx.strokeStyle = 'rgba(255, 255, 255, 0.2)';
            ctx.lineWidth = 1;
            ctx.stroke();

            const label = `${decibel} dB`;
            ctx.fillText(label, textX, y);
        });

        ctx.fillStyle = 'rgba(255, 255, 255, 0.4)';
        ctx.font = `${fontSize}px Noto Sans`;
        ctx.textAlign = 'center';
        ctx.textBaseline = 'top';

        const commonFrequencies = [100, 200, 500, 1000, 2000, 5000, 10000, 20000];

        commonFrequencies.forEach((freq) => {
            const percent = (Math.log(freq) - logMinFreq) / (logMaxFreq - logMinFreq);
            let x = percent * canvasWidth;
            x = Math.min(Math.max(x, fontSize / 2), canvasWidth - fontSize / 2);

            ctx.beginPath();
            ctx.moveTo(x, 0);
            ctx.lineTo(x, 8);
            ctx.strokeStyle = 'rgba(255, 255, 255, 0.2)';
            ctx.lineWidth = 1;
            ctx.stroke();

            const label = freq >= 1000 ? `${freq / 1000}k Hz` : `${freq} Hz`;
            ctx.fillText(label, x, 17);
        });
    };

    globalThis.onmessage = function (innerEvent) {
        const { frequencyData } = innerEvent.data;
        draw(frequencyData);
    };
};
