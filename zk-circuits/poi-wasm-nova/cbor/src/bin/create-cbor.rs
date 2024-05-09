use cbor::get_cbor;

#[cfg(not(target_family = "wasm"))]
fn main() {
    println!("creating cbor");
    get_cbor("./wasm/artifacts/circuits/proofOfInnocence.r1cs".to_string(), "./wasm/artifacts/circuits/proofOfInnocence.cbor".to_string());
}
