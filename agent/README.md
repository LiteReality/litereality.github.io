# LiteReality-Agent — project site

Landing page for **LiteReality-Agent**, hosted on GitHub Pages.

- The page and its media (teaser, application clips, gallery thumbnails, logos) live in this repo.
- The heavy **3D reconstruction viewer** (`/recon/…`, GLBs, point clouds) stays on Cloudflare R2 and is
  linked/embedded from `https://litereality-viewer.huangzhening.workers.dev/recon/…`.

## Deploy
Push to `main`; GitHub Pages serves the repo root. Local asset paths are relative, so the site works
under the project sub-path. To point the viewer elsewhere, edit the `litereality-viewer.huangzhening.workers.dev/recon/`
URLs in `index.html` (nav, footer, the demo `<iframe>`, and `const BASE`).
