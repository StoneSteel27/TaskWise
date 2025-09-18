import React, { useState } from 'react';
import { Submission } from '../../types';
import { Check, Download, X, ChevronDown } from 'lucide-react';
import { apiService } from '../../services/api.provider';
import RejectSubmissionModal from './RejectSubmissionModal';
import ApprovalModal from './ApprovalModal';
import { showSuccessToast, showErrorToast } from '../../utils/notifications';

interface StudentSubmissionCardProps {
  submission: Submission;
  courseId: string;
  taskId: string;
  onStatusChange: () => void;
}

const StudentSubmissionCard: React.FC<StudentSubmissionCardProps> = ({ submission, courseId, taskId, onStatusChange }) => {
  const [isExpanded, setIsExpanded] = useState(false);
  const [isRejectModalOpen, setIsRejectModalOpen] = useState(false);
  const [isApproveModalOpen, setIsApproveModalOpen] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleDownload = async (e: React.MouseEvent) => {
    e.stopPropagation(); // Prevent card from toggling
    try {
      const { blob, filename } = await apiService.downloadStudentSubmission(courseId, taskId, submission.student_roll_number);
      const link = document.createElement('a');
      link.href = window.URL.createObjectURL(blob);
      link.download = filename;
      document.body.appendChild(link);
      link.click();
      link.remove();
      window.URL.revokeObjectURL(link.href);
    } catch (error) {
      showErrorToast('Download failed.');
      console.error("Download failed", error);
    }
  };

  const handleRejectSubmit = async (reason: string) => {
    setIsSubmitting(true);
    try {
      await apiService.rejectSubmission(courseId, taskId, submission.student_roll_number, reason);
      showSuccessToast('Submission rejected.');
      onStatusChange();
    } catch (err) {
      showErrorToast('Failed to reject submission.');
    } finally {
      setIsSubmitting(false);
      setIsRejectModalOpen(false);
    }
  };

  const handleApproveSubmit = async (grade: string, remarks?: string) => {
    setIsSubmitting(true);
    try {
      await apiService.approveSubmission(courseId, taskId, submission.student_roll_number, grade, remarks);
      showSuccessToast('Submission approved!');
      onStatusChange();
    } catch (err) {
      showErrorToast('Failed to approve submission.');
    } finally {
      setIsSubmitting(false);
      setIsApproveModalOpen(false);
    }
  };

  const getStatusChip = (status: Submission['status']) => {
    const baseClasses = "px-2 py-1 text-xs font-semibold rounded-full inline-flex items-center";
    switch (status) {
      case 'PENDING':
        return <span className={`${baseClasses} bg-gray-200 text-gray-800`}>Not Submitted</span>;
      case 'SUBMITTED':
        return <span className={`${baseClasses} bg-blue-100 text-blue-800`}>Submitted</span>;
      case 'DELAYED':
        return <span className={`${baseClasses} bg-orange-100 text-orange-800`}>Delayed</span>;
      case 'APPROVED':
        return <span className={`${baseClasses} bg-green-100 text-green-800`}>Approved</span>;
      default:
        return null;
    }
  };

  const canBeGraded = submission.status === 'SUBMITTED' || submission.status === 'DELAYED';

  return (
    <>
      <div 
        className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden"
        onClick={() => setIsExpanded(!isExpanded)}
      >
        {/* Collapsed View */}
        <div className="flex items-center justify-between p-3 cursor-pointer">
          <div className="flex items-center gap-3">
            <img src={submission.profile_picture_url} alt={submission.student_name} className="w-10 h-10 rounded-full object-cover" />
            <div>
              <p className="font-semibold text-base">{submission.student_name}</p>
              <p className="text-sm text-gray-500">{submission.student_roll_number}</p>
            </div>
          </div>
          <div className="flex items-center gap-3">
            {getStatusChip(submission.status)}
            <ChevronDown className={`w-5 h-5 text-gray-400 transition-transform ${isExpanded ? 'rotate-180' : ''}`} />
          </div>
        </div>

        {/* Expanded View */}
        {isExpanded && (
          <div className="px-3 pb-3 border-t border-gray-200">
            <div className="text-sm text-gray-600 mt-3">
              <p><strong>Submitted At:</strong> {submission.submitted_at ? new Date(submission.submitted_at).toLocaleString() : 'N/A'}</p>
              {submission.status === 'APPROVED' && (
                <div className="mt-2 p-2 bg-green-50 rounded-md">
                  <p><strong>Grade:</strong> {submission.grade}</p>
                  {submission.remarks && <p><strong>Remarks:</strong> {submission.remarks}</p>}
                </div>
              )}
            </div>
            
            <div className="flex items-center justify-end gap-2 mt-4">
              {(submission.status !== 'PENDING') && (
                <button
                  onClick={handleDownload}
                  className="p-2 flex items-center gap-1 text-sm bg-gray-100 rounded-md hover:bg-gray-200"
                  title="Download Submission"
                >
                  <Download className="w-4 h-4" />
                  <span>Download</span>
                </button>
              )}
              {canBeGraded && (
                <>
                  <button 
                    onClick={(e) => { e.stopPropagation(); setIsApproveModalOpen(true); }}
                    className="p-2 flex items-center gap-1 text-sm bg-green-500 text-white rounded-md hover:bg-green-600"
                    title="Approve Submission"
                  >
                    <Check className="w-4 h-4" />
                    <span>Approve</span>
                  </button>
                  <button 
                    onClick={(e) => { e.stopPropagation(); setIsRejectModalOpen(true); }}
                    className="p-2 flex items-center gap-1 text-sm bg-red-500 text-white rounded-md hover:bg-red-600"
                    title="Reject Submission"
                  >
                    <X className="w-4 h-4" />
                    <span>Reject</span>
                  </button>
                </>
              )}
            </div>
          </div>
        )}
      </div>

      {/* Modals */}
      <RejectSubmissionModal
        isOpen={isRejectModalOpen}
        onClose={() => setIsRejectModalOpen(false)}
        onSubmit={handleRejectSubmit}
        isSubmitting={isSubmitting}
      />
      <ApprovalModal
        isOpen={isApproveModalOpen}
        onClose={() => setIsApproveModalOpen(false)}
        onSubmit={handleApproveSubmit}
        submission={submission}
        isSubmitting={isSubmitting}
      />
    </>
  );
};

export default StudentSubmissionCard;

