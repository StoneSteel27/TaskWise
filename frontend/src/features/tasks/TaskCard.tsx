import React from 'react';
import { Task } from '../../types';
import { Clock, Calendar, Paperclip, User, CheckCircle, AlertCircle } from 'lucide-react';

interface TaskCardProps {
  task: Task;
  showActions?: boolean;
  onEdit?: (task: Task) => void;
  onDelete?: (taskId: string) => void;
  onSubmit?: (task: Task) => void;
}

const TaskCard: React.FC<TaskCardProps> = ({ 
  task, 
  showActions = false,
  onEdit,
  onDelete,
  onSubmit 
}) => {
  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleString();
  };

  const getStatusIcon = () => {
    switch (task.status) {
      case 'APPROVED':
        return <CheckCircle className="w-5 h-5 text-green-600" />;
      case 'SUBMITTED':
        return <AlertCircle className="w-5 h-5 text-yellow-600" />;
      case 'DELAYED':
        return <AlertCircle className="w-5 h-5 text-orange-600" />;
      case 'PENDING':
      default:
        return undefined;
    }
  };

  const getStatusColor = () => {
    switch (task.status) {
      case 'APPROVED':
        return 'bg-green-100 text-green-800';
      case 'SUBMITTED':
        return 'bg-yellow-100 text-yellow-800';
      case 'DELAYED':
        return 'bg-orange-100 text-orange-800';
      case 'PENDING':
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  const isOverdue = new Date(task.deadline) < new Date() && task.status === 'PENDING';

  return (
    <div className={`bg-white rounded-xl shadow-sm border ${isOverdue ? 'border-red-200' : 'border-gray-100'} p-6 hover:shadow-md transition-shadow`}>
      <div className="flex items-start justify-between mb-4">
        <div className="flex items-center space-x-3">
          <div className="w-10 h-10 bg-blue-100 rounded-full flex items-center justify-center">
            <User className="w-5 h-5 text-blue-600" />
          </div>
          <div>
            <p className="font-medium text-gray-900">{task.name}</p>
            <div className="flex items-center space-x-1 text-sm text-gray-500">
              <Clock className="w-4 h-4" />
              <span>{formatDate(task.time)}</span>
            </div>
          </div>
        </div>
        
        <div className="flex items-center space-x-3">
          <div className={`px-3 py-1 rounded-full text-xs font-medium ${getStatusColor()}`}>
            {task.status}
          </div>
          {getStatusIcon()}
        </div>
      </div>

      <h3 className="text-lg font-semibold text-gray-900 mb-2">
        {task.title}
      </h3>
      
      <p className="text-gray-700 mb-4 line-clamp-3">
        {task.description}
      </p>

      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center space-x-1 text-sm text-gray-500">
          <Calendar className="w-4 h-4" />
          <span>Due: {formatDate(task.deadline)}</span>
          {isOverdue && <span className="text-red-600 font-medium ml-2">Overdue</span>}
        </div>
        
        {task.attachements && task.attachements.length > 0 && (
          <div className="flex items-center space-x-1 text-sm text-blue-600">
            <Paperclip className="w-4 h-4" />
            <span>{task.attachements.length} attachment(s)</span>
          </div>
        )}
      </div>

      {/* Action buttons */}
      <div className="flex justify-between items-center">
        {showActions && (
          <div className="flex space-x-2">
            <button
              onClick={() => onEdit?.(task)}
              className="text-blue-600 hover:text-blue-800 text-sm font-medium"
            >
              Edit
            </button>
            <button
              onClick={() => onDelete?.(task.task_id)}
              className="text-red-600 hover:text-red-800 text-sm font-medium"
            >
              Delete
            </button>
          </div>
        )}
        
        {task.status === 'PENDING' && onSubmit && (
          <button
            onClick={() => onSubmit(task)}
            className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors text-sm font-medium"
          >
            Submit
          </button>
        )}
      </div>
    </div>
  );
};

export default TaskCard;