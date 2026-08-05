LiteReality-Agent — self-contained post
=======================================

Open index.html in a browser. That's it. Everything it needs is in this
folder, and nothing points outside it.

  index.html        the post
  assets/videos/    the 14 clips it plays
  assets/images/    the 11 figures
  assets/css/       styling
  assets/js/        video autoplay-on-scroll, heading anchors

Videos load only as you scroll to them, so opening the page is fast even
though the folder is ~26 MB.

If autoplay doesn't work when opening the file directly, serve the folder
instead:

  python3 -m http.server 8000

then visit http://localhost:8000
