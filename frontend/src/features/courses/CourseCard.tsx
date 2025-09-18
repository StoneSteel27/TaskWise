import React from 'react';
import { Course } from '../../types';
import { useAuth } from '../../context/AuthContext';
import { User, Users, Hash } from 'lucide-react';

interface CourseCardProps {
  course: Course;
  onClick: () => void;
}

const CourseCard: React.FC<CourseCardProps> = ({ course, onClick }) => {
  const { user } = useAuth();
  const isTeacher = user?.user_type === 'TEACHER';
  console.log(course);

  const cardStyle = {
    backgroundColor: course.accent_color,
  };

  const imageUrl = `/v1/api/${course.course_id}/icon.png`;

  return (
    <div
      onClick={onClick}
      className="relative rounded-2xl shadow-lg hover:shadow-xl transition-all duration-300 ease-in-out text-white overflow-hidden cursor-pointer min-h-[180px]"
      style={cardStyle}
    >
      <div className="absolute top-0 right-0 h-full w-2/5">
        <img
          src={imageUrl}
          alt={course.name}
          className="w-full h-full object-contain mix-blend-multiply"
        />
      </div>
      <div className="relative flex flex-col justify-between h-full p-4 md:p-6 w-full">
        <div className="w-3/5">
          <h3 className="text-xl md:text-2xl font-bold mb-2">{isTeacher ? course.class_name : course.name}</h3>
          <div className="flex items-center space-x-2 opacity-80 mb-4">
            <Hash className="w-4 h-4" />
            <span className="text-xs md:text-sm font-mono">{course.course_id || course.course_id}</span>
          </div>
        </div>
        
        <div className="space-y-2 w-3/5 text-sm md:text-base">
          {isTeacher ? (
            <div className="flex items-center space-x-2">
              <Users className="w-5 h-5" />
              <span className="font-medium">{course.student_count} Students</span>
            </div>
          ) : (
            <div className="flex items-center space-x-2">
              <User className="w-5 h-5" />
              <span className="font-medium">{course.teacher_name}</span>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default CourseCard;