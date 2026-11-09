import { createContext, useContext, useEffect, useMemo, useState } from 'react'
import { addDays, startOfWeek } from 'date-fns'
import { createInitialState } from './data'
import { generateWeek } from './scheduler'

const STORAGE_KEY = 'mighty-os-v1'
const Context = createContext(null)

export function AppProvider({ children }) {
  const [state, setState] = useState(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY)
      if (!saved) return createInitialState()
      const parsed = JSON.parse(saved)
      const defaults = createInitialState()
      const existingEvents = parsed.events || []
      const hasIncorrectTuesdayGym = existingEvents.some((event) =>
        event.category === 'gym' &&
        event.recurring &&
        event.recurringWeekday === 2 &&
        event.start === '17:00' &&
        event.end === '21:00' &&
        event.title === 'Gym commitment',
      )
      const migratedEvents = existingEvents.filter((event) =>
        !(
          event.category === 'gym' &&
          event.recurring &&
          event.recurringWeekday === 2 &&
          event.start === '17:00' &&
          event.end === '21:00' &&
          event.title === 'Gym commitment'
        ) &&
        !(
          event.generated &&
          event.category === 'commute' &&
          new Date(`${event.day}T12:00:00`).getDay() === 2 &&
          ['Travel to gym', 'Travel home from gym'].includes(event.title)
        ),
      )
      const newGymCommitments = defaults.events.filter((event) =>
        event.category === 'gym' &&
        [3, 5].includes(event.recurringWeekday) &&
        !existingEvents.some((savedEvent) =>
          savedEvent.category === 'gym' &&
          savedEvent.recurringWeekday === event.recurringWeekday &&
          savedEvent.start === event.start &&
          savedEvent.end === event.end,
        ),
      )
      const loaded = { ...defaults, ...parsed, events: [...migratedEvents, ...newGymCommitments], settings: { ...defaults.settings, ...parsed.settings } }
      if (hasIncorrectTuesdayGym && loaded.scheduleGenerated) {
        const thisWeek = startOfWeek(new Date(), { weekStartsOn: 1 })
        const recalculated = generateWeek(loaded, thisWeek)
        return { ...loaded, events: recalculated.events }
      }
      return loaded
    } catch (error) {
      console.error('Could not load saved MIGHTY OS data.', error)
      return createInitialState()
    }
  })

  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(state))
    } catch (error) {
      console.error('Could not save MIGHTY OS data to local storage.', error)
    }
  }, [state])

  const actions = useMemo(() => ({
    setState,
    updateSettings: (settings) => setState((s) => ({ ...s, settings: { ...s.settings, ...settings } })),
    addEvent: (event) => setState((s) => ({ ...s, events: [...s.events, { id: crypto.randomUUID(), completed: false, fixed: false, locked: false, ...event }] })),
    updateEvent: (id, patch) => setState((s) => {
      const exists = s.events.some((event) => event.id === id)
      return { ...s, events: exists ? s.events.map((event) => event.id === id ? { ...event, ...patch } : event) : [...s.events, { id, fixed: true, completed: false, locked: false, ...patch }] }
    }),
    deleteEvent: (id) => setState((s) => {
      const event = s.events.find((item) => item.id === id)
      if (event && !event.recurringSource) return { ...s, events: s.events.filter((item) => item.id !== id) }
      const recurringSource = event?.recurringSource ? s.events.find((item) => item.id === event.recurringSource) : s.events.find((item) => id.startsWith(`${item.id}:`))
      if (!recurringSource) return s
      const day = event?.day || id.slice(recurringSource.id.length + 1)
      return { ...s, events: [...s.events.filter((item) => item.id !== id), { id, day, recurringSource: recurringSource.id, deleted: true }] }
    }),
    addCourse: (course) => setState((s) => ({ ...s, courses: [...s.courses, { id: crypto.randomUUID(), assignments: [], exams: [], grades: [], resources: [], notes: '', target: 2, priority: 3, difficulty: 3, color: '#a78bfa', ...course }] })),
    updateCourse: (id, patch) => setState((s) => ({ ...s, courses: s.courses.map((c) => c.id === id ? { ...c, ...patch } : c) })),
    deleteCourse: (id) => setState((s) => ({ ...s, courses: s.courses.filter((c) => c.id !== id), studySessions: s.studySessions.filter((session) => session.courseId !== id), events: s.events.filter((event) => event.courseId !== id), timer: s.timer?.type === 'study' && s.timer.courseId === id ? null : s.timer })),
    addTask: (task) => setState((s) => ({ ...s, tasks: [...s.tasks, { id: crypto.randomUUID(), completed: false, ...task }] })),
    updateTask: (id, patch) => setState((s) => ({ ...s, tasks: s.tasks.map((t) => t.id === id ? { ...t, ...patch } : t) })),
    deleteTask: (id) => setState((s) => ({ ...s, tasks: s.tasks.filter((t) => t.id !== id) })),
    addStudySession: (session) => setState((s) => ({ ...s, studySessions: [...s.studySessions, { id: crypto.randomUUID(), completed: true, ...session }] })),
  }), [])

  return <Context.Provider value={{ state, ...actions }}>{children}</Context.Provider>
}

export const useApp = () => useContext(Context)
