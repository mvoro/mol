import {chromium} from 'playwright';
import assert from 'node:assert/strict';import {readFile} from 'node:fs/promises';
const base = process.env.ARTIFACT_BASE_URL || 'http://127.0.0.1:5190';
const browser=await chromium.launch();const p=await browser.newPage({viewport:{width:390,height:844},isMobile:true,hasTouch:true});const errors=[];p.on('pageerror',e=>errors.push(e.message));
await p.goto(`${base}/?chat=molecula-document-demo-v1`);await p.waitForTimeout(800);
for(const format of ['pdf','docx','md']){
 await p.getByRole('button',{name:`Открыть Городской сад.${format}`,exact:true}).click();await p.locator(format==='pdf'?'.react-pdf__Page canvas':'.artifact-document').first().waitFor();await p.waitForTimeout(350);
 const downloadPromise=p.waitForEvent('download');await p.getByRole('link',{name:'Скачать исходный файл'}).click();const download=await downloadPromise;
 assert.deepEqual(await readFile(await download.path()),await readFile(`public/documents/garden.${format}`));
 await p.getByRole('button',{name:'Скрыть предпросмотр'}).click();await p.waitForTimeout(300);console.log('PASS mobile format/download',format);
}
for(const format of ['pdf','docx']){
 await p.route(`**/documents/garden.${format}`,r=>r.fulfill({status:200,body:'broken content'}));await p.getByRole('button',{name:`Открыть Городской сад.${format}`,exact:true}).click();await p.getByRole('alert').filter({hasText:'Не удалось открыть документ'}).waitFor();assert.ok(await p.getByRole('link',{name:'Скачать исходный файл'}).isVisible());await p.getByRole('button',{name:'Скрыть предпросмотр'}).click();await p.waitForTimeout(300);await p.unroute(`**/documents/garden.${format}`);console.log('PASS malformed document error/download',format);
}
await p.route('**/documents/garden.md',r=>r.fulfill({status:200,body:'# Safe\n<script>window.pwned=1</script>\n<img src=x onerror="window.pwned=1">\n[Bad](javascript:alert(1))\n\n| A | B |\n|---|---|\n| 1 | 2 |'}));await p.getByRole('button',{name:'Открыть Городской сад.md',exact:true}).click();await p.locator('.artifact-document').waitFor();assert.equal(await p.evaluate(()=>window.pwned),undefined);assert.equal(await p.locator('.artifact-document script,.artifact-document [onerror],.artifact-document a[href^="javascript:"]').count(),0);console.log('PASS Markdown HTML/script disabled');
await p.close();
const page=await browser.newPage({viewport:{width:1280,height:900}});await page.goto(`${base}/`);await page.waitForTimeout(700);
await page.evaluate(async()=>{
 const {storeDocument}=await import('/src/document-storage.js');
 const file={id:'persist-test',name:'Сохранённый.md',raw:new File(['# Persistent document\n\nContent after reload'], 'Сохранённый.md',{type:'text/markdown'})};await storeDocument(file);
 const h=JSON.parse(localStorage.getItem('molecula-composer-history'));
 h.unshift({id:'persistence-qa',title:'User document',projectId:null,mode:'auto',model:'Молли 1.0',messages:[{id:'p1',role:'user',text:'A saved document',files:[{id:file.id,name:file.name,mime:'text/markdown'}]}]});localStorage.setItem('molecula-composer-history',JSON.stringify(h));
});
await page.goto(`${base}/?chat=persistence-qa`);await page.getByRole('button',{name:'Открыть Сохранённый.md',exact:true}).click();await page.getByRole('heading',{name:'Persistent document'}).waitFor();console.log('PASS IndexedDB document after reload');
await page.setViewportSize({width:720,height:900});await page.waitForTimeout(400);const panel=await page.locator('.artifact-panel').boundingBox(),main=await page.locator('.chat-main').boundingBox();assert.ok(Math.abs(panel.width-main.width)<2);console.log('PASS narrow desktop fallback');
await page.emulateMedia({reducedMotion:'reduce'});assert.equal(await page.locator('.artifact-panel').evaluate(el=>getComputedStyle(el).transitionDuration),'0s');console.log('PASS reduced motion');
await page.close();await browser.close();assert.deepEqual(errors,[]);console.log('ALL EXTRA CHECKS PASSED');
