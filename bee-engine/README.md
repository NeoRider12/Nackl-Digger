# Patched Bee Engine SDK

The Android build uses `gosh-sh/bee-engine` **v6.0.0** (commit `015bc466613e7b7c41f272dc16ba0cacbf0e4d93`)
with five patches, applied in file-name order:

| Patch | From | What it does |
|---|---|---|
| `0001-newgoblin-delivery-and-diagnostics.patch` | goblingames (NewGoblin) | Root and proof are signed once and the same message is resent until accepted, landed on chain or a deadline; `set_submit_policy(root_ms, proof_ms, retry_min_ms, retry_max_ms)`, `set_epoch_deadline(ms)`, `get_session_state()`; interval read from the chain if the event is missing; stale session data cancelled; diagnostic callbacks (`send_attempt`, `interval_from_chain`, …). |
| `0002-newgoblin-premine.patch` | goblingames (NewGoblin) | **Premine**: while one session is being submitted, a second worker mines the next one (`can_premine()`, `premine(ms, cb)`), holds it and submits it after `release_submit()` once the previous one is through; `discard_premine()`. |
| `0003-newgoblin-premine-chain-wait.patch` | goblingames (NewGoblin) | Premine waits when the chain read is one seed rotation behind. |
| `0004-neorider-polling-difficulty-benchmark.patch` | NeoRider | Miner events polled every 2.5 s only while a worker is alive (else 10 s), last 25 instead of 100 events; `get_miner_data` returns `easy_complexity` / `hard_complexity` and `mbi_cur` (wallet level); `benchmark_hashes(complexity, ms)` for the performance test. |
| `0005-neorider-gpu-assist.patch` | NeoRider | **GPU assist**: `tap_params()` returns the next tap leaf's `{seed, index, complexity}` (JSON); `add_tap_nonce(x, y, now_ms, nonce_lo, nonce_hi)` queues a tap with a nonce found by the app on the GPU (WebGPU or OpenGL ES). The engine computes and checks the leaf itself and falls back to its own CPU search if the nonce does not meet the target; `tap_computed` reports `gpu: true/false`. |

Patches 0001–0003 and `Cargo.lock` are taken unchanged from the Corresponding Source published by
goblingames: https://github.com/andresCadavidT/goblingames/tree/main/source/bee-sdk-6.0.0-ng.3 –
thanks to its author for sharing it.

The GitHub workflow clones v6.0.0, removes the `dodex-sdk` dev-dependency (as upstream CI), applies the
patches, uses this `Cargo.lock`, builds the WASM with `scripts/build_wasm.sh sdk` and replaces the files of
`@teamgosh/bee-sdk` before bundling. Bee Engine is AGPL-3.0; all patches are under the same licence.
