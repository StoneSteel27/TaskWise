import React from 'react';
import { useQuery } from '@tanstack/react-query';
import { apiService } from '../../services/api.provider';
import { useParams } from 'react-router-dom';
import { Student } from '../../types';
import LoadingSpinner from '../../components/LoadingSpinner';
import { Mail, Phone, Home, BarChart2, Copy } from 'lucide-react';
import { showErrorToast, showSuccessToast } from '../../utils/notifications';

import RingProgress from '../../components/RingProgress';

const StudentProfileView: React.FC = () => {
  const { rollNumber } = useParams<{ rollNumber: string }>();

  const { data: student, isLoading, error } = useQuery<Student, Error>({
    queryKey: ['student-profile', rollNumber],
    queryFn: () => {
      if (!rollNumber) throw new Error('Student roll number is required');
      return apiService.getStudentProfile(rollNumber);
    },
    enabled: !!rollNumber,
  });

  if (isLoading) return <div className="p-8"><LoadingSpinner /></div>;
  if (error) {
    showErrorToast(error.message);
    return <div className="text-red-500 text-center p-8">{error.message}</div>;
  }
  if (!student) return <div className="text-center p-8">Student not found.</div>;

  const taskCompletionPercentage = student.progress && student.progress.tasks_total > 0
    ? (student.progress.tasks_completed / student.progress.tasks_total) * 100
    : 0;

  const copyToClipboard = (text: string, label: string) => {
    navigator.clipboard.writeText(text).then(() => {
      showSuccessToast(`${label} copied to clipboard!`);
    }, (err) => {
      showErrorToast('Failed to copy!');
      console.error('Could not copy text: ', err);
    });
  };

  const InfoItem = ({ icon, label, value }: { icon: React.ReactNode, label: string, value: string }) => (
    <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
      <div className="flex items-center">
        <div className="text-gray-400 mr-3">{icon}</div>
        <div>
          <span className="text-sm text-gray-500">{label}</span>
          <p className="font-mono text-gray-800">{value}</p>
        </div>
      </div>
      <button 
        onClick={() => copyToClipboard(value, label)}
        className="p-2 text-gray-400 rounded-md hover:bg-gray-200 hover:text-gray-600 transition-colors"
        title={`Copy ${label}`}
      >
        <Copy className="w-4 h-4" />
      </button>
    </div>
  );

  return (
    <div className="p-2 md:p-6 space-y-3 md:space-y-6">
      {/* Header */}
      <div className="flex flex-col md:flex-row items-center md:items-start gap-4 md:gap-6 bg-white p-4 md:p-6 rounded-lg shadow-sm">
        <img src={student.profile_picture_url} alt={student.name} className="w-24 h-24 md:w-32 md:h-32 rounded-full object-cover border-4 border-blue-200" />
        <div className="text-center md:text-left pt-2 md:pt-4">
          <h1 className="text-2xl md:text-3xl font-bold text-gray-800">{student.name}</h1>
          <p className="text-md md:text-lg text-gray-500">{student.roll_number} - Class {student.classroom}</p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-3 md:gap-6">
        {/* Left Column: Progress */}
        <div className="lg:col-span-1 space-y-3 md:space-y-6">
          {student.progress && (
            <div className="bg-white p-4 md:p-6 rounded-lg shadow-sm">
              <h2 className="text-xl font-bold mb-4 flex items-center"><BarChart2 className="mr-2 text-gray-600"/> Academic Progress</h2>
              
              {/* Attendance Progress Bar */}
              <div className="mb-6">
                <div className="flex justify-between items-center mb-1">
                  <h3 className="font-semibold text-gray-700">Attendance</h3>
                  <span className="text-sm font-bold text-blue-600">{student.progress.attendance_percentage}%</span>
                </div>
                <div className="w-full bg-gray-200 rounded-full h-2.5">
                  <div className="bg-blue-500 h-2.5 rounded-full" style={{ width: `${student.progress.attendance_percentage}%` }}></div>
                </div>
              </div>

              {/* Tasks Ring Progress */}
              <div>
                <h3 className="font-semibold text-gray-700 mb-4">Tasks Completion</h3>
                <div className="flex flex-col items-center">
                  <RingProgress 
                    size={140} 
                    strokeWidth={12} 
                    percentage={taskCompletionPercentage} 
                    color="#16a34a" // green-600
                  />
                  <p className="mt-3 text-lg font-medium text-gray-600">
                    {student.progress.tasks_completed} / {student.progress.tasks_total} tasks
                  </p>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Right Column: Info */}
        <div className="lg:col-span-2 space-y-3 md:space-y-6">
          {student.contact_info && (
            <div className="bg-white p-4 md:p-6 rounded-lg shadow-sm">
              <h2 className="text-xl font-bold mb-4 flex items-center"><Phone className="mr-2 text-gray-600"/> Contact Information</h2>
              <div className="space-y-2 md:space-y-4">
                <InfoItem icon={<Mail size={20} />} label="Email" value={student.contact_info.email} />
                <InfoItem icon={<Phone size={20} />} label="Personal Phone" value={student.contact_info.phone_personal} />
                <InfoItem icon={<Phone size={20} />} label="Mother's Phone" value={student.contact_info.phone_mother} />
                <InfoItem icon={<Phone size={20} />} label="Father's Phone" value={student.contact_info.phone_father} />
              </div>
            </div>
          )}
          {student.home_address && (
            <div className="bg-white p-4 md:p-6 rounded-lg shadow-sm">
              <h2 className="text-xl font-bold mb-4 flex items-center"><Home className="mr-2 text-gray-600"/> Home Address</h2>
              <p className="text-gray-700 leading-relaxed">{student.home_address}</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default StudentProfileView;
