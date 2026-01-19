import React from 'react';
import { useNavigate } from 'react-router-dom';
import './legal.css';

const Privacy = () => {
  const navigate = useNavigate();

  return (
    <div className="legal-page">
      <div className="legal-container">
        <button className="back-button" onClick={() => navigate(-1)}>Voltar</button>
        
        <header className="legal-header">
          <h1>Politica de Privacidade</h1>
          <p className="last-updated">Ultima atualizacao: Janeiro de 2026</p>
        </header>

        <section className="legal-content">
          <h2>1. Introducao</h2>
          <p>O CodeTime Capsule esta empenhado em proteger a sua privacidade. Esta Politica de Privacidade explica como coletamos, usamos, divulgamos e protegemos os seus dados pessoais.</p>

          <h2>2. Informacoes que Coletamos</h2>
          <p>Podemos coletar as seguintes categorias de informacoes:</p>
          <ul>
            <li><strong>Informacoes de Conta:</strong> Nome, email, data de nascimento, foto de perfil</li>
            <li><strong>Informacoes de Conteudo:</strong> Capsulas, comentarios, reacoes, preferencias</li>
            <li><strong>Informacoes de Dispositivo:</strong> Tipo de dispositivo, sistema operativo, navegador, endereco IP</li>
            <li><strong>Informacoes de Utilizacao:</strong> Paginas visitadas, tempo gasto, cliques, interacoes</li>
            <li><strong>Informacoes de Comunicacao:</strong> Mensagens, notificacoes, historico de chat</li>
          </ul>

          <h2>3. Como Usamos as Suas Informacoes</h2>
          <p>Utilizamos os seus dados para:</p>
          <ul>
            <li>Fornecer e melhorar o servico</li>
            <li>Autenticar a sua conta e processar transacoes</li>
            <li>Enviar notificacoes e atualizacoes</li>
            <li>Personalizar a sua experiencia</li>
            <li>Detectar fraude e atividades suspeitas</li>
            <li>Cumprir com obrigacoes legais</li>
            <li>Analise e pesquisa de produtos</li>
          </ul>

          <h2>4. Partilha de Dados</h2>
          <p>Nao vendemos os seus dados pessoais. Podemos partilhar dados com:</p>
          <ul>
            <li><strong>Prestadores de Servicos:</strong> Alojamento, email, analise (com acordos de protecao)</li>
            <li><strong>Autoridades Legais:</strong> Quando obrigados por lei</li>
            <li><strong>Outros Utilizadores:</strong> Apenas o conteudo que escolhe partilhar publicamente</li>
          </ul>

          <h2>5. Cookies e Tecnologias de Rastreamento</h2>
          <p>Utilizamos cookies e tecnologias semelhantes para:</p>
          <ul>
            <li>Manter a sua sessao ativa</li>
            <li>Lembrar preferencias</li>
            <li>Melhorar a experiencia do utilizador</li>
            <li>Analise e publicidade</li>
          </ul>
          <p>Pode controlar as configuracoes de cookies nas definicoes do seu navegador.</p>

          <h2>6. Seguranca de Dados</h2>
          <p>Implementamos medidas de seguranca tecnicas, administrativas e fisicas para proteger os seus dados contra acesso nao autorizado, alteracao, divulgacao ou destruicao. Utilizamos encriptacao SSL/TLS e autenticacao multifator.</p>

          <h2>7. Retencao de Dados</h2>
          <p>Retemos os seus dados pessoais enquanto a sua conta estiver ativa ou conforme necessario para fornecer o servico. Pode solicitar a eliminacao dos seus dados a qualquer momento.</p>

          <h2>8. Seus Direitos</h2>
          <p>Tem o direito de:</p>
          <ul>
            <li>Aceder aos seus dados pessoais</li>
            <li>Corrigir ou atualizar dados imprecisos</li>
            <li>Solicitar a eliminacao dos seus dados</li>
            <li>Transferir os seus dados (portabilidade)</li>
            <li>Revogar consentimento para processamento</li>
            <li>Apresentar uma reclamacao a uma autoridade de protecao de dados</li>
          </ul>

          <h2>9. Privacidade de Menores</h2>
          <p>O servico nao e dirigido a criancas menores de 13 anos. Nao coletamos dados de menores sem consentimento parental. Se descobrirmos que coletamos dados de um menor sem consentimento, eliminaremos os dados imediatamente.</p>

          <h2>10. Alteracoes a Esta Politica</h2>
          <p>Podemos atualizar esta Politica de Privacidade periodicamente. Notificar-lo-emos sobre mudancas significativas por email ou pela plataforma.</p>

          <h2>11. Contacto</h2>
          <p>Para questoes sobre privacidade ou para exercer os seus direitos, contacte-nos:</p>
          <p>
            <strong>Email:</strong> privacy@codetimecapsule.com<br />
            <strong>Localizacao:</strong> Portugal
          </p>
        </section>
      </div>
    </div>
  );
};

export default Privacy;