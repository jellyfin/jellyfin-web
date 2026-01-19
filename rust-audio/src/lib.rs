#[no_mangle]
pub extern "C" fn process_limiter(
    input_ptr: *const f32,
    output_ptr: *mut f32,
    len: usize,
    threshold: f32,
    ratio: f32,
    attack: f32,
    release: f32,
    envelope: f32,
) -> f32 {
    let input = unsafe { std::slice::from_raw_parts(input_ptr, len) };
    let output = unsafe { std::slice::from_raw_parts_mut(output_ptr, len) };
    
    let mut current_envelope = envelope;

    for (i, &sample) in input.iter().enumerate() {
        let abs_sample = sample.abs();

        if abs_sample > current_envelope {
            current_envelope += (abs_sample - current_envelope) * attack;
        } else {
            current_envelope += (abs_sample - current_envelope) * release;
        }

        let mut gain = 1.0;
        if current_envelope > threshold {
            let exponent = 1.0 - (1.0 / ratio);
            gain = (threshold / current_envelope).powf(exponent);
        }

        output[i] = sample * gain;
    }
    
    current_envelope
}

#[repr(C)]
pub struct BiquadState {
    z1: f32,
    z2: f32,
}

#[no_mangle]
pub extern "C" fn process_biquad(
    input_ptr: *const f32,
    output_ptr: *mut f32,
    len: usize,
    state_ptr: *mut BiquadState,
    b0: f32, b1: f32, b2: f32,
    a1: f32, a2: f32,
) {
    let input = unsafe { std::slice::from_raw_parts(input_ptr, len) };
    let output = unsafe { std::slice::from_raw_parts_mut(output_ptr, len) };
    let state = unsafe { &mut *state_ptr };

    for i in 0..len {
        let x = input[i];
        let y = b0 * x + state.z1;
        state.z1 = b1 * x - a1 * y + state.z2;
        state.z2 = b2 * x - a2 * y;
        output[i] = y;
    }
}

#[no_mangle]
pub extern "C" fn allocate_state() -> *mut BiquadState {
    Box::into_raw(Box::new(BiquadState { z1: 0.0, z2: 0.0 }))
}

#[no_mangle]
pub extern "C" fn deallocate_state(ptr: *mut BiquadState) {
    unsafe {
        if !ptr.is_null() {
            let _ = Box::from_raw(ptr);
        }
    }
}

// Memory management functions for JS to allocate buffer in Wasm memory
#[no_mangle]
pub extern "C" fn allocate(size: usize) -> *mut f32 {
    let mut buffer = Vec::with_capacity(size);
    let ptr = buffer.as_mut_ptr();
    std::mem::forget(buffer); // Prevent deallocation
    ptr
}

#[no_mangle]
pub extern "C" fn deallocate(ptr: *mut f32, size: usize) {
    unsafe {
        let _ = Vec::from_raw_parts(ptr, 0, size);
    }
}
