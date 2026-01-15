export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const { 
      currentRoom, 
      style, 
      mode = 'remodel', // 'remodel' or 'staging'
      intensity = 0.5, // 0 = subtle, 1 = dramatic
      changes = [] // array of specific changes: ['island', 'cabinets', 'walls', etc.]
    } = req.body;
    
    const apiKey = process.env.STABILITY_API_KEY;

    if (!apiKey) {
      return res.status(500).json({ error: 'API key not configured' });
    }

    const imageBuffer = Buffer.from(currentRoom, 'base64');

    // Calculate image_strength based on intensity (lower = more change)
    // 0.5 intensity = 0.25 strength (moderate change)
    // 0.8 intensity = 0.15 strength (dramatic change)
    // 0.2 intensity = 0.45 strength (subtle change)
    const imageStrength = Math.max(0.15, Math.min(0.5, 0.5 - (intensity * 0.35)));

    let fullPrompt = '';

    if (mode === 'staging') {
      // Staging mode: Add furniture and decor
      const stagingPrompts = {
        'modern minimalist': 'beautifully staged with modern minimalist furniture, sleek sofa, minimalist coffee table, contemporary art, neutral tones, designer lighting',
        'traditional': 'elegantly staged with traditional furniture, classic sofa, ornate coffee table, decorative accessories, warm lighting, rich textures',
        'contemporary': 'professionally staged with contemporary furniture, stylish seating, modern decor, accent pieces, balanced color palette',
        'rustic farmhouse': 'warmly staged with farmhouse furniture, comfortable sofa, rustic wood table, vintage accessories, cozy textiles, warm lighting',
        'industrial': 'stylishly staged with industrial furniture, leather seating, metal accents, exposed elements, urban accessories, Edison bulbs',
        'scandinavian': 'cozily staged with Scandinavian furniture, light wood pieces, white and gray textiles, minimal decor, natural light, hygge atmosphere',
        'mediterranean': 'beautifully staged with Mediterranean furniture, terracotta accents, warm textiles, arched details, natural materials',
        'luxury': 'luxuriously staged with high-end furniture, designer pieces, premium fabrics, elegant accessories, sophisticated lighting, upscale finishes'
      };

      const stagingStyle = stagingPrompts[style] || stagingPrompts['modern minimalist'];
      fullPrompt = `Professional interior design staging photo, ${stagingStyle}, magazine quality, 8k resolution, photorealistic, professional real estate photography`;
      
    } else {
      // Remodeling mode: Transform the space
      const stylePrompts = {
        'modern minimalist': 'complete modern minimalist kitchen renovation, sleek white flat-panel cabinets, quartz countertops, minimalist hardware, subway tile backsplash, stainless appliances, recessed lighting',
        'traditional': 'complete traditional kitchen remodel, raised panel wood cabinets, granite countertops, ornate hardware, classic tile backsplash, warm wood tones, pendant lighting',
        'contemporary': 'complete contemporary kitchen transformation, two-tone cabinets, waterfall countertops, modern hardware, geometric backsplash, integrated appliances, track lighting',
        'rustic farmhouse': 'complete farmhouse kitchen renovation, shaker cabinets, butcher block counters, vintage hardware, subway tile, farmhouse sink, open shelving, pendant lights',
        'industrial': 'complete industrial kitchen remodel, dark cabinets, concrete countertops, exposed hardware, brick backsplash, stainless appliances, exposed ductwork, industrial pendant lights',
        'scandinavian': 'complete Scandinavian kitchen transformation, light wood cabinets, white countertops, minimalist hardware, white tile, integrated appliances, natural light',
        'mediterranean': 'complete Mediterranean kitchen renovation, warm wood cabinets, terra cotta accents, decorative tile backsplash, arched details, warm lighting',
        'luxury': 'complete luxury kitchen remodel, custom high-end cabinets, marble countertops, designer hardware, premium tile, professional appliances, statement lighting'
      };

      let stylePrompt = stylePrompts[style] || stylePrompts['modern minimalist'];

      // Add specific changes to prompt
      if (changes && changes.length > 0) {
        const changePrompts = {
          'island': 'large kitchen island with seating, waterfall countertop',
          'cabinets': 'completely new cabinet design and color',
          'walls': 'opened up walls, removed barriers, open floor plan',
          'flooring': 'new modern flooring throughout',
          'lighting': 'upgraded modern lighting fixtures, pendant lights, recessed lighting',
          'backsplash': 'stunning new backsplash design',
          'countertops': 'premium new countertop material and design',
          'appliances': 'new high-end stainless steel appliances'
        };

        const selectedChanges = changes
          .filter(change => changePrompts[change])
          .map(change => changePrompts[change])
          .join(', ');

        if (selectedChanges) {
          stylePrompt += `, ${selectedChanges}`;
        }
      }

      fullPrompt = `Professional interior design photo, complete renovation, ${stylePrompt}, dramatic transformation, magazine quality, architectural digest, 8k resolution, photorealistic`;
    }

    // Create form data
    const formData = new FormData();
    formData.append('init_image', new Blob([imageBuffer], { type: 'image/jpeg' }));
    formData.append('init_image_mode', 'IMAGE_STRENGTH');
    formData.append('image_strength', imageStrength.toString());
    formData.append('text_prompts[0][text]', fullPrompt);
    formData.append('text_prompts[0][weight]', '1');
    formData.append('text_prompts[1][text]', 'blurry, bad quality, distorted, ugly, deformed, cluttered, messy, dirty');
    formData.append('text_prompts[1][weight]', '-1');
    formData.append('cfg_scale', '8');
    formData.append('samples', '1');
    formData.append('steps', '50');

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
