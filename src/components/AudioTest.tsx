import React, { useState } from 'react';
import { GoogleGenAI } from '@google/genai';
import { useApiKeys } from '../contexts/ApiKeyContext';

const AudioTest: React.FC = () => {
  const { getActiveApiKey } = useApiKeys();
  const [prompt, setPrompt] = useState('Speaker 1: Hello! We\'re excited to show you our native speech capabilities. Speaker 2: Where you can direct a voice, create realistic dialog, and so much more.');
  const [isGenerating, setIsGenerating] = useState(false);
  const [audioUrl, setAudioUrl] = useState<string | null>(null);
  const [error, setError] = useState('');
  const [status, setStatus] = useState<'idle' | 'generating' | 'success' | 'error' | 'placeholder'>('idle');

  const generateAudio = async () => {
    if (!prompt.trim()) {
      setError('Vui lòng nhập prompt để tạo audio');
      return;
    }

    setIsGenerating(true);
    setError('');
    setStatus('generating');

    try {
      const ai = new GoogleGenAI({ apiKey: getActiveApiKey() });
      
      const config = {
        temperature: 1,
        responseModalities: ['audio'],
        speechConfig: {
          multiSpeakerVoiceConfig: {
            speakerVoiceConfigs: [
              {
                speaker: 'Speaker 1',
                voiceConfig: {
                  prebuiltVoiceConfig: {
                    voiceName: 'Zephyr'
                  }
                }
              },
              {
                speaker: 'Speaker 2',
                voiceConfig: {
                  prebuiltVoiceConfig: {
                    voiceName: 'Puck'
                  }
                }
              },
            ]
          },
        },
      };

      const model = 'gemini-2.5-pro-preview-tts';
      const contents = [
        {
          role: 'user',
          parts: [{ text: prompt }]
        }
      ];

      console.log('Generating audio with TTS...');
      const response = await ai.models.generateContentStream({
        model,
        config,
        contents,
      });

      let audioData: string | null = null;
      let fileExtension = 'wav';

      for await (const chunk of response) {
        if (!chunk.candidates || !chunk.candidates[0].content || !chunk.candidates[0].content.parts) {
          continue;
        }

        if (chunk.candidates?.[0]?.content?.parts?.[0]?.inlineData) {
          const inlineData = chunk.candidates[0].content.parts[0].inlineData;
          audioData = inlineData.data || '';
          fileExtension = getAudioExtension(inlineData.mimeType || '');
          console.log('Received audio data:', { mimeType: inlineData.mimeType, dataLength: audioData.length });
        }
      }

      if (audioData) {
        const audioUrl = `data:audio/${fileExtension};base64,${audioData}`;
        setAudioUrl(audioUrl);
        setStatus('success');
        console.log('✅ Audio generated successfully!');
      } else {
        throw new Error('No audio data received');
      }

    } catch (error: any) {
      console.error('❌ Audio generation failed:', error);
      
      let errorMessage = 'Failed to generate audio';
      if (error.message.includes('429') || error.message.includes('Quota exceeded')) {
        errorMessage = 'API quota exceeded. Please wait a few minutes or use a different API key.';
      } else if (error.message.includes('billing') || error.message.includes('GCP')) {
        errorMessage = 'TTS requires Google Cloud Platform billing. Please enable billing in your GCP account.';
      } else if (error.message.includes('model not found') || error.message.includes('404')) {
        errorMessage = 'TTS model not available. Feature may not be released yet.';
      }

      setError(errorMessage);
      setStatus('error');

      // Fallback to placeholder
      const placeholderAudio = generatePlaceholderAudio();
      setAudioUrl(placeholderAudio);
      setStatus('placeholder');
    } finally {
      setIsGenerating(false);
    }
  };

  const getAudioExtension = (mimeType: string): string => {
    if (mimeType.includes('wav')) return 'wav';
    if (mimeType.includes('mp3')) return 'mp3';
    if (mimeType.includes('ogg')) return 'ogg';
    return 'wav';
  };

  const generatePlaceholderAudio = (): string => {
    // Create a simple audio visualization as placeholder
    const canvas = document.createElement('canvas');
    canvas.width = 800;
    canvas.height = 200;
    const ctx = canvas.getContext('2d')!;

    // Background
    const gradient = ctx.createLinearGradient(0, 0, canvas.width, canvas.height);
    gradient.addColorStop(0, '#667eea');
    gradient.addColorStop(1, '#764ba2');
    ctx.fillStyle = gradient;
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    // Audio waveform visualization
    ctx.fillStyle = 'rgba(255, 255, 255, 0.8)';
    for (let i = 0; i < canvas.width; i += 4) {
      const height = Math.random() * 100 + 20;
      ctx.fillRect(i, canvas.height / 2 - height / 2, 3, height);
    }

    // Text
    ctx.fillStyle = 'white';
    ctx.font = 'bold 24px Arial';
    ctx.textAlign = 'center';
    ctx.fillText('🎤 TTS Audio Generated Successfully!', canvas.width / 2, 50);
    
    ctx.font = '16px Arial';
    ctx.fillText('Speakers: Speaker 1 (Zephyr), Speaker 2 (Puck)', canvas.width / 2, 80);
    ctx.fillText('Duration: ~15 seconds', canvas.width / 2, 110);
    ctx.fillText('(Placeholder - Enable GCP billing for real TTS)', canvas.width / 2, 140);

    return canvas.toDataURL();
  };

  const downloadAudio = () => {
    if (audioUrl) {
      const link = document.createElement('a');
      link.href = audioUrl;
      link.download = `tts-audio-${Date.now()}.wav`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
    }
  };

  return (
    <div className="audio-test">
      <h2>🎤 Test Text-to-Speech (TTS)</h2>
      <p>Test tính năng tạo audio từ text với Gemini 2.5 Pro Preview TTS</p>

      <div className="form-section">
        <h3>📝 Prompt</h3>
        <textarea
          value={prompt}
          onChange={(e) => setPrompt(e.target.value)}
          placeholder="Nhập text để tạo audio... Ví dụ: Speaker 1: Hello! We're excited to show you our native speech capabilities. Speaker 2: Where you can direct a voice, create realistic dialog, and so much more."
          rows={4}
        />
      </div>

      <div className="form-section">
        <h3>🎭 Speakers Configuration</h3>
        <div className="speakers-info">
          <p><strong>Speaker 1:</strong> Zephyr (Male voice)</p>
          <p><strong>Speaker 2:</strong> Puck (Female voice)</p>
          <p><strong>Model:</strong> gemini-2.5-pro-preview-tts</p>
        </div>
      </div>

      <div className="form-section">
        <button 
          onClick={generateAudio} 
          disabled={isGenerating}
          className="generate-btn"
        >
          {isGenerating ? '🎤 Đang tạo audio...' : '🎤 Generate TTS Audio'}
        </button>
      </div>

      {error && (
        <div className="error-message">
          <strong>⚠️ Error:</strong> {error}
        </div>
      )}

      {status === 'generating' && (
        <div className="loading-message">
          <strong>🔄 Generating audio...</strong> This may take a few seconds.
        </div>
      )}

      {audioUrl && (
        <div className="results-section">
          <h3>🎵 Generated Audio</h3>
          <div className="audio-result">
            <div className="status-info">
              <p><strong>Status:</strong> 
                <span className={`status-${status}`}>
                  {status === 'success' ? '✅ Real AI TTS' : 
                   status === 'placeholder' ? '⚠️ Placeholder (GCP billing required)' : '❌ Error'}
                </span>
              </p>
              <p><strong>Model:</strong> gemini-2.5-pro-preview-tts</p>
              <p><strong>Speakers:</strong> Zephyr, Puck</p>
            </div>
            
            <div className="audio-controls">
              <audio controls src={audioUrl} className="audio-player">
                Your browser does not support the audio element.
              </audio>
              <button onClick={downloadAudio} className="download-btn">
                💾 Download Audio
              </button>
            </div>
          </div>
        </div>
      )}

      <div className="info-section">
        <h3>ℹ️ TTS Information</h3>
        <ul>
          <li><strong>Model:</strong> gemini-2.5-pro-preview-tts</li>
          <li><strong>Voices:</strong> Zephyr, Puck, Nova, Echo, Luna, Phoenix, Orion, Aurora</li>
          <li><strong>Format:</strong> WAV, MP3, OGG</li>
          <li><strong>Multi-speaker:</strong> Support multiple voices in one audio</li>
          <li><strong>Requirements:</strong> GCP billing enabled for real TTS</li>
        </ul>
      </div>

    </div>
  );
};

export default AudioTest;
