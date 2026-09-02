import React from 'react';

export const Logo: React.FC<{ className?: string }> = ({ className = '' }) => {
  return (
    <div className={`flex items-center select-none ${className}`}>
      {/* 1. MODO DÍA (Light Mode): riverologo.png sin fondo negro, cubriendo todo el ancho */}
      <div className="dark:hidden flex items-center justify-start cursor-pointer hover:opacity-95 transition-opacity py-1">
        <img
          src="/riverologo.png"
          alt="Importadora Rivero"
          className="h-12 md:h-14 w-auto max-w-[260px] md:max-w-[300px] object-contain"
        />
      </div>

      {/* 2. MODO OSCURO (Dark Mode): Logo blanco sin fondo para escenas oscuras */}
      <div className="hidden dark:flex items-center justify-start cursor-pointer hover:opacity-95 transition-opacity py-1">
        <img
          src="/logo-rivero.png"
          alt="Importadora Rivero"
          className="h-12 md:h-14 w-auto max-w-[260px] md:max-w-[300px] object-contain drop-shadow-sm"
        />
      </div>
    </div>
  );
};
