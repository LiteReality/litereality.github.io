LiteReality-Agent — self-contained post
=======================================

Open index.html in a browser. That's it. Everything it needs is in this
folder, and nothing points outside it.

  index.html            the post
  litereality-agent.pdf the same post, printed (see "The PDF" below)
  assets/videos/        the 14 clips it plays
  assets/images/        the 11 figures
  assets/css/           styling, including the @media print rules the PDF uses
  assets/js/            video autoplay-on-scroll, heading anchors

Videos load only as you scroll to them, so opening the page is fast even
though the folder is ~26 MB.

If autoplay doesn't work when opening the file directly, serve the folder
instead:

  python3 -m http.server 8000

then visit http://localhost:8000


The PDF
-------
litereality-agent.pdf is a build artefact, not a separate document — it is
this page printed, and it exists so Google Scholar has a full text to index.
Rebuild it whenever the prose changes:

  tools/build-post-pdf.sh

It must stay under 5 MB; Scholar refuses anything larger, and the script
fails loudly if a build crosses the line.


Google Scholar
--------------
Scholar builds its record from the citation_* meta tags in index.html's
<head>, not from the visible page. The two have to agree — same title as the
<h1>, same authors in the same order as the byline, same date as "Published".
Change one, change the other.
