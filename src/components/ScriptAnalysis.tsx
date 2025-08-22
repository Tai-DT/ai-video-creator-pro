import React, { useState, useEffect } from 'react';
import { useApiKeys } from '../contexts/ApiKeyContext';

interface ScriptAnalysisProps {
  onScriptAnalyzed: (analysis: string) => void;
  initialScript?: string;
}

const ScriptAnalysis: React.FC<ScriptAnalysisProps> = ({ onScriptAnalyzed, initialScript }) => {
  const { hasApiKeys, getActiveApiKey } = useApiKeys();
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  const [analysisResult, setAnalysisResult] = useState('');

  const [formData, setFormData] = useState({
    script: '',
    analysisType: 'scenes',
    includeTiming: true,
    includeVisualNotes: true,
    includeMusicSuggestions: true,
    analysisLanguage: 'Vietnamese'
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

  const analyzeScript = async () => {
    if (!hasApiKeys()) {
      setError('Please add at least one API key first.');
      return;
    }

    if (!formData.script.trim()) {
      setError('Please enter a script to analyze.');
      return;
    }

    setIsLoading(true);
    setError('');
    setAnalysisResult('');

    try {
      const apiKey = getActiveApiKey();
      let prompt = '';

      switch (formData.analysisType) {
        case 'scenes':
          // Generate language-specific analysis prompt
          let analysisLanguagePrompt = '';
          switch (formData.analysisLanguage) {
            case 'Vietnamese':
              analysisLanguagePrompt = 'Phân tích kịch bản video sau và chia nhỏ thành các cảnh chi tiết cho sản xuất video. Viết phân tích bằng tiếng Việt.';
              break;
            case 'English':
              analysisLanguagePrompt = 'Analyze the following video script and break it down into detailed scenes for video production. Write the analysis in English.';
              break;
            case 'Japanese':
              analysisLanguagePrompt = '以下のビデオスクリプトを分析し、映像制作のための詳細なシーンに分解してください。分析は日本語で書いてください。';
              break;
            default:
              analysisLanguagePrompt = 'Analyze the following video script and break it down into detailed scenes for video production.';
          }

          prompt = `
${analysisLanguagePrompt}

Script to analyze:
${formData.script}

Please provide:
1. Scene-by-scene breakdown ${formData.includeTiming ? 'with timing' : ''}
2. Visual descriptions for each scene
3. Camera angle suggestions
4. Props and settings needed
5. Color palette recommendations
6. Transition suggestions between scenes
${formData.includeMusicSuggestions ? '7. Background music suggestions for each scene' : ''}

Format as:
SCENE 1: [Scene description]
${formData.includeTiming ? '- Duration: [time]' : ''}
- Visual: [description]
- Camera: [angle/shot type]
- Props: [items needed]
- Colors: [palette]
${formData.includeMusicSuggestions ? '- Music: [suggestion]' : ''}

SCENE 2: [Scene description]
...
          `;
          break;

        case 'visual':
          prompt = `
Analyze the following script and provide detailed visual production notes:

${formData.script}

Please provide:
1. Overall visual style and mood
2. Color scheme and lighting
3. Camera movements and angles
4. Props and set design
5. Costume and makeup suggestions
6. Special effects requirements
7. Background music suggestions
          `;
          break;

        case 'timing':
          prompt = `
Analyze the timing and pacing of this video script:

${formData.script}

Please provide:
1. Detailed timing breakdown for each section
2. Pacing analysis (fast/slow sections)
3. Hook timing and engagement points
4. Call-to-action placement
5. Optimal video length recommendations
6. Editing suggestions for flow
          `;
          break;

        case 'complete':
          prompt = `
Provide a comprehensive analysis of this video script:

${formData.script}

Please analyze:
1. Content structure and flow
2. Target audience alignment
3. Engagement potential
4. Visual production requirements
5. Technical considerations
6. Marketing potential
7. Improvement suggestions

Provide detailed recommendations for each aspect.
          `;
          break;

        default:
          prompt = `
Analyze this video script for production:

${formData.script}

Provide insights on structure, visual elements, timing, and production considerations.
          `;
      }

      const response = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=${apiKey}`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          contents: [{
            parts: [{
              text: prompt
            }]
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
        throw new Error(`API request failed: ${response.status}`);
      }

      const data = await response.json();
      const analysis = data.candidates[0].content.parts[0].text;
      
      setAnalysisResult(analysis);
      onScriptAnalyzed(analysis);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to analyze script');
    } finally {
      setIsLoading(false);
    }
  };

  const copyToClipboard = () => {
    navigator.clipboard.writeText(analysisResult);
    alert('Analysis copied to clipboard!');
  };

  return (
    <div className="script-analysis">
      <h2>🔍 Script Analysis</h2>
      <p className="mb-3">Analyze your script for video production with detailed insights and recommendations.</p>

      {error && <div className="alert alert-error">{error}</div>}

      <div className="form-group">
        <label htmlFor="script">Script to Analyze</label>
        <textarea
          id="script"
          name="script"
          className="form-control"
          placeholder="Paste your video script here..."
          value={formData.script}
          onChange={handleInputChange}
          rows={8}
        />
      </div>

      <div className="form-group">
        <label htmlFor="analysisType">Analysis Type</label>
        <select
          id="analysisType"
          name="analysisType"
          className="form-control"
          value={formData.analysisType}
          onChange={handleInputChange}
        >
          <option value="scenes">Scene Breakdown</option>
          <option value="visual">Visual Production Notes</option>
          <option value="timing">Timing & Pacing</option>
          <option value="complete">Complete Analysis</option>
        </select>
      </div>

      <div className="form-group">
        <label htmlFor="includeTiming">Include Timing</label>
        <select
          id="includeTiming"
          name="includeTiming"
          className="form-control"
          value={formData.includeTiming.toString()}
          onChange={(e) => setFormData(prev => ({ ...prev, includeTiming: e.target.value === 'true' }))}
        >
          <option value="true">Yes</option>
          <option value="false">No</option>
        </select>
      </div>

      <div className="form-group">
        <label htmlFor="includeVisualNotes">Include Visual Notes</label>
        <select
          id="includeVisualNotes"
          name="includeVisualNotes"
          className="form-control"
          value={formData.includeVisualNotes.toString()}
          onChange={(e) => setFormData(prev => ({ ...prev, includeVisualNotes: e.target.value === 'true' }))}
        >
          <option value="true">Yes</option>
          <option value="false">No</option>
        </select>
      </div>

      <div className="form-group">
        <label htmlFor="includeMusicSuggestions">Include Music Suggestions</label>
        <select
          id="includeMusicSuggestions"
          name="includeMusicSuggestions"
          className="form-control"
          value={formData.includeMusicSuggestions.toString()}
          onChange={(e) => setFormData(prev => ({ ...prev, includeMusicSuggestions: e.target.value === 'true' }))}
        >
          <option value="true">Yes</option>
          <option value="false">No</option>
        </select>
      </div>

      <div className="form-group">
        <label htmlFor="analysisLanguage">Analysis Language</label>
        <select
          id="analysisLanguage"
          name="analysisLanguage"
          className="form-control"
          value={formData.analysisLanguage}
          onChange={handleInputChange}
        >
          <option value="Vietnamese">Vietnamese</option>
          <option value="English">English</option>
          <option value="Japanese">Japanese</option>
        </select>
      </div>

      <div className="form-group">
        <button
          className="btn"
          onClick={analyzeScript}
          disabled={isLoading || !formData.script.trim()}
        >
          {isLoading ? (
            <>
              <div className="spinner"></div>
              Analyzing Script...
            </>
          ) : (
            '🔬 Analyze Script'
          )}
        </button>
      </div>

      {analysisResult && (
        <div className="analysis-result">
          <div className="analysis-header">
            <h3>Analysis Results</h3>
            <div className="analysis-actions">
              <button className="btn btn-secondary" onClick={copyToClipboard}>
                📋 Copy Analysis
              </button>
            </div>
          </div>
          <div className="analysis-content">
            <div className="analysis-text">
              {analysisResult.split('\n').map((line, index) => (
                <div key={index} className="analysis-line">
                  {line}
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

    </div>
  );
};

export default ScriptAnalysis;

