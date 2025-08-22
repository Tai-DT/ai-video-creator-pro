import React, { useState, useContext } from 'react';
import { GoogleGenAI } from '@google/genai';
import { ApiKeyContext } from '../contexts/ApiKeyContext';

interface GeneratedAudio {
  id: string;
  url: string;
  text: string;
  speakers: string[];
  duration: number;
  status: 'success' | 'error' | 'placeholder' | 'generated';
}

const AudioGeneration: React.FC = () => {
  const { apiKey } = useContext(ApiKeyContext);
  const [script, setScript] = useState('');
  const [speakers, setSpeakers] = useState([
    { name: 'Speaker 1', voice: 'Zephyr' },
    { name: 'Speaker 2', voice: 'Puck' }
  ]);
  const [generatedAudios, setGeneratedAudios] = useState<GeneratedAudio[]>([]);
  const [isGenerating, setIsGenerating] = useState(false);
  const [error, setError] = useState('');

  const availableVoices = [
    'Zephyr', 'Puck', 'Nova', 'Echo', 'Luna', 'Phoenix', 'Orion', 'Aurora'
  ];

  const addSpeaker = () => {
    setSpeakers([...speakers, { name: `Speaker ${speakers.length + 1}`, voice: 'Zephyr' }]);
  };

  const removeSpeaker = (index: number) => {
    if (speakers.length > 1) {
      setSpeakers(speakers.filter((_, i) => i !== index));
    }
  };

  const updateSpeaker = (index: number, field: 'name' | 'voice', value: string) => {
    const newSpeakers = [...speakers];
    newSpeakers[index][field] = value;
    setSpeakers(newSpeakers);
  };

  const generateAudio = async () => {
    if (!script.trim()) {
      setError('Vui lòng nhập script để tạo audio');
      return;
    }

    setIsGenerating(true);
    setError('');

    try {
      const ai = new GoogleGenAI({ apiKey: apiKey });
      
      const config = {
        temperature: 1,
        responseModalities: ['audio'],
        speechConfig: {
          multiSpeakerVoiceConfig: {
            speakerVoiceConfigs: speakers.map(speaker => ({
              speaker: speaker.name,
              voiceConfig: {
                prebuiltVoiceConfig: {
                  voiceName: speaker.voice
                }
              }
            }))
          },
        },
      };

      const model = 'gemini-2.5-pro-preview-tts';
      const contents = [
        {
          role: 'user',
          parts: [{ text: script }]
        }
      ];

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
        }
      }

      if (audioData) {
        const audioUrl = `data:audio/${fileExtension};base64,${audioData}`;
        const newAudio: GeneratedAudio = {
          id: `audio-${Date.now()}`,
          url: audioUrl,
          text: script,
          speakers: speakers.map(s => s.name),
          duration: estimateDuration(script),
          status: 'generated'
        };

        setGeneratedAudios([newAudio, ...generatedAudios]);
      } else {
        throw new Error('No audio data received');
      }

    } catch (error: any) {
      console.error('Audio generation failed:', error);
      
      let errorMessage = 'Failed to generate audio';
      if (error.message.includes('429') || error.message.includes('Quota exceeded')) {
        errorMessage = 'API quota exceeded. Please wait a few minutes or use a different API key.';
      } else if (error.message.includes('billing') || error.message.includes('GCP')) {
        errorMessage = 'TTS requires Google Cloud Platform billing. Please enable billing in your GCP account.';
      } else if (error.message.includes('model not found')) {
        errorMessage = 'TTS model not available. Feature may not be released yet.';
      }

      setError(errorMessage);

      // Fallback to placeholder audio
      const placeholderAudio = generatePlaceholderAudio(script, speakers);
      const newAudio: GeneratedAudio = {
        id: `placeholder-${Date.now()}`,
        url: placeholderAudio,
        text: script,
        speakers: speakers.map(s => s.name),
        duration: estimateDuration(script),
        status: 'placeholder'
      };

      setGeneratedAudios([newAudio, ...generatedAudios]);
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

  const estimateDuration = (text: string): number => {
    // Rough estimate: 150 words per minute
    const words = text.split(' ').length;
    return Math.ceil(words / 2.5); // seconds
  };

  const generatePlaceholderAudio = (text: string, speakers: any[]): string => {
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
    ctx.fillText('Audio Generated Successfully!', canvas.width / 2, 50);
    
    ctx.font = '16px Arial';
    ctx.fillText(`Speakers: ${speakers.map(s => s.name).join(', ')}`, canvas.width / 2, 80);
    ctx.fillText(`Duration: ~${estimateDuration(text)}s`, canvas.width / 2, 110);
    ctx.fillText('(Placeholder - Enable GCP billing for real TTS)', canvas.width / 2, 140);

    return canvas.toDataURL();
  };

  const downloadAudio = (audio: GeneratedAudio) => {
    const link = document.createElement('a');
    link.href = audio.url;
    link.download = `audio-${audio.id}.wav`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div className="audio-generation">
      <h2>🎤 Tạo Audio cho Video</h2>
      <p>Tạo lời narration cho video với nhiều giọng đọc khác nhau</p>

      <div className="form-section">
        <h3>📝 Script</h3>
        <textarea
          value={script}
          onChange={(e) => setScript(e.target.value)}
          placeholder="Nhập script để tạo audio narration... Ví dụ: Speaker 1: Hello! We're excited to show you our native speech capabilities. Speaker 2: Where you can direct a voice, create realistic dialog, and so much more."
          rows={6}
        />
      </div>

      <div className="form-section">
        <h3>👥 Speakers & Voices</h3>
        {speakers.map((speaker, index) => (
          <div key={index} className="speaker-row">
            <input
              type="text"
              value={speaker.name}
              onChange={(e) => updateSpeaker(index, 'name', e.target.value)}
              placeholder="Speaker name"
            />
            <select
              value={speaker.voice}
              onChange={(e) => updateSpeaker(index, 'voice', e.target.value)}
            >
              {availableVoices.map(voice => (
                <option key={voice} value={voice}>{voice}</option>
              ))}
            </select>
            {speakers.length > 1 && (
              <button onClick={() => removeSpeaker(index)} className="remove-btn">
                ❌
              </button>
            )}
          </div>
        ))}
        <button onClick={addSpeaker} className="add-btn">
          ➕ Thêm Speaker
        </button>
      </div>

      <div className="form-section">
        <button 
          onClick={generateAudio} 
          disabled={isGenerating || !script.trim()}
          className="generate-btn"
        >
          {isGenerating ? '🎤 Đang tạo audio...' : '🎤 Tạo Audio'}
        </button>
      </div>

      {error && (
        <div className="error-message">
          <strong>⚠️ Error:</strong> {error}
        </div>
      )}

      <div className="results-section">
        <h3>🎵 Generated Audios</h3>
        {generatedAudios.length === 0 ? (
          <p>Chưa có audio nào được tạo</p>
        ) : (
          <div className="audio-list">
            {generatedAudios.map((audio) => (
              <div key={audio.id} className="audio-item">
                <div className="audio-info">
                  <h4>Audio {audio.id}</h4>
                  <p><strong>Speakers:</strong> {audio.speakers.join(', ')}</p>
                  <p><strong>Duration:</strong> ~{audio.duration}s</p>
                  <p><strong>Status:</strong> 
                    <span className={`status-${audio.status}`}>
                      {audio.status === 'generated' ? '✅ Real AI' : 
                       audio.status === 'placeholder' ? '⚠️ Placeholder' : '❌ Error'}
                    </span>
                  </p>
                  <p><strong>Text:</strong> {audio.text.substring(0, 100)}...</p>
                </div>
                
                <div className="audio-controls">
                  {audio.status !== 'error' && (
                    <>
                      <audio controls src={audio.url} className="audio-player">
                        Your browser does not support the audio element.
                      </audio>
                      <button onClick={() => downloadAudio(audio)} className="download-btn">
                        💾 Download
                      </button>
                    </>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      <style jsx>{`
        .audio-generation {
          padding: 20px;
          max-width: 1200px;
          margin: 0 auto;
        }

        .form-section {
          margin-bottom: 30px;
          background: rgba(255, 255, 255, 0.1);
          padding: 20px;
          border-radius: 10px;
        }

        .form-section h3 {
          margin-top: 0;
          color: #fff;
        }

        textarea {
          width: 100%;
          padding: 15px;
          border: 2px solid rgba(255, 255, 255, 0.3);
          border-radius: 8px;
          background: rgba(255, 255, 255, 0.1);
          color: white;
          font-size: 16px;
          resize: vertical;
        }

        textarea::placeholder {
          color: rgba(255, 255, 255, 0.7);
        }

        .speaker-row {
          display: flex;
          gap: 10px;
          margin-bottom: 10px;
          align-items: center;
        }

        .speaker-row input,
        .speaker-row select {
          padding: 10px;
          border: 2px solid rgba(255, 255, 255, 0.3);
          border-radius: 6px;
          background: rgba(255, 255, 255, 0.1);
          color: white;
          flex: 1;
        }

        .speaker-row select {
          flex: 0 0 150px;
        }

        .remove-btn {
          padding: 8px 12px;
          background: #f44336;
          color: white;
          border: none;
          border-radius: 4px;
          cursor: pointer;
        }

        .add-btn {
          padding: 10px 20px;
          background: #4caf50;
          color: white;
          border: none;
          border-radius: 6px;
          cursor: pointer;
          font-size: 14px;
        }

        .generate-btn {
          padding: 15px 30px;
          background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
          color: white;
          border: none;
          border-radius: 8px;
          font-size: 18px;
          font-weight: bold;
          cursor: pointer;
          transition: transform 0.2s;
        }

        .generate-btn:hover:not(:disabled) {
          transform: translateY(-2px);
        }

        .generate-btn:disabled {
          opacity: 0.6;
          cursor: not-allowed;
        }

        .error-message {
          background: rgba(244, 67, 54, 0.2);
          border: 2px solid #f44336;
          color: #ffcdd2;
          padding: 15px;
          border-radius: 8px;
          margin-bottom: 20px;
        }

        .results-section {
          background: rgba(255, 255, 255, 0.1);
          padding: 20px;
          border-radius: 10px;
        }

        .audio-list {
          display: grid;
          gap: 20px;
        }

        .audio-item {
          background: rgba(255, 255, 255, 0.05);
          padding: 20px;
          border-radius: 8px;
          border: 1px solid rgba(255, 255, 255, 0.2);
        }

        .audio-info h4 {
          margin-top: 0;
          color: #fff;
        }

        .audio-info p {
          margin: 5px 0;
          color: rgba(255, 255, 255, 0.9);
        }

        .status-generated {
          color: #4caf50;
          font-weight: bold;
        }

        .status-placeholder {
          color: #ff9800;
          font-weight: bold;
        }

        .status-error {
          color: #f44336;
          font-weight: bold;
        }

        .audio-controls {
          margin-top: 15px;
          display: flex;
          gap: 10px;
          align-items: center;
          flex-wrap: wrap;
        }

        .audio-player {
          flex: 1;
          min-width: 300px;
        }

        .download-btn {
          padding: 8px 16px;
          background: #2196f3;
          color: white;
          border: none;
          border-radius: 4px;
          cursor: pointer;
        }

        .download-btn:hover {
          background: #1976d2;
        }
      `}</style>
    </div>
  );
};

export default AudioGeneration;
