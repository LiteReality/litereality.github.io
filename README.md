# litereality.github.io

Two sites, one repo, served by GitHub Pages from the root of `main`.

| Folder | URL | What |
|---|---|---|
| `/` | https://litereality.github.io/ | LiteReality project page (media in `assets/`, dev scripts in `tools/`) |
| `agent/` | https://litereality.github.io/agent/ | LiteReality-Agent landing page (media in `agent/assets/`), blog post (`agent/litereality-agent-post/`), VR walkthrough viewer (`agent/vr/`) |

`404.html` redirects the old `/Litereality-agent-site/…` URLs (and any mixed-case path) to `/agent/…`.

## Conventions
- **Lowercase folder and file names.** Pages is case-sensitive.
- **Relative links** inside each site. Only SEO tags (canonical, `og:url`, `citation_*`, `sitemap.xml`) use absolute URLs.
- Heavy 3D data (GLBs, point clouds, three.js vendor files) is **not** in this repo. It lives on Cloudflare R2 and is fetched by absolute URL from `https://litereality-viewer.huangzhening.workers.dev/`. To point the viewer elsewhere, edit those URLs in `agent/index.html` (nav, footer, demo `<iframe>`, `const BASE`) and `agent/vr/`.
- Media lives in `assets/` (main site) and `agent/assets/` (agent site); the blog post keeps its own `agent/litereality-agent-post/assets/`. All of it is Git LFS.

## agent/vr is generated
`agent/vr/index.html`, `app.js`, `app.css` and the per-scene `*-qc.html` pages are produced by `make_vr_pages.py` in the `litereality-agent-web` working area (not in this repo). Edit the generator and re-run it into `agent/vr/`; don't hand-edit the output. **The generator must emit lowercase filenames** to match this repo. See `agent/vr/README.md` for the viewer's modes and data layout.

## Tools
`agent/tools/`: `build-post-pdf.sh` (PDF twin of the blog post for Scholar), `stamp-assets.sh` (cache-bust `app.js`/`app.css` in the scene pages), `build-mobile-glb.sh` (downscaled GLBs for R2). Run them from `agent/`.
