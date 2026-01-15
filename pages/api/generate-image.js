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

    // Calculate image_strength based on mode and intensity
    let imageStrength;
    if (mode === 'staging') {
      // Staging: Keep more of original (0.5-0.7) to preserve the room structure
      imageStrength = Math.max(0.5, Math.min(0.7, 0.7 - (intensity * 0.2)));
    } else {
      // Remodel: Lower strength for dramatic changes (0.15-0.5)
      imageStrength = Math.max(0.15, Math.min(0.5, 0.5 - (intensity * 0.35)));
    }

    let fullPrompt = '';

    if (mode === 'staging') {
      // Staging mode: Add furniture and decor while keeping the existing room
      const stagingPrompts = {
        'modern minimalist': 'add modern minimalist furniture and decor to this space, sleek contemporary sofa, minimalist coffee table, modern art on walls, neutral throw pillows, designer lighting fixtures, keep existing room structure and walls',
        'traditional': 'add traditional elegant furniture and decor to this space, classic sofa, ornate wooden coffee table, traditional rug, decorative accessories, warm lighting, keep existing room structure and walls',
        'contemporary': 'add contemporary furniture and decor to this space, stylish modern seating, contemporary coffee table, modern art, accent pieces, keep existing room structure and walls',
        'rustic farmhouse': 'add rustic farmhouse furniture and decor to this space, comfortable farmhouse sofa, rustic wood coffee table, vintage accessories, cozy textiles, keep existing room structure and walls',
        'industrial': 'add industrial furniture and decor to this space, leather seating, metal and wood coffee table, industrial accessories, Edison bulb lighting, keep existing room structure and walls',
        'scandinavian': 'add Scandinavian furniture and decor to this space, light wood pieces, white and gray textiles, minimal decor, cozy throw blankets, keep existing room structure and walls',
        'mediterranean': 'add Mediterranean furniture and decor to this space, warm textiles, terracotta accents, natural materials, decorative pottery, keep existing room structure and walls',
        'luxury': 'add luxury high-end furniture and decor to this space, designer sofa, premium fabrics, elegant accessories, sophisticated lighting, keep existing room structure and walls'
      };

      const stagingStyle = stagingPrompts[style] || stagingPrompts['modern minimalist'];
      fullPrompt = `Professional interior design staging, ${stagingStyle}, add furniture and decor only, preserve existing architecture and room structure, magazine quality, photorealistic`;
      
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
