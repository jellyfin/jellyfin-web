//!
//! jellyfin-audio-wasm - Rust/WASM audio processors for Jellyfin web player
//!
//! ## Processors
//!
//! - **TimeStretcher**: Time-stretching with smooth tempo transitions
//!   Uses linear interpolation for resampling
//!   Supports gradual tempo changes for DJ-style pause effects
//!
//! ## Usage
//!
//! ```javascript
//! import init, { TimeStretcher } from './jellyfin_audio_wasm';
//! await init();
//!
//! const stretcher = TimeStretcher.new(44100, 2, 1024);
//! stretcher.set_tempo(1.0); // Normal speed
//!
//! // DJ-style pause: slow to stop over 2 seconds
//! stretcher.begin_pause_transition(2.0);
//!
//! // Resume: speed back up over 0.5 seconds
//! stretcher.begin_resume_transition(0.5);
//!
//! const output = stretcher.process(input_samples, num_frames);
//! ```
//!

use wasm_bindgen::prelude::*;

#[wasm_bindgen]
extern "C" {
    #[wasm_bindgen(js_namespace = console)]
    fn log(s: &str);
}

macro_rules! console_log {
    ($($t:tt)*) => (log(&format_args!($($t)*).to_string()))
}

/// Linear interpolation
#[inline]
fn lerp(a: f32, b: f32, t: f32) -> f32 {
    a + (b - a) * t
}

/// Clamp a value between min and max
#[inline]
fn clamp(value: f32, min: f32, max: f32) -> f32 {
    if value < min {
        min
    } else if value > max {
        max
    } else {
        value
    }
}

/// TimeStretcher with smooth tempo transitions for DJ effects
#[wasm_bindgen]
pub struct TimeStretcher {
    channels: usize,
    sample_rate: usize,
    tempo: f64,
    target_tempo: f64,
    transition_start_time: f64,
    transition_duration: f64,
    transition_start_tempo: f64,
    is_transitioning: bool,
    start_time: f64,
}

#[wasm_bindgen]
impl TimeStretcher {
    /// Create a new TimeStretcher
    #[wasm_bindgen(constructor)]
    pub fn new(sample_rate: usize, channels: usize, _chunk_size: usize) -> TimeStretcher {
        console_log!("TimeStretcher created: {}Hz, {}ch", sample_rate, channels);

        TimeStretcher {
            channels,
            sample_rate,
            tempo: 1.0,
            target_tempo: 1.0,
            transition_start_time: 0.0,
            transition_duration: 0.0,
            transition_start_tempo: 1.0,
            is_transitioning: false,
            start_time: js_sys::Date::now(),
        }
    }

    /// Set tempo directly (0.0 to 2.0)
    #[wasm_bindgen]
    pub fn set_tempo(&mut self, tempo: f64) {
        self.tempo = clamp(tempo as f32, 0.0, 2.0) as f64;
        self.target_tempo = self.tempo;
        self.is_transitioning = false;
    }

    /// Get current tempo
    #[wasm_bindgen]
    pub fn get_tempo(&self) -> f64 {
        self.tempo
    }

    /// Begin a smooth transition to a new tempo
    #[wasm_bindgen]
    pub fn begin_transition(&mut self, target_tempo: f64, duration_seconds: f64) {
        let clamped_target = clamp(target_tempo as f32, 0.0, 2.0) as f64;

        self.transition_start_tempo = self.tempo;
        self.target_tempo = clamped_target;
        self.transition_duration = duration_seconds;
        self.transition_start_time = self.get_current_time();
        self.is_transitioning = true;

        console_log!("Transition: {:.2} -> {:.2} over {:.2}s",
            self.transition_start_tempo, clamped_target, duration_seconds);
    }

    /// DJ-style pause: smoothly slow to stop over specified duration
    #[wasm_bindgen]
    pub fn begin_pause_transition(&mut self, duration_seconds: f64) {
        self.begin_transition(0.0, duration_seconds);
    }

    /// DJ-style resume: smoothly speed back to 1.0 over specified duration
    #[wasm_bindgen]
    pub fn begin_resume_transition(&mut self, duration_seconds: f64) {
        self.begin_transition(1.0, duration_seconds);
    }

    /// Check if currently transitioning
    #[wasm_bindgen]
    pub fn is_transitioning(&self) -> bool {
        self.is_transitioning
    }

    /// Check if effectively stopped (tempo near 0)
    #[wasm_bindgen]
    pub fn is_stopped(&self) -> bool {
        self.tempo < 0.001
    }

    /// Get processing latency (0 for this implementation)
    #[wasm_bindgen]
    pub fn get_latency(&self) -> usize {
        0
    }

    /// Get number of channels
    #[wasm_bindgen]
    pub fn get_channels(&self) -> usize {
        self.channels
    }

    /// Get sample rate
    #[wasm_bindgen]
    pub fn get_sample_rate(&self) -> usize {
        self.sample_rate
    }

    /// Process audio samples with current tempo
    #[wasm_bindgen]
    pub fn process(&mut self, input: &[f32], num_frames: usize) -> Vec<f32> {
        self.update_transition();

        if self.tempo < 0.001 {
            return vec![0.0; input.len()];
        }

        let ratio = 1.0 / self.tempo;
        let output_frames = (num_frames as f64 / ratio) as usize;
        let mut output = vec![0.0; output_frames * self.channels];

        for ch in 0..self.channels {
            for i in 0..output_frames {
                let src_pos = i as f64 * ratio;
                let src_idx = src_pos as usize;
                let frac = src_pos - src_idx as f64;

                if src_idx + 1 < num_frames {
                    let s1 = input[src_idx * self.channels + ch];
                    let s2 = input[(src_idx + 1) * self.channels + ch];
                    output[i * self.channels + ch] = lerp(s1, s2, frac as f32);
                } else if src_idx < num_frames {
                    output[i * self.channels + ch] = input[src_idx * self.channels + ch];
                }
            }
        }

        output
    }

    /// Process and return silence if stopped
    #[wasm_bindgen]
    pub fn process_with_silence(&mut self, input: &[f32], num_frames: usize) -> Vec<f32> {
        if self.is_stopped() {
            vec![0.0; input.len()]
        } else {
            self.process(input, num_frames)
        }
    }

    /// Flush (no-op for this implementation)
    #[wasm_bindgen]
    pub fn flush(&mut self) -> Vec<f32> {
        vec![]
    }

    /// Reset state
    #[wasm_bindgen]
    pub fn reset(&mut self) {
        self.tempo = 1.0;
        self.target_tempo = 1.0;
        self.is_transitioning = false;
        console_log!("TimeStretcher reset");
    }

    /// Stop immediately
    #[wasm_bindgen]
    pub fn stop(&mut self) {
        self.tempo = 0.0;
        self.target_tempo = 0.0;
        self.is_transitioning = false;
    }

    /// Update internal transition state
    fn update_transition(&mut self) {
        if !self.is_transitioning {
            return;
        }

        let elapsed = self.get_current_time() - self.transition_start_time;
        let progress = if self.transition_duration > 0.0 {
            (elapsed / self.transition_duration) as f32
        } else {
            1.0
        };

        if progress >= 1.0 {
            self.tempo = self.target_tempo;
            self.is_transitioning = false;
            console_log!("Transition complete: {:.2}", self.tempo);
        } else {
            // Smooth easing (ease-in-out)
            let eased = if progress < 0.5 {
                2.0 * progress * progress
            } else {
                1.0 - (-2.0 * progress + 2.0).powi(2) / 2.0
            };
            self.tempo = lerp(self.transition_start_tempo as f32, self.target_tempo as f32, eased) as f64;
        }
    }

    fn get_current_time(&self) -> f64 {
        js_sys::Date::now() - self.start_time
    }
}

/// Simple pitch shifter using resampling
#[wasm_bindgen]
pub struct PitchShifter {
    sample_rate: usize,
    channels: usize,
}

#[wasm_bindgen]
impl PitchShifter {
    #[wasm_bindgen(constructor)]
    pub fn new(sample_rate: usize, channels: usize, _fft_size: usize) -> PitchShifter {
        console_log!("PitchShifter created: {}Hz, {}ch", sample_rate, channels);
        PitchShifter {
            sample_rate,
            channels,
        }
    }

    /// Shift pitch in semitones
    #[wasm_bindgen]
    pub fn shift_semitones(&self, samples: &[f32], semitones: f32) -> Vec<f32> {
        let ratio = 2.0f64.powf(semitones as f64 / 12.0);
        let ratio = clamp(ratio as f32, 0.25, 4.0) as f64;

        let input_len = samples.len() / self.channels;
        let output_len = (input_len as f64 / ratio) as usize;
        let mut output = vec![0.0; output_len * self.channels];

        for ch in 0..self.channels {
            for i in 0..output_len {
                let src_pos = i as f64 * ratio;
                let src_idx = src_pos as usize;
                let frac = src_pos - src_idx as f64;

                if src_idx + 1 < input_len {
                    let s1 = samples[src_idx * self.channels + ch];
                    let s2 = samples[(src_idx + 1) * self.channels + ch];
                    output[i * self.channels + ch] = lerp(s1, s2, frac as f32);
                }
            }
        }

        output
    }
}

/// Get library version
#[wasm_bindgen]
pub fn version() -> String {
    format!("jellyfin-audio-wasm v{} - TimeStretch with DJ transitions", env!("CARGO_PKG_VERSION"))
}

/// Get library info
#[wasm_bindgen]
pub fn info() -> String {
    format!(r#"{{
  "version": "{}",
  "features": ["time_stretch", "dj_pause_effects", "smooth_transitions"],
  "max_tempo": 2.0,
  "min_tempo": 0.0,
  "max_pause_duration": 10.0,
  "transition_curves": ["ease_in_out"]
}}"#, env!("CARGO_PKG_VERSION"))
}
