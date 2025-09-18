import React from 'react';
import { Announcement } from '../../types';
import { Clock, Paperclip, User } from 'lucide-react';
import { getAttachmentUrl } from '../../utils/url';

interface AnnouncementCardProps {
  announcement: Announcement;
  showActions?: boolean;
  onEdit?: (announcement: Announcement) => void;
  onDelete?: (announcementId: string) => void;
}

const AnnouncementCard: React.FC<AnnouncementCardProps> = ({ 
  announcement, 
  showActions = false,
  onEdit,
  onDelete 
}) => {
  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleString();
  };

  return (
    <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-4 hover:shadow-md transition-shadow">
      <div className="flex items-start justify-between mb-4">
        <div className="flex items-center space-x-3">
          <div className="w-10 h-10 bg-blue-100 rounded-full flex items-center justify-center">
            <User className="w-5 h-5 text-blue-600" />
          </div>
          <div>
            <p className="font-medium text-gray-900">{announcement.name}</p>
            <div className="flex items-center space-x-1 text-sm text-gray-500">
              <Clock className="w-4 h-4" />
              <span>{formatDate(announcement.time)}</span>
            </div>
          </div>
        </div>
        {showActions && (
          <div className="flex space-x-2">
            <button
              onClick={() => onEdit?.(announcement)}
              className="text-blue-600 hover:text-blue-800 text-sm font-medium"
            >
              Edit
            </button>
            <button
              onClick={() => onDelete?.(announcement.announcement_id)}
              className="text-red-600 hover:text-red-800 text-sm font-medium"
            >
              Delete
            </button>
          </div>
        )}
      </div>

      <h3 className="text-lg font-semibold text-gray-900 mb-2">
        {announcement.title}
      </h3>
      
      <p className="text-gray-700 mb-4 line-clamp-3">
        {announcement.description}
      </p>

      {announcement.attachements && announcement.attachements.length > 0 && (
        <div className="mt-4 pt-4 border-t border-gray-100">
          <h4 className="text-sm font-medium text-gray-600 mb-2">Attachments</h4>
          <ul className="space-y-1">
            {announcement.attachements.map((file, index) => (
              <li key={index} className="flex items-center text-sm">
                <Paperclip className="w-4 h-4 mr-2 text-gray-400" />
                <a 
                  href={getAttachmentUrl('school-announcement', { announcementId: announcement.announcement_id }, file)}
                  className="text-blue-600 hover:underline"
                  target="_blank"
                  rel="noopener noreferrer"
                >
                  {file}
                </a>
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
};

export default AnnouncementCard;