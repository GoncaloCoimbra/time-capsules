import React from 'react';
import { useNavigate } from 'react-router-dom';
import './legal.css';

const Terms = () => {
  const navigate = useNavigate();

  return (
    <div className="legal-page">
      <div className="legal-container">
        <button className="back-button" onClick={() => navigate(-1)}>Voltar</button>
        
        <header className="legal-header">
          <h1>Termos de Servico</h1>
          <p className="last-updated">Ultima atualizacao: Janeiro de 2026</p>
        </header>

        <section className="legal-content">
          <h2>1. Aceitacao dos Termos</h2>
          <p>Ao aceder e utilizar o CodeTime Capsule, concorda em estar vinculado(a) por estes Termos de Servico. Se nao concorda com qualquer parte destes termos, nao deve utilizar a plataforma.</p>

          <h2>2. Descricao do Servico</h2>
          <p>O CodeTime Capsule e uma plataforma que permite aos utilizadores criar, organizar e partilhar capsulas de tempo digitais. O servico inclui funcionalidades de autenticacao, armazenamento de conteudo, comunidades e notificacoes personalizadas.</p>

          <h2>3. Conta de Utilizador</h2>
          <p>Ao criar uma conta, concorda em:</p>
          <ul>
            <li>Fornecer informacoes precisas e completas</li>
            <li>Manter a confidencialidade da sua palavra-passe</li>
            <li>Ser responsavel por todas as atividades na sua conta</li>
            <li>Notificar-nos imediatamente de qualquer acesso nao autorizado</li>
          </ul>

          <h2>4. Conteudo do Utilizador</h2>
          <p>Voce retém todos os direitos sobre o conteudo que carrega. Ao submeter conteudo, concede-nos uma licenca para armazenar, processar e apresentar esse conteudo conforme necessario para operar o servico.</p>
          <p>Voce declara que o seu conteudo:</p>
          <ul>
            <li>E original ou que tem permissao para o utilizar</li>
            <li>Nao viola direitos autorais ou propriedade intelectual</li>
            <li>Nao contem malware, virus ou codigo prejudicial</li>
            <li>Cumpre com todas as leis aplicaveis</li>
          </ul>

          <h2>5. Proibicoes</h2>
          <p>Concorda em nao:</p>
          <ul>
            <li>Usar a plataforma para atividades ilegais</li>
            <li>Assediar, ameacar ou intimidar outros utilizadores</li>
            <li>Spam, phishing ou distribuir malware</li>
            <li>Tentar aceder a contas de outros utilizadores ou sistemas</li>
            <li>Reproduzir, modificar ou distribuir conteudo sem permissao</li>
            <li>Usar bots ou scraping automatizado</li>
          </ul>

          <h2>6. Isencao de Responsabilidade</h2>
          <p>O servico e fornecido "tal como esta" sem garantias. Nao garantimos que o servico sera ininterrupto, seguro ou isento de erros. Nao somos responsaveis por danos indiretos, incidentais ou consequentes.</p>

          <h2>7. Limitacao de Responsabilidade</h2>
          <p>A nossa responsabilidade total nao excede o valor que pagou (se houver) nos ultimos 12 meses pelo servico.</p>

          <h2>8. Suspensao ou Cancelamento</h2>
          <p>Podemos suspender ou cancelar a sua conta se violar estes termos. Tera a oportunidade de recuperar o seu conteudo dentro de 30 dias antes da eliminacao permanente.</p>

          <h2>9. Modificacoes dos Termos</h2>
          <p>Reservamos o direito de modificar estes termos a qualquer momento. Notificar-lo-emos sobre mudancas significativas por email ou na plataforma.</p>

          <h2>10. Lei Aplicavel</h2>
          <p>Estes termos sao regidos pelas leis de Portugal. Qualquer disputa sera resolvida nos tribunais de Lisboa.</p>

          <h2>11. Contacto</h2>
          <p>Se tiver questoes sobre estes Termos de Servico, contacte-nos em: support@codetimecapsule.com</p>
        </section>
      </div>
    </div>
  );
};

export default Terms;