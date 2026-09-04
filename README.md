# CrossPoint EPUB Optimizer — standalone

An unofficial standalone adaptation of the browser-based EPUB optimizer built
into [CrossPoint Reader](https://github.com/crosspoint-reader/crosspoint-reader).
It preserves CrossPoint's optimizer and replaces the reader's upload step with
a normal browser download.

This project is not affiliated with or endorsed by the CrossPoint Reader
project or any device manufacturer.

## Live site

<https://epub.gs0.me>

## Privacy

EPUB processing happens entirely inside the browser. Selected EPUB contents are
not uploaded to the hosting server or sent to the internet. All runtime
JavaScript dependencies are included in this repository.

As with any browser application, the web host still receives ordinary requests
for the page and its static assets.

## Use locally

```bash
./start.sh
```

Open <http://127.0.0.1:4175>, click **Open Optimizer**, choose one or more EPUB
files, enable **Optimize EPUB**, and click **Optimize & Download**.

To make the page reachable from another device on the local network:

```bash
BIND_ADDRESS=0.0.0.0 ./start.sh
```

Then open `http://COMPUTER_LAN_IP:4175` from the other device.

## Static hosting

The repository can be deployed directly to GitHub Pages, Cloudflare Pages,
Netlify, Vercel, or any static HTTP server. There is no build command and no
server-side application.

For GitHub Pages, configure the repository to deploy from the root of the
default branch. Relative asset paths allow project sites such as
`https://username.github.io/repository-name/` to work.

## Upstream and modifications

The following files were copied from CrossPoint Reader commit
[`9d2f234e1d20a875347d3a339b73d5d539fd945c`](https://github.com/crosspoint-reader/crosspoint-reader/commit/9d2f234e1d20a875347d3a339b73d5d539fd945c):

- `index.html` from `src/network/html/FilesPage.html`
- `js/jszip.min.js` from `src/network/html/js/jszip.min.js`

Standalone changes made on 2026-09-04:

- `local-shim.js` supplies the device status and empty file-list responses used
  by the original page during startup.
- `local-overrides.js` downloads optimized EPUBs instead of uploading them to a
  CrossPoint reader.
- The page title, action labels, attribution, and asset paths were adjusted for
  standalone static hosting.

The original integrated optimizer was contributed to CrossPoint Reader by
[`zgredex`](https://github.com/zgredex) and
[`pablohc`](https://github.com/pablohc) in
[CrossPoint Reader PR #1224](https://github.com/crosspoint-reader/crosspoint-reader/pull/1224).

## License

CrossPoint Reader and this adaptation are distributed under the MIT License.
See [LICENSE](LICENSE). Bundled dependency notices are in
[THIRD_PARTY_NOTICES.md](THIRD_PARTY_NOTICES.md).
