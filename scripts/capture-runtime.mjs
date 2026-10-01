import { mkdir,writeFile } from 'node:fs/promises';
import { dirname } from 'node:path';
const prefix='wp-content/plugins/elementor/assets/';
const paths=['toggle','background-slideshow','background-video','section-stretched-section','text-editor','lightbox-lightbox','image-carousel'].map(n=>'js/chunks/'+n+'.min.js?ver=4.3.3');
paths.push('lib/dialog/dialog.min.js?ver=4.9.3','lib/share-link/share-link.min.js?ver=4.3.3','lib/swiper/v8/swiper.min.js?ver=8.4.5','lib/swiper/v8/css/swiper.min.css?ver=8.4.5','css/conditionals/lightbox.min.css?ver=4.3.3','css/conditionals/dialog.min.css?ver=4.3.3');
await Promise.all(paths.map(async path=>{
 const response=await fetch('https://mam.london/'+prefix+path);
 if(!response.ok)throw new Error(path+': '+response.status);
 if(response.headers.get('content-type')?.includes('text/html'))throw Error('HTML instead of asset '+path);
 const dest='public/'+prefix+path.split('?')[0];await mkdir(dirname(dest),{recursive:true});await writeFile(dest,Buffer.from(await response.arrayBuffer()));
 console.log('Captured '+path);
}));
