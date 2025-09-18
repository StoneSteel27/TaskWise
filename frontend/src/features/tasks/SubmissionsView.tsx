import React, { useState, useEffect, useRef } from 'react';
import { useParams } from 'react-router-dom';
import { apiService } from '../../services/api.provider';
import { Task, Submission } from '../../types';
import LoadingSpinner from '../../components/LoadingSpinner';
import { Users, Filter as FilterIcon } from 'lucide-react';
import StudentSubmissionCard from './StudentSubmissionCard';
import SearchBar from '../../components/SearchBar';

type FilterStatus = 'ALL' | 'PENDING' | 'SUBMITTED' | 'APPROVED' | 'DELAYED';

const SubmissionsView: React.FC = () => {
  const { courseId, taskId } = useParams<{ courseId: string; taskId: string }>();
  const [task, setTask] = useState<Task | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [filter, setFilter] = useState<FilterStatus>('ALL');
  const [isFilterOpen, setIsFilterOpen] = useState(false);
  const filterRef = useRef<HTMLDivElement>(null);

  const tabs: { label: string; value: FilterStatus }[] = [
    { label: 'All', value: 'ALL' },
    { label: 'Submitted', value: 'SUBMITTED' },
    { label: 'Delayed', value: 'DELAYED' },
    { label: 'Approved', value: 'APPROVED' },
    { label: 'Pending', value: 'PENDING' },
  ];

  useEffect(() => {
    if (courseId && taskId) {
      apiService.getTask(courseId, taskId)
        .then(setTask)
        .finally(() => setIsLoading(false));
    }
  }, [courseId, taskId]);

  // Close filter dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (filterRef.current && !filterRef.current.contains(event.target as Node)) {
        setIsFilterOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [filterRef]);


  const handleSubmissionUpdate = async () => {
    if (courseId && taskId) {
      setIsLoading(true);
      const updatedTask = await apiService.getTask(courseId, taskId);
      setTask(updatedTask);
      setIsLoading(false);
    }
  };

  if (isLoading) {
    return <div className="flex items-center justify-center h-full pt-16"><LoadingSpinner /></div>;
  }

  if (!task) {
    return <div className="text-center p-8">Task not found.</div>;
  }

  const submissions = task.submissions || [];

  const filteredSubmissions = submissions
    .filter(s => {
      if (filter === 'ALL') return true;
      return s.status === filter;
    })
    .filter(s => {
      if (searchTerm === '') return true;
      const lowerSearchTerm = searchTerm.toLowerCase();
      return (
        s.student_name.toLowerCase().includes(lowerSearchTerm) ||
        s.student_roll_number.toLowerCase().includes(lowerSearchTerm)
      );
    });

  const selectedFilterLabel = tabs.find(t => t.value === filter)?.label;

  return (
    <div className="flex flex-col h-full">
      <div className="p-4 bg-white rounded-lg shadow-sm border mb-4 flex-shrink-0">
        <h1 className="text-xl font-bold">Submissions for:</h1>
        <p className="text-lg text-gray-600">{task.title}</p>
      </div>

      <div className="flex items-center gap-2 mb-2 flex-shrink-0">
        <div className="flex-grow">
          <SearchBar onSearch={setSearchTerm} />
        </div>
        
        <div className="relative" ref={filterRef}>
          <button 
            onClick={() => setIsFilterOpen(!isFilterOpen)}
            className="flex items-center gap-2 px-4 py-2 bg-white border rounded-lg shadow-sm text-sm font-medium text-gray-700 hover:bg-gray-50"
          >
            <FilterIcon className="w-4 h-4" />
            <span>{selectedFilterLabel}</span>
          </button>

          {isFilterOpen && (
            <div className="absolute right-0 mt-2 w-48 bg-white rounded-md shadow-lg z-10 border">
              <div className="py-1">
                {tabs.map(tab => (
                  <button
                    key={tab.value}
                    onClick={() => {
                      setFilter(tab.value);
                      setIsFilterOpen(false);
                    }}
                    className={`w-full text-left px-4 py-2 text-sm ${ 
                      filter === tab.value ? 'bg-gray-100 text-gray-900' : 'text-gray-700' 
                    } hover:bg-gray-100`}
                  >
                    {tab.label} ({tab.value === 'ALL' ? submissions.length : submissions.filter(s => s.status === tab.value).length})
                  </button>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>
      
      <div className="flex-1 overflow-y-auto space-y-2 pb-20 pt-2 bg-gray-50">
        {filteredSubmissions.length > 0 ? (
          filteredSubmissions.map(submission => (
            <StudentSubmissionCard
              key={submission.student_roll_number}
              submission={submission}
              courseId={courseId!}
              taskId={taskId!}
              onStatusChange={handleSubmissionUpdate}
            />
          ))
        ) : (
          <div className="text-center py-16 bg-white rounded-lg shadow-sm border">
            <Users className="mx-auto w-12 h-12 text-gray-400" />
            <h3 className="mt-2 text-sm font-medium text-gray-900">No Submissions Found</h3>
            <p className="mt-1 text-sm text-gray-500">Try adjusting your search or filter.</p>
          </div>
        )}
      </div>
    </div>
  );
};

export default SubmissionsView;
