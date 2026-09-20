"""Apply versioned reconstruction pointers without regenerating the shared VR app.

Usage: python agent/tools/update-vr-reconstructions.py
Input: agent/vr/reconstruction-snapshots.json. Existing controls, scan-cloud URLs,
page names, camera data and the shared app stay unchanged. Re-running is idempotent.
"""
import json
import hashlib
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
        assert old_url in (row['previous_url'],row['url'],row.get('prior_snapshot_url')), 'Unexpected concurrent asset change'
        config['url']=row['url']
        config['snapshot_utc']=manifest['snapshot_utc']
        config['quality_status']=row['status']
        if 'rendering' in row:
            config['rendering']=row['rendering']
        text=text[:match.start(1)]+json.dumps(config)+text[match.end(1):]
        old_thumb=row['previous_url'].rsplit('/',1)[0]+'/thumb.jpg'
        text=text.replace(old_thumb,row['thumb'])
        index=index.replace(old_thumb,row['thumb'])
        if row.get('prior_thumbnail'):
            text=text.replace(row['prior_thumbnail'],row['thumb'])
            index=index.replace(row['prior_thumbnail'],row['thumb'])
        # Keep a visible, honest status instead of silently presenting an unfinished candidate as approved.
        text=re.sub(r'(<div class="panel-title">.*?<span>).*?(</span></div>)',
                    lambda m:m[1]+row['status']+m[2],text,count=1)
        app_hash=hashlib.sha256((vr/'app.js').read_bytes()).hexdigest()[:12]
        text=re.sub(r'src="app.js\?v=[^"]+"',f'src="app.js?v={app_hash}"',text)
        page.write_text(text)
    index=re.sub(r'<p class="lede" id="refinement-status">.*?</p>\s*','',index)
    index=re.sub(r'<p class="lede">.*?</p>',
                 '<p class="lede">Example scenes created by LiteReality-Agent. Click a scene to open the interactive viewer.</p>',
                 index,count=1,flags=re.DOTALL)
    (vr/'index.html').write_text(index)


if __name__=='__main__':
    update(Path(__file__).resolve().parents[1]/'vr')
