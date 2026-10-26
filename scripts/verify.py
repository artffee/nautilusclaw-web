from pathlib import Path
from html.parser import HTMLParser
from urllib.parse import urlsplit
import subprocess,re,tempfile,json
root=Path(__file__).resolve().parents[1]
class Page(HTMLParser):
 def __init__(self,text):
  super().__init__();self.links=[];self.ids=set();self.feed(text)
 def handle_starttag(self,tag,attrs):
  a=dict(attrs)
  if 'id' in a:self.ids.add(a['id'])
  if tag in ('a','link','script'):
   href=a.get('href',a.get('src',''))
   if href:self.links.append(href)
pages={p.name:Page(p.read_text()) for p in root.glob('*.html')}
for name,page in pages.items():
 for link in page.links:
  u=urlsplit(link)
  if u.scheme or u.netloc:continue
  target=(root/(u.path.lstrip('/') or 'index.html')) if u.path else root/name
  if not target.suffix:target=target.with_suffix('.html')
  assert target.exists(),f'{name}: missing {link}'
  if u.fragment and target.name in pages:assert u.fragment in pages[target.name].ids,f'{name}: missing anchor {link}'
for folder in [root,root/'api',root/'lib',root/'scripts']:
 for p in list(folder.glob('*.js'))+list(folder.glob('*.mjs')):subprocess.run(['node','--check',str(p)],check=True)
for p in root.glob('*.html'):
 for attrs,code in re.findall(r'<script(\s[^>]*)?>(.*?)</script>',p.read_text(),re.S):
  if 'application/ld+json' in attrs:
   json.loads(code);continue
  if not code.strip():continue
  with tempfile.NamedTemporaryFile(suffix='.js',mode='w') as f:
   f.write(code);f.flush();subprocess.run(['node','--check',f.name],check=True)
for name in ['index.html','adventure.html','parent-preview.html','guide.html']:
 assert 'href="#"' not in (root/name).read_text(),f'{name}: placeholder link'
print(f'PASS: {len(pages)} pages, internal destinations and anchors, JavaScript syntax, no placeholder links.')

