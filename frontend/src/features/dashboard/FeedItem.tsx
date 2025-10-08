import React from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { Announcement, Task } from '../../types';
import Bell from 'lucide-react/dist/esm/icons/bell';
import ClipboardCheck from 'lucide-react/dist/esm/icons/clipboard-check';

interface FeedItemProps {
  item: Announcement | Task;
}

const FeedItem: React.FC<FeedItemProps> = ({ item }) => {
  const isAnnouncement = 'announcement_id' in item;
  const navigate = useNavigate();
  const { courseId } = useParams<{ courseId: string }>();

  const cardIcon = isAnnouncement ? <Bell className="w-5 h-5 text-blue-500" /> : <ClipboardCheck className="w-5 h-5 text-green-500" />;
  const cardTitle = item.title;
  const cardDescription = item.description;
  const cardAuthor = item.name;
  const cardTime = new Date(item.time).toLocaleString();

  const handleClick = () => {
    if (isAnnouncement) {
      navigate(`/course/${courseId}/announcement/${item.announcement_id}`);
    } else {
      navigate(`/course/${courseId}/task/${item.task_id}`);
    }
  };

  return (
    <div 
      className="bg-white rounded-lg shadow p-4 mb-4 cursor-pointer hover:shadow-lg transition-shadow"
      onClick={handleClick}
    >
      {/* Top Row: Author and Time */}
      <div className="flex justify-between items-center mb-2">
        <p className="text-xs md:text-sm font-medium text-gray-700">{cardAuthor}</p>
        <p className="text-xs text-gray-400">{cardTime}</p>
      </div>

      {/* Second Row: Icon and Title */}
      <div className="flex items-center mb-2">
        <div className="flex-shrink-0 mr-3">
          {cardIcon}
        </div>
        <h3 className="text-base md:text-lg font-semibold text-gray-900">{cardTitle}</h3>
      </div>

      {/* Third Row: Content */}
      <p className="text-sm text-gray-600 mb-3 line-clamp-2">{cardDescription}</p>

      {/* Optional: Task Status */}
      {'status' in item && item.status!=null && (
        <div className="flex justify-end">
          <span className={`px-2 py-1 text-xs rounded-full ${
            item.status === 'PENDING' ? 'bg-yellow-100 text-yellow-800' :
            item.status === 'SUBMITTED' ? 'bg-blue-100 text-blue-800' :
            item.status === 'DELAYED' ? 'bg-orange-100 text-orange-800' :
            item.status === 'APPROVED' ? 'bg-green-100 text-green-800' : null
          }`}>
            {item.status}
          </span>
        </div>
      )}
    </div>
  );
};

export default FeedItem;
