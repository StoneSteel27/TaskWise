import React, { useState } from 'react';
import { Submission } from '../../types';
import StudentSubmissionCard from './StudentSubmissionCard';

interface SubmissionsListProps {
  submissions: Submission[];
  onApprove: (rollNumber: string, grade: string, remarks?: string) => void;
  onReject: (rollNumber: string, reason: string) => void;
  courseId: string;
  taskId: string;
}

type FilterStatus = 'ALL' | 'PENDING' | 'SUBMITTED' | 'APPROVED' | 'DELAYED';

const SubmissionsList: React.FC<SubmissionsListProps> = ({ submissions, onApprove, onReject, courseId, taskId }) => {
  const [filter, setFilter] = useState<FilterStatus>('ALL');

  const filteredSubmissions = submissions.filter(s => {
    if (filter === 'ALL') return true;
    return s.status === filter;
  });

  const renderTabs = () => {
    const tabs: { label: string; value: FilterStatus }[] = [
      { label: 'All', value: 'ALL' },
      { label: 'Submitted', value: 'SUBMITTED' },
      { label: 'Delayed', value: 'DELAYED' },
      { label: 'Approved', value: 'APPROVED' },
      { label: 'Pending', value: 'PENDING' },
    ];

    return (
      <div className="flex border-b mb-4">
        {tabs.map(tab => (
          <button
            key={tab.value}
            onClick={() => setFilter(tab.value)}
            className={`px-2 py-2 text-sm font-medium ${
              filter === tab.value
                ? 'border-b-2 border-blue-600 text-blue-600'
                : 'text-gray-500 hover:text-gray-700'
            }`}
          >
            {tab.label} ({tab.value === 'ALL' ? submissions.length : submissions.filter(s => s.status === tab.value).length})
          </button>
        ))}
      </div>
    );
  };

  return (
    <div className="bg-gray-50 p-3 rounded-lg">
      <h3 className="text-md font-bold mb-4">Submissions</h3>
      {renderTabs()}
      <div className="space-y-1 overflow-y-auto max-h-96">
        {filteredSubmissions.length > 0 ? (
          filteredSubmissions.map(sub => (
            <StudentSubmissionCard 
              key={sub.student_roll_number} 
              submission={sub} 
              onApprove={onApprove} 
              onReject={onReject}
              courseId={courseId}
              taskId={taskId}
            />
          ))
        ) : (
          <p className="text-center text-gray-500 py-8">No submissions in this category.</p>
        )}
      </div>
    </div>
  );
};

export default SubmissionsList;
