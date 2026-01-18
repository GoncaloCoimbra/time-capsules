import { useState, useEffect, useRef } from 'react';
import { useTranslation } from 'react-i18next';
import { motion, AnimatePresence } from 'framer-motion';

const LanguageSelector = () => {
  const { i18n } = useTranslation();
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef(null);
  const buttonRef = useRef(null);

  const languages = [
    { code: 'en', name: 'English', flag: '🇺🇸', nativeName: 'English' },
    { code: 'pt', name: 'Português', flag: '🇵🇹', nativeName: 'Português' },
    { code: 'es', name: 'Español', flag: '🇪🇸', nativeName: 'Español' },
    { code: 'fr', name: 'Français', flag: '🇫🇷', nativeName: 'Français' },
    { code: 'de', name: 'Deutsch', flag: '🇩🇪', nativeName: 'Deutsch' },
    { code: 'it', name: 'Italiano', flag: '🇮🇹', nativeName: 'Italiano' },
    { code: 'ja', name: '日本語', flag: '🇯🇵', nativeName: '日本語' },
    { code: 'zh', name: '中文', flag: '🇨🇳', nativeName: '中文' }
  ];

  const currentLanguage = languages.find(l => l.code === i18n.language) || languages[0];

  const changeLanguage = (lng) => {
    i18n.changeLanguage(lng);
    setIsOpen(false);
    
    // Atualiza o idioma do documento
    document.documentElement.lang = lng;
    
    // Salva preferência
    localStorage.setItem('preferredLanguage', lng);
  };

  // Fecha o dropdown ao clicar fora
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (dropdownRef.current && 
          buttonRef.current && 
          !dropdownRef.current.contains(event.target) && 
          !buttonRef.current.contains(event.target)) {
        setIsOpen(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, []);

  // Configura atributos de prevenção de tradução na inicialização
  useEffect(() => {
    // Adiciona classe notranslate ao HTML
    document.documentElement.classList.add('notranslate');
    
    // Adiciona meta tag do Google Translate
    let metaGoogle = document.querySelector('meta[name="google"]');
    if (!metaGoogle) {
      metaGoogle = document.createElement('meta');
      metaGoogle.name = 'google';
      metaGoogle.content = 'notranslate';
      document.head.appendChild(metaGoogle);
    }
    
    // Adiciona meta tag adicional para browsers modernos
    let metaTranslate = document.querySelector('meta[http-equiv="content-language"]');
    if (!metaTranslate) {
      metaTranslate = document.createElement('meta');
      metaTranslate.httpEquiv = 'content-language';
      metaTranslate.content = i18n.language;
      document.head.appendChild(metaTranslate);
    }
  }, [i18n.language]);

  return (
    <div className="language-selector notranslate">
      <button 
        ref={buttonRef}
        className="current-language notranslate"
        onClick={() => setIsOpen(!isOpen)}
        aria-label="Selecionar idioma"
        aria-expanded={isOpen}
        aria-haspopup="true"
      >
        <span className="flag notranslate" aria-hidden="true">{currentLanguage.flag}</span>
        <span className="lang-name notranslate" lang={currentLanguage.code}>
          {currentLanguage.nativeName}
        </span>
        <span className={`arrow notranslate ${isOpen ? 'open' : ''}`} aria-hidden="true">▼</span>
      </button>
      
      <AnimatePresence>
        {isOpen && (
          <motion.div
            ref={dropdownRef}
            initial={{ opacity: 0, y: -10, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -10, scale: 0.95 }}
            transition={{ duration: 0.2 }}
            className="language-dropdown notranslate"
            role="menu"
            aria-label="Opções de idioma"
          >
            {languages.map((lang) => (
              <motion.button
                key={lang.code}
                onClick={() => changeLanguage(lang.code)}
                className={`language-option notranslate ${i18n.language === lang.code ? 'active' : ''}`}
                whileHover={{ scale: 1.02, backgroundColor: 'rgba(226, 183, 20, 0.1)' }}
                whileTap={{ scale: 0.98 }}
                lang={lang.code}
                role="menuitem"
                aria-checked={i18n.language === lang.code}
                tabIndex={0}
                onKeyDown={(e) => {
                  if (e.key === 'Enter' || e.key === ' ') {
                    e.preventDefault();
                    changeLanguage(lang.code);
                  }
                }}
              >
                <span className="flag notranslate" aria-hidden="true">{lang.flag}</span>
                <span className="lang-name notranslate" lang={lang.code}>
                  {lang.nativeName}
                </span>
                {i18n.language === lang.code && (
                  <span className="checkmark notranslate" aria-hidden="true">✓</span>
                )}
              </motion.button>
            ))}
          </motion.div>
        )}
      </AnimatePresence>

      <style>{`
        .language-selector {
          position: relative;
          z-index: 10000 !important;
          min-width: 140px;
        }

        .current-language {
          display: flex;
          align-items: center;
          gap: 8px;
          cursor: pointer;
          padding: 10px 16px;
          background: rgba(226, 183, 20, 0.1);
          backdrop-filter: blur(10px);
          border-radius: 12px;
          border: 1px solid rgba(226, 183, 20, 0.2);
          color: #e2b714;
          font-size: 14px;
          font-weight: 500;
          transition: all 0.3s ease;
          width: 100%;
          position: relative;
          z-index: 10001;
        }

        .current-language:hover {
          background: rgba(226, 183, 20, 0.15);
          border-color: rgba(226, 183, 20, 0.4);
          transform: translateY(-1px);
        }

        .language-dropdown {
          position: absolute;
          top: calc(100% + 8px);
          right: 0;
          background: rgba(15, 15, 25, 0.98);
          backdrop-filter: blur(20px);
          border: 1px solid rgba(226, 183, 20, 0.3);
          border-radius: 12px;
          padding: 8px;
          min-width: 200px;
          max-height: 400px;
          overflow-y: auto;
          box-shadow: 
            0 20px 60px rgba(0, 0, 0, 0.5),
            0 0 0 1px rgba(226, 183, 20, 0.2);
          z-index: 10002 !important;
        }

        .language-option {
          width: 100%;
          display: flex;
          align-items: center;
          gap: 12px;
          padding: 12px 16px;
          background: transparent;
          border: none;
          color: #94a3b8;
          border-radius: 8px;
          cursor: pointer;
          text-align: left;
          margin-bottom: 4px;
          transition: all 0.2s ease;
          font-size: 14px;
        }

        .language-option:last-child {
          margin-bottom: 0;
        }

        .language-option:hover {
          background: rgba(226, 183, 20, 0.1);
          color: #e2b714;
        }

        .language-option.active {
          background: rgba(226, 183, 20, 0.2);
          color: #e2b714;
          font-weight: 600;
        }

        .language-option .lang-name {
          flex: 1;
          font-weight: 500;
        }

        .language-option.active .lang-name {
          font-weight: 600;
        }

        .checkmark {
          color: #e2b714;
          font-weight: bold;
          font-size: 16px;
        }

        .arrow {
          transition: transform 0.3s ease;
          font-size: 10px;
        }

        .arrow.open {
          transform: rotate(180deg);
        }

        .flag {
          font-size: 18px;
          line-height: 1;
        }

        /* Prevenir tradução automática */
        .notranslate {
          -webkit-user-select: none;
          -moz-user-select: none;
          user-select: none;
        }

        /* Scrollbar customizada para o dropdown */
        .language-dropdown::-webkit-scrollbar {
          width: 6px;
        }

        .language-dropdown::-webkit-scrollbar-track {
          background: rgba(30, 41, 59, 0.3);
          border-radius: 3px;
        }

        .language-dropdown::-webkit-scrollbar-thumb {
          background: rgba(226, 183, 20, 0.3);
          border-radius: 3px;
        }

        .language-dropdown::-webkit-scrollbar-thumb:hover {
          background: rgba(226, 183, 20, 0.5);
        }

        /* Light mode */
        body.light-mode .current-language {
          background: rgba(180, 83, 9, 0.1);
          border-color: rgba(180, 83, 9, 0.2);
          color: #b45309;
        }

        body.light-mode .current-language:hover {
          background: rgba(180, 83, 9, 0.15);
          border-color: rgba(180, 83, 9, 0.4);
        }

        body.light-mode .language-dropdown {
          background: rgba(255, 255, 255, 0.98);
          border: 1px solid rgba(180, 83, 9, 0.2);
          box-shadow: 
            0 10px 40px rgba(0, 0, 0, 0.1),
            0 0 0 1px rgba(180, 83, 9, 0.1);
        }

        body.light-mode .language-option {
          color: #666666;
        }

        body.light-mode .language-option:hover {
          background: rgba(180, 83, 9, 0.1);
          color: #b45309;
        }

        body.light-mode .language-option.active {
          background: rgba(180, 83, 9, 0.15);
          color: #b45309;
        }

        body.light-mode .checkmark {
          color: #b45309;
        }

        /* Acessibilidade - foco visível */
        .language-option:focus-visible {
          outline: 2px solid #e2b714;
          outline-offset: 2px;
        }

        body.light-mode .language-option:focus-visible {
          outline-color: #b45309;
        }
      `}</style>
    </div>
  );
};

export default LanguageSelector;