// Export with PLAYWRIGHT_MODULE pointing to an installed playwright module and FFMPEG to its executable.
const {chromium}=require(process.env.PLAYWRIGHT_MODULE||'playwright');
const {spawn}=require('node:child_process');
const {once}=require('node:events');
const path=require('node:path');
const fs=require('node:fs');
(async()=>{
 const browser=await chromium.launch({headless:true,channel:'chrome'});
 let encoder;
 try{
  const page=await browser.newPage({viewport:{width:1600,height:1000}});
  const errors=[];page.on('pageerror',e=>errors.push(e.message));
  await page.goto('file://'+path.join(__dirname,'cargo-journey-animation.html'));
  await page.evaluate(()=>document.fonts.ready);
  const destination=path.join(__dirname,'../brag-output/cargo-journey.mp4');
  encoder=spawn(process.env.FFMPEG||'ffmpeg',['-hide_banner','-loglevel','error','-y','-f','image2pipe','-framerate','30','-i','pipe:0','-vf','scale=1920:1080','-c:v','libx264','-preset','fast','-crf','18','-pix_fmt','yuv420p','-movflags','+faststart',destination],{stdio:['pipe','inherit','inherit']});
  const completed=once(encoder,'close');
  encoder.stdin.on('error',()=>{});
  for(let frame=0;frame<900;frame++){
   const data=await page.evaluate(t=>{window.renderFrame(t);return document.getElementById('film').toDataURL('image/png').split(',')[1]},frame/30);
   const png=Buffer.from(data,'base64');
   if(frame===420)fs.writeFileSync(path.join(__dirname,'../brag-output/cargo-journey-preview.png'),png);
   if(!encoder.stdin.write(png))await once(encoder.stdin,'drain');
   if(frame%180===0)console.log(`Rendered ${frame/30}s / 30s`);
  }
  encoder.stdin.end();
  const [code]=await completed;
  if(code!==0||errors.length)throw Error(`Export failed: encoder ${code}; ${errors.join('; ')}`);
  console.log(`Exported ${destination}`);
 }finally{if(encoder&&!encoder.stdin.writableEnded)encoder.kill();await browser.close()}
})().catch(e=>{console.error(e);process.exitCode=1});
