/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect } from 'react';
import Navbar from './components/Navbar';
import DashboardCards from './components/DashboardCards';
import ScheduleView from './components/ScheduleView';
import AddEmployeeView from './components/AddEmployeeView';
import ChangeEmployeeView from './components/ChangeEmployeeView';
import { getEmployees, getSchedules, getScheduleStats, handleDeleteEmployee } from './utils/db';
import { Employee, DailySchedule, ScheduleStats } from './types';
import { Sparkles, CheckCircle2, ShieldCheck } from 'lucide-react';

export default function App() {
  // Navigation tab state (Mandated: jadwal, tambah, ganti)
  const [activeTab, setActiveTab] = useState<'jadwal' | 'tambah' | 'ganti'>('jadwal');
  
  // Dark mode trigger
  const [darkMode, setDarkMode] = useState<boolean>(() => {
    const saved = localStorage.getItem('pkd_theme');
    return saved ? saved === 'dark' : false;
  });

  // Database core state
  const [employees, setEmployees] = useState<Employee[]>([]);
  const [schedules, setSchedules] = useState<DailySchedule[]>([]);
  const [stats, setStats] = useState<ScheduleStats | null>(null);

  // Active date pointer (Default to June 18, 2026 per current local time info)
  const [activeDateStr, setActiveDateStr] = useState('2026-06-18');

  // Custom Toast notification
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  // Load and refresh state from storage
  const reloadData = () => {
    const fetchedEmps = getEmployees();
    const fetchedSchedules = getSchedules();
    const computedStats = getScheduleStats(activeDateStr);

    setEmployees(fetchedEmps);
    setSchedules(fetchedSchedules);
    setStats(computedStats);
  };

  // Sync dark mode HTML class on change
  useEffect(() => {
    if (darkMode) {
      document.documentElement.classList.add('dark');
      localStorage.setItem('pkd_theme', 'dark');
    } else {
      document.documentElement.classList.remove('dark');
      localStorage.setItem('pkd_theme', 'light');
    }
  }, [darkMode]);

  // Initial load
  useEffect(() => {
    reloadData();
  }, [activeDateStr]);

  // Callback to display dynamic toast banner
  const triggerToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 4000);
  };

  // Soft Delete Handler (Triggers Auto-Rebalancing inside Db layer)
  const handleSoftDelete = (empId: string, targetDate: string) => {
    const targetEmpObj = employees.find(e => e.id === empId);
    if (!targetEmpObj) return;

    // Trigger soft deletion & auto-balancing
    handleDeleteEmployee(empId, targetDate);
    reloadData();
    
    // Notify user
    triggerToast(`Pegawai "${targetEmpObj.name}" dinonaktifkan. Re-balancing seluruh future slot selesai dilakukan!`);
  };

  // Success routing callbacks
  const handleAddEmployeeSuccess = () => {
    reloadData();
    setActiveTab('jadwal');
    triggerToast('Staf baru ditambahkan! Kebutuhan slot kosong berhasil di-balancing otomatis oleh sistem.');
  };

  const handleReplaceEmployeeSuccess = () => {
    reloadData();
    setActiveTab('jadwal');
    triggerToast('Substitusi pegawai sukses! Jadwal masa depan dialihkan secara otomatis.');
  };

  return (
    <div className="min-h-screen bg-neutral-50 text-neutral-900 dark:bg-neutral-950 dark:text-neutral-100 transition-colors duration-300 flex flex-col font-sans selection:bg-neutral-900 selection:text-white dark:selection:bg-white dark:selection:text-neutral-950">
      
      {/* Toast Notification */}
      {toastMessage && (
        <div className="fixed top-20 right-6 z-50 animate-bounce">
          <div className="flex items-center gap-2 rounded-xl bg-neutral-900 border border-neutral-800 text-white px-4 py-3 shadow-xl dark:bg-white dark:text-neutral-950 dark:border-white">
            <CheckCircle2 className="h-4 w-4 text-green-500" />
            <span className="text-xs font-semibold">{toastMessage}</span>
          </div>
        </div>
      )}

      {/* RENDER COMPACT NAVBAR */}
      <Navbar
        currentTab={activeTab}
        setTab={setActiveTab}
        darkMode={darkMode}
        setDarkMode={setDarkMode}
      />

      {/* MAIN CONTAINER */}
      <main className="flex-1 mx-auto w-full max-w-7xl px-4 py-8 sm:px-6 lg:px-8 space-y-6">
        
        {/* Workspace Title & Greeting */}
        <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between mb-2">
          <div>
            <h2 className="text-2xl font-black tracking-tight text-neutral-950 dark:text-white">
              {activeTab === 'jadwal' && 'Dashboard Roster & Jadwal'}
              {activeTab === 'tambah' && 'Registrasi Pegawai Baru'}
              {activeTab === 'ganti' && 'Substitusi Roster Pegawai'}
            </h2>
            <p className="text-xs text-neutral-500 dark:text-neutral-450 mt-1 leading-none">
              Jadwal PKD Operasional • Wilayah Kerja Kantor, Pendawa, & Kenten
            </p>
          </div>

          <div className="flex items-center gap-1 text-[11px] font-mono text-neutral-500 dark:text-neutral-400 bg-neutral-100 dark:bg-neutral-900 rounded-lg px-3 py-1.5 self-start border border-neutral-200 dark:border-neutral-800 shadow-3xs">
            <ShieldCheck className="h-3.5 w-3.5 text-green-500" />
            <span>SISTEM VALIDASI PENJADWALAN AKTIF</span>
          </div>
        </div>

        {/* METRICS CARDS */}
        {stats && <DashboardCards stats={stats} />}

        {/* ACTIVE MODULE CONTAINER */}
        <div className="transition-all duration-300">
          
          {activeTab === 'jadwal' && (
            <ScheduleView
              employees={employees}
              schedules={schedules}
              onDeleteEmployee={handleSoftDelete}
              activeDateStr={activeDateStr}
              setActiveDateStr={setActiveDateStr}
            />
          )}

          {activeTab === 'tambah' && (
            <AddEmployeeView onSuccess={handleAddEmployeeSuccess} />
          )}

          {activeTab === 'ganti' && (
            <ChangeEmployeeView employees={employees} onSuccess={handleReplaceEmployeeSuccess} />
          )}

        </div>

      </main>

      {/* FOOTER */}
      <footer className="border-t border-neutral-200 bg-white/50 py-6 dark:border-neutral-850 dark:bg-neutral-950/40 mt-12 transition-colors duration-300">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-1.5 text-xs text-neutral-400">
            <Sparkles className="h-3.5 w-3.5 text-amber-500 dark:text-amber-400" />
            <span>Ditenagai oleh <strong>Smart Fair Rotation Engine</strong>. Semua hak cipta dilindungi.</span>
          </div>
          <span className="text-[10px] text-neutral-400 font-mono">
            Sistem Penjadwalan PKD • Ver 1.2.0 • Juni 2026
          </span>
        </div>
      </footer>

    </div>
  );
}
