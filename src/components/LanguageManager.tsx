import React, { useState } from 'react';

interface LanguageManagerProps {
  onLanguageChange: (language: string) => void;
  currentLanguage: string;
}

const LanguageManager: React.FC<LanguageManagerProps> = ({ onLanguageChange, currentLanguage }) => {
  const [isOpen, setIsOpen] = useState(false);

  const languages = [
    { code: 'Vietnamese', name: 'Tiếng Việt', flag: '🇻🇳' },
    { code: 'English', name: 'English', flag: '🇺🇸' },
    { code: 'Japanese', name: '日本語', flag: '🇯🇵' },
    { code: 'Vietnamese-English', name: 'Tiếng Việt - English', flag: '🇻🇳🇺🇸' },
    { code: 'Vietnamese-Japanese', name: 'Tiếng Việt - 日本語', flag: '🇻🇳🇯🇵' },
    { code: 'English-Japanese', name: 'English - 日本語', flag: '🇺🇸🇯🇵' },
  ];

  const getCurrentLanguageInfo = () => {
    return languages.find(lang => lang.code === currentLanguage) || languages[0];
  };

  const handleLanguageSelect = (languageCode: string) => {
    onLanguageChange(languageCode);
    setIsOpen(false);
  };

  return (
    <div className="language-manager">
      <div className="language-selector">
        <button
          className="language-button"
          onClick={() => setIsOpen(!isOpen)}
        >
          <span className="language-flag">{getCurrentLanguageInfo().flag}</span>
          <span className="language-name">{getCurrentLanguageInfo().name}</span>
          <span className="language-arrow">▼</span>
        </button>

        {isOpen && (
          <div className="language-dropdown">
            {languages.map((language) => (
              <button
                key={language.code}
                className={`language-option ${currentLanguage === language.code ? 'active' : ''}`}
                onClick={() => handleLanguageSelect(language.code)}
              >
                <span className="language-flag">{language.flag}</span>
                <span className="language-name">{language.name}</span>
              </button>
            ))}
          </div>
        )}
      </div>

    </div>
  );
};

export default LanguageManager;
