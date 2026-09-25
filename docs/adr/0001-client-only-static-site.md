# Client-only static site with per-device storage

TR Finances is a static site hosted by us (e.g. GitHub Pages). All parsing and calculation happen in the viewer's browser, and each device keeps its own Transaction Histories in browser storage. There is no backend and no sync. We chose this because the Account Holders don't want their financial data on any server, including one we run. We accept that each device needs both Transaction Exports imported separately (by AirDrop), and that iOS may clear stored data. Re-importing a full-history Transaction Export is the recovery path, so we don't need a separate backup format.

## Considered Options

- **Local HTML file**: rejected because iOS can't run one with JavaScript, and `file://` storage is unreliable.
- **Sync through iCloud Drive or a backend**: rejected for now. It would let the two devices share data, but the data would leave the device.
- **Using kontoauszug.jonathanpagel.com**: rejected because it has no Household view, doesn't remember data between visits, and is third-party code.

## Consequences

- The only network calls are for Market Prices, which send ISINs and nothing else (see ADR 0002).
