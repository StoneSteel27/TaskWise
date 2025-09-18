const useMockApi = import.meta.env.VITE_USE_MOCK_API === 'true';
const apiBaseUrl = import.meta.env.VITE_API_BASE_URL;

export const getAttachmentUrl = (
  type: 'school-announcement' | 'course-announcement' | 'task-attachment',
  ids: { announcementId?: string; courseId?: string; taskId?: string },
  fileName: string
): string => {
  const path = (() => {
    switch (type) {
      case 'school-announcement':
        return `/school-announcements/${ids.announcementId}/attachments/${fileName}`;
      case 'course-announcement':
        return `/courses/${ids.courseId}/announcements/${ids.announcementId}/attachments/${fileName}`;
      case 'task-attachment':
        return `/courses/${ids.courseId}/tasks/${ids.taskId}/attachments/${fileName}`;
      default:
        return '#';
    }
  })();

  return useMockApi ? path : `${apiBaseUrl}${path}`;
};

export const getStudentSubmissionUrl = (
  ids: { courseId: string; taskId: string; studentRollNumber: string }
): string => {
  const mockPath = `/courses/${ids.courseId}/tasks/${ids.taskId}/submission/${ids.studentRollNumber}.txt`;
  const realPath = `${apiBaseUrl}/v1/api/courses/${ids.courseId}/tasks/${ids.taskId}/submission/download`;
  return useMockApi ? mockPath : realPath;
};

export const getTeacherSubmissionUrl = (
  ids: { courseId: string; taskId: string; studentRollNumber: string }
): string => {
  const mockPath = `/courses/${ids.courseId}/tasks/${ids.taskId}/submissions/${ids.studentRollNumber}.txt`;
  const realPath = `${apiBaseUrl}/v1/api/courses/${ids.courseId}/tasks/${ids.taskId}/submissions/${ids.studentRollNumber}/download`;
  return useMockApi ? mockPath : realPath;
};
