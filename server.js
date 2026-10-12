import express from 'express';
import multer from 'multer';
import 'dotenv/config';
import crypto from 'node:crypto';
const app=express();app.set('trust proxy',1);
// Search engine exclusion is advisory, not authentication.
app.use((req,res,next)=>{res.setHeader('X-Robots-Tag','noindex, nofollow, noarchive, nosnippet, noimageindex');next()});
app.use(express.static('public'));
const upload=multer({storage:multer.memoryStorage(),limits:{fileSize:100*1024*1024}});
const jobs=new Map(),limits=new Map();
const templates={hiphop:'Energetic hip-hop choreography, full-body dancing.',kpop:'Precise K-pop choreography, smooth coordinated movements.',shuffle:'Shuffle dance, rhythmic footwork.',fun:'Playful expressive dancing.'};
const token=()=>process.env.REPLICATE_API_TOKEN;
const auth=()=>({Authorization:`Bearer ${token()}`});
async function sendFile(file){const form=new FormData();form.append('content',new Blob([file.buffer],{type:file.mimetype}),file.originalname);const r=await fetch('https://api.replicate.com/v1/files',{method:'POST',headers:auth(),body:form});const d=await r.json();if(!r.ok)throw Error(d.detail||JSON.stringify(d));return d.urls?.get||d.url;}
app.get('/api/health',(req,res)=>res.json({ok:true,configured:!!token()}));
app.post('/api/generate',upload.fields([{name:'photo',maxCount:1},{name:'reference',maxCount:1}]),async(req,res)=>{
 if(!token())return res.status(503).json({error:'Replicate APIキーが未設定です'});
 const image=req.files?.photo?.[0],video=req.files?.reference?.[0];
 if(!image||!video)return res.status(400).json({error:'人物写真と参照ダンス動画をアップロードしてください'});
 if(!['image/jpeg','image/png','image/webp'].includes(image.mimetype)||image.size>10*1024*1024)return res.status(400).json({error:'写真は10MB以内のJPG/PNG/WebPにしてください'});
 if(!['video/mp4','video/quicktime'].includes(video.mimetype))return res.status(400).json({error:'動画はMP4/MOVにしてください'});
 const ip=req.ip,now=Date.now(),entry=limits.get(ip)||{time:now,count:0};if(now-entry.time>3600000){entry.time=now;entry.count=0}if(entry.count>=Number(process.env.MAX_REQUESTS_PER_HOUR||3))return res.status(429).json({error:'1時間の生成上限に達しました'});entry.count++;limits.set(ip,entry);
 try{const [imageUrl,videoUrl]=await Promise.all([sendFile(image),sendFile(video)]);
 const input={image:imageUrl,video:videoUrl,mode:'pro',character_orientation:req.body.orientation==='image'?'image':'video',keep_original_sound:req.body.sound==='true',prompt:templates[req.body.dance]||templates.hiphop};
 const r=await fetch('https://api.replicate.com/v1/models/kwaivgi/kling-v3-motion-control/predictions',{method:'POST',headers:{...auth(),'Content-Type':'application/json'},body:JSON.stringify({input})});const d=await r.json();if(!r.ok)throw Error(d.detail||JSON.stringify(d));const id=crypto.randomUUID();jobs.set(id,{predictionId:d.id,created:Date.now()});res.json({id,status:d.status});
 }catch(e){res.status(502).json({error:String(e.message)})}
});
app.get('/api/status/:id',async(req,res)=>{const job=jobs.get(req.params.id);if(!job)return res.status(404).json({error:'ジョブがありません（サーバー再起動後は失効します）'});try{const r=await fetch(`https://api.replicate.com/v1/predictions/${encodeURIComponent(job.predictionId)}`,{headers:auth()});const d=await r.json();if(!r.ok)throw Error(d.detail||'取得失敗');let output=d.output;const video=typeof output==='string'?output:Array.isArray(output)?output.find(x=>typeof x==='string'):output?.url||null;res.json({status:d.status,video,error:d.error||null});}catch(e){res.status(502).json({error:String(e.message)})}});
setInterval(()=>{const now=Date.now();for(const [k,v] of jobs)if(now-v.created>86400000)jobs.delete(k);for(const [k,v] of limits)if(now-v.time>3600000)limits.delete(k)},3600000).unref();
app.listen(process.env.PORT||3000,()=>console.log('MotionMuse listening'));
