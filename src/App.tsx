import React, { useState, useEffect } from 'react';
import './App.css';
import ApiKeyManager from './components/ApiKeyManager';
import ScriptCreation from './components/ScriptCreation';
import ScriptAnalysis from './components/ScriptAnalysis';
import ImageGeneration from './components/ImageGeneration';
import VideoCreation from './components/VideoCreation';
import ProjectHistory from './components/ProjectHistory';
import SaveProject from './components/SaveProject';
import ImageTest from './components/ImageTest';
import VideoTest from './components/VideoTest';
import AudioGeneration from './components/AudioGeneration';
import AudioTest from './components/AudioTest';
import WorkflowManager from './components/WorkflowManager';
import { ApiKeyProvider } from './contexts/ApiKeyContext';

export type TabType = 'script-creation' | 'script-analysis' | 'image-generation' | 'video-creation' | 'project-history' | 'image-test' | 'video-test' | 'audio-generation' | 'audio-test' | 'workflow';

function App() {
  const [activeTab, setActiveTab] = useState<TabType>('script-creation');
  const [generatedScript, setGeneratedScript] = useState<string>('');
  const [analyzedScript, setAnalyzedScript] = useState<string>('');
  const [generatedImages, setGeneratedImages] = useState<any[]>([]);

  const tabs = [
    { id: 'workflow', label: '🚀 Complete Workflow', icon: '🚀' },
    { id: 'script-creation', label: '📝 Tạo Kịch Bản', icon: '📝' },
    { id: 'script-analysis', label: '🔍 Phân Tích Kịch Bản', icon: '🔍' },
    { id: 'image-generation', label: '🎨 Tạo Ảnh', icon: '🎨' },
    { id: 'video-creation', label: '🎥 Tạo Video', icon: '🎥' },
    { id: 'project-history', label: '📁 Lịch Sử', icon: '📁' },
    { id: 'image-test', label: '🧪 Test Ảnh', icon: '🧪' },
    { id: 'video-test', label: '🎬 Test Video', icon: '🎬' },
    { id: 'audio-generation', label: '🎤 Tạo Audio', icon: '🎤' },
    { id: 'audio-test', label: '🎤 Test Audio', icon: '🎤' },
  ];

  const handleTabChange = (tabId: TabType) => {
    setActiveTab(tabId);
  };

  const handleScriptGenerated = (script: string) => {
    setGeneratedScript(script);
    // Auto-switch to analysis tab
    setActiveTab('script-analysis');
  };

  const handleScriptAnalyzed = (analysis: string) => {
    setAnalyzedScript(analysis);
    // Auto-switch to image generation tab
    setActiveTab('image-generation');
  };

  const handleImagesGenerated = (images: any[]) => {
    setGeneratedImages(images);
    // Auto-switch to video creation tab
    setActiveTab('video-creation');
  };

  const handleProjectSaved = () => {
    // Refresh project history if on that tab
    if (activeTab === 'project-history') {
      // Force re-render of ProjectHistory component
      setActiveTab('project-history');
    }
  };

  const handleWorkflowComplete = (workflowData: any) => {
    // Update state with workflow results
    setGeneratedScript(workflowData.script || '');
    setAnalyzedScript(workflowData.analysis || '');
    setGeneratedImages(workflowData.images || []);
    
    // Auto-switch to project history to show results
    setActiveTab('project-history');
  };

  return (
    <ApiKeyProvider>
      <div className="app">
        <header className="app-header">
          <div className="header-content">
            <h1>🎬 AI Video Creator Pro</h1>
            <p>Tạo kịch bản, phân tích, tạo ảnh và video chuyên nghiệp với AI</p>
          </div>
        </header>

        <main className="app-main">
          <div className="container">
            <ApiKeyManager />

            <div className="tab-navigation">
              {tabs.map((tab) => (
                <button
                  key={tab.id}
                  className={`tab-button ${activeTab === tab.id ? 'active' : ''}`}
                  onClick={() => handleTabChange(tab.id as TabType)}
                >
                  <span className="tab-icon">{tab.icon}</span>
                  <span className="tab-label">{tab.label}</span>
                </button>
              ))}
            </div>

            <div className="tab-content">
              {activeTab === 'workflow' && (
                <WorkflowManager onWorkflowComplete={handleWorkflowComplete} />
              )}
              {activeTab === 'script-creation' && (
                <ScriptCreation onScriptGenerated={handleScriptGenerated} />
              )}
              {activeTab === 'script-analysis' && (
                <ScriptAnalysis 
                  onScriptAnalyzed={handleScriptAnalyzed}
                  initialScript={generatedScript}
                />
              )}
              {activeTab === 'image-generation' && (
                <ImageGeneration 
                  onImagesGenerated={handleImagesGenerated}
                  initialScript={analyzedScript}
                />
              )}
              {activeTab === 'video-creation' && (
                <VideoCreation 
                  generatedImages={generatedImages}
                  script={generatedScript}
                />
              )}
              {activeTab === 'project-history' && (
                <ProjectHistory />
              )}
              {activeTab === 'image-test' && (
                <ImageTest />
              )}
              {activeTab === 'video-test' && (
                <VideoTest />
              )}
              {activeTab === 'audio-generation' && (
                <AudioGeneration />
              )}
              {activeTab === 'audio-test' && (
                <AudioTest />
              )}
            </div>

            {/* Save Project Section - Always visible */}
            <SaveProject
              script={generatedScript}
              analysis={analyzedScript}
              images={generatedImages}
              onSave={handleProjectSaved}
            />
          </div>
        </main>

        <footer className="app-footer">
          <p>© 2024 AI Video Creator Pro - Powered by Google AI & Gemini</p>
        </footer>
      </div>
    </ApiKeyProvider>
  );
}

export default App;
