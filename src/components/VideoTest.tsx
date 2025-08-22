import React, { useState } from 'react';
import { GoogleGenAI } from '@google/genai';

const VideoTest: React.FC = () => {
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  const [generatedVideo, setGeneratedVideo] = useState<string>('');
  const [progress, setProgress] = useState(0);
  const [prompt, setPrompt] = useState('A beautiful Vietnamese pho bowl being prepared with fresh herbs and noodles, professional cooking video');
  const [duration, setDuration] = useState(8);

  const generateVideo = async () => {
    if (!prompt.trim()) {
      setError('Please enter a prompt for video generation.');
      return;
    }

    setIsLoading(true);
    setError('');
    setGeneratedVideo('');
    setProgress(0);

    try {
      const apiKey = 'AIzaSyBtqd6YdMExpAWlkBUyPYlOeGXRBSx6ko0';
      
      console.log('🎬 Starting Veo 2.0 video generation...');
      console.log(`📝 Prompt: ${prompt}`);
      console.log(`⏱️ Duration: ${duration} seconds`);

      // Initialize Google GenAI
      const ai = new GoogleGenAI({
        apiKey: apiKey,
      });

      let operation = await ai.models.generateVideos({
        model: 'veo-3.0-generate-preview', // Updated to Veo 3.0
        prompt: prompt,
        config: {
          numberOfVideos: 1,
          aspectRatio: '16:9',
        },
      });

      console.log(`🔄 Video generation started: ${operation.name}`);
      setProgress(10);

      // Poll for completion
      while (!operation.done) {
        const progressPercent = Math.min(90, 10 + (Date.now() % 80000) / 1000); // Simulate progress
        setProgress(progressPercent);
        
        console.log(`⏳ Video ${operation.name} is being generated... Check again in 10 seconds...`);
        await new Promise((resolve) => setTimeout(resolve, 10000));
        
        operation = await ai.operations.getVideosOperation({
          operation: operation,
        });
      }

      console.log(`✅ Generated ${operation.response?.generatedVideos?.length ?? 0} video(s).`);

      if (operation.response?.generatedVideos && operation.response.generatedVideos.length > 0) {
        const generatedVideoData = operation.response.generatedVideos[0];
        console.log(`🎥 Video generated: ${generatedVideoData?.video?.uri}`);
        
        // Download the video
        const response = await fetch(`${generatedVideoData?.video?.uri}&key=${apiKey}`);
        const buffer = await response.arrayBuffer();
        const videoBlob = new Blob([buffer], { type: 'video/mp4' });
        const videoUrl = URL.createObjectURL(videoBlob);
        
        setGeneratedVideo(videoUrl);
        setProgress(100);
        console.log('✅ Video downloaded and ready for display');
      } else {
        throw new Error('No video data received from API');
      }
      
    } catch (error) {
      console.error('Video generation failed:', error);
      
      let errorMessage = 'Failed to generate video';
      if (error instanceof Error) {
        if (error.message.includes('429') || error.message.includes('Quota exceeded')) {
          errorMessage = 'API quota exceeded. Please wait a few minutes or use a different API key.';
              } else if (error.message.includes('billing') || error.message.includes('GCP')) {
        errorMessage = 'Veo 3.0 requires Google Cloud Platform billing. Please enable billing in your GCP account.';
        } else if (error.message.includes('not found') || error.message.includes('404')) {
          errorMessage = 'Veo 3.0 model not available. This feature may not be released yet.';
        } else {
          errorMessage = error.message;
        }
      }
      
      setError(errorMessage);
    } finally {
      setIsLoading(false);
    }
  };

  const downloadVideo = () => {
    if (generatedVideo) {
      const link = document.createElement('a');
      link.href = generatedVideo;
      link.download = `generated-video-${Date.now()}.mp4`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
    }
  };

  return (
    <div className="video-test" style={{ padding: '2rem', maxWidth: '800px', margin: '0 auto' }}>
      <h2>🎬 Test Video Generation với Veo 3.0</h2>
      <p>Test tính năng tạo video sử dụng Google Veo 3.0 AI</p>

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
          Video Prompt:
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
          placeholder="Enter a detailed description of the video you want to generate..."
        />
      </div>

      <div className="form-group" style={{ marginBottom: '1rem' }}>
        <label htmlFor="duration" style={{ display: 'block', marginBottom: '0.5rem', fontWeight: 'bold' }}>
          Duration (seconds):
        </label>
        <select
          id="duration"
          value={duration}
          onChange={(e) => setDuration(Number(e.target.value))}
          style={{
            width: '100%',
            padding: '0.75rem',
            border: '1px solid #ddd',
            borderRadius: '4px',
            fontSize: '1rem'
          }}
        >
          <option value={4}>4 seconds</option>
          <option value={6}>6 seconds</option>
          <option value={8}>8 seconds</option>
          <option value={10}>10 seconds</option>
          <option value={12}>12 seconds</option>
        </select>
      </div>

      <button
        onClick={generateVideo}
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
        {isLoading ? '🎬 Generating Video...' : '🎬 Generate Video'}
      </button>

      {isLoading && (
        <div style={{ margin: '1rem 0' }}>
          <div style={{ 
            width: '100%', 
            backgroundColor: '#f0f0f0', 
            borderRadius: '4px', 
            overflow: 'hidden',
            marginBottom: '0.5rem'
          }}>
            <div style={{
              width: `${progress}%`,
              height: '20px',
              backgroundColor: '#4facfe',
              transition: 'width 0.3s ease'
            }}></div>
          </div>
          <p style={{ textAlign: 'center', margin: '0' }}>
            {progress < 100 ? `Generating video... ${Math.round(progress)}%` : 'Finalizing video...'}
          </p>
        </div>
      )}

      {generatedVideo && (
        <div className="generated-video" style={{ marginTop: '2rem' }}>
          <h3>✅ Generated Video:</h3>
          <div style={{ 
            border: '2px solid #ddd', 
            borderRadius: '8px', 
            padding: '1rem',
            textAlign: 'center'
          }}>
            <video
              controls
              style={{
                maxWidth: '100%',
                maxHeight: '400px',
                borderRadius: '4px'
              }}
            >
              <source src={generatedVideo} type="video/mp4" />
              Your browser does not support the video tag.
            </video>
            <div style={{ marginTop: '1rem' }}>
              <button
                onClick={downloadVideo}
                style={{
                  backgroundColor: '#28a745',
                  color: 'white',
                  border: 'none',
                  padding: '0.5rem 1rem',
                  borderRadius: '4px',
                  cursor: 'pointer'
                }}
              >
                📥 Download Video
              </button>
            </div>
          </div>
        </div>
      )}

      <div style={{ 
        marginTop: '2rem', 
        padding: '1rem', 
        backgroundColor: '#f8f9fa', 
        borderRadius: '4px',
        fontSize: '0.9rem'
      }}>
        <h4>ℹ️ About Veo 2.0:</h4>
        <ul style={{ margin: '0.5rem 0', paddingLeft: '1.5rem' }}>
          <li>State-of-the-art video generation AI</li>
          <li>Supports various aspect ratios and durations</li>
          <li>High-quality video output</li>
          <li>May require quota or access permissions</li>
        </ul>
      </div>
    </div>
  );
};

export default VideoTest;
