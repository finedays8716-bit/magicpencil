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
    form.append('prompt', `This image shows a kindergarten child's simple drawing added over a children's storybook scene of a sad roe deer in a deforested habitat. Re-illustrate the CHILD'S DRAWN MARKS rather than preserving their crude line style. Interpret what the child intended and transform those marks into polished storybook elements. Keep the child's core ideas: approximate position, number, relative size, and main colors. For example, a brown line with a green circle should become a full leafy tree; small colored circles or marks may become flowers; green strokes may become grass or plants. The child's original rough strokes should be replaced by natural, richly illustrated trees, flowers, grass, and habitat features that clearly grow from the child's ideas. Make the restored habitat noticeably lush and alive, but do not invent a completely different composition or overwhelm the child's choices with unrelated objects. IMPORTANT: completely remove all construction-site elements from the final image, including excavators, cranes, construction barriers, buildings under construction, machinery, cut tree stumps, bare damaged trunks, piles of branches, and visibly barren or excavated ground. Replace those damaged areas with a continuous healthy forest of trees, shrubs, grass, flowers, and natural ground cover, guided by the child's additions. There must be no visible construction site or development machinery remaining in the finished image. The final scene should clearly look like the habitat has been restored. Keep the original roe deer recognizable and in the same general position, but change its expression to a clearly joyful, bright smile because its forest has returned. Maintain one coherent, warm children's picture-book illustration style across the entire image. No text, letters, labels, borders, or captions.`);
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
