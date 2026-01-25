//!
//! Build script for jellyfin-audio-wasm
//!
//! This file exists to embed version information into the WASM binary.
//! No additional build steps required.
//!
fn main() {
    println!("cargo:rerun-if-changed=Cargo.toml");
    println!("cargo:rerun-if-changed=src/");
}
