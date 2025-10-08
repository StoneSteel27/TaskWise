import React, { Suspense, useEffect, useState } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import { BrowserRouter as Router, Route, Routes, Navigate, useParams, useOutletContext, useNavigate } from 'react-router-dom';
import { AuthProvider, useAuth } from './context/AuthContext';
import Layout from './components/Layout';
import LoadingSpinner from './components/LoadingSpinner';
import { apiService } from './services/api.provider';
import { Course, Task } from './types';
import { CheckCircle, AlertTriangle, UploadCloud, ArrowLeft } from 'lucide-react';

const Login = React.lazy(() => import('./features/auth/Login'));
const Dashboard = React.lazy(() => import('./features/dashboard/Dashboard'));
const CourseDashboard = React.lazy(() => import('./features/dashboard/CourseDashboard'));
const TaskView = React.lazy(() => import('./features/tasks/TaskView'));
const AnnouncementView = React.lazy(() => import('./features/announcements/AnnouncementView'));
const StudentAttendanceView = React.lazy(() => import('./features/attendance/StudentAttendanceView'));
const StudentListView = React.lazy(() => import('./features/students/StudentListView'));
const StudentProfileView = React.lazy(() => import('./features/students/StudentProfileView'));
const TeacherAttendanceDashboard = React.lazy(() => import('./features/attendance/TeacherAttendanceDashboard'));
const TeacherAttendanceView = React.lazy(() => import('./features/attendance/TeacherAttendanceView'));
const SubmissionsView = React.lazy(() => import('./features/tasks/SubmissionsView'));
const SchoolAnnouncementView = React.lazy(() => import('./features/announcements/SchoolAnnouncementView'));
const FullScreenModal = React.lazy(() => import('./features/tasks/FullScreenModal'));

const getStatusChip = (status: Task['status']) => {
  const baseClasses = "px-3 py-1 text-xs font-semibold rounded-full inline-flex items-center";
  switch (status) {
    case 'PENDING':
      return <div className={`${baseClasses} bg-yellow-100 text-yellow-800`}><AlertTriangle className="w-4 h-4 mr-1" />Pending</div>;
    case 'SUBMITTED':
      return <div className={`${baseClasses} bg-blue-100 text-blue-800`}><UploadCloud className="w-4 h-4 mr-1" />Submitted</div>;
    case 'APPROVED':
      return <div className={`${baseClasses} bg-green-100 text-green-800`}><CheckCircle className="w-4 h-4 mr-1" />Approved</div>;
    default:
      return null;
  }
};

const BackButton = () => {
  const navigate = useNavigate();
  const { courseId } = useParams<{ courseId: string }>();
  return (
    <button onClick={() => navigate(`/course/${courseId}`)} className="flex items-center gap-2 text-gray-600 hover:text-gray-900 mb-4 self-start">
      <ArrowLeft className="w-5 h-5" />
      <span>Back to Feed</span>
    </button>
  );
};

const TaskViewWrapper = () => {
  const { courseId, taskId } = useParams<{ courseId: string, taskId: string }>();
  const { course } = useOutletContext<{ course: Course | null }>();
  const { user } = useAuth();
  const [task, setTask] = useState<Task | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const navigate = useNavigate();
  const [isModalOpen, setIsModalOpen] = useState(true);
  const queryClient = useQueryClient();

  const handleClose = () => {
    setIsModalOpen(false);
    queryClient.invalidateQueries({ queryKey: ['course-feed', courseId] });
    navigate(`/course/${courseId}`);
  };

  useEffect(() => {
    if (courseId && taskId && user) {
      setIsLoading(true);
      apiService.getTask(courseId, taskId)
        .then(setTask)
        .finally(() => setIsLoading(false));
    }
  }, [courseId, taskId, user]);

  const taskContent = isLoading ? (
    <div className="flex justify-center items-center p-8">
      <LoadingSpinner />
    </div>
  ) : task ? (
    <TaskView task={task} onTaskUpdate={setTask} />
  ) : (
    <div className="text-center p-8">Task not found.</div>
  );

  return (
    <>
      {/* Mobile: Modal View */}
      <div className="md:hidden">
        <FullScreenModal 
          title="Task" 
          course={course} 
          statusComponent={!isLoading && task ? getStatusChip(task.status) : null}
          isOpen={isModalOpen}
          onClose={handleClose}
        >
          {taskContent}
        </FullScreenModal>
      </div>
      {/* Desktop: Inline View */}
      <div className="hidden md:flex flex-col flex-1 overflow-y-auto p-4">
        <BackButton />
        {taskContent}
      </div>
    </>
  );
}

const AnnouncementViewWrapper = () => {
  const { course } = useOutletContext<{ course: Course | null }>();
  const navigate = useNavigate();
  const [isModalOpen, setIsModalOpen] = useState(true);
  const { courseId } = useParams<{ courseId: string }>();
  const queryClient = useQueryClient();

  const handleClose = () => {
    setIsModalOpen(false);
    queryClient.invalidateQueries({ queryKey: ['course-feed', courseId] });
    navigate(`/course/${courseId}`);
  };

  const announcementContent = <AnnouncementView />;

  return (
    <>
      {/* Mobile: Modal View */}
      <div className="md:hidden">
        <FullScreenModal 
          title="Announcement" 
          course={course}
          isOpen={isModalOpen}
          onClose={handleClose}
        >
          {announcementContent}
        </FullScreenModal>
      </div>
      {/* Desktop: Inline View */}
      <div className="hidden md:flex flex-col flex-1 overflow-y-auto p-4">
        <BackButton />
        {announcementContent}
      </div>
    </>
  );
};



const AppContent: React.FC = () => {
  const { user, isLoading } = useAuth();
  const queryClient = useQueryClient();

  useEffect(() => {
    if (user) {
      const queryKey = user.user_type === 'TEACHER' ? ['classes'] : ['courses'];
      const queryFn = user.user_type === 'TEACHER' ? () => apiService.getClasses() : () => apiService.getCourses();
      queryClient.prefetchQuery({ queryKey, queryFn });
    }
  }, [user, queryClient]);

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <LoadingSpinner size="lg" text="Loading..." />
      </div>
    );
  }

  if (!user) {
    return <Login />;
  }

  const NotHomeroomTeacher = () => (
    <div className="p-8 text-center">
      <h1 className="text-2xl font-bold mb-4">Attendance</h1>
      <p>You are not assigned as a homeroom teacher for any class.</p>
    </div>
  );

  const MarkStudentAttendanceView = () => {
    return user.homeroom_class ? <TeacherAttendanceDashboard /> : <NotHomeroomTeacher />;
  };

  return (
    <Layout>
      <Suspense fallback={<div className="flex items-center justify-center h-full"><LoadingSpinner /></div>}>
        <Routes>
          <Route path="/dashboard" element={<Dashboard />} />
          <Route path="/attendance" element={<StudentAttendanceView />} />
          <Route path="/mark-attendance" element={<MarkStudentAttendanceView />} />
          <Route path="/my-attendance" element={<TeacherAttendanceView />} />
          <Route path="/students" element={<StudentListView />} />
          <Route path="/student/:rollNumber" element={<StudentProfileView />} />
          <Route path="/school-announcement/:announcementId" element={<SchoolAnnouncementView />} />
          <Route path="/course/:courseId" element={<CourseDashboard />}>
            <Route path="task/:taskId" element={<TaskViewWrapper />} />
            <Route path="announcement/:announcementId" element={<AnnouncementViewWrapper />} />
          </Route>
          <Route path="/course/:courseId/task/:taskId/submissions" element={<SubmissionsView />} />
          <Route path="/" element={<Navigate to="/dashboard" />} />
        </Routes>
      </Suspense>
    </Layout>
  );
};

import { Toaster } from 'react-hot-toast';

function App() {
  useEffect(() => {
    const lockOrientation = async () => {
      if (window.screen.orientation && window.screen.orientation.lock) {
        try {
          await window.screen.orientation.lock('portrait');
        } catch (error) {
          console.error('Failed to lock orientation:', error);
        }
      }
    };

    // Lock orientation on mobile devices
    const isMobile = /iPhone|iPad|iPod|Android/i.test(navigator.userAgent);
    if (isMobile) {
      lockOrientation();
    }
  }, []);

  return (
    <Router>
      <AuthProvider>
        <div className="min-h-screen bg-gray-50">
          <Toaster position="bottom-center" />
          <AppContent />
        </div>
      </AuthProvider>
    </Router>
  );
}

export default App;
