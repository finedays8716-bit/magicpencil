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
    const bytes = Buffer.from(match[2], 'base64');

    // SDK의 toFile 변환을 거치지 않고 Blob에 MIME을 직접 지정해 multipart/form-data로 전송합니다.
    const form = new FormData();
    form.append('model', 'gpt-image-2');
    form.append('image', new Blob([bytes], { type: mime }), `child-drawing.${ext}`);
    form.append('prompt', `This is a kindergarten child's drawing over a storybook scene of a sad roe deer in a deforested habitat. Preserve the child's additions, especially the number, rough position, colors and shapes of trees, flowers and plants. Transform those child-drawn marks into a lush, healthy forest while keeping them visibly recognizable as the child's ideas. Keep the overall composition. Make the same roe deer look joyful and smiling because its habitat has returned. Warm gentle children's picture-book illustration, no text.`);
    form.append('size', '1536x1024');

    const response = await fetch('https://api.openai.com/v1/images/edits', {
      method: 'POST',
      headers: { Authorization: `Bearer ${apiKey}` },
      body: form,
    });

    const data = await response.json();
    if (!response.ok) {
      const msg = data?.error?.message || `OpenAI API 오류 (${response.status})`;
      console.error('OpenAI image edit error:', data);
      return res.status(response.status).json({ error: msg });
    }

    const b64 = data?.data?.[0]?.b64_json;
    if (!b64) return res.status(500).json({ error: '생성된 이미지 데이터가 없습니다.' });
    return res.status(200).json({ image: `data:image/png;base64,${b64}` });
  } catch (e) {
    console.error(e);
    return res.status(500).json({ error: e?.message || 'AI 변환 실패' });
  }
}
