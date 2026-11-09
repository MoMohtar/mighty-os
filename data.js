import { addDays, format, startOfWeek } from 'date-fns'

export const courseSeed = [
  { id: 'oop', name: 'Object-Oriented Programming', credits: 5, color: '#a78bfa', difficulty: 4, target: 4.5, priority: 5, notes: '', assignments: [], exams: [], grades: [], resources: [] },
  { id: 'web', name: 'Web Programming', credits: 5, color: '#60a5fa', difficulty: 3, target: 4.5, priority: 5, notes: '', assignments: [], exams: [], grades: [], resources: [] },
  { id: 'entrepreneurship', name: 'Foundations of Entrepreneurship', credits: 4, color: '#fbbf24', difficulty: 2, target: 2.5, priority: 3, notes: '', assignments: [], exams: [], grades: [], resources: [] },
  { id: 'hrm', name: 'Human Resource Management', credits: 4, color: '#fb7185', difficulty: 2, target: 2.5, priority: 3, notes: '', assignments: [], exams: [], grades: [], resources: [] },
  { id: 'dbms', name: 'Database Management Systems', credits: 5, color: '#34d399', difficulty: 4, target: 4, priority: 4, notes: '', assignments: [], exams: [], grades: [], resources: [] },
  { id: 'data-analysis', name: 'Data Analysis', credits: 5, color: '#22d3ee', difficulty: 4, target: 4, priority: 4, notes: '', assignments: [], exams: [], grades: [], resources: [] },
  { id: 'research', name: 'Research Methods', credits: 3, color: '#f472b6', difficulty: 3, target: 2, priority: 2, notes: '', assignments: [], exams: [], grades: [], resources: [] },
  { id: 'statistics', name: 'Deductive Statistics', credits: 5, color: '#fb923c', difficulty: 5, target: 4, priority: 5, notes: '', assignments: [], exams: [], grades: [], resources: [] },
]

export const navGroups = [
  { label: 'WORKSPACE', items: [['Dashboard', 'LayoutDashboard'], ['My Calendar', 'CalendarDays'], ['Smart Scheduler', 'WandSparkles']] },
  { label: 'LIFE AREAS', items: [['Work', 'BriefcaseBusiness'], ['University', 'GraduationCap'], ['Study Planner', 'BookOpen'], ['Gym', 'Dumbbell'], ['Tasks', 'CheckSquare2']] },
  { label: 'INSIGHTS', items: [['Analytics', 'ChartNoAxesCombined'], ['Sleep & Recovery', 'MoonStar'], ['Settings', 'Settings2']] },
]

const uid = () => Math.random().toString(36).slice(2, 10)
const addEvent = (day, start, end, title, category, extra = {}) => ({ id: uid(), day, start, end, title, category, fixed: true, completed: false, locked: false, recurring: true, recurringWeekday: new Date(`${day}T12:00:00`).getDay(), ...extra })

export function createInitialState() {
  const monday = startOfWeek(new Date(), { weekStartsOn: 1 })
  const weekKey = format(monday, 'yyyy-MM-dd')
  const events = []
  const weekdays = [0, 1, 2, 3, 4]
  for (const offset of weekdays) {
    const day = format(addDays(monday, offset), 'yyyy-MM-dd')
    if (offset === 0) {
      events.push(addEvent(day, '08:00', '08:30', 'Commute to campus', 'commute'))
      events.push(addEvent(day, '08:30', '12:15', 'University classes', 'university'))
      events.push(addEvent(day, '12:15', '12:45', 'Commute home', 'commute'))
      events.push(addEvent(day, '17:00', '21:00', 'Gym commitment', 'gym'))
    } else if (offset === 1) {
      events.push(addEvent(day, '07:30', '08:00', 'Commute to campus', 'commute'))
      events.push(addEvent(day, '08:00', '16:00', 'University classes', 'university'))
      events.push(addEvent(day, '16:00', '16:30', 'Commute home', 'commute'))
    } else if (offset === 3) {
      events.push(addEvent(day, '10:30', '11:00', 'Commute to campus', 'commute'))
      events.push(addEvent(day, '11:00', '12:30', 'University classes', 'university'))
      events.push(addEvent(day, '12:30', '13:00', 'Commute home', 'commute'))
    } else if (offset === 4) {
      events.push(addEvent(day, '09:00', '09:30', 'Commute to campus', 'commute'))
      events.push(addEvent(day, '09:30', '11:30', 'University classes', 'university'))
      events.push(addEvent(day, '11:30', '12:00', 'Commute home', 'commute'))
    }
  }
  for (const offset of [2, 4]) {
    const day = format(addDays(monday, offset), 'yyyy-MM-dd')
    events.push(addEvent(day, '17:00', '21:00', 'Gym commitment', 'gym'))
  }
  return {
    settings: { commute: 30, gymTravel: 30, dailyWorkTarget: 6, weeklyStudyTarget: 20, idealStudyTarget: 25, bedtime: '23:00', wakeTime: '', weekendBedtime: '', weekendWakeTime: '', sleepHours: 8, windDown: 30, pomodoroStudy: 25, pomodoroBreak: 5 },
    courses: courseSeed,
    events,
    tasks: [],
    workSessions: [],
    studySessions: [],
    sleepLogs: [],
    timer: null,
    activeWeek: weekKey,
    scheduleGenerated: false,
  }
}
