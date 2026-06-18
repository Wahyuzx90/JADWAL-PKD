/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React from 'react';
import { Calendar, UserPlus, Users, Moon, Sun } from 'lucide-react';

interface NavbarProps {
  currentTab: 'jadwal' | 'tambah' | 'ganti';
  setTab: (tab: 'jadwal' | 'tambah' | 'ganti') => void;
  darkMode: boolean;
  setDarkMode: (dark: boolean) => void;
}

export default function Navbar({ currentTab, setTab, darkMode, setDarkMode }: NavbarProps) {
  return (
    <header className="sticky top-0 z-50 w-full border-b bg-white dark:bg-neutral-950 border-neutral-200 dark:border-neutral-850 transition-colors duration-300">
      <div className="mx-auto flex h-16 max-w-7xl items-center justify-between px-4 sm:px-6 lg:px-8">
        
        {/* Left: Brand Logo & Title - Natural Tones Style */}
        <div className="flex items-center gap-3">
          <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-indigo-600 text-white dark:bg-indigo-500 shadow-sm">
            <span className="font-sans font-extrabold text-[11px] leading-none tracking-widest pl-0.5">SPO</span>
          </div>
          <div>
            <h1 className="text-sm font-extrabold tracking-tight text-slate-800 dark:text-slate-100 leading-none italic">
              AutoSched<span className="text-indigo-600 dark:text-indigo-400">.</span>
            </h1>
            <p className="hidden sm:block text-[9px] text-slate-500 dark:text-slate-400 font-extrabold tracking-wider mt-0.5">
              SISTEM PENJADWALAN PKD
            </p>
          </div>
        </div>

        {/* Center: Mandated Navigation Items ONLY with Natural Tones visual design */}
        <nav className="flex items-center h-full space-x-6">
          <button
            id="nav-btn-jadwal"
            onClick={() => setTab('jadwal')}
            className={`flex items-center gap-1.5 text-xs font-semibold h-16 transition-all border-b-2 cursor-pointer ${
              currentTab === 'jadwal'
                ? 'text-indigo-600 border-indigo-600 dark:text-indigo-400 dark:border-indigo-400 pb-1 mt-0.5'
                : 'text-slate-500 border-transparent hover:text-slate-900 hover:border-slate-350 dark:text-slate-400 dark:hover:text-slate-50 pb-1 mt-0.5'
            }`}
          >
            <Calendar className="h-3.5 w-3.5" />
            <span>Jadwal</span>
          </button>

          <button
            id="nav-btn-tambah"
            onClick={() => setTab('tambah')}
            className={`flex items-center gap-1.5 text-xs font-semibold h-16 transition-all border-b-2 cursor-pointer ${
              currentTab === 'tambah'
                ? 'text-indigo-600 border-indigo-600 dark:text-indigo-400 dark:border-indigo-400 pb-1 mt-0.5'
                : 'text-slate-500 border-transparent hover:text-slate-900 hover:border-slate-350 dark:text-slate-400 dark:hover:text-slate-50 pb-1 mt-0.5'
            }`}
          >
            <UserPlus className="h-3.5 w-3.5" />
            <span>Tambah Pegawai</span>
          </button>

          <button
            id="nav-btn-ganti"
            onClick={() => setTab('ganti')}
            className={`flex items-center gap-1.5 text-xs font-semibold h-16 transition-all border-b-2 cursor-pointer ${
              currentTab === 'ganti'
                ? 'text-indigo-600 border-indigo-600 dark:text-indigo-400 dark:border-indigo-400 pb-1 mt-0.5'
                : 'text-slate-500 border-transparent hover:text-slate-900 hover:border-slate-350 dark:text-slate-400 dark:hover:text-slate-50 pb-1 mt-0.5'
            }`}
          >
            <Users className="h-3.5 w-3.5" />
            <span>Pergantian</span>
          </button>
        </nav>

        {/* Right: Dark Mode Toggle */}
        <div>
          <button
            id="theme-toggle"
            onClick={() => setDarkMode(!darkMode)}
            aria-label="Toggle Theme"
            className="flex h-9 w-9 items-center justify-center rounded-lg border border-neutral-200 bg-white text-neutral-700 hover:bg-neutral-50 dark:border-neutral-800 dark:bg-neutral-900 dark:text-neutral-400 dark:hover:bg-neutral-850 shadow-xs cursor-pointer transition-all"
          >
            {darkMode ? (
              <Sun className="h-4 w-4 text-neutral-100" />
            ) : (
              <Moon className="h-4 w-4 text-neutral-850" />
            )}
          </button>
        </div>

      </div>
    </header>
  );
}
