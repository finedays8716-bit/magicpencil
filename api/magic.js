import FormData from 'form-data';

export const config = { api: { bodyParser: { sizeLimit: '12mb' } } };

export default async function handler(req, res) {
  if (req.method !== 'POST') return res.status(405).json({ error: 'POST 요청만 가능합니다.' });
  const apiKey = process.env.OPENAI_API_KEY;
  if (!apiKey) return res.status(500).json({ error: 'OPENAI_API_KEY가 설정되지 않았습니다.' });

  try {
    const { image } = req.body || {};
    if (!image || typeof image !== 'string') return res.status(400).json({ error: '그림 이미지가 없습니다.' });

    const match = image.match(/^data:image\/(png|jpeg|jpg|webp);base64,(.+)$/);
    if (!match) return res.status(400).json({ error: '이미지 형식이 올바르지 않습니다.' });

    const subtype = match[1] === 'jpg' ? 'jpeg' : match[1];
    const mime = `image/${subtype}`;
    const ext = subtype === 'jpeg' ? 'jpg' : subtype;
    const bytes = Buffer.from(match[2], 'base64');

    console.log('magic upload:', { mime, ext, bytes: bytes.length });

    const form = new FormData();
    form.append('model', 'gpt-image-2');
    form.append('image', bytes, {
      filename: `child-drawing.${ext}`,
      contentType: mime,
      knownLength: bytes.length,
    });
    form.append('prompt', 'This is a kindergarten child drawing over a storybook scene of a sad roe deer in a deforested habitat. Preserve the child\'s additions, especially their number, rough positions, colors, and shapes. Transform the child\'s drawn trees, plants, flowers, and nature marks into a lush, warm, abundant forest while keeping the composition recognizable. Keep the roe deer in the same scene but make it clearly happy and smiling because its habitat has returned. Keep a gentle children\'s picture-book illustration style. Do not add text.');
    form.append('size', '1536x1024');

    const response = await fetch('https://api.openai.com/v1/images/edits', {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${apiKey}`,
        ...form.getHeaders(),
      },
      body: form.getBuffer(),
    });

    const text = await response.text();
    let data;
    try { data = JSON.parse(text); } catch { data = { raw: text }; }

    if (!response.ok) {
      console.error('OpenAI image edit error:', response.status, data);
      return res.status(response.status).json({ error: data?.error?.message || `OpenAI API 오류 (${response.status})` });
    }

    const b64 = data?.data?.[0]?.b64_json;
    const url = data?.data?.[0]?.url;
    if (b64) return res.status(200).json({ image: `data:image/png;base64,${b64}` });
    if (url) return res.status(200).json({ image: url });
    console.error('Unexpected OpenAI response:', data);
    return res.status(502).json({ error: 'AI 이미지 응답을 찾지 못했습니다.' });
  } catch (err) {
    console.error('magic handler error:', err);
    return res.status(500).json({ error: err?.message || '서버 오류가 발생했습니다.' });
  }
}
