import React from 'react';
import { Schedule, Course } from '../../types';
import { Clock, Coffee } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

interface ScheduleCardProps {
  schedule: Schedule;
  userType: string;
  courses: Course[];
}

const ScheduleCard: React.FC<ScheduleCardProps> = ({ schedule, userType, courses }) => {
  const navigate = useNavigate();

  const getCourseInfo = (subjectId: string) => {
    const course = courses.find(c => c.course_id === subjectId);
    return course || null;
  };

  const formatSubject = (subject: string) => {
    if (subject === 'BREAK') {
      return {
        shortName: <Coffee className="w-5 h-5 text-gray-500" />,
        longName: 'Break',
        color: '#F3F4F6',
        textColor: 'text-gray-500'
      };
    }

    const courseInfo = getCourseInfo(subject);
    const parts = subject.split('-');
    const subjectCode = parts[0];
    const classCode = parts.slice(1).join('-');

    const subjectMap: { [key: string]: { short: string, long: string } } = {
      'MAT': { short: 'Math', long: 'Mathematics' },
      'SCI': { short: 'Sci', long: 'Science' },
      'SOC': { short: 'Soc Sci', long: 'Social Science' },
      'ENG': { short: 'Eng', long: 'English' },
      'LANG': { short: 'Lang', long: 'Language' },
      'CS': { short: 'CS', long: 'Computer Sci' },
      'HIS':{ short: 'Hist', long: 'History'},
      'PHY':{ short: 'Physical', long: 'Physical Ed.'},
        'ART':{ short: 'Art', long: 'Arts'},

    };

    const names = subjectMap[subjectCode] || { short: subjectCode, long: subject };

    const displayName = {
      shortName: userType === 'TEACHER' ? classCode : names.short,
      longName: userType === 'TEACHER' ? `${names.long} (${classCode})` : names.long,
    };

    return {
      ...displayName,
      color: courseInfo?.accent_color || '#E5E7EB',
      textColor: 'text-white'
    };
  };

  const renderSchedulePeriod = (subjects: string[], period: 'morning' | 'afternoon') => (
    <div>
      <h3 className="text-lg font-medium text-gray-800 mb-3 capitalize">{period}</h3>
      <div className="grid grid-cols-3 gap-2 md:flex md:space-x-2">
        {subjects.map((subject, index) => {
          const { shortName, longName, color, textColor } = formatSubject(subject);
          
          const isBreak = subject === 'BREAK';

          return (
            <div 
              key={index} 
              onClick={() => !isBreak && navigate(`/course/${subject}`)}
              className={`flex-1 flex items-center justify-center p-2 rounded-lg text-center transition-transform transform ${
                !isBreak ? 'cursor-pointer hover:scale-105 hover:shadow-md' : ''
              }`}
              style={{ backgroundColor: color }}
            >
              <div className={`text-sm font-bold ${textColor}`}>
                <span className="md:hidden">{shortName}</span>
                <span className="hidden md:inline">{longName}</span>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );

  return (
    <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-4 md:p-6">
      <div className="flex items-center space-x-3 mb-4 md:mb-6">
        <Clock className="w-6 h-6 text-blue-600" />
        <h2 className="text-xl font-semibold text-gray-900">Today's Schedule</h2>
      </div>

      <div className="space-y-4 md:space-y-6">
        {renderSchedulePeriod(schedule.morning_subs, 'morning')}
        {renderSchedulePeriod(schedule.aftnoon_subs, 'afternoon')}
      </div>
    </div>
  );
};

export default ScheduleCard;