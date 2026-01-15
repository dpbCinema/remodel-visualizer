export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const { 
      currentRoom, 
      style, 
      mode = 'remodel',
      intensity = 0.7,
      changes = [],
      cabinetColor = '',
      countertopMaterial = '',
      wallColor = ''
    } = req.body;
    
    const apiKey = process.env.STABILITY_API_KEY;

    if (!apiKey) {
      return res.status(500).json({ error: 'API key not configured' });
    }

    const imageBuffer = Buffer.from(currentRoom, 'base64');

    // Calculate image_strength based on mode and intensity
    let imageStrength;
    if (mode === 'staging') {
      // Staging: Keep more of original (0.55-0.75) to preserve the room
      imageStrength = Math.max(0.55, Math.min(0.75, 0.75 - (intensity * 0.2)));
    } else {
      // Remodel: VERY LOW for dramatic changes (0.08-0.30)
      imageStrength = Math.max(0.08, Math.min(0.30, 0.30 - (intensity * 0.22)));
    }

    let fullPrompt = '';
    let negativePrompt = 'blurry, bad quality, distorted, ugly, deformed, cluttered, messy, dirty, extra appliances, duplicate refrigerators, multiple stoves, extra sinks, warped cabinets, crooked walls, unrealistic proportions';

    if (mode === 'staging') {
      const stagingPrompts = {
        'modern minimalist': 'add modern minimalist furniture and decor to this existing space, sleek contemporary sofa, minimalist coffee table, modern art on walls, neutral throw pillows, designer lighting, preserve existing room structure',
        'traditional': 'add traditional elegant furniture and decor to this existing space, classic sofa, ornate wooden coffee table, traditional area rug, decorative accessories, preserve existing room structure',
        'contemporary': 'add contemporary stylish furniture and decor to this existing space, modern seating, contemporary coffee table, modern art pieces, preserve existing room structure',
        'rustic farmhouse': 'add rustic farmhouse furniture and decor to this existing space, comfortable farmhouse sofa, rustic wood coffee table, vintage accessories, cozy textiles, preserve existing room structure',
        'industrial': 'add industrial furniture and decor to this existing space, leather seating, metal and wood coffee table, industrial accessories, Edison bulb lighting, preserve existing room structure',
        'scandinavian': 'add Scandinavian furniture and decor to this existing space, light wood pieces, white and gray textiles, minimal hygge decor, preserve existing room structure',
        'mediterranean': 'add Mediterranean furniture and decor to this existing space, warm textiles, terracotta accents, natural materials, decorative pottery, preserve existing room structure',
        'luxury': 'add luxury high-end furniture and decor to this existing space, designer sofa, premium fabrics, elegant accessories, sophisticated lighting, preserve existing room structure'
      };

      const stagingStyle = stagingPrompts[style] || stagingPrompts['modern minimalist'];
      fullPrompt = `Professional interior staging photography, ${stagingStyle}, only add furniture and decorative items, keep all existing walls floors and architecture intact, photorealistic, 8k, magazine quality`;
      
    } else {
      // REMODEL MODE - Build detailed transformation prompt
      let transformationDetails = [];
      
      // Cabinet color specification
      if (cabinetColor) {
        const cabinetDescriptions = {
          'white': 'bright white painted shaker cabinets with modern hardware',
          'navy': 'deep navy blue painted cabinets with brass hardware',
          'gray': 'soft gray painted cabinets with chrome hardware',
          'light-wood': 'natural light oak wood cabinets with simple pulls',
          'dark-wood': 'rich dark walnut wood cabinets with traditional hardware'
        };
        transformationDetails.push(cabinetDescriptions[cabinetColor] || 'new modern cabinets');
      }
      
      // Countertop material
      if (countertopMaterial) {
        const countertopDescriptions = {
          'quartz': 'pristine white quartz countertops with subtle veining',
          'granite': 'polished granite countertops with natural stone patterns',
          'marble': 'luxurious white marble countertops with gray veining',
          'butcher-block': 'warm butcher block wood countertops',
          'concrete': 'modern concrete countertops with smooth finish'
        };
        transformationDetails.push(countertopDescriptions[countertopMaterial] || 'premium countertops');
      }
      
      // Wall color
      if (wallColor) {
        const wallDescriptions = {
          'white': 'crisp white walls',
          'gray': 'soft gray walls',
          'beige': 'warm beige walls',
          'blue': 'sophisticated blue-gray walls'
        };
        transformationDetails.push(wallDescriptions[wallColor] || 'freshly painted walls');
      }

      // Base style prompts
      const stylePrompts = {
        'modern minimalist': 'complete modern minimalist kitchen renovation, clean lines, flat-panel cabinetry, sleek hardware, subway tile backsplash, stainless steel appliances, recessed lighting, open layout',
        'traditional': 'complete traditional kitchen remodel, raised panel wood cabinetry, ornate hardware, classic tile backsplash, warm tones, crown molding, pendant lighting over island',
        'contemporary': 'complete contemporary kitchen transformation, two-tone cabinetry, waterfall countertop edges, modern hardware, geometric tile backsplash, integrated appliances, linear lighting',
        'rustic farmhouse': 'complete farmhouse kitchen renovation, shaker style cabinets, farmhouse sink, open shelving, subway tile, butcher block accents, industrial pendant lights, ship lap walls',
        'industrial': 'complete industrial kitchen remodel, dark cabinetry, exposed elements, brick or concrete backsplash, stainless appliances, metal hardware, exposed beam ceiling, industrial pendant lights',
        'scandinavian': 'complete Scandinavian kitchen transformation, light wood cabinetry, white surfaces, minimalist hardware, simple tile, integrated appliances, abundant natural light, pendant lights',
        'mediterranean': 'complete Mediterranean kitchen renovation, warm wood cabinets, terra cotta tile accents, decorative backsplash, arched details, wrought iron hardware, warm pendant lighting',
        'luxury': 'complete luxury kitchen remodel, custom high-end cabinetry, premium stone countertops, designer tile backsplash, professional grade appliances, under-cabinet lighting, crystal chandeliers'
      };

      let basePrompt = stylePrompts[style] || stylePrompts['modern minimalist'];
      
      // Add specific changes
      if (changes && changes.length > 0) {
        const changePrompts = {
          'island': 'large center island with seating for 4, waterfall edge countertop',
          'cabinets': 'completely replace all cabinets with new design and color',
          'walls': 'open floor plan, removed walls, expanded space, open concept layout',
          'flooring': 'new wide-plank hardwood flooring throughout',
          'lighting': 'modern recessed lighting, statement pendant lights over island',
          'backsplash': 'floor to ceiling designer tile backsplash',
          'countertops': 'all new premium countertops with waterfall edges',
          'appliances': 'brand new stainless steel professional appliances'
        };

        const selectedChanges = changes
          .filter(change => changePrompts[change])
          .map(change => changePrompts[change])
          .join(', ');

        if (selectedChanges) {
          transformationDetails.push(selectedChanges);
        }
      }

      // Combine everything
      const detailsString = transformationDetails.length > 0 ? `, ${transformationDetails.join(', ')}` : '';
      fullPrompt = `Professional architectural photography of completely renovated kitchen, ${basePrompt}${detailsString}, dramatic before and after transformation, magazine quality, architectural digest, 8k resolution, photorealistic, professional lighting, wide angle`;
      
      // Stronger negative prompt for remodel
      negativePrompt += ', unchanged kitchen, no transformation, same cabinets, old kitchen, minimal changes, subtle changes, small changes';
    }

    // Create form data
    const formData = new FormData();
    formData.append('init_image', new Blob([imageBuffer], { type: 'image/jpeg' }));
    formData.append('init_image_mode', 'IMAGE_STRENGTH');
    formData.append('image_strength', imageStrength.toString());
    formData.append('text_prompts[0][text]', fullPrompt);
    formData.append('text_prompts[0][weight]', '1');
    formData.append('text_prompts[1][text]', negativePrompt);
    formData.append('text_prompts[1][weight]', '-1');
    formData.append('cfg_scale', '9');
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
