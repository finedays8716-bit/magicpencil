import express from 'express';
import multer from 'multer';
import OpenAI from 'openai';
import fs from 'fs';
const app=express(); const upload=multer({dest:'/tmp'}); const openai=new OpenAI({apiKey:process.env.OPENAI_API_KEY});
app.use(express.static('public'));
app.post('/api/magic',upload.single('image'),async(req,res)=>{try{
 const r=await openai.images.edit({model:'gpt-image-2',image:fs.createReadStream(req.file.path),prompt:`This is a kindergarten child's drawing over a storybook scene of a sad roe deer in a deforested habitat. Preserve the child's additions, especially the number, rough position, colors and shapes of trees, flowers and plants. Transform those child-drawn marks into a lush, healthy forest while keeping them visibly recognizable as the child's ideas. Keep the overall composition. Make the same roe deer look joyful and smiling because its habitat has returned. Warm gentle children's picture-book illustration, no text.`,size:'1536x1024'});
 fs.unlink(req.file.path,()=>{}); res.json({image:`data:image/png;base64,${r.data[0].b64_json}`});
}catch(e){console.error(e);res.status(500).json({error:e?.message||'AI 변환 실패'});}});
app.listen(process.env.PORT||3000,()=>console.log('http://localhost:'+(process.env.PORT||3000)));
