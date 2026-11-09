import { addDays, format, startOfWeek } from 'date-fns'

const toMin = (time) => {
  const [h, m] = time.split(':').map(Number)
  return h * 60 + m
}
const toTime = (minutes) => `${String(Math.floor(minutes / 60)).padStart(2, '0')}:${String(minutes % 60).padStart(2, '0')}`

export function expandRecurringEvents(events, days) {
  const daySet = new Set(days)
  const occurrences = events.filter((event) => daySet.has(event.day))
  const templates = events.filter((event) => event.recurring && event.fixed && !event.recurringSource && Number.isInteger(event.recurringWeekday))
  for (const day of days) {
    const weekday = new Date(`${day}T12:00:00`).getDay()
    for (const template of templates) {
      if (template.recurringWeekday !== weekday) continue
      const occurrence = occurrences.find((event) => event.day === day && (event.recurringSource === template.id || event.id === template.id))
      if (!occurrence) occurrences.push({ ...template, id: `${template.id}:${day}`, day, recurringSource: template.id })
    }
  }
  return occurrences.filter((event) => !event.deleted)
}

function studyWeight(course, weekStart) {
  const grades = (course.grades || []).map((grade) => Number(String(grade.value).replace('%', ''))).filter((value) => Number.isFinite(value) && value >= 0)
  const average = grades.length ? grades.reduce((sum, grade) => sum + grade, 0) / grades.length : null
  const percentage = average === null ? null : Math.min(100, average <= 10 ? average * 10 : average)
  const performance = percentage === null ? 1 : 1.3 - percentage / 200
  const deadlines = [
    ...(course.assignments || []).filter((item) => !item.completed).map((item) => item.deadline),
    ...(course.exams || []).map((item) => item.date),
  ].filter(Boolean)
  const weekDate = new Date(`${format(weekStart, 'yyyy-MM-dd')}T12:00:00`).getTime()
  const daysUntil = deadlines.map((date) => Math.ceil((new Date(`${date}T12:00:00`).getTime() - weekDate) / 86400000)).filter((days) => days >= 0 && days <= 30)
  const urgency = daysUntil.length ? 1.6 - Math.min(...daysUntil) / 50 : 1
  return course.credits * (0.7 + course.difficulty * 0.1) * (course.priority / 3) * performance * urgency
}

export function eventConflicts(events) {
  const warnings = []
  for (let i = 0; i < events.length; i += 1) {
    for (let j = i + 1; j < events.length; j += 1) {
      const a = events[i]
      const b = events[j]
      if (a.day === b.day && toMin(a.start) < toMin(b.end) && toMin(b.start) < toMin(a.end)) {
        warnings.push({ id: `${a.id}-${b.id}`, day: a.day, text: `${a.title} overlaps ${b.title}.` })
      }
    }
  }
  return warnings
}

export function generateRange(state, dates) {
  const dateSet = new Set(dates)
  const weekStarts = new Map()
  for (const date of dates) {
    const weekStart = startOfWeek(new Date(`${date}T12:00:00`), { weekStartsOn: 1 })
    weekStarts.set(format(weekStart, 'yyyy-MM-dd'), weekStart)
  }
  const events = []
  for (const weekStart of weekStarts.values()) {
    const plan = generateWeek(state, weekStart)
    events.push(...plan.events.filter((event) => dateSet.has(event.day)))
  }
  return events
}

export function generateWeek(state, weekStart = startOfWeek(new Date(), { weekStartsOn: 1 })) {
  const { settings, events, courses } = state
  const days = Array.from({ length: 7 }, (_, index) => format(addDays(weekStart, index), 'yyyy-MM-dd'))
  const weekEvents = expandRecurringEvents(events, days)
  const generated = []
  const warnings = []
  const flexible = weekEvents.filter((event) => !event.fixed && !event.locked && !event.completed && !event.generated)
  const fixed = weekEvents.filter((event) => (!event.generated && (event.fixed || event.locked || event.completed)) || event.completed || event.locked)
  const classes = weekEvents.filter((event) => event.category === 'university')
  const adjustedCommutes = []

  for (const event of fixed.filter((item) => item.category === 'commute' && item.title.toLowerCase().includes('campus'))) {
    if (event.title.toLowerCase().includes('to campus') || event.title.toLowerCase().includes('to university')) {
      const university = classes.find((item) => item.day === event.day)
      if (university && settings.commute > 0) adjustedCommutes.push({ ...event, start: toTime(Math.max(0, toMin(university.start) - settings.commute)), end: university.start })
    } else {
      const university = classes.find((item) => item.day === event.day)
      if (university && settings.commute > 0) adjustedCommutes.push({ ...event, start: university.end, end: toTime(toMin(university.end) + settings.commute) })
    }
  }
  const base = [
    ...fixed.filter((event) => !(event.category === 'commute' && event.title.toLowerCase().includes('campus'))),
    ...flexible,
    ...adjustedCommutes,
  ]

  for (const event of weekEvents.filter((item) => item.category === 'gym' && !item.generated && !item.completed)) {
    const travel = settings.gymTravel
    if (!travel) continue
    const before = toMin(event.start) - travel
    const after = toMin(event.end) + travel
    if (before >= 0) generated.push({ id: crypto.randomUUID(), day: event.day, start: toTime(before), end: event.start, title: 'Travel to gym', category: 'commute', generated: true, completed: false, fixed: true })
    else generated.push({ id: crypto.randomUUID(), day: format(addDays(new Date(`${event.day}T12:00:00`), -1), 'yyyy-MM-dd'), start: toTime(24 * 60 + before), end: '24:00', title: 'Travel to gym', category: 'commute', generated: true, completed: false, fixed: true })
    if (after <= 24 * 60) generated.push({ id: crypto.randomUUID(), day: event.day, start: event.end, end: toTime(after), title: 'Travel home from gym', category: 'commute', generated: true, completed: false, fixed: true })
    else generated.push({ id: crypto.randomUUID(), day: format(addDays(new Date(`${event.day}T12:00:00`), 1), 'yyyy-MM-dd'), start: '00:00', end: toTime(after - 24 * 60), title: 'Travel home from gym', category: 'commute', generated: true, completed: false, fixed: true })
  }

  if (settings.wakeTime || settings.weekendWakeTime) {
    for (const day of days) {
      const weekend = [0, 6].includes(new Date(`${day}T12:00:00`).getDay())
      const bedtimeValue = weekend ? settings.weekendBedtime || settings.bedtime : settings.bedtime
      const wakeValue = weekend ? settings.weekendWakeTime || settings.wakeTime : settings.wakeTime
      if (!wakeValue) continue
      const bedtime = toMin(bedtimeValue)
      const wake = toMin(wakeValue)
      const durationHours = (bedtime > wake ? 24 * 60 - bedtime + wake : wake - bedtime) / 60
      if (durationHours < 7) warnings.push({ id: `sleep-${day}`, day, text: `Your preferred sleep window is ${durationHours.toFixed(1)} hours on ${format(new Date(`${day}T12:00:00`), 'EEEE')}, below the 7-hour recovery minimum.` })
      if (bedtime > wake) {
        generated.push({ id: crypto.randomUUID(), day, start: '00:00', end: wakeValue, title: 'Protected sleep', category: 'sleep', generated: true, completed: false, fixed: true })
        generated.push({ id: crypto.randomUUID(), day, start: bedtimeValue, end: '24:00', title: 'Protected sleep', category: 'sleep', generated: true, completed: false, fixed: true })
      } else {
        generated.push({ id: crypto.randomUUID(), day, start: bedtimeValue, end: wakeValue, title: 'Protected sleep', category: 'sleep', generated: true, completed: false, fixed: true })
      }
    }
  }

  const occupiedFor = (day) => [...base.filter((event) => event.day === day), ...generated.filter((event) => event.day === day)]
  const addStudyBreak = (day, start) => {
    const end = start + 15
    if (end > 22 * 60) return
    if (occupiedFor(day).some((event) => toMin(event.start) < end && toMin(event.end) > start)) return
    generated.push({ id: crypto.randomUUID(), day, start: toTime(start), end: toTime(end), title: 'Study break', category: 'break', generated: true, completed: false, fixed: false })
  }
  for (const day of days) {
    const occupied = occupiedFor(day).map((event) => [toMin(event.start), toMin(event.end)]).sort((a, b) => a[0] - b[0])
    let mealStart = null
    for (const [windowStart, windowEnd] of [[12 * 60, 14 * 60], [16 * 60, 19 * 60]]) {
      let cursor = windowStart
      for (const [start, end] of [...occupied, [windowEnd, windowEnd]]) {
        if (start - cursor >= 30 && cursor + 30 <= windowEnd) {
          mealStart = cursor
          break
        }
        cursor = Math.max(cursor, end)
      }
      if (mealStart !== null) break
    }
    if (mealStart !== null) generated.push({ id: crypto.randomUUID(), day, start: toTime(mealStart), end: toTime(mealStart + 30), title: 'Meal break', category: 'meal', generated: true, completed: false, fixed: false })
  }

  const priorityCourse = courses.length ? { ...[...courses].sort((a, b) => studyWeight(b, weekStart) - studyWeight(a, weekStart))[0] } : null
  const manualStudyMinutes = base.filter((event) => event.category === 'study').reduce((sum, event) => sum + toMin(event.end) - toMin(event.start), 0)
    + (state.studySessions || []).filter((session) => session.completed && days.includes(session.day)).reduce((sum, session) => sum + (session.minutes || 0), 0)
  const plannedStudy = Math.max(0, settings.weeklyStudyTarget - manualStudyMinutes / 60)
  const wednesday = days[2]
  if (priorityCourse && plannedStudy > 0) {
    const occupied = occupiedFor(wednesday).map((event) => [toMin(event.start), toMin(event.end)]).sort((a, b) => a[0] - b[0])
    let studyStart = 14 * 60
    for (const [start, end] of occupied) {
      if (studyStart + 90 <= start) break
      if (studyStart < end) studyStart = end + 15
    }
    if (studyStart + 90 <= 16 * 60 + 15) {
      generated.push({ id: crypto.randomUUID(), day: wednesday, start: toTime(studyStart), end: toTime(studyStart + 90), title: priorityCourse.name, category: 'study', courseId: priorityCourse.id, priority: priorityCourse.priority, fixed: false, generated: true, completed: false, locked: false, sessionType: 'Reviewing lessons' })
      addStudyBreak(wednesday, studyStart + 90)
      priorityCourse.plannedStudyMinutes = 90
    } else {
      priorityCourse.plannedStudyMinutes = 0
    }
  }

  for (let index = 0; index < 5; index += 1) {
    const day = days[index]
    const current = occupiedFor(day)
    const occupied = current.map((e) => [toMin(e.start), toMin(e.end)]).sort((a, b) => a[0] - b[0])
    const loggedWorkMinutes = (state.workSessions || []).filter((session) => session.day === day).reduce((sum, session) => sum + (session.minutes || 0), 0)
    let remaining = Math.max(0, settings.dailyWorkTarget * 60 - loggedWorkMinutes - current.filter((event) => event.category === 'work').reduce((sum, event) => sum + toMin(event.end) - toMin(event.start), 0))
    let cursor = 8 * 60
    const slots = []
    for (const [start, end] of [...occupied, [24 * 60, 24 * 60]]) {
      if (start - cursor >= 30) slots.push([Math.max(cursor, settings.wakeTime ? toMin(settings.wakeTime) : cursor), start])
      cursor = Math.max(cursor, end)
    }
    if (cursor < 24 * 60 && 24 * 60 - cursor >= 30) slots.push([cursor, 24 * 60])
    for (const [start, end] of slots) {
      if (!remaining) break
      let slotStart = start
      while (remaining > 0 && end - slotStart >= 30) {
        const workDuration = Math.min(end - slotStart, remaining, 180)
        if (workDuration < 30) break
        generated.push({ id: crypto.randomUUID(), day, start: toTime(slotStart), end: toTime(slotStart + workDuration), title: 'Remote sales work', category: 'work', fixed: false, generated: true, completed: false, locked: false })
        remaining -= workDuration
        slotStart += workDuration
        if (remaining > 0 && end - slotStart > 15) {
          generated.push({ id: crypto.randomUUID(), day, start: toTime(slotStart), end: toTime(slotStart + 15), title: 'Work break', category: 'break', generated: true, completed: false, fixed: false })
          slotStart += 15
        }
      }
    }
    if (remaining > 0) warnings.push({ id: `work-${day}`, day, text: `${(remaining / 60).toFixed(1)}h work target could not fit on ${format(addDays(weekStart, index), 'EEEE')}. No weekend work was added.` })
  }
  for (const day of days.slice(0, 5)) {
    const nextDay = format(addDays(new Date(`${day}T12:00:00`), 1), 'yyyy-MM-dd')
    const nextClass = events.find((event) => event.day === nextDay && event.category === 'university')
    const latestWorkEnd = generated.filter((event) => event.day === day && event.category === 'work').reduce((latest, event) => Math.max(latest, toMin(event.end)), 0)
    if (nextClass && toMin(nextClass.start) <= 9 * 60 && latestWorkEnd >= 23 * 60) {
      warnings.push({ id: `late-work-${day}`, day, text: `Work ends at ${toTime(latestWorkEnd)} before an early university class the next morning. Review this shift to protect recovery.` })
    }
  }

  const courseWeights = courses.map((c) => ({ ...c, weight: studyWeight(c, weekStart) }))
  const sumWeights = courseWeights.reduce((sum, c) => sum + c.weight, 0) || 1
  let studyHours = courseWeights.map((c) => ({ ...c, hours: Math.max(0.5, plannedStudy * c.weight / sumWeights) }))
  const total = studyHours.reduce((sum, c) => sum + c.hours, 0)
  if (total > plannedStudy && studyHours.length) {
    const reduction = (total - plannedStudy) / studyHours.length
    studyHours = studyHours.map((c) => ({ ...c, hours: Math.max(0.5, c.hours - reduction) }))
  }
  if (priorityCourse?.plannedStudyMinutes) {
    const allocation = studyHours.find((course) => course.id === priorityCourse.id)
    if (allocation) allocation.hours = Math.max(0, allocation.hours - priorityCourse.plannedStudyMinutes / 60)
  }
  const studyDays = [2, 3, 4, 5, 6]
  let dayIndex = 0
  for (const course of studyHours) {
    let remaining = Math.round(course.hours * 2) / 2
    while (remaining > 0 && dayIndex < 140) {
      const dayOffset = studyDays[dayIndex % studyDays.length]
      const day = days[dayOffset]
      const duration = Math.min(remaining, 2)
      const alreadyStudying = base.filter((event) => event.day === day && event.category === 'study').reduce((sum, event) => sum + toMin(event.end) - toMin(event.start), 0)
        + (state.studySessions || []).filter((session) => session.completed && session.day === day).reduce((sum, session) => sum + (session.minutes || 0), 0)
        + generated.filter((event) => event.day === day && event.category === 'study').reduce((sum, event) => sum + toMin(event.end) - toMin(event.start), 0)
      const current = occupiedFor(day)
      const occupied = current.map((e) => [toMin(e.start), toMin(e.end)]).sort((a, b) => a[0] - b[0])
      const preferred = dayOffset === 5 || dayOffset === 6 ? 9 * 60 : (dayOffset === 2 ? 13 * 60 : 14 * 60)
      let start = preferred
      for (const [left, right] of occupied) {
        if (start + duration * 60 <= left) break
        if (start < right) start = right + 30
      }
      if (alreadyStudying + duration * 60 <= 6 * 60 && start < 21 * 60 && start + duration * 60 <= 22 * 60) {
        generated.push({ id: crypto.randomUUID(), day, start: toTime(start), end: toTime(start + duration * 60), title: course.name, category: 'study', courseId: course.id, priority: course.priority, fixed: false, generated: true, completed: false, locked: false, sessionType: 'Reviewing lessons' })
        addStudyBreak(day, start + duration * 60)
        remaining -= duration
      }
      dayIndex += 1
    }
  }
  const studyMinutes = generated.filter((event) => event.category === 'study').reduce((sum, event) => sum + toMin(event.end) - toMin(event.start), 0)
  if (studyMinutes + manualStudyMinutes < settings.weeklyStudyTarget * 60) warnings.push({ id: 'study-target', day: days[5], text: `Only ${((studyMinutes + manualStudyMinutes) / 60).toFixed(1)} of ${settings.weeklyStudyTarget} study hours fit this week. Consider lowering your target or moving flexible personal events.` })
  return { events: [...events.filter((event) => !days.includes(event.day) || event.deleted), ...base, ...generated], warnings }
}

export { toMin }
