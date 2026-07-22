import { useState } from 'react';

export function useDraggableList(
  onReorder: (startIndex: number, endIndex: number) => void,
) {
  const [draggedIndex, setDraggedIndex] = useState<number | null>(null);

  const getDragProps = (index: number) => ({
    draggable: true,
    onDragStart: (e: React.DragEvent) => {
      setDraggedIndex(index);
      e.dataTransfer.effectAllowed = 'move';
    },
    onDragOver: (e: React.DragEvent) => {
      e.preventDefault();
    },
    onDragEnter: (e: React.DragEvent) => {
      e.preventDefault();
      if (draggedIndex !== null && draggedIndex !== index) {
        onReorder(draggedIndex, index);
        setDraggedIndex(index);
      }
    },
    onDrop: (e: React.DragEvent) => {
      e.preventDefault();
      setDraggedIndex(null);
    },
  });

  return {
    draggedIndex,
    getDragProps,
  };
}
