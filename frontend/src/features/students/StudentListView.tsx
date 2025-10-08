import React from 'react';
import { useQuery } from '@tanstack/react-query';
import { apiService } from '../../services/api.provider';
import { useAuth } from '../../context/AuthContext';
import { Student } from '../../types';
import LoadingSpinner from '../../components/LoadingSpinner';
import { Link } from 'react-router-dom';
import { showErrorToast } from '../../utils/notifications';

const StudentListView: React.FC = () => {
  const { user } = useAuth();

  const { data: students, isLoading, error } = useQuery<Student[], Error>({
    queryKey: ['class-students', user?.homeroom_class],
    queryFn: () => {
      if (!user?.homeroom_class) throw new Error('Not a homeroom teacher');
      return apiService.getStudentsInClass(user.homeroom_class).then(res => res.students);
    },
    enabled: !!user?.homeroom_class,
  });

  if (isLoading) return <div className="p-8"><LoadingSpinner /></div>;
  if (error) {
    showErrorToast(error.message);
    return <div className="text-red-500 text-center p-8">{error.message}</div>;
  }

  return (
    <div className="p-4 md:p-6">
      <h1 className="text-2xl md:text-3xl font-bold mb-6">Students in {user?.homeroom_class}</h1>
      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
        {students?.map(student => (
          <Link to={`/student/${student.roll_number}`} key={student.roll_number} className="block bg-white p-4 rounded-lg shadow-sm hover:shadow-md transition-shadow">
            <div className="h-full">
              <div className="flex items-center space-x-4">
                <img src={student.profile_picture_url} alt={student.name} className="w-16 h-16 rounded-full object-cover" />
                <div>
                  <p className="font-bold text-lg">{student.name}</p>
                  <p className="text-sm text-gray-600">{student.roll_number}</p>
                </div>
              </div>
            </div>
          </Link>
        ))}
      </div>
    </div>
  );
};

export default StudentListView;
