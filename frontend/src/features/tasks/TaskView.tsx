import React, { useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Task } from '../../types';
import { apiService } from '../../services/api.provider';
import LoadingSpinner from '../../components/LoadingSpinner';
import { ClipboardCheck, Clock, User as UserIcon, Paperclip, UploadCloud, Download, Edit, Trash2, Users } from 'lucide-react';
import SubmissionsList from './SubmissionsList';
import { useAuth } from '../../context/AuthContext';
import TaskEditModal from './TaskEditModal';
import { useQueryClient } from '@tanstack/react-query';
import { showSuccessToast, showErrorToast } from '../../utils/notifications';

interface TaskViewProps {
  task: Task;
  onTaskUpdate: (updatedTask: Task) => void;
}

const TaskView: React.FC<TaskViewProps> = ({ task: initialTask, onTaskUpdate }) => {
  const {courseId, taskId} = useParams<{ courseId: string; taskId: string }>();
  const {user} = useAuth();
  const navigate = useNavigate();
  const queryClient = useQueryClient();

  const [task, setTask] = useState<Task>(initialTask);
  const [selectedFiles, setSelectedFiles] = useState<File[]>([]);
  const [isUploading, setIsUploading] = useState(false);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);

  const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    if (event.target.files) {
      setSelectedFiles(Array.from(event.target.files));
    }
  };

  const handleUpload = async () => {
    if (selectedFiles.length === 0 || !courseId || !taskId) return;

    setIsUploading(true);
    try {
      const formData = new FormData();
      selectedFiles.forEach(file => {
        formData.append('files', file);
      });

      const response = await apiService.uploadTaskSubmission(courseId, taskId, formData);
      const updatedTask = {
        ...task,
        status: response.new_status,
        submission_attachments: selectedFiles.map(f => f.name)
      };
      setTask(updatedTask);
      onTaskUpdate(updatedTask);
      await queryClient.invalidateQueries({queryKey: ['task', courseId, taskId]});
      await queryClient.invalidateQueries({queryKey: ['course-feed', courseId]});
      showSuccessToast('Submission uploaded successfully!');
    } catch (err: unknown) {
      if (err instanceof Error) {
        showErrorToast(err.message);
      } else {
        showErrorToast('An unknown error occurred.');
      }
    } finally {
      setIsUploading(false);
    }
  };

  const handleApprove = async (studentRollNumber: string, grade: string, remarks?: string) => {
    if (!courseId || !taskId) return;
    try {
      const response = await apiService.approveSubmission(courseId, taskId, studentRollNumber, grade, remarks);
      const updatedSubmissions = task.submissions?.map(sub =>
          sub.student_roll_number === studentRollNumber ? {...sub, status: response.new_status, grade, remarks} : sub
      );
      const updatedTask = {...task, submissions: updatedSubmissions};
      setTask(updatedTask);
      onTaskUpdate(updatedTask);
      showSuccessToast('Submission approved!');
    } catch (err: unknown) {
      if (err instanceof Error) {
        showErrorToast(err.message);
      } else {
        showErrorToast('An unknown error occurred.');
      }
    }
  };

  const handleReject = async (studentRollNumber: string, reason: string) => {
    if (!courseId || !taskId) return;
    try {
      const response = await apiService.rejectSubmission(courseId, taskId, studentRollNumber, reason);
      const updatedSubmissions = task.submissions?.map(sub =>
          sub.student_roll_number === studentRollNumber ? {...sub, status: response.new_status} : sub
      );
      const updatedTask = {...task, submissions: updatedSubmissions};
      setTask(updatedTask);
      onTaskUpdate(updatedTask);
      showSuccessToast('Submission rejected.');
    } catch (err: unknown) {
      if (err instanceof Error) {
        showErrorToast(err.message);
      } else {
        showErrorToast('An unknown error occurred.');
      }
    }
  };

  const handleDownloadSubmission = async (fileName: string) => {
    if (!courseId || !taskId) return;
    try {
      const {blob} = await apiService.downloadMySubmission(courseId, taskId, fileName);
      const link = document.createElement('a');
      link.href = window.URL.createObjectURL(blob);
      link.download = fileName;
      document.body.appendChild(link);
      link.click();
      link.remove();
      window.URL.revokeObjectURL(link.href);
    } catch (err: unknown) {
      if (err instanceof Error) {
        showErrorToast(err.message);
      } else {
        showErrorToast('An unknown error occurred.');
      }
    }
  };

  const handleDeleteSubmission = async () => {
    if (!courseId || !taskId || !window.confirm('Are you sure you want to unsubmit? This will delete all your submitted files.')) return;

    try {
      await apiService.deleteSubmission(courseId, taskId);
      const updatedTask = {...task, status: 'PENDING', submission_attachments: []};
      setTask(updatedTask);
      onTaskUpdate(updatedTask);
      await queryClient.invalidateQueries({queryKey: ['task', courseId, taskId]});
      await queryClient.invalidateQueries({queryKey: ['course-feed', courseId]});
      showSuccessToast('Submission deleted successfully.');
    } catch (err: unknown) {
      if (err instanceof Error) {
        showErrorToast(err.message);
      } else {
        showErrorToast('An unknown error occurred.');
      }
    }
  };

  const handleDeleteSubmittedFile = async (fileName: string) => {
    if (!courseId || !taskId || !window.confirm(`Are you sure you want to delete ${fileName}?`)) return;

    try {
      await apiService.deleteSubmissionFile(courseId, taskId, fileName);
      const updatedTaskData = await apiService.getTask(courseId, taskId);
      setTask(updatedTaskData);
      onTaskUpdate(updatedTaskData);
      await queryClient.invalidateQueries({queryKey: ['task', courseId, taskId]});
      await queryClient.invalidateQueries({queryKey: ['course-feed', courseId]});
      showSuccessToast(`File ${fileName} deleted successfully.`);
    } catch (err: unknown) {
      if (err instanceof Error) {
        showErrorToast(err.message);
      } else {
        showErrorToast('An unknown error occurred.');
      }
    }
  };

  const handleDelete = async () => {
    if (!courseId || !taskId) return;
    if (window.confirm('Are you sure you want to delete this task?')) {
      try {
        await apiService.deleteTask(courseId, taskId);
        await queryClient.invalidateQueries({queryKey: ['course-feed', courseId]});
        showSuccessToast('Task deleted successfully.');
      } catch (err: unknown) {
        if (err instanceof Error) {
          showErrorToast(err.message);
        } else {
          showErrorToast('An unknown error occurred.');
        }
      }
    }
  };

  const handleTaskUpdated = (updatedTask: Task) => {
    onTaskUpdate(updatedTask);
    queryClient.invalidateQueries({queryKey: ['course-feed', courseId]});
  };

  const handleDownloadTaskAttachment = async (fileName: string) => {
    if (!courseId || !taskId) return;
    try {
      const {blob} = await apiService.downloadTaskAttachment(courseId, taskId, fileName);
      const link = document.createElement('a');
      link.href = window.URL.createObjectURL(blob);
      link.download = fileName;
      document.body.appendChild(link);
      link.click();
      link.remove();
      window.URL.revokeObjectURL(link.href);
    } catch (err: unknown) {
      if (err instanceof Error) {
        showErrorToast(err.message);
      } else {
        showErrorToast('An unknown error occurred.');
      }
    }
  };

  const renderTaskDetails = () => (
    <div className="space-y-6">
      <div className="flex items-start justify-between">
        <div className="flex items-start gap-3 md:gap-4">
          <ClipboardCheck className="w-6 h-6 md:w-8 md:h-8 text-green-500 flex-shrink-0" />
          <h1 className="text-2xl md:text-3xl font-bold">{task.title}</h1>
        </div>
        {user?.user_type === 'TEACHER' && (
          <div className="flex items-center gap-2">
            <button onClick={() => setIsEditModalOpen(true)} className="p-2 text-gray-500 hover:text-blue-600" title="Edit Task">
              <Edit className="w-5 h-5" />
            </button>
            <button onClick={handleDelete} className="p-2 text-gray-500 hover:text-red-600" title="Delete Task">
              <Trash2 className="w-5 h-5" />
            </button>
          </div>
        )}
      </div>

      <div className="pl-9 md:pl-12 text-sm md:text-base text-gray-600 space-y-2 border-l-2 border-gray-100 ml-3 md:ml-4">
        <p className="flex items-center gap-2"><Clock className="w-4 h-4" /> <strong>Due:</strong> {new Date(task.deadline).toLocaleString()}</p>
        <p className="flex items-center gap-2"><UserIcon className="w-4 h-4" /> <strong>By:</strong> {task.name}</p>
      </div>

      <p className="text-sm md:text-base text-gray-800 whitespace-pre-wrap pl-9 md:pl-12">{task.description}</p>

      {task.attachements && task.attachements.length > 0 && (
        <div className="pl-9 md:pl-12">
          <h3 className="text-base md:text-lg font-semibold mb-3">Attachments</h3>
          <ul className="space-y-2 text-sm md:text-base">
            {task.attachements.map((file, index) => (
              <li key={index} className="flex items-center">
                <Paperclip className="w-4 h-4 mr-2 text-gray-500" />
                <button
                  onClick={() => handleDownloadTaskAttachment(file)}
                  className="text-blue-600 hover:underline"
                >
                  {file}
                </button>
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );

  const renderStudentView = () => (
    <>
      {renderTaskDetails()}
      {task.status === 'PENDING' && task.rejection_reason && (
        <div className="p-4 my-4 bg-red-50 border border-red-200 rounded-lg">
          <h4 className="text-md font-bold text-red-800 mb-2">Submission Rejected</h4>
          <p className="text-sm text-red-700">Your teacher provided the following feedback:</p>
          <p className="text-sm text-gray-800 mt-2 p-3 bg-red-100 rounded">{task.rejection_reason}</p>
        </div>
      )}
      {task.status === 'PENDING' ? (
        <div className="pt-6 border-t mt-8">
          <h3 className="text-lg md:text-xl font-semibold mb-4">Submit Your Work</h3>
          <div className="flex items-center space-x-4">
            <input
              type="file"
              multiple
              onChange={handleFileChange}
              className="block w-full text-sm text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-semibold file:bg-blue-50 file:text-blue-700 hover:file:bg-blue-100"
            />
            <button
              onClick={handleUpload}
              disabled={selectedFiles.length === 0 || isUploading}
              className="px-6 py-2 bg-blue-600 text-white rounded-full hover:bg-blue-700 disabled:bg-gray-400 disabled:cursor-not-allowed flex items-center flex-shrink-0"
            >
              {isUploading ? <LoadingSpinner size="sm" /> : <UploadCloud className="w-5 h-5 mr-2" />}
              Submit
            </button>
          </div>
          {selectedFiles.length > 0 && (
            <div className="mt-2 text-sm text-gray-600">
              <p>Selected files:</p>
              <ul className="list-disc pl-5">
                {selectedFiles.map((file, i) => <li key={i}>{file.name}</li>)}
              </ul>
            </div>
          )}
        </div>
      ) : (
        <div className="pt-6 border-t mt-8">
          <h3 className="text-lg md:text-xl font-semibold mb-4">Your Submission</h3>
          <div className="p-4 bg-gray-50 rounded-lg">
            <div className="flex justify-between items-center mb-2">
              <p className="font-medium">Status: <span className={`font-bold ${task.status === 'APPROVED' ? 'text-green-600' : task.status === 'DELAYED' ? 'text-orange-600' : 'text-blue-600'}`}>{task.status}</span></p>
              {(task.status === 'SUBMITTED' || task.status === 'DELAYED') && (
                <button 
                  onClick={handleDeleteSubmission}
                  className="px-3 py-1 bg-red-600 text-white text-xs font-semibold rounded-full hover:bg-red-700"
                >
                  Unsubmit
                </button>
              )}
            </div>
            {task.status === 'APPROVED' && task.grade && (
              <div className="mt-4 p-3 bg-green-100 border border-green-200 rounded-lg">
                  <p className="font-semibold text-green-800">Grade: {task.grade}</p>
                  {task.remarks && <p className="text-sm text-green-700 mt-1">Remarks: {task.remarks}</p>}
              </div>
            )}
            {task.submission_attachments && task.submission_attachments.length > 0 && (
              <div>
                <h4 className="font-medium mt-4 mb-2">Submitted Files:</h4>
                <ul className="space-y-2">
                  {task.submission_attachments.map((file, index) => (
                    <li key={index} className="flex items-center justify-between p-2 bg-white rounded-md border">
                      <span className="text-sm truncate pr-2">{file}</span>
                      <div className="flex items-center flex-shrink-0">
                        <button
                          onClick={() => handleDownloadSubmission(file)}
                          className="p-2 text-gray-500 hover:text-blue-600"
                          title={`Download ${file}`}
                        >
                          <Download className="w-5 h-5" />
                        </button>
                        {(task.status === 'SUBMITTED' || task.status === 'DELAYED') && (
                          <button
                            onClick={() => handleDeleteSubmittedFile(file)}
                            className="p-2 text-gray-500 hover:text-red-600"
                            title={`Delete ${file}`}
                          >
                            <Trash2 className="w-5 h-5" />
                          </button>
                        )}
                      </div>
                    </li>
                  ))}
                </ul>
              </div>
            )}
          </div>
        </div>
      )}
    </>
  );

  const renderTeacherView = () => {
    const submissionCount = task.submissions?.length || 0;
    const submittedCount = task.submissions?.filter(s => s.status === 'SUBMITTED' || s.status === 'DELAYED').length || 0;

    return (
      <>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
          {/* Task Details - always visible */}
          <div>{renderTaskDetails()}</div>

          {/* Submissions - view changes based on screen size */}
          <div>
            {/* Mobile View: Button to dedicated page */}
            <div className="md:hidden">
              <h3 className="text-lg font-bold mb-4">Submissions</h3>
              <button 
                onClick={() => navigate(`/course/${courseId}/task/${taskId}/submissions`)}
                className="w-full flex items-center justify-between p-4 bg-white rounded-lg shadow-sm border hover:bg-gray-50"
              >
                <div className="flex items-center gap-3">
                  <Users className="w-6 h-6 text-blue-600" />
                  <div>
                    <p className="font-semibold text-base">View Student Submissions</p>
                    <p className="text-sm text-gray-500">{submissionCount} students, {submittedCount} submitted</p>
                  </div>
                </div>
              </button>
            </div>

            {/* Desktop View: Embedded list */}
            <div className="hidden md:block">
              {task.submissions && <SubmissionsList submissions={task.submissions} onApprove={handleApprove} onReject={handleReject} courseId={courseId!} taskId={taskId!} />}
            </div>
          </div>
        </div>
        {isEditModalOpen && (
          <TaskEditModal
            task={task}
            isOpen={isEditModalOpen}
            onClose={() => setIsEditModalOpen(false)}
            onTaskUpdated={handleTaskUpdated}
          />
        )}
      </>
    );
  };

  return user?.user_type === 'TEACHER' ? renderTeacherView() : renderStudentView();
};
export default TaskView;
