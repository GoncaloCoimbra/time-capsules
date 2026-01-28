import React from 'react';
import '../styles/skeleton.css';

/**
 * Componentes de Skeleton Loader
 * 
 * Esqueletos de carregamento para melhorar a experiência percebida.
 * Mostram placeholders animados enquanto o conteúdo carrega,
 * reduzindo a sensação de lentidão da aplicação.
 * 
 * Componentes disponíveis:
 * - SkeletonLoader: Esqueleto genérico e configurável
 * - CapsuleCardSkeleton: Esqueleto para card de cápsula
 * - CapsulesGridSkeleton: Grade com múltiplos cards
 * - ListItemSkeleton: Item para listas
 * - ProfileSkeleton: Perfil de utilizador
 * - ChartSkeleton: Gráfico/chart
 * - TableSkeleton: Tabela com múltiplas linhas
 */

/**
 * Esqueleto genérico e reutilizável
 * @param {string} width - Largura do elemento
 * @param {string} height - Altura do elemento
 * @param {boolean} circle - Se true, cria um círculo (para avatares)
 */
export function SkeletonLoader({ width = '100%', height = '20px', circle = false }) {
  return (
    <div 
      className="skeleton"
      style={{ 
        width, 
        height,
        // Aplica borderRadius de 50% para círculos, 8px para cantos arredondados
        borderRadius: circle ? '50%' : '8px'
      }}
    />
  );
}

/**
 * Esqueleto para card de cápsula
 * Simula a estrutura: avatar + texto do header + conteúdo + footer com botões
 */
export function CapsuleCardSkeleton() {
  return (
    <div className="skeleton-capsule-card">
      {/* Header: avatar + nome + data */}
      <div className="skeleton-header">
        <SkeletonLoader width="40px" height="40px" circle />
        <div className="skeleton-header-text">
          <SkeletonLoader width="120px" height="16px" />
          <SkeletonLoader width="80px" height="12px" />
        </div>
      </div>
      
      {/* Conteúdo principal */}
      <SkeletonLoader width="100%" height="60px" />
      
      {/* Footer: botões de ação */}
      <div className="skeleton-footer">
        <SkeletonLoader width="60px" height="24px" />
        <SkeletonLoader width="80px" height="24px" />
      </div>
    </div>
  );
}

/**
 * Grade com múltiplos esqueletos de cápsula
 * @param {number} count - Número de cards a mostrar (padrão: 6)
 */
export function CapsulesGridSkeleton({ count = 6 }) {
  return (
    <div className="skeleton-grid">
      {Array.from({ length: count }).map((_, i) => (
        <CapsuleCardSkeleton key={i} />
      ))}
    </div>
  );
}

// List Item Skeleton
/**
 * Esqueleto para item de lista
 * Simula: avatar + conteúdo + botão de ação
 */
export function ListItemSkeleton() {
  return (
    <div className="skeleton-list-item">
      {/* Avatar circular */}
      <SkeletonLoader width="40px" height="40px" circle />
      
      {/* Texto do item (título + subtítulo) */}
      <div className="skeleton-list-content">
        <SkeletonLoader width="60%" height="16px" />
        <SkeletonLoader width="40%" height="12px" />
      </div>
      
      {/* Botão ou ação */}
      <SkeletonLoader width="60px" height="20px" />
    </div>
  );
}

/**
 * Esqueleto para perfil de utilizador
 * Simula: avatar + nome + bio + 3 estatísticas
 */
export function ProfileSkeleton() {
  return (
    <div className="skeleton-profile">
      {/* Avatar grande */}
      <SkeletonLoader width="100px" height="100px" circle />
      
      {/* Nome e biografia */}
      <SkeletonLoader width="150px" height="24px" />
      <SkeletonLoader width="200px" height="16px" />
      
      {/* Estatísticas (ex: cápsulas criadas, seguidores) */}
      <div className="skeleton-stats">
        {Array.from({ length: 3 }).map((_, i) => (
          <div key={i}>
            <SkeletonLoader width="80px" height="24px" />
            <SkeletonLoader width="60px" height="12px" />
          </div>
        ))}
      </div>
    </div>
  );
}

// Chart Skeleton
/**
 * Esqueleto para gráficos/charts
 * Simula 12 barras com alturas aleatórias para um efeito realista
 */
export function ChartSkeleton() {
  return (
    <div className="skeleton-chart">
      <div className="skeleton-bars">
        {/* Cria 12 barras com alturas aleatórias */}
        {Array.from({ length: 12 }).map((_, i) => (
          <SkeletonLoader 
            key={i} 
            width="100%" 
            height={`${Math.random() * 60 + 20}px`}
          />
        ))}
      </div>
    </div>
  );
}

// Table Skeleton
/**
 * Esqueleto para tabelas
 * @param {number} rows - Número de linhas (padrão: 5)
 * @param {number} cols - Número de colunas (padrão: 4)
 */
export function TableSkeleton({ rows = 5, cols = 4 }) {
  return (
    <div className="skeleton-table">
      {/* Gera linhas com múltiplas colunas */}
      {Array.from({ length: rows }).map((_, i) => (
        <div key={i} className="skeleton-table-row">
          {Array.from({ length: cols }).map((_, j) => (
            <SkeletonLoader key={j} width="100%" height="20px" />
          ))}
        </div>
      ))}
    </div>
  );
}

export default SkeletonLoader;
