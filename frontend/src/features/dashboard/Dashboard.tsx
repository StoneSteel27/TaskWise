import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { apiService } from '../../services/api.provider';
import LoadingSpinner from '../../components/LoadingSpinner';
import ScheduleCard from './ScheduleCard';
import SchoolAnnouncementCreateModal from '../announcements/SchoolAnnouncementCreateModal';
import Plus from 'lucide-react/dist/esm/icons/plus';
import { useQuery } from '@tanstack/react-query';

const Dashboard: React.FC = () => {
  const { user } = useAuth();
  const [isCreateModalOpen, setCreateModalOpen] = useState(false);

  const { data: schedule, isLoading: scheduleLoading } = useQuery({
    queryKey: ['schedule', user?.id],
    queryFn: () => apiService.getSchedule(),
    enabled: !!user,
  });

  const { data: announcementsData, isLoading: announcementsLoading } = useQuery({
    queryKey: ['dashboard-announcements'],
    queryFn: () => apiService.getSchoolAnnouncements(),
    enabled: !!user,
  });
  const announcements = Array.isArray(announcementsData) ? announcementsData : announcementsData?.announcements || [];

  const { data: coursesData, isLoading: coursesLoading } = useQuery({
    queryKey: ['user-courses', user?.id],
    queryFn: () => user?.user_type === 'TEACHER' ? apiService.getClasses() : apiService.getCourses(),
    enabled: !!user,
  });
  const courses = coursesData?.courses || coursesData?.classes || [];

  const loading = scheduleLoading || announcementsLoading || coursesLoading;


  if (loading) {
    return <LoadingSpinner />;
  }

  return (
    <div className="flex flex-col h-full space-y-3 md:space-y-4 pb-20 md:pb-0">
      {schedule && (
        <div>
          <ScheduleCard 
            schedule={schedule} 
            userType={user?.user_type || ''}
            courses={courses} 
          />
        </div>
      )}

      <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-3 md:p-4 flex-1 flex flex-col min-h-0">
        <div className="flex items-center justify-between mb-3 md:mb-4">
          <h2 className="text-xl font-semibold text-gray-900">School-wide Announcements</h2>
          {user?.user_type === 'PRINCIPAL' && (
            <button onClick={() => setCreateModalOpen(true)} className="flex items-center gap-2 px-3 py-1.5 md:px-4 md:py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700">
              <Plus className="w-5 h-5" />
              <span className="text-sm md:text-base">Create</span>
            </button>
          )}
        </div>
        <div className="space-y-3 md:space-y-4 overflow-y-auto">
          {announcements.map((announcement) => (
            <Link to={`/school-announcement/${announcement.announcement_id}`} key={announcement.announcement_id} className="block p-3 md:p-4 bg-blue-50 rounded-lg hover:bg-blue-100 transition-colors">
              <div className="flex justify-between items-center text-xs text-gray-600 mb-1">
                <p>{announcement.name}</p>
                <p>{new Date(announcement.time).toLocaleString()}</p>
              </div>
              <h3 className="font-semibold text-blue-800 text-lg">{announcement.title}</h3>
              <p className="text-sm text-gray-800 mt-2 whitespace-pre-wrap truncate">{announcement.description}</p>
            </Link>
          ))}
          {announcements.length === 0 && (
            <p className="text-gray-500 text-center py-4">No announcements yet</p>
          )}
        </div>
      </div>
      <SchoolAnnouncementCreateModal isOpen={isCreateModalOpen} onClose={() => setCreateModalOpen(false)} />
    </div>
  );
};

export default Dashboard;