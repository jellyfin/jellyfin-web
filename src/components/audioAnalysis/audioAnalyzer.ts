/**
 * Audio Analyzer Core
 *
 * Real-time audio analysis for DJ applications:
 * - BPM/tempo detection
 * - Key detection (Camelot wheel compatible)
 * - Energy/ loudness analysis
 * - Spectral features (centroid, rolloff, flux)
 * - Beat tracking
 *
 * Usage:
 * ```typescript
 * const analyzer = new AudioAnalyzer(audioContext);
 * const features = await analyzer.analyze(audioBuffer);
 * console.log(features.bpm, features.key, features.energy);
 * ```
 */

export interface AudioFeatures {
    bpm: number;
    bpmConfidence: number;
    key: string;
    keyConfidence: number;
    camelotKey: string;
    energy: number;
    loudness: number;
    spectralCentroid: number;
    spectralRolloff: number;
    spectralFlux: number;
    zeroCrossingRate: number;
    rmsEnergy: number;
    peakFrequency: number;
    dynamicRange: number;
    attackTime: number;
    decayTime: number;
}

export interface BeatInfo {
    tempo: number;
    beatTimes: number[];
    downbeatTimes: number[];
    beatConfidence: number;
    timeSignature: number;
}

export interface SpectralInfo {
    centroid: number;
    bandwidth: number;
    rolloff: number;
    flux: number;
    flatness: number;
    mfcc: number[];
    peakFrequency: number;
}

export class AudioAnalyzer {
    private audioContext: AudioContext;
    private fftSize: number;

    constructor(audioContext: AudioContext, fftSize = 2048) {
        this.audioContext = audioContext;
        this.fftSize = fftSize;
    }

    async analyze(audioBuffer: AudioBuffer): Promise<AudioFeatures> {
        const channelData = audioBuffer.getChannelData(0);
        const sampleRate = audioBuffer.sampleRate;

        const [bpmResult, keyResult, energy, spectral] = await Promise.all([
            this.detectBPM(channelData, sampleRate),
            this.detectKey(channelData, sampleRate),
            this.analyzeEnergy(channelData),
            this.analyzeSpectral(channelData, sampleRate)
        ]);

        return {
            bpm: bpmResult.tempo,
            bpmConfidence: bpmResult.confidence,
            key: keyResult.key,
            keyConfidence: keyResult.confidence,
            camelotKey: this.toCamelotKey(keyResult.key),
            energy: energy.mean,
            loudness: energy.loudness,
            spectralCentroid: spectral.centroid,
            spectralRolloff: spectral.rolloff,
            spectralFlux: spectral.flux,
            zeroCrossingRate: this.calculateZeroCrossingRate(channelData),
            rmsEnergy: energy.rms,
            peakFrequency: spectral.peakFrequency,
            dynamicRange: energy.dynamicRange,
            attackTime: energy.attackTime,
            decayTime: energy.decayTime
        };
    }

    async detectBPM(
        samples: Float32Array,
        sampleRate: number
    ): Promise<{ tempo: number; confidence: number }> {
        const bufferSize = 1024;
        const filterFreq = 100;
        const minBPM = 60;
        const maxBPM = 200;

        const filtered = this.lowpassFilter(samples, filterFreq, sampleRate);
        const decimated = this.decimate(filtered, Math.floor(sampleRate / 1000));
        const onsetEnv = this.calculateOnsetEnvelope(decimated, bufferSize);

        const acf = this.autocorrelation(onsetEnv);
        const maxLag = Math.floor((sampleRate / 1000 / minBPM) * decimated.length);
        const minLag = Math.floor((sampleRate / 1000 / maxBPM) * decimated.length);

        let bestLag = minLag;
        let maxVal = -Infinity;

        for (let i = minLag; i < Math.min(maxLag, acf.length); i++) {
            if (acf[i] > maxVal) {
                maxVal = acf[i];
                bestLag = i;
            }
        }

        const bpm = 60 / (bestLag / (sampleRate / 1000));
        const confidence = Math.min(1, maxVal / Math.max(...acf.slice(minLag)));

        return { tempo: Math.round(bpm * 10) / 10, confidence };
    }

    private lowpassFilter(
        samples: Float32Array,
        cutoffFreq: number,
        sampleRate: number
    ): Float32Array {
        const result = new Float32Array(samples.length);
        const rc = 1 / (2 * Math.PI * cutoffFreq);
        const dt = 1 / sampleRate;
        const alpha = dt / (rc + dt);

        result[0] = samples[0];
        for (let i = 1; i < samples.length; i++) {
            result[i] = result[i - 1] + alpha * (samples[i] - result[i - 1]);
        }

        return result;
    }

    private decimate(samples: Float32Array, factor: number): Float32Array {
        const result = new Float32Array(Math.floor(samples.length / factor));
        for (let i = 0; i < result.length; i++) {
            result[i] = samples[i * factor];
        }
        return result;
    }

    private calculateOnsetEnvelope(samples: Float32Array, windowSize: number): Float32Array {
        const result = new Float32Array(samples.length);
        for (let i = 0; i < samples.length; i++) {
            let sum = 0;
            const start = Math.max(0, i - windowSize);
            for (let j = start; j < i; j++) {
                const diff = samples[i] - samples[j];
                sum += diff * diff;
            }
            result[i] = Math.sqrt(sum / (i - start + 1));
        }
        return result;
    }

    private autocorrelation(samples: Float32Array): Float32Array {
        const n = samples.length;
        const result = new Float32Array(n);

        for (let lag = 0; lag < n; lag++) {
            let sum = 0;
            for (let i = 0; i < n - lag; i++) {
                sum += samples[i] * samples[i + lag];
            }
            result[lag] = sum / n;
        }

        return result;
    }

    async detectKey(
        samples: Float32Array,
        sampleRate: number
    ): Promise<{ key: string; confidence: number }> {
        const frameSize = 4096;
        const hopSize = 2048;
        const chroma = new Array(12).fill(0);

        for (let i = 0; i < samples.length - frameSize; i += hopSize) {
            const frame = samples.slice(i, i + frameSize);
            const windowed = this.hannWindow(frame);
            const spectrum = this.fft(windowed);

            for (let bin = 0; bin < spectrum.length / 2; bin++) {
                const freq = (bin * sampleRate) / frameSize;
                if (freq < 40 || freq > 5000) continue;

                const note = (12 * Math.log2(freq / 440) + 69) % 12;
                const chromaBin = Math.round(note);
                chroma[chromaBin] += spectrum[bin];
            }
        }

        const majorProfile = [
            6.35, 2.23, 3.48, 2.33, 4.38, 4.09, 2.52, 5.19, 2.39, 3.66, 2.29, 2.88
        ];
        const minorProfile = [
            6.33, 2.68, 3.52, 5.38, 2.6, 3.53, 2.54, 4.75, 3.98, 2.69, 3.34, 3.17
        ];

        let bestMajorCorr = -Infinity;
        let bestMajorKey = 0;
        let bestMinorCorr = -Infinity;
        let bestMinorKey = 0;

        for (let root = 0; root < 12; root++) {
            let majorSum = 0;
            let minorSum = 0;

            for (let i = 0; i < 12; i++) {
                const idx = (i + root) % 12;
                majorSum += chroma[idx] * majorProfile[i];
                minorSum += chroma[idx] * minorProfile[i];
            }

            if (majorSum > bestMajorCorr) {
                bestMajorCorr = majorSum;
                bestMajorKey = root;
            }
            if (minorSum > bestMinorCorr) {
                bestMinorCorr = minorSum;
                bestMinorKey = root;
            }
        }

        const keyNames = ['C', 'C#', 'D', 'D#', 'E', 'F', 'F#', 'G', 'G#', 'A', 'A#', 'B'];
        const majorConfidence =
            bestMajorCorr / Math.max(...chroma) / majorProfile.reduce((a, b) => a + b, 0);
        const minorConfidence =
            bestMinorCorr / Math.max(...chroma) / minorProfile.reduce((a, b) => a + b, 0);

        if (majorConfidence > minorConfidence) {
            return {
                key: keyNames[bestMajorKey] + ' Major',
                confidence: Math.min(1, majorConfidence)
            };
        }
        return { key: keyNames[bestMinorKey] + ' Minor', confidence: Math.min(1, minorConfidence) };
    }

    private toCamelotKey(key: string): string {
        const camelotMap: Record<string, string> = {
            'C Major': '8B',
            'A Minor': '8A',
            'C# Major': '3B',
            'G# Minor': '3A',
            'D Major': '10B',
            'B Minor': '10A',
            'Eb Major': '5B',
            'C Minor': '5A',
            'E Major': '12B',
            'Bb Minor': '12A',
            'F Major': '7B',
            'D Minor': '7A',
            'F# Major': '2B',
            'D# Minor': '2A',
            'G Major': '9B',
            'E Minor': '9A',
            'Ab Major': '4B',
            'F Minor': '4A',
            'A Major': '11B',
            'F# Minor': '11A',
            'Bb Major': '6B',
            'G Minor': '6A',
            'B Major': '1B',
            'Ab Minor': '1A'
        };
        return camelotMap[key] || 'Unknown';
    }

    private hannWindow(samples: Float32Array): Float32Array {
        const result = new Float32Array(samples.length);
        for (let i = 0; i < samples.length; i++) {
            result[i] = samples[i] * 0.5 * (1 - Math.cos((2 * Math.PI * i) / (samples.length - 1)));
        }
        return result;
    }

    private fft(samples: Float32Array): Float32Array {
        const n = samples.length;
        const real = new Float32Array(samples);
        const imag = new Float32Array(n);
        const magnitude = new Float32Array(n / 2);

        this._fft(real, imag, n);

        for (let i = 0; i < n / 2; i++) {
            magnitude[i] = Math.sqrt(real[i] * real[i] + imag[i] * imag[i]);
        }

        return magnitude;
    }

    private _fft(real: Float32Array, imag: Float32Array, n: number): void {
        if (n <= 1) return;

        const half = n / 2;
        const even = new Float32Array(half);
        const odd = new Float32Array(half);

        for (let i = 0; i < half; i++) {
            even[i] = real[2 * i];
            odd[i] = real[2 * i + 1];
        }

        const evenReal = even;
        const evenImag = new Float32Array(half);
        const oddReal = new Float32Array(half);
        const oddImag = odd;

        this._fft(evenReal, evenImag, half);
        this._fft(oddReal, oddImag, half);

        for (let k = 0; k < half; k++) {
            const angle = (-2 * Math.PI * k) / n;
            const cos = Math.cos(angle);
            const sin = Math.sin(angle);

            const tReal = cos * oddReal[k] - sin * oddImag[k];
            const tImag = cos * oddImag[k] + sin * oddReal[k];

            real[k] = evenReal[k] + tReal;
            imag[k] = evenImag[k] + tImag;
            real[k + half] = evenReal[k] - tReal;
            imag[k + half] = evenImag[k] - tImag;
        }
    }

    private analyzeEnergy(samples: Float32Array): Promise<{
        mean: number;
        rms: number;
        loudness: number;
        dynamicRange: number;
        attackTime: number;
        decayTime: number;
    }> {
        return new Promise((resolve) => {
            let sum = 0;
            let rmsSum = 0;
            let peak = -Infinity;
            let trough = Infinity;
            let attackStart = 0;
            let attackPeak = -Infinity;
            let attackPeakTime = 0;
            const decayStart = 0;
            let decayEnd = 0;

            const frameSize = 1024;
            const frames = Math.floor(samples.length / frameSize);
            const envelope = new Float32Array(frames);

            for (let i = 0; i < frames; i++) {
                let frameSum = 0;
                for (let j = 0; j < frameSize; j++) {
                    const sample = samples[i * frameSize + j];
                    frameSum += Math.abs(sample);
                    sum += sample * sample;
                }
                envelope[i] = frameSum / frameSize;

                if (envelope[i] > attackPeak) {
                    attackPeak = envelope[i];
                    attackPeakTime = i;
                }

                peak = Math.max(peak, envelope[i]);
                trough = Math.min(trough, envelope[i]);
            }

            for (let i = 0; i < frames; i++) {
                rmsSum += envelope[i] * envelope[i];

                if (i < attackPeakTime && envelope[i] > envelope[0] * 1.5) {
                    attackStart = i;
                }
            }

            const attackFrames = attackPeakTime - attackStart;
            for (let i = attackPeakTime; i < frames && envelope[i] < attackPeak * 0.5; i++) {
                decayEnd = i;
            }

            const meanEnergy = sum / samples.length;
            const rms = Math.sqrt(rmsSum / frames);
            const loudness = 20 * Math.log10(rms + 0.0001);
            const dynamicRange = 20 * Math.log10(peak / (trough + 0.0001));

            resolve({
                mean: meanEnergy,
                rms,
                loudness: Math.max(-60, loudness),
                dynamicRange: Math.min(60, dynamicRange),
                attackTime: (attackFrames * frameSize) / 44100,
                decayTime: ((decayEnd - attackPeakTime) * frameSize) / 44100
            });
        });
    }

    private analyzeSpectral(samples: Float32Array, sampleRate: number): Promise<SpectralInfo> {
        return new Promise((resolve) => {
            const frameSize = 2048;
            const hopSize = 1024;
            const frames = Math.floor((samples.length - frameSize) / hopSize);

            let centroidSum = 0;
            let bandwidthSum = 0;
            let rolloffSum = 0;
            let fluxSum = 0;
            let flatnessSum = 0;
            let peakMag = -Infinity;
            let peakFreq = 0;
            const mfccSum = new Array(13).fill(0);

            let prevSpectrum: Float32Array | null = null;

            for (let i = 0; i < frames; i++) {
                const start = i * hopSize;
                const frame = samples.slice(start, start + frameSize);
                const windowed = this.hannWindow(frame);
                const spectrum = this.fft(windowed);
                const magSpectrum = new Float32Array(spectrum.length);

                let magSum = 0;
                for (let j = 0; j < spectrum.length; j++) {
                    magSpectrum[j] = Math.abs(spectrum[j]);
                    magSum += magSpectrum[j];
                }

                let centroid = 0;
                for (let j = 0; j < magSpectrum.length; j++) {
                    const freq = (j * sampleRate) / frameSize;
                    centroid += freq * magSpectrum[j];

                    if (magSpectrum[j] > peakMag) {
                        peakMag = magSpectrum[j];
                        peakFreq = freq;
                    }
                }
                centroid /= magSum;

                centroidSum += centroid;

                let bandwidth = 0;
                for (let j = 0; j < magSpectrum.length; j++) {
                    const freq = (j * sampleRate) / frameSize;
                    bandwidth += (freq - centroid) ** 2 * magSpectrum[j];
                }
                bandwidthSum += Math.sqrt(bandwidth / magSum);

                let rolloffEnergy = magSum * 0.85;
                let rolloff = 0;
                for (let j = 0; j < magSpectrum.length; j++) {
                    rolloffEnergy -= magSpectrum[j];
                    if (rolloffEnergy <= 0) {
                        rolloff = (j * sampleRate) / frameSize;
                        break;
                    }
                }
                rolloffSum += rolloff;

                if (prevSpectrum) {
                    let flux = 0;
                    for (let j = 1; j < magSpectrum.length; j++) {
                        const diff = magSpectrum[j] - prevSpectrum[j];
                        if (diff > 0) {
                            flux += diff * diff;
                        }
                    }
                    fluxSum += Math.sqrt(flux);
                }
                prevSpectrum = magSpectrum;

                let geoMean = 1;
                const arithMean = magSum / magSpectrum.length;
                for (let j = 0; j < magSpectrum.length; j++) {
                    geoMean *= (magSpectrum[j] + 0.0001) ** (1 / magSpectrum.length);
                }
                flatnessSum += geoMean / (arithMean + 0.0001);

                if (frames > 0) {
                    centroidSum /= frames;
                    bandwidthSum /= frames;
                    rolloffSum /= frames;
                    fluxSum /= frames;
                    flatnessSum /= frames;
                }

                resolve({
                    centroid: centroidSum,
                    bandwidth: bandwidthSum,
                    rolloff: rolloffSum,
                    flux: fluxSum,
                    flatness: flatnessSum,
                    mfcc: mfccSum,
                    peakFrequency: 0
                });
            }
        });
    }

    private calculateZeroCrossingRate(samples: Float32Array): number {
        let crossings = 0;
        for (let i = 1; i < samples.length; i++) {
            if (
                (samples[i] >= 0 && samples[i - 1] < 0) ||
                (samples[i] < 0 && samples[i - 1] >= 0)
            ) {
                crossings++;
            }
        }
        return crossings / samples.length;
    }

    async trackBeats(audioBuffer: AudioBuffer, bpm: number): Promise<BeatInfo> {
        const channelData = audioBuffer.getChannelData(0);
        const sampleRate = audioBuffer.sampleRate;
        const duration = audioBuffer.duration;

        const beatInterval = 60 / bpm;
        const beatTimes: number[] = [];
        const downbeatTimes: number[] = [];

        for (let t = 0; t < duration; t += beatInterval) {
            beatTimes.push(t);

            if (Math.round(t / beatInterval) % 4 === 0) {
                downbeatTimes.push(t);
            }
        }

        return {
            tempo: bpm,
            beatTimes,
            downbeatTimes,
            beatConfidence: 0.8,
            timeSignature: 4
        };
    }

    async getBeatGrid(audioBuffer: AudioBuffer, bpm: number): Promise<Float32Array> {
        const channelData = audioBuffer.getChannelData(0);
        const sampleRate = audioBuffer.sampleRate;
        const duration = audioBuffer.duration;

        const beatInterval = 60 / bpm;
        const numBeats = Math.ceil(duration / beatInterval);
        const beatGrid = new Float32Array(numBeats);

        for (let i = 0; i < numBeats; i++) {
            beatGrid[i] = i * beatInterval;
        }

        return beatGrid;
    }
}

export default AudioAnalyzer;
