# Image

Generate images via [Stable Horde](https://aihorde.net) — free, no API key required, community-powered GPU network.

```
GET  https://your-domain.pages.dev/image
POST https://your-domain.pages.dev/image
```

---

## Parameters

| Param | Required | Default | Description |
|-------|----------|---------|-------------|
| `q` / `prompt` | yes | — | Image description |
| `negative_prompt` / `negative` | no | — | Things to exclude |
| `model` | no | `Deliberate` | Model name — see [Models](#models) below or `/models` |
| `resolution` | no | `512x512` | See [Resolutions](#resolutions) below |
| `num` / `numImages` | no | `1` | Number of images (1–4) |
| `steps` | no | `25` | Inference steps (10–50). Higher = more detail, slower |
| `cfg` / `cfg_scale` | no | `7.0` | Prompt guidance scale (1–20). Higher = more literal |
| `sampler` | no | `k_euler_a` | Sampler algorithm — see [Samplers](#samplers) |
| `seed` | no | random | Integer seed for reproducibility |

---

## Resolutions

| Value | Size | Best for |
|-------|------|----------|
| `512x512` | 512×512 | Default, fast, square |
| `512x768` | 512×768 | Portrait |
| `768x512` | 768×512 | Landscape |
| `768x768` | 768×768 | Square, high quality |
| `640x960` | 640×960 | Portrait (SDXL-style) |
| `960x640` | 960×640 | Landscape (SDXL-style) |
| `832x1216` | 832×1216 | Tall portrait (SDXL) |
| `1216x832` | 1216×832 | Wide landscape (SDXL) |
| `1024x576` | 1024×576 | Widescreen |
| `576x1024` | 576×1024 | Tall widescreen |
| `1024x1024` | 1024×1024 | Square, max quality (SDXL) |

> For SDXL models (`DreamShaper XL`, `Juggernaut XL`, `SDXL 1.0`, etc.) use 1024-range resolutions. For SD 1.5 models use 512–768.

---

## Models

Use `/models` to get the live list with real-time worker counts. Pass the exact `name` string.

| Model | Style |
|-------|-------|
| `Deliberate` | Realistic — **default** |
| `Realistic Vision` | Realistic, photographic |
| `epiCRealism` | Ultra-realistic |
| `Photon` | Realistic, clean |
| `AbsoluteReality` | Photorealistic |
| `CyberRealistic` | Sci-fi realism |
| `NeverEnding Dream` | Dreamlike realism |
| `Dreamshaper` | Artistic, versatile |
| `DreamShaper XL` | Artistic, SDXL |
| `Juggernaut XL` | General, SDXL |
| `ICBINP` | Photographic |
| `Openjourney Diffusion` | Midjourney-style |
| `Rev Animated` | Stylized, animated |
| `Elldreth's Lucid Mix` | Artistic mix |
| `Vintedois Diffusion` | Illustration style |
| `Anything Diffusion` | Anime |
| `Anything v5` | Anime |
| `MeinaMix` | Anime, detailed |
| `Counterfeit` | Anime, soft |
| `NijiJourney Diffusion` | Anime, Midjourney-style |
| `AbyssOrangeMix` | Anime, dark |
| `Kenshi` | Anime, painterly |
| `Fantasy Worlds` | Fantasy illustration |
| `Dungeons and Diffusion` | D&D / fantasy |
| `Elldreths Retro Diffusion` | Retro / vintage |
| `Protogen x3.4` | Sci-fi stylized |
| `GhostMix` | Stylized, ghostly |
| `Dark Sushi Mix` | Dark, cinematic |
| `Hassaku` | Dark anime |
| `CamelliaMix Ange` | Dark stylized |
| `Midjourney Diffusion` | Concept art |
| `Graphic-Art` | Graphic design |
| `SDXL 1.0` | General, SDXL base |
| `AlbedoBase XL` | SDXL, versatile |
| `RealVisXL` | SDXL, realistic |
| `Animagine XL` | SDXL, anime |

> Models with no active workers will fail immediately. Always use `/models` to check `count > 0` before using a less common model.

---

## Samplers

| Sampler | Notes |
|---------|-------|
| `k_euler_a` | **Default** — fast, good variety |
| `k_euler` | Fast, consistent |
| `k_dpmpp_2m` | High quality, recommended for most cases |
| `k_dpmpp_sde` | Stochastic, creative results |
| `k_dpm_2` | Sharp, detailed |
| `k_dpm_2_a` | Ancestral variant |
| `k_heun` | Slower, very high quality |
| `DDIM` | Deterministic, fast |

---

## GET

```bash
# Basic
curl "https://your-domain.pages.dev/image?q=a+sunset+over+mountains"

# Full options
curl "https://your-domain.pages.dev/image?q=a+portrait+of+a+knight,+dramatic+lighting&negative=blurry,watermark&model=Realistic+Vision&resolution=512x768&steps=30&cfg=7.5&sampler=k_dpmpp_2m&num=2&seed=42"
```

---

## POST

```bash
curl -X POST https://your-domain.pages.dev/image \
  -H "Content-Type: application/json" \
  -d '{
    "prompt": "a highly detailed fantasy castle on a cliff at sunset, dramatic lighting, volumetric fog",
    "negative_prompt": "blurry, watermark, low quality, cartoon",
    "model": "Dreamshaper",
    "resolution": "768x512",
    "num": 2,
    "steps": 30,
    "cfg_scale": 7.5,
    "sampler": "k_dpmpp_2m",
    "seed": 12345
  }'
```

---

## Response

```json
{
  "success": true,
  "prompt": "a sunset over mountains",
  "negative_prompt": null,
  "model": "Deliberate",
  "resolution": "512x512",
  "sampler": "k_euler_a",
  "steps": 25,
  "cfg_scale": 7.0,
  "num_images": 1,
  "elapsed_ms": 14200,
  "images": [
    {
      "b64": "<base64-encoded jpeg>",
      "url": "https://...",
      "seed": "149576367",
      "model": "Deliberate",
      "worker": "some-worker-name"
    }
  ]
}
```

| Field | Type | Description |
|-------|------|-------------|
| `success` | bool | `true` on success |
| `prompt` | string | Prompt used |
| `negative_prompt` | string \| null | Negative prompt used |
| `model` | string | Model requested |
| `resolution` | string | Resolution used |
| `sampler` | string | Sampler used |
| `steps` | number | Steps used |
| `cfg_scale` | number | CFG scale used |
| `num_images` | number | Number of images returned |
| `elapsed_ms` | number | Total time including queue wait |
| `images[].b64` | string | Base64-encoded JPEG |
| `images[].url` | string | Temporary R2 hosted URL (expires) |
| `images[].seed` | string | Seed used — save to reproduce |
| `images[].model` | string | Actual model used by worker |
| `images[].worker` | string | Worker name that processed the job |

---

## Displaying Images

```html
<img src="data:image/jpeg;base64,{{ b64 }}">
```

```js
const res = await fetch('https://your-domain.pages.dev/image', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({ prompt: 'a mountain lake at sunrise', model: 'Dreamshaper' })
});
const data = await res.json();
data.images.forEach(img => {
  const el = document.createElement('img');
  el.src = `data:image/jpeg;base64,${img.b64}`;
  document.body.appendChild(el);
});
```

---

## Timing

Stable Horde uses community-donated GPUs so wait time depends on queue depth and available workers.

| Condition | Typical wait |
|-----------|-------------|
| Popular model, low queue | 5–20s |
| Popular model, busy | 20–60s |
| Rare model / no workers | Fails immediately with error |
| Timeout | 120s max, then cancelled |

Use `/models` to check `count` (active workers) and `eta` before picking a model.

---

## Errors

| Status | Error | Cause |
|--------|-------|-------|
| `400` | `Missing required parameter: q or prompt` | No prompt |
| `400` | `Invalid JSON body` | Malformed POST |
| `429` | `Rate limit exceeded` | >10 requests/60s per IP |
| `502` | `No workers available for model '...'` | Model has no active workers |
| `502` | `Timed out after 120s` | Queue too long |
| `502` | `Job faulted` | Worker error |