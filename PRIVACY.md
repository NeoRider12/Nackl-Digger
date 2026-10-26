# Privacy – NeoRiders Nackl Digger

**Short version:** the app collects nothing about you. There is no account, no analytics, no ads and no server of its own.

## Data stored on your device

- **Mining key pair and pairing session** of each wallet – in the Android Keystore (encrypted).
- **Settings, session history, payouts, log** – in the app's local storage.
- Android backups of the app are disabled. Your own backup files (⚙ → *Backup*) are encrypted with your password and stay wherever you put them.

Uninstalling the app deletes all of this.

## Network connections

The app connects only to:

| Address | Purpose |
|---|---|
| `mainnet.ackinacki.org`, `mainnet-cf.ackinacki.org` | Acki Nacki nodes: reading the miner contract, submitting sessions |
| `app-backend.ackinacki.org` | Pairing with the AN Wallet (BeeConnect, push to the wallet) |
| `cloudflare-dns.com` / `1.1.1.1` | Resolving the node addresses (DNS-over-HTTPS; can be switched off in ⚙) |

These services receive your device's IP address and the public data needed for mining (wallet and miner addresses, signed messages), as with any Acki Nacki app. Their own privacy policies apply.

## Permissions

Only internet access. The screen is kept on while digging without any extra permission. No location, contacts, camera or storage permission is requested (saving a log or backup uses the Android Downloads folder).

## Contact

Via the issues of this repository or via Telegram (NeoRider).
