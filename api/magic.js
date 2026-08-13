import FormData from 'form-data';
export const config={api:{bodyParser:{sizeLimit:'12mb'}}};
const prompts={
deer:`Edit this kindergarten picture into one coherent warm children's storybook illustration. Interpret and professionally redraw the CHILD'S marks while preserving their approximate positions, number and main colors. Use them to restore a lush natural habitat. Remove ALL construction machinery, barriers, stumps, damaged trees and barren construction ground. Keep the roe deer in the same general position and make it clearly happy. No text or captions.`,
bear:`Edit this kindergarten picture into one coherent warm children's storybook illustration. Interpret and professionally redraw the CHILD'S marks as the child's own idea for protecting the Asiatic black bear, preserving approximate positions, number and main colors. Follow the child's idea rather than forcing one solution. Remove ALL threatening people, nets, cages, traps and hunting/capture equipment. Do not add police, arrest, weapons or violence. Keep the moon bear recognizable with its pale crescent chest marking and same general position, and make it clearly happy, relaxed and safe. No text or captions.`
};
export default async function handler(req,res){
if(req.method!=='POST')return res.status(405).json({error:'POST 요청만 가능합니다.'});
const apiKey=process.env.OPENAI_API_KEY;if(!apiKey)return res.status(500).json({error:'OPENAI_API_KEY가 설정되지 않았습니다.'});
try{
const {image,mission='deer'}=req.body||{};if(!image||typeof image!=='string')return res.status(400).json({error:'그림 이미지가 없습니다.'});if(!prompts[mission])return res.status(400).json({error:'알 수 없는 미션입니다.'});
const match=image.match(/^data:image\/(png|jpeg|jpg|webp);base64,(.+)$/);if(!match)return res.status(400).json({error:'이미지 형식이 올바르지 않습니다.'});
const subtype=match[1]==='jpg'?'jpeg':match[1],mime=`image/${subtype}`,ext=subtype==='jpeg'?'jpg':subtype,bytes=Buffer.from(match[2],'base64');
const form=new FormData();form.append('model','gpt-image-2');form.append('image',bytes,{filename:`child-drawing.${ext}`,contentType:mime,knownLength:bytes.length});form.append('prompt',prompts[mission]);form.append('size','1024x1024');
const response=await fetch('https://api.openai.com/v1/images/edits',{method:'POST',headers:{Authorization:`Bearer ${apiKey}`,...form.getHeaders()},body:form.getBuffer()});
const text=await response.text();let data;try{data=JSON.parse(text)}catch{data={raw:text}}
if(!response.ok)return res.status(response.status).json({error:data?.error?.message||`OpenAI API 오류 (${response.status})`});
const b64=data?.data?.[0]?.b64_json,url=data?.data?.[0]?.url;if(b64)return res.status(200).json({image:`data:image/png;base64,${b64}`});if(url)return res.status(200).json({image:url});
return res.status(502).json({error:'AI 이미지 응답을 찾지 못했습니다.'});
}catch(err){console.error(err);return res.status(500).json({error:err?.message||'서버 오류가 발생했습니다.'})}}
