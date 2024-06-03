# Makefile

# This Makefile is used to compile the artifacts for the project.
artifacts:
	./core/scripts/compile_artifacts.sh

test-pool:
	./core/scripts/test_pool.sh

test-circuit:
	./core/scripts/test_circuit.sh
