import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';

interface ApiKeyContextType {
  apiKeys: string[];
  currentApiIndex: number;
  addApiKey: (key: string) => void;
  removeApiKey: (index: number) => void;
  setActiveApiKey: (index: number) => void;
  getActiveApiKey: () => string;
  hasApiKeys: () => boolean;
}

const ApiKeyContext = createContext<ApiKeyContextType | undefined>(undefined);

export const useApiKeys = () => {
  const context = useContext(ApiKeyContext);
  if (context === undefined) {
    throw new Error('useApiKeys must be used within an ApiKeyProvider');
  }
  return context;
};

interface ApiKeyProviderProps {
  children: ReactNode;
}

export const ApiKeyProvider: React.FC<ApiKeyProviderProps> = ({ children }) => {
  const [apiKeys, setApiKeys] = useState<string[]>([]);
  const [currentApiIndex, setCurrentApiIndex] = useState(0);

  // Load API keys from localStorage on mount
  useEffect(() => {
    const savedKeys = localStorage.getItem('aiVideoCreatorApiKeys');
    if (savedKeys) {
      try {
        const parsedKeys = JSON.parse(savedKeys);
        setApiKeys(parsedKeys);
        setCurrentApiIndex(0);
      } catch (error) {
        console.error('Error loading API keys:', error);
      }
    } else {
      // Add default API key if no keys are saved
      const defaultKey = 'YOUR_GOOGLE_AI_API_KEY_HERE';
      setApiKeys([defaultKey]);
      setCurrentApiIndex(0);
    }
  }, []);

  // Save API keys to localStorage whenever they change
  useEffect(() => {
    localStorage.setItem('aiVideoCreatorApiKeys', JSON.stringify(apiKeys));
  }, [apiKeys]);

  const addApiKey = (key: string) => {
    if (!key.trim()) {
      throw new Error('API key cannot be empty');
    }
    
    if (apiKeys.includes(key)) {
      throw new Error('API key already exists');
    }
    
    setApiKeys(prev => [...prev, key.trim()]);
  };

  const removeApiKey = (index: number) => {
    setApiKeys(prev => prev.filter((_, i) => i !== index));
    
    // Adjust current index if necessary
    if (currentApiIndex >= index && currentApiIndex > 0) {
      setCurrentApiIndex(prev => prev - 1);
    }
  };

  const setActiveApiKey = (index: number) => {
    if (index >= 0 && index < apiKeys.length) {
      setCurrentApiIndex(index);
    }
  };

  const getActiveApiKey = (): string => {
    if (apiKeys.length === 0) {
      throw new Error('No API keys available. Please add at least one API key.');
    }
    return apiKeys[currentApiIndex];
  };

  const hasApiKeys = (): boolean => {
    return apiKeys.length > 0;
  };

  const value: ApiKeyContextType = {
    apiKeys,
    currentApiIndex,
    addApiKey,
    removeApiKey,
    setActiveApiKey,
    getActiveApiKey,
    hasApiKeys,
  };

  return (
    <ApiKeyContext.Provider value={value}>
      {children}
    </ApiKeyContext.Provider>
  );
};

