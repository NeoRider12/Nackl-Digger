# Modified Bee Engine (GNU AGPL-3.0)

NeoRiders Nackl Digger ships a **modified build of Bee Engine v6.0.0** by GOSH TECHNOLOGY LTD.
Bee Engine is licensed under the **GNU Affero General Public License v3.0** – see [LICENSE.md](LICENSE.md).
This folder is the corresponding source of the modification.

## Upstream

- Repository: https://github.com/gosh-sh/bee-engine
- Tag: `v6.0.0` (commit `015bc466613e7b7c41f272dc16ba0cacbf0e4d93`)

## Modification

Four patches, applied in file-name order:

| Patch | From | What it does |
|---|---|---|
| [`0001-newgoblin-delivery-and-diagnostics.patch`](0001-newgoblin-delivery-and-diagnostics.patch) | goblingames (NewGoblin) | Root and proof are signed once and the same message is resent until accepted, landed on chain or a deadline; submit policy and epoch deadline set by the app; interval read from the chain if the event is missing; stale session data cancelled; diagnostic callbacks. |
| [`0002-newgoblin-premine.patch`](0002-newgoblin-premine.patch) | goblingames (NewGoblin) | **Premine**: while one session is being submitted, the next one is mined, held and submitted once the previous one is through. |
| [`0003-newgoblin-premine-chain-wait.patch`](0003-newgoblin-premine-chain-wait.patch) | goblingames (NewGoblin) | Premine waits when the chain read is one seed rotation behind. |
| [`0004-neorider-polling-difficulty-benchmark.patch`](0004-neorider-polling-difficulty-benchmark.patch) | NeoRider | Lighter miner event polling (2.5 s only while a worker is alive, else 10 s; 25 instead of 100 events), mining difficulty in `get_miner_data`, `benchmark_hashes` for the performance test. |

Patches 0001–0003 and [`Cargo.lock`](Cargo.lock) are taken unchanged from the Corresponding Source published by goblingames: https://github.com/andresCadavidT/goblingames/tree/main/source/bee-sdk-6.0.0-ng.3 – thanks to its author for sharing it.

No other files are changed.

## Build

Requirements: Rust (stable) with target `wasm32-unknown-unknown`, `wasm-pack`, `clang` and `llvm` (for `blst`).

```bash
# some dependencies are listed as ssh:// – the repositories are public over HTTPS
git config --global url."https://github.com/".insteadOf "ssh://git@github.com/"
git config --global url."https://github.com/".insteadOf "git@github.com:" --add

git clone --depth 1 --branch v6.0.0 https://github.com/gosh-sh/bee-engine.git
cd bee-engine
sed -i '/^dodex-sdk = /d' bee_wallet/Cargo.toml   # dev-dependency only, as upstream CI
for p in 0001-newgoblin-delivery-and-diagnostics 0002-newgoblin-premine 0003-newgoblin-premine-chain-wait 0004-neorider-polling-difficulty-benchmark; do
  git apply /path/to/$p.patch
done
cp /path/to/Cargo.lock .

export CC_wasm32_unknown_unknown=clang
export AR_wasm32_unknown_unknown=llvm-ar
bash scripts/build_wasm.sh sdk
# result: bee_sdk/pkg/bee_sdk.js, bee_sdk_bg.wasm, bee_sdk.d.ts
```

These three files replace the ones from the npm package `@teamgosh/bee-sdk@6.0.0` inside the app.

## Copyright

Bee Engine © 2026 GOSH TECHNOLOGY LTD. – Patches 0001–0003 by the author of goblingames, patch 0004 © 2026 NeoRider; all provided under the same license (AGPL-3.0).
