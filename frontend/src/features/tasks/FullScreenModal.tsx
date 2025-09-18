import React, { useState } from 'react';
import { X } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { Course } from '../../types';
import CourseDashboardHeader from '../dashboard/CourseDashboardHeader';
import { useModalBackButton } from '../../utils/useModalBackButton';

interface FullScreenModalProps {
  children: React.ReactNode;
  title: string;
  course?: Course | null;
  statusComponent?: React.ReactNode;
  isOpen: boolean;
  onClose: () => void;
}

const FullScreenModal: React.FC<FullScreenModalProps> = ({ children, title, course, statusComponent, isOpen, onClose }) => {
  const [isClosing, setIsClosing] = useState(false);
  const navigate = useNavigate();

  useModalBackButton(isOpen, handleClose);

  function handleClose() {
    setIsClosing(true);
    setTimeout(() => {
      onClose();
      setIsClosing(false);
    }, 300); // Animation duration
  }

  if (!isOpen) return null;

  return (
    <div 
      className={`fixed inset-0 bg-black bg-opacity-50 z-50 transition-opacity duration-300 flex justify-center md:items-center ${
        isOpen && !isClosing ? 'opacity-100' : 'opacity-0'
      }`}
      onClick={handleClose}
    >
      <div 
        className={`
          bg-white shadow-xl transform transition-transform md:transition-all duration-300 ease-in-out
          w-full h-full md:h-auto md:max-h-[90vh] md:max-w-4xl md:rounded-lg
          flex flex-col
          ${
            isOpen && !isClosing
              ? 'translate-y-0 md:scale-100 md:opacity-100'
              : 'translate-y-full md:translate-y-0 md:scale-95 md:opacity-0'
          }
        `}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Mobile Header */}
        <div className="md:hidden">
          {course && <CourseDashboardHeader course={course} />}
          <div className="bg-white shadow-sm p-4 flex items-center justify-center relative h-16">
            <button onClick={handleClose} className="absolute left-4 p-2">
              <X className="w-6 h-6" />
            </button>
            <h2 className="text-lg font-bold">{title}</h2>
            <div className="absolute right-4">
              {statusComponent}
            </div>
          </div>
        </div>

        {/* Desktop Header */}
        <div className="hidden md:flex justify-between items-center p-4 border-b">
          <h2 className="text-xl font-bold">{title}</h2>
          <div className="flex items-center gap-4">
            {statusComponent}
          </div>
        </div>

        {/* Content */}
        <div className="p-4 overflow-y-auto flex-1">
          {children}
        </div>
      </div>
    </div>
  );
};

export default FullScreenModal;
