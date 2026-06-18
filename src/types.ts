/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

export type ShiftType = 'Pagi' | 'Malam' | 'Cadangan' | 'Libur';
export type LocationType = 'Kantor' | 'Pendawa' | 'Kenten' | 'Cadangan' | 'Libur';

export type RoleKey = 
  | 'kantorPagi'
  | 'kantorMalam'
  | 'pendawaPagi'
  | 'pendawaMalam'
  | 'kentenMalam'
  | 'cadangan';

export interface PositionDetails {
  key: RoleKey;
  name: string;
  location: LocationType;
  shift: ShiftType;
  idealCapacity: number;
  minCapacity: number;
}

export const POSITIONS: Record<RoleKey, PositionDetails> = {
  kantorPagi: {
    key: 'kantorPagi',
    name: 'Kantor Pagi',
    location: 'Kantor',
    shift: 'Pagi',
    idealCapacity: 2,
    minCapacity: 1,
  },
  kantorMalam: {
    key: 'kantorMalam',
    name: 'Kantor Malam',
    location: 'Kantor',
    shift: 'Malam',
    idealCapacity: 2,
    minCapacity: 1,
  },
  pendawaPagi: {
    key: 'pendawaPagi',
    name: 'Pendawa Pagi',
    location: 'Pendawa',
    shift: 'Pagi',
    idealCapacity: 2,
    minCapacity: 1,
  },
  pendawaMalam: {
    key: 'pendawaMalam',
    name: 'Pendawa Malam',
    location: 'Pendawa',
    shift: 'Malam',
    idealCapacity: 2,
    minCapacity: 1,
  },
  kentenMalam: {
    key: 'kentenMalam',
    name: 'Kenten Malam',
    location: 'Kenten',
    shift: 'Malam',
    idealCapacity: 1,
    minCapacity: 1,
  },
  cadangan: {
    key: 'cadangan',
    name: 'Cadangan',
    location: 'Cadangan',
    shift: 'Cadangan',
    idealCapacity: 5,
    minCapacity: 0,
  }
};

export interface Employee {
  id: string;
  name: string;
  phone: string;
  joinedDate: string; // YYYY-MM-DD
  status: 'aktif' | 'nonaktif';
  deletedAt: string | null;
}

export interface DailySchedule {
  date: string; // YYYY-MM-DD
  kantorPagi: string[]; // Employee IDs
  kantorMalam: string[]; // Employee IDs
  pendawaPagi: string[]; // Employee IDs
  pendawaMalam: string[]; // Employee IDs
  kentenMalam: string[]; // Employee IDs
  cadangan: string[]; // Employee IDs
  libur: string[]; // Employee IDs (the rest of the active employees on this day)
}

export interface PeriodInfo {
  id: 1 | 2 | 3;
  name: string;
  rangeText: string;
  startDate: number; // Day of month 1, 11, 21
  endDate: number;   // Day of month 10, 20, or end
}

export interface ScheduleStats {
  totalActiveEmployees: number;
  totalSlots: number;
  filledSlots: number;
  emptySlots: number;
  coverageRate: number;
  currentPeriod: string;
  currentPeriodText: string;
  offTodayCount: number;
}
