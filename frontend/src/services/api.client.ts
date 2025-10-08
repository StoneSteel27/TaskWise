import axios from 'axios';
import { 
  Course, 
  Schedule, 
  Announcement, 
  Task, 
  Student, 
  CourseDashboard, 
  SearchResult,
  AttendanceData,
  WebAuthnRegistrationRequest,
  CheckInPayload,
  RecoveryCheckInPayload
} from '../types';
import { LoginCredentials, User } from '../types';

const apiClient = axios.create({
  baseURL: "/v1/api",
});

export const setAuthToken = (token: string | null) => {
  if (token) {
    apiClient.defaults.headers.common['Authorization'] = `Bearer ${token}`;
  } else {
    delete apiClient.defaults.headers.common['Authorization'];
  }
};

apiClient.interceptors.request.use((config) => {
  const token = localStorage.getItem('taskwise_token');
  if (token && !config.headers.Authorization) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

apiClient.interceptors.response.use(
  response => response,
  error => {
    if (error.response?.status === 401) {
      // Clear auth data
      localStorage.removeItem('taskwise_user');
      localStorage.removeItem('taskwise_token');
      // Redirect to login, but avoid loops if already there
      if (window.location.pathname !== '/' && window.location.pathname !== '/login') {
        window.location.href = '/';
      }
      // Return a resolved promise to prevent further error handling by the caller
      return Promise.resolve({ data: { message: 'Redirecting to login...' } });
    }

    const errorMessage = error.response?.data?.detail || 'An unexpected error occurred.';
    return Promise.reject(new Error(errorMessage));
  }
);

export const realApiService = {
  login: async (credentials: LoginCredentials): Promise<{ token: string; user: User }> => {
    const formData = new URLSearchParams();
    formData.append('username', credentials.roll_number);
    formData.append('password', credentials.password);

    const response = await apiClient.post('/login', formData.toString(), {
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
      },
    });
    const { access_token, user } = response.data;
    const accessToken = access_token;
    
    const adaptedUser: User = {
      id: user.id,
      name: user.name,
      roll_number: user.roll_number,
      user_type: user.role,
      profile_picture_url: user.profile_picture_url,
      homeroom_class: user.homeroom_class,
    };

    return { token: accessToken, user: adaptedUser };
  },

  getSchedule: async (): Promise<Schedule> => {
    const response = await apiClient.get('/me/schedule');
    return response.data;
  },

  getSchoolAnnouncements: async (): Promise<{ announcements: Announcement[] }> => {
    const response = await apiClient.get('/me/school-announcements');
    return response.data;
  },

  getSchoolAnnouncement: async (announcementId: string): Promise<Announcement> => {
    const response = await apiClient.get(`/school-announcements/${announcementId}`);
    return response.data;
  },

  downloadSchoolAnnouncementAttachment: async (announcementId: string, fileName: string): Promise<{ blob: Blob }> => {
    const response = await apiClient.get(`/school-announcements/${announcementId}/attachments/${fileName}`, {
      responseType: 'blob',
    });
    return { blob: response.data };
  },

  getCourses: async (): Promise<{ courses: Course[] }> => {
    const response = await apiClient.get('/me/courses');
    return response.data;
  },

  getClasses: async (): Promise<{ classes: Course[] }> => {
    const response = await apiClient.get('/me/classes');
    return response.data;
  },

  getCourse: async (courseId: string): Promise<Course> => {
    const response = await apiClient.get(`/courses/${courseId}`);
    return response.data;
  },

  getCourseDashboard: async (courseId: string): Promise<CourseDashboard> => {
    const response = await apiClient.get(`/me/${courseId}/dashboard`);
    return response.data;
  },

  getTask: async (courseId: string, taskId: string): Promise<Task> => {
    const response = await apiClient.get(`/${courseId}/tasks/${taskId}`);
    return response.data;
  },

  uploadTaskSubmission: async (courseId: string, taskId: string, formData: FormData): Promise<{ new_status: string }> => {
    const response = await apiClient.post(`/${courseId}/tasks/${taskId}/upload`, formData);
    return response.data;
  },

  deleteSubmission: async (courseId: string, taskId: string): Promise<{ message: string }> => {
    const response = await apiClient.delete(`/${courseId}/tasks/${taskId}/submission/delete`);
    return response.data;
  },

  deleteSubmissionFile: async (courseId: string, taskId: string, fileName: string): Promise<{ message: string }> => {
    const response = await apiClient.delete(`/${courseId}/tasks/${taskId}/submission/attachments/${encodeURIComponent(fileName)}`);
    return response.data;
  },

  approveSubmission: async (courseId: string, taskId: string, studentRollNumber: string, grade: string, remarks?: string): Promise<{ message: string, student_roll_number: string, new_status: string }> => {
    const formData = new FormData();
    formData.append('grade', grade);
    if (remarks) {
      formData.append('remarks', remarks);
    }
    const response = await apiClient.put(`/${courseId}/tasks/${taskId}/submissions/${studentRollNumber}/approve`, formData);
    return response.data;
  },

  rejectSubmission: async (courseId: string, taskId: string, studentRollNumber: string, reason: string): Promise<{ message: string, student_roll_number: string, new_status: string }> => {
    const formData = new FormData();
    formData.append('reason', reason);
    const response = await apiClient.put(`/${courseId}/tasks/${taskId}/submissions/${studentRollNumber}/reject`, formData);
    return response.data;
  },

  getCourseAnnouncement: async (courseId: string, announcementId: string): Promise<Announcement> => {
    const response = await apiClient.get(`/${courseId}/announcements/${announcementId}`);
    return response.data;
  },

  createTask: async (courseId: string, data: FormData): Promise<{ message: string, task_id: string }> => {
    const response = await apiClient.post(`/${courseId}/tasks/create`, data);
    return response.data;
  },

  updateTask: async (courseId: string, taskId: string, data: FormData): Promise<{ message: string, task_id: string }> => {
    const response = await apiClient.put(`/${courseId}/tasks/${taskId}/update`, data);
    return response.data;
  },

  deleteTask: async (courseId: string, taskId: string): Promise<{ message: string, task_id: string }> => {
    const response = await apiClient.delete(`/${courseId}/tasks/${taskId}/delete`);
    return response.data;
  },

  createCourseAnnouncement: async (courseId: string, data: FormData): Promise<{ message: string, announcement_id: string }> => {
    const response = await apiClient.post(`/${courseId}/announcements/create`, data);
    return response.data;
  },

  updateCourseAnnouncement: async (courseId: string, announcementId: string, data: FormData): Promise<{ message: string, announcement_id: string }> => {
    const response = await apiClient.put(`/${courseId}/announcements/${announcementId}/update`, data);
    return response.data;
  },

  deleteCourseAnnouncement: async (courseId: string, announcementId: string): Promise<{ message: string, announcement_id: string }> => {
    const response = await apiClient.delete(`/${courseId}/announcements/${announcementId}/delete`);
    return response.data;
  },

  getStudentsInClass: async (classId: string): Promise<{ students: Student[] }> => {
    const response = await apiClient.get(`/${classId}/students`);
    return response.data;
  },

  getStudentProfile: async (rollNumber: string): Promise<Student> => {
    const response = await apiClient.get(`/students/${rollNumber}`);
    return response.data;
  },

  markAttendance: async (classCode: string, attendanceData: AttendanceData[]): Promise<{ message: string }> => {
    const response = await apiClient.post(`/${classCode}/attendance`, { attendance_data: attendanceData });
    return response.data;
  },

  createSchoolAnnouncement: async (data: FormData): Promise<{ message: string, announcement_id: string }> => {
    const response = await apiClient.post('/school-announcements/create', data);
    return response.data;
  },

  updateSchoolAnnouncement: async (announcementId: string, data: FormData): Promise<{ message: string, announcement_id: string }> => {
    const response = await apiClient.put(`/school-announcements/${announcementId}/update`, data);
    return response.data;
  },

  deleteSchoolAnnouncement: async (announcementId: string): Promise<{ message: string, announcement_id: string }> => {
    const response = await apiClient.delete(`/school-announcements/${announcementId}/delete`);
    return response.data;
  },

  searchCourse: async (courseId: string, query: string): Promise<SearchResult> => {
    const response = await apiClient.get(`/${courseId}/search`, { params: { q: query } });
    return response.data;
  },

  downloadMySubmission: async (courseId: string, taskId: string, fileName: string): Promise<{ blob: Blob }> => {
    const response = await apiClient.get(`/courses/${courseId}/tasks/${taskId}/submission/download/${fileName}`, {
      responseType: 'blob',
    });
    return { blob: response.data };
  },

  downloadStudentSubmission: async (courseId: string, taskId: string, studentRollNumber: string): Promise<{ blob: Blob, filename: string }> => {
    const response = await apiClient.get(`/courses/${courseId}/tasks/${taskId}/submissions/${studentRollNumber}/download`, {
      responseType: 'blob',
    });
    const blob = response.data;
    let filename = 'submission';
    const disposition = response.headers['content-disposition'];
    if (disposition && disposition.includes('filename=')) {
      filename = disposition.split('filename=')[1].split(';')[0].replace(/"/g, '').trim();
    }
    return { blob, filename };
  },

  downloadTaskAttachment: async (courseId: string, taskId: string, fileName: string): Promise<{ blob: Blob }> => {
    const response = await apiClient.get(`/courses/${courseId}/tasks/${taskId}/attachments/${fileName}`, {
      responseType: 'blob',
    });
    return { blob: response.data };
  },

  downloadCourseAnnouncementAttachment: async (courseId: string, announcementId: string, fileName: string): Promise<{ blob: Blob }> => {
    const response = await apiClient.get(`/courses/${courseId}/announcements/${announcementId}/attachments/${fileName}`, {
      responseType: 'blob',
    });
    return { blob: response.data };
  },

  getStudentAttendanceHistory: async (): Promise<{ history: StudentAttendanceHistory[] }> => {
    const response = await apiClient.get('/me/attendance-history');
    return response.data;
  },

  getTeacherAttendanceHistory: async (year: number, month: number): Promise<{ history: { date: string; check_in_time: string | null; check_out_time: string | null; }[] }> => {
    const response = await apiClient.get('/attendance/teacher/me/attendance-history', { params: { year, month } });
    return response.data;
  },

  getTeacherClasses: async (): Promise<{ classes: Course[] }> => {
    const response = await apiClient.get('/me/classes');
    return response.data;
  },

  getClassAttendance: async (classCode: string, date: string): Promise<{ records: { student_roll_number: string, status: 'PRESENT' | 'ABSENT' | 'LEAVE' }[] }> => {
    const response = await apiClient.get(`/${classCode}/attendance-history`, { params: { attendance_date: date } });
    return response.data;
  },

  // --- Teacher Attendance ---
  getWebAuthnRegistrationOptions: async (): Promise<PublicKeyCredentialCreationOptions> => {
    const response = await apiClient.get('/attendance/teacher/webauthn/register-options');
    return response.data;
  },

  verifyWebAuthnRegistration: async (data: WebAuthnRegistrationRequest): Promise<{ message: string }> => {
    const response = await apiClient.post('/attendance/teacher/webauthn/register-verify', data);
    return response.data;
  },

  getWebAuthnAuthOptions: async (): Promise<PublicKeyCredentialRequestOptions> => {
    const response = await apiClient.get('/attendance/teacher/webauthn/auth-options');
    return response.data;
  },

  verifyTeacherCheckIn: async (payload: CheckInPayload): Promise<{ message: string, check_in_time: string }> => {
    const response = await apiClient.post('/attendance/teacher/check-in', payload);
    return response.data;
  },
  
  checkInWithRecoveryCode: async (payload: RecoveryCheckInPayload): Promise<{ message: string, check_in_time: string }> => {
    const response = await apiClient.post('/attendance/teacher/recovery-check-in', payload);
    return response.data;
  },

  checkOutWithRecoveryCode: async (payload: RecoveryCheckInPayload): Promise<{ message: string, check_out_time: string }> => {
    const response = await apiClient.post('/attendance/teacher/recovery-check-out', payload);
    return response.data;
  },

  getTeacherAttendanceStatus: async (): Promise<{ status: string; check_in_time?: string; check_out_time?: string, is_device_registered: boolean }> => {
    const response = await apiClient.get('/attendance/teacher/status'); 
    return response.data;
  },

  verifyTeacherCheckOut: async (payload: CheckInPayload): Promise<{ message: string, check_out_time: string }> => {
    const response = await apiClient.post('/attendance/teacher/check-out', payload);
    return response.data;
  },

  getGeoFence: async (): Promise<GeoFence[]> => {
    const response = await apiClient.get('/geofence/coordinates/');
    if (response.data && Array.isArray(response.data)) {
      return response.data.map((fence: any) => ({
        id: fence.id,
        name: fence.name,
        coordinates: fence.polygon || fence.coordinates,
      }));
    }
    return [];
  },

  updateCourseAccentImage: async (courseId: string, formData: FormData): Promise<{ message: string }> => {
    const response = await apiClient.put(`/me/${courseId}/accent_image`, formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
    });
    return response.data;
  },
};
