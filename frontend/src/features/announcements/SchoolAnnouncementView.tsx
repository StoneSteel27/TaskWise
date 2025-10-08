import React, { useEffect, useState, useCallback } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Announcement } from '../../types';
import { apiService } from '../../services/api.provider';
import LoadingSpinner from '../../components/LoadingSpinner';
import Paperclip from 'lucide-react/dist/esm/icons/paperclip';
import Calendar from 'lucide-react/dist/esm/icons/calendar';
import Bell from 'lucide-react/dist/esm/icons/bell';
import User from 'lucide-react/dist/esm/icons/user';
import Edit from 'lucide-react/dist/esm/icons/edit';
import Trash2 from 'lucide-react/dist/esm/icons/trash-2';
import ArrowLeft from 'lucide-react/dist/esm/icons/arrow-left';
import { useAuth } from '../../context/AuthContext';
import { useQueryClient } from '@tanstack/react-query';
import AnnouncementEditModal from './AnnouncementEditModal';
import { showErrorToast } from '../../utils/notifications';

const SchoolAnnouncementView: React.FC = () => {
  const { announcementId } = useParams<{ announcementId: string }>();
  const { user } = useAuth();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const isPrincipal = user?.user_type === 'PRINCIPAL';

  const [announcement, setAnnouncement] = useState<Announcement | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);

  const fetchAnnouncement = useCallback(async () => {
    if (!announcementId) return;
    try {
      setIsLoading(true);
      const fetchedAnnouncement = await apiService.getSchoolAnnouncement(announcementId);
      setAnnouncement(fetchedAnnouncement);
    } catch (err: unknown) {
      if (err instanceof Error) {
        showErrorToast(err.message);
      } else {
        showErrorToast('An unknown error occurred.');
      }
    } finally {
      setIsLoading(false);
    }
  }, [announcementId]);

  useEffect(() => {
    fetchAnnouncement();
  }, [fetchAnnouncement]);

  const handleDelete = async () => {
    if (!announcementId) return;

    if (window.confirm('Are you sure you want to delete this announcement?')) {
      try {
        await apiService.deleteSchoolAnnouncement(announcementId);
        await queryClient.invalidateQueries({ queryKey: ['dashboard-announcements'] }); // Assuming a query key for dashboard
        navigate('/'); // Navigate back to dashboard
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
    queryClient.invalidateQueries({ queryKey: ['dashboard-announcements'] });
  };

  const handleDownloadAttachment = async (fileName: string) => {
    if (!announcementId) return;
    try {
      const { blob } = await apiService.downloadSchoolAnnouncementAttachment(announcementId, fileName);
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
  if (!announcement) return <div className="text-center p-8">Announcement not found.</div>;

  return (
    <>
      <div className="space-y-6">
        <div className="flex items-center justify-between">
            <button onClick={() => navigate(-1)} className="flex items-center gap-2 text-gray-500 hover:text-gray-700">
                <ArrowLeft className="w-5 h-5" />
                <span>Back</span>
            </button>
            {isPrincipal && (
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
        <div className="flex items-start gap-3 md:gap-4">
          <Bell className="w-6 h-6 md:w-8 md:h-8 text-blue-500 flex-shrink-0" />
          <h1 className="text-2xl md:text-3xl font-bold">{announcement.title}</h1>
        </div>
        
        <div className="pl-9 md:pl-12 text-sm md:text-base text-gray-600 space-y-2 border-l-2 border-gray-100 ml-3 md:ml-4">
          <p className="flex items-center gap-2"><Calendar className="w-4 h-4" /> <strong>Posted:</strong> {new Date(announcement.time).toLocaleString()}</p>
          <p className="flex items-center gap-2"><User className="w-4 h-4" /> <strong>By:</strong> {announcement.name}</p>
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
                    onClick={() => handleDownloadAttachment(file)}
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
          isSchoolScope={true}
        />
      )}
    </>
  );
};

export default SchoolAnnouncementView;
