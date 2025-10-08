import React from 'react';
import { useQuery } from '@tanstack/react-query';
import { apiService } from '../../services/api.provider';
import LoadingSpinner from '../../components/LoadingSpinner';
import Calendar from 'lucide-react/dist/esm/icons/calendar';
import ChevronLeft from 'lucide-react/dist/esm/icons/chevron-left';
import ChevronRight from 'lucide-react/dist/esm/icons/chevron-right';
import CheckCircle from 'lucide-react/dist/esm/icons/check-circle';
import XCircle from 'lucide-react/dist/esm/icons/x-circle';
import AlertCircle from 'lucide-react/dist/esm/icons/alert-circle';

const StudentAttendanceView: React.FC = () => {
  const [currentDate, setCurrentDate] = React.useState(new Date());

  const { data, isLoading, error } = useQuery({
    queryKey: ['studentAttendanceHistory'],
    queryFn: () => apiService.getStudentAttendanceHistory(),
  });

  const attendanceMap = React.useMemo(() => {
    const map = new Map<string, 'PRESENT' | 'ABSENT' | 'LEAVE'>();
    data?.history.forEach(record => {
      map.set(new Date(record.date).toDateString(), record.status);
    });
    return map;
  }, [data]);

  const month = currentDate.getMonth();
  const year = currentDate.getFullYear();
  const daysInMonth = new Date(year, month + 1, 0).getDate();
  const firstDayOfMonth = new Date(year, month, 1).getDay();

  const getStatusInfo = (status: 'PRESENT' | 'ABSENT' | 'LEAVE' | undefined) => {
    switch (status) {
      case 'PRESENT': return { color: 'bg-green-100 text-green-800', icon: <CheckCircle className="w-5 h-5 text-green-500" />, label: 'Present' };
      case 'ABSENT': return { color: 'bg-red-100 text-red-800', icon: <XCircle className="w-5 h-5 text-red-500" />, label: 'Absent' };
      case 'LEAVE': return { color: 'bg-yellow-100 text-yellow-800', icon: <AlertCircle className="w-5 h-5 text-yellow-500" />, label: 'Leave' };
      default: return { color: 'bg-gray-100 text-gray-800', icon: null, label: 'No Record' };
    }
  };

  const renderCalendar = () => {
    const days = [];
    for (let i = 0; i < firstDayOfMonth; i++) {
      days.push(<div key={`empty-${i}`} className="border rounded-md p-2 h-20 md:h-24"></div>);
    }
    for (let day = 1; day <= daysInMonth; day++) {
      const date = new Date(year, month, day);
      const status = attendanceMap.get(date.toDateString());
      const { color, label } = getStatusInfo(status);
      days.push(
        <div key={day} className={`border rounded-md p-2 h-20 md:h-24 flex flex-col ${color}`}>
          <span className="font-bold">{day}</span>
          <span className="text-xs mt-auto">{label}</span>
        </div>
      );
    }
    return days;
  };

  const renderListView = () => {
    const days = [];
    for (let day = 1; day <= daysInMonth; day++) {
      const date = new Date(year, month, day);
      const status = attendanceMap.get(date.toDateString());
      if (status) {
        const { color, icon, label } = getStatusInfo(status);
        days.push(
          <div key={day} className={`flex items-center justify-between p-3 rounded-lg ${color}`}>
            <div className="flex items-center gap-3">
              {icon}
              <span className="font-semibold">{date.toLocaleDateString('default', { weekday: 'long', day: 'numeric', month: 'short' })}</span>
            </div>
            <span className="text-sm font-medium">{label}</span>
          </div>
        );
      }
    }
    return days.length > 0 ? days : <p className="text-center text-gray-500 py-4">No attendance records for this month.</p>;
  };

  const summary = React.useMemo(() => {
    const stats = { PRESENT: 0, ABSENT: 0, LEAVE: 0, TOTAL: 0 };
    if (data) {
      data.history.forEach(record => {
        stats[record.status]++;
      });
      stats.TOTAL = data.history.length;
    }
    return stats;
  }, [data]);

  if (isLoading) return <div className="p-8"><LoadingSpinner /></div>;
  if (error) return <div className="text-red-500 text-center p-8">Failed to load attendance history.</div>;

  return (
    <div className="p-4 md:p-6">
      <div className="flex items-center gap-4 mb-6">
        <Calendar className="w-8 h-8 text-blue-600" />
        <h1 className="text-2xl md:text-3xl font-bold">My Attendance</h1>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
        <div className="p-4 bg-green-100 rounded-lg text-center"><h3 className="text-2xl font-bold">{summary.PRESENT}</h3><p className="text-sm">Present</p></div>
        <div className="p-4 bg-red-100 rounded-lg text-center"><h3 className="text-2xl font-bold">{summary.ABSENT}</h3><p className="text-sm">Absent</p></div>
        <div className="p-4 bg-yellow-100 rounded-lg text-center"><h3 className="text-2xl font-bold">{summary.LEAVE}</h3><p className="text-sm">Leave</p></div>
        <div className="p-4 bg-gray-100 rounded-lg text-center"><h3 className="text-2xl font-bold">{summary.TOTAL}</h3><p className="text-sm">Total Days</p></div>
      </div>

      <div className="bg-white p-4 rounded-lg shadow">
        <div className="flex justify-between items-center mb-4">
          <button onClick={() => setCurrentDate(new Date(year, month - 1, 1))} className="p-2 rounded-full hover:bg-gray-100"><ChevronLeft /></button>
          <h2 className="text-xl font-semibold">{currentDate.toLocaleString('default', { month: 'long', year: 'numeric' })}</h2>
          <button onClick={() => setCurrentDate(new Date(year, month + 1, 1))} className="p-2 rounded-full hover:bg-gray-100"><ChevronRight /></button>
        </div>
        
        {/* Desktop Calendar View */}
        <div className="hidden md:block">
          <div className="grid grid-cols-7 gap-2 text-center font-semibold mb-2">
            <div>Sun</div><div>Mon</div><div>Tue</div><div>Wed</div><div>Thu</div><div>Fri</div><div>Sat</div>
          </div>
          <div className="grid grid-cols-7 gap-2">
            {renderCalendar()}
          </div>
        </div>

        {/* Mobile List View */}
        <div className="md:hidden space-y-3">
          {renderListView()}
        </div>
      </div>
    </div>
  );
};

export default StudentAttendanceView;
