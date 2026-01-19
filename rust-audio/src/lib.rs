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
