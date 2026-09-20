"""Apply versioned reconstruction pointers without regenerating the shared VR app.

Usage: python agent/tools/update-vr-reconstructions.py
Input: agent/vr/reconstruction-snapshots.json. Existing controls, scan-cloud URLs,
page names, camera data and the shared app stay unchanged. Re-running is idempotent.
"""
import json
from pathlib import Path
import re


def update(vr):
    manifest=json.loads((vr/'reconstruction-snapshots.json').read_text())
    index=(vr/'index.html').read_text()
    for filename,row in manifest['scenes'].items():
        assert Path(filename).name==filename and filename.endswith('-qc.html')
        page=vr/filename
        text=page.read_text()
        match=re.search(r'window.SCENE = (\{.*?\});',text)
        assert match,filename
        config=json.loads(match.group(1))
        assert config['cloud']==row['previous_cloud'], 'Do not silently change scan alignment'
        old_url=config['url']
        assert old_url in (row['previous_url'],row['url']), 'Unexpected concurrent asset change'
        config['url']=row['url']
        config['snapshot_utc']=manifest['snapshot_utc']
        config['quality_status']=row['status']
        text=text[:match.start(1)]+json.dumps(config)+text[match.end(1):]
        old_thumb=row['previous_url'].rsplit('/',1)[0]+'/thumb.jpg'
        text=text.replace(old_thumb,row['thumb'])
        index=index.replace(old_thumb,row['thumb'])
        # Keep a visible, honest status instead of silently presenting an unfinished candidate as approved.
        text=re.sub(r'(<div class="panel-title">.*?<span>).*?(</span></div>)',
                    lambda m:m[1]+row['status']+m[2],text,count=1)
        page.write_text(text)
    notice='<p class="lede" id="refinement-status">Latest reconstruction snapshot: '+manifest['snapshot_utc'][:10]+'. Support-first refinement; visual quality is not final-approved. Existing scan comparisons are retained.</p>'
    if 'id="refinement-status"' in index:
        index=re.sub(r'<p class="lede" id="refinement-status">.*?</p>',notice,index)
    else:
        index=index.replace('<div class="grid">',notice+'\n<div class="grid">')
    (vr/'index.html').write_text(index)


if __name__=='__main__':
    update(Path(__file__).resolve().parents[1]/'vr')
