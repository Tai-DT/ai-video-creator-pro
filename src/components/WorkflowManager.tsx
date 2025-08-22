import React, { useState } from 'react';
import { useApiKeys } from '../contexts/ApiKeyContext';

interface WorkflowStep {
  id: string;
  name: string;
  status: 'pending' | 'in-progress' | 'completed' | 'error';
  data?: any;
  error?: string;
}

interface WorkflowManagerProps {
  onWorkflowComplete: (workflowData: any) => void;
}

const WorkflowManager: React.FC<WorkflowManagerProps> = ({ onWorkflowComplete }) => {
  const { hasApiKeys, getActiveApiKey } = useApiKeys();
  const [isRunning, setIsRunning] = useState(false);
  const [currentStep, setCurrentStep] = useState(0);
  const [workflowData, setWorkflowData] = useState<any>({});
  const [error, setError] = useState('');

  const [workflowConfig, setWorkflowConfig] = useState({
    topic: '',
    genre: 'educational',
    duration: '5',
    tone: 'friendly',
    audience: 'general',
    language: 'Vietnamese',
    template: 'standard',
    includeVisualNotes: true,
    includeTiming: true,
    imageCount: '4',
    imageStyle: 'realistic',
    videoStyle: 'cinematic',
    autoGenerateScript: true,
    autoGenerateImages: true,
    autoGenerateVideo: true,
    scriptLanguage: 'Vietnamese',
    analysisLanguage: 'Vietnamese',
    promptLanguage: 'English'
  });

  const workflowSteps: WorkflowStep[] = [
    { id: 'script', name: '📝 Tạo Kịch Bản', status: 'pending' },
    { id: 'analysis', name: '🔍 Phân Tích Kịch Bản', status: 'pending' },
    { id: 'images', name: '🎨 Tạo Ảnh', status: 'pending' },
    { id: 'video', name: '🎬 Tạo Video', status: 'pending' },
    { id: 'audio', name: '🎤 Tạo Audio (Optional)', status: 'pending' }
  ];

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setWorkflowConfig(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const updateStepStatus = (stepId: string, status: WorkflowStep['status'], data?: any, error?: string) => {
    const stepIndex = workflowSteps.findIndex(step => step.id === stepId);
    if (stepIndex !== -1) {
      workflowSteps[stepIndex].status = status;
      if (data) workflowSteps[stepIndex].data = data;
      if (error) workflowSteps[stepIndex].error = error;
    }
  };

  const generateScript = async (): Promise<string> => {
    updateStepStatus('script', 'in-progress');
    
    try {
      const apiKey = getActiveApiKey();
      // Generate language-specific prompt
      let languagePrompt = '';
      switch (workflowConfig.language) {
        case 'Vietnamese':
          languagePrompt = 'Write the entire script in Vietnamese. Use natural Vietnamese expressions and cultural references.';
          break;
        case 'English':
          languagePrompt = 'Write the entire script in English. Use clear, professional English suitable for international audiences.';
          break;
        case 'Japanese':
          languagePrompt = 'Write the entire script in Japanese. Use natural Japanese expressions, appropriate politeness levels, and cultural context. Include both kanji and hiragana/katakana as appropriate.';
          break;
        case 'Vietnamese-English':
          languagePrompt = 'Write the script in both Vietnamese and English. Start with Vietnamese version, then provide English translation. Use format: [VIETNAMESE]: [content] [ENGLISH]: [translation]';
          break;
        case 'Vietnamese-Japanese':
          languagePrompt = 'Write the script in both Vietnamese and Japanese. Start with Vietnamese version, then provide Japanese translation. Use format: [VIETNAMESE]: [content] [JAPANESE]: [translation]';
          break;
        case 'English-Japanese':
          languagePrompt = 'Write the script in both English and Japanese. Start with English version, then provide Japanese translation. Use format: [ENGLISH]: [content] [JAPANESE]: [translation]';
          break;
        default:
          languagePrompt = 'Write the script in Vietnamese.';
      }

      const prompt = `
Create a detailed video script for the following requirements:

Topic: ${workflowConfig.topic}
Genre: ${workflowConfig.genre}
Duration: ${workflowConfig.duration} minutes
Tone: ${workflowConfig.tone}
Target Audience: ${workflowConfig.audience}
Language: ${workflowConfig.language}
Template: ${workflowConfig.template}

Language Requirements:
${languagePrompt}

Content Requirements:
1. Create an engaging hook/introduction
2. Structure the content with clear sections
3. ${workflowConfig.includeTiming ? 'Include specific timing for each section' : 'Focus on content flow'}
4. ${workflowConfig.includeVisualNotes ? 'Add visual suggestions and camera angles' : 'Focus on narrative content'}
5. Include narration and dialogue where appropriate
6. End with a strong conclusion and call-to-action
7. Make it engaging and suitable for the target audience

Format the response as:
[TITLE]: [Video Title]
[INTRODUCTION]: [Hook and opening]
[MAIN CONTENT]: [Detailed sections ${workflowConfig.includeTiming ? 'with timing' : ''}]
[CONCLUSION]: [Wrap-up and call-to-action]
${workflowConfig.includeVisualNotes ? '[VISUAL NOTES]: [Camera angles, transitions, etc.]' : ''}
      `;

      const response = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=${apiKey}`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          contents: [{
            parts: [{ text: prompt }]
          }],
          generationConfig: {
            temperature: 0.7,
            topK: 40,
            topP: 0.95,
            maxOutputTokens: 8192
          }
        })
      });

      if (!response.ok) {
        throw new Error(`Script generation failed: ${response.status}`);
      }

      const data = await response.json();
      const script = data.candidates[0].content.parts[0].text;
      
      updateStepStatus('script', 'completed', { script });
      setWorkflowData((prev: any) => ({ ...prev, script }));
      return script;
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Failed to generate script';
      updateStepStatus('script', 'error', undefined, errorMessage);
      throw error;
    }
  };

  const analyzeScript = async (script: string): Promise<string> => {
    updateStepStatus('analysis', 'in-progress');
    
    try {
      const apiKey = getActiveApiKey();
      const prompt = `
Analyze the following video script and provide detailed production notes:

${script}

Please provide:
1. Scene-by-scene breakdown ${workflowConfig.includeTiming ? 'with timing' : ''}
2. Visual descriptions for each scene
3. Camera angle suggestions
4. Props and settings needed
5. Color palette recommendations
6. Transition suggestions between scenes

Format as:
SCENE 1: [Scene description]
${workflowConfig.includeTiming ? '- Duration: [time]' : ''}
- Visual: [description]
- Camera: [angle/shot type]
- Props: [items needed]
- Colors: [palette]

SCENE 2: [Scene description]
...
      `;

      const response = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=${apiKey}`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          contents: [{
            parts: [{ text: prompt }]
          }],
          generationConfig: {
            temperature: 0.7,
            topK: 40,
            topP: 0.95,
            maxOutputTokens: 8192
          }
        })
      });

      if (!response.ok) {
        throw new Error(`Analysis failed: ${response.status}`);
      }

      const data = await response.json();
      const analysis = data.candidates[0].content.parts[0].text;
      
      updateStepStatus('analysis', 'completed', { analysis });
      setWorkflowData((prev: any) => ({ ...prev, analysis }));
      return analysis;
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Failed to analyze script';
      updateStepStatus('analysis', 'error', undefined, errorMessage);
      throw error;
    }
  };

  const generateImages = async (script: string): Promise<any[]> => {
    updateStepStatus('images', 'in-progress');
    
    try {
      const apiKey = getActiveApiKey();
      const imageCount = parseInt(workflowConfig.imageCount);

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

${script}

Requirements:
- Create ${imageCount} distinct scenes
- Each prompt should be detailed and descriptive
- Include visual elements, lighting, composition
- Style: ${workflowConfig.imageStyle}
- Write prompts in English for AI image generation
- Make each prompt unique and engaging

Format as:
PROMPT 1: [Detailed English description]
PROMPT 2: [Detailed English description]
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
      const lines = promptText.split('\n');
      const prompts: string[] = [];
      
      for (const line of lines) {
        if (line.includes('PROMPT') && line.includes(':')) {
          const prompt = line.split(':').slice(1).join(':').trim();
          if (prompt && prompts.length < imageCount) {
            prompts.push(prompt);
          }
        }
      }

      // Generate placeholder images for now (real AI images would require additional setup)
      const images = prompts.map((prompt, index) => ({
        id: `img-${Date.now()}-${index}`,
        url: generatePlaceholderImage(800, 450, `Scene ${index + 1}`, prompt),
        prompt: prompt,
        description: `Scene ${index + 1}`,
        status: 'placeholder' as const
      }));

      updateStepStatus('images', 'completed', { images });
      setWorkflowData((prev: any) => ({ ...prev, images }));
      return images;
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Failed to generate images';
      updateStepStatus('images', 'error', undefined, errorMessage);
      throw error;
    }
  };

  const generateVideo = async (script: string, images: any[]): Promise<any> => {
    updateStepStatus('video', 'in-progress');
    
    try {
      // Use the first image as input if available
      const selectedImage = images.length > 0 ? images[0].url : null;
      
      const config: any = {
        model: 'veo-2.0-generate-001',
        prompt: script.substring(0, 500), // Use first 500 chars of script as prompt
        config: {
          aspectRatio: '16:9',
          numberOfVideos: 1,
        },
      };

      if (selectedImage) {
        config.image = {
          imageBytes: selectedImage,
          mimeType: 'image/png',
        };
      }

      // For now, generate a placeholder video
      const video = {
        id: `video-${Date.now()}`,
        url: generatePlaceholderVideo(800, 450, script.substring(0, 100)),
        prompt: script.substring(0, 500),
        status: 'placeholder' as const,
        settings: {
          aspectRatio: '16:9',
          durationSeconds: 8,
          fps: 24,
          resolution: '720p',
          numberOfVideos: 1
        }
      };

      updateStepStatus('video', 'completed', { video });
      setWorkflowData((prev: any) => ({ ...prev, video }));
      return video;
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Failed to generate video';
      updateStepStatus('video', 'error', undefined, errorMessage);
      throw error;
    }
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

    // Add title
    ctx.fillStyle = 'white';
    ctx.font = 'bold 32px Arial';
    ctx.textAlign = 'center';
    ctx.fillText(title, width / 2, height / 2 - 40);

    // Add description
    ctx.font = '16px Arial';
    ctx.fillText(description.substring(0, 100) + '...', width / 2, height / 2 + 10);

    return canvas.toDataURL();
  };

  const generatePlaceholderVideo = (width: number, height: number, description: string): string => {
    const canvas = document.createElement('canvas');
    canvas.width = width;
    canvas.height = height;
    const ctx = canvas.getContext('2d');
    
    if (!ctx) return '';

    // Create animated video-like placeholder
    const gradient = ctx.createLinearGradient(0, 0, width, height);
    gradient.addColorStop(0, '#ff6b6b');
    gradient.addColorStop(0.5, '#4ecdc4');
    gradient.addColorStop(1, '#45b7d1');
    ctx.fillStyle = gradient;
    ctx.fillRect(0, 0, width, height);

    // Add video-like elements
    ctx.fillStyle = 'rgba(255, 255, 255, 0.2)';
    ctx.fillRect(width / 2 - 50, height / 2 - 50, 100, 100);

    // Add play button
    ctx.fillStyle = 'white';
    ctx.beginPath();
    ctx.moveTo(width / 2 - 20, height / 2 - 30);
    ctx.lineTo(width / 2 + 20, height / 2);
    ctx.lineTo(width / 2 - 20, height / 2 + 30);
    ctx.closePath();
    ctx.fill();

    // Add text
    ctx.fillStyle = 'white';
    ctx.font = 'bold 24px Arial';
    ctx.textAlign = 'center';
    ctx.fillText('Video Generated!', width / 2, height - 60);
    ctx.font = '16px Arial';
    ctx.fillText(description.substring(0, 50) + '...', width / 2, height - 30);

    return canvas.toDataURL();
  };

  const runWorkflow = async () => {
    if (!hasApiKeys()) {
      setError('Please add at least one API key first.');
      return;
    }

    if (!workflowConfig.topic.trim()) {
      setError('Please enter a topic for your video.');
      return;
    }

    setIsRunning(true);
    setError('');
    setCurrentStep(0);
    setWorkflowData({});

    try {
      // Step 1: Generate Script
      setCurrentStep(1);
      const script = await generateScript();

      // Step 2: Analyze Script
      setCurrentStep(2);
      const analysis = await analyzeScript(script);

      // Step 3: Generate Images
      setCurrentStep(3);
      const images = await generateImages(script);

      // Step 4: Generate Video
      setCurrentStep(4);
      const video = await generateVideo(script, images);

      // Step 5: Complete
      setCurrentStep(5);
      updateStepStatus('audio', 'completed'); // Skip audio for now

      // Call completion callback
      onWorkflowComplete({
        script,
        analysis,
        images,
        video,
        config: workflowConfig
      });

    } catch (error) {
      setError(error instanceof Error ? error.message : 'Workflow failed');
    } finally {
      setIsRunning(false);
    }
  };

  return (
    <div className="workflow-manager">
      <h2>🚀 AI Video Creation Workflow</h2>
      <p>Complete automated workflow from script to video generation</p>

      {error && <div className="alert alert-error">{error}</div>}

      <div className="workflow-config">
        <h3>⚙️ Workflow Configuration</h3>
        
        <div className="config-grid">
          <div className="form-group">
            <label htmlFor="topic">Video Topic *</label>
            <input
              type="text"
              id="topic"
              name="topic"
              className="form-control"
              placeholder="e.g., How to make Vietnamese pho, iPhone 15 review..."
              value={workflowConfig.topic}
              onChange={handleInputChange}
            />
          </div>

          <div className="form-group">
            <label htmlFor="genre">Genre</label>
            <select
              id="genre"
              name="genre"
              className="form-control"
              value={workflowConfig.genre}
              onChange={handleInputChange}
            >
              <option value="educational">Educational</option>
              <option value="entertainment">Entertainment</option>
              <option value="review">Product Review</option>
              <option value="tutorial">Tutorial</option>
              <option value="travel">Travel</option>
              <option value="cooking">Cooking</option>
              <option value="lifestyle">Lifestyle</option>
              <option value="technology">Technology</option>
              <option value="story">Story</option>
            </select>
          </div>

          <div className="form-group">
            <label htmlFor="duration">Duration (minutes)</label>
            <select
              id="duration"
              name="duration"
              className="form-control"
              value={workflowConfig.duration}
              onChange={handleInputChange}
            >
              <option value="1">1 minute</option>
              <option value="3">3 minutes</option>
              <option value="5">5 minutes</option>
              <option value="10">10 minutes</option>
              <option value="15">15 minutes</option>
            </select>
          </div>

          <div className="form-group">
            <label htmlFor="imageCount">Number of Images</label>
            <select
              id="imageCount"
              name="imageCount"
              className="form-control"
              value={workflowConfig.imageCount}
              onChange={handleInputChange}
            >
              <option value="2">2 images</option>
              <option value="4">4 images</option>
              <option value="6">6 images</option>
              <option value="8">8 images</option>
            </select>
          </div>

          <div className="form-group">
            <label htmlFor="language">Script Language</label>
            <select
              id="language"
              name="language"
              className="form-control"
              value={workflowConfig.language}
              onChange={handleInputChange}
            >
              <option value="Vietnamese">Vietnamese</option>
              <option value="English">English</option>
              <option value="Japanese">Japanese</option>
              <option value="Vietnamese-English">Vietnamese-English</option>
              <option value="Vietnamese-Japanese">Vietnamese-Japanese</option>
              <option value="English-Japanese">English-Japanese</option>
            </select>
          </div>

          <div className="form-group">
            <label htmlFor="analysisLanguage">Analysis Language</label>
            <select
              id="analysisLanguage"
              name="analysisLanguage"
              className="form-control"
              value={workflowConfig.analysisLanguage}
              onChange={handleInputChange}
            >
              <option value="Vietnamese">Vietnamese</option>
              <option value="English">English</option>
              <option value="Japanese">Japanese</option>
            </select>
          </div>

          <div className="form-group">
            <label htmlFor="promptLanguage">Image Prompt Language</label>
            <select
              id="promptLanguage"
              name="promptLanguage"
              className="form-control"
              value={workflowConfig.promptLanguage}
              onChange={handleInputChange}
            >
              <option value="English">English</option>
              <option value="Vietnamese">Vietnamese</option>
              <option value="Japanese">Japanese</option>
            </select>
          </div>
        </div>
      </div>

      <div className="workflow-steps">
        <h3>📋 Workflow Steps</h3>
        <div className="steps-list">
          {workflowSteps.map((step, index) => (
            <div key={step.id} className={`step-item ${step.status} ${index === currentStep - 1 ? 'current' : ''}`}>
              <div className="step-icon">
                {step.status === 'pending' && '⏳'}
                {step.status === 'in-progress' && '🔄'}
                {step.status === 'completed' && '✅'}
                {step.status === 'error' && '❌'}
              </div>
              <div className="step-content">
                <h4>{step.name}</h4>
                {step.status === 'in-progress' && <p>Processing...</p>}
                {step.status === 'completed' && <p>Completed successfully</p>}
                {step.status === 'error' && <p className="error">{step.error}</p>}
              </div>
            </div>
          ))}
        </div>
      </div>

      <div className="workflow-actions">
        <button
          className="btn btn-primary"
          onClick={runWorkflow}
          disabled={isRunning || !workflowConfig.topic.trim()}
        >
          {isRunning ? (
            <>
              <div className="spinner"></div>
              Running Workflow... (Step {currentStep}/5)
            </>
          ) : (
            '🚀 Start Complete Workflow'
          )}
        </button>
      </div>

      {Object.keys(workflowData).length > 0 && (
        <div className="workflow-results">
          <h3>📊 Workflow Results</h3>
          <div className="results-summary">
            {workflowData.script && (
              <div className="result-item">
                <h4>📝 Script Generated</h4>
                <p>{workflowData.script.substring(0, 200)}...</p>
              </div>
            )}
            {workflowData.analysis && (
              <div className="result-item">
                <h4>🔍 Analysis Completed</h4>
                <p>{workflowData.analysis.substring(0, 200)}...</p>
              </div>
            )}
            {workflowData.images && (
              <div className="result-item">
                <h4>🎨 Images Generated</h4>
                <p>{workflowData.images.length} images created</p>
              </div>
            )}
            {workflowData.video && (
              <div className="result-item">
                <h4>🎬 Video Generated</h4>
                <p>Video created successfully</p>
              </div>
            )}
          </div>
        </div>
      )}

    </div>
  );
};

export default WorkflowManager;
