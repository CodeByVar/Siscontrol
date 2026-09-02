import React from 'react';

export const Logo: React.FC<{ className?: string }> = ({ className = '' }) => {
  return (
    <div className={`flex items-center select-none ${className}`}>
      {/* Contenedor del logo con mayor tamaño, presencia visual y bordes elegantes */}
      <div className="h-14 px-4 py-1.5 rounded-2xl bg-black flex items-center justify-center shadow-lg border border-slate-800 dark:border-slate-700/80 hover:scale-[1.02] transition-transform duration-200 cursor-pointer">
        <img
          src="/logo-rivero.png"
          alt="Importadora Rivero"
          className="h-11 w-auto object-contain max-w-[220px]"
        />
      </div>
    </div>
  );
};
