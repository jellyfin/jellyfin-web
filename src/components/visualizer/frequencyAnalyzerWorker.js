let canvas;
let ctx;
let fftSize;
let minDecibels;
let maxDecibels;
let alpha;
let width;
let height;
let dpr;

globalThis.onmessage = function (event) {
    if (event.data.type === 'resize') {
        ({ width, height, dpr } = event.data);
        canvas.width = width * dpr;
        canvas.height = height * dpr;
        ctx.scale(dpr, dpr);
        return;
    }

    ({ canvas, fftSize, minDecibels, maxDecibels, alpha, width, height, dpr } = event.data);
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
