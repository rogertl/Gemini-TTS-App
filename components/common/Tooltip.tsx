import React, { ReactNode } from 'react';

interface TooltipProps {
  id: string;
  content: ReactNode;
  show: boolean;
  className?: string;
  style?: React.CSSProperties;
}

const Tooltip: React.FC<TooltipProps> = ({ id, content, show, className = '', style }) => {
  if (!show) return null;

  return (
    <div
      id={id}
      role="tooltip"
      className={`absolute z-10 w-64 p-3 mt-1 text-sm text-gray-700 bg-white rounded-lg shadow-lg border border-gray-200 ${className}`}
      style={{ top: '100%', left: '0', ...style }}
    >
      {content}
    </div>
  );
};

export default Tooltip;