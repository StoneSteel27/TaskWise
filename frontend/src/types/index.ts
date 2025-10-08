// Authentication Types
export interface LoginCredentials {
  roll_number: string;
  password: string;
}

export interface User {
  id: string;
  name: string;
  roll_number: string;
  user_type: 'STUDENT' | 'TEACHER' | 'PRINCIPAL' | 'ADMIN';
  profile_picture_url?: string;
  classroom?: string;
  homeroom_class?: string;
}

// Course/Subject Types
export interface Course {
  name: string;
  course_id: string;
  teacher_name: string;
  accent_color: string;
  student_count?: number;
  class_name?: string;
  course_name?: string;
}

// Schedule Types
export interface Schedule {
  morning_subs: string[];
  aftnoon_subs: string[];
}

// Announcement Types
export interface Announcement {
  announcement_id: string;
  name: string;
  time: string;
  title: string;
  description: string;
  attachements: string[];
}

// Task Types
export interface Submission {
  student_name: string;
  student_roll_number: string;
  profile_picture_url: string;
  status: 'PENDING' | 'SUBMITTED' | 'APPROVED' | 'DELAYED';
  submitted_at: string | null;
  grade?: 'S' | 'A' | 'B' | 'C' | 'D';
  remarks?: string;
}

export interface Task {
  task_id: string;
  name: string;
  time: string;
  title: string;
  description: string;
  attachements: string[];
  deadline: string;
  status: 'PENDING' | 'SUBMITTED' | 'APPROVED' | 'DELAYED'; // For students, their own status
  submissions?: Submission[]; // For teachers, the list of all student submissions
  rejection_reason?: string;
  grade?: 'S' | 'A' | 'B' | 'C' | 'D';
  remarks?: string;
}

// Attendance Types
export interface StudentAttendanceHistory {
  date: string;
  status: 'PRESENT' | 'ABSENT' | 'LEAVE';
}

export interface TeacherAttendanceHistory {
  date: string;
  check_in_time: string | null;
  check_out_time: string | null;
}

export interface TeacherAttendanceHistory {
  date: string;
  check_in_time: string | null;
  check_out_time: string | null;
}

export interface TeacherAttendanceRecord {
  student_roll_number: string;
  status: 'PRESENT' | 'ABSENT' | 'LEAVE';
}

export interface AttendanceRecord {
  total_days: number;
  days_attended: number;
  attendance_percentage: number;
  leave_days: string[];
}

export interface AttendanceData {
  student_roll_number: string;
  status: 'PRESENT' | 'ABSENT' | 'LEAVE';
}

// Student Types
export interface Student {
  name: string;
  roll_number: string;
  profile_picture_url: string;
  classroom?: string;
  progress?: {
    attendance_percentage: number;
    tasks_completed: number;
    tasks_total: number;
  };
  grades?: {
    s: number;
    a: number;
    b: number;
    c: number;
    d: number;
    overall: string;
  };
  contact_info?: {
    email: string;
    phone_personal: string;
    phone_mother: string;
    phone_father: string;
  };
  home_address?: string;
}

// Dashboard Types
export interface CourseDashboard {
  announcements: Announcement[];
  tasks: Task[];
}

// Search Types
export interface SearchResult {
  announcements: Announcement[];
  tasks: Task[];
}

// API Response Types
export interface ApiResponse<T> {
  success: boolean;
  data?: T;
  message?: string;
}

// WebAuthn and Geofencing Types
export interface WebAuthnRegistrationRequest {
  id: string;
  rawId: string;
  response: {
    clientDataJSON: string;
    attestationObject: string;
  };
  type: string;
}

export interface WebAuthnAuthenticationRequest {
  id: string;
  rawId: string;
  response: {
    clientDataJSON: string;
    authenticatorData: string;
    signature: string;
    userHandle: string;
  };
  type: string;
}

export interface Geolocation {
  latitude: number;
  longitude: number;
}

export interface CheckInPayload {
  credential: WebAuthnAuthenticationRequest;
  location: Geolocation;
}

export interface RecoveryCheckInPayload {
  code: string;
  location: Geolocation;
}

export interface TeacherAttendanceStatus {
  status: string;
  check_in_time?: string;
  check_out_time?: string;
  is_device_registered: boolean;
}

export interface GeoFence {
  id: number;
  name: string;
  coordinates: [number, number][][];
}