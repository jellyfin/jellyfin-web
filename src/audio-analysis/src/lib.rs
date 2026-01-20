//! jellyfin-audio-analysis - Auto-DJ audio analysis for track analysis and smart transitions

use wasm_bindgen::prelude::*;
use serde::{Serialize, Deserialize};
use serde_json;
use std::f32::consts::PI;

const MAJOR_PROFILE: [f32; 12] = [6.35, 2.23, 3.48, 2.33, 4.38, 4.09, 2.52, 5.19, 2.39, 3.66, 2.29, 2.88];
const MINOR_PROFILE: [f32; 12] = [6.33, 2.68, 3.52, 5.38, 2.60, 3.53, 2.54, 4.75, 3.98, 2.69, 3.34, 3.17];

#[wasm_bindgen]
pub struct AutoDJAnalyzer {
    fft_size: usize,
}

#[derive(Clone, Copy)]
struct Complex {
    re: f32,
    im: f32,
}

impl Complex {
    fn new(re: f32, im: f32) -> Self {
        Self { re, im }
    }

    fn add(&self, other: Complex) -> Complex {
        Complex::new(self.re + other.re, self.im + other.im)
    }

    fn sub(&self, other: Complex) -> Complex {
        Complex::new(self.re - other.re, self.im - other.im)
    }

    fn mul(&self, other: Complex) -> Complex {
        Complex::new(
            self.re * other.re - self.im * other.im,
            self.re * other.im + self.im * other.re,
        )
    }
}

#[wasm_bindgen]
impl AutoDJAnalyzer {
    #[wasm_bindgen(constructor)]
    pub fn new(fft_size: usize) -> Self {
        Self { fft_size }
    }

    pub fn analyze_full(&self, samples: &[f32], sample_rate: f32) -> String {
        let bpm_result = self.detect_bpm(samples, sample_rate);
        let key_result = self.detect_key(samples, sample_rate);
        let energy = self.analyze_energy(samples);
        let spectral = self.analyze_spectral(samples, sample_rate);
        let frequency = self.analyze_frequency_bands(samples, sample_rate);
        let intro = self.analyze_intro(samples, sample_rate, &energy);
        let outro = self.analyze_outro(samples, sample_rate, &energy);
        let energy_profile = self.analyze_energy_profile(samples, sample_rate, &energy);
        let transitions = self.calculate_transition_points(&intro, &outro, &energy_profile);
        let genre = self.classify_genre(&self.features_to_basic(&bpm_result, &energy, &spectral));
        let key_clone = key_result.0.clone();

        let analysis = FullTrackAnalysis {
            bpm: bpm_result.0,
            bpm_confidence: bpm_result.1,
            key: key_result.0,
            key_confidence: key_result.1,
            camelot_key: self.to_camelot_key(&key_clone),
            energy: energy.mean,
            loudness: energy.loudness,
            spectral_centroid: spectral.centroid,
            spectral_rolloff: spectral.rolloff,
            spectral_flux: spectral.flux,
            zero_crossing_rate: energy.zcr,
            rms_energy: energy.rms,
            peak_frequency: spectral.peak_frequency,
            dynamic_range: energy.dynamic_range,
            brightness: spectral.centroid / 10000.0,
            warmth: (1.0 - (spectral.centroid / 10000.0).min(1.0)).max(0.0),
            roughness: spectral.flatness,
            bass_mean: frequency.bass_mean,
            bass_peak: frequency.bass_peak,
            bass_energy: frequency.bass_energy,
            mid_mean: frequency.mid_mean,
            mid_peak: frequency.mid_peak,
            mid_energy: frequency.mid_energy,
            high_mean: frequency.high_mean,
            high_peak: frequency.high_peak,
            high_energy: frequency.high_energy,
            bass_mid_ratio: frequency.bass_mid_ratio,
            mid_high_ratio: frequency.mid_high_ratio,
            overall_balance: frequency.overall_balance,
            intro_best_start_point: intro.best_start_point,
            intro_confidence: intro.start_point_confidence,
            intro_has_silence: intro.has_silence,
            intro_energy_buildup: intro.energy_buildup_rate,
            outro_best_end_point: outro.best_end_point,
            outro_confidence: outro.end_point_confidence,
            outro_energy_decay: outro.energy_decay_rate,
            overall_momentum: energy_profile.overall_momentum,
            average_energy: energy_profile.average_energy,
            peak_energy: energy_profile.peak_energy,
            valley_energy: energy_profile.valley_energy,
            energy_variance: energy_profile.energy_variance,
            mix_in_point: transitions.recommended_mix_in,
            mix_out_point: transitions.recommended_mix_out,
            mix_in_confidence: transitions.mix_in_confidence,
            mix_out_confidence: transitions.mix_out_confidence,
            energy_match_in: transitions.energy_match_in,
            energy_match_out: transitions.energy_match_out,
            crossfade_duration: transitions.optimal_crossfade_duration,
            primary_genre: genre.primary_genre,
            genre_confidence: genre.genre_confidence,
        };

        serde_json::to_string(&analysis).unwrap_or_default()
    }

    fn features_to_basic(&self, bpm: &(f32, f32), energy: &EnergyBasic, spectral: &SpectralBasic) -> BasicFeatures {
        BasicFeatures {
            bpm: bpm.0,
            energy: energy.mean,
            spectral_centroid: spectral.centroid,
            zero_crossing_rate: energy.zcr,
            dynamic_range: energy.dynamic_range,
        }
    }

    fn detect_bpm(&self, samples: &[f32], sample_rate: f32) -> (f32, f32) {
        let decimation_factor = (sample_rate / 1000.0) as usize;
        let decimated: Vec<f32> = samples.iter().step_by(decimation_factor).cloned().collect();
        let onset_env = self.calculate_onset_envelope(&decimated, 1024);
        let acf = self.autocorrelation(&onset_env);

        let min_bpm = 60.0;
        let max_bpm = 200.0;
        let min_lag = (sample_rate / 1000.0 / max_bpm * decimated.len() as f32) as usize;
        let max_lag = (sample_rate / 1000.0 / min_bpm * decimated.len() as f32) as usize;

        let mut max_val: f32 = -1.0;
        let mut best_lag = min_lag;

        for lag in min_lag..std::cmp::min(max_lag, acf.len()) {
            if acf[lag] > max_val {
                max_val = acf[lag];
                best_lag = lag;
            }
        }

        let bpm = 60.0 / (best_lag as f32 / (sample_rate / 1000.0));
        let max_acf = acf[min_lag..std::cmp::min(max_lag, acf.len())]
            .iter()
            .fold(0.0, |max, &v| v.max(max));
        let confidence = (max_val / max_acf).min(1.0);

        (bpm.round() / 10.0, confidence)
    }

    fn calculate_onset_envelope(&self, samples: &[f32], window_size: usize) -> Vec<f32> {
        let mut result = Vec::with_capacity(samples.len());

        for i in 0..samples.len() {
            let start = if i > window_size { i - window_size } else { 0 };
            let mut sum: f32 = 0.0;

            for j in start..=i {
                let diff = samples[i] - samples[j];
                sum += diff * diff;
            }

            result.push((sum / (i - start + 1) as f32).sqrt());
        }

        result
    }

    fn autocorrelation(&self, samples: &[f32]) -> Vec<f32> {
        let n = samples.len();
        let mut result = Vec::with_capacity(n);

        for lag in 0..n {
            let mut sum: f32 = 0.0;
            for i in 0..n - lag {
                sum += samples[i] * samples[i + lag];
            }
            result.push(sum / n as f32);
        }

        result
    }

    fn detect_key(&self, samples: &[f32], sample_rate: f32) -> (String, f32) {
        let frame_size = 4096;
        let hop_size = 2048;
        let mut chroma = [0.0; 12];

        for i in (0..samples.len().saturating_sub(frame_size)).step_by(hop_size) {
            let frame: Vec<f32> = samples[i..i + frame_size]
                .iter()
                .enumerate()
                .map(|(j, &s)| s * 0.5 * (1.0 - (2.0 * PI * j as f32 / frame_size as f32).cos()))
                .collect();

            let spectrum = self.fft(&frame);

            for (bin, &mag) in spectrum.iter().enumerate().take(spectrum.len() / 2) {
                let freq = bin as f32 * sample_rate / frame_size as f32;
                if freq < 40.0 || freq > 5000.0 {
                    continue;
                }

                let note = (12.0 * (freq / 440.0).log2() + 69.0) % 12.0;
                let chroma_bin = note.round() as usize % 12;
                chroma[chroma_bin] += mag;
            }
        }

        let mut best_major_corr: f32 = -1.0;
        let mut best_major_key = 0;
        let mut best_minor_corr: f32 = -1.0;
        let mut best_minor_key = 0;

        for root in 0..12 {
            let mut major_sum: f32 = 0.0;
            let mut minor_sum: f32 = 0.0;

            for i in 0..12 {
                let idx = (i + root) % 12;
                major_sum += chroma[idx] * MAJOR_PROFILE[i];
                minor_sum += chroma[idx] * MINOR_PROFILE[i];
            }

            if major_sum > best_major_corr {
                best_major_corr = major_sum;
                best_major_key = root;
            }
            if minor_sum > best_minor_corr {
                best_minor_corr = minor_sum;
                best_minor_key = root;
            }
        }

        let key_names = ["C", "C#", "D", "D#", "E", "F", "F#", "G", "G#", "A", "A#", "B"];
        let major_max = chroma.iter().fold(0.0, |m, &v| v.max(m));
        let minor_max = chroma.iter().fold(0.0, |m, &v| v.max(m));
        let major_confidence = best_major_corr / major_max / MAJOR_PROFILE.iter().sum::<f32>();
        let minor_confidence = best_minor_corr / minor_max / MINOR_PROFILE.iter().sum::<f32>();

        if major_confidence > minor_confidence {
            (format!("{} Major", key_names[best_major_key]), major_confidence.min(1.0))
        } else {
            (format!("{} Minor", key_names[best_minor_key]), minor_confidence.min(1.0))
        }
    }

    fn to_camelot_key(&self, key: &str) -> String {
        let camelot_map: [(i32, &str); 24] = [
            (0, "8B"), (1, "3B"), (2, "10B"), (3, "5B"), (4, "12B"), (5, "7B"),
            (6, "2B"), (7, "9B"), (8, "4B"), (9, "11B"), (10, "6B"), (11, "1B"),
            (0, "8A"), (1, "3A"), (2, "10A"), (3, "5A"), (4, "12A"), (5, "7A"),
            (6, "2A"), (7, "9A"), (8, "4A"), (9, "11A"), (10, "6A"), (11, "1A"),
        ];

        let root_names = ["C", "C#", "D", "D#", "E", "F", "F#", "G", "G#", "A", "A#", "B"];

        let is_minor = key.contains("Minor");
        let root = key.split_whitespace().next().unwrap_or("C");
        let root_idx = root_names.iter().position(|&r| r == root).unwrap_or(0) as i32;
        let key_idx = if is_minor { root_idx + 12 } else { root_idx };

        camelot_map.iter()
            .find(|(idx, _)| *idx == key_idx)
            .map(|(_, name)| name.to_string())
            .unwrap_or_else(|| "?".to_string())
    }

    fn fft(&self, samples: &[f32]) -> Vec<f32> {
        let n = samples.len().next_power_of_two();
        let mut real: Vec<f32> = samples.iter().cloned().collect();
        let mut imag = vec![0.0; n];
        real.resize(n, 0.0);
        imag.resize(n, 0.0);
        self.fft_impl(&mut real, &mut imag, n);
        let mut magnitude = Vec::with_capacity(n / 2);
        for i in 0..n / 2 {
            magnitude.push((real[i] * real[i] + imag[i] * imag[i]).sqrt());
        }
        magnitude
    }

    fn fft_impl(&self, real: &mut [f32], imag: &mut [f32], n: usize) {
        if n <= 1 { return; }
        let half = n / 2;
        let mut even = vec![0.0; half];
        let mut odd = vec![0.0; half];
        for i in 0..half {
            even[i] = real[2 * i];
            odd[i] = real[2 * i + 1];
        }
        let mut even_real = even;
        let mut even_imag = vec![0.0; half];
        let mut odd_real = odd;
        let mut odd_imag = vec![0.0; half];
        self.fft_impl(&mut even_real, &mut even_imag, half);
        self.fft_impl(&mut odd_real, &mut odd_imag, half);
        for k in 0..half {
            let angle = -2.0 * PI * k as f32 / n as f32;
            let cos = angle.cos();
            let sin = angle.sin();
            let t_real = cos * odd_real[k] - sin * odd_imag[k];
            let t_imag = cos * odd_imag[k] + sin * odd_real[k];
            real[k] = even_real[k] + t_real;
            imag[k] = even_imag[k] + t_imag;
            real[k + half] = even_real[k] - t_real;
            imag[k + half] = even_imag[k] - t_imag;
        }
    }

    fn analyze_energy(&self, samples: &[f32]) -> EnergyBasic {
        let frame_size = 1024;
        let num_frames = samples.len() / frame_size;
        let mut envelope = Vec::with_capacity(num_frames);
        let mut sum_sq: f32 = 0.0;
        let mut peak: f32 = 0.0;
        let mut trough: f32 = f32::MAX;
        let mut zcr = 0;

        for i in 0..num_frames {
            let start = i * frame_size;
            let mut frame_sum: f32 = 0.0;
            for j in 0..frame_size {
                let sample = samples[start + j];
                let abs_sample = sample.abs();
                frame_sum += abs_sample;
                sum_sq += sample * sample;
                peak = peak.max(abs_sample);
                trough = trough.min(abs_sample);
                if j > 0 && (sample >= 0.0 && samples[start + j - 1] < 0.0 || sample < 0.0 && samples[start + j - 1] >= 0.0) {
                    zcr += 1;
                }
            }
            envelope.push(frame_sum / frame_size as f32);
        }

        let mut attack_peak_idx = 0;
        let mut attack_peak_val: f32 = 0.0;
        for (i, &val) in envelope.iter().enumerate() {
            if val > attack_peak_val {
                attack_peak_val = val;
                attack_peak_idx = i;
            }
        }

        let attack_start = envelope[..attack_peak_idx]
            .iter()
            .position(|&v| v > envelope[0] * 1.5)
            .unwrap_or(0);

        let attack_time = (attack_peak_idx - attack_start) as f32 * frame_size as f32 / 44100.0;

        let mut decay_end = attack_peak_idx;
        for i in attack_peak_idx..envelope.len() {
            if envelope[i] < attack_peak_val * 0.5 {
                decay_end = i;
                break;
            }
        }
        let decay_time = (decay_end - attack_peak_idx) as f32 * frame_size as f32 / 44100.0;

        EnergyBasic {
            mean: sum_sq / samples.len() as f32,
            rms: (sum_sq / samples.len() as f32).sqrt(),
            loudness: 20.0 * ((sum_sq / samples.len() as f32).sqrt() + 0.0001).log10(),
            dynamic_range: 20.0 * (peak / (trough + 0.0001)).log10().min(60.0),
            attack_time,
            decay_time,
            zcr: zcr as f32 / samples.len() as f32,
            envelope,
        }
    }

    fn analyze_spectral(&self, samples: &[f32], sample_rate: f32) -> SpectralBasic {
        let frame_size = 2048;
        let hop_size = 1024;
        let num_frames = (samples.len().saturating_sub(frame_size)) / hop_size;

        let mut centroid_sum: f32 = 0.0;
        let mut rolloff_sum: f32 = 0.0;
        let mut flux_sum: f32 = 0.0;
        let mut flatness_sum: f32 = 0.0;
        let mut peak_mag: f32 = 0.0;
        let mut peak_freq: f32 = 0.0;
        let mut prev_spectrum: Option<Vec<f32>> = None;

        for i in 0..num_frames {
            let start = i * hop_size;
            let frame: Vec<f32> = samples[start..start + frame_size.min(samples.len() - start)]
                .iter()
                .enumerate()
                .map(|(j, &s)| s * 0.5 * (1.0 - (2.0 * PI * j as f32 / frame_size as f32).cos()))
                .collect();

            let spectrum = self.fft(&frame);
            let mag_spectrum: Vec<f32> = spectrum.iter().map(|&m| m.abs()).collect();
            let mag_sum: f32 = mag_spectrum.iter().sum();

            let mut centroid: f32 = 0.0;
            for (bin, &mag) in mag_spectrum.iter().enumerate().take(mag_spectrum.len() / 2) {
                let freq = bin as f32 * sample_rate / frame_size as f32;
                centroid += freq * mag;
                if mag > peak_mag {
                    peak_mag = mag;
                    peak_freq = freq;
                }
            }
            centroid_sum += centroid / (mag_sum + 0.0001);

            let mut rolloff_energy = mag_sum * 0.85;
            let mut rolloff: f32 = 0.0;
            for (bin, &mag) in mag_spectrum.iter().enumerate().take(mag_spectrum.len() / 2) {
                rolloff_energy -= mag;
                if rolloff_energy <= 0.0 {
                    rolloff = bin as f32 * sample_rate / frame_size as f32;
                    break;
                }
            }
            rolloff_sum += rolloff;

            if let Some(prev) = &prev_spectrum {
                let mut flux: f32 = 0.0;
                for (a, b) in mag_spectrum.iter().skip(1).zip(prev.iter().skip(1)) {
                    let diff = b - a;
                    if diff > 0.0 {
                        flux += diff * diff;
                    }
                }
                flux_sum += flux.sqrt();
            }
            let mag_spectrum_clone = mag_spectrum.clone();
            prev_spectrum = Some(mag_spectrum);

            let geo_product = mag_spectrum_clone.iter().fold(1.0f32, |prod, &v| prod * (v + 0.0001));
            let geo_mean = geo_product.powf(1.0 / mag_spectrum_clone.len() as f32);
            let arith_mean = mag_sum / mag_spectrum_clone.len() as f32;
            flatness_sum += geo_mean / (arith_mean + 0.0001);
        }

        SpectralBasic {
            centroid: centroid_sum / num_frames as f32,
            rolloff: rolloff_sum / num_frames as f32,
            flux: flux_sum / (num_frames as f32 - 1.0).max(1.0),
            flatness: flatness_sum / num_frames as f32,
            peak_frequency: peak_freq,
        }
    }

    fn analyze_frequency_bands(&self, samples: &[f32], sample_rate: f32) -> FrequencyBands {
        let frame_size = 2048;
        let hop_size = 1024;
        let num_frames = (samples.len().saturating_sub(frame_size)) / hop_size;

        let bass_bins = (200.0 * frame_size as f32 / sample_rate) as usize;
        let mid_bins = (2000.0 * frame_size as f32 / sample_rate) as usize;
        let high_bins = (8000.0 * frame_size as f32 / sample_rate) as usize;

        let mut bass_energies = Vec::with_capacity(num_frames);
        let mut mid_energies = Vec::with_capacity(num_frames);
        let mut high_energies = Vec::with_capacity(num_frames);

        for i in 0..num_frames {
            let start = i * hop_size;
            let frame: Vec<f32> = samples[start..start + frame_size.min(samples.len() - start)].to_vec();
            let spectrum = self.fft(&frame);
            let mag_spectrum: Vec<f32> = spectrum.iter().map(|&m| m.abs()).collect();

            let bass_energy: f32 = mag_spectrum[..bass_bins.min(mag_spectrum.len())].iter().sum();
            let mid_energy: f32 = mag_spectrum[bass_bins..mid_bins.min(mag_spectrum.len())].iter().sum();
            let high_energy: f32 = mag_spectrum[mid_bins..high_bins.min(mag_spectrum.len())].iter().sum();

            bass_energies.push(bass_energy);
            mid_energies.push(mid_energy);
            high_energies.push(high_energy);
        }

        let bass_mean = bass_energies.iter().sum::<f32>() / bass_energies.len() as f32;
        let mid_mean = mid_energies.iter().sum::<f32>() / mid_energies.len() as f32;
        let high_mean = high_energies.iter().sum::<f32>() / high_energies.len() as f32;

        FrequencyBands {
            bass_mean,
            bass_peak: bass_energies.iter().fold(0.0, |m, &v| v.max(m)),
            bass_energy: bass_energies.iter().sum(),
            mid_mean,
            mid_peak: mid_energies.iter().fold(0.0, |m, &v| v.max(m)),
            mid_energy: mid_energies.iter().sum(),
            high_mean,
            high_peak: high_energies.iter().fold(0.0, |m, &v| v.max(m)),
            high_energy: high_energies.iter().sum(),
            bass_mid_ratio: bass_mean / (mid_mean + 0.0001),
            mid_high_ratio: mid_mean / (high_mean + 0.0001),
            overall_balance: (bass_mean + mid_mean + high_mean) / 3.0,
        }
    }

    fn analyze_intro(&self, samples: &[f32], sample_rate: f32, energy: &EnergyBasic) -> IntroAnalysis {
        let duration = samples.len() as f32 / sample_rate;
        let intro_duration = (duration * 0.15).min(60.0);
        let intro_end_sample = (intro_duration * sample_rate) as usize;

        let intro_samples = &samples[..samples.len().min(intro_end_sample)];

        let silence_threshold = 0.001;
        let has_silence = intro_samples.iter().any(|&s| s.abs() < silence_threshold);

        let energy_profile: Vec<f32> = energy.envelope.iter()
            .take((intro_duration * sample_rate / 1024.0) as usize)
            .cloned()
            .collect();

        let mut best_start_point: f32 = 0.0;
        let mut best_confidence: f32 = 0.0;
        let mut energy_buildup_rate: f32 = 0.0;

        if has_silence {
            let silence_end = intro_samples.iter()
                .position(|&s| s.abs() > silence_threshold)
                .map(|p| p as f32 / sample_rate)
                .unwrap_or(0.0);

            best_start_point = silence_end.max(0.5);
            best_confidence = 0.8;
        } else {
            let avg_energy: f32 = energy_profile.iter().sum::<f32>() / energy_profile.len() as f32;
            let low_energy_idx = energy_profile.iter()
                .position(|&e| e > avg_energy * 1.5)
                .unwrap_or(0);

            best_start_point = (low_energy_idx as f32 * 1024.0 / sample_rate).max(2.0);
            best_confidence = 0.6;
        }

        if energy_profile.len() > 1 {
            let first_quarter = energy_profile.len() / 4;
            let last_quarter = energy_profile.len() * 3 / 4;
            if last_quarter > first_quarter {
                let first_avg: f32 = energy_profile[..first_quarter].iter().sum::<f32>() / first_quarter as f32;
                let last_avg: f32 = energy_profile[last_quarter..].iter().sum::<f32>() / (energy_profile.len() - last_quarter) as f32;
                energy_buildup_rate = (last_avg - first_avg) / (energy_profile.len() as f32);
            }
        }

        IntroAnalysis {
            best_start_point,
            start_point_confidence: best_confidence,
            has_silence,
            energy_buildup_rate,
        }
    }

    fn analyze_outro(&self, samples: &[f32], sample_rate: f32, energy: &EnergyBasic) -> OutroAnalysis {
        let duration = samples.len() as f32 / sample_rate;
        let outro_duration = (duration * 0.2).min(90.0);
        let outro_start_sample = ((duration - outro_duration) * sample_rate) as usize;

        let energy_profile: Vec<f32> = energy.envelope.iter()
            .skip((energy.envelope.len() as f32 * 0.8) as usize)
            .cloned()
            .collect();

        let mut best_end_point: f32 = duration;
        let mut best_confidence: f32 = 0.0;
        let mut energy_decay_rate: f32 = 0.0;

        let avg_energy: f32 = energy_profile.iter().sum::<f32>() / energy_profile.len() as f32;
        let low_energy_idx: Option<usize> = energy_profile.iter()
            .rev()
            .position(|&e| e < avg_energy * 0.3);

        if let Some(idx) = low_energy_idx {
            let from_end = idx as f32 * 1024.0 / sample_rate;
            best_end_point = duration - from_end.max(3.0);
            best_confidence = 0.7;
        } else {
            best_end_point = duration - 8.0;
            best_confidence = 0.5;
        }

        if energy_profile.len() > 1 {
            let first_quarter = energy_profile.len() / 4;
            let last_quarter = energy_profile.len() * 3 / 4;
            if last_quarter > first_quarter {
                let first_avg: f32 = energy_profile[..first_quarter].iter().sum::<f32>() / first_quarter as f32;
                let last_avg: f32 = energy_profile[last_quarter..].iter().sum::<f32>() / (energy_profile.len() - last_quarter) as f32;
                energy_decay_rate = (first_avg - last_avg) / (energy_profile.len() as f32);
            }
        }

        OutroAnalysis {
            best_end_point,
            end_point_confidence: best_confidence,
            energy_decay_rate,
        }
    }

    fn analyze_energy_profile(&self, samples: &[f32], sample_rate: f32, _energy: &EnergyBasic) -> EnergyProfile {
        let duration = samples.len() as f32 / sample_rate;
        let num_sections = 16;
        let section_duration = duration / num_sections as f32;
        let section_samples = (section_duration * sample_rate) as usize;

        let mut section_energies = Vec::with_capacity(num_sections);
        let mut momentum_profile = Vec::with_capacity(num_sections);

        for i in 0..num_sections {
            let start = i * section_samples;
            let end = start + section_samples.min(samples.len() - start);
            let section: &[f32] = &samples[start..end];
            let section_energy: f32 = section.iter().map(|&s| s * s).sum::<f32>() / section.len() as f32;
            section_energies.push(section_energy.sqrt());
        }

        for i in 0..num_sections {
            if i == 0 {
                momentum_profile.push(section_energies[0]);
            } else {
                let change = section_energies[i] - section_energies[i - 1];
                momentum_profile.push(change.max(0.0));
            }
        }

        let avg_energy: f32 = section_energies.iter().sum::<f32>() / section_energies.len() as f32;
        let peak_energy = section_energies.iter().fold(0.0, |m, &v| v.max(m));
        let valley_energy = section_energies.iter().fold(f32::MAX, |m, &v| v.min(m));
        let variance: f32 = section_energies.iter()
            .map(|e| (e - avg_energy).powi(2))
            .sum::<f32>() / section_energies.len() as f32;

        let overall_momentum = momentum_profile.iter().sum::<f32>() / momentum_profile.len() as f32;

        EnergyProfile {
            overall_momentum,
            average_energy: avg_energy,
            peak_energy,
            valley_energy,
            energy_variance: variance,
        }
    }

    fn calculate_transition_points(&self, intro: &IntroAnalysis, outro: &OutroAnalysis, energy: &EnergyProfile) -> TransitionPoints {
        let beat_interval = 60.0 / 128.0;

        let recommended_mix_in = intro.best_start_point + 2.0;
        let recommended_mix_out = outro.best_end_point - 4.0;

        let mix_in_beats = (recommended_mix_in / beat_interval).round() * beat_interval;
        let mix_out_beats = (recommended_mix_out / beat_interval).round() * beat_interval;

        let energy_match_in = 0.7;
        let energy_match_out = 0.7;

        let optimal_crossfade_duration = 24.0;

        TransitionPoints {
            recommended_mix_in,
            recommended_mix_out,
            mix_in_confidence: intro.start_point_confidence,
            mix_out_confidence: outro.end_point_confidence,
            energy_match_in,
            energy_match_out,
            optimal_crossfade_duration,
        }
    }

    fn classify_genre(&self, features: &BasicFeatures) -> GenreClassification {
        let scores = [
            ("House", Self::score_house(features)),
            ("Techno", Self::score_techno(features)),
            ("Drum & Bass", Self::score_dnb(features)),
            ("Trance", Self::score_trance(features)),
            ("Dubstep", Self::score_dubstep(features)),
            ("Hip Hop", Self::score_hiphop(features)),
            ("Rock", Self::score_rock(features)),
            ("Pop", Self::score_pop(features)),
            ("Ambient", Self::score_ambient(features)),
            ("Jazz", Self::score_jazz(features)),
        ];

        let mut sorted: Vec<_> = scores.iter().map(|(n, s)| (*n, *s)).collect();
        sorted.sort_by(|a, b| b.1.partial_cmp(&a.1).unwrap());

        let primary_genre = sorted[0].0.to_string();
        let primary_confidence = sorted[0].1;

        GenreClassification {
            primary_genre,
            genre_confidence: primary_confidence,
        }
    }

    fn score_house(f: &BasicFeatures) -> f32 {
        let mut score: f32 = 0.0;
        if f.bpm >= 118.0 && f.bpm <= 130.0 { score += 0.3; }
        if f.spectral_centroid > 2000.0 && f.spectral_centroid < 5000.0 { score += 0.2; }
        if f.energy > 0.3 { score += 0.2; }
        if f.dynamic_range < 30.0 { score += 0.2; }
        if f.zero_crossing_rate > 0.05 { score += 0.1; }
        score
    }

    fn score_techno(f: &BasicFeatures) -> f32 {
        let mut score: f32 = 0.0;
        if f.bpm >= 120.0 && f.bpm <= 150.0 { score += 0.3; }
        if f.spectral_centroid > 3000.0 { score += 0.2; }
        if f.energy > 0.4 { score += 0.2; }
        if f.dynamic_range < 25.0 { score += 0.2; }
        if f.zero_crossing_rate > 0.08 { score += 0.1; }
        score
    }

    fn score_dnb(f: &BasicFeatures) -> f32 {
        let mut score: f32 = 0.0;
        if f.bpm >= 160.0 && f.bpm <= 180.0 { score += 0.4; }
        if f.energy > 0.5 { score += 0.2; }
        if f.spectral_centroid > 4000.0 { score += 0.15; }
        if f.dynamic_range > 35.0 { score += 0.15; }
        if f.zero_crossing_rate > 0.1 { score += 0.1; }
        score
    }

    fn score_trance(f: &BasicFeatures) -> f32 {
        let mut score: f32 = 0.0;
        if f.bpm >= 128.0 && f.bpm <= 145.0 { score += 0.3; }
        if f.energy > 0.35 { score += 0.2; }
        if f.dynamic_range > 30.0 { score += 0.2; }
        if f.spectral_centroid > 2500.0 { score += 0.15; }
        score
    }

    fn score_dubstep(f: &BasicFeatures) -> f32 {
        let mut score: f32 = 0.0;
        if f.bpm >= 135.0 && f.bpm <= 145.0 { score += 0.25; }
        if f.spectral_centroid > 5000.0 { score += 0.2; }
        if f.dynamic_range > 40.0 { score += 0.2; }
        if f.zero_crossing_rate > 0.12 { score += 0.2; }
        if f.energy > 0.6 { score += 0.15; }
        score
    }

    fn score_hiphop(f: &BasicFeatures) -> f32 {
        let mut score: f32 = 0.0;
        if f.bpm >= 80.0 && f.bpm <= 110.0 { score += 0.3; }
        if f.dynamic_range > 35.0 { score += 0.2; }
        if f.spectral_centroid < 2500.0 { score += 0.2; }
        if f.zero_crossing_rate < 0.06 { score += 0.15; }
        if f.energy < 0.3 { score += 0.15; }
        score
    }

    fn score_rock(f: &BasicFeatures) -> f32 {
        let mut score: f32 = 0.0;
        if f.bpm >= 100.0 && f.bpm <= 140.0 { score += 0.25; }
        if f.energy > 0.45 { score += 0.25; }
        if f.dynamic_range > 35.0 { score += 0.2; }
        if f.spectral_centroid > 3000.0 { score += 0.15; }
        if f.zero_crossing_rate > 0.07 { score += 0.15; }
        score
    }

    fn score_pop(f: &BasicFeatures) -> f32 {
        let mut score: f32 = 0.0;
        if f.bpm >= 100.0 && f.bpm <= 130.0 { score += 0.3; }
        if f.energy > 0.3 && f.energy < 0.6 { score += 0.25; }
        if f.dynamic_range < 35.0 { score += 0.2; }
        if f.spectral_centroid > 2000.0 && f.spectral_centroid < 4500.0 { score += 0.15; }
        if f.zero_crossing_rate > 0.04 { score += 0.1; }
        score
    }

    fn score_ambient(f: &BasicFeatures) -> f32 {
        let mut score: f32 = 0.0;
        if f.energy < 0.2 { score += 0.4; }
        if f.dynamic_range < 25.0 { score += 0.25; }
        if f.spectral_centroid < 2000.0 { score += 0.2; }
        if f.zero_crossing_rate < 0.03 { score += 0.15; }
        score
    }

    fn score_jazz(f: &BasicFeatures) -> f32 {
        let mut score: f32 = 0.0;
        if f.bpm >= 60.0 && f.bpm <= 120.0 { score += 0.3; }
        if f.dynamic_range > 30.0 { score += 0.25; }
        if f.spectral_centroid < 3000.0 { score += 0.2; }
        if f.zero_crossing_rate < 0.05 { score += 0.15; }
        score
    }

    pub fn suggest_transition(&self, current_json: &str, next_json: &str) -> String {
        let current_analysis: FullTrackAnalysis = if let Ok(analysis) = serde_json::from_str(current_json) {
            analysis
        } else {
            return String::from("{}");
        };

        let next_analysis: FullTrackAnalysis = if let Ok(analysis) = serde_json::from_str(next_json) {
            analysis
        } else {
            return String::from("{}");
        };

        let bpm_diff = (next_analysis.bpm - current_analysis.bpm).abs();
        let bpm_compatible = bpm_diff < 5.0 || (current_analysis.bpm - next_analysis.bpm).abs() % 2.0 < 0.5;

        let current_camelot = &current_analysis.camelot_key;
        let next_camelot = &next_analysis.camelot_key;
        let harmonic_compatible = Self::harmonically_compatible(current_camelot, next_camelot);

        let energy_match = 1.0 - (next_analysis.energy - current_analysis.energy).abs().min(1.0);

        let freq_compatibility = Self::frequency_compatible(current_analysis.bass_mean, current_analysis.mid_mean, current_analysis.high_mean,
                                                            next_analysis.bass_mean, next_analysis.mid_mean, next_analysis.high_mean);

        let transition_type = if harmonic_compatible && energy_match > 0.7 {
            "Harmonic Mix".to_string()
        } else if bpm_diff > 10.0 {
            "Tempo Change".to_string()
        } else if energy_match > 0.8 {
            "Energy Mix".to_string()
        } else if bpm_compatible {
            "Beat Matched".to_string()
        } else {
            "Standard Crossfade".to_string()
        };

        let fx_recommendation = Self::suggest_fx(&transition_type, current_analysis.bass_mid_ratio, next_analysis.bass_mid_ratio, harmonic_compatible);

        let suggestion = TransitionSuggestion {
            transition_type,
            compatibility_score: if harmonic_compatible { 0.8 } else if energy_match > 0.7 { 0.6 } else { 0.4 },
            energy_match,
            harmonic_compatibility: if harmonic_compatible { 1.0 } else { 0.0 },
            mix_in_point: next_analysis.intro_best_start_point + 2.0,
            mix_out_point: current_analysis.outro_best_end_point - 4.0,
            crossfade_duration: 24.0,
            fx_recommendation,
        };

        serde_json::to_string(&suggestion).unwrap_or_default()
    }

    fn harmonically_compatible(key1: &str, key2: &str) -> bool {
        if key1 == "?" || key2 == "?" {
            return false;
        }

        let key1_num: i32 = key1[..key1.len() - 1].parse().unwrap_or(0);
        let key1_letter = key1.chars().last().unwrap_or('B');
        let key2_num: i32 = key2[..key2.len() - 1].parse().unwrap_or(0);
        let key2_letter = key2.chars().last().unwrap_or('B');

        if key1_letter == key2_letter && (key1_num == key2_num || (key1_num - key2_num).abs() == 12) {
            return true;
        }

        let compatible_pairs = [
            (1, 8), (2, 9), (3, 10), (4, 11), (5, 12), (6, 7),
            (8, 1), (9, 2), (10, 3), (11, 4), (12, 5), (7, 6),
        ];

        for (a, b) in compatible_pairs {
            if key1_num == a && key2_num == b {
                return true;
            }
        }

        let minor_to_major = [
            (5, 8), (12, 3), (7, 10), (2, 11), (9, 4), (4, 1), (11, 6),
        ];

        for (a, b) in minor_to_major {
            if key1_num == a && key2_num == b && key1_letter == 'A' && key2_letter == 'B' {
                return true;
            }
        }

        false
    }

    fn frequency_compatible(c_bass: f32, c_mid: f32, c_high: f32, n_bass: f32, n_mid: f32, n_high: f32) -> f32 {
        let bass_diff = (n_bass - c_bass).abs() / (c_bass + 0.0001);
        let mid_diff = (n_mid - c_mid).abs() / (c_mid + 0.0001);
        let high_diff = (n_high - c_high).abs() / (c_high + 0.0001);

        let avg_diff = (bass_diff + mid_diff + high_diff) / 3.0;
        1.0 - avg_diff.min(1.0)
    }

    fn suggest_fx(transition_type: &str, current_bass_mid: f32, next_bass_mid: f32, harmonic_compatible: bool) -> String {
        let mut fx = Vec::new();

        if !harmonic_compatible {
            if current_bass_mid > 1.5 || next_bass_mid > 1.5 {
                fx.push("Notch Filter 60Hz");
            }
        }

        match transition_type {
            "Harmonic Mix" => {
                fx.push("Reverb - Hall");
                fx.push("Light Echo");
            }
            "Energy Mix" => {
                fx.push("Reverb - Plate");
                fx.push("Filter Sweep");
            }
            "Tempo Change" => {
                fx.push("Short Reverb");
                fx.push("Transient Effect");
            }
            _ => {
                fx.push("Light Reverb");
            }
        }

        fx.join(", ")
    }

    pub fn version() -> String {
        "jellyfin-audio-analysis v0.2.0".to_string()
    }
}

#[derive(serde::Serialize, serde::Deserialize)]
struct FullTrackAnalysis {
    bpm: f32,
    bpm_confidence: f32,
    key: String,
    key_confidence: f32,
    camelot_key: String,
    energy: f32,
    loudness: f32,
    spectral_centroid: f32,
    spectral_rolloff: f32,
    spectral_flux: f32,
    zero_crossing_rate: f32,
    rms_energy: f32,
    peak_frequency: f32,
    dynamic_range: f32,
    brightness: f32,
    warmth: f32,
    roughness: f32,
    bass_mean: f32,
    bass_peak: f32,
    bass_energy: f32,
    mid_mean: f32,
    mid_peak: f32,
    mid_energy: f32,
    high_mean: f32,
    high_peak: f32,
    high_energy: f32,
    bass_mid_ratio: f32,
    mid_high_ratio: f32,
    overall_balance: f32,
    intro_best_start_point: f32,
    intro_confidence: f32,
    intro_has_silence: bool,
    intro_energy_buildup: f32,
    outro_best_end_point: f32,
    outro_confidence: f32,
    outro_energy_decay: f32,
    overall_momentum: f32,
    average_energy: f32,
    peak_energy: f32,
    valley_energy: f32,
    energy_variance: f32,
    mix_in_point: f32,
    mix_out_point: f32,
    mix_in_confidence: f32,
    mix_out_confidence: f32,
    energy_match_in: f32,
    energy_match_out: f32,
    crossfade_duration: f32,
    primary_genre: String,
    genre_confidence: f32,
}

#[derive(serde::Serialize, serde::Deserialize)]
struct TransitionSuggestion {
    transition_type: String,
    compatibility_score: f32,
    energy_match: f32,
    harmonic_compatibility: f32,
    mix_in_point: f32,
    mix_out_point: f32,
    crossfade_duration: f32,
    fx_recommendation: String,
}

struct EnergyBasic {
    mean: f32,
    rms: f32,
    loudness: f32,
    dynamic_range: f32,
    attack_time: f32,
    decay_time: f32,
    zcr: f32,
    envelope: Vec<f32>,
}

struct SpectralBasic {
    centroid: f32,
    rolloff: f32,
    flux: f32,
    flatness: f32,
    peak_frequency: f32,
}

struct BasicFeatures {
    bpm: f32,
    energy: f32,
    spectral_centroid: f32,
    zero_crossing_rate: f32,
    dynamic_range: f32,
}

struct FrequencyBands {
    bass_mean: f32,
    bass_peak: f32,
    bass_energy: f32,
    mid_mean: f32,
    mid_peak: f32,
    mid_energy: f32,
    high_mean: f32,
    high_peak: f32,
    high_energy: f32,
    bass_mid_ratio: f32,
    mid_high_ratio: f32,
    overall_balance: f32,
}

struct IntroAnalysis {
    best_start_point: f32,
    start_point_confidence: f32,
    has_silence: bool,
    energy_buildup_rate: f32,
}

struct OutroAnalysis {
    best_end_point: f32,
    end_point_confidence: f32,
    energy_decay_rate: f32,
}

struct EnergyProfile {
    overall_momentum: f32,
    average_energy: f32,
    peak_energy: f32,
    valley_energy: f32,
    energy_variance: f32,
}

struct TransitionPoints {
    recommended_mix_in: f32,
    recommended_mix_out: f32,
    mix_in_confidence: f32,
    mix_out_confidence: f32,
    energy_match_in: f32,
    energy_match_out: f32,
    optimal_crossfade_duration: f32,
}

struct GenreClassification {
    primary_genre: String,
    genre_confidence: f32,
}
