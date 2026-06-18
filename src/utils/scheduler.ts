/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { Employee, DailySchedule, POSITIONS, RoleKey, LocationType, ShiftType } from '../types';

// Utility to parse dates
export function parseDate(dateStr: string): Date {
  return new Date(dateStr);
}

export function formatDate(date: Date): string {
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, '0');
  const d = String(date.getDate()).padStart(2, '0');
  return `${y}-${m}-${d}`;
}

export function getDaysInMonth(year: number, monthIndex: number): number {
  return new Date(year, monthIndex + 1, 0).getDate();
}

/**
 * Returns Active Period based on date.
 * Periode 1: Day 1 - 10
 * Periode 2: Day 11 - 20
 * Periode 3: Day 21 - End
 */
export function getPeriodFromDay(day: number): 1 | 2 | 3 {
  if (day <= 10) return 1;
  if (day <= 20) return 2;
  return 3;
}

// Indonesian month names mapping
export const INDO_MONTHS = [
  'Januari', 'Februari', 'Maret', 'April', 'Mei', 'Juni',
  'Juli', 'Agustus', 'September', 'Oktober', 'November', 'Desember'
];

/**
 * Computes historical assignment stats for all employees prior to a specific date.
 */
export function getEmployeeHistoryStats(
  schedules: DailySchedule[],
  employees: Employee[],
  beforeDateStr: string
) {
  const stats: Record<string, {
    workDays: number;
    liburDays: number;
    locationCounts: Record<LocationType, number>;
    shiftCounts: Record<ShiftType, number>;
    lastSeenLocationDay: Record<LocationType, number>; // index of day offset
    lastSeenShiftDay: Record<ShiftType, number>;
  }> = {};

  // Initialize stats
  employees.forEach(emp => {
    stats[emp.id] = {
      workDays: 0,
      liburDays: 0,
      locationCounts: { Kantor: 0, Pendawa: 0, Kenten: 0, Cadangan: 0, Libur: 0 },
      shiftCounts: { Pagi: 0, Malam: 0, Cadangan: 0, Libur: 0 },
      lastSeenLocationDay: { Kantor: -999, Pendawa: -999, Kenten: -999, Cadangan: -999, Libur: -999 },
      lastSeenShiftDay: { Pagi: -999, Malam: -999, Cadangan: -999, Libur: -999 }
    };
  });

  // Sort schedules by date to compute time elapsed
  const sortedSchedules = [...schedules]
    .filter(s => s.date < beforeDateStr)
    .sort((a, b) => a.date.localeCompare(b.date));

  sortedSchedules.forEach((sched, dayIndex) => {
    // Check assignments
    const activeRoles: { key: RoleKey; loc: LocationType; shift: ShiftType }[] = [
      { key: 'kantorPagi', loc: 'Kantor', shift: 'Pagi' },
      { key: 'kantorMalam', loc: 'Kantor', shift: 'Malam' },
      { key: 'pendawaPagi', loc: 'Pendawa', shift: 'Pagi' },
      { key: 'pendawaMalam', loc: 'Pendawa', shift: 'Malam' },
      { key: 'kentenMalam', loc: 'Kenten', shift: 'Malam' },
      { key: 'cadangan', loc: 'Cadangan', shift: 'Cadangan' }
    ];

    activeRoles.forEach(({ key, loc, shift }) => {
      const assignedIds = sched[key] || [];
      assignedIds.forEach(id => {
        if (!stats[id]) return;
        stats[id].workDays += 1;
        stats[id].locationCounts[loc] += 1;
        stats[id].shiftCounts[shift] += 1;
        stats[id].lastSeenLocationDay[loc] = dayIndex;
        stats[id].lastSeenShiftDay[shift] = dayIndex;
      });
    });

    // Libur assignments
    const liburIds = sched.libur || [];
    liburIds.forEach(id => {
      if (!stats[id]) return;
      stats[id].liburDays += 1;
      stats[id].locationCounts['Libur'] += 1;
      stats[id].shiftCounts['Libur'] += 1;
      stats[id].lastSeenLocationDay['Libur'] = dayIndex;
      stats[id].lastSeenShiftDay['Libur'] = dayIndex;
    });
  });

  return { stats, totalDaysCalculated: sortedSchedules.length };
}

/**
 * Computes consecutive parameters for an employee across the previous few schedules to enforce consecutive block limits.
 * We want to see how many days/blocks in a row (immediately preceding beforeDateStr) other than days they were Libur.
 */
export function getConsecutiveStats(
  schedules: DailySchedule[],
  employeeId: string,
  beforeDateStr: string,
  maxCheckBlocks = 2
) {
  const sortedPast = [...schedules]
    .filter(s => s.date < beforeDateStr)
    .sort((a, b) => b.date.localeCompare(a.date)); // descending, closest first

  let consecutiveShift: ShiftType | null = null;
  let consecutiveShiftBlocks = 0;
  let consecutiveLocation: LocationType | null = null;
  let consecutiveLocationBlocks = 0;

  // Since we group in 2-day blocks, let's group past days into blocks of 2.
  // DailySchedule array sorted descending
  const pastBlocks: { location: LocationType; shift: ShiftType }[] = [];
  for (let i = 0; i < sortedPast.length; i += 2) {
    const s1 = sortedPast[i];
    const s2 = sortedPast[i+1] || s1;

    // Find where the employee was in both days
    let foundLoc: LocationType | null = null;
    let foundShift: ShiftType | null = null;

    const activeRoles: { key: RoleKey; loc: LocationType; shift: ShiftType }[] = [
      { key: 'kantorPagi', loc: 'Kantor', shift: 'Pagi' },
      { key: 'kantorMalam', loc: 'Kantor', shift: 'Malam' },
      { key: 'pendawaPagi', loc: 'Pendawa', shift: 'Pagi' },
      { key: 'pendawaMalam', loc: 'Pendawa', shift: 'Malam' },
      { key: 'kentenMalam', loc: 'Kenten', shift: 'Malam' },
      { key: 'cadangan', loc: 'Cadangan', shift: 'Cadangan' }
    ];

    for (const { key, loc, shift } of activeRoles) {
      if (s1[key]?.includes(employeeId) || s2[key]?.includes(employeeId)) {
        foundLoc = loc;
        foundShift = shift;
        break;
      }
    }

    if (!foundLoc && (s1.libur?.includes(employeeId) || s2.libur?.includes(employeeId))) {
      foundLoc = 'Libur';
      foundShift = 'Libur';
    }

    if (foundLoc && foundShift) {
      pastBlocks.push({ location: foundLoc, shift: foundShift });
    } else {
      break;
    }
  }

  // Count consecutive blocks
  if (pastBlocks.length > 0) {
    consecutiveLocation = pastBlocks[0].location;
    consecutiveShift = pastBlocks[0].shift;

    for (const b of pastBlocks) {
      if (b.location === consecutiveLocation && consecutiveLocation !== 'Libur' && consecutiveLocation !== 'Cadangan') {
        consecutiveLocationBlocks++;
      } else {
        break;
      }
    }

    for (const b of pastBlocks) {
      if (b.shift === consecutiveShift && consecutiveShift !== 'Libur' && consecutiveShift !== 'Cadangan') {
        consecutiveShiftBlocks++;
      } else {
        break;
      }
    }
  }

  return {
    consecutiveLocation,
    consecutiveLocationBlocks,
    consecutiveShift,
    consecutiveShiftBlocks
  };
}

/**
 * Smart Fair Rotation Engine scoring algorithm for a candidate.
 */
export function calculateFairnessScore(
  emp: Employee,
  roleKey: RoleKey,
  dayIndex: number,
  historyStats: ReturnType<typeof getEmployeeHistoryStats>['stats']
): number {
  const empStats = historyStats[emp.id];
  if (!empStats) return 0;

  const pos = POSITIONS[roleKey];
  let score = 0;

  // Priority 3 & 4: Employee who hasn't been assigned to location/shift for the longest time
  const daysSinceLocation = dayIndex - empStats.lastSeenLocationDay[pos.location];
  const daysSinceShift = dayIndex - empStats.lastSeenShiftDay[pos.shift];

  // Cap at 30 days to keep calculation balanced
  score += Math.min(daysSinceLocation, 30) * 4.0;
  score += Math.min(daysSinceShift, 30) * 4.0;

  // Priority 5: Employees with too many Libur days get higher priority to work
  const totalDays = empStats.workDays + empStats.liburDays;
  const liburRatio = totalDays > 0 ? empStats.liburDays / totalDays : 0.8; // default to favor them if new
  score += liburRatio * 150.0;

  // Priority 8: Equalize total work days (prefer those who have lower total work days)
  score -= empStats.workDays * 8.0;

  // Priority 6 & 7: Heavily penalize if they have spent too much time in the same location/shift overall
  score -= (empStats.locationCounts[pos.location] || 0) * 6.0;
  score -= (empStats.shiftCounts[pos.shift] || 0) * 6.0;

  return score;
}

/**
 * Core function to generate schedule for a given year and month.
 * It will append or create 2-day rotation blocks.
 */
export function generateScheduleForMonth(
  employees: Employee[],
  year: number,
  monthIndex: number, // 0-11
  existingSchedules: DailySchedule[]
): DailySchedule[] {
  const activeEmployees = employees.filter(e => e.status === 'aktif');
  if (activeEmployees.length === 0) return [];

  const daysInMonth = getDaysInMonth(year, monthIndex);
  const newSchedules: DailySchedule[] = [];

  // Group days of the month into 2-day blocks: [1, 2], [3, 4], etc.
  const blocks: number[][] = [];
  for (let i = 1; i <= daysInMonth; i += 2) {
    if (i === daysInMonth) {
      blocks.push([i]); // single day at the end of month if odd number of days (like Month with 31 days)
    } else {
      blocks.push([i, i + 1]);
    }
  }

  // Work with a local copy of all schedules to compute history dynamically block by block
  const cumulativeSchedulesString = JSON.stringify(existingSchedules);
  const allSchedulesCopy: DailySchedule[] = JSON.parse(cumulativeSchedulesString);

  // We will schedule block-by-block
  blocks.forEach((blockDays) => {
    const firstDay = blockDays[0];
    const dateStrFirst = `${year}-${String(monthIndex + 1).padStart(2, '0')}-${String(firstDay).padStart(2, '0')}`;

    // Compute stats prior to this block
    const historyStats = getEmployeeHistoryStats(allSchedulesCopy, activeEmployees, dateStrFirst);
    const dayIndexOffset = historyStats.totalDaysCalculated;

    // Check consecutive statistics to enforce hard constraints
    const consecutiveLimits: Record<string, ReturnType<typeof getConsecutiveStats>> = {};
    activeEmployees.forEach(emp => {
      consecutiveLimits[emp.id] = getConsecutiveStats(allSchedulesCopy, emp.id, dateStrFirst);
    });

    const assignedIdsInBlock = new Set<string>();

    // Initial structure for both days in the block
    const blockSchedules = blockDays.map(day => {
      return {
        date: `${year}-${String(monthIndex + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`,
        kantorPagi: [],
        kantorMalam: [],
        pendawaPagi: [],
        pendawaMalam: [],
        kentenMalam: [],
        cadangan: [],
        libur: []
      } as DailySchedule;
    });

    // Positions queue for scheduling
    // Phase 1: Minimum requirements of 1 for active positions (First priority is keeping locations filled)
    const minKeys: RoleKey[] = ['kantorPagi', 'kantorMalam', 'pendawaPagi', 'pendawaMalam', 'kentenMalam'];

    minKeys.forEach(roleKey => {
      const pos = POSITIONS[roleKey];
      // Find candidate
      let candidates = activeEmployees.filter(emp => !assignedIdsInBlock.has(emp.id));
      if (candidates.length === 0) return;

      // Filter candidates that meet the hard consecutive constraints
      let filtered = candidates.filter(emp => {
        const c = consecutiveLimits[emp.id];
        const sameShiftStreak = c.consecutiveShift === pos.shift && c.consecutiveShiftBlocks >= 2;
        const sameLocStreak = c.consecutiveLocation === pos.location && c.consecutiveLocationBlocks >= 2;
        return !sameShiftStreak && !sameLocStreak;
      });

      // Relax constraints if no candidates satisfy them (Priority 1 override)
      if (filtered.length === 0) {
        filtered = candidates;
      }

      // Score them
      const scoredCandidates = filtered.map(emp => {
        const fairness = calculateFairnessScore(emp, roleKey, dayIndexOffset, historyStats.stats);
        // Add 20% randomness as tie-breaker
        const rand = Math.random() * 0.1;
        return { emp, score: fairness + rand };
      });

      // Sort by score desc
      scoredCandidates.sort((a, b) => b.score - a.score);

      const chosen = scoredCandidates[0]?.emp;
      if (chosen) {
        assignedIdsInBlock.add(chosen.id);
        blockSchedules.forEach(sched => {
          sched[roleKey].push(chosen.id);
        });
      }
    });

    // Phase 2: Fill rest of target locations to support Ideal Capacity (2,2,2,2,1, 5)
    // We already filled 1 of: kantorPagi, kantorMalam, pendawaPagi, pendawaMalam, kentenMalam.
    // Let's create a queue of remaining slots needed:
    interface SlotDemand {
      roleKey: RoleKey;
    }

    const remainingDemands: SlotDemand[] = [];
    // kantorPagi (needs +1 to make 2)
    remainingDemands.push({ roleKey: 'kantorPagi' });
    // kantorMalam (needs +1 to make 2)
    remainingDemands.push({ roleKey: 'kantorMalam' });
    // pendawaPagi (needs +1 to make 2)
    remainingDemands.push({ roleKey: 'pendawaPagi' });
    // pendawaMalam (needs +1 to make 2)
    remainingDemands.push({ roleKey: 'pendawaMalam' });
    
    // Cadangan (needs 5 slots)
    for (let i = 0; i < 5; i++) {
      remainingDemands.push({ roleKey: 'cadangan' });
    }

    // Now fill remaining slots
    remainingDemands.forEach(({ roleKey }) => {
      const pos = POSITIONS[roleKey];
      let candidates = activeEmployees.filter(emp => !assignedIdsInBlock.has(emp.id));
      if (candidates.length === 0) return;

      // Filter by hard constraints
      let filtered = candidates.filter(emp => {
        const c = consecutiveLimits[emp.id];
        const sameShiftStreak = c.consecutiveShift === pos.shift && c.consecutiveShiftBlocks >= 2;
        const sameLocStreak = c.consecutiveLocation === pos.location && c.consecutiveLocationBlocks >= 2;
        return !sameShiftStreak && !sameLocStreak;
      });

      if (filtered.length === 0) {
        filtered = candidates; // relax
      }

      const scoredCandidates = filtered.map(emp => {
        const fairness = calculateFairnessScore(emp, roleKey, dayIndexOffset, historyStats.stats);
        const rand = Math.random() * 0.1;
        return { emp, score: fairness + rand };
      });

      scoredCandidates.sort((a, b) => b.score - a.score);

      const chosen = scoredCandidates[0]?.emp;
      if (chosen) {
        assignedIdsInBlock.add(chosen.id);
        blockSchedules.forEach(sched => {
          sched[roleKey].push(chosen.id);
        });
      }
    });

    // Phase 3: Put all still-unassigned employees to 'libur' for this block
    const leftOverEmps = activeEmployees.filter(emp => !assignedIdsInBlock.has(emp.id));
    leftOverEmps.forEach(emp => {
      blockSchedules.forEach(sched => {
        sched.libur.push(emp.id);
      });
    });

    // Add scheduled days to allSchedulesCopy & newSchedules
    blockSchedules.forEach(sched => {
      allSchedulesCopy.push(sched);
      newSchedules.push(sched);
    });
  });

  return newSchedules;
}

/**
 * Validates a generated schedule block to ensure all constraints are perfectly met.
 * ✓ Tidak ada lokasi kosong
 * ✓ Semua lokasi memiliki minimal satu petugas (Pagi/Malam)
 * ✓ Tidak ada pegawai ganda (Satu pegawai hanya satu tugas per hari)
 * ✓ Tidak ada bentrok shift/lokasi
 */
export function validateSchedule(
  schedules: DailySchedule[],
  employees: Employee[]
): { isValid: boolean; errors: string[] } {
  const errors: string[] = [];
  const activeEmpIds = new Set(employees.filter(e => e.status === 'aktif').map(e => e.id));

  schedules.forEach(s => {
    const assignedToday = new Map<string, string>(); // empId -> position
    const keysToCheck: RoleKey[] = [
      'kantorPagi',
      'kantorMalam',
      'pendawaPagi',
      'pendawaMalam',
      'kentenMalam',
      'cadangan'
    ];

    // 1. Check locations are not empty (min 1 officer)
    if (s.kantorPagi.length === 0) errors.push(`[${s.date}] Kantor Pagi kosong.`);
    if (s.kantorMalam.length === 0) errors.push(`[${s.date}] Kantor Malam kosong.`);
    if (s.pendawaPagi.length === 0) errors.push(`[${s.date}] Pendawa Pagi kosong.`);
    if (s.pendawaMalam.length === 0) errors.push(`[${s.date}] Pendawa Malam kosong.`);
    if (s.kentenMalam.length === 0) errors.push(`[${s.date}] Kenten Malam kosong.`);

    // 2. Check duplicates and dual assignment
    keysToCheck.forEach(key => {
      const ids = s[key] || [];
      ids.forEach(id => {
        if (!activeEmpIds.has(id)) {
          // It's okay if they are in historical schedule, but should not be double assigned
        }
        if (assignedToday.has(id)) {
          errors.push(`[${s.date}] Pegawai dengan ID ${id} ditugaskan ganda pada ${assignedToday.get(id)} dan ${key}.`);
        } else {
          assignedToday.set(id, key);
        }
      });
    });

    // Check libur overlap
    const liburIds = s.libur || [];
    liburIds.forEach(id => {
      if (assignedToday.has(id)) {
        errors.push(`[${s.date}] Pegawai dengan ID ${id} ditugaskan kerja DAN libur.`);
      } else {
        assignedToday.set(id, 'libur');
      }
    });
  });

  return {
    isValid: errors.length === 0,
    errors
  };
}
