import React, { useState, useEffect } from 'react';
import { useApiKeys } from '../contexts/ApiKeyContext';
import { GoogleGenAI } from '@google/genai';

interface ImageGenerationProps {
  onImagesGenerated: (images: any[]) => void;
  initialScript?: string;
}

interface GeneratedImage {
  id: string;
  url: string;
  prompt: string;
  description: string;
  status: 'success' | 'error' | 'placeholder' | 'generated';
}

const ImageGeneration: React.FC<ImageGenerationProps> = ({ onImagesGenerated, initialScript }) => {
  const { hasApiKeys, getActiveApiKey } = useApiKeys();
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  const [generatedImages, setGeneratedImages] = useState<GeneratedImage[]>([]);

  const [formData, setFormData] = useState({
    script: '',
    imageCount: '4',
    aspectRatio: '16:9',
    style: 'realistic',
    quality: 'high',
    autoGeneratePrompts: true,
    includeSceneDescriptions: true,
    customPrompts: '',
    promptLanguage: 'English'
  });

  useEffect(() => {
    if (initialScript) {
      setFormData(prev => ({ ...prev, script: initialScript }));
    }
  }, [initialScript]);

  const handleInputChange = (e: React.ChangeEvent<HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const generateImages = async () => {
    if (!hasApiKeys()) {
      setError('Please add at least one API key first.');
      return;
    }

    if (!formData.script.trim() && !formData.customPrompts.trim()) {
      setError('Please enter a script or custom prompts for image generation.');
      return;
    }

    setIsLoading(true);
    setError('');
    setGeneratedImages([]);

    try {
      const apiKey = getActiveApiKey();
      const imageCount = parseInt(formData.imageCount);

      let prompts: string[] = [];

      // Use custom prompts if provided, otherwise generate from script
      if (formData.customPrompts.trim()) {
        prompts = formData.customPrompts.split('\n').filter(p => p.trim()).slice(0, imageCount);
      } else if (formData.autoGeneratePrompts && formData.script.trim()) {
        // Generate language-specific prompt for image generation
        let imagePromptLanguage = '';
        switch (formData.promptLanguage) {
          case 'Vietnamese':
            imagePromptLanguage = 'Viết prompts bằng tiếng Việt, sau đó dịch sang tiếng Anh cho AI image generation. Format: PROMPT 1: [Vietnamese description] - [English translation]';
            break;
          case 'English':
            imagePromptLanguage = 'Write prompts in English for AI image generation.';
            break;
          case 'Japanese':
            imagePromptLanguage = 'Write prompts in Japanese, then translate to English for AI image generation. Format: PROMPT 1: [Japanese description] - [English translation]';
            break;
          default:
            imagePromptLanguage = 'Write prompts in English for AI image generation.';
        }

        // Generate prompts from script
        const promptGenerationResponse = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=${apiKey}`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            contents: [{
              parts: [{
                text: `
Analyze this script and create ${imageCount} detailed image prompts for video scenes:

${formData.script}

Requirements:
- Create ${imageCount} distinct scenes
- Each prompt should be detailed and descriptive
- Include visual elements, lighting, composition
- Style: ${formData.style}
- Aspect ratio: ${formData.aspectRatio}
- ${imagePromptLanguage}
- Make each prompt unique and engaging

Format as:
PROMPT 1: [Detailed description]
PROMPT 2: [Detailed description]
...
                `
              }]
            }],
            generationConfig: {
              temperature: 0.7,
              topK: 40,
              topP: 0.95,
              maxOutputTokens: 4096
            }
        })
      });

      if (!promptGenerationResponse.ok) {
        throw new Error(`Prompt generation failed: ${promptGenerationResponse.status}`);
      }

      const promptData = await promptGenerationResponse.json();
      const promptText = promptData.candidates[0].content.parts[0].text;
      
      // Extract prompts from the response
      prompts = extractPromptsFromText(promptText, imageCount);
    } else {
      // Use simple prompts from script
      prompts = [`Scene 1: ${formData.script.substring(0, 200)}...`];
      for (let i = 1; i < imageCount; i++) {
        prompts.push(`Scene ${i + 1}: ${formData.script.substring(200 * i, 200 * (i + 1))}...`);
      }
    }

      // Try to generate real images using Gemini 2.0 Flash Preview Image Generation
      const images: GeneratedImage[] = [];
      
      for (let i = 0; i < prompts.length; i++) {
        const prompt = prompts[i];
        try {
          // Initialize Google GenAI
          const ai = new GoogleGenAI({
            apiKey: apiKey,
          });
          
          const config = {
            responseModalities: [
              'IMAGE',
              'TEXT',
            ],
          };
          
          const model = 'gemini-2.0-flash-preview-image-generation';
          const contents = [
            {
              role: 'user',
              parts: [
                {
                  text: prompt,
                },
              ],
            },
          ];

          console.log(`Generating image ${i + 1} with prompt: ${prompt}`);
          
          const response = await ai.models.generateContentStream({
            model,
            config,
            contents,
          });

          let imageGenerated = false;
          for await (const chunk of response) {
            if (!chunk.candidates || !chunk.candidates[0].content || !chunk.candidates[0].content.parts) {
              continue;
            }
            
            if (chunk.candidates?.[0]?.content?.parts?.[0]?.inlineData) {
              const inlineData = chunk.candidates[0].content.parts[0].inlineData;
              const mimeType = inlineData.mimeType || 'image/png';
              const imageData = inlineData.data || '';
              
              images.push({
                id: `img-${Date.now()}-${i}`,
                url: `data:${mimeType};base64,${imageData}`,
                prompt: prompt,
                description: `Scene ${i + 1}`,
                status: 'generated' as const
              });
              
              imageGenerated = true;
              console.log(`Successfully generated image ${i + 1}`);
              break;
            }
          }
          
          if (!imageGenerated) {
            throw new Error('No image data received from API');
          }
          
        } catch (error) {
          console.log(`Gemini 2.0 Flash Preview Image Generation failed for image ${i + 1}:`, error);
          
          // Fallback to placeholder
          images.push({
            id: `img-${Date.now()}-${i}`,
            url: generatePlaceholderImage(800, 600, `Scene ${i + 1}`, prompt),
            prompt: prompt,
            description: `Scene ${i + 1}`,
            status: 'placeholder' as const
          });
        }
      }

      setGeneratedImages(images);
      onImagesGenerated(images);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to generate images');
    } finally {
      setIsLoading(false);
    }
  };

  const extractPromptsFromText = (text: string, count: number): string[] => {
    const lines = text.split('\n');
    const prompts: string[] = [];
    
    for (const line of lines) {
      if (line.includes('PROMPT') && line.includes(':')) {
        const prompt = line.split(':').slice(1).join(':').trim();
        if (prompt && prompts.length < count) {
          prompts.push(prompt);
        }
      }
    }
    
    // If we don't have enough prompts, create some from the original script
    while (prompts.length < count) {
      prompts.push(`Scene ${prompts.length + 1}: ${formData.script.substring(0, 200)}...`);
    }
    
    return prompts.slice(0, count);
  };

  const generatePlaceholderImage = (width: number, height: number, title: string, description: string): string => {
    const canvas = document.createElement('canvas');
    canvas.width = width;
    canvas.height = height;
    const ctx = canvas.getContext('2d');
    
    if (!ctx) return '';

    // Create gradient background
    const gradient = ctx.createLinearGradient(0, 0, width, height);
    gradient.addColorStop(0, '#667eea');
    gradient.addColorStop(0.5, '#764ba2');
    gradient.addColorStop(1, '#f093fb');
    ctx.fillStyle = gradient;
    ctx.fillRect(0, 0, width, height);

    // Add some decorative elements
    ctx.fillStyle = 'rgba(255, 255, 255, 0.1)';
    for (let i = 0; i < 15; i++) {
      const x = Math.random() * width;
      const y = Math.random() * height;
      const radius = Math.random() * 40 + 10;
      ctx.beginPath();
      ctx.arc(x, y, radius, 0, Math.PI * 2);
      ctx.fill();
    }

    // Add title
    ctx.fillStyle = 'white';
    ctx.font = 'bold 32px Arial';
    ctx.textAlign = 'center';
    ctx.fillText(title, width / 2, height / 2 - 40);

    // Add description (truncated)
    ctx.font = '16px Arial';
    const maxWidth = width - 60;
    const words = description.split(' ');
    let line = '';
    let y = height / 2 + 10;
    
    for (let i = 0; i < words.length && y < height - 60; i++) {
      const testLine = line + words[i] + ' ';
      const metrics = ctx.measureText(testLine);
      
      if (metrics.width > maxWidth && line !== '') {
        ctx.fillText(line, width / 2, y);
        line = words[i] + ' ';
        y += 25;
      } else {
        line = testLine;
      }
    }
    
    if (line !== '' && y < height - 40) {
      ctx.fillText(line, width / 2, y);
    }

    // Add style info
    ctx.fillStyle = 'rgba(255, 255, 255, 0.8)';
    ctx.font = '14px Arial';
    ctx.textAlign = 'center';
    ctx.fillText(`${formData.style} style • ${formData.aspectRatio} • ${formData.quality} quality`, width / 2, height - 20);

    return canvas.toDataURL();
  };

  const downloadImage = (imageUrl: string, filename: string) => {
    const link = document.createElement('a');
    link.href = imageUrl;
    link.download = filename;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div className="image-generation">
      <h2>🎨 Generate Images</h2>
      <p className="mb-3">Create images from your script analysis for video production.</p>

      {error && <div className="alert alert-error">{error}</div>}

      <div className="form-group">
        <label htmlFor="script">Script or Scene Description</label>
        <textarea
          id="script"
          name="script"
          className="form-control"
          placeholder="Paste your script analysis or describe the scenes you want to generate..."
          value={formData.script}
          onChange={handleInputChange}
          rows={6}
        />
      </div>

      <div className="grid grid-3">
        <div className="form-group">
          <label htmlFor="imageCount">Number of Images</label>
          <select
            id="imageCount"
            name="imageCount"
            className="form-control"
            value={formData.imageCount}
            onChange={handleInputChange}
          >
            <option value="1">1 image</option>
            <option value="2">2 images</option>
            <option value="3">3 images</option>
            <option value="4">4 images</option>
            <option value="6">6 images</option>
            <option value="8">8 images</option>
          </select>
        </div>

        <div className="form-group">
          <label htmlFor="aspectRatio">Aspect Ratio</label>
          <select
            id="aspectRatio"
            name="aspectRatio"
            className="form-control"
            value={formData.aspectRatio}
            onChange={handleInputChange}
          >
            <option value="16:9">16:9 (Landscape)</option>
            <option value="9:16">9:16 (Portrait)</option>
            <option value="1:1">1:1 (Square)</option>
            <option value="4:3">4:3 (Classic)</option>
          </select>
        </div>

        <div className="form-group">
          <label htmlFor="style">Style</label>
          <select
            id="style"
            name="style"
            className="form-control"
            value={formData.style}
            onChange={handleInputChange}
          >
            <option value="realistic">Realistic</option>
            <option value="cinematic">Cinematic</option>
            <option value="artistic">Artistic</option>
            <option value="cartoon">Cartoon</option>
            <option value="anime">Anime</option>
            <option value="photographic">Photographic</option>
            <option value="painting">Painting</option>
            <option value="digital-art">Digital Art</option>
            <option value="3d-render">3D Render</option>
            <option value="vintage">Vintage</option>
            <option value="modern">Modern</option>
          </select>
        </div>

        <div className="form-group">
          <label htmlFor="quality">Quality</label>
          <select
            id="quality"
            name="quality"
            className="form-control"
            value={formData.quality}
            onChange={handleInputChange}
          >
            <option value="standard">Standard</option>
            <option value="high">High</option>
            <option value="ultra">Ultra</option>
          </select>
        </div>

        <div className="form-group">
          <label htmlFor="autoGeneratePrompts">Auto Generate Prompts</label>
          <select
            id="autoGeneratePrompts"
            name="autoGeneratePrompts"
            className="form-control"
            value={formData.autoGeneratePrompts.toString()}
            onChange={(e) => setFormData(prev => ({ ...prev, autoGeneratePrompts: e.target.value === 'true' }))}
          >
            <option value="true">Yes</option>
            <option value="false">No</option>
          </select>
        </div>

        <div className="form-group">
          <label htmlFor="customPrompts">Custom Prompts (Optional)</label>
          <textarea
            id="customPrompts"
            name="customPrompts"
            className="form-control"
            placeholder="Enter custom image prompts, one per line..."
            value={formData.customPrompts}
            onChange={handleInputChange}
            rows={4}
          />
          <small className="form-help">
            Leave empty to auto-generate from script, or enter custom prompts (one per line)
          </small>
        </div>

        <div className="form-group">
          <label htmlFor="promptLanguage">Prompt Language</label>
          <select
            id="promptLanguage"
            name="promptLanguage"
            className="form-control"
            value={formData.promptLanguage}
            onChange={handleInputChange}
          >
            <option value="English">English</option>
            <option value="Vietnamese">Vietnamese</option>
            <option value="Japanese">Japanese</option>
          </select>
          <small className="form-help">
            Language for generating image prompts (will be translated to English for AI)
          </small>
        </div>
      </div>

      <div className="form-group">
        <button
          className="btn"
          onClick={generateImages}
          disabled={isLoading || (!formData.script.trim() && !formData.customPrompts.trim())}
        >
          {isLoading ? (
            <>
              <div className="spinner"></div>
              Generating Images...
            </>
          ) : (
            '🎨 Generate Images'
          )}
        </button>
      </div>

      {generatedImages.length > 0 && (
        <div className="generated-images">
          <div className="images-header">
            <h3>Generated Images ({generatedImages.length})</h3>
            <p className="text-sm text-gray-600">
              These are AI-generated placeholder images. For real AI image generation, 
              you would need to integrate with services like DALL-E, Midjourney, or Stable Diffusion.
            </p>
          </div>
          <div className="image-grid">
            {generatedImages.map((image) => (
              <div key={image.id} className="image-item">
                <img src={image.url} alt={image.description} />
                <div className="image-caption">
                  <h4>{image.description}</h4>
                  <p className="image-status">
                    {image.status === 'success' && '✅ Generated'}
                    {image.status === 'error' && '❌ Error'}
                    {image.status === 'placeholder' && '🎨 Placeholder'}
                  </p>
                  <details className="image-details">
                    <summary>View Prompt</summary>
                    <pre className="image-prompt">{image.prompt}</pre>
                  </details>
                  <button
                    className="btn btn-secondary"
                    onClick={() => downloadImage(image.url, `${image.description}.png`)}
                  >
                    📥 Download
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}


    </div>
  );
};

export default ImageGeneration;

