import { useState } from 'react';
import { motion } from 'framer-motion';
import '../styles/shareModal.css';

function ShareModal({ capsule, onClose, onShare }) {
  const [shareType, setShareType] = useState('link'); // link, social, email
  const [showCopiedMsg, setShowCopiedMsg] = useState(false);
  const [shareLink, setShareLink] = useState('');

  // Gerar link de compartilhamento único
  const generateShareLink = () => {
    const baseUrl = window.location.origin;
    const shareId = btoa(`${capsule.id}-${Date.now()}`);
    return `${baseUrl}/share/${shareId}`;
  };

  const handleGenerateLink = () => {
    const link = generateShareLink();
    setShareLink(link);
  };

  const handleCopyLink = () => {
    navigator.clipboard.writeText(shareLink);
    setShowCopiedMsg(true);
    setTimeout(() => setShowCopiedMsg(false), 2000);
  };

  const handleShareToSocial = (platform) => {
    const text = `Confira minha cápsula temporal: "${capsule.title}"`;
    const url = shareLink || generateShareLink();
    
    const socialLinks = {
      twitter: `https://twitter.com/intent/tweet?text=${encodeURIComponent(text)}&url=${encodeURIComponent(url)}`,
      facebook: `https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(url)}`,
      whatsapp: `https://wa.me/?text=${encodeURIComponent(text)} ${url}`,
      linkedin: `https://www.linkedin.com/sharing/share-offsite/?url=${encodeURIComponent(url)}`
    };

    if (socialLinks[platform]) {
      window.open(socialLinks[platform], '_blank', 'width=600,height=400');
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="share-modal-overlay"
      onClick={onClose}
    >
      <motion.div
        initial={{ scale: 0.9, y: 20 }}
        animate={{ scale: 1, y: 0 }}
        exit={{ scale: 0.9, y: 20 }}
        className="share-modal"
        onClick={(e) => e.stopPropagation()}
      >
        <button className="share-modal-close" onClick={onClose}>
          ×
        </button>

        <div className="share-header">
          <h2>🔗 Compartilhar Cápsula</h2>
          <p className="share-subtitle">{capsule.title}</p>
        </div>

        <div className="share-content">
          {/* Share Type Tabs */}
          <div className="share-tabs">
            <button
              className={`share-tab ${shareType === 'link' ? 'active' : ''}`}
              onClick={() => setShareType('link')}
            >
              🔗 Link Direto
            </button>
            <button
              className={`share-tab ${shareType === 'social' ? 'active' : ''}`}
              onClick={() => setShareType('social')}
            >
              📱 Redes Sociais
            </button>
            <button
              className={`share-tab ${shareType === 'email' ? 'active' : ''}`}
              onClick={() => setShareType('email')}
            >
              ✉️ Email
            </button>
          </div>

          {/* Link Share */}
          {shareType === 'link' && (
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              className="share-section"
            >
              <div className="share-info">
                <p>Crie um link único para compartilhar esta cápsula:</p>
              </div>

              <div className="link-generator">
                {!shareLink ? (
                  <button 
                    className="btn-primary"
                    onClick={handleGenerateLink}
                  >
                    Gerar Link de Compartilhamento
                  </button>
                ) : (
                  <>
                    <div className="link-display">
                      <input 
                        type="text" 
                        value={shareLink} 
                        readOnly
                        className="link-input"
                      />
                      <button 
                        className={`btn-copy ${showCopiedMsg ? 'copied' : ''}`}
                        onClick={handleCopyLink}
                      >
                        {showCopiedMsg ? '✓ Copiado!' : '📋 Copiar'}
                      </button>
                    </div>

                    <div className="link-options">
                      <label className="option-label">
                        <input type="checkbox" defaultChecked />
                        <span>Permitir visualização anônima</span>
                      </label>
                      <label className="option-label">
                        <input type="checkbox" defaultChecked />
                        <span>Mostrar autor da cápsula</span>
                      </label>
                      <label className="option-label">
                        <input type="checkbox" />
                        <span>Permitir comentários</span>
                      </label>
                    </div>
                  </>
                )}
              </div>
            </motion.div>
          )}

          {/* Social Share */}
          {shareType === 'social' && (
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              className="share-section"
            >
              <div className="share-info">
                <p>Compartilhe com seus amigos em redes sociais:</p>
              </div>

              <div className="social-buttons">
                <motion.button
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                  className="social-btn twitter"
                  onClick={() => handleShareToSocial('twitter')}
                >
                  <svg viewBox="0 0 24 24">
                    <path d="M23 3a10.9 10.9 0 01-3.14 1.53 4.48 4.48 0 00-7.86 3v1A10.66 10.66 0 013 4s-4 9 5 13a11.64 11.64 0 01-7 2s9 5 20 5a9.5 9.5 0 00-9-5.5c4.75 2.25 7-7 7-7"/>
                  </svg>
                  <span>Twitter</span>
                </motion.button>

                <motion.button
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                  className="social-btn facebook"
                  onClick={() => handleShareToSocial('facebook')}
                >
                  <svg viewBox="0 0 24 24">
                    <path d="M18 2h-3a6 6 0 00-6 6v3H7v4h2v8h4v-8h3l1-4h-4V8a2 2 0 012-2h3z"/>
                  </svg>
                  <span>Facebook</span>
                </motion.button>

                <motion.button
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                  className="social-btn whatsapp"
                  onClick={() => handleShareToSocial('whatsapp')}
                >
                  <svg viewBox="0 0 24 24">
                    <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.67-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.076 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421-7.403h-.004a9.87 9.87 0 00-4.255.949c.2-.065.862-.175 1.646-.175 1.977 0 3.59.69 3.59 1.543 0 .522-.624 1.075-1.981 1.338m7.6 13.042A11.98 11.98 0 012.839 2.812a11.98 11.98 0 0116.823 16.823c-.598.355-1.226.66-1.879.906z"/>
                  </svg>
                  <span>WhatsApp</span>
                </motion.button>

                <motion.button
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                  className="social-btn linkedin"
                  onClick={() => handleShareToSocial('linkedin')}
                >
                  <svg viewBox="0 0 24 24">
                    <path d="M16 8a6 6 0 016 6v7h-4v-7a2 2 0 00-2-2 2 2 0 00-2 2v7h-4v-7a6 6 0 016-6zM2 9h4v12H2z"/>
                  </svg>
                  <span>LinkedIn</span>
                </motion.button>
              </div>
            </motion.div>
          )}

          {/* Email Share */}
          {shareType === 'email' && (
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              className="share-section"
            >
              <div className="share-info">
                <p>Envie a cápsula por email para seus contatos:</p>
              </div>

              <form className="email-form" onSubmit={(e) => e.preventDefault()}>
                <input 
                  type="email" 
                  placeholder="Email do destinatário"
                  className="email-input"
                />
                <textarea 
                  placeholder="Mensagem (opcional)"
                  className="email-message"
                  rows="3"
                />
                <button className="btn-primary" type="submit">
                  Enviar Email
                </button>
              </form>
            </motion.div>
          )}
        </div>

        <div className="share-footer">
          <p className="privacy-note">
            🔒 Apenas você pode gerenciar quem vê esta cápsula
          </p>
        </div>
      </motion.div>
    </motion.div>
  );
}

export default ShareModal;
