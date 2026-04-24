import React from 'react';

interface PdiHeaderProps {
  categoryTitle: string;
}

export const PdiHeader: React.FC<PdiHeaderProps> = ({ categoryTitle }) => {
  return (
    <div className="w-full bg-gray-800 p-4 rounded-t-lg shadow-lg">
      <h1 className="text-4xl font-bold text-center text-white uppercase tracking-wider">
        {categoryTitle}
      </h1>
    </div>
  );
};
