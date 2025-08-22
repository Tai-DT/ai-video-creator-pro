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

      <style jsx>{`
        .language-manager {
          position: relative;
          display: inline-block;
        }

        .language-selector {
          position: relative;
        }

        .language-button {
          display: flex;
          align-items: center;
          gap: 8px;
          padding: 8px 12px;
          background: rgba(255, 255, 255, 0.1);
          border: 1px solid rgba(255, 255, 255, 0.2);
          border-radius: 6px;
          color: white;
          cursor: pointer;
          font-size: 14px;
          transition: all 0.2s ease;
        }

        .language-button:hover {
          background: rgba(255, 255, 255, 0.2);
        }

        .language-flag {
          font-size: 16px;
        }

        .language-name {
          font-weight: 500;
        }

        .language-arrow {
          font-size: 12px;
          transition: transform 0.2s ease;
        }

        .language-dropdown {
          position: absolute;
          top: 100%;
          left: 0;
          right: 0;
          background: rgba(0, 0, 0, 0.9);
          border: 1px solid rgba(255, 255, 255, 0.2);
          border-radius: 6px;
          padding: 4px;
          margin-top: 4px;
          z-index: 1000;
          min-width: 200px;
        }

        .language-option {
          display: flex;
          align-items: center;
          gap: 8px;
          width: 100%;
          padding: 8px 12px;
          background: transparent;
          border: none;
          color: white;
          cursor: pointer;
          font-size: 14px;
          text-align: left;
          transition: background 0.2s ease;
        }

        .language-option:hover {
          background: rgba(255, 255, 255, 0.1);
        }

        .language-option.active {
          background: rgba(76, 175, 80, 0.2);
          color: #4CAF50;
        }

        .language-option .language-flag {
          font-size: 16px;
        }

        .language-option .language-name {
          font-weight: 500;
        }
      `}</style>
    </div>
  );
};

export default LanguageManager;
