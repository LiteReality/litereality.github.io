# `/vr/` — first-person walkthrough viewer

A three.js viewer for the reconstructed rooms with three modes — **Orbit** (dollhouse),
**Point-and-Go** (click the floor to glide, click a door/drawer to open it), and **Walk** (WASD +
mouse / touch) — plus a **Compare ⇄** side-by-side (reconstruction | scan point cloud, synced
camera). Modelled on the layout of https://vr-interior.oaksun.studio.

## Code here, data on R2

These pages are **code only (~90 KB)** — they carry no geometry. Every heavy asset is fetched at
runtime from the Cloudflare R2 bucket (the same Worker the recon viewer uses), by **absolute URL**:

- `https://litereality-viewer.huangzhening.workers.dev/recon/<scene>/room.glb` — the reconstruction
- `https://litereality-viewer.huangzhening.workers.dev/recon/<scene>/points.ply` — the scan cloud (Compare)
- `https://litereality-viewer.huangzhening.workers.dev/vendor/three@0.168.0/…` — three.js + Draco

The Worker sends `access-control-allow-origin: *`, so these cross-origin fetches work from GitHub
Pages (or anywhere). Nothing needs to be uploaded to R2 to ship a viewer change — only the data
must already be there (it is, under `recon/`).

## Generated, not hand-edited

`index.html`, `app.js`, `app.css` and the per-scene `<scene>.html` pages are produced by
`make_vr_pages.py` (in the `litereality-agent-web` working area). To change the viewer, edit that
generator and re-run it into this folder; don't hand-edit the output. Scene list is derived from the
recon index; each scene page is a tiny `window.SCENE = { url, cloud }` pointer + shared includes.

Deep links: `?compare=1` opens straight into the side-by-side.
