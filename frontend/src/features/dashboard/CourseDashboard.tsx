import React, { useEffect, useState } from 'react';
import { useParams, Outlet } from 'react-router-dom';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { apiService } from '../../services/api.provider';
import { Course, Announcement, Task } from '../../types';
import CourseDashboardHeader from './CourseDashboardHeader';
import SearchBar from '../../components/SearchBar';
import FeedItem from './FeedItem';
import LoadingSpinner from '../../components/LoadingSpinner';
import { useAuth } from '../../context/AuthContext';
import { PlusCircle, X, Megaphone, FileText } from 'lucide-react';
import TaskCreateModal from '../tasks/TaskCreateModal';
import AnnouncementCreateModal from '../announcements/AnnouncementCreateModal';

const CourseDashboard: React.FC = () => {
  const { courseId, taskId, announcementId } = useParams();
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const isTeacher = user?.user_type === 'TEACHER';
  const [searchTerm, setSearchTerm] = useState('');
  const [isDetailView, setIsDetailView] = useState(false);
  const [isTaskModalOpen, setIsTaskModalOpen] = useState(false);
  const [isAnnouncementModalOpen, setIsAnnouncementModalOpen] = useState(false);
  const [isFabMenuOpen, setIsFabMenuOpen] = useState(false);

  const handleCreationSuccess = () => {
    queryClient.invalidateQueries({ queryKey: ['course-feed', courseId] });
    setIsFabMenuOpen(false);
  };

  useEffect(() => {
    setIsDetailView(!!(taskId || announcementId));
  }, [taskId, announcementId]);

  const { data: course, isLoading: isCourseLoading } = useQuery<Course | null>({
    queryKey: ['course-details', courseId],
    queryFn: () => apiService.getCourses().then(res => res.courses.find(c => c.course_id === courseId) || apiService.getClasses().then(res => res.classes.find(c => c.course_id === courseId))),
    enabled: !!courseId,
  });

  const { data: dashboardData, isLoading: isDashboardLoading } = useQuery<{ announcements: Announcement[], tasks: Task[] }>({
    queryKey: ['course-feed', courseId],
    queryFn: () => apiService.getCourseDashboard(courseId!),
    enabled: !!courseId,
  });

  const announcements = dashboardData?.announcements || [];
  const tasks = dashboardData?.tasks || [];

  const filteredAnnouncements = announcements.filter(a => 
    a.title.toLowerCase().includes(searchTerm.toLowerCase()) || 
    a.description.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const filteredTasks = tasks.filter(t =>
    t.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
    t.description.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const feedItems = [...filteredAnnouncements, ...filteredTasks].sort((a, b) => new Date(b.time).getTime() - new Date(a.time).getTime());

  if (isCourseLoading || isDashboardLoading || !course) {
    return <div className="flex items-center justify-center h-full"><LoadingSpinner /></div>;
  }

  return (
    <>
      <div className="flex flex-col h-full relative overflow-hidden">
        {/* Main feed (tasks, announcements, etc) */}
        <div className={`w-full flex-1 ${isDetailView ? 'hidden md:flex' : 'flex'} flex-col md:transition-transform duration-350 ease-in-out ${isDetailView ? 'md:-translate-x-full' : 'md:translate-x-0'} h-full overflow-hidden`}>
          <CourseDashboardHeader course={course} />
          <div className="p-2 flex items-center gap-2">
            <div className="flex-grow">
              <SearchBar onSearch={setSearchTerm} />
            </div>
            {isTeacher && (
              <div className="hidden md:flex items-center gap-2">
                <button onClick={() => setIsTaskModalOpen(true)} className="flex items-center gap-2 px-3 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors text-sm font-semibold">
                  <PlusCircle className="w-5 h-5" />
                  <span>New Task</span>
                </button>
                <button onClick={() => setIsAnnouncementModalOpen(true)} className="flex items-center gap-2 px-3 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors text-sm font-semibold">
                  <PlusCircle className="w-5 h-5" />
                  <span>New Announcement</span>
                </button>
              </div>
            )}
          </div>
          <div className="flex-1 overflow-y-auto px-2 pb-20 md:pb-0">
            {feedItems.map(item => (
              <FeedItem key={(item as Announcement).announcement_id || (item as Task).task_id} item={item} />
            ))}
          </div>
        </div>

        {/* Detail view container (for desktop) */}
        <div className={`w-full absolute top-0 right-0 h-full bg-transparent md:bg-white overflow-y-auto md:transition-transform duration-350 ease-in-out ${isDetailView ? 'z-10 md:translate-x-0' : '-z-10 md:translate-x-full'}`}>
          <div className="p-2 h-full">
            <Outlet context={{ course }} />
          </div>
        </div>

        {/* Mobile FAB */}
        {isTeacher && (
          <div className="md:hidden fixed bottom-20 justify-items-end right-6 z-40">
            {isFabMenuOpen && (
              <div className="flex flex-col items-center justify-items-end mb-4 space-y-3">
                <button
                  onClick={() => { setIsTaskModalOpen(true); setIsFabMenuOpen(false); }}
                  className="flex items-center gap-2 justify-items-end bg-white pl-3 pr-4 py-2 rounded-full shadow-lg text-gray-700 hover:bg-gray-50"
                >
                  <FileText className="w-5 h-5 text-blue-600" />
                  <span className="text-sm font-semibold">New Task</span>
                </button>
                <button 
                  onClick={() => { setIsAnnouncementModalOpen(true); setIsFabMenuOpen(false); }}
                  className="flex items-center gap-2 bg-white pl-3 pr-4 py-2 rounded-full shadow-lg text-gray-700 hover:bg-gray-50"
                >
                  <Megaphone className="w-5 h-5 text-blue-600" />
                  <span className="text-sm font-semibold">New Announcement</span>
                </button>
              </div>
            )}
            <button
              onClick={() => setIsFabMenuOpen(!isFabMenuOpen)}
              className="w-14 h-14 bg-blue-600 text-white rounded-full flex items-center justify-center shadow-lg hover:bg-blue-700 transition-transform transform hover:scale-105"
            >
              {isFabMenuOpen ? <X className="w-7 h-7" /> : <PlusCircle className="w-7 h-7" />}
            </button>
          </div>
        )}
      </div>
      {isTeacher && (
        <>
          <TaskCreateModal
            isOpen={isTaskModalOpen}
            onClose={() => setIsTaskModalOpen(false)}
            onTaskCreated={handleCreationSuccess}
          />
          <AnnouncementCreateModal
            isOpen={isAnnouncementModalOpen}
            onClose={() => setIsAnnouncementModalOpen(false)}
            onAnnouncementCreated={handleCreationSuccess}
          />
        </>
      )}
    </>
  );
};

export default CourseDashboard;