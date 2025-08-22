import React, { useState } from 'react';
import { useApiKeys } from '../contexts/ApiKeyContext';

const ApiKeyManager: React.FC = () => {
  const { apiKeys, currentApiIndex, addApiKey, removeApiKey, setActiveApiKey } = useApiKeys();
  const [newApiKey, setNewApiKey] = useState('');
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  const handleAddApiKey = () => {
    try {
      setError('');
      setSuccess('');
      addApiKey(newApiKey);
      setNewApiKey('');
      setSuccess('API key added successfully!');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to add API key');
    }
  };

  const handleRemoveApiKey = (index: number) => {
    if (window.confirm('Are you sure you want to remove this API key?')) {
      removeApiKey(index);
      setSuccess('API key removed successfully!');
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      handleAddApiKey();
    }
  };

  return (
    <div className="api-key-manager">
      <div className="api-key-section">
        <h3>🔑 API Key Management</h3>
        <p className="mb-2">Add your Google AI Studio or Gemini API keys to get started</p>
        
        {error && <div className="alert alert-error">{error}</div>}
        {success && <div className="alert alert-success">{success}</div>}

        <div className="form-group">
          <label htmlFor="newApiKey">Add New API Key</label>
          <div className="flex gap-2">
            <input
              type="password"
              id="newApiKey"
              className="form-control"
              placeholder="Enter your API key..."
              value={newApiKey}
              onChange={(e) => setNewApiKey(e.target.value)}
              onKeyPress={handleKeyPress}
            />
            <button 
              className="btn" 
              onClick={handleAddApiKey}
              disabled={!newApiKey.trim()}
            >
              Add Key
            </button>
          </div>
        </div>

        {apiKeys.length > 0 && (
          <div className="api-keys-list">
            <h4>Active API Keys</h4>
            <div className="grid gap-2">
              {apiKeys.map((key, index) => (
                <div 
                  key={index} 
                  className={`api-key-item ${index === currentApiIndex ? 'active' : ''}`}
                  onClick={() => setActiveApiKey(index)}
                >
                  <div className="api-key-info">
                    <span className="api-key-number">API Key {index + 1}</span>
                    <span className="api-key-preview">****{key.slice(-4)}</span>
                    {index === currentApiIndex && (
                      <span className="api-key-status active">Active</span>
                    )}
                  </div>
                  <button
                    className="btn-remove"
                    onClick={(e) => {
                      e.stopPropagation();
                      handleRemoveApiKey(index);
                    }}
                    title="Remove API key"
                  >
                    ×
                  </button>
                </div>
              ))}
            </div>
            <p className="text-center mt-2 text-sm text-gray-600">
              Click on an API key to make it active
            </p>
          </div>
        )}

        {apiKeys.length === 0 && (
          <div className="no-keys-message">
            <p>No API keys added yet. Add at least one API key to start creating content.</p>
            <p className="text-sm text-gray-600 mt-1">
              Get your API key from{' '}
              <a 
                href="https://makersuite.google.com/app/apikey" 
                target="_blank" 
                rel="noopener noreferrer"
                className="text-blue-600 hover:underline"
              >
                Google AI Studio
              </a>
            </p>
          </div>
        )}
      </div>


    </div>
  );
};

export default ApiKeyManager;

