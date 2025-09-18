import React, { useEffect, useState, useCallback } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Announcement } from '../../types';
import { apiService } from '../../services/api.provider';
import LoadingSpinner from '../../components/LoadingSpinner';
import { Paperclip, Calendar, Bell, User as UserIcon, Edit, Trash2 } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { useQueryClient } from '@tanstack/react-query';
import AnnouncementEditModal from './AnnouncementEditModal';
import { showErrorToast } from '../../utils/notifications';

const AnnouncementView: React.FC = () => {
  const { courseId, announcementId } = useParams<{ courseId: string; announcementId: string }>();
  const { user } = useAuth();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const isTeacher = user?.user_type === 'TEACHER';

  const [announcement, setAnnouncement] = useState<Announcement | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);

  const fetchAnnouncement = useCallback(async () => {
    if (!courseId || !announcementId) return;
    try {
      setIsLoading(true);
      setError(null);
      const fetchedAnnouncement = await apiService.getCourseAnnouncement(courseId, announcementId);
      setAnnouncement(fetchedAnnouncement);
    } catch (err: unknown) {
      if (err instanceof Error) {
        setError(err.message);
        showErrorToast(err.message);
      } else {
        setError('An unknown error occurred.');
        showErrorToast('An unknown error occurred.');
      }
    } finally {
      setIsLoading(false);
    }
  }, [courseId, announcementId]);

  useEffect(() => {
    fetchAnnouncement();
  }, [fetchAnnouncement]);

  const handleDelete = async () => {
    if (!courseId || !announcementId) return;

    if (window.confirm('Are you sure you want to delete this announcement?')) {
      try {
        await apiService.deleteCourseAnnouncement(courseId, announcementId);
        await queryClient.invalidateQueries({ queryKey: ['course-feed', courseId] });
        navigate(`/course/${courseId}`);
      } catch (err: unknown) {
        if (err instanceof Error) {
          showErrorToast(err.message);
        } else {
          showErrorToast('An unknown error occurred.');
        }
      }
    }
  };

  const handleAnnouncementUpdated = (updatedAnnouncement: Announcement) => {
    setAnnouncement(updatedAnnouncement);
    queryClient.invalidateQueries({ queryKey: ['course-feed', courseId] });
  };

  const handleDownloadAnnouncementAttachment = async (fileName: string) => {
    if (!courseId || !announcementId) return;
    try {
      const { blob } = await apiService.downloadCourseAnnouncementAttachment(courseId, announcementId, fileName);
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

  if (isLoading) return <div className="p-8"><LoadingSpinner /></div>;
  if (error) return <div className="text-red-500 text-center p-8">{error}</div>;
  if (!announcement) return <div className="text-center p-8">Announcement not found.</div>;

  return (
    <>
      <div className="space-y-6">
        <div className="flex items-start justify-between">
          <div className="flex items-start gap-3 md:gap-4">
            <Bell className="w-6 h-6 md:w-8 md:h-8 text-blue-500 flex-shrink-0" />
            <h1 className="text-2xl md:text-3xl font-bold">{announcement.title}</h1>
          </div>
          {isTeacher && (
            <div className="flex items-center gap-2">
              <button onClick={() => setIsEditModalOpen(true)} className="p-2 text-gray-500 hover:text-blue-600" title="Edit Announcement">
                <Edit className="w-5 h-5" />
              </button>
              <button onClick={handleDelete} className="p-2 text-gray-500 hover:text-red-600" title="Delete Announcement">
                <Trash2 className="w-5 h-5" />
              </button>
            </div>
          )}
        </div>
        
        <div className="pl-9 md:pl-12 text-sm md:text-base text-gray-600 space-y-2 border-l-2 border-gray-100 ml-3 md:ml-4">
          <p className="flex items-center gap-2"><Calendar className="w-4 h-4" /> <strong>Posted:</strong> {new Date(announcement.time).toLocaleString()}</p>
          <p className="flex items-center gap-2"><UserIcon className="w-4 h-4" /> <strong>By:</strong> {announcement.name}</p>
        </div>

        <p className="text-sm md:text-base text-gray-800 whitespace-pre-wrap pl-9 md:pl-12">{announcement.description}</p>

        {announcement.attachements && announcement.attachements.length > 0 && (
          <div className="pl-9 md:pl-12">
            <h3 className="text-base md:text-lg font-semibold mb-3">Attachments</h3>
            <ul className="space-y-2 text-sm md:text-base">
              {announcement.attachements.map((file, index) => (
                <li key={index} className="flex items-center">
                  <Paperclip className="w-4 h-4 mr-2 text-gray-500" />
                  <button
                    onClick={() => handleDownloadAnnouncementAttachment(file)}
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
      {isEditModalOpen && (
        <AnnouncementEditModal
          announcement={announcement}
          isOpen={isEditModalOpen}
          onClose={() => setIsEditModalOpen(false)}
          onAnnouncementUpdated={handleAnnouncementUpdated}
        />
      )}
    </>
  );
};

export default AnnouncementView;