
const CACHE='food-expo-v1';
const FILES=['./','index.html','challenge.html','survey.html','survey-success.html','majors.html','cooperation.html','privacy.html','assets/styles.css','assets/common.js','assets/survey.js','assets/challenge.js','assets/cooperation.js','assets/school-logo.png'];
self.addEventListener('install',e=>e.waitUntil(caches.open(CACHE).then(c=>c.addAll(FILES))));
self.addEventListener('activate',e=>e.waitUntil(caches.keys().then(keys=>Promise.all(keys.filter(k=>k!==CACHE).map(k=>caches.delete(k))))));
self.addEventListener('fetch',e=>{if(e.request.method!=='GET')return;e.respondWith(caches.match(e.request).then(r=>r||fetch(e.request).then(res=>{const clone=res.clone();caches.open(CACHE).then(c=>c.put(e.request,clone));return res}).catch(()=>caches.match('index.html'))))});
