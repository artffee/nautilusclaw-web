import {mkdir, copyFile, rm, readFile, writeFile} from 'node:fs/promises';
const publicFiles = ['index.html','home.js','pricing.html','billing.html','billing.js','plans.js','ocean.css','favicon.svg',
  'stories.html','stories.js','stories.css','story-data.mjs','learn.html','learning.js','learning.css','learning-core.mjs','adventure.html','adventure.js','reef-recap.mjs','recap.html','recap.js','robots.txt','sitemap.xml','parent.html','parent-preview.html','parent-view.js','guide.html',
  'app.html','auth.js','db.js','supabase-config.js'];
await rm('dist', {recursive:true,force:true});
await mkdir('dist',{recursive:true});
for(const file of publicFiles) await copyFile(file, 'dist/'+file);
// Keep one source for shared styles while avoiding two blocking style requests on home.
let home=await readFile('dist/index.html','utf8');
for(const file of ['ocean.css','stories.css']){
  const css=await readFile(file,'utf8');
  home=home.replace(`<link rel="stylesheet" href="/${file}">`,`<style>${css}</style>`);
}
await writeFile('dist/index.html',home);
console.log(`Built ${publicFiles.length} public assets. Server code stays outside static output.`);

