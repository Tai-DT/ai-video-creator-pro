import React, { useState } from 'react';
import { useApiKeys } from '../contexts/ApiKeyContext';

interface ScriptCreationProps {
  onScriptGenerated: (script: string) => void;
}

const ScriptCreation: React.FC<ScriptCreationProps> = ({ onScriptGenerated }) => {
  const { hasApiKeys, getActiveApiKey } = useApiKeys();
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  const [generatedScript, setGeneratedScript] = useState('');

  const [formData, setFormData] = useState({
    topic: '',
    genre: 'educational',
    duration: '5',
    tone: 'friendly',
    audience: 'general',
    language: 'Vietnamese',
    template: 'standard',
    includeVisualNotes: true,
    includeTiming: true
  });

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const generateScript = async () => {
    if (!hasApiKeys()) {
      setError('Please add at least one API key first.');
      return;
    }

    if (!formData.topic.trim()) {
      setError('Please enter a topic for your video.');
      return;
    }

    setIsLoading(true);
    setError('');
    setGeneratedScript('');

    try {
      const apiKey = getActiveApiKey();
      // Generate template-specific prompt
      let templatePrompt = '';
      switch (formData.template) {
        case 'storytelling':
          templatePrompt = `
Create a compelling storytelling video script with:
- Strong narrative arc (beginning, middle, end)
- Character development
- Emotional journey
- Visual storytelling elements
- Engaging plot twists
          `;
          break;
        case 'tutorial':
          templatePrompt = `
Create a step-by-step tutorial video script with:
- Clear learning objectives
- Progressive difficulty
- Visual demonstrations
- Common mistakes to avoid
- Practice exercises
          `;
          break;
        case 'review':
          templatePrompt = `
Create a comprehensive review video script with:
- Product overview
- Pros and cons analysis
- Real-world testing
- Comparison with alternatives
- Final recommendation
          `;
          break;
        case 'educational':
          templatePrompt = `
Create an educational video script with:
- Clear learning objectives
- Engaging explanations
- Visual examples
- Interactive elements
- Knowledge retention techniques
          `;
          break;
        default:
          templatePrompt = `
Create a standard video script with:
- Engaging hook/introduction
- Clear content structure
- Visual suggestions
- Strong conclusion
          `;
      }

      // Generate language-specific prompt
      let languagePrompt = '';
      switch (formData.language) {
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

Topic: ${formData.topic}
Genre: ${formData.genre}
Duration: ${formData.duration} minutes
Tone: ${formData.tone}
Target Audience: ${formData.audience}
Language: ${formData.language}
Template: ${formData.template}

${templatePrompt}

Language Requirements:
${languagePrompt}

Content Requirements:
1. Create an engaging hook/introduction
2. Structure the content with clear sections
3. ${formData.includeTiming ? 'Include specific timing for each section' : 'Focus on content flow'}
4. ${formData.includeVisualNotes ? 'Add visual suggestions and camera angles' : 'Focus on narrative content'}
5. Include narration and dialogue where appropriate
6. End with a strong conclusion and call-to-action
7. Make it engaging and suitable for the target audience

Format the response as:
[TITLE]: [Video Title]
[INTRODUCTION]: [Hook and opening]
[MAIN CONTENT]: [Detailed sections ${formData.includeTiming ? 'with timing' : ''}]
[CONCLUSION]: [Wrap-up and call-to-action]
${formData.includeVisualNotes ? '[VISUAL NOTES]: [Camera angles, transitions, etc.]' : ''}
      `;

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
      const script = data.candidates[0].content.parts[0].text;
      
      setGeneratedScript(script);
      onScriptGenerated(script);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to generate script');
    } finally {
      setIsLoading(false);
    }
  };

  const copyToClipboard = () => {
    navigator.clipboard.writeText(generatedScript);
    alert('Script copied to clipboard!');
  };

  return (
    <div className="script-creation">
      <h2>📝 Create Video Script</h2>
      <p className="mb-3">Generate a professional video script using AI based on your requirements.</p>

      {error && <div className="alert alert-error">{error}</div>}

      <div className="grid grid-2">
        <div className="form-group">
          <label htmlFor="topic">Video Topic *</label>
          <input
            type="text"
            id="topic"
            name="topic"
            className="form-control"
            placeholder="e.g., How to make Vietnamese pho, iPhone 15 review, Travel guide to Da Lat..."
            value={formData.topic}
            onChange={handleInputChange}
          />
        </div>

        <div className="form-group">
          <label htmlFor="genre">Genre</label>
          <select
            id="genre"
            name="genre"
            className="form-control"
            value={formData.genre}
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
          <label htmlFor="template">Template</label>
          <select
            id="template"
            name="template"
            className="form-control"
            value={formData.template}
            onChange={handleInputChange}
          >
            <option value="standard">Standard</option>
            <option value="storytelling">Storytelling</option>
            <option value="tutorial">Tutorial</option>
            <option value="review">Review</option>
            <option value="educational">Educational</option>
          </select>
        </div>

        <div className="form-group">
          <label htmlFor="duration">Duration (minutes)</label>
          <select
            id="duration"
            name="duration"
            className="form-control"
            value={formData.duration}
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
          <label htmlFor="tone">Tone</label>
          <select
            id="tone"
            name="tone"
            className="form-control"
            value={formData.tone}
            onChange={handleInputChange}
          >
            <option value="friendly">Friendly</option>
            <option value="professional">Professional</option>
            <option value="humorous">Humorous</option>
            <option value="inspiring">Inspiring</option>
            <option value="informative">Informative</option>
            <option value="casual">Casual</option>
          </select>
        </div>

        <div className="form-group">
          <label htmlFor="audience">Target Audience</label>
          <select
            id="audience"
            name="audience"
            className="form-control"
            value={formData.audience}
            onChange={handleInputChange}
          >
            <option value="general">General</option>
            <option value="children">Children</option>
            <option value="teenagers">Teenagers</option>
            <option value="adults">Adults</option>
            <option value="professionals">Professionals</option>
            <option value="seniors">Seniors</option>
          </select>
        </div>

        <div className="form-group">
          <label htmlFor="language">Language</label>
          <select
            id="language"
            name="language"
            className="form-control"
            value={formData.language}
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
      </div>

      <div className="form-group">
        <button
          className="btn"
          onClick={generateScript}
          disabled={isLoading || !formData.topic.trim()}
        >
          {isLoading ? (
            <>
              <div className="spinner"></div>
              Generating Script...
            </>
          ) : (
            '🚀 Generate Script'
          )}
        </button>
      </div>

      {generatedScript && (
        <div className="generated-script">
          <div className="script-header">
            <h3>Generated Script</h3>
            <div className="script-actions">
              <button className="btn btn-secondary" onClick={copyToClipboard}>
                📋 Copy Script
              </button>
            </div>
          </div>
          <div className="script-content">
            <pre>{generatedScript}</pre>
          </div>
        </div>
      )}

    </div>
  );
};

export default ScriptCreation;

