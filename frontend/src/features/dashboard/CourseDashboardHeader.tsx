import React, { useRef, useState } from 'react';
import { Course } from '../../types';
import User from 'lucide-react/dist/esm/icons/user';
import Users from 'lucide-react/dist/esm/icons/users';
import Hash from 'lucide-react/dist/esm/icons/hash';
import Pencil from 'lucide-react/dist/esm/icons/pencil';
import { useAuth } from '../../context/AuthContext';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { apiService } from '../../services/api.provider';
import { toast } from 'react-hot-toast';

interface CourseDashboardHeaderProps {
  course: Course;
}

const CourseDashboardHeader: React.FC<CourseDashboardHeaderProps> = ({ course }) => {
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const isTeacher = user?.user_type === 'TEACHER';
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [imageKey, setImageKey] = useState<number | null>(Date.now());

  const imageUrl = `/v1/api/${course.course_id}/icon.png`;

  const mutation = useMutation({
    mutationFn: (formData: FormData) => apiService.updateCourseAccentImage(course.course_id, formData),
    onSuccess: () => {
      toast.success('Banner image updated successfully!');
      queryClient.invalidateQueries({ queryKey: ['course-details', course.course_id] });
      queryClient.invalidateQueries({ queryKey: ['classes'] });
      // Force a re-render of the image by updating its key
      setImageKey(Date.now());
    },
    onError: (error: Error) => {
      toast.error(`Failed to update image: ${error.message}`);
    },
  });

  const handleEditClick = () => {
    fileInputRef.current?.click();
  };

  const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      const formData = new FormData();
      formData.append('accent_image', file);
      mutation.mutate(formData);
    }
  };

  const headerStyle = {
    backgroundColor: course.accent_color,
    height: '180px',
  };

  return (
    <div style={headerStyle} className="relative text-white shadow-lg flex items-center overflow-hidden rounded-b-2xl">
      <div className="absolute top-0 right-0 h-full w-2/5 flex justify-end items-center">
        <img
          src={imageUrl}
          alt={course.name}
          className="h-full object-contain mix-blend-multiply"
          key={imageKey}
          fetchpriority="high"
          loading="eager"
        />
      </div>
      <div className="relative z-10 p-4 md:p-6">
        <h1 className="text-2xl md:text-3xl font-bold">{isTeacher ? course.class_name : course.name}</h1>
        <div className="mt-2 opacity-80 space-y-1 text-xs md:text-sm">
          {isTeacher ? (
            <>
              <p className="flex items-center gap-2">
                <span>{course.name}</span>
              </p>
              <p className="flex items-center gap-2">
                <Users className="w-4 h-4" />
                <span>{course.student_count} Students</span>
              </p>
            </>
          ) : (
            <>
              <p className="flex items-center gap-2">
                <User className="w-4 h-4" />
                <span>{course.teacher_name}</span>
              </p>
              <p className="flex items-center gap-2 font-mono">
                <Hash className="w-4 h-4" />
                <span>{course.course_id}</span>
              </p>
            </>
          )}
        </div>
      </div>
      {isTeacher && (
        <>
          <input
            type="file"
            ref={fileInputRef}
            onChange={handleFileChange}
            className="hidden"
            accept="image/png, image/jpeg, image/gif"
          />
          <button
            onClick={handleEditClick}
            disabled={mutation.isPending}
            className="absolute top-2 right-2 bg-black bg-opacity-30 hover:bg-opacity-50 text-white p-2 rounded-full transition-colors disabled:opacity-50"
            aria-label="Edit banner image"
          >
            {mutation.isPending ? (
              <div className="w-4 h-4 border-2 border-t-transparent border-white rounded-full animate-spin"></div>
            ) : (
              <Pencil className="w-4 h-4" />
            )}
          </button>
        </>
      )}
    </div>
  );
};

export default CourseDashboardHeader;
