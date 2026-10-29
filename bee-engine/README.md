# Modified Bee Engine (GNU AGPL-3.0)

NeoRiders Nackl Digger ships a **modified build of Bee Engine v6.0.0** by GOSH TECHNOLOGY LTD.
Bee Engine is licensed under the **GNU Affero General Public License v3.0** – see [LICENSE.md](LICENSE.md).
This folder is the corresponding source of the modification.

## Upstream

- Repository: https://github.com/gosh-sh/bee-engine
- Tag: `v6.0.0` (commit `015bc466613e7b7c41f272dc16ba0cacbf0e4d93`)

## Modification

[`0001-retry-on-queue-full.patch`](0001-retry-on-queue-full.patch) changes `bee_miner`:

- **Resubmission:** session root and proof are sent again when the node answers *queue is full* (TVM 621), times out, or returns gateway errors (429/502/503/504, empty or invalid replies) – until a deadline set by the app.
- **Signed once, resent unchanged:** root and proof messages are signed once (`PreparedMessage` from ackinacki-kit) and the identical message is resent on every retry, so the node sees a duplicate instead of a second copy. It is signed again only shortly before it would expire.
- **Already stored:** when a retry is rejected in the compute phase after an earlier attempt, the miner contract is checked (`getDetails`); if exactly this session's root is already stored, the session continues (stored data of an older session does not count). Contract rejections are not retried.
- **Chain fallback while waiting:** if no interval event arrives within 20 s after the root, the worker reads `getDetails` (commitData/commitInterval): it sends the proof with the interval stored in the contract, resends the identical root if it is not stored yet, or – after the proof – treats cleared commit data (two reads in a row) as accepted.
- **Already delivered:** a `DUPLICATE_MESSAGE` answer (an earlier attempt or the parallel copy to the other endpoint already got through) counts as submitted instead of failing the session.
- **Message lifetime:** miner messages expire after 120 s instead of the SDK default of 40 s, so they survive long node queues.
- **New functions:** `Miner.set_submit_deadline(ms)` and `Miner.set_submit_retry_ms(ms)` (interval, clamped to 1–10 s).
- **Event polling:** the miner reads its contract events every 2.5 s only while a session is running, otherwise every 10 s (fewer requests, less rate limiting).
- **Mining difficulty:** `hard_complexity` / `easy_complexity` are read from the miner contract and returned by `get_miner_data`.

No other files are changed.

## Build

Requirements: Rust (stable) with target `wasm32-unknown-unknown`, `wasm-pack`, `clang` and `llvm` (for `blst`).

```bash
# some dependencies are listed as ssh:// – the repositories are public over HTTPS
git config --global url."https://github.com/".insteadOf "ssh://git@github.com/"
git config --global url."https://github.com/".insteadOf "git@github.com:" --add

git clone --depth 1 --branch v6.0.0 https://github.com/gosh-sh/bee-engine.git
cd bee-engine
git apply /path/to/0001-retry-on-queue-full.patch

export CC_wasm32_unknown_unknown=clang
export AR_wasm32_unknown_unknown=llvm-ar
bash scripts/build_wasm.sh sdk
# result: bee_sdk/pkg/bee_sdk.js, bee_sdk_bg.wasm, bee_sdk.d.ts
```

These three files replace the ones from the npm package `@teamgosh/bee-sdk@6.0.0` inside the app.

## Copyright

Bee Engine © 2026 GOSH TECHNOLOGY LTD. – Patch © 2026 NeoRider, provided under the same license (AGPL-3.0).
