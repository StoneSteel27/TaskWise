
import React, { useState } from 'react';
import { Submission } from '../../types';
import { useModalBackButton } from '../../utils/useModalBackButton';

interface ApprovalModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (grade: string, remarks?: string) => void;
  submission: Submission;
  isSubmitting: boolean;
}

const ApprovalModal: React.FC<ApprovalModalProps> = ({ isOpen, onClose, onSubmit, submission, isSubmitting }) => {
  const [grade, setGrade] = useState<'S' | 'A' | 'B' | 'C' | 'D'>('A');
  const [remarks, setRemarks] = useState('');
  const [isClosing, setIsClosing] = useState(false);

  useModalBackButton(isOpen, handleClose);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSubmit(grade, remarks);
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
      className={`fixed inset-0 bg-black bg-opacity-50 z-50 flex justify-center items-center transition-opacity duration-300 ${
        isOpen && !isClosing ? 'opacity-100' : 'opacity-0'
      }`}
    >
      <div
        className={`bg-white rounded-lg p-6 w-full max-w-md transform transition-transform duration-300 ${
          isOpen && !isClosing ? 'scale-100' : 'scale-95'
        }`}
      >
        <h2 className="text-xl font-bold mb-4">Approve Submission for {submission.student_name}</h2>
        <form onSubmit={handleSubmit}>
          <div className="mb-4">
            <label htmlFor="grade" className="block text-sm font-medium text-gray-700">Grade</label>
            <select
              id="grade"
              value={grade}
              onChange={(e) => setGrade(e.target.value as 'S' | 'A' | 'B' | 'C' | 'D')}
              className="mt-1 block w-full pl-3 pr-10 py-2 text-base border-gray-300 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm rounded-md"
            >
              <option>S</option>
              <option>A</option>
              <option>B</option>
              <option>C</option>
              <option>D</option>
            </select>
          </div>
          <div className="mb-4">
            <label htmlFor="remarks" className="block text-sm font-medium text-gray-700">Remarks (Optional)</label>
            <textarea
              id="remarks"
              rows={3}
              value={remarks}
              onChange={(e) => setRemarks(e.target.value)}
              className="mt-1 block w-full shadow-sm sm:text-sm border-gray-300 rounded-md"
            />
          </div>
          <div className="flex justify-end gap-4">
            <button type="button" onClick={handleClose} className="px-4 py-2 bg-gray-200 rounded-md">Cancel</button>
            <button type="submit" disabled={isSubmitting} className="px-4 py-2 bg-green-600 text-white rounded-md disabled:bg-gray-400">
              {isSubmitting ? 'Approving...' : 'Approve'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default ApprovalModal;
