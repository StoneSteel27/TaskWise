import React, { useState, useEffect } from 'react';
import { Task } from '../../types';
import { apiService } from '../../services/api.provider';
import { useParams } from 'react-router-dom';
import LoadingSpinner from '../../components/LoadingSpinner';
import { X, Paperclip, Trash2 } from 'lucide-react';
import { showSuccessToast, showErrorToast } from '../../utils/notifications';
import { useQueryClient } from '@tanstack/react-query';
import { useModalBackButton } from '../../utils/useModalBackButton';

interface TaskEditModalProps {
  task: Task;
  isOpen: boolean;
  onClose: () => void;
  onTaskUpdated: (updatedTask: Task) => void;
}

const TaskEditModal: React.FC<TaskEditModalProps> = ({ task, isOpen, onClose, onTaskUpdated }) => {
  const { courseId, taskId } = useParams<{ courseId: string; taskId: string }>();
  const queryClient = useQueryClient();
  const [title, setTitle] = useState(task.title);
  const [description, setDescription] = useState(task.description);
  const [deadline, setDeadline] = useState(new Date(task.deadline).toISOString().slice(0, 16));
  const [newAttachments, setNewAttachments] = useState<File[]>([]);
  const [attachmentsToKeep, setAttachmentsToKeep] = useState<string[]>(task.attachements || []);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isClosing, setIsClosing] = useState(false);

  useModalBackButton(isOpen, handleClose);

  useEffect(() => {
    setTitle(task.title);
    setDescription(task.description);
    setDeadline(new Date(task.deadline).toISOString().slice(0, 16));
    setAttachmentsToKeep(task.attachements || []);
  }, [task]);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files) {
      setNewAttachments(Array.from(e.target.files));
    }
  };

  function handleClose() {
    setIsClosing(true);
    setTimeout(() => {
      onClose();
      setIsClosing(false);
    }, 300); // Animation duration
  }

  const handleRemoveExistingAttachment = (fileName: string) => {
    setAttachmentsToKeep(prev => prev.filter(name => name !== fileName));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!courseId || !taskId) return;

    setIsSubmitting(true);

    const formData = new FormData();
    formData.append('title', title);
    formData.append('description', description);
    formData.append('deadline', new Date(deadline).toISOString());
    formData.append('attachments_to_keep', JSON.stringify(attachmentsToKeep));
    
    newAttachments.forEach(file => {
      formData.append('files', file);
    });

    try {
      await apiService.updateTask(courseId, taskId, formData);
      const updatedTaskData = await apiService.getTask(courseId, taskId);
      onTaskUpdated(updatedTaskData);
      await queryClient.invalidateQueries({ queryKey: ['course-feed', courseId] });
      await queryClient.invalidateQueries({ queryKey: ['task', courseId, taskId] });
      showSuccessToast('Task updated successfully!');
      handleClose();
    } catch (err: unknown) {
      if (err instanceof Error) {
        showErrorToast(err.message);
      } else {
        showErrorToast('An unknown error occurred.');
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div
      className={`fixed inset-0 bg-black bg-opacity-50 z-50 flex justify-center items-center transition-opacity duration-300 ${
        isOpen && !isClosing ? 'opacity-100' : 'opacity-0'
      }`}
    >
      <div
        className={`bg-white rounded-lg shadow-xl p-6 md:p-8 w-full max-w-2xl max-h-[90vh] overflow-y-auto transform transition-transform duration-300 ${
          isOpen && !isClosing ? 'scale-100' : 'scale-95'
        }`}
      >
        <div className="flex justify-between items-center mb-6">
          <h2 className="text-2xl font-bold">Edit Task</h2>
          <button onClick={handleClose} className="p-2 rounded-full hover:bg-gray-100">
            <X className="w-6 h-6" />
          </button>
        </div>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label htmlFor="title" className="block text-sm font-medium text-gray-700 mb-1">Title</label>
            <input
              id="title"
              type="text"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
              required
            />
          </div>
          <div>
            <label htmlFor="description" className="block text-sm font-medium text-gray-700 mb-1">Description</label>
            <textarea
              id="description"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              rows={5}
              className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
              required
            />
          </div>
          <div>
            <label htmlFor="deadline" className="block text-sm font-medium text-gray-700 mb-1">Deadline</label>
            <input
              id="deadline"
              type="datetime-local"
              value={deadline}
              onChange={(e) => setDeadline(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
              required
            />
          </div>
          
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Existing Attachments</label>
            {attachmentsToKeep.length > 0 ? (
              <ul className="space-y-2 text-sm">
                {attachmentsToKeep.map((file, index) => (
                  <li key={index} className="flex items-center justify-between p-2 bg-gray-50 rounded-md">
                    <div className="flex items-center">
                      <Paperclip className="w-4 h-4 mr-2 text-gray-500" />
                      <span>{file}</span>
                    </div>
                    <button type="button" onClick={() => handleRemoveExistingAttachment(file)} className="text-red-500 hover:text-red-700">
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </li>
                ))}
              </ul>
            ) : (
              <p className="text-xs text-gray-500">No existing attachments.</p>
            )}
          </div>

          <div>
            <label htmlFor="attachments" className="block text-sm font-medium text-gray-700 mb-1">Add New Attachments</label>
            <input
              id="attachments"
              type="file"
              multiple
              onChange={handleFileChange}
              className="w-full text-sm text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-semibold file:bg-blue-50 file:text-blue-700 hover:file:bg-blue-100"
            />
          </div>
          <div className="flex justify-end gap-4 pt-4">
            <button type="button" onClick={onClose} className="px-4 py-2 bg-gray-200 text-gray-800 rounded-md hover:bg-gray-300">
              Cancel
            </button>
            <button type="submit" disabled={isSubmitting} className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:bg-gray-400 flex items-center">
              {isSubmitting && <LoadingSpinner size="sm" />}
              Update Task
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default TaskEditModal;
