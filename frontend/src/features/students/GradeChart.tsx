import React from 'react';
import Award from 'lucide-react/dist/esm/icons/award';

interface GradesProps {
  grades: {
    s: number;
    a: number;
    b: number;
    c: number;
    d: number;
    overall: string;
  };
}

const GradeChart: React.FC<GradesProps> = ({ grades }) => {
  const gradeData = [
    { grade: 'S', count: grades.s, color: 'bg-purple-500' },
    { grade: 'A', count: grades.a, color: 'bg-green-500' },
    { grade: 'B', count: grades.b, color: 'bg-blue-500' },
    { grade: 'C', count: grades.c, color: 'bg-yellow-500' },
    { grade: 'D', count: grades.d, color: 'bg-red-500' },
  ];

  const totalGrades = gradeData.reduce((sum, item) => sum + item.count, 0);

  return (
    <div className="bg-white p-4 md:p-6 rounded-lg shadow-sm">
      <h2 className="text-xl font-bold mb-4 flex items-center">
        <Award className="mr-2 text-gray-600" />
        Grades
      </h2>
      <div className="grid grid-cols-5 gap-x-2 md:gap-x-4 items-end h-40">
        {gradeData.map((item) => (
          <div
            key={item.grade}
            className="flex h-full flex-col items-center justify-end"
          >
            <div
              className={`w-full ${item.color} rounded-t-md transition-all ease-in-out duration-500`}
              style={{
                height: `${
                  totalGrades > 0 ? (item.count / totalGrades) * 100 : 0
                }%`,
                minHeight: "4px",
              }}
            />
            <span className="text-xs font-bold mt-1">{item.grade}</span>
            <span className="text-xs text-gray-500">({item.count})</span>
          </div>
        ))}
      </div>
      <div className="text-center mt-4">
        <span className="text-lg font-semibold">Overall Grade: </span>
        <span className="text-2xl font-bold text-blue-600">{grades.overall}</span>
      </div>
    </div>
  );
};

export default GradeChart;
