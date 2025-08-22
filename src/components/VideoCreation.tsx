import React, { useState, useRef } from 'react';
import { GoogleGenAI } from '@google/genai';
import type { GenerateVideosParameters } from '@google/genai';
import { useApiKeys } from '../contexts/ApiKeyContext';

interface VideoSettings {
  aspectRatio: '16:9' | '9:16' | '1:1';
  durationSeconds: number;
  fps: number;
  generateAudio: boolean;
  resolution: '720p' | '1080p' | '1440p';
  numberOfVideos: number;
  style: 'cinematic' | 'realistic' | 'artistic' | 'cartoon' | 'anime';
  quality: 'standard' | 'high' | 'ultra';
  includeTransitions: boolean;
  autoGenerateScript: boolean;
  scriptLanguage: 'Vietnamese' | 'English' | 'Japanese';
}

interface GeneratedVideo {
  id: string;
  url: string;
  prompt: string;
  settings: VideoSettings;
  status: 'success' | 'error' | 'placeholder' | 'generated';
  imageInput?: string;
}

const VideoCreation: React.FC<{ generatedImages: any[]; script: string }> = ({ generatedImages, script }) => {
  const { getActiveApiKey } = useApiKeys();
  const [prompt, setPrompt] = useState('');
  const [isGenerating, setIsGenerating] = useState(false);
  const [generatedVideos, setGeneratedVideos] = useState<GeneratedVideo[]>([]);
  const [error, setError] = useState('');
  const [selectedImage, setSelectedImage] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [settings, setSettings] = useState<VideoSettings>({
    aspectRatio: '16:9',
    durationSeconds: 8,
    fps: 24,
    generateAudio: true,
    resolution: '720p',
    numberOfVideos: 1,
    style: 'cinematic',
    quality: 'high',
    includeTransitions: true,
    autoGenerateScript: true,
    scriptLanguage: 'Vietnamese'
  });

  const delay = (ms: number): Promise<void> => {
    return new Promise((resolve) => setTimeout(resolve, ms));
  };

  const blobToBase64 = (blob: Blob): Promise<string> => {
    return new Promise((resolve) => {
      const reader = new FileReader();
      reader.onload = () => {
        const url = reader.result as string;
        resolve(url.split(',')[1]);
      };
      reader.readAsDataURL(blob);
    });
  };

  const handleImageUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      try {
        const base64data = await blobToBase64(file);
        setSelectedImage(base64data);
        console.log('Image uploaded successfully');
      } catch (error) {
        console.error('Error uploading image:', error);
        setError('Failed to upload image');
      }
    }
  };

  const handleImageSelect = (imageUrl: string) => {
    // Convert image URL to base64 if it's a data URL
    if (imageUrl.startsWith('data:')) {
      const base64data = imageUrl.split(',')[1];
      setSelectedImage(base64data);
    } else {
      // For placeholder images, we'll use a default
      setSelectedImage(null);
    }
  };

  const createVideo = async () => {
    if (!prompt.trim()) {
      setError('Vui lòng nhập prompt để tạo video');
      return;
    }

    // Auto-generate script if enabled and no script provided
    if (settings.autoGenerateScript && !script.trim() && prompt.trim()) {
      try {
        // Generate language-specific script prompt
        let scriptLanguagePrompt = '';
        switch (settings.scriptLanguage || 'Vietnamese') {
          case 'Vietnamese':
            scriptLanguagePrompt = `Tạo một kịch bản video ngắn (${settings.durationSeconds} giây) cho: ${prompt}. Viết bằng tiếng Việt.`;
            break;
          case 'English':
            scriptLanguagePrompt = `Create a short video script (${settings.durationSeconds} seconds) for: ${prompt}. Write in English.`;
            break;
          case 'Japanese':
            scriptLanguagePrompt = `短いビデオスクリプト（${settings.durationSeconds}秒）を作成してください: ${prompt}. 日本語で書いてください。`;
            break;
          default:
            scriptLanguagePrompt = `Create a short video script (${settings.durationSeconds} seconds) for: ${prompt}`;
        }

        const scriptResponse = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=${getActiveApiKey()}`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            contents: [{
              parts: [{
                text: scriptLanguagePrompt
              }]
            }],
            generationConfig: {
              temperature: 0.7,
              maxOutputTokens: 1024
            }
          })
        });

                  if (scriptResponse.ok) {
            // Script generated successfully
          }
      } catch (error) {
        console.log('Auto-script generation failed, using prompt as script');
        // Using prompt as script
      }
    }

    setIsGenerating(true);
    setError('');

    try {
      const ai = new GoogleGenAI({ apiKey: getActiveApiKey() });

      const config: GenerateVideosParameters = {
        model: 'veo-2.0-generate-001', // Using Veo 2.0 (working with this API key)
        prompt: prompt,
        config: {
          aspectRatio: settings.aspectRatio,
          numberOfVideos: settings.numberOfVideos,
        },
      };

      // Add image input if selected
      if (selectedImage) {
        config.image = {
          imageBytes: selectedImage,
          mimeType: 'image/png',
        };
      }

      console.log('Generating video with Veo 2.0...', config);

      let operation = await ai.models.generateVideos(config);

      // Poll for completion
      while (!operation.done) {
        console.log('Waiting for video generation completion...');
        await delay(2000); // Poll every 2 seconds
        operation = await ai.operations.getVideosOperation({ operation });
      }

      const videos = operation.response?.generatedVideos;
      if (videos === undefined || videos.length === 0) {
        throw new Error('No videos generated');
      }

      // Process generated videos
      const newVideos: GeneratedVideo[] = [];
      
      for (let i = 0; i < videos.length; i++) {
        const video = videos[i];
        const url = decodeURIComponent(video.video?.uri || '');
        
        try {
          const response = await fetch(url);
          const blob = await response.blob();
          const objectURL = URL.createObjectURL(blob);
          
          const newVideo: GeneratedVideo = {
            id: `video-${Date.now()}-${i}`,
            url: objectURL,
            prompt: prompt,
            settings: settings,
            status: 'generated',
            imageInput: selectedImage ? 'data:image/png;base64,' + selectedImage : undefined
          };
          
          newVideos.push(newVideo);
          console.log(`✅ Video ${i + 1} generated successfully!`);
        } catch (downloadError) {
          console.error(`Error downloading video ${i}:`, downloadError);
          // Create placeholder for failed download
          const placeholderVideo: GeneratedVideo = {
            id: `placeholder-${Date.now()}-${i}`,
            url: generatePlaceholderVideo(),
            prompt: prompt,
            settings: settings,
            status: 'placeholder',
            imageInput: selectedImage ? 'data:image/png;base64,' + selectedImage : undefined
          };
          newVideos.push(placeholderVideo);
        }
      }

      setGeneratedVideos([...newVideos, ...generatedVideos]);

    } catch (error: any) {
      console.error('❌ Video generation failed:', error);
      
      let errorMessage = 'Failed to generate video';
      if (error.message.includes('429') || error.message.includes('Quota exceeded')) {
        errorMessage = 'API quota exceeded. Please wait a few minutes or use a different API key.';
      } else if (error.message.includes('billing') || error.message.includes('GCP')) {
        errorMessage = 'Veo 3.0 requires Google Cloud Platform billing. Please enable billing in your GCP account.';
      } else if (error.message.includes('model not found') || error.message.includes('404')) {
        errorMessage = 'Veo 3.0 model not available. Feature may not be released yet.';
      }

      setError(errorMessage);

      // Fallback to placeholder video
      const placeholderVideo: GeneratedVideo = {
        id: `placeholder-${Date.now()}`,
        url: generatePlaceholderVideo(),
        prompt: prompt,
        settings: settings,
        status: 'placeholder',
        imageInput: selectedImage ? 'data:image/png;base64,' + selectedImage : undefined
      };

      setGeneratedVideos([placeholderVideo, ...generatedVideos]);
    } finally {
      setIsGenerating(false);
    }
  };

  const generatePlaceholderVideo = (): string => {
    const canvas = document.createElement('canvas');
    canvas.width = 1280;
    canvas.height = 720;
    const ctx = canvas.getContext('2d')!;

    // Background
    const gradient = ctx.createLinearGradient(0, 0, canvas.width, canvas.height);
    gradient.addColorStop(0, '#667eea');
    gradient.addColorStop(1, '#764ba2');
    ctx.fillStyle = gradient;
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    // Video frame visualization
    ctx.fillStyle = 'rgba(255, 255, 255, 0.1)';
    ctx.fillRect(50, 50, canvas.width - 100, canvas.height - 100);

    // Text
    ctx.fillStyle = 'white';
    ctx.font = 'bold 48px Arial';
    ctx.textAlign = 'center';
         ctx.fillText('🎬 Veo 2.0 Video Generated!', canvas.width / 2, canvas.height / 2 - 80);
    
    ctx.font = '24px Arial';
    ctx.fillText(`Duration: ${settings.durationSeconds}s • FPS: ${settings.fps}`, canvas.width / 2, canvas.height / 2 - 20);
    ctx.fillText(`Resolution: ${settings.resolution} • Aspect: ${settings.aspectRatio}`, canvas.width / 2, canvas.height / 2 + 20);
    ctx.fillText(`Audio: ${settings.generateAudio ? 'Yes' : 'No'} • Videos: ${settings.numberOfVideos}`, canvas.width / 2, canvas.height / 2 + 60);
         ctx.fillText('(Placeholder - Enable GCP billing for real Veo 2.0)', canvas.width / 2, canvas.height / 2 + 100);

    return canvas.toDataURL();
  };

  const downloadVideo = (video: GeneratedVideo) => {
    const link = document.createElement('a');
    link.href = video.url;
    link.download = `veo3-video-${video.id}.mp4`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const updateSettings = (key: keyof VideoSettings, value: any) => {
    setSettings(prev => ({ ...prev, [key]: value }));
  };

  return (
    <div className="video-creation">
      <h2>🎬 Tạo Video với Veo 2.0</h2>
      <p>Tạo video từ prompt và image input với Veo 2.0 Generate</p>

      <div className="form-section">
        <h3>📝 Prompt</h3>
        <textarea
          value={prompt}
          onChange={(e) => setPrompt(e.target.value)}
          placeholder="Nhập prompt để tạo video... Ví dụ: A beautiful sunset over mountains with flowing clouds"
          rows={4}
        />
      </div>

      <div className="form-section">
        <h3>🖼️ Image Input (Optional)</h3>
        <div className="image-input-section">
          <div className="upload-section">
            <input
              ref={fileInputRef}
              type="file"
              accept="image/*"
              onChange={handleImageUpload}
              style={{ display: 'none' }}
            />
            <button 
              onClick={() => fileInputRef.current?.click()}
              className="upload-btn"
            >
              📁 Upload Image
            </button>
            {selectedImage && (
              <button 
                onClick={() => setSelectedImage(null)}
                className="clear-btn"
              >
                ❌ Clear
              </button>
            )}
          </div>
          
          {selectedImage && (
            <div className="selected-image">
              <img 
                src={`data:image/png;base64,${selectedImage}`} 
                alt="Selected" 
                style={{ maxWidth: '200px', maxHeight: '200px' }}
              />
              <p>✅ Image loaded for video generation</p>
            </div>
          )}

          {generatedImages.length > 0 && (
            <div className="generated-images">
              <h4>Generated Images (Click to use):</h4>
              <div className="image-grid">
                {generatedImages.map((image, index) => (
                  <img
                    key={index}
                    src={image.url}
                    alt={`Generated ${index + 1}`}
                    onClick={() => handleImageSelect(image.url)}
                    className="selectable-image"
                  />
                ))}
              </div>
            </div>
          )}
        </div>
      </div>

      <div className="form-section">
        <h3>⚙️ Video Settings</h3>
        <div className="settings-grid">
          <div className="setting-item">
            <label>Aspect Ratio:</label>
            <select 
              value={settings.aspectRatio} 
              onChange={(e) => updateSettings('aspectRatio', e.target.value)}
            >
              <option value="16:9">16:9 (Landscape)</option>
              <option value="9:16">9:16 (Portrait)</option>
              <option value="1:1">1:1 (Square)</option>
            </select>
          </div>

          <div className="setting-item">
            <label>Duration (seconds):</label>
            <input
              type="number"
              min="1"
              max="30"
              value={settings.durationSeconds}
              onChange={(e) => updateSettings('durationSeconds', parseInt(e.target.value))}
            />
          </div>

          <div className="setting-item">
            <label>FPS:</label>
            <select 
              value={settings.fps} 
              onChange={(e) => updateSettings('fps', parseInt(e.target.value))}
            >
              <option value="24">24 FPS</option>
              <option value="30">30 FPS</option>
              <option value="60">60 FPS</option>
            </select>
          </div>

          <div className="setting-item">
            <label>Resolution:</label>
            <select 
              value={settings.resolution} 
              onChange={(e) => updateSettings('resolution', e.target.value)}
            >
              <option value="720p">720p</option>
              <option value="1080p">1080p</option>
              <option value="1440p">1440p</option>
            </select>
          </div>

          <div className="setting-item">
            <label>Generate Audio:</label>
            <input
              type="checkbox"
              checked={settings.generateAudio}
              onChange={(e) => updateSettings('generateAudio', e.target.checked)}
            />
          </div>

          <div className="setting-item">
            <label>Number of Videos:</label>
            <input
              type="number"
              min="1"
              max="4"
              value={settings.numberOfVideos}
              onChange={(e) => updateSettings('numberOfVideos', parseInt(e.target.value))}
            />
          </div>

          <div className="setting-item">
            <label>Style:</label>
            <select
              value={settings.style}
              onChange={(e) => updateSettings('style', e.target.value)}
            >
              <option value="cinematic">Cinematic</option>
              <option value="realistic">Realistic</option>
              <option value="artistic">Artistic</option>
              <option value="cartoon">Cartoon</option>
              <option value="anime">Anime</option>
            </select>
          </div>

          <div className="setting-item">
            <label>Quality:</label>
            <select
              value={settings.quality}
              onChange={(e) => updateSettings('quality', e.target.value)}
            >
              <option value="standard">Standard</option>
              <option value="high">High</option>
              <option value="ultra">Ultra</option>
            </select>
          </div>

          <div className="setting-item">
            <label>Auto Generate Script:</label>
            <input
              type="checkbox"
              checked={settings.autoGenerateScript}
              onChange={(e) => updateSettings('autoGenerateScript', e.target.checked)}
            />
          </div>

          <div className="setting-item">
            <label>Script Language:</label>
            <select
              value={settings.scriptLanguage}
              onChange={(e) => updateSettings('scriptLanguage', e.target.value)}
            >
              <option value="Vietnamese">Vietnamese</option>
              <option value="English">English</option>
              <option value="Japanese">Japanese</option>
            </select>
          </div>
        </div>
      </div>

      <div className="form-section">
        <button 
          onClick={createVideo} 
          disabled={isGenerating || !prompt.trim()}
          className="generate-btn"
        >
          {isGenerating ? '🎬 Đang tạo video...' : '🎬 Generate Video với Veo 2.0'}
        </button>
      </div>

      {error && (
        <div className="error-message">
          <strong>⚠️ Error:</strong> {error}
        </div>
      )}

      {isGenerating && (
        <div className="loading-message">
          <strong>🔄 Generating video...</strong> This may take 1-2 minutes. Please wait...
        </div>
      )}

      <div className="results-section">
        <h3>🎬 Generated Videos</h3>
        {generatedVideos.length === 0 ? (
          <p>Chưa có video nào được tạo</p>
        ) : (
          <div className="video-list">
            {generatedVideos.map((video) => (
              <div key={video.id} className="video-item">
                <div className="video-info">
                  <h4>Video {video.id}</h4>
                  <p><strong>Prompt:</strong> {video.prompt}</p>
                  <p><strong>Status:</strong> 
                                         <span className={`status-${video.status}`}>
                       {video.status === 'generated' ? '✅ Real Veo 2.0' : 
                        video.status === 'placeholder' ? '⚠️ Placeholder (GCP billing required)' : '❌ Error'}
                     </span>
                  </p>
                  <p><strong>Settings:</strong> {video.settings.durationSeconds}s, {video.settings.fps}fps, {video.settings.resolution}</p>
                  {video.imageInput && <p><strong>Image Input:</strong> ✅ Used</p>}
                </div>
                
                <div className="video-controls">
                  <video controls src={video.url} className="video-player">
                    Your browser does not support the video element.
                  </video>
                  <button onClick={() => downloadVideo(video)} className="download-btn">
                    💾 Download Video
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

    </div>
  );
};

export default VideoCreation;

