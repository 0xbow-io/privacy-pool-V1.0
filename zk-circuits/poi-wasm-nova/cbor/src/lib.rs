use nova_scotia::{
    circom::reader::load_r1cs, create_public_params, FileLocation
};
use nova_snark::{provider, PublicParams};

use std::fs::File;
use std::path::PathBuf;
use std::io::BufWriter;

type G1 = provider::bn256_grumpkin::bn256::Point;
type G2 = provider::bn256_grumpkin::grumpkin::Point;

pub fn get_cbor(circuit_filepath: String, cbor_filepath: String) {
    let circuit_file = PathBuf::from(circuit_filepath);
    let r1cs = load_r1cs::<G1, G2>(&FileLocation::PathBuf(circuit_file));

    println!("creating public parameters");
    let pp: PublicParams<G1, G2, _, _> = create_public_params(r1cs.clone());

    println!("writing to pp.cbor...");
    let file = File::create(cbor_filepath).expect("error");
    let writer = BufWriter::new(file);
    serde_cbor::to_writer(writer, &pp).expect("write error");

    println!("Number of constraints per step (primary circuit): {}", pp.num_constraints().0);
    println!("Number of constraints per step (secondary circuit): {}", pp.num_constraints().1);

    println!("Number of variables per step (primary circuit): {}", pp.num_variables().0);
    println!("Number of variables per step (secondary circuit): {}", pp.num_variables().1);
}