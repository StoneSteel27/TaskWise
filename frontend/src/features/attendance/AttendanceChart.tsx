import React from 'react';
import { AttendanceRecord } from '../../types';
import Calendar from 'lucide-react/dist/esm/icons/calendar';
import TrendingUp from 'lucide-react/dist/esm/icons/trending-up';

interface AttendanceChartProps {
  attendance: AttendanceRecord;
}

const AttendanceChart: React.FC<AttendanceChartProps> = ({ attendance }) => {
  return (
    <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6">
      <div className="flex items-center space-x-3 mb-6">
        <TrendingUp className="w-6 h-6 text-blue-600" />
        <h2 className="text-xl font-semibold text-gray-900">Attendance Overview</h2>
      </div>

      {/* Attendance Percentage Circle */}
      <div className="flex justify-center mb-8">
        <div className="relative w-40 h-40">
          <svg className="w-40 h-40 transform -rotate-90" viewBox="0 0 144 144">
            <circle
              cx="72"
              cy="72"
              r="60"
              fill="none"
              stroke="#e5e7eb"
              strokeWidth="12"
            />
            <circle
              cx="72"
              cy="72"
              r="60"
              fill="none"
              stroke="#3b82f6"
              strokeWidth="12"
              strokeDasharray={`${(attendance.attendance_percentage / 100) * 377} 377`}
              strokeLinecap="round"
            />
          </svg>
          <div className="absolute inset-0 flex items-center justify-center flex-col">
            <span className="text-3xl font-bold text-gray-900">
              {attendance.attendance_percentage}%
            </span>
            <span className="text-sm text-gray-500">Attendance</span>
          </div>
        </div>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-2 gap-4 mb-6">
        <div className="text-center p-4 bg-green-50 rounded-xl">
          <div className="text-2xl font-bold text-green-600 mb-1">
            {attendance.days_attended}
          </div>
          <div className="text-sm text-green-700">Days Attended</div>
        </div>
        
        <div className="text-center p-4 bg-blue-50 rounded-xl">
          <div className="text-2xl font-bold text-blue-600 mb-1">
            {attendance.total_days}
          </div>
          <div className="text-sm text-blue-700">Total Days</div>
        </div>
      </div>

      {/* Leave Days */}
      {attendance.leave_days.length > 0 && (
        <div>
          <h3 className="text-lg font-medium text-gray-900 mb-3">Recent Leave Days</h3>
          <div className="space-y-2">
            {attendance.leave_days.slice(0, 5).map((date, index) => (
              <div key={index} className="flex items-center space-x-2 p-2 bg-red-50 rounded-lg">
                <Calendar className="w-4 h-4 text-red-600" />
                <span className="text-sm text-red-700">
                  {new Date(date).toLocaleDateString()}
                </span>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};

export default AttendanceChart;