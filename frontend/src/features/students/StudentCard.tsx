import React from 'react';
import { Student } from '../../types';
import { Mail, Phone } from 'lucide-react';

interface StudentCardProps {
  student: Student;
  onClick?: () => void;
  showProgress?: boolean;
}

const StudentCard: React.FC<StudentCardProps> = ({ student, onClick, showProgress = false }) => {
  return (
    <div 
      onClick={onClick}
      className={`bg-white rounded-xl shadow-sm border border-gray-100 p-6 hover:shadow-md transition-shadow ${onClick ? 'cursor-pointer' : ''}`}
    >
      <div className="flex items-center space-x-4 mb-4">
        <img
          src={student.profile_picture_url}
          alt={student.name}
          className="w-16 h-16 rounded-full object-cover"
        />
        <div className="flex-1">
          <h3 className="text-lg font-semibold text-gray-900">{student.name}</h3>
          <p className="text-gray-600">{student.roll_number}</p>
          {student.classroom && (
            <p className="text-sm text-blue-600">{student.classroom}</p>
          )}
        </div>
      </div>

      {showProgress && student.progress && (
        <div className="mb-4">
          <div className="flex justify-between text-sm text-gray-600 mb-2">
            <span>Attendance</span>
            <span>{student.progress.attendance_percentage}%</span>
          </div>
          <div className="w-full bg-gray-200 rounded-full h-2 mb-4">
            <div 
              className="bg-green-500 h-2 rounded-full" 
              style={{ width: `${student.progress.attendance_percentage}%` }}
            ></div>
          </div>
          
          <div className="flex justify-between text-sm text-gray-600 mb-2">
            <span>Tasks Completed</span>
            <span>{student.progress.tasks_completed}/{student.progress.tasks_total}</span>
          </div>
          <div className="w-full bg-gray-200 rounded-full h-2">
            <div 
              className="bg-blue-500 h-2 rounded-full" 
              style={{ width: `${(student.progress.tasks_completed / student.progress.tasks_total) * 100}%` }}
            ></div>
          </div>
        </div>
      )}

      {student.contact_info && (
        <div className="space-y-2">
          <div className="flex items-center space-x-2 text-sm text-gray-600">
            <Mail className="w-4 h-4" />
            <span>{student.contact_info.email}</span>
          </div>
          <div className="flex items-center space-x-2 text-sm text-gray-600">
            <Phone className="w-4 h-4" />
            <span>{student.contact_info.phone_personal}</span>
          </div>
        </div>
      )}
    </div>
  );
};

export default StudentCard;