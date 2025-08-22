import React, { useState } from 'react';
import { GoogleGenAI } from '@google/genai';

const ImageTest: React.FC = () => {
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  const [generatedImage, setGeneratedImage] = useState<string>('');
  const [prompt, setPrompt] = useState('A beautiful Vietnamese pho bowl with fresh herbs and noodles');

  const generateImage = async () => {
    if (!prompt.trim()) {
      setError('Please enter a prompt for image generation.');
      return;
    }

    setIsLoading(true);
    setError('');
    setGeneratedImage('');

    try {
      const apiKey = 'AIzaSyBtqd6YdMExpAWlkBUyPYlOeGXRBSx6ko0';
      
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

      console.log(`Generating image with prompt: ${prompt}`);
      
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
          
          setGeneratedImage(`data:${mimeType};base64,${imageData}`);
          imageGenerated = true;
          console.log('Successfully generated image');
          break;
        }
      }
      
      if (!imageGenerated) {
        throw new Error('No image data received from API');
      }
      
    } catch (error) {
      console.error('Image generation failed:', error);
      
      let errorMessage = 'Failed to generate image';
      if (error instanceof Error) {
        if (error.message.includes('429') || error.message.includes('Quota exceeded')) {
          errorMessage = 'API quota exceeded. Please wait a few minutes or use a different API key.';
        } else {
          errorMessage = error.message;
        }
      }
      
      setError(errorMessage);
    } finally {
      setIsLoading(false);
    }
  };

  const downloadImage = () => {
    if (generatedImage) {
      const link = document.createElement('a');
      link.href = generatedImage;
      link.download = `generated-image-${Date.now()}.png`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
    }
  };

  return (
    <div className="image-test" style={{ padding: '2rem', maxWidth: '800px', margin: '0 auto' }}>
      <h2>🧪 Test Image Generation với Google GenAI</h2>
      <p>Test tính năng tạo ảnh sử dụng Gemini 2.0 Flash Preview Image Generation</p>

      {error && (
        <div className="alert alert-error" style={{ 
          backgroundColor: '#fee', 
          color: '#c33', 
          padding: '1rem', 
          borderRadius: '4px', 
          marginBottom: '1rem' 
        }}>
          {error}
        </div>
      )}

      <div className="form-group" style={{ marginBottom: '1rem' }}>
        <label htmlFor="prompt" style={{ display: 'block', marginBottom: '0.5rem', fontWeight: 'bold' }}>
          Image Prompt:
        </label>
        <textarea
          id="prompt"
          value={prompt}
          onChange={(e) => setPrompt(e.target.value)}
          style={{
            width: '100%',
            padding: '0.75rem',
            border: '1px solid #ddd',
            borderRadius: '4px',
            fontSize: '1rem',
            minHeight: '100px'
          }}
          placeholder="Enter a detailed description of the image you want to generate..."
        />
      </div>

      <button
        onClick={generateImage}
        disabled={isLoading}
        style={{
          backgroundColor: '#4facfe',
          color: 'white',
          border: 'none',
          padding: '0.75rem 1.5rem',
          borderRadius: '4px',
          fontSize: '1rem',
          cursor: isLoading ? 'not-allowed' : 'pointer',
          opacity: isLoading ? 0.7 : 1,
          marginBottom: '1rem'
        }}
      >
        {isLoading ? '🔄 Generating...' : '🎨 Generate Image'}
      </button>

      {isLoading && (
        <div style={{ textAlign: 'center', margin: '1rem 0' }}>
          <div style={{
            display: 'inline-block',
            width: '40px',
            height: '40px',
            border: '4px solid #f3f3f3',
            borderTop: '4px solid #4facfe',
            borderRadius: '50%',
            animation: 'spin 1s linear infinite'
          }}></div>
          <p>Đang tạo ảnh với AI...</p>
        </div>
      )}

      {generatedImage && (
        <div className="generated-image" style={{ marginTop: '2rem' }}>
          <h3>✅ Generated Image:</h3>
          <div style={{ 
            border: '2px solid #ddd', 
            borderRadius: '8px', 
            padding: '1rem',
            textAlign: 'center'
          }}>
            <img
              src={generatedImage}
              alt="Generated"
              style={{
                maxWidth: '100%',
                maxHeight: '400px',
                borderRadius: '4px'
              }}
            />
            <div style={{ marginTop: '1rem' }}>
              <button
                onClick={downloadImage}
                style={{
                  backgroundColor: '#28a745',
                  color: 'white',
                  border: 'none',
                  padding: '0.5rem 1rem',
                  borderRadius: '4px',
                  cursor: 'pointer'
                }}
              >
                📥 Download Image
              </button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
};

export default ImageTest;
