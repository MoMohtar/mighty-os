import { useEffect, useMemo, useState } from 'react'
import { Link, NavLink, Navigate, Route, Routes, useLocation, useNavigate } from 'react-router-dom'
import {
  Activity, AlarmClock, ArrowDownRight, ArrowUpRight, Bell, BookOpen, BriefcaseBusiness, CalendarDays, ChartNoAxesCombined,
  Check, CheckCheck, CheckSquare2, ChevronDown, ChevronLeft, ChevronRight, CircleHelp, Clock3, Dumbbell,
  GraduationCap, LayoutDashboard, LogOut, Menu, MoonStar, MoreHorizontal, Plus, Search, Settings2,
  Sparkles, Target, Timer, WandSparkles, X, Zap,
} from 'lucide-react'
import { addDays, format, isSameDay, startOfMonth, startOfWeek, subDays } from 'date-fns'
import { Bar, BarChart, CartesianGrid, Cell, Pie, PieChart, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts'
import { navGroups } from './data'
import { useApp } from './state'
import { eventConflicts, expandRecurringEvents, generateRange, generateWeek, toMin } from './scheduler'

const icons = { LayoutDashboard, CalendarDays, WandSparkles, BriefcaseBusiness, GraduationCap, BookOpen, Dumbbell, CheckSquare2, ChartNoAxesCombined, Activity, MoonStar, Settings2 }
const titles = Object.fromEntries(navGroups.flatMap((group) => group.items.map(([name]) => [name.toLowerCase().replaceAll(' ', '-').replace('&', 'and'), name])))
const pathFor = (name) => `/${name.toLowerCase().replaceAll(' ', '-').replace('&', 'and')}`
const today = format(new Date(), 'yyyy-MM-dd')
const fmtHours = (minutes) => `${Math.floor(minutes / 60)}h ${minutes % 60 ? `${minutes % 60}m` : ''}`.trim()
const duration = (event) => Math.max(0, toMin(event.end) - toMin(event.start))
const eventColors = { university: '#4d8df5', work: '#ff8b38', study: '#a78bfa', gym: '#48c78e', sleep: '#68707e', personal: '#8b909b', commute: '#536c90', break: '#b7bdc8', meal: '#d9a441' }

function Card({ children, className = '' }) {
  return <section className={`card ${className}`}>{children}</section>
}

function PageTitle({ eyebrow, title, description, action }) {
  return <div className="page-title"><div><div className="eyebrow">{eyebrow}</div><h1>{title}</h1>{description && <p>{description}</p>}</div>{action}</div>
}

function Button({ children, variant = 'secondary', className = '', ...props }) {
  return <button className={`button ${variant} ${className}`} {...props}>{children}</button>
}

function StatCard({ label, value, detail, icon: Icon, tone = 'orange', trend }) {
  return <Card className="stat-card"><div className={`stat-icon ${tone}`}><Icon size={18} /></div><div className="stat-label">{label}</div><div className="stat-value">{value}</div><div className="stat-detail">{trend && <span className="trend"><ArrowUpRight size={13} />{trend}</span>}{detail}</div></Card>
}

function App() {
  const [sidebarOpen, setSidebarOpen] = useState(false)
  const [searchOpen, setSearchOpen] = useState(false)
  const { state } = useApp()
  const location = useLocation()
  const navigate = useNavigate()
  const active = titles[location.pathname.slice(1)] || 'Dashboard'
  useEffect(() => setSidebarOpen(false), [location.pathname])
  useEffect(() => {
    const handler = (event) => {
      if ((event.ctrlKey || event.metaKey) && event.key.toLowerCase() === 'k') { event.preventDefault(); setSearchOpen(true) }
      if (event.key === 'Escape') setSearchOpen(false)
    }
    window.addEventListener('keydown', handler)
    return () => window.removeEventListener('keydown', handler)
  }, [])
  return <div className="app-shell">
    {sidebarOpen && <button className="mobile-backdrop" onClick={() => setSidebarOpen(false)} aria-label="Close navigation" />}
    <aside className={`sidebar ${sidebarOpen ? 'open' : ''}`}>
      <Link to="/" className="brand"><div className="brand-mark"><Zap size={19} fill="currentColor" /></div><div><strong>MIGHTY<span>OS</span></strong><small>PERSONAL OPERATING SYSTEM</small></div></Link>
      <button className="workspace-picker"><div className="workspace-avatar">M</div><div><b>My workspace</b><small>Personal space</small></div><ChevronDown size={15} /></button>
      <nav className="nav-scroll">{navGroups.map((group) => <div key={group.label} className="nav-group"><div className="nav-label">{group.label}</div>{group.items.map(([name, iconName]) => {
        const Icon = icons[iconName]
        return <NavLink key={name} to={pathFor(name)} end={name === 'Dashboard'} className={({ isActive }) => `nav-link ${isActive ? 'active' : ''}`}><Icon size={17} strokeWidth={1.8} /><span>{name}</span>{name === 'Tasks' && <span className="nav-count">{state.tasks.filter((task) => !task.completed).length || ''}</span>}</NavLink>
      })}</div>)}</nav>
      <div className="sidebar-bottom"><Card className="focus-card"><div className="focus-top"><div className="focus-icon"><Target size={16} /></div><span>WEEKLY FOCUS</span><MoreHorizontal size={17} /></div><b>Build your rhythm</b><p>One intentional day at a time.</p><div className="focus-progress"><i style={{ width: '42%' }} /></div><small>Keep your momentum going</small></Card><button className="user-row"><div className="user-avatar">M</div><div><b>My profile</b><small>Personal account</small></div><MoreHorizontal size={16} /></button></div>
    </aside>
    <main className="main-area">
      <header className="topbar"><button className="icon-button mobile-menu" onClick={() => setSidebarOpen(true)} aria-label="Open navigation"><Menu size={19} /></button><div className="breadcrumbs"><span>Workspace</span><ChevronRight size={14} /><b>{active}</b></div><div className="top-actions"><button className="search-trigger" onClick={() => setSearchOpen(true)}><Search size={16} /><span>Search anything...</span><kbd>⌘ K</kbd></button><button className="icon-button notification-button" aria-label="Notifications"><Bell size={18} /><i /></button><div className="top-avatar">M</div></div></header>
      <div className="content"><Routes>
        <Route path="/" element={<Dashboard />} />
        <Route path="/dashboard" element={<Dashboard />} />
        <Route path="/my-calendar" element={<CalendarPage />} />
        <Route path="/smart-scheduler" element={<SchedulerPage />} />
        <Route path="/work" element={<WorkPage />} />
        <Route path="/university" element={<UniversityPage />} />
        <Route path="/study-planner" element={<StudyPage />} />
        <Route path="/gym" element={<GymPage />} />
        <Route path="/tasks" element={<TasksPage />} />
        <Route path="/analytics" element={<AnalyticsPage />} />
        <Route path="/sleep-and-recovery" element={<SleepPage />} />
        <Route path="/settings" element={<SettingsPage />} />
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes></div>
    </main>
    {searchOpen && <SearchModal onClose={() => setSearchOpen(false)} onNavigate={navigate} />}
  </div>
}

function Dashboard() {
  const { state } = useApp()
  const now = new Date()
  const todays = expandRecurringEvents(state.events, [today]).sort((a, b) => a.start.localeCompare(b.start))
  const workToday = state.workSessions.filter((session) => session.day === today).reduce((sum, session) => sum + (session.minutes || 0), 0)
  const studyWeek = state.studySessions.filter((session) => session.completed && session.day >= format(startOfWeek(now, { weekStartsOn: 1 }), 'yyyy-MM-dd')).reduce((sum, session) => sum + (session.minutes || 0), 0)
  const todayWorkPlanned = todays.filter((event) => event.category === 'work').reduce((sum, event) => sum + duration(event), 0)
  const greeting = now.getHours() < 12 ? 'Good morning' : now.getHours() < 18 ? 'Good afternoon' : 'Good evening'
  const weekData = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'].map((day, i) => {
    const date = format(addDays(startOfWeek(now, { weekStartsOn: 1 }), i), 'yyyy-MM-dd')
    return { day, work: state.workSessions.filter((s) => s.day === date).reduce((sum, s) => sum + (s.minutes || 0), 0) / 60, study: state.studySessions.filter((s) => s.day === date && s.completed).reduce((sum, s) => sum + (s.minutes || 0), 0) / 60 }
  })
  return <>
    <PageTitle eyebrow={format(now, 'EEEE, MMMM do, yyyy').toUpperCase()} title={`${greeting}, Mighty.`} description="Here's your personal overview for today." action={<Link className="button primary" to="/smart-scheduler"><WandSparkles size={16} /> Generate my week</Link>} />
    <div className="hero-strip"><div className="hero-spark"><Sparkles size={18} /></div><div><b>Make today count, not complicated.</b><p>Small, consistent steps build remarkable momentum.</p></div><span className="hero-date">{format(now, 'EEE, MMM d')}</span></div>
    <div className="stats-grid">
      <StatCard label="WORK TODAY" value={`${(workToday / 60).toFixed(1)}h`} detail={`of ${todayWorkPlanned ? (todayWorkPlanned / 60).toFixed(0) : state.settings.dailyWorkTarget}h target`} icon={BriefcaseBusiness} />
      <StatCard label="STUDY THIS WEEK" value={`${(studyWeek / 60).toFixed(1)}h`} detail={`of ${state.settings.weeklyStudyTarget}h weekly target`} icon={BookOpen} tone="purple" />
      <StatCard label="UP NEXT" value={todays[0]?.start || '—'} detail={todays[0]?.title || 'Clear calendar'} icon={Clock3} tone="blue" />
      <StatCard label="OPEN TASKS" value={state.tasks.filter((task) => !task.completed).length} detail="Keep your priorities close" icon={CheckSquare2} tone="green" />
    </div>
    <div className="dashboard-grid">
      <Card className="chart-card"><div className="section-head"><div><h2>Your week at a glance</h2><p>Time invested across work and study</p></div><button className="subtle-select">This week <ChevronDown size={14} /></button></div><div className="chart-wrap"><ResponsiveContainer width="100%" height="100%"><BarChart data={weekData} barGap={5}><CartesianGrid stroke="#29292c" vertical={false} /><XAxis dataKey="day" tickLine={false} axisLine={false} tick={{ fill: '#85858c', fontSize: 11 }} dy={10} /><YAxis tickLine={false} axisLine={false} tick={{ fill: '#77777e', fontSize: 10 }} width={27} /><Tooltip contentStyle={{ background: '#202023', border: '1px solid #36363a', borderRadius: 10 }} /><Bar dataKey="work" name="Work" fill="#ff8b38" radius={[4, 4, 0, 0]} maxBarSize={14} /><Bar dataKey="study" name="Study" fill="#a78bfa" radius={[4, 4, 0, 0]} maxBarSize={14} /></BarChart></ResponsiveContainer></div><div className="chart-legend"><span><i className="orange-dot" />Work</span><span><i className="purple-dot" />Study</span></div></Card>
      <Card className="today-card"><div className="section-head"><div><h2>Today's agenda</h2><p>{todays.length} planned activities</p></div><Link to="/my-calendar" className="text-link">View calendar <ChevronRight size={14} /></Link></div><div className="agenda-list">{todays.slice(0, 5).map((event) => <AgendaRow event={event} key={event.id} />)}{!todays.length && <Empty title="A clear day" text="Add an event or plan your week to get started." />}</div><Link to="/my-calendar" className="agenda-footer">Open daily schedule <ArrowUpRight size={15} /></Link></Card>
      <Card className="courses-card"><div className="section-head"><div><h2>Course progress</h2><p>Keep learning in motion</p></div><Link to="/university" className="text-link">All courses <ChevronRight size={14} /></Link></div><div className="course-mini-list">{state.courses.slice(0, 4).map((course) => <div className="course-mini" key={course.id}><div className="course-color" style={{ background: course.color }} /><div className="course-mini-info"><b>{course.name}</b><div className="progress-track"><i style={{ width: `${courseProgress(course, state)}%`, background: course.color }} /></div></div><span>{courseProgress(course, state)}%</span></div>)}</div></Card>
      <Card className="tasks-card"><div className="section-head"><div><h2>Priority tasks</h2><p>Focus on what matters next</p></div><Link to="/tasks" className="text-link">See all <ChevronRight size={14} /></Link></div><TaskList limit={4} /></Card>
    </div>
  </>
}

function courseProgress(course, state) {
  const targetMinutes = Math.max(course.target * 60, 1)
  const minutes = state.studySessions.filter((session) => session.courseId === course.id && session.completed).reduce((sum, session) => sum + (session.minutes || 0), 0)
  const assignmentDone = course.assignments.filter((a) => a.completed).length
  const assignmentCount = course.assignments.length
  return Math.min(100, Math.round(minutes / targetMinutes * 75 + (assignmentCount ? assignmentDone / assignmentCount * 25 : 0)))
}

function AgendaRow({ event }) {
  const { updateEvent } = useApp()
  return <div className={`agenda-row ${event.completed ? 'is-completed' : ''}`}><div className="agenda-time">{event.start}<small>{event.end}</small></div><div className="agenda-line" style={{ background: eventColors[event.category] || eventColors.personal }} /><div className="agenda-event"><b>{event.title}</b><small>{event.category}</small></div><button className="check-button" onClick={() => updateEvent(event.id, { completed: !event.completed })} aria-label="Toggle event completion">{event.completed ? <Check size={14} /> : <span />}</button></div>
}

function Empty({ title, text }) {
  return <div className="empty-state"><div><CalendarDays size={18} /></div><b>{title}</b><p>{text}</p></div>
}

function CalendarPage() {
  const { state, addEvent, updateEvent, deleteEvent } = useApp()
  const [view, setView] = useState('Week')
  const [anchor, setAnchor] = useState(new Date())
  const [showForm, setShowForm] = useState(false)
  const [selectedDay, setSelectedDay] = useState(today)
  const [editingEvent, setEditingEvent] = useState(null)
  const weekStart = startOfWeek(anchor, { weekStartsOn: 1 })
  const days = Array.from({ length: 7 }, (_, i) => format(addDays(weekStart, i), 'yyyy-MM-dd'))
  const monthDays = Array.from({ length: 35 }, (_, i) => addDays(startOfWeek(startOfMonth(anchor), { weekStartsOn: 1 }), i))
  const calendarDays = view === 'Month' ? monthDays.map((date) => format(date, 'yyyy-MM-dd')) : view === 'Day' ? [selectedDay] : days
  const calendarEvents = useMemo(() => generateRange(state, calendarDays), [state, calendarDays.join('|')])
  const title = view === 'Month' ? format(anchor, 'MMMM yyyy') : view === 'Day' ? format(new Date(`${selectedDay}T12:00:00`), 'EEEE, MMM d, yyyy') : `${format(weekStart, 'MMM d')} – ${format(addDays(weekStart, 6), 'MMM d, yyyy')}`
  const shift = (n) => setAnchor((date) => view === 'Month' ? new Date(date.getFullYear(), date.getMonth() + n, 1) : addDays(date, n * (view === 'Day' ? 1 : 7)))
  return <>
    <PageTitle eyebrow="PLAN WITH INTENTION" title="My Calendar" description="Your commitments, in one clear view." action={<Button variant="primary" onClick={() => { setSelectedDay(today); setShowForm(true) }}><Plus size={16} /> Add event</Button>} />
    <Card className="calendar-card"><div className="calendar-toolbar"><div className="date-nav"><button className="icon-button" onClick={() => shift(-1)}><ChevronLeft size={17} /></button><button className="today-button" onClick={() => setAnchor(new Date())}>Today</button><button className="icon-button" onClick={() => shift(1)}><ChevronRight size={17} /></button><b>{title}</b></div><div className="view-switch">{['Day', 'Week', 'Month'].map((item) => <button key={item} className={view === item ? 'selected' : ''} onClick={() => setView(item)}>{item}</button>)}</div></div>
      {view === 'Month' ? <div className="month-grid"><div className="month-weekdays">{['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'].map((day) => <span key={day}>{day}</span>)}</div><div className="month-cells">{monthDays.map((date) => { const key = format(date, 'yyyy-MM-dd'); return <button key={key} className={`month-cell ${date.getMonth() !== anchor.getMonth() ? 'muted' : ''} ${isSameDay(date, new Date()) ? 'today' : ''}`} onClick={() => { setSelectedDay(key); setView('Day') }}><span>{format(date, 'd')}</span>{calendarEvents.filter((e) => e.day === key).slice(0, 2).map((e) => <i key={e.id} style={{ borderColor: eventColors[e.category] }}>{e.title}</i>)}</button> })}</div></div> :
      <div className="week-calendar"><div className="calendar-days-head"><div /><div className={`calendar-days ${view === 'Day' ? 'single' : ''}`}>{(view === 'Day' ? [selectedDay] : days).map((day) => <button key={day} onClick={() => { setSelectedDay(day); if (view === 'Week') setView('Day') }} className={day === today ? 'current' : ''}><small>{format(new Date(`${day}T12:00:00`), 'EEE')}</small><b>{format(new Date(`${day}T12:00:00`), 'd')}</b></button>)}</div></div><div className="time-grid"><div className="time-labels">{Array.from({ length: 17 }, (_, i) => <span key={i}>{String(i + 6).padStart(2, '0')}:00</span>)}</div><div className={`day-columns ${view === 'Day' ? 'single' : ''}`}>{(view === 'Day' ? [selectedDay] : days).map((day) => <div className="day-column" key={day} onDoubleClick={() => { setSelectedDay(day); setShowForm(true); setEditingEvent(null) }}>{Array.from({ length: 17 }, (_, i) => <div key={i} className="hour-line" />)}{calendarEvents.filter((e) => e.day === day).map((event) => <div draggable={!event.fixed && !event.locked} onDragEnd={(e) => { const rect = e.currentTarget.parentElement.getBoundingClientRect(); const hour = Math.max(6, Math.min(22, Math.floor((e.clientY - rect.top) / 54) + 6)); updateEvent(event.id, { start: `${String(hour).padStart(2, '0')}:00`, end: `${String(Math.min(hour + Math.ceil(duration(event) / 60), 24)).padStart(2, '0')}:00` }) }} onClick={() => { setSelectedDay(event.day); setEditingEvent(event); setShowForm(true) }} className="calendar-event" key={event.id} style={{ top: `${(toMin(event.start) - 360) / 60 * 54}px`, height: `${Math.max(28, duration(event) / 60 * 54 - 2)}px`, borderLeftColor: eventColors[event.category] || eventColors.personal }}><b>{event.title}</b><small>{event.start} – {event.end}</small><button onClick={(e) => { e.stopPropagation(); if (window.confirm(`Delete "${event.title}"?`)) deleteEvent(event.id) }} aria-label="Delete event"><X size={12} /></button></div>)}</div>)}</div></div></div>}
      <div className="calendar-legend">{Object.entries(eventColors).map(([key, color]) => <span key={key}><i style={{ background: color }} />{key}</span>)}</div>
    </Card>
    {showForm && <EventModal day={selectedDay} event={editingEvent} onClose={() => { setShowForm(false); setEditingEvent(null) }} onDelete={editingEvent ? () => { deleteEvent(editingEvent.id); setShowForm(false); setEditingEvent(null) } : null} onSave={(event) => { const { repeat, ...details } = event; if (editingEvent) updateEvent(editingEvent.id, details); else { addEvent(details); if (repeat === 'weekly') for (let week = 1; week <= 3; week += 1) addEvent({ ...details, day: format(addDays(new Date(`${details.day}T12:00:00`), week * 7), 'yyyy-MM-dd'), recurring: true }) } setShowForm(false); setEditingEvent(null) }} />}
  </>
}

function EventModal({ day, event, onClose, onSave, onDelete }) {
  const [form, setForm] = useState(() => ({ day, start: '13:00', end: '14:00', title: '', category: 'personal', description: '', repeat: 'none', locked: false, ...(event || {}) }))
  const update = (key) => (e) => setForm((v) => ({ ...v, [key]: e.target.value }))
  return <Modal title={event ? 'Edit event' : 'Create an event'} onClose={onClose}><form onSubmit={(e) => { e.preventDefault(); if (toMin(form.end) <= toMin(form.start)) { window.alert('Event end time must be after its start time.'); return } onSave(form) }}><label>Event name<input required value={form.title} onChange={update('title')} placeholder="What are you planning?" /></label><div className="form-grid"><label>Date<input type="date" required value={form.day} onChange={update('day')} /></label><label>Category<select value={form.category} onChange={update('category')}>{['personal', 'work', 'study', 'gym', 'university', 'break', 'meal'].map((x) => <option key={x}>{x}</option>)}</select></label><label>Start<input type="time" required value={form.start} onChange={update('start')} /></label><label>End<input type="time" required value={form.end} onChange={update('end')} /></label></div><label>Description<input value={form.description || ''} onChange={update('description')} placeholder="Optional details" /></label>{!event && <label>Repeat<select value={form.repeat} onChange={update('repeat')}><option value="none">Does not repeat</option><option value="weekly">Weekly for 4 occurrences</option></select></label>}<label className="lock-check"><input type="checkbox" checked={Boolean(form.locked)} onChange={(e) => setForm((value) => ({ ...value, locked: e.target.checked }))} /> Keep this event locked during weekly reorganization</label><div className="modal-actions">{onDelete && <Button type="button" className="danger-text" onClick={onDelete}>Delete event</Button>}<span /><Button type="button" onClick={onClose}>Cancel</Button><Button type="submit" variant="primary"><Check size={15} /> Save event</Button></div></form></Modal>
}

function SchedulerPage() {
  const { state, setState } = useApp()
  const [anchor, setAnchor] = useState(new Date())
  const weekStart = startOfWeek(anchor, { weekStartsOn: 1 })
  const days = Array.from({ length: 7 }, (_, i) => format(addDays(weekStart, i), 'yyyy-MM-dd'))
  const projection = useMemo(() => generateWeek(state, weekStart), [state, format(weekStart, 'yyyy-MM-dd')])
  const events = projection.events.filter((event) => days.includes(event.day))
  const warnings = [...projection.warnings, ...eventConflicts(events).map((item) => ({ ...item, text: `Schedule conflict: ${item.text}` }))]
  const generate = () => {
    const resultSchedule = generateWeek(state, weekStart)
    setState((s) => ({ ...s, events: resultSchedule.events, scheduleGenerated: true }))
  }
  const moveWeek = (amount) => setAnchor((current) => addDays(current, amount * 7))
  return <>
    <PageTitle eyebrow="YOUR WEEK, OPTIMIZED" title="Smart Scheduler" description="A realistic plan that respects the commitments you already have." action={<Button variant="primary" onClick={generate}><WandSparkles size={16} /> Generate this week</Button>} />
    <div className="scheduler-banner"><div className="scheduler-orb"><Sparkles size={20} /></div><div><b>Your schedule should work for your life.</b><p>Fixed classes and gym commitments are protected. Study and work fill only available time—sleep is never traded for tasks.</p></div><div className="scheduler-badge"><span /> SMART PLANNING</div></div>
    <div className="scheduler-layout"><div className="scheduler-main"><Card className="schedule-overview"><div className="section-head"><div><div className="week-heading"><button className="icon-button" aria-label="Previous week" onClick={() => moveWeek(-1)}><ChevronLeft size={16} /></button><button className="icon-button" aria-label="Next week" onClick={() => moveWeek(1)}><ChevronRight size={16} /></button><h2>{format(weekStart, 'MMM d')} – {format(addDays(weekStart, 6), 'MMM d, yyyy')}</h2><button className="today-button" onClick={() => setAnchor(new Date())}>This week</button></div><p>Weekly commitments and suggested focus time</p></div><Button onClick={generate}><WandSparkles size={15} /> Reorganize this week</Button></div><div className="schedule-day-list">{days.map((day) => <div className="schedule-day" key={day}><div className={`schedule-day-name ${day === today ? 'current' : ''}`}><b>{format(new Date(`${day}T12:00:00`), 'EEE')}</b><small>{format(new Date(`${day}T12:00:00`), 'd')}</small></div><div className="schedule-day-events">{events.filter((e) => e.day === day).sort((a, b) => a.start.localeCompare(b.start)).map((event) => <div className="schedule-chip" key={event.id} style={{ borderLeftColor: eventColors[event.category] || '#aaa' }}><span>{event.start}</span><b>{event.title}</b><small>{fmtHours(duration(event))}</small></div>)}{!events.some((e) => e.day === day) && <span className="free-day">Open for recovery and personal time</span>}</div></div>)}</div></Card><RemoteWorkWindows days={days.slice(0, 5)} events={events} state={state} /></div><div className="scheduler-side"><Card><div className="section-head"><div><h2>Schedule health</h2><p>Quick pulse on your week</p></div><Activity size={17} className="muted-icon" /></div><HealthRow label="University" value={`${events.filter((e) => e.category === 'university').reduce((sum, e) => sum + duration(e), 0) / 60} hrs`} color="#4d8df5" /><HealthRow label="Work scheduled" value={`${events.filter((e) => e.category === 'work').reduce((sum, e) => sum + duration(e), 0) / 60} / ${state.settings.dailyWorkTarget * 5} hrs`} color="#ff8b38" /><HealthRow label="Study scheduled" value={`${events.filter((e) => e.category === 'study').reduce((sum, e) => sum + duration(e), 0) / 60} / ${state.settings.weeklyStudyTarget} hrs`} color="#a78bfa" /><p className="health-foot">Your schedule never moves work to the weekend automatically.</p></Card><Card><div className="section-head"><div><h2>Attention needed</h2><p>We'll call out what doesn't fit</p></div><div className="warning-icon"><CircleHelp size={15} /></div></div>{warnings.length ? <div className="warning-list">{warnings.map((warning) => <div className="warning-item" key={warning.id}><span>!</span>{warning.text}</div>)}</div> : <div className="all-clear"><CheckCheck size={17} /> No conflicts detected</div>}</Card></div></div>
  </>
}

function RemoteWorkWindows({ days, events, state }) {
  const targetMinutes = state.settings.dailyWorkTarget * 60
  return <Card className="work-windows-card"><div className="section-head"><div><h2>Remote work windows</h2><p>Suggested shifts around your classes, gym, travel, and protected sleep</p></div><BriefcaseBusiness size={17} className="muted-icon" /></div><div className="work-window-list">{days.map((day) => {
    const shifts = events.filter((event) => event.day === day && event.category === 'work').sort((a, b) => a.start.localeCompare(b.start))
    const scheduledMinutes = shifts.reduce((sum, event) => sum + duration(event), 0)
    const loggedMinutes = state.workSessions.filter((session) => session.day === day).reduce((sum, session) => sum + (session.minutes || 0), 0)
    const remaining = Math.max(0, targetMinutes - scheduledMinutes - loggedMinutes)
    return <div className="work-window-row" key={day}><div className="work-window-day"><b>{format(new Date(`${day}T12:00:00`), 'EEEE')}</b><small>{format(new Date(`${day}T12:00:00`), 'MMM d')}</small></div><div className="work-window-shifts">{shifts.length ? shifts.map((shift) => <span className="work-window-chip" key={shift.id}><Clock3 size={12} />{shift.start}–{shift.end}</span>) : <span className="muted-copy">{state.scheduleGenerated ? 'No available work window' : 'Generate your week to calculate windows'}</span>}</div><div className={`work-window-total ${remaining ? 'short' : ''}`}>{fmtHours(scheduledMinutes + loggedMinutes)} / {state.settings.dailyWorkTarget}h{remaining > 0 && <small>{fmtHours(remaining)} short</small>}</div></div>
  })}</div><p className="work-window-note">Work sessions are shown in local time. If commitments or protected sleep leave less than six hours, MIGHTY OS flags the shortfall instead of scheduling over them or moving work to weekends.</p></Card>
}

function HealthRow({ label, value, color }) {
  return <div className="health-row"><i style={{ background: color }} /><span>{label}</span><b>{value}</b></div>
}

function WorkPage() {
  const { state, setState, addEvent } = useApp()
  const [now, setNow] = useState(Date.now())
  const [metrics, setMetrics] = useState({ calls: '', successful: '', sales: '', followups: '', notes: '' })
  useEffect(() => { const timer = setInterval(() => setNow(Date.now()), 1000); return () => clearInterval(timer) }, [])
  const active = state.timer?.type === 'work' && Boolean(state.timer.startedAt)
  const seconds = active ? Math.floor(((state.timer.elapsed || 0) + (state.timer.startedAt ? now - state.timer.startedAt : 0)) / 1000) : 0
  const minutesToday = state.workSessions.filter((session) => session.day === today).reduce((sum, session) => sum + (session.minutes || 0), 0)
  const monday = format(startOfWeek(new Date(), { weekStartsOn: 1 }), 'yyyy-MM-dd')
  const workDays = Array.from({ length: 5 }, (_, index) => format(addDays(startOfWeek(new Date(), { weekStartsOn: 1 }), index), 'yyyy-MM-dd'))
  const weekSessions = state.workSessions.filter((session) => session.day >= monday)
  const weekMinutes = weekSessions.reduce((sum, session) => sum + (session.minutes || 0), 0)
  const weeklyTarget = state.settings.dailyWorkTarget * 5 * 60
  const weeklyCalls = weekSessions.reduce((sum, session) => sum + Number(session.calls || 0), 0)
  const start = () => setState((s) => ({ ...s, timer: { type: 'work', startedAt: Date.now(), elapsed: 0 } }))
  const pause = () => setState((s) => ({ ...s, timer: { ...s.timer, elapsed: (s.timer.elapsed || 0) + Date.now() - s.timer.startedAt, startedAt: null } }))
  const resume = () => setState((s) => ({ ...s, timer: { ...s.timer, startedAt: Date.now() } }))
  const stop = () => {
    const elapsed = (state.timer.elapsed || 0) + (state.timer.startedAt ? Date.now() - state.timer.startedAt : 0)
    const minutes = Math.floor(elapsed / 60000)
    if (minutes > 0) setState((s) => ({ ...s, timer: null, workSessions: [...s.workSessions, { id: crypto.randomUUID(), day: today, minutes, ...metrics }], }))
    else setState((s) => ({ ...s, timer: null }))
    setMetrics({ calls: '', successful: '', sales: '', followups: '', notes: '' })
  }
  const timerTime = `${String(Math.floor(seconds / 3600)).padStart(2, '0')}:${String(Math.floor(seconds / 60) % 60).padStart(2, '0')}:${String(seconds % 60).padStart(2, '0')}`
  return <>
    <PageTitle eyebrow="REMOTE SALES" title="Work" description="Track focused hours and keep your daily sales rhythm." action={<div className="work-target-tag"><Target size={15} /> {state.settings.dailyWorkTarget}h daily target</div>} />
    <div className="stats-grid"><StatCard label="TODAY'S FOCUS" value={`${(minutesToday / 60).toFixed(1)}h`} detail={`of ${state.settings.dailyWorkTarget}h target`} icon={Clock3} /><StatCard label="WEEKLY HOURS" value={`${(weekMinutes / 60).toFixed(1)}h`} detail={`of ${(weeklyTarget / 60).toFixed(0)}h weekly target`} icon={BriefcaseBusiness} tone="purple" /><StatCard label="WEEKLY COMPLETION" value={`${Math.min(100, Math.round(weekMinutes / (weeklyTarget || 1) * 100))}%`} detail="Work target progress" icon={Target} tone="green" /><StatCard label="SESSIONS & CALLS" value={weekSessions.length} detail={`${weeklyCalls} calls recorded this week`} icon={Activity} tone="blue" /></div>
    <RemoteWorkWindows days={workDays} events={expandRecurringEvents(state.events, workDays)} state={state} />
    <div className="work-grid"><Card className="timer-card"><div className="section-head"><div><h2>Focus session</h2><p>Pauses don't count toward your work target</p></div><div className="live-tag"><i /> {active ? 'IN SESSION' : 'READY'}</div></div><div className={`timer-display ${active ? 'running' : ''}`}>{timerTime}</div><div className="timer-label">{active ? 'You’re doing great. Stay focused.' : 'Ready when you are.'}</div><div className="timer-actions">{!active && !state.timer && <Button variant="primary" onClick={start}><span className="play-icon">▶</span> Start work</Button>}{active && <Button onClick={pause}><span>Ⅱ</span> Pause</Button>}{state.timer && !active && <Button variant="primary" onClick={resume}>▶ Resume</Button>}{state.timer && <Button className="end-button" onClick={stop}><Check size={15} /> End session</Button>}</div><div className="timer-note"><MoonStar size={15} /> Remember to take a breather between sessions.</div></Card><Card className="performance-card"><div className="section-head"><div><h2>Daily performance</h2><p>Optional notes to help you reflect</p></div></div><div className="form-grid"><label>Calls made<input type="number" min="0" value={metrics.calls} onChange={(e) => setMetrics({ ...metrics, calls: e.target.value })} placeholder="0" /></label><label>Successful calls<input type="number" min="0" value={metrics.successful} onChange={(e) => setMetrics({ ...metrics, successful: e.target.value })} placeholder="0" /></label><label>Sales results<input value={metrics.sales} onChange={(e) => setMetrics({ ...metrics, sales: e.target.value })} placeholder="$0.00" /></label><label>Follow-ups<input type="number" min="0" value={metrics.followups} onChange={(e) => setMetrics({ ...metrics, followups: e.target.value })} placeholder="0" /></label></div><label>Daily notes<textarea value={metrics.notes} onChange={(e) => setMetrics({ ...metrics, notes: e.target.value })} placeholder="What went well today?" rows="3" /></label><div className="performance-tip"><Sparkles size={15} /> Progress over perfection. Every focused session counts.</div></Card></div>
    <Card className="history-card"><div className="section-head"><div><h2>Recent work sessions</h2><p>Your recorded focus blocks</p></div></div>{state.workSessions.length ? <div className="table-scroll"><table><thead><tr><th>DATE</th><th>DURATION</th><th>CALLS</th><th>SUCCESSFUL</th><th>RESULTS</th><th>NOTES</th></tr></thead><tbody>{[...state.workSessions].reverse().slice(0, 8).map((session) => <tr key={session.id}><td>{session.day === today ? 'Today' : format(new Date(`${session.day}T12:00:00`), 'MMM d')}</td><td>{fmtHours(session.minutes)}</td><td>{session.calls || '—'}</td><td>{session.successful || '—'}</td><td>{session.sales || '—'}</td><td>{session.notes || '—'}</td></tr>)}</tbody></table></div> : <Empty title="No sessions yet" text="Start your first focus session when you're ready." />}</Card>
  </>
}

function UniversityPage() {
  const { state, addCourse, updateCourse, deleteCourse } = useApp()
  const [selected, setSelected] = useState(null)
  const [courseModal, setCourseModal] = useState(false)
  const [editing, setEditing] = useState(null)
  const [courseForm, setCourseForm] = useState({ name: '', credits: 3, difficulty: 3, target: 2, color: '#a78bfa', priority: 3 })
  const [subForm, setSubForm] = useState('')
  const [examName, setExamName] = useState('')
  const [examDate, setExamDate] = useState('')
  const [gradeName, setGradeName] = useState('')
  const [gradeValue, setGradeValue] = useState('')
  const [resourceName, setResourceName] = useState('')
  const [resourceUrl, setResourceUrl] = useState('')
  const openNew = () => { setCourseForm({ name: '', credits: 3, difficulty: 3, target: 2, color: '#a78bfa', priority: 3 }); setEditing(null); setCourseModal(true) }
  const openEdit = (course) => { setCourseForm({ ...course }); setEditing(course.id); setCourseModal(true) }
  const saveCourse = (e) => { e.preventDefault(); editing ? updateCourse(editing, courseForm) : addCourse(courseForm); setCourseModal(false) }
  const course = state.courses.find((item) => item.id === selected)
  return <>
    <PageTitle eyebrow="YOUR LEARNING HUB" title="University" description="Your courses, progress, and academic priorities." action={<Button variant="primary" onClick={openNew}><Plus size={16} /> Add course</Button>} />
    <div className="university-summary"><div className="university-summary-item"><GraduationCap size={19} /><div><b>{state.courses.length}</b><small>Active courses</small></div></div><div className="university-summary-item"><BookOpen size={19} /><div><b>{state.courses.reduce((sum, c) => sum + Number(c.credits || 0), 0)}</b><small>Total credits</small></div></div><div className="university-summary-item"><Target size={19} /><div><b>{state.courses.reduce((sum, c) => sum + Number(c.target || 0), 0)}h</b><small>Weekly study plan</small></div></div><div className="university-summary-item"><CalendarDays size={19} /><div><b>{expandRecurringEvents(state.events, Array.from({ length: 7 }, (_, index) => format(addDays(startOfWeek(new Date(), { weekStartsOn: 1 }), index), 'yyyy-MM-dd'))).filter((event) => event.category === 'university').length}</b><small>Class blocks this week</small></div></div></div>
    {course && <Card className="course-detail"><div className="course-detail-head"><div className="course-detail-mark" style={{ background: `${course.color}22`, color: course.color }}><BookOpen size={20} /></div><div><div className="eyebrow">COURSE OVERVIEW · {course.credits} CREDITS</div><h2>{course.name}</h2></div><div className="course-actions"><Button onClick={() => openEdit(course)}>Edit course</Button><Button onClick={() => setSelected(null)}><X size={15} /></Button></div></div><div className="course-detail-grid"><div><b>Study target</b><span>{course.target}h / week</span></div><div><b>Difficulty</b><span>{'★'.repeat(course.difficulty)}{'☆'.repeat(5 - course.difficulty)}</span></div><div><b>Progress</b><span>{courseProgress(course, state)}%</span></div></div><div className="progress-track large"><i style={{ width: `${courseProgress(course, state)}%`, background: course.color }} /></div><div className="course-tools"><div className="course-tool-col"><div className="section-head"><h3>Assignments</h3></div><form className="inline-add" onSubmit={(e) => { e.preventDefault(); if (!subForm.trim()) return; updateCourse(course.id, { assignments: [...course.assignments, { id: crypto.randomUUID(), title: subForm.trim(), deadline: '', completed: false }] }); setSubForm('') }}><input value={subForm} onChange={(e) => setSubForm(e.target.value)} placeholder="Add an assignment..." /><button aria-label="Add assignment"><Plus size={16} /></button></form>{course.assignments.length ? course.assignments.map((a) => <label className="assignment-row" key={a.id}><input type="checkbox" checked={a.completed} onChange={(e) => updateCourse(course.id, { assignments: course.assignments.map((x) => x.id === a.id ? { ...x, completed: e.target.checked } : x) })} /><span>{a.title}</span><input type="date" value={a.deadline} onChange={(e) => updateCourse(course.id, { assignments: course.assignments.map((x) => x.id === a.id ? { ...x, deadline: e.target.value } : x) })} /></label>) : <p className="muted-copy">Nothing due yet. Add your first assignment.</p>}</div><div className="course-tool-col"><div className="section-head"><h3>Course notes</h3></div><textarea className="notes-area" value={course.notes} onChange={(e) => updateCourse(course.id, { notes: e.target.value })} placeholder="Keep useful notes for this course..." rows="5" /><div className="detail-hint">Changes save automatically.</div></div></div><div className="course-tools course-extras"><div className="course-tool-col"><div className="section-head"><h3>Exams</h3></div><form className="inline-add" onSubmit={(e) => { e.preventDefault(); if (!examName.trim() || !examDate) return; updateCourse(course.id, { exams: [...course.exams, { id: crypto.randomUUID(), title: examName.trim(), date: examDate }] }); setExamName(''); setExamDate('') }}><input value={examName} onChange={(e) => setExamName(e.target.value)} placeholder="Exam name" /><input aria-label="Exam date" type="date" value={examDate} onChange={(e) => setExamDate(e.target.value)} /><button aria-label="Add exam"><Plus size={16} /></button></form>{course.exams.length ? course.exams.map((exam) => <div className="simple-detail-row" key={exam.id}><CalendarDays size={13} /><span>{exam.title}</span><b>{exam.date ? format(new Date(`${exam.date}T12:00:00`), 'MMM d, yyyy') : 'Date TBD'}</b></div>) : <p className="muted-copy">No exams added yet.</p>}</div><div className="course-tool-col"><div className="section-head"><h3>Grades</h3></div><form className="inline-add" onSubmit={(e) => { e.preventDefault(); if (!gradeName.trim() || !gradeValue.trim()) return; updateCourse(course.id, { grades: [...course.grades, { id: crypto.randomUUID(), title: gradeName.trim(), value: gradeValue.trim() }] }); setGradeName(''); setGradeValue('') }}><input value={gradeName} onChange={(e) => setGradeName(e.target.value)} placeholder="Assessment" /><input value={gradeValue} onChange={(e) => setGradeValue(e.target.value)} placeholder="Grade" /><button aria-label="Add grade"><Plus size={16} /></button></form>{course.grades.length ? course.grades.map((grade) => <div className="simple-detail-row" key={grade.id}><Target size={13} /><span>{grade.title}</span><b>{grade.value}</b></div>) : <p className="muted-copy">Record grades as they arrive.</p>}</div><div className="course-tool-col"><div className="section-head"><h3>Resources & links</h3></div><form className="inline-add" onSubmit={(e) => { e.preventDefault(); if (!resourceName.trim() || !resourceUrl.trim()) return; updateCourse(course.id, { resources: [...course.resources, { id: crypto.randomUUID(), title: resourceName.trim(), url: resourceUrl.trim() }] }); setResourceName(''); setResourceUrl('') }}><input value={resourceName} onChange={(e) => setResourceName(e.target.value)} placeholder="Resource name" /><input value={resourceUrl} onChange={(e) => setResourceUrl(e.target.value)} placeholder="https://..." /><button aria-label="Add resource"><Plus size={16} /></button></form>{course.resources.length ? course.resources.map((resource) => <a className="simple-detail-row resource-row" key={resource.id} href={resource.url} target="_blank" rel="noreferrer"><BookOpen size={13} /><span>{resource.title}</span><ArrowUpRight size={13} /></a>) : <p className="muted-copy">Keep course links close at hand.</p>}</div><div className="course-tool-col"><div className="section-head"><h3>Study record</h3></div>{state.studySessions.filter((session) => session.courseId === course.id && session.completed).length ? state.studySessions.filter((session) => session.courseId === course.id && session.completed).slice(-5).reverse().map((session) => <div className="simple-detail-row" key={session.id}><Clock3 size={13} /><span>{session.type || 'Study session'}</span><b>{fmtHours(session.minutes)}</b></div>) : <p className="muted-copy">Completed study timer sessions will appear here.</p>}</div></div></Card>}
    <div className="course-grid">{state.courses.map((item) => <article tabIndex={0} aria-label={`Open ${item.name}`} onKeyDown={(e) => { if (e.key === 'Enter' || e.key === ' ') setSelected(item.id === selected ? null : item.id) }} className={`course-card ${selected === item.id ? 'chosen' : ''}`} onClick={() => setSelected(item.id === selected ? null : item.id)} key={item.id}><div className="course-card-top"><div className="course-card-icon" style={{ color: item.color, background: `${item.color}1e` }}><BookOpen size={18} /></div><button className="course-menu" onClick={(e) => { e.stopPropagation(); openEdit(item) }} aria-label="Edit course"><MoreHorizontal size={18} /></button></div><div className="course-card-label">{item.credits} CREDITS · {difficultyLabel(item.difficulty)}</div><h3>{item.name}</h3><div className="course-card-progress"><div className="progress-track"><i style={{ width: `${courseProgress(item, state)}%`, background: item.color }} /></div><span>{courseProgress(item, state)}%</span></div><div className="course-card-foot"><span><Clock3 size={13} /> {item.target}h / week</span><span>{item.assignments.length} assignments</span></div></article>)}</div>
    {courseModal && <Modal title={editing ? 'Edit course' : 'Add a course'} onClose={() => setCourseModal(false)}><form onSubmit={saveCourse}><label>Course name<input required value={courseForm.name} onChange={(e) => setCourseForm({ ...courseForm, name: e.target.value })} placeholder="Course title" /></label><div className="form-grid"><label>Credits<input type="number" min="1" value={courseForm.credits} onChange={(e) => setCourseForm({ ...courseForm, credits: Number(e.target.value) })} /></label><label>Weekly study target<input type="number" min="0" step=".5" value={courseForm.target} onChange={(e) => setCourseForm({ ...courseForm, target: Number(e.target.value) })} /></label><label>Difficulty<select value={courseForm.difficulty} onChange={(e) => setCourseForm({ ...courseForm, difficulty: Number(e.target.value) })}>{[1, 2, 3, 4, 5].map((x) => <option value={x} key={x}>{difficultyLabel(x)}</option>)}</select></label><label>Priority<select value={courseForm.priority} onChange={(e) => setCourseForm({ ...courseForm, priority: Number(e.target.value) })}>{[1, 2, 3, 4, 5].map((x) => <option key={x} value={x}>{x} / 5</option>)}</select></label></div><label>Course color<input type="color" value={courseForm.color} onChange={(e) => setCourseForm({ ...courseForm, color: e.target.value })} /></label><div className="modal-actions">{editing && <Button type="button" className="danger-text" onClick={() => { if (window.confirm('Delete this course and its study history?')) { deleteCourse(editing); setSelected(null); setCourseModal(false) } }}>Delete course</Button>}<span /><Button type="button" onClick={() => setCourseModal(false)}>Cancel</Button><Button type="submit" variant="primary"><Check size={15} /> Save course</Button></div></form></Modal>}
  </>
}

const difficultyLabel = (difficulty) => ['Very light', 'Light', 'Moderate', 'Challenging', 'Intensive'][Math.max(0, Number(difficulty) - 1)] || 'Moderate'

function StudyPage() {
  const { state, setState, addStudySession } = useApp()
  const [selectedCourse, setSelectedCourse] = useState(state.courses[0]?.id || '')
  const [sessionType, setSessionType] = useState('Learning new material')
  const [sessionPriority, setSessionPriority] = useState('Medium')
  const [sessionNotes, setSessionNotes] = useState('')
  const [now, setNow] = useState(Date.now())
  useEffect(() => { const timer = setInterval(() => setNow(Date.now()), 1000); return () => clearInterval(timer) }, [])
  const active = state.timer?.type === 'study' && Boolean(state.timer.startedAt)
  const seconds = active ? Math.floor(((state.timer.elapsed || 0) + (state.timer.startedAt ? now - state.timer.startedAt : 0)) / 1000) : 0
  const elapsedMinutes = Math.floor(seconds / 60)
  const monday = format(startOfWeek(new Date(), { weekStartsOn: 1 }), 'yyyy-MM-dd')
  const weeklyMinutes = state.studySessions.filter((s) => s.completed && s.day >= monday).reduce((sum, s) => sum + (s.minutes || 0), 0)
  const savedSessions = state.studySessions.filter((s) => s.completed)
  const start = () => setState((s) => ({ ...s, timer: { type: 'study', courseId: selectedCourse, sessionType, sessionPriority, sessionNotes, startedAt: Date.now(), elapsed: 0 } }))
  const pause = () => setState((s) => ({ ...s, timer: { ...s.timer, elapsed: (s.timer.elapsed || 0) + Date.now() - s.timer.startedAt, startedAt: null } }))
  const resume = () => setState((s) => ({ ...s, timer: { ...s.timer, startedAt: Date.now() } }))
  const stop = () => {
    const elapsed = (state.timer.elapsed || 0) + (state.timer.startedAt ? Date.now() - state.timer.startedAt : 0)
    const minutes = Math.floor(elapsed / 60000)
    if (minutes > 0) addStudySession({ day: today, courseId: state.timer.courseId, minutes, type: state.timer.sessionType, priority: state.timer.sessionPriority, notes: state.timer.sessionNotes })
    setState((s) => ({ ...s, timer: null }))
    setSessionNotes('')
  }
  const time = `${String(Math.floor(seconds / 3600)).padStart(2, '0')}:${String(Math.floor(seconds / 60) % 60).padStart(2, '0')}:${String(seconds % 60).padStart(2, '0')}`
  return <>
    <PageTitle eyebrow="DEEP WORK, MADE MANAGEABLE" title="Study Planner" description="Build focused study habits with a plan that's realistic and yours." action={<div className="work-target-tag"><Target size={15} /> {state.settings.weeklyStudyTarget}h weekly target</div>} />
    <div className="study-summary"><div><div className="eyebrow">THIS WEEK'S FOCUS</div><b>{(weeklyMinutes / 60).toFixed(1)} <small>hrs</small><span> / {state.settings.weeklyStudyTarget} hrs</span></b><div className="progress-track"><i style={{ width: `${Math.min(100, weeklyMinutes / 60 / state.settings.weeklyStudyTarget * 100)}%` }} /></div><p>Ideal stretch goal: {state.settings.idealStudyTarget} hours</p></div><div className="study-summary-right"><div className="study-summary-icon"><BookOpen size={20} /></div><span>Consistency beats cramming.<br />Make room for recovery.</span></div></div>
    <div className="study-grid"><Card className="study-timer-card"><div className="section-head"><div><h2>Study timer</h2><p>Focus on one thing at a time</p></div><div className="pomodoro-tag"><Timer size={14} /> {state.settings.pomodoroStudy} / {state.settings.pomodoroBreak} pomodoro</div></div><div className="study-timer-display">{time}</div><div className="timer-pickers"><label>COURSE<select value={active ? state.timer.courseId : selectedCourse} onChange={(e) => setSelectedCourse(e.target.value)} disabled={active}>{state.courses.map((course) => <option value={course.id} key={course.id}>{course.name}</option>)}</select></label><label>SESSION TYPE<select value={active ? state.timer.sessionType : sessionType} onChange={(e) => setSessionType(e.target.value)} disabled={active}>{['Learning new material', 'Reviewing lessons', 'Solving exercises', 'Programming practice', 'Assignment work', 'Exam preparation'].map((type) => <option key={type}>{type}</option>)}</select></label><label>SESSION PRIORITY<select value={active ? state.timer.sessionPriority : sessionPriority} onChange={(e) => setSessionPriority(e.target.value)} disabled={active}>{['Low', 'Medium', 'High'].map((priority) => <option key={priority}>{priority}</option>)}</select></label><label>SESSION NOTES<textarea rows="1" value={active ? state.timer.sessionNotes : sessionNotes} onChange={(e) => setSessionNotes(e.target.value)} disabled={active} placeholder="Optional reminder" /></label></div><div className="timer-actions">{!state.timer && <Button variant="primary" onClick={start}><span className="play-icon">▶</span> Start studying</Button>}{active && <Button onClick={pause}>Ⅱ Pause</Button>}{state.timer?.type === 'study' && !active && <Button variant="primary" onClick={resume}>▶ Resume</Button>}{state.timer?.type === 'study' && <Button onClick={stop}><Check size={15} /> Record session</Button>}</div>{state.timer && state.timer.type !== 'study' && <div className="timer-note">A work timer is currently running. Stop it before starting a study session.</div>}</Card><Card className="allocation-card"><div className="section-head"><div><h2>Smart allocation</h2><p>Study time shaped around your courses</p></div><WandSparkles size={17} className="muted-icon" /></div><div className="allocation-list">{state.courses.map((course) => <div className="allocation-row" key={course.id}><span className="allocation-color" style={{ background: course.color }} /><div><b>{course.name}</b><small>{course.credits} credits · {difficultyLabel(course.difficulty)}</small></div><strong>{course.target}h</strong></div>)}</div><p className="allocation-note">Priorities, difficulty, and credits guide your weekly study allocation. Change a course target in University.</p></Card></div>
    <Card className="history-card"><div className="section-head"><div><h2>Study history</h2><p>Focused time you've recorded</p></div><span className="pill-count">{savedSessions.length} sessions</span></div>{savedSessions.length ? <div className="table-scroll"><table><thead><tr><th>DATE</th><th>COURSE</th><th>SESSION TYPE</th><th>DURATION</th></tr></thead><tbody>{[...savedSessions].reverse().slice(0, 10).map((session) => <tr key={session.id}><td>{session.day === today ? 'Today' : format(new Date(`${session.day}T12:00:00`), 'MMM d')}</td><td>{state.courses.find((c) => c.id === session.courseId)?.name || 'Course removed'}</td><td>{session.type}</td><td>{fmtHours(session.minutes)}</td></tr>)}</tbody></table></div> : <Empty title="Your study log starts here" text="Record a focused session to see your progress build over time." />}</Card>
  </>
}

function GymPage() {
  const { state, addEvent, updateEvent, deleteEvent } = useApp()
  const [showForm, setShowForm] = useState(false)
  const [form, setForm] = useState({ day: today, start: '15:00', end: '16:00', title: 'Personal training', activityType: 'Personal training', category: 'gym', description: '', fixed: false })
  const monday = format(startOfWeek(new Date(), { weekStartsOn: 1 }), 'yyyy-MM-dd')
  const mondayDate = startOfWeek(new Date(), { weekStartsOn: 1 })
  const gymDays = Array.from({ length: 14 }, (_, index) => format(addDays(mondayDate, index), 'yyyy-MM-dd'))
  const sessions = expandRecurringEvents(state.events, gymDays).filter((event) => event.category === 'gym').sort((a, b) => a.day.localeCompare(b.day) || a.start.localeCompare(b.start))
  const weekEnd = format(addDays(mondayDate, 6), 'yyyy-MM-dd')
  const weekly = sessions.filter((e) => e.day >= monday && e.day <= weekEnd).reduce((sum, e) => sum + duration(e), 0)
  return <>
    <PageTitle eyebrow="TRAIN WITH PURPOSE" title="Gym" description="Manage coaching, training, and gym commitments." action={<Button variant="primary" onClick={() => setShowForm(true)}><Plus size={16} /> Add gym session</Button>} />
    <div className="stats-grid three"><StatCard label="THIS WEEK" value={`${(weekly / 60).toFixed(1)}h`} detail="Gym & training time" icon={Dumbbell} tone="green" /><StatCard label="FIXED COMMITMENTS" value="8h" detail="Monday & Wednesday" icon={CalendarDays} tone="orange" /><StatCard label="GYM TRAVEL" value={`${state.settings.gymTravel} min`} detail="Each way · configure in Settings" icon={Clock3} tone="blue" /></div>
    <Card className="gym-sessions"><div className="section-head"><div><h2>Upcoming gym activities</h2><p>Fixed training and sessions you've added</p></div></div>{sessions.length ? <div className="table-scroll"><table><thead><tr><th>ACTIVITY</th><th>DATE</th><th>TIME</th><th>TYPE</th><th>STATUS</th><th></th></tr></thead><tbody>{sessions.map((event) => <tr key={event.id}><td><span className="table-color-dot" style={{ background: eventColors.gym }} />{event.title}</td><td>{format(new Date(`${event.day}T12:00:00`), 'EEE, MMM d')}</td><td>{event.start} – {event.end}</td><td>{event.activityType || 'Gym commitment'}</td><td><button className={`status-toggle ${event.completed ? 'done' : ''}`} onClick={() => updateEvent(event.id, { completed: !event.completed })}>{event.completed ? 'Completed' : 'Planned'}</button></td><td>{!event.fixed && <button className="icon-button small" onClick={() => { if (window.confirm('Delete this gym activity?')) deleteEvent(event.id) }}><X size={14} /></button>}</td></tr>)}</tbody></table></div> : <Empty title="No gym sessions" text="Add a workout or training commitment to your week." />}</Card>
    {showForm && <Modal title="Add gym session" onClose={() => setShowForm(false)}><form onSubmit={(e) => { e.preventDefault(); addEvent(form); setShowForm(false) }}><label>Activity<input required value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value })} /></label><div className="form-grid"><label>Date<input required type="date" value={form.day} onChange={(e) => setForm({ ...form, day: e.target.value })} /></label><label>Activity type<select value={form.activityType} onChange={(e) => setForm({ ...form, activityType: e.target.value })}>{['Personal training', 'Coaching', 'Gym administration', 'Calisthenics', 'Competition preparation', 'Other'].map((x) => <option key={x}>{x}</option>)}</select></label><label>Start<input type="time" value={form.start} onChange={(e) => setForm({ ...form, start: e.target.value })} /></label><label>End<input type="time" value={form.end} onChange={(e) => setForm({ ...form, end: e.target.value })} /></label></div><label>Notes<input value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} placeholder="Optional details" /></label><div className="modal-actions"><Button type="button" onClick={() => setShowForm(false)}>Cancel</Button><Button type="submit" variant="primary">Save session</Button></div></form></Modal>}
  </>
}

function TasksPage() {
  const { state, addTask } = useApp()
  const [title, setTitle] = useState('')
  const [due, setDue] = useState('')
  const [priority, setPriority] = useState('Medium')
  const open = state.tasks.filter((task) => !task.completed)
  const done = state.tasks.filter((task) => task.completed)
  const submit = (e) => { e.preventDefault(); if (!title.trim()) return; addTask({ title: title.trim(), due, priority }); setTitle(''); setDue('') }
  return <>
    <PageTitle eyebrow="CLEAR THE CLUTTER" title="Tasks" description="A calm, actionable home for the things on your mind." action={<div className="work-target-tag"><CheckSquare2 size={15} /> {open.length} open tasks</div>} />
    <Card className="task-compose"><form onSubmit={submit}><div className="task-compose-icon"><Plus size={17} /></div><input value={title} onChange={(e) => setTitle(e.target.value)} placeholder="Add a task to your list..." aria-label="Task title" /><input type="date" value={due} onChange={(e) => setDue(e.target.value)} aria-label="Due date" /><select value={priority} onChange={(e) => setPriority(e.target.value)} aria-label="Priority"><option>Low</option><option>Medium</option><option>High</option></select><Button variant="primary" type="submit">Add task</Button></form></Card>
    <div className="tasks-layout"><Card className="task-section"><div className="section-head"><div><h2>To do <span className="pill-count">{open.length}</span></h2><p>One thing at a time</p></div><button className="subtle-select">Sort by priority <ChevronDown size={14} /></button></div><TaskList tasks={open} /></Card><Card className="task-section"><div className="section-head"><div><h2>Completed <span className="pill-count">{done.length}</span></h2><p>Look how far you've come</p></div><CheckCheck size={18} className="muted-icon" /></div><TaskList tasks={done} /></Card></div>
  </>
}

function TaskList({ limit, tasks: propTasks }) {
  const { state, updateTask, deleteTask } = useApp()
  const tasks = propTasks || state.tasks.filter((task) => !task.completed).slice(0, limit)
  return tasks.length ? <div className="task-list">{tasks.map((task) => <div className={`task-row ${task.completed ? 'completed' : ''}`} key={task.id}><button className={`task-check ${task.completed ? 'checked' : ''}`} onClick={() => updateTask(task.id, { completed: !task.completed })} aria-label="Complete task">{task.completed && <Check size={13} />}</button><div className="task-info"><b>{task.title}</b>{task.due && <small><CalendarDays size={12} /> {format(new Date(`${task.due}T12:00:00`), 'MMM d')}</small>}</div><span className={`priority ${String(task.priority || 'Medium').toLowerCase()}`}>{task.priority || 'Medium'}</span><button className="icon-button small task-delete" onClick={() => deleteTask(task.id)} aria-label="Delete task"><X size={14} /></button></div>)}</div> : <div className="task-empty"><CheckCheck size={19} /><p>{propTasks ? 'Nothing in this list yet.' : 'No priority tasks right now.'}</p></div>
}

function AnalyticsPage() {
  const { state } = useApp()
  const monday = format(startOfWeek(new Date(), { weekStartsOn: 1 }), 'yyyy-MM-dd')
  const weekDays = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'].map((day, index) => {
    const date = format(addDays(startOfWeek(new Date(), { weekStartsOn: 1 }), index), 'yyyy-MM-dd')
    return { day, work: state.workSessions.filter((s) => s.day === date).reduce((sum, s) => sum + (s.minutes || 0), 0) / 60, study: state.studySessions.filter((s) => s.day === date && s.completed).reduce((sum, s) => sum + (s.minutes || 0), 0) / 60 }
  })
  const completedStudy = state.studySessions.filter((s) => s.completed && s.day >= monday).reduce((sum, s) => sum + (s.minutes || 0), 0)
  const completedWork = state.workSessions.filter((s) => s.day >= monday).reduce((sum, s) => sum + (s.minutes || 0), 0)
  const pieData = [{ name: 'Work', value: completedWork, color: '#ff8b38' }, { name: 'Study', value: completedStudy, color: '#a78bfa' }, { name: 'Gym', value: state.events.filter((e) => e.category === 'gym' && e.day >= monday).reduce((sum, e) => sum + duration(e), 0), color: '#48c78e' }]
  return <>
    <PageTitle eyebrow="REFLECT & ADJUST" title="Analytics" description="Notice patterns, celebrate progress, and make your next week better." action={<span className="work-target-tag"><CalendarDays size={15} /> This week</span>} />
    <div className="stats-grid three"><StatCard label="WORK FOCUSED" value={`${(completedWork / 60).toFixed(1)}h`} detail="Tracked this week" icon={BriefcaseBusiness} /><StatCard label="STUDY FOCUSED" value={`${(completedStudy / 60).toFixed(1)}h`} detail={`Target ${state.settings.weeklyStudyTarget}h`} icon={BookOpen} tone="purple" /><StatCard label="COMPLETED TASKS" value={state.tasks.filter((task) => task.completed).length} detail="All-time completions" icon={CheckCheck} tone="green" /></div>
    <div className="analytics-grid"><Card className="chart-card analytics-bar"><div className="section-head"><div><h2>Focus time</h2><p>Recorded work and study hours by day</p></div><div className="chart-legend"><span><i className="orange-dot" />Work</span><span><i className="purple-dot" />Study</span></div></div><div className="chart-wrap tall"><ResponsiveContainer width="100%" height="100%"><BarChart data={weekDays} barGap={6}><CartesianGrid stroke="#29292c" vertical={false} /><XAxis dataKey="day" tickLine={false} axisLine={false} tick={{ fill: '#85858c', fontSize: 11 }} dy={10} /><YAxis tickLine={false} axisLine={false} tick={{ fill: '#77777e', fontSize: 10 }} /><Tooltip contentStyle={{ background: '#202023', border: '1px solid #36363a', borderRadius: 10 }} /><Bar dataKey="work" fill="#ff8b38" radius={[4, 4, 0, 0]} /><Bar dataKey="study" fill="#a78bfa" radius={[4, 4, 0, 0]} /></BarChart></ResponsiveContainer></div></Card><Card className="chart-card distribution-card"><div className="section-head"><div><h2>Time distribution</h2><p>Committed hours this week</p></div></div><div className="donut-wrap"><ResponsiveContainer width="100%" height="100%"><PieChart><Pie data={pieData} dataKey="value" nameKey="name" innerRadius={62} outerRadius={83} paddingAngle={4} stroke="none">{pieData.map((item) => <Cell key={item.name} fill={item.color} />)}</Pie><Tooltip contentStyle={{ background: '#202023', border: '1px solid #36363a', borderRadius: 10 }} /></PieChart></ResponsiveContainer><div className="donut-center"><b>{((pieData.reduce((sum, item) => sum + item.value, 0)) / 60).toFixed(1)}</b><small>hours</small></div></div><div className="distribution-legend">{pieData.map((item) => <div key={item.name}><i style={{ background: item.color }} />{item.name}<b>{(item.value / 60).toFixed(1)}h</b></div>)}</div></Card></div>
    <Card className="insight-card"><div className="insight-icon"><Sparkles size={18} /></div><div><b>Your next best step</b><p>Set a realistic plan in Smart Scheduler, then let your progress—not perfection—guide the week.</p></div><Link to="/smart-scheduler" className="text-link">Plan week <ChevronRight size={14} /></Link></Card>
  </>
}

function SleepPage() {
  const { state, setState, updateSettings } = useApp()
  const [sleep, setSleep] = useState({ date: today, hours: '', quality: 'Good', notes: '' })
  const submit = (e) => { e.preventDefault(); setState((s) => ({ ...s, sleepLogs: [...s.sleepLogs, { ...sleep, id: crypto.randomUUID(), hours: Number(sleep.hours) }] })); setSleep({ ...sleep, hours: '', notes: '' }) }
  const monday = format(startOfWeek(new Date(), { weekStartsOn: 1 }), 'yyyy-MM-dd')
  const weeklyLogs = state.sleepLogs.filter((log) => log.date >= monday)
  const average = weeklyLogs.length ? (weeklyLogs.reduce((sum, log) => sum + Number(log.hours), 0) / weeklyLogs.length).toFixed(1) : '—'
  const recent = [...state.sleepLogs].slice(-7).reverse()
  return <>
    <PageTitle eyebrow="RECOVERY IS PRODUCTIVITY" title="Sleep & Recovery" description="Protect the rest that makes everything else possible." action={<span className="work-target-tag"><MoonStar size={15} /> {state.settings.sleepHours}h sleep target</span>} />
    {!state.settings.wakeTime && <div className="attention-banner"><MoonStar size={17} /><div><b>Set your preferred wake-up time to protect your sleep.</b><p>MIGHTY OS won't assume your schedule—choose your wake time in Settings to help us reserve sleep.</p></div><Link to="/settings" className="text-link">Configure <ChevronRight size={14} /></Link></div>}
    <div className="stats-grid"><StatCard label="SLEEP TARGET" value={`${state.settings.sleepHours}h`} detail="Your preferred nightly rest" icon={MoonStar} tone="purple" /><StatCard label="WEEKLY AVERAGE" value={average === '—' ? '—' : `${average}h`} detail={`${weeklyLogs.length} nights logged this week`} icon={Activity} tone="blue" /><StatCard label="SLEEP CONSISTENCY" value={`${weeklyLogs.length}/7`} detail="Nights logged this week" icon={CalendarDays} tone="green" /><StatCard label="WIND-DOWN" value={`${state.settings.windDown} min`} detail="A gentle transition to rest" icon={AlarmClock} /></div>
    {weeklyLogs.some((log) => Number(log.hours) < 7) && <div className="attention-banner"><MoonStar size={17} /><div><b>Some recent nights were below seven hours.</b><p>Protecting recovery is more important than catching up on unfinished tasks.</p></div></div>}
    <div className="sleep-grid"><Card><div className="section-head"><div><h2>Log last night's sleep</h2><p>Build a picture of your recovery</p></div></div><form onSubmit={submit}><div className="form-grid"><label>Date<input type="date" value={sleep.date} onChange={(e) => setSleep({ ...sleep, date: e.target.value })} /></label><label>Hours slept<input required type="number" min=".5" max="24" step=".25" value={sleep.hours} onChange={(e) => setSleep({ ...sleep, hours: e.target.value })} placeholder="e.g. 7.5" /></label><label>Sleep quality<select value={sleep.quality} onChange={(e) => setSleep({ ...sleep, quality: e.target.value })}>{['Great', 'Good', 'Okay', 'Poor'].map((x) => <option key={x}>{x}</option>)}</select></label><label>Notes<input value={sleep.notes} onChange={(e) => setSleep({ ...sleep, notes: e.target.value })} placeholder="Anything affecting your rest?" /></label></div><div className="modal-actions"><Button variant="primary" type="submit"><Plus size={15} /> Save sleep log</Button></div></form></Card><Card><div className="section-head"><div><h2>Sleep settings</h2><p>Customize your protected rest window</p></div></div><div className="sleep-settings"><label>Preferred bedtime<input type="time" value={state.settings.bedtime} onChange={(e) => updateSettings({ bedtime: e.target.value })} /></label><label>Preferred wake-up time<input type="time" value={state.settings.wakeTime} onChange={(e) => updateSettings({ wakeTime: e.target.value })} /></label><label>Weekend bedtime<input type="time" value={state.settings.weekendBedtime} onChange={(e) => updateSettings({ weekendBedtime: e.target.value })} /></label><label>Weekend wake-up time<input type="time" value={state.settings.weekendWakeTime} onChange={(e) => updateSettings({ weekendWakeTime: e.target.value })} /></label><label>Nightly sleep target<input type="number" min="6" max="12" step=".5" value={state.settings.sleepHours} onChange={(e) => updateSettings({ sleepHours: Number(e.target.value) })} /></label></div></Card></div>
    <Card className="history-card"><div className="section-head"><div><h2>Recent sleep</h2><p>Your recovery log</p></div></div>{recent.length ? <div className="table-scroll"><table><thead><tr><th>DATE</th><th>DURATION</th><th>QUALITY</th><th>NOTES</th></tr></thead><tbody>{recent.map((log) => <tr key={log.id}><td>{format(new Date(`${log.date}T12:00:00`), 'EEE, MMM d')}</td><td>{log.hours}h</td><td>{log.quality}</td><td>{log.notes || '—'}</td></tr>)}</tbody></table></div> : <Empty title="Your recovery story starts here" text="Log your sleep to track consistency and energy." />}</Card>
  </>
}

function SettingsPage() {
  const { state, updateSettings, setState } = useApp()
  const [saved, setSaved] = useState(false)
  const change = (key, numeric = false) => (e) => updateSettings({ [key]: numeric ? Number(e.target.value) : e.target.value })
  const saveFeedback = () => { setSaved(true); setTimeout(() => setSaved(false), 2200) }
  return <>
    <PageTitle eyebrow="MAKE IT YOURS" title="Settings" description="Tune MIGHTY OS to fit the shape of your life." action={saved && <span className="saved-indicator"><Check size={15} /> Saved automatically</span>} />
    <div className="settings-layout"><Card className="settings-card"><div className="settings-heading"><div className="settings-icon orange"><BriefcaseBusiness size={18} /></div><div><h2>Work preferences</h2><p>Set a realistic work boundary for your week.</p></div></div><div className="settings-fields"><label>Required work hours per day<input type="number" min="1" max="12" step=".5" value={state.settings.dailyWorkTarget} onChange={change('dailyWorkTarget', true)} /></label><label>Weekly study target<input type="number" min="1" max="60" step="1" value={state.settings.weeklyStudyTarget} onChange={change('weeklyStudyTarget', true)} /></label><label>Ideal study target<input type="number" min="1" max="60" step="1" value={state.settings.idealStudyTarget} onChange={change('idealStudyTarget', true)} /></label></div><p className="settings-note">Work days remain Monday–Friday. Work will not be shifted to weekends without your permission.</p></Card><Card className="settings-card"><div className="settings-heading"><div className="settings-icon blue"><GraduationCap size={18} /></div><div><h2>University commute</h2><p>Travel time is protected around every class.</p></div></div><div className="settings-fields"><label>Home to university (minutes)<input type="number" min="0" max="180" value={state.settings.commute} onChange={change('commute', true)} /></label><label>Gym travel (minutes each way)<input type="number" min="0" max="180" value={state.settings.gymTravel} onChange={change('gymTravel', true)} /></label></div><p className="settings-note">Your fixed class blocks are Monday, Tuesday, Thursday, and Friday. Commute time will be reserved by the scheduler.</p></Card><Card className="settings-card"><div className="settings-heading"><div className="settings-icon purple"><MoonStar size={18} /></div><div><h2>Sleep & recovery</h2><p>Your preferred wake-up time is never assumed.</p></div></div><div className="settings-fields"><label>Preferred bedtime<input type="time" value={state.settings.bedtime} onChange={change('bedtime')} /></label><label>Preferred wake-up time<input type="time" value={state.settings.wakeTime} onChange={change('wakeTime')} /></label><label>Weekend bedtime<input type="time" value={state.settings.weekendBedtime} onChange={change('weekendBedtime')} /></label><label>Weekend wake-up time<input type="time" value={state.settings.weekendWakeTime} onChange={change('weekendWakeTime')} /></label><label>Sleep target (hours)<input type="number" min="6" max="12" step=".5" value={state.settings.sleepHours} onChange={change('sleepHours', true)} /></label><label>Wind-down period (minutes)<input type="number" min="0" max="180" step="5" value={state.settings.windDown} onChange={change('windDown', true)} /></label></div><p className="settings-note">When a wake-up time is set, the schedule will reserve your sleep window. Weekend preferences are optional and fall back to your weekday schedule.</p></Card><Card className="settings-card"><div className="settings-heading"><div className="settings-icon green"><Timer size={18} /></div><div><h2>Timer preferences</h2><p>Customize your focus intervals.</p></div></div><div className="settings-fields"><label>Pomodoro focus (minutes)<input type="number" min="5" max="90" value={state.settings.pomodoroStudy} onChange={change('pomodoroStudy', true)} /></label><label>Short break (minutes)<input type="number" min="1" max="30" value={state.settings.pomodoroBreak} onChange={change('pomodoroBreak', true)} /></label></div></Card><Card className="settings-card data-card"><div className="settings-heading"><div className="settings-icon muted"><Activity size={18} /></div><div><h2>Your data</h2><p>Your information stays in this browser.</p></div></div><div className="data-actions"><div><b>Automatic local save</b><small>Changes are saved in your browser's local storage.</small></div><Button onClick={() => { const blob = new Blob([JSON.stringify(state, null, 2)], { type: 'application/json' }); const url = URL.createObjectURL(blob); const a = document.createElement('a'); a.href = url; a.download = 'mighty-os-backup.json'; a.click(); URL.revokeObjectURL(url) }}>Export backup</Button><Button className="danger-text" onClick={() => { if (window.confirm('Reset MIGHTY OS to its initial setup? This will remove your saved courses, sessions, and settings.')) { localStorage.removeItem('mighty-os-v1'); window.location.reload() } }}>Reset data</Button></div></Card></div>
    <div className="settings-save"><span><Check size={14} /> Your preferences save automatically.</span><Button variant="primary" onClick={saveFeedback}><Check size={15} /> Done</Button></div>
  </>
}

function Modal({ title, children, onClose }) {
  useEffect(() => {
    const close = (e) => { if (e.key === 'Escape') onClose() }
    window.addEventListener('keydown', close)
    return () => window.removeEventListener('keydown', close)
  }, [onClose])
  return <div className="modal-backdrop" onMouseDown={(e) => { if (e.target === e.currentTarget) onClose() }}><section className="modal"><div className="modal-head"><h2>{title}</h2><button className="icon-button" onClick={onClose}><X size={17} /></button></div>{children}</section></div>
}

function SearchModal({ onClose, onNavigate }) {
  const [query, setQuery] = useState('')
  const entries = navGroups.flatMap((group) => group.items.map(([name, icon]) => ({ name, icon, path: pathFor(name) })))
  const filtered = entries.filter((entry) => entry.name.toLowerCase().includes(query.toLowerCase()))
  return <div className="search-backdrop" onMouseDown={(e) => { if (e.target === e.currentTarget) onClose() }}><div className="search-modal"><div className="search-input-wrap"><Search size={18} /><input autoFocus value={query} onChange={(e) => setQuery(e.target.value)} placeholder="Search pages..." /><kbd>ESC</kbd><button className="icon-button" onClick={onClose}><X size={16} /></button></div><div className="search-results">{filtered.map((entry) => { const Icon = icons[entry.icon]; return <button key={entry.name} onClick={() => { onNavigate(entry.path); onClose() }}><Icon size={17} /><span>{entry.name}</span><ChevronRight size={15} /></button> })}{!filtered.length && <p>No pages found.</p>}</div><div className="search-footer">Navigate to a section in MIGHTY OS</div></div></div>
}

export default App
