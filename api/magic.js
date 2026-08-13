import OpenAI, { toFile } from 'openai';

export default async function handler(req, res) {
  if (req.method !== 'POST') return res.status(405).json({ error: 'POST 요청만 가능합니다.' });
  const apiKey = process.env.OPENAI_API_KEY;
  if (!apiKey) return res.status(500).json({ error: 'OPENAI_API_KEY가 설정되지 않았습니다.' });
  try {
    const { image } = req.body || {};
    if (!image || typeof image !== 'string') return res.status(400).json({ error: '그림 이미지가 없습니다.' });
    const match = image.match(/^data:image\/(png|jpeg|jpg|webp);base64,(.+)$/);
    if (!match) return res.status(400).json({ error: '이미지 형식이 올바르지 않습니다.' });
    const mime = match[1] === 'png' ? 'image/png' : match[1] === 'webp' ? 'image/webp' : 'image/jpeg';
    const ext = mime === 'image/png' ? 'png' : mime === 'image/webp' ? 'webp' : 'jpg';
    const buffer = Buffer.from(match[2], 'base64');
    const imageFile = await toFile(buffer, `child-drawing.${ext}`, { type: mime });
    const openai = new OpenAI({ apiKey });
    const result = await openai.images.edit({
      model: 'gpt-image-2',
      image: imageFile,
      prompt: `This is a kindergarten child's drawing over a storybook scene of a sad roe deer in a deforested habitat. Preserve the child's additions, especially the number, rough position, colors and shapes of trees, flowers and plants. Transform those child-drawn marks into a lush, healthy forest while keeping them visibly recognizable as the child's ideas. Keep the overall composition. Make the same roe deer look joyful and smiling because its habitat has returned. Warm gentle children's picture-book illustration, no text.`,
      size: '1536x1024'
    });
    const b64 = result.data?.[0]?.b64_json;
    if (!b64) throw new Error('생성된 이미지 데이터가 없습니다.');
    return res.status(200).json({ image: `data:image/png;base64,${b64}` });
  } catch (e) {
    console.error(e);
    return res.status(500).json({ error: e?.message || 'AI 변환 실패' });
  }
}
