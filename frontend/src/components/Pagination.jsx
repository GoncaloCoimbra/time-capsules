import { useState } from 'react';
import { motion } from 'framer-motion';
import '../styles/pagination.css';

function Pagination({ 
  items, 
  itemsPerPage = 10, 
  renderItem,
  loading = false 
}) {
  const [currentPage, setCurrentPage] = useState(1);

  const totalPages = Math.ceil(items.length / itemsPerPage);
  const startIdx = (currentPage - 1) * itemsPerPage;
  const endIdx = startIdx + itemsPerPage;
  const currentItems = items.slice(startIdx, endIdx);

  const goToPage = (page) => {
    const pageNum = Math.max(1, Math.min(page, totalPages));
    setCurrentPage(pageNum);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  if (items.length === 0) {
    return null;
  }

  return (
    <>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        className="pagination-content"
      >
        {currentItems.map((item, idx) => (
          <motion.div
            key={item.id || idx}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: idx * 0.05 }}
          >
            {renderItem(item)}
          </motion.div>
        ))}
      </motion.div>

      {totalPages > 1 && (
        <div className="pagination-controls">
          <button
            className="pagination-btn pagination-prev"
            onClick={() => goToPage(currentPage - 1)}
            disabled={currentPage === 1}
            title="Página anterior"
          >
            ← Anterior
          </button>

          <div className="pagination-info">
            Página <strong>{currentPage}</strong> de <strong>{totalPages}</strong>
          </div>

          <button
            className="pagination-btn pagination-next"
            onClick={() => goToPage(currentPage + 1)}
            disabled={currentPage === totalPages}
            title="Próxima página"
          >
            Próxima →
          </button>
        </div>
      )}
    </>
  );
}

export default Pagination;
