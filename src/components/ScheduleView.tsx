/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import { 
  Search, 
  Calendar, 
  TableProperties, 
  ChevronLeft, 
  ChevronRight, 
  Phone, 
  Trash2, 
  Info,
  CalendarDays,
  X,
  UserCheck,
  UserMinus,
  Briefcase,
  AlertCircle,
  Users
} from 'lucide-react';
import { Employee, DailySchedule, POSITIONS, RoleKey, LocationType, ShiftType } from '../types';
import { getPeriodFromDay, INDO_MONTHS } from '../utils/scheduler';

interface ScheduleViewProps {
  employees: Employee[];
  schedules: DailySchedule[];
  onDeleteEmployee: (id: string, date: string) => void;
  activeDateStr: string;
  setActiveDateStr: (date: string) => void;
}

export default function ScheduleView({ 
  employees, 
  schedules, 
  onDeleteEmployee,
  activeDateStr,
  setActiveDateStr
}: ScheduleViewProps) {
  
  // States
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedMonth, setSelectedMonth] = useState<number>(5); // Default to June (index 5)
  const [selectedYear, setSelectedYear] = useState<number>(2026); // Default to 2026
  const [selectedPeriod, setSelectedPeriod] = useState<string>('all'); // all, 1, 2, 3
  const [viewMode, setViewMode] = useState<'calendar' | 'table'>('calendar'); // calendar, table
  const [calendarSubMode, setCalendarSubMode] = useState<'month' | 'week' | 'day'>('month'); // month, week, day
  const [showDetailDialog, setShowDetailDialog] = useState(false);
  const [employeeSidebarOpen, setEmployeeSidebarOpen] = useState(false);

  // Parse active date
  const activeDate = new Date(activeDateStr);
  const activeDay = activeDate.getDate();

  // Filter schedules based on Month and Year
  const filteredSchedules = schedules.filter(s => {
    const d = new Date(s.date);
    const matchesMonth = d.getMonth() === selectedMonth;
    const matchesYear = d.getFullYear() === selectedYear;
    
    // Period filter
    const day = d.getDate();
    const period = getPeriodFromDay(day);
    const matchesPeriod = selectedPeriod === 'all' || String(period) === selectedPeriod;

    // Search query matches
    let matchesSearch = true;
    if (searchQuery.trim() !== '') {
      const q = searchQuery.toLowerCase();
      const roles: RoleKey[] = ['kantorPagi', 'kantorMalam', 'pendawaPagi', 'pendawaMalam', 'kentenMalam', 'cadangan'];
      
      // Check if any assigned employee matches name
      const hasMatch = roles.some(key => {
        const ids = s[key] || [];
        return ids.some(id => {
          const emp = employees.find(e => e.id === id);
          return emp && emp.name.toLowerCase().includes(q);
        });
      });

      // Also check Libur
      const inLibur = s.libur?.some(id => {
        const emp = employees.find(e => e.id === id);
        return emp && emp.name.toLowerCase().includes(q);
      });

      matchesSearch = hasMatch || inLibur;
    }

    return matchesMonth && matchesYear && matchesPeriod && matchesSearch;
  });

  // Unique sorted list of dates in the selected month
  const monthDays = schedules
    .filter(s => {
      const d = new Date(s.date);
      return d.getMonth() === selectedMonth && d.getFullYear() === selectedYear;
    })
    .sort((a, b) => a.date.localeCompare(b.date));

  // Determine weekdays for calendar rendering
  // June 1, 2026 was a Monday (index 1)
  const getDayOfWeek = (dateStr: string) => {
    return new Date(dateStr).getDay(); // 0 = Sunday, 1 = Monday...
  };

  const handlePrevDay = () => {
    const prev = new Date(activeDate);
    prev.setDate(prev.getDate() - 1);
    setActiveDateStr(prev.toISOString().split('T')[0]);
  };

  const handleNextDay = () => {
    const next = new Date(activeDate);
    next.setDate(next.getDate() + 1);
    setActiveDateStr(next.toISOString().split('T')[0]);
  };

  // Safe helper to find employee name
  const getEmployeeName = (id: string) => {
    const emp = employees.find(e => e.id === id);
    return emp ? emp.name : 'Staf';
  };

  const getEmployeePhone = (id: string) => {
    const emp = employees.find(e => e.id === id);
    return emp ? emp.phone : '-';
  };

  // Locate current schedule
  const activeDaySchedule = schedules.find(s => s.date === activeDateStr);

  return (
    <div className="space-y-6">
      
      {/* 1. FILTERS & HEADER BAR */}
      <div className="flex flex-col gap-4 rounded-xl border border-neutral-200 bg-white p-4 dark:border-neutral-800 dark:bg-neutral-950 sm:flex-row sm:items-center sm:justify-between shadow-xs">
        
        {/* Search */}
        <div className="relative flex-1 max-w-sm">
          <Search className="absolute top-2.5 left-3 h-4 w-4 text-neutral-400" />
          <input
            id="search-pegawai"
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Cari nama pegawai..."
            className="w-full rounded-lg border border-neutral-200 bg-white py-2 pl-9 pr-4 text-xs text-neutral-900 outline-hidden focus:border-neutral-900 dark:border-neutral-800 dark:bg-neutral-950 dark:text-neutral-50 dark:focus:border-neutral-700 transition"
          />
        </div>

        {/* Dropdowns */}
        <div className="flex flex-wrap items-center gap-2">
          
          {/* Month */}
          <select
            id="filter-bulan"
            value={selectedMonth}
            onChange={(e) => setSelectedMonth(Number(e.target.value))}
            className="rounded-lg border border-neutral-200 bg-white px-3 py-2 text-xs font-medium text-neutral-700 outline-hidden dark:border-neutral-800 dark:bg-neutral-950 dark:text-neutral-300"
          >
            {INDO_MONTHS.map((m, idx) => (
              <option key={idx} value={idx}>{m}</option>
            ))}
          </select>

          {/* Year */}
          <select
            id="filter-tahun"
            value={selectedYear}
            onChange={(e) => setSelectedYear(Number(e.target.value))}
            className="rounded-lg border border-neutral-200 bg-white px-3 py-2 text-xs font-medium text-neutral-700 outline-hidden dark:border-neutral-800 dark:bg-neutral-950 dark:text-neutral-300"
          >
            <option value={2026}>2026</option>
            <option value={2027}>2027</option>
          </select>

          {/* Period */}
          <select
            id="filter-periode"
            value={selectedPeriod}
            onChange={(e) => setSelectedPeriod(e.target.value)}
            className="rounded-lg border border-neutral-200 bg-white px-3 py-2 text-xs font-medium text-neutral-700 outline-hidden dark:border-neutral-800 dark:bg-neutral-950 dark:text-neutral-300"
          >
            <option value="all">Semua Periode</option>
            <option value="1">Periode 1 (Tgl 1-10)</option>
            <option value="2">Periode 2 (Tgl 11-20)</option>
            <option value="3">Periode 3 (Tgl 21-Akhir)</option>
          </select>

          {/* Sidebar Staff List Trigger */}
          <button
            id="btn-sidebar-staf"
            onClick={() => setEmployeeSidebarOpen(true)}
            className="hidden lg:flex items-center gap-1.5 rounded-lg border border-neutral-200 bg-white px-3 py-2 text-xs font-semibold text-neutral-700 hover:bg-neutral-50 dark:border-neutral-800 dark:bg-neutral-950 dark:text-neutral-300 dark:hover:bg-neutral-900 transition-all cursor-pointer"
          >
            <Users className="h-3.5 w-3.5" />
            <span>Kelola Staf ({employees.filter(e => e.status === 'aktif').length})</span>
          </button>

          {/* View Mode Split Toggle */}
          <div className="flex h-9 items-center rounded-lg border border-neutral-200 bg-neutral-50 p-1 dark:border-neutral-800 dark:bg-neutral-900 shadow-inner">
            <button
              id="view-mode-calendar"
              onClick={() => setViewMode('calendar')}
              className={`flex items-center gap-1.5 rounded-md px-2.5 py-1 text-xs font-medium transition cursor-pointer ${
                viewMode === 'calendar'
                  ? 'bg-white text-neutral-950 shadow-xs dark:bg-neutral-800 dark:text-white'
                  : 'text-neutral-500 hover:text-neutral-800 dark:text-neutral-400 dark:hover:text-neutral-100'
              }`}
            >
              <Calendar className="h-3.5 w-3.5" />
              <span className="hidden sm:inline">Kalender</span>
            </button>
            <button
              id="view-mode-table"
              onClick={() => setViewMode('table')}
              className={`flex items-center gap-1.5 rounded-md px-2.5 py-1 text-xs font-medium transition cursor-pointer ${
                viewMode === 'table'
                  ? 'bg-white text-neutral-950 shadow-xs dark:bg-neutral-800 dark:text-white'
                  : 'text-neutral-500 hover:text-neutral-800 dark:text-neutral-400 dark:hover:text-neutral-100'
              }`}
            >
              <TableProperties className="h-3.5 w-3.5" />
              <span className="hidden sm:inline">Tabel</span>
            </button>
          </div>

        </div>
      </div>

      {/* 2. MODE LAYOUTS AREA */}
      {viewMode === 'calendar' ? (
        
        // ==================== CALENDAR CONTAINER ====================
        <div className="rounded-xl border border-neutral-200 bg-white p-5 dark:border-neutral-800 dark:bg-neutral-950 shadow-xs transition-all duration-300">
          
          {/* Calendar Controller & Sub Modes */}
          <div className="flex flex-col gap-4 border-b border-neutral-100 pb-4 dark:border-neutral-800 sm:flex-row sm:items-center sm:justify-between mb-5">
            
            <div className="flex items-center gap-3">
              <button
                onClick={handlePrevDay}
                className="rounded-lg border border-neutral-200 p-1.5 hover:bg-neutral-50 dark:border-neutral-850 dark:hover:bg-neutral-900 transition text-neutral-600 dark:text-neutral-300"
              >
                <ChevronLeft className="h-4 w-4" />
              </button>
              <h2 className="text-sm font-semibold text-neutral-950 dark:text-neutral-50 tracking-tight select-none">
                {activeDate.getDate()} {INDO_MONTHS[activeDate.getMonth()]} {activeDate.getFullYear()}
              </h2>
              <button
                onClick={handleNextDay}
                className="rounded-lg border border-neutral-200 p-1.5 hover:bg-neutral-50 dark:border-neutral-850 dark:hover:bg-neutral-900 transition text-neutral-600 dark:text-neutral-300"
              >
                <ChevronRight className="h-4 w-4" />
              </button>
            </div>

            {/* Calendar sub view tabs (Month, Week, Day) */}
            <div className="flex h-9 items-center rounded-lg border border-neutral-200 bg-neutral-50 p-1 dark:border-neutral-800 dark:bg-neutral-900/60 shadow-inner">
              <button
                id="cal-tab-month"
                onClick={() => setCalendarSubMode('month')}
                className={`rounded-md px-3 py-1 text-xs font-semibold cursor-pointer transition ${
                  calendarSubMode === 'month'
                    ? 'bg-white text-neutral-950 shadow-xs dark:bg-neutral-800 dark:text-white'
                    : 'text-neutral-500 hover:text-neutral-850 dark:text-neutral-400 dark:hover:text-neutral-150'
                }`}
              >
                Bulanan
              </button>
              <button
                id="cal-tab-week"
                onClick={() => setCalendarSubMode('week')}
                className={`rounded-md px-3 py-1 text-xs font-semibold cursor-pointer transition ${
                  calendarSubMode === 'week'
                    ? 'bg-white text-neutral-950 shadow-xs dark:bg-neutral-800 dark:text-white'
                    : 'text-neutral-500 hover:text-neutral-850 dark:text-neutral-400 dark:hover:text-neutral-150'
                }`}
              >
                Mingguan
              </button>
              <button
                id="cal-tab-day"
                onClick={() => setCalendarSubMode('day')}
                className={`rounded-md px-3 py-1 text-xs font-semibold cursor-pointer transition ${
                  calendarSubMode === 'day'
                    ? 'bg-white text-neutral-950 shadow-xs dark:bg-neutral-800 dark:text-white'
                    : 'text-neutral-500 hover:text-neutral-850 dark:text-neutral-400 dark:hover:text-neutral-150'
                }`}
              >
                Harian (Roster)
              </button>
            </div>

          </div>

          {/* RENDER CHOSEN CALENDAR SUB-MODE */}
          {calendarSubMode === 'month' && (
            
            // --- MONTH VIEW ---
            <div className="space-y-4">
              
              {/* Grid Header Weekdays */}
              <div className="grid grid-cols-7 gap-1 text-center font-mono text-[10px] uppercase tracking-wider text-neutral-400 font-bold">
                <div>Min</div>
                <div>Sen</div>
                <div>Sel</div>
                <div>Rab</div>
                <div>Kam</div>
                <div>Jum</div>
                <div>Sab</div>
              </div>

              {/* Grid Dates */}
              <div className="grid grid-cols-7 gap-2">
                {/* Empty slots for offset from first day of month */}
                {monthDays.length > 0 && Array.from({ length: getDayOfWeek(monthDays[0].date) }).map((_, o) => (
                  <div key={`offset-${o}`} className="aspect-square bg-neutral-50/50 dark:bg-neutral-900/30 rounded-xl border border-dashed border-neutral-100 dark:border-neutral-800/40 opacity-40" />
                ))}

                {/* Actual schedule days */}
                {monthDays.map((daySched) => {
                  const dObj = new Date(daySched.date);
                  const isToday = daySched.date === activeDateStr;
                  const dayNum = dObj.getDate();

                  // Calculate vacant slots on this day
                  let emptyCount = 0;
                  const keys: RoleKey[] = ['kantorPagi', 'kantorMalam', 'pendawaPagi', 'pendawaMalam', 'kentenMalam', 'cadangan'];
                  keys.forEach(k => {
                    emptyCount += Math.max(0, POSITIONS[k].idealCapacity - (daySched[k]?.length || 0));
                  });

                  return (
                    <button
                      key={daySched.date}
                      onClick={() => {
                        setActiveDateStr(daySched.date);
                        setShowDetailDialog(true);
                      }}
                      className={`text-left aspect-square flex flex-col justify-between p-2.5 rounded-xl border transition-all hover:scale-101 hover:shadow-xs cursor-pointer ${
                        isToday
                          ? 'bg-neutral-900 text-white border-neutral-900 dark:bg-white dark:text-neutral-950 dark:border-white ring-2 ring-neutral-900/10'
                          : 'bg-white text-neutral-800 border-neutral-200 dark:bg-neutral-950 dark:text-neutral-250 dark:border-neutral-850 hover:bg-neutral-50 dark:hover:bg-neutral-900/50'
                      }`}
                    >
                      <span className="text-sm font-bold block">{dayNum}</span>
                      
                      {/* Condensed status summary */}
                      <div className="space-y-1">
                        {emptyCount > 0 ? (
                          <span className={`inline-flex items-center gap-1 rounded-sm px-1.5 py-0.5 text-[8px] font-bold tracking-tight uppercase animate-pulse ${
                            isToday ? 'bg-amber-600/30 text-amber-100' : 'bg-red-50 text-red-600 dark:bg-red-950/40 dark:text-red-400'
                          }`}>
                            <AlertCircle className="h-2 w-2" />
                            <span>{emptyCount} KOSONG</span>
                          </span>
                        ) : (
                          <span className={`inline-block rounded-sm px-1.5 py-0.5 text-[8px] font-bold tracking-tight uppercase ${
                            isToday ? 'bg-white/20 text-white' : 'bg-green-50 text-green-600 dark:bg-green-950/30 dark:text-green-400'
                          }`}>
                            Penuh
                          </span>
                        )}

                        <span className="block text-[8px] text-neutral-400 font-mono truncate leading-none mt-1">
                          {daySched.cadangan.length} Cadangan
                        </span>
                      </div>
                    </button>
                  );
                })}
              </div>

            </div>
          )}

          {calendarSubMode === 'week' && (
            
            // --- WEEK VIEW ---
            <div className="grid grid-cols-1 md:grid-cols-7 gap-3">
              {/* Find the week chunk based on selected date */}
              {(() => {
                // Find index of selected date
                const activeIndex = monthDays.findIndex(s => s.date === activeDateStr);
                const startIndex = Math.max(0, activeIndex - (activeIndex % 7));
                const weekChunk = monthDays.slice(startIndex, startIndex + 7);

                return weekChunk.map(daySched => {
                  const isToday = daySched.date === activeDateStr;
                  const dateObj = new Date(daySched.date);
                  const namesOfRoles = ['Sen', 'Sel', 'Rab', 'Kam', 'Jum', 'Sab', 'Ming'];
                  const wd = dateObj.getDay();

                  return (
                    <div
                      key={daySched.date}
                      onClick={() => setActiveDateStr(daySched.date)}
                      className={`rounded-xl border p-4 text-left transition-all cursor-pointer ${
                        isToday
                          ? 'bg-neutral-900 border-neutral-900 text-white shadow-md dark:bg-white dark:border-white dark:text-neutral-950'
                          : 'bg-white border-neutral-200 dark:bg-neutral-950 dark:border-neutral-850 hover:bg-neutral-50/60 dark:hover:bg-neutral-900/40'
                      }`}
                    >
                      <div className="flex items-center justify-between mb-3">
                        <span className="text-xs font-bold uppercase tracking-wider text-neutral-400">
                          {namesOfRoles[wd === 0 ? 6 : wd - 1]}
                        </span>
                        <span className="text-base font-extrabold">{dateObj.getDate()}</span>
                      </div>

                      {/* Display staff breakdown for major roles */}
                      <div className="space-y-3 pt-2 text-[10px] border-t border-dashed border-neutral-100 dark:border-neutral-800">
                        
                        <div>
                          <span className="block font-bold text-neutral-400 uppercase tracking-tight mb-0.5">Kantor Pagi</span>
                          {daySched.kantorPagi.length > 0 ? (
                            daySched.kantorPagi.map(id => (
                              <span key={id} className="block font-medium truncate">{getEmployeeName(id)}</span>
                            ))
                          ) : (
                            <span className="text-red-500 font-bold animate-pulse">KOSONG</span>
                          )}
                        </div>

                        <div>
                          <span className="block font-bold text-neutral-400 uppercase tracking-tight mb-0.5">Kantor Malam</span>
                          {daySched.kantorMalam.length > 0 ? (
                            daySched.kantorMalam.map(id => (
                              <span key={id} className="block font-medium truncate">{getEmployeeName(id)}</span>
                            ))
                          ) : (
                            <span className="text-red-500 font-bold animate-pulse">KOSONG</span>
                          )}
                        </div>

                        <div>
                          <span className="block font-bold text-neutral-400 uppercase tracking-tight mb-0.5">Pendawa Pagi</span>
                          {daySched.pendawaPagi.length > 0 ? (
                            daySched.pendawaPagi.map(id => (
                              <span key={id} className="block font-medium truncate">{getEmployeeName(id)}</span>
                            ))
                          ) : (
                            <span className="text-red-500 font-bold animate-pulse">KOSONG</span>
                          )}
                        </div>

                        <div>
                          <span className="block font-bold text-neutral-400 uppercase tracking-tight mb-0.5">Pendawa Malam</span>
                          {daySched.pendawaMalam.length > 0 ? (
                            daySched.pendawaMalam.map(id => (
                              <span key={id} className="block font-medium truncate">{getEmployeeName(id)}</span>
                            ))
                          ) : (
                            <span className="text-red-500 font-bold animate-pulse">KOSONG</span>
                          )}
                        </div>

                        <div>
                          <span className="block font-bold text-neutral-400 uppercase tracking-tight mb-0.5">Kenten Malam</span>
                          {daySched.kentenMalam.length > 0 ? (
                            daySched.kentenMalam.map(id => (
                              <span key={id} className="block font-medium truncate">{getEmployeeName(id)}</span>
                            ))
                          ) : (
                            <span className="text-red-500 font-bold animate-pulse">KOSONG</span>
                          )}
                        </div>

                      </div>
                    </div>
                  );
                });
              })()}
            </div>
          )}

          {calendarSubMode === 'day' && activeDaySchedule && (
            
            // --- DAILY ROSTER DETAIL CARDS ---
            <div className="space-y-6">
              <div className="flex items-center justify-between">
                <h3 className="text-xs font-bold tracking-wider uppercase text-neutral-400">
                  Rencana Penjagaan Operasional
                </h3>
                <span className="text-xs text-neutral-500 dark:text-neutral-400">
                  Target Jaga: {activeDaySchedule.kantorPagi.length + activeDaySchedule.kantorMalam.length + activeDaySchedule.pendawaPagi.length + activeDaySchedule.pendawaMalam.length + activeDaySchedule.kentenMalam.length} dari 9 Lokasi Kerja Utama
                </span>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5 gap-4">
                
                {/* Kantor Pagi Card */}
                <div className="rounded-xl border border-neutral-100 bg-neutral-50 px-4 py-5 dark:border-neutral-850 dark:bg-neutral-900/30">
                  <span className="text-[10px] font-bold text-blue-500 bg-blue-500/10 px-2 py-0.5 rounded-full uppercase tracking-wider dark:text-blue-400">
                    Kantor Pagi
                  </span>
                  <div className="mt-4 space-y-3">
                    {activeDaySchedule.kantorPagi.length > 0 ? (
                      activeDaySchedule.kantorPagi.map(id => (
                        <div key={id} className="flex items-center justify-between p-2 bg-white rounded-lg border border-neutral-150 dark:bg-neutral-950 dark:border-neutral-800">
                          <div>
                            <span className="block text-xs font-bold text-neutral-800 dark:text-neutral-200">{getEmployeeName(id)}</span>
                            <span className="text-[10px] text-neutral-400 inline-flex items-center gap-1">
                              <Phone className="h-2.5 w-2.5" /> {getEmployeePhone(id)}
                            </span>
                          </div>
                          <button
                            onClick={() => onDeleteEmployee(id, activeDateStr)}
                            className="p-1 hover:bg-red-50 hover:text-red-600 rounded-sm dark:hover:bg-red-950/40 text-neutral-400"
                            title="Soft delete employee"
                          >
                            <Trash2 className="h-3.5 w-3.5" />
                          </button>
                        </div>
                      ))
                    ) : (
                      <div className="p-3 bg-red-50/50 border border-dashed border-red-300 rounded-lg text-center font-bold text-xs text-red-500 animate-pulse">
                        KOSONG
                      </div>
                    )}
                  </div>
                </div>

                {/* Kantor Malam Card */}
                <div className="rounded-xl border border-neutral-100 bg-neutral-50 px-4 py-5 dark:border-neutral-850 dark:bg-neutral-900/30">
                  <span className="text-[10px] font-bold text-indigo-500 bg-indigo-500/10 px-2 py-0.5 rounded-full uppercase tracking-wider dark:text-indigo-400">
                    Kantor Malam
                  </span>
                  <div className="mt-4 space-y-3">
                    {activeDaySchedule.kantorMalam.length > 0 ? (
                      activeDaySchedule.kantorMalam.map(id => (
                        <div key={id} className="flex items-center justify-between p-2 bg-white rounded-lg border border-neutral-150 dark:bg-neutral-950 dark:border-neutral-800">
                          <div>
                            <span className="block text-xs font-bold text-neutral-800 dark:text-neutral-200">{getEmployeeName(id)}</span>
                            <span className="text-[10px] text-neutral-400 inline-flex items-center gap-1">
                              <Phone className="h-2.5 w-2.5" /> {getEmployeePhone(id)}
                            </span>
                          </div>
                          <button
                            onClick={() => onDeleteEmployee(id, activeDateStr)}
                            className="p-1 hover:bg-red-50 hover:text-red-600 rounded-sm dark:hover:bg-red-950/40 text-neutral-400"
                          >
                            <Trash2 className="h-3.5 w-3.5" />
                          </button>
                        </div>
                      ))
                    ) : (
                      <div className="p-3 bg-red-50/50 border border-dashed border-red-300 rounded-lg text-center font-bold text-xs text-red-500 animate-pulse">
                        KOSONG
                      </div>
                    )}
                  </div>
                </div>

                {/* Pendawa Pagi Card */}
                <div className="rounded-xl border border-neutral-100 bg-neutral-50 px-4 py-5 dark:border-neutral-850 dark:bg-neutral-900/30">
                  <span className="text-[10px] font-bold text-emerald-500 bg-emerald-500/10 px-2 py-0.5 rounded-full uppercase tracking-wider dark:text-emerald-400">
                    Pendawa Pagi
                  </span>
                  <div className="mt-4 space-y-3">
                    {activeDaySchedule.pendawaPagi.length > 0 ? (
                      activeDaySchedule.pendawaPagi.map(id => (
                        <div key={id} className="flex items-center justify-between p-2 bg-white rounded-lg border border-neutral-150 dark:bg-neutral-950 dark:border-neutral-800">
                          <div>
                            <span className="block text-xs font-bold text-neutral-800 dark:text-neutral-200">{getEmployeeName(id)}</span>
                            <span className="text-[10px] text-neutral-400 inline-flex items-center gap-1">
                              <Phone className="h-2.5 w-2.5" /> {getEmployeePhone(id)}
                            </span>
                          </div>
                          <button
                            onClick={() => onDeleteEmployee(id, activeDateStr)}
                            className="p-1 hover:bg-red-50 hover:text-red-600 rounded-sm dark:hover:bg-red-950/40 text-neutral-400"
                          >
                            <Trash2 className="h-3.5 w-3.5" />
                          </button>
                        </div>
                      ))
                    ) : (
                      <div className="p-3 bg-red-50/50 border border-dashed border-red-300 rounded-lg text-center font-bold text-xs text-red-500 animate-pulse">
                        KOSONG
                      </div>
                    )}
                  </div>
                </div>

                {/* Pendawa Malam Card */}
                <div className="rounded-xl border border-neutral-100 bg-neutral-50 px-4 py-5 dark:border-neutral-850 dark:bg-neutral-900/30">
                  <span className="text-[10px] font-bold text-teal-500 bg-teal-500/10 px-2 py-0.5 rounded-full uppercase tracking-wider dark:text-teal-400">
                    Pendawa Malam
                  </span>
                  <div className="mt-4 space-y-3">
                    {activeDaySchedule.pendawaMalam.length > 0 ? (
                      activeDaySchedule.pendawaMalam.map(id => (
                        <div key={id} className="flex items-center justify-between p-2 bg-white rounded-lg border border-neutral-150 dark:bg-neutral-950 dark:border-neutral-800">
                          <div>
                            <span className="block text-xs font-bold text-neutral-800 dark:text-neutral-200">{getEmployeeName(id)}</span>
                            <span className="text-[10px] text-neutral-400 inline-flex items-center gap-1">
                              <Phone className="h-2.5 w-2.5" /> {getEmployeePhone(id)}
                            </span>
                          </div>
                          <button
                            onClick={() => onDeleteEmployee(id, activeDateStr)}
                            className="p-1 hover:bg-red-50 hover:text-red-600 rounded-sm dark:hover:bg-red-950/40 text-neutral-400"
                          >
                            <Trash2 className="h-3.5 w-3.5" />
                          </button>
                        </div>
                      ))
                    ) : (
                      <div className="p-3 bg-red-50/50 border border-dashed border-red-300 rounded-lg text-center font-bold text-xs text-red-500 animate-pulse">
                        KOSONG
                      </div>
                    )}
                  </div>
                </div>

                {/* Kenten Malam Card */}
                <div className="rounded-xl border border-neutral-100 bg-neutral-50 px-4 py-5 dark:border-neutral-850 dark:bg-neutral-900/30">
                  <span className="text-[10px] font-bold text-orange-500 bg-orange-500/10 px-2 py-0.5 rounded-full uppercase tracking-wider dark:text-orange-400">
                    Kenten Malam
                  </span>
                  <div className="mt-4 space-y-3">
                    {activeDaySchedule.kentenMalam.length > 0 ? (
                      activeDaySchedule.kentenMalam.map(id => (
                        <div key={id} className="flex items-center justify-between p-2 bg-white rounded-lg border border-neutral-150 dark:bg-neutral-950 dark:border-neutral-800">
                          <div>
                            <span className="block text-xs font-bold text-neutral-800 dark:text-neutral-200">{getEmployeeName(id)}</span>
                            <span className="text-[10px] text-neutral-400 inline-flex items-center gap-1">
                              <Phone className="h-2.5 w-2.5" /> {getEmployeePhone(id)}
                            </span>
                          </div>
                          <button
                            onClick={() => onDeleteEmployee(id, activeDateStr)}
                            className="p-1 hover:bg-red-50 hover:text-red-600 rounded-sm dark:hover:bg-red-950/40 text-neutral-400"
                          >
                            <Trash2 className="h-3.5 w-3.5" />
                          </button>
                        </div>
                      ))
                    ) : (
                      <div className="p-3 bg-red-50/50 border border-dashed border-red-300 rounded-lg text-center font-bold text-xs text-red-500 animate-pulse">
                        KOSONG
                      </div>
                    )}
                  </div>
                </div>

              </div>

              {/* Cadangan & Libur Section */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6 pt-2">
                <div className="rounded-xl border border-neutral-200 bg-white p-5 dark:border-neutral-800 dark:bg-neutral-950">
                  <h4 className="text-xs font-bold uppercase tracking-wider text-neutral-400 mb-4 flex items-center gap-1.5">
                    <Briefcase className="h-3.5 w-3.5" />
                    <span>Petugas Cadangan ({activeDaySchedule.cadangan.length} dari 5 slot)</span>
                  </h4>
                  <div className="flex flex-wrap gap-2">
                    {activeDaySchedule.cadangan.map(id => (
                      <div key={id} className="inline-flex items-center gap-2 rounded-lg border border-neutral-250 bg-neutral-50/50 px-3 py-1.5 dark:border-neutral-800 dark:bg-neutral-900/60">
                        <span className="text-xs font-semibold text-neutral-700 dark:text-neutral-300">
                          {getEmployeeName(id)}
                        </span>
                        <button
                          onClick={() => onDeleteEmployee(id, activeDateStr)}
                          className="text-neutral-400 hover:text-red-500"
                        >
                          <X className="h-3 w-3" />
                        </button>
                      </div>
                    ))}
                    {activeDaySchedule.cadangan.length < 5 && Array.from({ length: 5 - activeDaySchedule.cadangan.length }).map((_, i) => (
                      <div key={`cad-empty-${i}`} className="inline-flex items-center px-3 py-1.5 border border-dashed border-neutral-200 rounded-lg bg-white/50 text-[10px] text-neutral-400 font-semibold dark:border-neutral-800 dark:bg-transparent">
                        KOSONG
                      </div>
                    ))}
                  </div>
                </div>

                <div className="rounded-xl border border-neutral-200 bg-white p-5 dark:border-neutral-800 dark:bg-neutral-950">
                  <h4 className="text-xs font-bold uppercase tracking-wider text-neutral-400 mb-4 flex items-center gap-1.5">
                    <UserMinus className="h-3.5 w-3.5" />
                    <span>Pegawai Libur Hari Ini ({activeDaySchedule.libur.length})</span>
                  </h4>
                  <div className="flex flex-wrap gap-2">
                    {activeDaySchedule.libur.map(id => (
                      <span key={id} className="inline-flex items-center gap-1.5 rounded-lg bg-purple-50/50 dark:bg-purple-950/25 border border-purple-100 dark:border-purple-900/40 px-3 py-1.5 text-xs font-semibold text-purple-700 dark:text-purple-400">
                        {getEmployeeName(id)}
                      </span>
                    ))}
                  </div>
                </div>
              </div>

            </div>
          )}

        </div>
      ) : (
        
        // ==================== RESPONSIVE EXCEL-SHEET TABLE VIEWS ====================
        <div className="rounded-xl border border-neutral-200 bg-white shadow-xs dark:border-neutral-800 dark:bg-neutral-950 transition-all duration-300">
          
          <div className="border-b border-neutral-100 p-5 dark:border-neutral-850">
            <h3 className="text-sm font-semibold text-neutral-950 dark:text-neutral-50 tracking-tight">
              Matriks Penjadwalan Bulanan ({INDO_MONTHS[selectedMonth]} {selectedYear})
            </h3>
            <p className="text-[10px] text-neutral-500 mt-1 dark:text-neutral-400 leading-none">
              Daftar penempatan guard per shift dan tanggal harian. Geser ke kanan jika layar sempit.
            </p>
          </div>

          <div className="overflow-x-auto w-full">
            <table className="w-full text-left border-collapse min-w-[1200px]">
              
              <thead>
                <tr className="bg-neutral-50 dark:bg-neutral-900 border-b border-neutral-200 dark:border-neutral-800">
                  <th className="sticky left-0 z-10 w-[180px] bg-neutral-100 px-4 py-3 text-xs font-bold rounded-tl-xl text-neutral-600 dark:bg-neutral-850 dark:text-neutral-300">
                    Posisi / Shift
                  </th>
                  {filteredSchedules.map(day => {
                    const number = new Date(day.date).getDate();
                    return (
                      <th
                        key={day.date}
                        onClick={() => {
                          setActiveDateStr(day.date);
                          setShowDetailDialog(true);
                        }}
                        className={`px-3 py-3 text-center text-xs font-extrabold cursor-pointer hover:bg-neutral-150/60 transition ${
                          day.date === activeDateStr 
                            ? 'bg-neutral-900 text-white dark:bg-white dark:text-neutral-950' 
                            : 'text-neutral-700 dark:text-neutral-300'
                        }`}
                      >
                        {number}
                      </th>
                    );
                  })}
                </tr>
              </thead>

              <tbody className="divide-y divide-neutral-150 dark:divide-neutral-800">
                
                {/* Kantor Pagi Row */}
                <tr className="hover:bg-neutral-50/50 dark:hover:bg-neutral-900/30 transition">
                  <td className="sticky left-0 z-10 bg-white font-bold text-xs px-4 py-3 border-r border-neutral-200 text-neutral-800 dark:bg-neutral-950 dark:text-neutral-200 dark:border-neutral-800">
                    Kantor Pagi
                  </td>
                  {filteredSchedules.map(s => (
                    <td key={s.date} className="px-2 py-3 text-center border-r border-neutral-150 dark:border-neutral-850">
                      <div className="flex flex-col gap-1 items-center">
                        {s.kantorPagi.length > 0 ? (
                          s.kantorPagi.map(id => (
                            <span key={id} className="text-[10px] font-bold text-indigo-700 bg-indigo-50 dark:text-indigo-400 dark:bg-indigo-950/40 px-2 py-0.5 rounded-sm line-clamp-1 max-w-[100px] truncate">
                              {getEmployeeName(id)}
                            </span>
                          ))
                        ) : (
                          <span className="text-[9px] font-extrabold text-red-600 bg-red-50 dark:text-red-400 dark:bg-red-950/40 px-1 py-0.5 rounded-xs animate-pulse">KOSONG</span>
                        )}
                      </div>
                    </td>
                  ))}
                </tr>

                {/* Kantor Malam Row */}
                <tr className="hover:bg-neutral-50/50 dark:hover:bg-neutral-900/30 transition">
                  <td className="sticky left-0 z-10 bg-white font-bold text-xs px-4 py-3 border-r border-neutral-200 text-neutral-800 dark:bg-neutral-950 dark:text-neutral-200 dark:border-neutral-800">
                    Kantor Malam
                  </td>
                  {filteredSchedules.map(s => (
                    <td key={s.date} className="px-2 py-3 text-center border-r border-neutral-150 dark:border-neutral-850">
                      <div className="flex flex-col gap-1 items-center">
                        {s.kantorMalam.length > 0 ? (
                          s.kantorMalam.map(id => (
                            <span key={id} className="text-[10px] font-bold text-blue-700 bg-blue-50 dark:text-blue-400 dark:bg-blue-950/40 px-2 py-0.5 rounded-sm line-clamp-1 max-w-[100px] truncate">
                              {getEmployeeName(id)}
                            </span>
                          ))
                        ) : (
                          <span className="text-[9px] font-extrabold text-red-600 bg-red-50 dark:text-red-400 dark:bg-red-950/40 px-1 py-0.5 rounded-xs animate-pulse">KOSONG</span>
                        )}
                      </div>
                    </td>
                  ))}
                </tr>

                {/* Pendawa Pagi Row */}
                <tr className="hover:bg-neutral-50/50 dark:hover:bg-neutral-900/30 transition">
                  <td className="sticky left-0 z-10 bg-white font-bold text-xs px-4 py-3 border-r border-neutral-200 text-neutral-800 dark:bg-neutral-950 dark:text-neutral-200 dark:border-neutral-800">
                    Pendawa Pagi
                  </td>
                  {filteredSchedules.map(s => (
                    <td key={s.date} className="px-2 py-3 text-center border-r border-neutral-150 dark:border-neutral-850">
                      <div className="flex flex-col gap-1 items-center">
                        {s.pendawaPagi.length > 0 ? (
                          s.pendawaPagi.map(id => (
                            <span key={id} className="text-[10px] font-bold text-emerald-700 bg-emerald-50 dark:text-emerald-400 dark:bg-emerald-950/40 px-2 py-0.5 rounded-sm line-clamp-1 max-w-[100px] truncate">
                              {getEmployeeName(id)}
                            </span>
                          ))
                        ) : (
                          <span className="text-[9px] font-extrabold text-red-600 bg-red-50 dark:text-red-400 dark:bg-red-950/40 px-1 py-0.5 rounded-xs animate-pulse">KOSONG</span>
                        )}
                      </div>
                    </td>
                  ))}
                </tr>

                {/* Pendawa Malam Row */}
                <tr className="hover:bg-neutral-50/50 dark:hover:bg-neutral-900/30 transition">
                  <td className="sticky left-0 z-10 bg-white font-bold text-xs px-4 py-3 border-r border-neutral-200 text-neutral-800 dark:bg-neutral-950 dark:text-neutral-200 dark:border-neutral-800">
                    Pendawa Malam
                  </td>
                  {filteredSchedules.map(s => (
                    <td key={s.date} className="px-2 py-3 text-center border-r border-neutral-150 dark:border-neutral-850">
                      <div className="flex flex-col gap-1 items-center">
                        {s.pendawaMalam.length > 0 ? (
                          s.pendawaMalam.map(id => (
                            <span key={id} className="text-[10px] font-bold text-teal-700 bg-teal-50 dark:text-teal-400 dark:bg-teal-950/40 px-2 py-0.5 rounded-sm line-clamp-1 max-w-[100px] truncate">
                              {getEmployeeName(id)}
                            </span>
                          ))
                        ) : (
                          <span className="text-[9px] font-extrabold text-red-600 bg-red-50 dark:text-red-400 dark:bg-red-950/40 px-1 py-0.5 rounded-xs animate-pulse">KOSONG</span>
                        )}
                      </div>
                    </td>
                  ))}
                </tr>

                {/* Kenten Malam Row */}
                <tr className="hover:bg-neutral-50/50 dark:hover:bg-neutral-900/30 transition">
                  <td className="sticky left-0 z-10 bg-white font-bold text-xs px-4 py-3 border-r border-neutral-200 text-neutral-800 dark:bg-neutral-950 dark:text-neutral-200 dark:border-neutral-800">
                    Kenten Malam
                  </td>
                  {filteredSchedules.map(s => (
                    <td key={s.date} className="px-2 py-3 text-center border-r border-neutral-150 dark:border-neutral-850">
                      <div className="flex flex-col gap-1 items-center">
                        {s.kentenMalam.length > 0 ? (
                          s.kentenMalam.map(id => (
                            <span key={id} className="text-[10px] font-bold text-amber-700 bg-amber-50 dark:text-amber-400 dark:bg-amber-950/40 px-2 py-0.5 rounded-sm line-clamp-1 max-w-[100px] truncate">
                              {getEmployeeName(id)}
                            </span>
                          ))
                        ) : (
                          <span className="text-[9px] font-extrabold text-red-600 bg-red-50 dark:text-red-400 dark:bg-red-950/40 px-1 py-0.5 rounded-xs animate-pulse">KOSONG</span>
                        )}
                      </div>
                    </td>
                  ))}
                </tr>

                {/* Cadangan Row */}
                <tr className="hover:bg-neutral-50/50 dark:hover:bg-neutral-900/30 transition">
                  <td className="sticky left-0 z-10 bg-white font-bold text-xs px-4 py-3 border-r border-neutral-200 text-neutral-800 dark:bg-neutral-950 dark:text-neutral-200 dark:border-neutral-800">
                    Cadangan
                  </td>
                  {filteredSchedules.map(s => (
                    <td key={s.date} className="px-2 py-3 text-center border-r border-neutral-150 dark:border-neutral-850">
                      <div className="flex flex-col gap-1 items-center">
                        {s.cadangan.length > 0 ? (
                          s.cadangan.map(id => (
                            <span key={id} className="text-[9px] font-semibold text-neutral-600 bg-neutral-100 dark:text-neutral-300 dark:bg-neutral-900 px-1.5 py-0.5 rounded-xs line-clamp-1 max-w-[100px] truncate">
                              {getEmployeeName(id)}
                            </span>
                          ))
                        ) : (
                          <span className="text-[9px] font-extrabold text-red-600 bg-red-50 dark:text-red-400 dark:bg-red-950/40 px-1 py-0.5 rounded-xs animate-pulse">KOSONG</span>
                        )}
                      </div>
                    </td>
                  ))}
                </tr>

                {/* Libur Row */}
                <tr className="hover:bg-neutral-50/50 dark:hover:bg-neutral-900/30 transition">
                  <td className="sticky left-0 z-10 bg-white font-bold text-xs px-4 py-3 border-r border-neutral-200 text-neutral-800 dark:bg-neutral-950 dark:text-neutral-200 dark:border-neutral-800 rounded-bl-xl">
                    Libur
                  </td>
                  {filteredSchedules.map(s => (
                    <td key={s.date} className="px-2 py-3 text-center border-r border-neutral-150 dark:border-neutral-850">
                      <div className="flex flex-wrap gap-1 justify-center max-w-[140px] mx-auto">
                        {s.libur?.map(id => (
                          <span key={id} className="text-[8px] font-bold text-purple-600 bg-purple-50 dark:text-purple-400 dark:bg-purple-950/40 px-1 py-0.5 rounded-xs truncate max-w-[60px]" title={getEmployeeName(id)}>
                            {getEmployeeName(id)}
                          </span>
                        ))}
                      </div>
                    </td>
                  ))}
                </tr>

              </tbody>

            </table>
          </div>

        </div>
      )}

      {/* ==================== INTERACTIVE ROSTER MODAL DIALOG ==================== */}
      {showDetailDialog && activeDaySchedule && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-xs p-4 transition-all animate-fade-in">
          <div className="relative w-full max-w-2xl bg-white dark:bg-neutral-950 border border-neutral-200 dark:border-neutral-800 rounded-2xl shadow-xl p-6 overflow-hidden">
            
            {/* Header */}
            <div className="flex items-center justify-between border-b pb-4 mb-4 border-neutral-100 dark:border-neutral-850">
              <div className="flex items-center gap-2">
                <CalendarDays className="h-5 w-5 text-neutral-800 dark:text-neutral-100" />
                <div>
                  <h4 className="text-sm font-extrabold text-neutral-900 dark:text-neutral-55 tracking-tight">
                    Roster Jaga PKD tanggal {activeDay} JUNI 2026
                  </h4>
                  <p className="text-[10px] text-neutral-400 dark:text-neutral-500 font-mono mt-0.5 leading-none">
                    Status: {getPeriodFromDay(activeDay) === 1 ? 'Periode 1 (1-10)' : getPeriodFromDay(activeDay) === 2 ? 'Periode 2 (11-20)' : 'Periode 3 (21-30)'}
                  </p>
                </div>
              </div>
              <button
                id="btn-close-modal"
                onClick={() => setShowDetailDialog(false)}
                className="p-1 text-neutral-400 hover:bg-neutral-100 rounded-lg dark:hover:bg-neutral-900"
              >
                <X className="h-4.5 w-4.5" />
              </button>
            </div>

            {/* List */}
            <div className="space-y-4 max-h-[350px] overflow-y-auto">
              
              <div className="grid grid-cols-2 gap-4">
                
                {/* Active slots left */}
                <div className="space-y-3">
                  
                  <div>
                    <span className="text-[9px] font-bold text-blue-500 uppercase tracking-wide">Kantor Pagi</span>
                    <div className="mt-1 space-y-1">
                      {activeDaySchedule.kantorPagi.map(id => (
                        <div key={id} className="flex items-center justify-between p-2 bg-neutral-50 border rounded-lg dark:bg-neutral-900 dark:border-neutral-800 text-xs">
                          <span className="font-bold text-neutral-800 dark:text-neutral-200">{getEmployeeName(id)}</span>
                          <button onClick={() => onDeleteEmployee(id, activeDateStr)} className="text-neutral-400 hover:text-red-500 p-0.5">
                            <Trash2 className="h-3.5 w-3.5" />
                          </button>
                        </div>
                      ))}
                      {activeDaySchedule.kantorPagi.length < 2 && (
                        <span className="block text-[10px] text-red-500 font-bold bg-red-100/30 px-2 py-1 rounded-md">1 SLOT KOSONG</span>
                      )}
                    </div>
                  </div>

                  <div>
                    <span className="text-[9px] font-bold text-indigo-500 uppercase tracking-wide">Kantor Malam</span>
                    <div className="mt-1 space-y-1">
                      {activeDaySchedule.kantorMalam.map(id => (
                        <div key={id} className="flex items-center justify-between p-2 bg-neutral-50 border rounded-lg dark:bg-neutral-900 dark:border-neutral-800 text-xs">
                          <span className="font-bold text-neutral-800 dark:text-neutral-200">{getEmployeeName(id)}</span>
                          <button onClick={() => onDeleteEmployee(id, activeDateStr)} className="text-neutral-400 hover:text-red-500 p-0.5">
                            <Trash2 className="h-3.5 w-3.5" />
                          </button>
                        </div>
                      ))}
                      {activeDaySchedule.kantorMalam.length < 2 && (
                        <span className="block text-[10px] text-red-500 font-bold bg-red-100/30 px-2 py-1 rounded-md">1 SLOT KOSONG</span>
                      )}
                    </div>
                  </div>

                  <div>
                    <span className="text-[9px] font-bold text-emerald-500 uppercase tracking-wide">Pendawa Pagi</span>
                    <div className="mt-1 space-y-1">
                      {activeDaySchedule.pendawaPagi.map(id => (
                        <div key={id} className="flex items-center justify-between p-2 bg-neutral-50 border rounded-lg dark:bg-neutral-900 dark:border-neutral-800 text-xs">
                          <span className="font-bold text-neutral-800 dark:text-neutral-200">{getEmployeeName(id)}</span>
                          <button onClick={() => onDeleteEmployee(id, activeDateStr)} className="text-neutral-400 hover:text-red-500 p-0.5">
                            <Trash2 className="h-3.5 w-3.5" />
                          </button>
                        </div>
                      ))}
                      {activeDaySchedule.pendawaPagi.length < 2 && (
                        <span className="block text-[10px] text-red-500 font-bold bg-red-100/30 px-2 py-1 rounded-md">1 SLOT KOSONG</span>
                      )}
                    </div>
                  </div>

                </div>

                {/* Active slots right */}
                <div className="space-y-3">
                  
                  <div>
                    <span className="text-[9px] font-bold text-teal-500 uppercase tracking-wide">Pendawa Malam</span>
                    <div className="mt-1 space-y-1">
                      {activeDaySchedule.pendawaMalam.map(id => (
                        <div key={id} className="flex items-center justify-between p-2 bg-neutral-50 border rounded-lg dark:bg-neutral-900 dark:border-neutral-800 text-xs">
                          <span className="font-bold text-neutral-800 dark:text-neutral-200">{getEmployeeName(id)}</span>
                          <button onClick={() => onDeleteEmployee(id, activeDateStr)} className="text-neutral-400 hover:text-red-500 p-0.5">
                            <Trash2 className="h-3.5 w-3.5" />
                          </button>
                        </div>
                      ))}
                      {activeDaySchedule.pendawaMalam.length < 2 && (
                        <span className="block text-[10px] text-red-500 font-bold bg-red-100/30 px-2 py-1 rounded-md">1 SLOT KOSONG</span>
                      )}
                    </div>
                  </div>

                  <div>
                    <span className="text-[9px] font-bold text-orange-500 uppercase tracking-wide">Kenten Malam</span>
                    <div className="mt-1 space-y-1">
                      {activeDaySchedule.kentenMalam.map(id => (
                        <div key={id} className="flex items-center justify-between p-2 bg-neutral-50 border rounded-lg dark:bg-neutral-900 dark:border-neutral-800 text-xs">
                          <span className="font-bold text-neutral-800 dark:text-neutral-200">{getEmployeeName(id)}</span>
                          <button onClick={() => onDeleteEmployee(id, activeDateStr)} className="text-neutral-400 hover:text-red-500 p-0.5">
                            <Trash2 className="h-3.5 w-3.5" />
                          </button>
                        </div>
                      ))}
                      {activeDaySchedule.kentenMalam.length < 1 && (
                        <span className="block text-[10px] text-red-500 font-bold bg-red-100/30 px-2 py-1 rounded-md">1 SLOT KOSONG</span>
                      )}
                    </div>
                  </div>

                  <div>
                    <span className="text-[9px] font-bold text-neutral-400 uppercase tracking-wide">Cadangan ({activeDaySchedule.cadangan.length}/5)</span>
                    <div className="mt-1 space-y-1">
                      {activeDaySchedule.cadangan.map(id => (
                        <div key={id} className="flex items-center justify-between p-1.5 bg-neutral-50 border rounded-lg dark:bg-neutral-900 dark:border-neutral-800 text-xs">
                          <span>{getEmployeeName(id)}</span>
                          <button onClick={() => onDeleteEmployee(id, activeDateStr)} className="text-neutral-400 hover:text-red-500 p-0.5">
                            <X className="h-3 w-3" />
                          </button>
                        </div>
                      ))}
                    </div>
                  </div>

                </div>

              </div>

              {/* Libur list */}
              <div className="border-t pt-3 border-neutral-100 dark:border-neutral-850">
                <span className="text-[9px] font-bold text-purple-600 uppercase tracking-wide block mb-1">Libur Hari Ini ({activeDaySchedule.libur.length})</span>
                <div className="flex flex-wrap gap-1.5">
                  {activeDaySchedule.libur.map(id => (
                    <span key={id} className="rounded-lg bg-purple-50 dark:bg-purple-950/30 border border-purple-100 dark:border-purple-800 px-3 py-1.5 text-xs font-semibold text-purple-700 dark:text-purple-400">
                      {getEmployeeName(id)}
                    </span>
                  ))}
                </div>
              </div>

            </div>

            {/* Footer */}
            <div className="flex items-center gap-2 mt-6 p-3 rounded-lg bg-blue-50/50 dark:bg-neutral-900/50 border border-neutral-100 dark:border-neutral-850">
              <Info className="h-4 w-4 text-blue-500 dark:text-blue-400 flex-shrink-0" />
              <p className="text-[10px] text-neutral-500 leading-normal dark:text-neutral-450">
                Klik tombol <strong>Trash / Hapus</strong> di samping nama pegawai untuk melakukan <strong>Soft Delete</strong>. Sistem akan menonaktifkan pegawai, mengosongkan jadwal masa depan mereka, dan menjalankan <strong>Auto Rebalancing Engine</strong> secara real-time.
              </p>
            </div>

          </div>
        </div>
      )}

      {/* ==================== FLOATING MANIFEST SIDEBAR ==================== */}
      {employeeSidebarOpen && (
        <div className="fixed inset-0 z-55 flex justify-end bg-black/40 backdrop-blur-xs transition-colors duration-300">
          <div className="w-full max-w-sm h-full bg-white dark:bg-neutral-950 border-l border-neutral-200 dark:border-neutral-800 shadow-xl flex flex-col">
            
            {/* Sidebar Header */}
            <div className="p-5 border-b border-neutral-100 dark:border-neutral-800 flex items-center justify-between">
              <div>
                <h4 className="text-sm font-extrabold text-neutral-900 dark:text-neutral-50 tracking-tight">
                  Manajemen Pegawai PKD
                </h4>
                <p className="text-[10px] text-neutral-400 mt-0.5 font-mono">
                  Total Pegawai: {employees.length} ({employees.filter(e => e.status === 'aktif').length} Aktif)
                </p>
              </div>
              <button
                id="btn-close-sidebar"
                onClick={() => setEmployeeSidebarOpen(false)}
                className="p-1.5 text-neutral-400 hover:bg-neutral-50 dark:hover:bg-neutral-900 rounded-lg"
              >
                <X className="h-4 w-4" />
              </button>
            </div>

            {/* Sidebar Body */}
            <div className="p-5 overflow-y-auto flex-1 space-y-3">
              <span className="text-[10px] font-bold text-neutral-400 uppercase tracking-widest block">Daftar Pegawai Aktif</span>
              
              {employees.filter(e => e.status === 'aktif').map(emp => (
                <div key={emp.id} className="flex items-center justify-between p-3 rounded-lg border border-neutral-200 bg-white dark:bg-neutral-900 dark:border-neutral-800 shadow-xs">
                  <div>
                    <span className="block text-xs font-bold text-neutral-800 dark:text-neutral-200">{emp.name}</span>
                    <span className="text-[9px] text-neutral-400 block mt-0.5">Joined: {emp.joinedDate}</span>
                    <span className="text-[9px] text-neutral-400 block mt-0.5">Phone: {emp.phone}</span>
                  </div>
                  <button
                    onClick={() => {
                      if (confirm(`Apakah Anda yakin ingin menghapus ${emp.name}?`)) {
                        onDeleteEmployee(emp.id, activeDateStr);
                      }
                    }}
                    className="p-2 hover:bg-red-50 hover:text-red-500 bg-neutral-50 border rounded-lg border-neutral-200 dark:bg-neutral-950 dark:border-neutral-800 text-neutral-400 hover:border-red-200"
                    title="Soft Delete"
                  >
                    <Trash2 className="h-3.5 w-3.5" />
                  </button>
                </div>
              ))}

              <span className="text-[10px] font-bold text-neutral-400 uppercase tracking-widest block pt-4">Histori Pegawai Nonaktif / Dihapus</span>
              
              {employees.filter(e => e.status === 'nonaktif').length > 0 ? (
                employees.filter(e => e.status === 'nonaktif').map(emp => (
                  <div key={emp.id} className="flex items-center justify-between p-3 rounded-lg border border-neutral-150 bg-neutral-50 dark:bg-neutral-950/40 dark:border-neutral-900 opacity-60">
                    <div>
                      <span className="block text-xs font-bold text-neutral-700 dark:text-neutral-400 line-through">{emp.name}</span>
                      <span className="text-[9px] text-neutral-400 block mt-0.5">Joined: {emp.joinedDate}</span>
                      <span className="text-[9px] text-neutral-400 block mt-0.5">Status: Nonaktif (Dihapus)</span>
                    </div>
                    <span className="text-[8px] bg-red-100 text-red-700 rounded-md px-1.5 py-0.5 font-bold uppercase dark:bg-red-950/20 dark:text-red-400">
                      Soft-Deleted
                    </span>
                  </div>
                ))
              ) : (
                <div className="text-center py-6 text-[10px] text-neutral-400 bg-neutral-50 border border-dashed rounded-lg dark:bg-neutral-900 dark:border-neutral-800">
                  Tidak ada data historis pegawai nonaktif.
                </div>
              )}

            </div>

          </div>
        </div>
      )}

    </div>
  );
}
