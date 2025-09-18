import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { X } from 'lucide-react';
import { Course } from '../../types';
import { apiService } from '../../services/api.provider';
import CourseCard from './CourseCard';
import LoadingSpinner from '../../components/LoadingSpinner';
import { useAuth } from '../../context/AuthContext';
import { useModalBackButton } from '../../utils/useModalBackButton';

interface CoursesModalProps {
  isOpen: boolean;
  onClose: () => void;
}

const CoursesModal: React.FC<CoursesModalProps> = ({ isOpen, onClose }) => {
  const [courses, setCourses] = useState<Course[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [isClosing, setIsClosing] = useState(false);
  const { user } = useAuth();
  const navigate = useNavigate();

  useModalBackButton(isOpen, handleClose);

  useEffect(() => {
    if (isOpen) {
      setIsLoading(true);
      
      const fetchCourses = async () => {
        try {
          if (user?.user_type === 'STUDENT') {
            const res = await apiService.getCourses();
            setCourses(res.courses);
          } else {
            const res = await apiService.getClasses();
            setCourses(res.classes);
          }
        } catch (error) {
          console.error("Failed to fetch courses/classes", error);
          setCourses([]); // Clear previous data on error
        } finally {
          setIsLoading(false);
        }
      };

      fetchCourses();
    }
  }, [isOpen, user]);

  function handleClose() {
    setIsClosing(true);
    setTimeout(() => {
      onClose();
      setIsClosing(false);
    }, 300); // Animation duration
  }

  const handleCourseClick = (courseId: string) => {
    navigate(`/course/${courseId}`);
    handleClose();
  };

  if (!isOpen) {
    return null;
  }

  return (
    <div 
      className={`fixed inset-0 bg-black bg-opacity-50 z-50 transition-opacity duration-300 flex items-center justify-center ${
        isOpen && !isClosing ? 'opacity-100' : 'opacity-0'
      }`}
      onClick={handleClose}
    >
      <div 
        className={`
          bg-white shadow-xl transform transition-all duration-300 ease-in-out
          md:rounded-lg md:max-w-4xl md:h-auto md:max-h-[90vh]
          w-full h-full fixed md:relative flex flex-col
          ${
            isOpen && !isClosing
              ? 'translate-x-0 md:scale-100 md:opacity-100'
              : '-translate-x-full md:scale-95 md:opacity-0'
          }
          md:translate-x-0
        `}
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex-shrink-0 flex justify-between items-center p-4 border-b">
          <h2 className="text-xl font-bold">Courses</h2>
          <button onClick={handleClose} className="p-2 rounded-full hover:bg-gray-200">
            <X className="w-6 h-6" />
          </button>
        </div>
        <div className="p-6 md:p-2 overflow-y-auto flex-1">
          {isLoading ? (
            <LoadingSpinner />
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {courses.map(course => {
                return <CourseCard course={course} onClick={() => handleCourseClick(course.course_id)} />;
              })}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default CoursesModal;