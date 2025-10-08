import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import X from 'lucide-react/dist/esm/icons/x';
import UserCheck from 'lucide-react/dist/esm/icons/user-check';
import Edit from 'lucide-react/dist/esm/icons/edit';
import { useModalBackButton } from '../../utils/useModalBackButton';

interface AttendanceMenuModalProps {
  isOpen: boolean;
  onClose: () => void;
}

const AttendanceMenuModal: React.FC<AttendanceMenuModalProps> = ({ isOpen, onClose }) => {
  const navigate = useNavigate();
  const [isClosing, setIsClosing] = useState(false);

  useModalBackButton(isOpen, handleClose);

  const handleNavigate = (path: string) => {
    navigate(path);
    handleClose();
  };

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
      className={`fixed inset-0 bg-black bg-opacity-60 z-50 flex justify-center items-center p-4 transition-opacity duration-300 ${
        isOpen && !isClosing ? 'opacity-100' : 'opacity-0'
      }`}
      onClick={handleClose}
    >
      <div
        className={`bg-white rounded-2xl shadow-xl w-full max-w-sm transform transition-transform duration-300 ${
          isOpen && !isClosing ? 'scale-100' : 'scale-95'
        }`}
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex justify-between items-center p-4 border-b border-gray-200">
          <h2 className="text-lg font-semibold">Attendance Options</h2>
          <button onClick={handleClose} className="p-2 rounded-full hover:bg-gray-100">
            <X className="w-5 h-5" />
          </button>
        </div>
        <div className="p-4">
          <ul className="space-y-3">
            <li>
              <button 
                onClick={() => handleNavigate('/my-attendance')} 
                className="w-full flex items-center gap-4 p-4 rounded-lg text-left text-gray-700 hover:bg-blue-50 hover:text-blue-600 transition-colors duration-200">
                <UserCheck className="w-6 h-6 text-blue-500" />
                <div>
                  <p className="font-bold">My Attendance</p>
                  <p className="text-sm text-gray-500">Check-in or Check-out</p>
                </div>
              </button>
            </li>
            <li>
              <button 
                onClick={() => handleNavigate('/mark-attendance')} 
                className="w-full flex items-center gap-4 p-4 rounded-lg text-left text-gray-700 hover:bg-green-50 hover:text-green-600 transition-colors duration-200">
                <Edit className="w-6 h-6 text-green-500" />
                <div>
                  <p className="font-bold">Mark Student Attendance</p>
                  <p className="text-sm text-gray-500">Take attendance for your homeroom</p>
                </div>
              </button>
            </li>
          </ul>
        </div>
      </div>
    </div>
  );
};

export default AttendanceMenuModal;
