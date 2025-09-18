import React, { useState, useEffect } from 'react';
import { useAuth } from '../../context/AuthContext';
import { apiService } from '../../services/api.provider';
import { Student, AttendanceData } from '../../types';
import LoadingSpinner from '../../components/LoadingSpinner';
import { showSuccessToast, showErrorToast } from '../../utils/notifications';
import { useQueryClient } from '@tanstack/react-query';

const TeacherAttendanceDashboard: React.FC = () => {
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const [students, setStudents] = useState<Student[]>([]);
  const [attendance, setAttendance] = useState<Record<string, 'PRESENT' | 'ABSENT' | 'LEAVE'>>({});
  const [isLoading, setIsLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    const fetchStudents = async () => {
      if (user?.homeroom_class) {
        try {
          setIsLoading(true);
          const response = await apiService.getStudentsInClass(user.homeroom_class);
          setStudents(response.students);
          const initialAttendance: Record<string, 'PRESENT' | 'ABSENT' | 'LEAVE'> = {};
          response.students.forEach(student => {
            initialAttendance[student.roll_number] = 'PRESENT';
          });
          setAttendance(initialAttendance);
        } catch (err: unknown) {
          if (err instanceof Error) {
            showErrorToast(err.message);
          } else {
            showErrorToast('An unknown error occurred.');
          }
        } finally {
          setIsLoading(false);
        }
      }
    };
    fetchStudents();
  }, [user?.homeroom_class]);

  const handleStatusChange = (rollNumber: string, status: 'PRESENT' | 'ABSENT' | 'LEAVE') => {
    setAttendance(prev => ({ ...prev, [rollNumber]: status }));
  };

  const handleSubmit = async () => {
    if (!user?.homeroom_class) return;

    setIsSubmitting(true);

    const attendanceData: AttendanceData[] = Object.entries(attendance).map(([roll_number, status]) => ({
      student_roll_number: roll_number,
      status,
    }));

    try {
      const response = await apiService.markAttendance(user.homeroom_class, attendanceData);
      await queryClient.invalidateQueries({ queryKey: ['class-attendance', user.homeroom_class] });
      showSuccessToast(response.message);
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

  if (isLoading) return <div className="p-8"><LoadingSpinner /></div>;

  return (
    <div className="p-4 md:p-6">
      <h1 className="text-2xl md:text-3xl font-bold mb-4">Mark Attendance</h1>
      <h2 className="text-xl md:text-2xl font-semibold mb-6">Homeroom: {user?.homeroom_class}</h2>
      
      <div className="space-y-3">
        {students.map(student => (
          <div key={student.roll_number} className="flex flex-col md:flex-row items-start md:items-center justify-between p-4 bg-white rounded-lg shadow-sm gap-4">
            <div className="flex items-center gap-4">
              <img src={student.profile_picture_url} alt={student.name} className="w-12 h-12 rounded-full object-cover" />
              <div>
                <p className="font-semibold text-lg">{student.name}</p>
                <p className="text-sm text-gray-500">{student.roll_number}</p>
              </div>
            </div>
            <div className="flex items-center gap-2 flex-wrap">
              <button
                onClick={() => handleStatusChange(student.roll_number, 'PRESENT')}
                className={`px-4 py-2 text-sm font-semibold rounded-full transition-colors ${attendance[student.roll_number] === 'PRESENT' ? 'bg-green-600 text-white shadow-md' : 'bg-gray-100 hover:bg-green-100'}`}
              >
                Present
              </button>
              <button
                onClick={() => handleStatusChange(student.roll_number, 'ABSENT')}
                className={`px-4 py-2 text-sm font-semibold rounded-full transition-colors ${attendance[student.roll_number] === 'ABSENT' ? 'bg-red-600 text-white shadow-md' : 'bg-gray-100 hover:bg-red-100'}`}
              >
                Absent
              </button>
              <button
                onClick={() => handleStatusChange(student.roll_number, 'LEAVE')}
                className={`px-4 py-2 text-sm font-semibold rounded-full transition-colors ${attendance[student.roll_number] === 'LEAVE' ? 'bg-yellow-500 text-white shadow-md' : 'bg-gray-100 hover:bg-yellow-100'}`}
              >
                Leave
              </button>
            </div>
          </div>
        ))}
      </div>

      <div className="mt-8 flex justify-end">
        <button
          onClick={handleSubmit}
          disabled={isSubmitting}
          className="px-6 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:bg-gray-400 flex items-center"
        >
          {isSubmitting && <LoadingSpinner size="sm" />}
          Submit Attendance
        </button>
      </div>
    </div>
  );
};

export default TeacherAttendanceDashboard;