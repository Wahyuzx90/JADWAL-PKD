/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React from 'react';
import { Users, CheckCircle, AlertTriangle, Activity, CalendarDays, Coffee } from 'lucide-react';
import { ScheduleStats } from '../types';

interface DashboardCardsProps {
  stats: ScheduleStats;
}

export default function DashboardCards({ stats }: DashboardCardsProps) {
  const cards = [
    {
      id: 'stat-active-employees',
      title: 'Pegawai Aktif',
      value: `${stats.totalActiveEmployees}`,
      sub: 'Status Aktif Roster',
      icon: Users,
      color: 'text-indigo-600 bg-indigo-50 dark:text-indigo-400 dark:bg-indigo-950/40',
      borderStyle: 'border-neutral-200 dark:border-neutral-800'
    },
    {
      id: 'stat-filled-slots',
      title: 'Slot Terisi',
      value: `${stats.filledSlots}`,
      sub: `dari ${stats.totalSlots} total slot`,
      icon: CheckCircle,
      color: 'text-emerald-600 bg-emerald-50 dark:text-emerald-400 dark:bg-emerald-950/40',
      borderStyle: 'border-neutral-200 dark:border-neutral-800'
    },
    {
      id: 'stat-empty-slots',
      title: 'Slot Kosong',
      value: `${stats.emptySlots}`,
      sub: 'Butuh Auto-balancing',
      icon: AlertTriangle,
      color: 'text-rose-600 bg-rose-50 dark:text-rose-400 dark:bg-rose-950/40',
      borderStyle: 'border-neutral-200 border-l-4 border-l-rose-500 dark:border-neutral-800'
    },
    {
      id: 'stat-coverage-rate',
      title: 'Coverage Rate',
      value: `${stats.coverageRate}%`,
      sub: 'Penugasan Terpenuhi',
      icon: Activity,
      color: 'text-amber-600 bg-amber-50 dark:text-amber-400 dark:bg-amber-950/40',
      borderStyle: 'border-neutral-200 dark:border-neutral-800',
      progress: stats.coverageRate
    },
    {
      id: 'stat-active-period',
      title: 'Periode Aktif',
      value: stats.currentPeriod,
      sub: stats.currentPeriodText,
      icon: CalendarDays,
      color: 'text-white bg-indigo-500 dark:text-indigo-200 dark:bg-indigo-900',
      borderStyle: 'bg-indigo-600 dark:bg-indigo-950 border-indigo-700 dark:border-indigo-900 text-white shadow-xs'
    },
    {
      id: 'stat-off-today',
      title: 'Libur Hari Ini',
      value: `${stats.offTodayCount}`,
      sub: 'Penerima Giliran Libur',
      icon: Coffee,
      color: 'text-purple-600 bg-purple-50 dark:text-purple-400 dark:bg-purple-950/40',
      borderStyle: 'border-neutral-200 dark:border-neutral-800'
    }
  ];

  return (
    <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 mb-8">
      {cards.map((card) => {
        const Icon = card.icon;
        const isPeriodCard = card.id === 'stat-active-period';
        return (
          <div
            key={card.id}
            id={card.id}
            className={`relative overflow-hidden rounded-xl p-4 shadow-xs transition-all duration-300 hover:-translate-y-0.5 hover:shadow-xs group ${
              isPeriodCard
                ? 'bg-indigo-600 text-white border border-indigo-700 dark:bg-indigo-950 dark:border-indigo-900'
                : 'bg-white border border-neutral-200 dark:border-neutral-850 dark:bg-neutral-950'
            } ${card.borderStyle}`}
          >
            <div className="flex items-center justify-between space-x-3">
              <span className={`text-[9px] uppercase font-extrabold tracking-wider ${
                isPeriodCard ? 'text-indigo-100 dark:text-indigo-300' : 'text-neutral-400 dark:text-neutral-500'
              }`}>
                {card.title}
              </span>
              <div className={`p-1.5 rounded-lg transition-all duration-300 group-hover:scale-105 ${card.color}`}>
                <Icon className="h-3.5 w-3.5" />
              </div>
            </div>

            <div className="mt-2.5 flex items-baseline justify-between">
              <div>
                <span className={`text-2xl font-extrabold tracking-tight ${
                  isPeriodCard ? 'text-white' : 'text-slate-800 dark:text-neutral-50'
                }`}>
                  {card.value}
                </span>
                <span className={`block text-[10px] mt-0.5 font-medium leading-none ${
                  isPeriodCard ? 'text-indigo-100/90' : 'text-neutral-500 dark:text-neutral-400'
                }`}>
                  {card.sub}
                </span>
              </div>
            </div>

            {/* Custom Progress Bar for Coverage Rate */}
            {card.progress !== undefined && (
              <div className="mt-3.5 w-full bg-neutral-100 dark:bg-neutral-850 rounded-full h-1.5 overflow-hidden">
                <div
                  className="bg-indigo-600 dark:bg-indigo-400 h-1.5 rounded-full transition-all duration-1000 ease-out"
                  style={{ width: `${Math.min(card.progress, 100)}%` }}
                />
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
}
