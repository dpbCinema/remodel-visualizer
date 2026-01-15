// API endpoint for generating transformed images
export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const { currentRoom, style } = req.body;
    const apiKey = process.env.STABILITY_API_KEY;

    if (!apiKey) {
      return res.status(500).json({ error: 'API key not configured' });
    }

    // Convert base64 to buffer
    const imageBuffer = Buffer.from(currentRoom, 'base64');

    // Build style prompt
    const stylePrompts = {
      'modern minimalist': 'modern minimalist interior design, clean lines, neutral colors, sleek furniture',
      'traditional': 'traditional elegant interior design, classic furniture, warm colors, timeless style',
      'contemporary': 'contemporary interior design, stylish furniture, balanced aesthetics',
      'rustic farmhouse': 'rustic farmhouse interior design, reclaimed wood, vintage elements, cozy atmosphere',
      'industrial': 'industrial interior design, exposed brick, metal accents, urban loft style',
      'scandinavian': 'scandinavian interior design, light wood, white walls, minimal clutter, hygge',
      'mediterranean': 'mediterranean interior design, terracotta, warm colors, arched details',
      'luxury': 'luxury high-end interior design, premium materials, elegant finishes, sophisticated'
    };

    const stylePrompt = stylePrompts[style] || stylePrompts['modern minimalist'];
    const fullPrompt = `Professional interior design photo, ${stylePrompt}, beautifully staged, bright natural lighting, magazine quality, 8k, photorealistic`;

    // Create form data
    const formData = new FormData();
    formData.append('init_image', new Blob([imageBuffer], { type: 'image/jpeg' }));
    formData.append('init_image_mode', 'IMAGE_STRENGTH');
    formData.append('image_strength', '0.35');
    formData.append('text_prompts[0][text]', fullPrompt);
    formData.append('text_prompts[0][weight]', '1');
    formData.append('text_prompts[1][text]', 'blurry, bad quality, distorted, ugly, deformed');
    formData.append('text_prompts[1][weight]', '-1');
    formData.append('cfg_scale', '7');
    formData.append('samples', '1');
    formData.append('steps', '40');

    // Call Stability AI
    const response = await fetch(
      'https://api.stability.ai/v1/generation/stable-diffusion-xl-1024-v1-0/image-to-image',
      {
        method: 'POST',
        headers: {
          'Accept': 'application/json',
          'Authorization': `Bearer ${apiKey}`,
        },
        body: formData,
      }
    );

    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.message || `API Error: ${response.status}`);
    }

    const data = await response.json();

    if (data.artifacts && data.artifacts.length > 0) {
      const imageData = data.artifacts[0].base64;
      return res.status(200).json({ 
        image: `data:image/png;base64,${imageData}`,
        success: true 
      });
    } else {
      throw new Error('No image generated');
    }

  } catch (error) {
    console.error('Generation error:', error);
    return res.status(500).json({ 
      error: error.message || 'Failed to generate image',
      success: false 
    });
  }
}

export const config = {
  api: {
    bodyParser: {
      sizeLimit: '10mb',
    },
  },
};
