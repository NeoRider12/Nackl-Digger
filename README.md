<p align="center">
  <img src="logo-512.png" width="128" alt="NeoRiders Nackl Digger logo">
</p>

<h1 align="center">NeoRiders Nackl Digger</h1>

<p align="center">
  <b>All-in-one</b> Android app for Acki Nacki: <b>mining NACKL</b>, <b>Popit Game boost claims</b> and <b>MamaBoard upgrades</b> – 2 to 12 wallets at once on one phone or tablet.<br>
  The app taps for you (<b>AUTO</b>), claims your rewards and boost – <b>100 % local, no cloud</b>.
</p>

<p align="center">
  <a href="https://github.com/NeoRider12/Nackl-Digger/releases/latest"><b>⬇ Download the latest APK</b></a>
  &nbsp;·&nbsp; Android 7+ &nbsp;·&nbsp; free &nbsp;·&nbsp; <a href="https://t.me/nackldigger">💬 Telegram group</a>
</p>

<p align="center">
  <img src="docs/screenshots/NacklDigger-Android-landscape.png" width="860" alt="Tablet in landscape with six wallets, four digging and two S-wallets in standby">
</p>
<p align="center"><em>Tablet with six wallets: four digging with GPU assist (CPU 11 %, GPU 12 % in the header), two S-wallets waiting for Smart swap · wallet level (Lv.) and boost farm ring (x/5) in every tap row · today's NACKL next to each name (demo values)</em></p>

> 🖥️ **100 % local – no cloud.** Everything runs on your own phone or tablet: mining, boost claims and MamaBoard upgrades. There is no server or cloud service in between, so nobody else holds your keys or logins – but it uses the **real computing power of your device**: it gets slower for other apps, uses battery and **can get very warm**. Keep it on the charger, out of the sun and without a case, and use the built-in heat protection.

---

## Top features

- 🐝 **2, 4, 6, 8, 10 or 12 wallets on one device** – one tap row per wallet
- 🚀 **GPU assist** – the graphics chip searches the taps, 20× to 85× faster than one CPU core: ~10 % CPU, a cooler device and far more wallets per device (Tab S7 FE: 8 wallets at hard 21). WebGPU or OpenGL ES – also on Samsung Xclipse and older phones
- 🤖 **AUTO by default** – a tap every 1.714 s per wallet, evenly spread, every tap visible in the row. Prefer your own finger? Switch the small **AUTO** button off and tap yourself
- ⏻ **A real power button per wallet** – a softly breathing red standby light when off, a shimmer in the wallet's colour when on
- 👀 **Always see what's running** – *root 1/2 · submitting*, *proof 2/2 · submitting*, *premined · ready*, also for the previous session while the next one is already being mined
- ⚡ **Performance test** in ⚙ Settings – measures CPU and GPU and tells you how many wallets your device can run
- 🔄 **Smart swap** – mark reserve wallets with an **S** (long press on the power button): when a running wallet is worn out late in the day, a fresh S-wallet takes over by itself – and at the new 24-h day everything switches back
- 🌱 **Boost auto-claim** – connect a wallet once and the app claims the Popit Game farm boost 5× a day and upgrades your MamaBoard when you have enough boost
- ↔️ **Swap places** – hold a wallet's name for 1.5 s and drag it onto another; *Wallet 1, 2, …* stay with the position, colours move with the wallet
- 🌙 **Smart swap (S-wallets)**
- **Why:** the NACKL per session falls with the taps a wallet already has that day – roughly full value up to ~5k taps, about half at ~7k, a quarter at ~8k, and nothing after 12 000 (Miner contract). A fresh wallet earns full value even late in the day
- **Mark reserve wallets:** long press (0.6 s) on a wallet's power button → a small pulsing **S**. Long press again removes it. S-wallets stay off until they are needed
- **The rule:** a running wallet with **more than 6000 taps today** (*Swap from* in the wallet sheet: 6k · 8k · 10k · **12k** – with 12k it runs to the daily limit, e.g. for the top ten) whose **last 6 payouts** are **15 % below** what the best free S-wallet earns fresh is switched off, the S-wallet on (*Smart swap: … → …* in the log). At most one swap per 20 min, a swapped-in wallet runs at least 1 h; when an S-wallet is worn out itself, the next one takes over
- **Daily limit reached:** when a wallet stops at 12,000 taps, the best free S-wallet takes over for the rest of the day
- **New 24-h day:** swapped-in S-wallets go off, the original wallets come back on
- **Knows your wallets:** the expected value per session is learned from each wallet's own payouts while it has fewer than 4,000 taps that day; until then it is estimated from the **wallet level**, read from the chain (S-wallets that are off are checked every 30 min). The wallet sheet shows level, *fresh*, *now* and the last 6 payouts – **forget** deletes a learned value. ⚙ → *Smart swap · S-wallets* explains it all and lists your S-wallets
- ⚠️ **An S-wallet must not run anywhere else** – not on another device and not in another app. Each device only knows its own wallets

**Boost · Popit Game**
- **Connect once per wallet:** wallet sheet → *Connect for Boost* → confirm in the AN Wallet (QR or *Open in AN Wallet*). This is a separate login for the game, not the mining key; it stays on your device and only allows actions in the Popit Game
- **Automatic:** with ⚙ → *Boost · Popit Game* on, the app claims – also for wallets that are not mining – the farm reward as soon as it is ready (5× a day), starts the next round and – if *Auto upgrade* is ticked – buys the next MamaBoard part when your boost covers the price
- **By hand:** *Claim now* and *Upgrade MamaBoard* buttons in the wallet sheet, with farm progress (x/5), boost balance and the next part
- **In the tap row:** a small ring fills up until the next claim, *x/5* next to it; *+552 Boost* floats up when claimed
- **Boost only:** all wallets can stay OFF – background mode keeps running just for boost claims and upgrades, so the device stays cool
- **Login:** renews itself every hour while the app runs (wallet sheet shows *valid until*); if the app was completely off for more than 7 days, the tap row shows **⚠ Boost: connect again**
- **Boost LVL** of the Popit Game farm next to the heading in the wallet sheet
- Don't let another farm tool claim the same wallet at the same time

**Order and numbering**
- **Swap places by drag & drop:** hold a wallet's name for 1.5 s, then drag it onto another wallet (moving earlier just scrolls). **The number belongs to the position** – the top box is always *Wallet 1* – while each wallet keeps its colour
- **Fewer wallets keep the ones in front:** with *Wallets on this device* = 6 the first 6 are shown; the others are only hidden (pairing kept) and come back when you raise the number. ⚙ Settings lists hidden paired wallets

**Background mode (optional)** – keeps the app alive behind other apps and for boost claims: ☾ BG in the header, with a step-by-step setup (notifications, battery, manufacturer settings) and a notification with a Stop button. For mining, keep the app in front with the screen dimmed to black (⚙ → *Extreme −100 %*)
- 📶 **Network-friendly with many wallets** – staggered starts and sessions, shared status reads, smart resubmission and endpoint failover
- 💰 **Today's NACKL next to every wallet**, rewards claimed automatically, per-epoch overview of sessions and payouts
- ⛏️ **See every result at a glance** – a gold-laden pickaxe for a confirmed session, a pickaxe bursting apart in slow motion for a failed one, a spinning $NACKL coin for every payout – right in the wallet's box, no pop-up messages covering the other wallets
- 🔒 **Your wallet key never leaves the AN Wallet** – no account, no ads, no tracking

<p align="center">
  <img src="docs/screenshots/NacklDigger-Android-phone.png" height="460" alt="Phone with four wallets, level and boost ring">
  <img src="docs/screenshots/NacklDigger-Android-performance-test.png" height="460" alt="Performance test in the settings">
  <img src="docs/screenshots/NacklDigger-Android-background-mode.png" height="460" alt="Background mode setup">
</p>
<p align="center"><em>Phone with four wallets · performance test at hard 21 with GPU assist · background mode setup (demo values)</em></p>

<p align="center">
  <img src="docs/screenshots/NacklDigger-Android-effects.webp" width="860" alt="Wallet effects: confirmed session, failed session and payout">
</p>
<p align="center"><em>Results right in the wallet box: confirmed · failed · payout (demo values)</em></p>

## In 60 seconds

1. **Install** the APK from [Releases](https://github.com/NeoRider12/Nackl-Digger/releases/latest).
2. **Pair** your AN Wallet: tap a wallet → *Wallet Connect* → confirm the connection and the mining key in the AN Wallet.
3. **Press the wallet's power button** – it starts in **AUTO** and the app taps every 1.7 s for you (70 taps over about 2 minutes count per epoch of ~5.5 min).
4. Best results: keep the app in front on the charger with ⚙ → **Dim screen while digging → Extreme −100 %**, and run ⚙ → **Performance test** before adding more wallets. ☾ **BG** keeps the app alive in the background (boost claims, short breaks).
5. The app **submits** each session and shows `✓ confirmed` or `✗ …`. **NACKL arrives** in your wallet a few minutes later – the app claims it for you.

## All features

**Mining**
- **2, 4, 6, 8, 10 or 12 wallets** on phones and tablets – as many as your device handles (see the performance test); tablet layouts 3 × 2 up to 4 × 3, phones scroll
- **AUTO or manual per wallet** – one small AUTO toggle; AUTO is the default and has no knobs to get wrong, switched off you tap yourself
- **Power button per wallet** (top right): red standby glow when off, wallet-coloured shimmer when on, a fast-running ring while a restore runs
- **Clear status lines:** next to AUTO the current step (*root 1/2 · submitting*, *root ✓ · waiting for interval*, *proof 2/2 · submitting*, *premined · ready*, or *tapping · prev. proof 2/2* while the previous session is still being submitted); in the tap row what is happening right now; at the bottom times and the last payout
- **GPU assist** (on by default when a usable GPU is found, switch in ⚙): every tap is searched on the graphics chip – BLAKE3 like the Bee Engine, one compression per try. Self-test at start, every nonce is checked again on the CPU and in the engine, taps keep their real timestamp; on any error the CPU takes over. Two ways to the GPU:
  - **WebGPU** – Qualcomm Adreno, ARM Mali and Intel on Android 12+
  - **OpenGL ES 3.1** compute (native) – where the WebView blocks WebGPU, e.g. **Samsung Xclipse** (Galaxy A55) or Qualcomm/Mali phones below Android 12
  - Measured at hard 21: Tab S7 FE (Adreno 642L) ~125 MH/s · Galaxy A55 (Xclipse 530) ~100 MH/s · Tab A9+ (Adreno 619) ~60 MH/s · Redmi Note 7 (Adreno 512, Android 10) ~13 MH/s – one CPU core does ~1–2 MH/s
  - Header shows **GPU %** (how busy the GPU is with tap searches, from the performance test); the per-minute log line shows GPU/CPU taps, ⌀ ms per tap and temperatures
- **Multi-core:** without GPU every wallet computes its taps on its own CPU core; the engine is compiled once for all wallets
- **Performance test:** 1 wallet alone, then 2/4/6/8/10/12 wallets at once, plus the GPU, at the current difficulty – with a recommendation (*With GPU assist up to N*). Wallets that are ON are paused for the test and switched back on afterwards. The difficulty is known even with all wallets off (last value, read once at start); before the first pairing you can pick it yourself (*auto · 20–25*)
- **Epoch-aware:** shows taps, duration and time left; waits for the next epoch instead of starting a session that could not finish in time
- **Premining:** the next session is mined while the previous one is still being submitted. If the previous one was credited, the next goes out right after the new epoch starts – no epoch is lost to a slow network (Bee Engine patches by the author of goblingames). A premined session that can't be used after a failure is not counted as a second failure
- **Patient submitting:** root (up to 210 s) and proof (up to 240 s) are resent unchanged, also after the epoch has ended – the session still counts

**Background mode (optional)**
- Keeps the app alive with another app in front or the screen off – enough for boost claims, reward claims and short breaks
- ⚠ With the screen fully off for hours, it depends on the device: some throttle, and in our tests Samsung ended the app after 1–2.5 h even with *Unrestricted* battery. For mining through the night keep the screen on and dimmed to black (⚙ → *Extreme −100 %*)
- Setup sheet with checklist: notifications, *no battery restrictions*, and the exact menu path for Samsung, Xiaomi/Redmi, Huawei/Honor, Oppo/Realme/OnePlus, Vivo, Asus and Tecno/Infinix/itel
- Permanent notification with live status, **Total NACKL today · yesterday** of all wallets and a Stop button; runs only while a wallet is ON

**When the network is busy**
- **Smart resubmission:** root and proof are signed once and resent unchanged on *queue full*, timeouts and gateway errors – the node recognises repeats instead of queueing copies
- **Knocks until it's in:** every submission goes to both endpoints and the active block producer at once and keeps knocking for up to 55 s; a slow answer is not cut off (it is often the one being accepted) – a new attempt simply runs alongside
- **Never stuck:** if the engine of a wallet stops answering, the session is closed and the engine rebuilt – the wallet keeps digging. If multi-core fails once, the next rebuild tries it again instead of leaving all wallets on one core until a restart
- **Shared pace for the block producer:** only the block producer answers *429 Too Many Requests* (several devices on one connection count together). All wallets of a device share one request budget for it that shrinks on every 429 and grows slowly again while it's calm – it settles just below the limit instead of swinging between full speed and brake. The endpoints and parallel connections are not throttled
- **Staggered starts and sessions:** wallets don't hit the node in the same second; premined sessions go out 12–27 s after the new epoch, with a fixed offset per wallet
- **Shared reads:** identical status requests of several wallets go out once
- **Two endpoints with failover:** `mainnet` and `mainnet-cf`
- **Self-healing:** reads the session state from the contract if the node's events don't arrive, clears a stuck session on chain, auto-restore after repeated failures

**Payouts**
- **Automatic claiming:** if a confirmed epoch is not paid out with the next session in time, the app sends `get_reward` itself, so rewards don't expire – but never while a session of that wallet is being submitted, so the two can't get in each other's way
- **NACKL today** next to every wallet name (current 24-h day)
- **Per-epoch overview:** status, taps and NACKL received for every session; last payout with time on the main screen
- **Wallet sheet:** today's total, locked and unlocked balance

**Wallet effects**
- **Confirmed session:** a pickaxe with gold nuggets pulses in the wallet box, with the confirmed taps below it (`70 ✓`)
- **Failed session:** the broken pickaxe bursts apart in slow motion, with the reason below it (`✗ not confirmed`)
- **Payout:** an embossed $NACKL coin spins in the middle of the box, with the amount below it (`+0.56 NACKL`)
- Success and payout run 10 seconds, a failure 6 seconds; effects play one after another on the whole device (so they don't take GPU time from mining). Buttons underneath stay usable
- **Tristesse mode** (⚙): *Low* = no effects · *Mid* = also no animations · *High* = also all wallets grey
- Pop-up messages only for things that need you, like a wallet that has to be paired again
- **Wallet without payouts:** if a wallet's confirmed sessions bring no NACKL, it is not switched off any more – a notice over the wallet with a **Pair again** button shows it, and it disappears by itself as soon as a payout arrives
- **Taps counted:** if the contract counts fewer taps than were sent (device too slow for this many wallets at the current difficulty), the session dot turns into a **green ring** – run fewer wallets on that device
- **Session dots** (last epochs): green = confirmed with all 70 taps, **green ring** = confirmed but only part of the taps counted (e.g. 65/70 – the payout is a bit smaller), red = failed. The exact count per epoch is in the wallet window, session table, column *Taps*
- **Wallet sheet:** *Status – ON/OFF since hh:mm*
- **Device overloaded:** if the app freezes several times for seconds (too many wallets for the device, little memory), a hint under the header says so, with a **Performance test** button – or **Restart app** if multi-core stopped

<p align="center">
  <img src="docs/screenshots/NacklDigger-Android-portrait.png" height="520" alt="Tablet in portrait with six wallets">
  <img src="docs/screenshots/NacklDigger-Android-wallet-sheet.png" height="520" alt="Wallet sheet with level, Smart values and Boost · Popit Game">
</p>
<p align="center"><em>Tablet in portrait with six wallets · wallet sheet with level, Smart values, *Swap from* and Boost · Popit Game – farm, MamaBoard, login status (demo values)</em></p>

**Comfort & safety**
- Header with CPU load, **GPU %**, device temperature, network quality, **Pace** and success rate (wallets that are ON). *Pace %* shows how much of what the wallets want to send to the block producer the shared budget allows – ~100 % with 1–2 wallets, much lower when many wallets share a tight line; great for comparing connections or VPN exits. ⚙ → *Statistics* keeps min/max of Net, Pace, battery temperature and difficulty since app start, and shows what your connection tolerates at the block producer (*Line ≈ N/min*, measured with 5–6 wallets in 15–20 min). *Net %* is honest: it counts every single submit answer including retries (*queue full*, 429, no answer), so it shows how tough the network really is – the ✓ rate next to it shows what still got through. While all wallets rest, *Net ~31 %* (dashed) keeps the last value measured while submitting instead of the much higher read-only value
- Heat protection: switches the wallets off when the device gets too hot and **back on by itself once it has cooled down** (background mode stays active meanwhile); daily tap limit; optional off/on at the new 24-h epoch – can also be applied to the day already running; only wallets that were running (or stopped at the daily limit) come back, wallets already off stay in standby, S-wallets too
- **Encrypted backup** of settings and all pairings, S-wallet marks, *Swap from* and AUTO/MANUAL (restore after reinstalling; Boost logins connect again)
- **App update** (⚙ → Backup): the button lights up when a newer release is on GitHub and downloads the APK
- **Quit app** (⚙ header, tap twice) closes the app completely – also when it's locked in the recent-apps view. The **back button** only sends the app to the background, it keeps mining
- **Balances:** locked/unlocked total of all wallets in ⚙ → *Statistics*, once an hour in the log
- **Temperature details** (tap the temperature): battery, CPU and GPU where readable, *Heat load* from Android (100 % = throttling)
- Optional screen dimming while digging, down to **Extreme (−100 %)**: fully black with the lowest backlight, a tap lights it up for 30 s / 1 / 5 / 15 min (ring timer in ⚙)
- Exportable log

The app ID was issued by the Acki Nacki team, and the app is shared with their permission.

## Network upgrade status

Live page showing how many Acki Nacki block keepers support the next node version, who still holds it back, when their epochs end – and **“Switch done”** as soon as the first keepers report the new version. Works for every future upgrade by itself:
**[neorider12.github.io/Nackl-Digger/upgrade.html](https://neorider12.github.io/Nackl-Digger/upgrade.html)** (data straight from `mainnet-cf.ackinacki.org/v2/bk_set_update`, refreshed every 60 s).

## Install

1. Download `NacklDigger-v1.0.x.apk` from **[Releases](https://github.com/NeoRider12/Nackl-Digger/releases/latest)** on your Android device.
2. Open the file. Android asks you to **allow installs from this source** (browser or file manager) – allow it once.
3. If *Google Play Protect* warns about an unknown app: tap *More details → Install anyway*. The app is not on the Play Store because Google does not allow mining apps there.
4. Optional: check the file against the `.sha256` checksum in the release.

**Update:** install the new APK over the old one – pairings and settings are kept.
**Before uninstalling:** ⚙ → *Backup* → *Save backup to Downloads*, so you can restore everything afterwards.

## FAQ

**AUTO or tapping yourself?**
AUTO is the easy way: press the power button and let the app dig. To tap yourself, switch the small AUTO button off. It only taps while the wallet is ON and a session can still finish in the epoch, and it stops at the network's daily limit of 12,000 taps per wallet. Run ⚙ → *Performance test* once to see how many wallets your device keeps up with.

**How many wallets can my device run?**
Open ⚙ → *Performance test* (about 25 s; wallets that are ON are paused for it). It measures CPU and GPU at the current difficulty and recommends how many wallets your device can run (up to 12). With GPU assist the device is rarely the limit – the internet connection and the network are: add wallets step by step and watch the ✓ rate and *Pace*. With 8 or more wallets keep an eye on the temperature in the header during the first hour – heat protection switches wallets off if the device gets too hot.

**Can I switch the screen off?**
For **boost claims** yes – with ☾ **BG** (background mode) the app keeps running. For **mining** through the night better not: it depends on the device – in our tests Samsung tablets ended the app after 1–2.5 h with the screen fully off, even with *Unrestricted* battery (exit reason in the log). Short breaks of up to an hour worked fine with GPU assist. Instead keep the app in front with **⚙ → Dim screen while digging → Extreme −100 %**: the screen stays on but fully black with the lowest backlight, best on the charger. BG mode asks once for notifications and *no battery restrictions*; on Xiaomi/Redmi, Samsung and some other brands also allow *Autostart* / *Never sleeping apps* – the setup sheet shows where to find it. Don't swipe the app away in the recent-apps list.

**The app keeps getting closed in the background – what can I do?**
First tap ☾ **BG** in the header (or ⚙ → *Set up background mode*) and tick off the checklist: notifications, *no battery restrictions* and the manufacturer setting shown there (*Autostart*, *Never sleeping apps* …). If Android still ends the app, it is usually **memory**: every wallet runs its own engine and needs its own share of RAM, so 8–12 wallets on a phone with 3–4 GB can be too much while other apps are open. **Start fewer wallets** (e.g. 4 instead of 8) and close apps you don't need.
**Most reliable alternative:** leave the app in front with **⚙ → Dim screen while digging → Extreme −100 %**. The screen stays on but is fully black with the lowest backlight, so Android treats the app as in use and doesn't end it – a tap lights it up again. Best on the charger. The log shows free memory every 10 minutes (*Memory: … MB free*), warns with *Memory LOW* when Android may start ending apps, and – on Android 11 and newer – tells you after a restart why Android ended the app.

**What is Smart swap and when should I use it?**
If you have more wallets than slots that run well on a device (see the performance test), mark the extra ones as **S-wallets** (long press on the power button). They wait while your main wallets dig and take over automatically once a main wallet has more than 6000 taps and earns clearly less than a fresh S-wallet would – usually in the second half of the 24-h day. When a wallet reaches the daily limit, a free S-wallet takes over too. With *Swap from 12k* (wallet sheet) a wallet is never swapped out early. At the new day the main wallets come back. Important: an S-wallet must not be switched on on another device or in another app at the same time.

**Nothing gets through – what can I try?**
Work through this list – most problems are solved by the first points:
1. **Update** to the latest APK and **restart the phone** (frees memory, fresh network connection).
2. **Start small:** 1–2 wallets first, add more only when they run well. Run ⚙ → *Performance test* and stay at or below the recommendation – without GPU assist about **4 wallets per device**.
3. **Close other apps**, especially games, browsers with many tabs and other mining apps. Never run the same wallet in two apps or on two devices at the same time.
4. **Keep the app in front**, best on the charger with **⚙ → Dim screen while digging → Extreme −100 %** – or set up ☾ **BG** completely (notifications, no battery restrictions, Autostart).
5. **Give it time:** wait **at least 30 minutes** before judging. The network has busy phases where every app gets little through; the app keeps retrying and claims payouts by itself.
6. **Look at the header:** low *Net* with *Pace* far below 100 % → too many wallets for your connection; a hint *Device overloaded* → too many wallets for your device.
7. Still stuck? Send the log (⚙ → *Save log to Downloads*) in the [Telegram group](https://t.me/nackldigger).

**My sessions say "not confirmed" – is the app broken?**
Most likely the network is overloaded: the nodes accept the submission but cannot process it in time. This hits every mining app equally. In the header, *Net* shows how tough the network is right now (every single submit answer, including *queue full* and retries) and *✓* how many sessions of the wallets that are ON got through today. The app keeps retrying, clears leftovers and claims payouts automatically – just keep digging. A premined session that had to be thrown away after a failure is not counted as a second failure.

**When does NACKL arrive?**
The contract pays an epoch when the same wallet gets its next session through (from the next-but-one epoch on), usually a few minutes later. If no further session follows (wallet switched off, failures), the app sends `get_reward` within the time window. Tip: before closing the app for the night, keep it open a few minutes longer or tap `get_reward` in each wallet sheet.

**Do I have to pair again when payouts are missing?**
Usually not. *Pair again* first checks whether your mining key is still valid on chain and tells you if it is. A new pairing is only needed if the key was replaced (for example by pairing the same wallet on another device).

**Can I run the same wallet on two devices?**
No. Each wallet has one mining key per app – pairing it on a second device replaces the key of the first one.

**Many wallets / several devices on one internet connection?**
The nodes limit requests per internet connection, and all devices on it count together. When *429 Too Many Requests* piles up, all wallets of a device share a request budget for the block producer that adapts by itself (log: *Block producer pace: … requests/min*; ⚙ → *Statistics* shows *Pace* and *Line*). Devices behind different connections (or VPN exits) don't count together.

**How many wallets per device – what is the sweet spot?**
**With GPU assist** the device is rarely the limit any more: our Tab S7 FE runs **8 wallets at hard 21** with the GPU only ~10 % busy and ~80 % of the sessions confirmed even on busy network days. The limit is the **internet connection and the network** – all wallets of a device share one request budget (*Pace*), and devices on one connection count together. Add wallets step by step and watch the ✓ rate and *Pace*; spread many wallets over connections (or VPN exits). Rough GPU headroom for 8 wallets: Tab S7 FE up to hard 23–24, Tab A9+ up to hard 22–23.
**Without GPU** (CPU only) it's about **4 wallets per device** – at hard 21 often fewer: every +1 doubles the work per tap. At hard 21 a Galaxy Tab S7 FE ran 3–4 wallets fully on the CPU, a Tab A9+ 2–3 and a Redmi Note 7 none. Watch for **green rings** in the session dots (fewer taps counted). Our CPU-era tests (early November): a 5th wallet added only ~4 % sessions but took ~17 % from the four others, and from 6 wallets on the success rate dropped clearly.

**Which GPUs work for GPU assist?**
The app tries **WebGPU** first (Chrome/WebView allows it on Android 12+ for Qualcomm Adreno, ARM Mali and Intel; PowerVR from Android 16) and otherwise **OpenGL ES 3.1** compute – that covers e.g. Samsung Xclipse (Exynos) and older phones below Android 12. The log says at start which way is used (*GPU assist: on – … self-test passed*); ⚙ → *Performance test* shows the speed. If neither works, the app mines on the CPU as before.

**Why does a wallet earn less per session late in the day?**
In our logs the NACKL per session falls with the taps a wallet already has that day: roughly full value up to ~4–5k taps, then clearly less (about half at ~6–7k, about a quarter at ~8k). Other wallets are not affected – a fresh wallet earns full value even late in the day. That's why it pays to run your stronger wallets (higher NACKL per session) spread over your devices from the start of the 24-h day, and if you have more wallets than slots, to swap a wallet at ~5k taps for a fresh one. Never switch the same wallet on in two apps or on two devices at the same time.

**Restore mining – when?**
If a wallet keeps failing while others succeed: wallet sheet → *Restore mining*. It clears an old session on chain and reconnects. The app also does this by itself after repeated failures, and it rebuilds a wallet's engine by itself if that stops answering.

## Security and privacy

- Your wallet's private key **never leaves the AN Wallet**. The app only holds its own mining key pair, stored in the **Android Keystore**.
- No account, no telemetry, no ads. The app talks only to the Acki Nacki endpoints (`mainnet.ackinacki.org`, `mainnet-cf.ackinacki.org`, `app-backend.ackinacki.org`) and, only if your network's DNS can't resolve them, to Cloudflare DNS (`1.1.1.1`).
- Backups are encrypted with your password (AES-256-GCM, PBKDF2).

See [PRIVACY.md](PRIVACY.md).

## Feedback

Questions, tips, logs and testing: **[t.me/nackldigger](https://t.me/nackldigger)** (Telegram group).

Questions, bug reports, ideas: open an [issue](https://github.com/NeoRider12/Nackl-Digger/issues) or write on Telegram to **@NeoRider1**. A log helps a lot: ⚙ → *Save log to Downloads*.

## Licenses

- The app includes **Bee Engine 6.0.0** by GOSH TECHNOLOGY LTD., **modified**, licensed under the **GNU AGPL-3.0**. The modifications (patches, three of them by the author of goblingames), the license text and build instructions are in [`bee-engine/`](bee-engine/).
- App code and logo © NeoRider. All rights reserved unless stated otherwise.
- Acki Nacki and NACKL are names of their respective owners. This is a community app, not an official Acki Nacki product.

## Disclaimer

Provided as is, without warranty. Mining results depend on the Acki Nacki network; under heavy load not every session gets confirmed. Use at your own risk.

---

*Older desktop version (Windows):* see the commit history of this repository.
