// Mock API service to simulate backend calls
import { 
  Course, 
  Schedule, 
  Announcement, 
  Task, 
  AttendanceRecord, 
  Student, 
  CourseDashboard, 
  SearchResult,
  Submission
} from '../types';

const MOCK_DELAY = 500; // Simulate network delay

// Utility to simulate API calls
const mockApiCall = <T>(data: T, delay = MOCK_DELAY): Promise<T> => {
  return new Promise((resolve) => {
    setTimeout(() => resolve(data), delay);
  });
};

// Mock data
const mockSchedule: Schedule = {
  morning_subs: ["MATH-10A", "SCI-10A", "SOC-10A"],
  aftnoon_subs: ["CS-10A", "ENG-10A", "LANG-10A"]
};

const mockTeacherSchedule: Schedule = {
  morning_subs: ["SCI-10A", "BREAK", "ENG-09B"],
  aftnoon_subs: ["SCI-10B", "BREAK", "ENG-09A"]
};

const mockCourses: Course[] = [
  {
    name: "Mathematics",
    course_id: "MATH-10A",
    teacher_name: "Mr. John Doe",
    accent_color: "#FF5733",
  },
  {
    name: "Science",
    course_id: "SCI-10A",
    teacher_name: "Dr. Jane Smith",
    accent_color: "#27AE60",
  },
  {
    name: "English",
    course_id: "ENG-10A",
    teacher_name: "Ms. Emily Brown",
    accent_color: "#3498DB",
  },
  {
    name: "Social Science",
    course_id: "SOC-10A",
    teacher_name: "Mr. David Garcia",
    accent_color: "#F1C40F",
  },
  {
    name: "Computer Science",
    course_id: "CS-10A",
    teacher_name: "Ms. Maria Rodriguez",
    accent_color: "#9B59B6",
  },
  {
    name: "Language",
    course_id: "LANG-01",
    teacher_name: "Mrs. Susan Chen",
    accent_color: "#E74C3C",
  }
];

const mockClasses: Course[] = [
  {
    name: "Class 10-A",
    class_name: "Class 10-A",
    course_name: "Science",
    course_id: "SCI-10A",
    teacher_name: "Dr. Jane Smith",
    student_count: 40,
    accent_color: "#27AE60",
  },
  {
    name: "Class 10-B",
    class_name: "Class 10-B",
    course_name: "Science",
    course_id: "SCI-10B",
    teacher_name: "Dr. Jane Smith",
    student_count: 38,
    accent_color: "#27AE60",
  },
  {
    name: "Class 09-A",
    class_name: "Class 09-A",
    course_name: "English",
    course_id: "ENG-09A",
    teacher_name: "Dr. Jane Smith",
    student_count: 42,
    accent_color: "#3498DB",
  }
];

const mockAttendance: AttendanceRecord = {
  total_days: 120,
  days_attended: 110,
  attendance_percentage: 91.6,
  leave_days: ["2025-07-25"]
};

const mockStudents: Student[] = [
  { name: "Kanishq V", roll_number: "192224227", profile_picture_url: "https://randomuser.me/api/portraits/men/1.jpg" },
  { name: "Jane Doe", roll_number: "192224228", profile_picture_url: "https://randomuser.me/api/portraits/women/2.jpg" },
  { name: "John Smith", roll_number: "192224229", profile_picture_url: "https://randomuser.me/api/portraits/men/3.jpg" },
  { name: "Emily Brown", roll_number: "192224230", profile_picture_url: "https://randomuser.me/api/portraits/women/4.jpg" },
  { name: "Michael Johnson", roll_number: "192224231", profile_picture_url: "https://randomuser.me/api/portraits/men/5.jpg" },
];

// Utility to generate dynamic mock data for a course
const generateCourseDashboardData = (courseId: string): CourseDashboard => {
  const course = mockCourses.find(c => c.course_id === courseId) || mockClasses.find(c => c.course_id === courseId);
  const teacherName = course?.teacher_name || "Unknown Teacher";
  const courseName = course?.name || "Unknown Course";

  const announcements: Announcement[] = [
    {
      announcement_id: `ANC-${courseId}-01`,
      name: teacherName,
      time: "2025-08-10T10:00:00+05:30",
      title: `Welcome to ${courseName}!`,
      description: `Hello everyone, welcome to the ${courseName} course. Please review the syllabus.`,
      attachements: ["syllabus.pdf"]
    },
    {
      announcement_id: `ANC-${courseId}-02`,
      name: teacherName,
      time: "2025-08-12T11:30:00+05:30",
      title: "Unit 1 Discussion",
      description: "The discussion forum for Unit 1 is now open. Please post your thoughts.",
      attachements: []
    },
    {
    announcement_id: `ANC-${courseId}-03`,
      name: teacherName,
      time: "2025-08-12T11:30:00+05:30",
      title: "Unit 2 Discussion",
      description: "The discussion forum for Unit 2 is now open. Please post your thoughts.",
      attachements: []
    }
  ];

  const tasks: Task[] = [
    {
      task_id: `TSK-${courseId}-01`,
      name: teacherName,
      time: "2025-08-11T14:00:00+05:30",
      title: "Introductory Assignment",
      description: "Please complete the introductory assignment and upload it by the deadline.",
      attachements: ["assignment_1.pdf"],
      deadline: "2025-08-18T23:59:59+05:30",
      status: courseId === 'MATH-10A' ? 'SUBMITTED' : 'PENDING'
    },
    {
      task_id: `TSK-${courseId}-02`,
      name: teacherName,
      time: "2025-08-15T16:00:00+05:30",
      title: "Reading: Chapter 1",
      description: "Read Chapter 1 from the textbook to prepare for our next class.",
      attachements: [],
      deadline: "2025-08-22T23:59:59+05:30",
      status: "PENDING"
    }
  ];

  return { announcements, tasks };
};

const generateSubmissionsForTask = (taskId: string): Submission[] => {
  return mockStudents.map((student, index) => {
    const statusOptions: Array<'PENDING' | 'SUBMITTED' | 'APPROVED'> = ['PENDING', 'SUBMITTED', 'APPROVED'];
    const status = statusOptions[(index + taskId.length) % 3];
    return {
      student_name: student.name,
      student_roll_number: student.roll_number,
      profile_picture_url: student.profile_picture_url,
      status: status,
      submitted_at: status !== 'PENDING' ? new Date().toISOString() : null,
    };
  });
};

const mockSchoolAnnouncements: Announcement[] = [
  {
    announcement_id: "SCH-ANC-001",
    name: "Principal",
    time: "2025-08-01T12:52:41+05:30",
    title: "Independence Day Celebration",
    description: "All students are requested to assemble in the main ground tomorrow at 9:00 AM for the Independence Day flag hoisting ceremony.",
    attachements: ["event_schedule.pdf"]
  }
];

export const ApiService = {
  // Schedule
  getSchedule: (userType: string) => {
    const schedule = userType.toUpperCase() === 'TEACHER' ? mockTeacherSchedule : mockSchedule;
    return mockApiCall(schedule);
  },

  // Courses
  getCourses: () => mockApiCall({ courses: mockCourses }),
  getClasses: () => mockApiCall({ classes: mockClasses }),

  // Attendance
  getAttendanceRecords: () => mockApiCall(mockAttendance),
  markAttendance: (classCode: string) => 
    mockApiCall({ message: `Attendance for class ${classCode} has been successfully recorded.` }),

  // Announcements
  getSchoolAnnouncements: () => mockApiCall({ announcements: mockSchoolAnnouncements }),
  getAnnouncement: (announcementId: string) => 
    mockApiCall(mockSchoolAnnouncements.find(a => a.announcement_id === announcementId)),
  createSchoolAnnouncement: () => 
    mockApiCall({ message: "School-wide announcement created successfully.", announcement_id: "SCH-ANC-003" }),
  updateSchoolAnnouncement: (announcementId: string) => 
    mockApiCall({ message: "School-wide announcement updated successfully.", announcement_id: announcementId }),
  deleteSchoolAnnouncement: (announcementId: string) => 
    mockApiCall({ message: "School-wide announcement deleted successfully.", announcement_id: announcementId }),

  // Course Dashboard
  getCourseDashboard: (courseId: string): Promise<CourseDashboard> => 
    mockApiCall(generateCourseDashboardData(courseId)),

  // Tasks
  getTask: async (courseId: string, taskId: string): Promise<Task> => {
    const courseTasks = generateCourseDashboardData(courseId).tasks;
    const task = courseTasks.find(t => t.task_id === taskId);
    if (!task) return Promise.reject('Task not found');

    // If user is a teacher, attach submissions
    // This is a simplified mock. A real API would handle authorization.
    if (taskId.includes('SCI-10A')) { // Mocking teacher view for a specific course
      return mockApiCall({ ...task, submissions: generateSubmissionsForTask(taskId) });
    }
    
    return mockApiCall(task);
  },
  createTask: (courseId: string) =>
    mockApiCall({ message: "Task created successfully.", task_id: `TSK-${courseId}-03` }),
  updateTask: (courseId: string, taskId: string) => 
    mockApiCall({ message: "Task updated successfully.", task_id: taskId }),
  deleteTask: (courseId: string, taskId: string) => 
    mockApiCall({ message: "Task deleted successfully.", task_id: taskId }),
  uploadTaskSubmission: async (): Promise<{ new_status: string }> =>
    mockApiCall({ new_status: "SUBMITTED" }),
  approveSubmission: () =>
    mockApiCall({ new_status: "APPROVED" }),

  // Course Announcements
  getCourseAnnouncement: (courseId: string, announcementId: string) => 
    mockApiCall(generateCourseDashboardData(courseId).announcements.find(a => a.announcement_id === announcementId)),
  createCourseAnnouncement: (courseId: string) => 
    mockApiCall({ message: "Announcement created successfully.", announcement_id: `ANC-${courseId}-03` }),
  updateCourseAnnouncement: (courseId: string, announcementId: string) => 
    mockApiCall({ message: "Announcement updated successfully.", announcement_id: announcementId }),
  deleteCourseAnnouncement: (courseId: string, announcementId: string) => 
    mockApiCall({ message: "Announcement deleted successfully.", announcement_id: announcementId }),

  // Students
  getStudentsInClass: () => mockApiCall({ students: mockStudents }),
  getStudentProfile: (): Promise<Student> => 
    mockApiCall({
      ...mockStudents[0],
      classroom: "10-A",
      progress: {
        attendance_percentage: 89,
        tasks_completed: 19,
        tasks_total: 20
      },
      contact_info: {
        email: "kanishqv4227.sse@saveetha.com",
        phone_personal: "+919940256702",
        phone_mother: "+917740256702",
        phone_father: "+917740256702"
      },
      home_address: "489, New MGR Nagar, Anaicut Road, Walajapet, Ranipet District - 632513, Tamil Nadu"
    }),

  // Search
  searchCourse: (courseId: string, query: string): Promise<SearchResult> => {
    const { announcements, tasks } = generateCourseDashboardData(courseId);
    return mockApiCall({
      announcements: announcements.filter(a => 
        a.title.toLowerCase().includes(query.toLowerCase()) || 
        a.description.toLowerCase().includes(query.toLowerCase())
      ),
      tasks: tasks.filter(t => 
        t.title.toLowerCase().includes(query.toLowerCase()) || 
        t.description.toLowerCase().includes(query.toLowerCase())
      )
    });
  },
  downloadStudentSubmission: async (courseId: string, taskId: string, studentRollNumber: string): Promise<{ blob: Blob, filename: string }> => {
    console.log(`Mock downloading submission for student ${studentRollNumber} in task ${taskId}`);
    const content = `This is a mock submission file for student ${studentRollNumber}.`;
    const blob = new Blob([content], { type: 'text/plain' });
    const filename = `${studentRollNumber}_${taskId}_submission.txt`;
    return mockApiCall({ blob, filename });
  },
  updateCourseAccentImage: () => 
    mockApiCall({ message: "Course accent image updated successfully." }),
};
