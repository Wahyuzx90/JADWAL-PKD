/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { Employee, DailySchedule, ScheduleStats, POSITIONS, RoleKey } from '../types';
import { generateScheduleForMonth, getPeriodFromDay, getEmployeeHistoryStats, getConsecutiveStats, calculateFairnessScore } from './scheduler';

const EMPLOYEES_KEY = 'pkd_scheduler_employees';
const SCHEDULES_KEY = 'pkd_scheduler_schedules';

// 12 Primary Names from the images + 13 more to reach exactly 25
const DEFAULT_EMPLOYEES: Employee[] = [
  { id: 'emp_1', name: 'Gustav', phone: '081234567801', joinedDate: '2025-10-01', status: 'aktif', deletedAt: null },
  { id: 'emp_2', name: 'Ronal', phone: '081234567802', joinedDate: '2025-10-15', status: 'aktif', deletedAt: null },
  { id: 'emp_3', name: 'Edi Gunawan', phone: '081234567803', joinedDate: '2025-11-01', status: 'aktif', deletedAt: null },
  { id: 'emp_4', name: 'Heriana', phone: '081234567804', joinedDate: '2025-11-20', status: 'aktif', deletedAt: null },
  { id: 'emp_5', name: 'Fahrozi', phone: '081234567805', joinedDate: '2025-12-01', status: 'aktif', deletedAt: null },
  { id: 'emp_6', name: 'Yudi', phone: '081234567806', joinedDate: '2025-12-15', status: 'aktif', deletedAt: null },
  { id: 'emp_7', name: 'Arifki', phone: '081234567807', joinedDate: '2026-01-10', status: 'aktif', deletedAt: null },
  { id: 'emp_8', name: 'Iwan S.', phone: '081234567808', joinedDate: '2026-01-25', status: 'aktif', deletedAt: null },
  { id: 'emp_9', name: 'Erland', phone: '081234567809', joinedDate: '2026-02-01', status: 'aktif', deletedAt: null },
  { id: 'emp_10', name: 'Nurul', phone: '081234567810', joinedDate: '2026-02-15', status: 'aktif', deletedAt: null },
  { id: 'emp_11', name: 'Amaludin', phone: '081234567811', joinedDate: '2026-03-01', status: 'aktif', deletedAt: null },
  { id: 'emp_12', name: 'Habibi', phone: '081234567812', joinedDate: '2026-03-20', status: 'aktif', deletedAt: null },
  // Extra 13 to reach 25
  { id: 'emp_13', name: 'Abuy', phone: '085268280360', joinedDate: '2026-04-01', status: 'aktif', deletedAt: null },
  { id: 'emp_14', name: 'Budi Santoso', phone: '081234567814', joinedDate: '2026-04-10', status: 'aktif', deletedAt: null },
  { id: 'emp_15', name: 'Hendra Wijaya', phone: '081234567815', joinedDate: '2026-04-15', status: 'aktif', deletedAt: null },
  { id: 'emp_16', name: 'Ahmad Fahri', phone: '081234567816', joinedDate: '2025-05-01', status: 'aktif', deletedAt: null },
  { id: 'emp_17', name: 'Andi Wijaya', phone: '081234567817', joinedDate: '2025-06-01', status: 'aktif', deletedAt: null },
  { id: 'emp_18', name: 'Eko Siswanto', phone: '081234567818', joinedDate: '2025-07-15', status: 'aktif', deletedAt: null },
  { id: 'emp_19', name: 'Dewi Lestari', phone: '081234567819', joinedDate: '2025-08-01', status: 'aktif', deletedAt: null },
  { id: 'emp_20', name: 'Siti Rahma', phone: '081234567820', joinedDate: '2025-09-01', status: 'aktif', deletedAt: null },
  { id: 'emp_21', name: 'Asep Sunandar', phone: '081234567821', joinedDate: '2025-09-15', status: 'aktif', deletedAt: null },
  { id: 'emp_22', name: 'Rian Hidayat', phone: '081234567822', joinedDate: '2025-10-01', status: 'aktif', deletedAt: null },
  { id: 'emp_23', name: 'Dani Setiawan', phone: '081234567823', joinedDate: '2025-11-15', status: 'aktif', deletedAt: null },
  { id: 'emp_24', name: 'Ida Farida', phone: '081234567824', joinedDate: '2025-12-01', status: 'aktif', deletedAt: null },
  { id: 'emp_25', name: 'Sari Kartika', phone: '081234567825', joinedDate: '2026-05-01', status: 'aktif', deletedAt: null }
];

export function getEmployees(): Employee[] {
  const data = localStorage.getItem(EMPLOYEES_KEY);
  if (!data) {
    localStorage.setItem(EMPLOYEES_KEY, JSON.stringify(DEFAULT_EMPLOYEES));
    return DEFAULT_EMPLOYEES;
  }
  return JSON.parse(data);
}

export function saveEmployees(employees: Employee[]) {
  localStorage.setItem(EMPLOYEES_KEY, JSON.stringify(employees));
}

/**
 * Initializes and seeds the databases if not present.
 * It will generate June 2026, July 2026, August 2026.
 * It will punches exactly 60 vacant slots in June 2026 to start at 360 filled, 60 empty (Coverage Rate = 85.7%).
 */
export function initializeSchedulerDB(force = false): DailySchedule[] {
  const existing = localStorage.getItem(SCHEDULES_KEY);
  if (existing && !force) {
    return JSON.parse(existing);
  }

  const emps = getEmployees();
  
  // 1. Generate full schedule for June 2026 (first month)
  let juneSched = generateScheduleForMonth(emps, 2026, 5, []); // Month index 5 = June
  
  // To meet the requirement of exact coverage rate:
  // "Slot Terisi = 360, Slot Kosong = 60, Coverage Rate = 85.7%, tersebar di Periode 1, 2, 3"
  // Each day has 14 slots. Total = 420.
  // We want to punch exactly 60 holes (2 unassigned slots per day = 2 x 30 = 60).
  // Holes should NEVER violate location minimums (i.e. every location must still have at least 1 person).
  // Hence we can only punch holes in double locations (like second slot of kantorPagi, kantorMalam, pendawaPagi, pendawaMalam),
  // or inside the 5 Cadangan slots.
  
  juneSched = juneSched.map((daySched, index) => {
    // We will delete exactly 2 assignments on this day to make 2 empty slots.
    const day = index + 1;
    let pool: { key: RoleKey; empId: string }[] = [];

    // Add candidate slots to pool (excluding the absolute minimums at index 0)
    // For kantorPagi (needs at least 1, so index 1 is ok to empty)
    if (daySched.kantorPagi.length > 1) {
      pool.push({ key: 'kantorPagi', empId: daySched.kantorPagi[1] });
    }
    // For kantorMalam
    if (daySched.kantorMalam.length > 1) {
      pool.push({ key: 'kantorMalam', empId: daySched.kantorMalam[1] });
    }
    // For pendawaPagi
    if (daySched.pendawaPagi.length > 1) {
      pool.push({ key: 'pendawaPagi', empId: daySched.pendawaPagi[1] });
    }
    // For pendawaMalam
    if (daySched.pendawaMalam.length > 1) {
      pool.push({ key: 'pendawaMalam', empId: daySched.pendawaMalam[1] });
    }
    // Cadangan has up to 5, we can empty any index of it
    daySched.cadangan.forEach(id => {
      pool.push({ key: 'cadangan', empId: id });
    });

    // Pick 2 random slots to empty from pool
    const punchedKeysAndIds: { key: RoleKey; empId: string }[] = [];
    for (let p = 0; p < 2; p++) {
      if (pool.length > 0) {
        const randIdx = (day * 7 + p * 3) % pool.length; // deterministic random to lock exact seed
        const chosen = pool.splice(randIdx, 1)[0];
        punchedKeysAndIds.push(chosen);
      }
    }

    // Apply the punches
    punchedKeysAndIds.forEach(({ key, empId }) => {
      daySched[key] = daySched[key].filter(id => id !== empId);
      // Remove from work, they will remain as 'unassigned' (we don't push them to libur because those are unassigned empty slots)
    });

    return daySched;
  });

  // 2. Generate full schedule for July 2026 (Month index 6)
  const julySched = generateScheduleForMonth(emps, 2026, 6, juneSched);

  // 3. Generate full schedule for August 2026 (Month index 7)
  const augustSched = generateScheduleForMonth(emps, 2026, 7, [...juneSched, ...julySched]);

  const allSchedules = [...juneSched, ...julySched, ...augustSched];
  localStorage.setItem(SCHEDULES_KEY, JSON.stringify(allSchedules));

  return allSchedules;
}

export function getSchedules(): DailySchedule[] {
  return initializeSchedulerDB();
}

export function saveSchedules(schedules: DailySchedule[]) {
  localStorage.setItem(SCHEDULES_KEY, JSON.stringify(schedules));
}

/**
 * Calculates real-time system stats.
 */
export function getScheduleStats(activeDateStr: string = '2026-06-18'): ScheduleStats {
  const employees = getEmployees();
  const activeEmployees = employees.filter(e => e.status === 'aktif');
  const schedules = getSchedules();

  // Highlight June 2026 stats specifically
  const juneSchedules = schedules.filter(s => s.date.startsWith('2026-06'));

  let totalSlots = juneSchedules.length * 14; // 14 slots/day * 30 days = 420
  let filledSlots = 0;

  juneSchedules.forEach(s => {
    filledSlots += (s.kantorPagi?.length || 0) +
                   (s.kantorMalam?.length || 0) +
                   (s.pendawaPagi?.length || 0) +
                   (s.pendawaMalam?.length || 0) +
                   (s.kentenMalam?.length || 0) +
                   (s.cadangan?.length || 0);
  });

  const emptySlots = totalSlots - filledSlots;
  const coverageRate = totalSlots > 0 ? (filledSlots / totalSlots) * 100 : 0;

  // Active period calculation for today's date
  const parseActiveDate = new Date(activeDateStr);
  const currentDay = parseActiveDate.getDate();
  const currentPeriodNum = getPeriodFromDay(currentDay);
  
  let currentPeriodText = '';
  if (currentPeriodNum === 1) {
    currentPeriodText = `1 - 10 Juni 2026`;
  } else if (currentPeriodNum === 2) {
    currentPeriodText = `11 - 20 Juni 2026`;
  } else {
    currentPeriodText = `21 - 30 Juni 2026`;
  }

  // Count employees off today
  const todaySchedule = schedules.find(s => s.date === activeDateStr);
  const offTodayCount = todaySchedule ? (todaySchedule.libur?.length || 0) : 0;

  return {
    totalActiveEmployees: activeEmployees.length,
    totalSlots,
    filledSlots,
    emptySlots,
    coverageRate: parseFloat(coverageRate.toFixed(1)),
    currentPeriod: `Periode ${currentPeriodNum}`,
    currentPeriodText,
    offTodayCount
  };
}

/**
 * LOGIKA TAMBAH PEGAWAI:
 * 1. Hitung slot kosong.
 * 2. Cari kebutuhan tertinggi.
 * 3. Cari posisi yang kekurangan personel.
 * 4. Tempatkan otomatis.
 * 5. Kurangi slot kosong.
 * 6. Perbarui jadwal.
 * 7. Perbarui fairness score.
 */
export function handleAddEmployee(newEmployee: Omit<Employee, 'id' | 'status' | 'deletedAt'>) {
  const employees = getEmployees();
  const newId = `emp_${Date.now()}`;
  const freshEmployee: Employee = {
    ...newEmployee,
    id: newId,
    status: 'aktif',
    deletedAt: null
  };

  const updatedEmployees = [...employees, freshEmployee];
  saveEmployees(updatedEmployees);

  // Auto-placement into June 2026 empty slots (from their joinedDate onwards)
  let schedules = getSchedules();
  
  // We scan daily schedules starting from their joinedDate onwards.
  // We want to fill empty slots while respecting constraints!
  schedules = schedules.map((daySched) => {
    if (daySched.date < freshEmployee.joinedDate) return daySched; // Joined after

    // Is this employee already assigned on this day?
    const keysToCheck: RoleKey[] = ['kantorPagi', 'kantorMalam', 'pendawaPagi', 'pendawaMalam', 'kentenMalam', 'cadangan'];
    const alreadyAssigned = keysToCheck.some(k => daySched[k].includes(newId)) || daySched.libur.includes(newId);
    if (alreadyAssigned) return daySched;

    // Check which roles have empty slots (meaning size < idealCapacity)
    const emptyRoles: RoleKey[] = [];
    keysToCheck.forEach(key => {
      const pos = POSITIONS[key];
      if (daySched[key].length < pos.idealCapacity) {
        emptyRoles.push(key);
      }
    });

    if (emptyRoles.length === 0) {
      // No empty slots on this day, so mark employee as libur
      if (!daySched.libur.includes(newId)) {
        daySched.libur.push(newId);
      }
      return daySched;
    }

    // Prioritize active guarding roles first over Cadangan
    const locOrder: RoleKey[] = ['kantorPagi', 'kantorMalam', 'pendawaPagi', 'pendawaMalam', 'kentenMalam', 'cadangan'];
    const chosenRole = locOrder.find(k => emptyRoles.includes(k));

    if (chosenRole) {
      // Check consecutive limits
      const c = getConsecutiveStats(schedules, newId, daySched.date);
      const pos = POSITIONS[chosenRole];
      const sameLocStreak = c.consecutiveLocation === pos.location && c.consecutiveLocationBlocks >= 2;
      const sameShiftStreak = c.consecutiveShift === pos.shift && c.consecutiveShiftBlocks >= 2;

      // Fill slot if constraints are satisfy OR if we have to (relaxing is fine to keep occupied)
      if (!sameLocStreak && !sameShiftStreak) {
        daySched[chosenRole].push(newId);
        // Ensure they aren't also libur
        daySched.libur = daySched.libur.filter(id => id !== newId);
      } else {
        // If constrained, either try other empty role or default to Cadangan/Libur
        const backUpRole = locOrder.find(k => emptyRoles.includes(k) && k !== chosenRole);
        if (backUpRole) {
          daySched[backUpRole].push(newId);
          daySched.libur = daySched.libur.filter(id => id !== newId);
        } else {
          daySched.libur.push(newId);
        }
      }
    }

    return daySched;
  });

  // Re-run validate & regeneration for all future months (July, August) to maintain perfect fairness
  // Since we added an employee, future months should take them into account
  const juneLastDate = '2026-06-30';
  const beforeJune = schedules.filter(s => s.date <= juneLastDate);

  // Regenerate July and August using updated employee database
  const julySched = generateScheduleForMonth(updatedEmployees, 2026, 6, beforeJune);
  const augustSched = generateScheduleForMonth(updatedEmployees, 2026, 7, [...beforeJune, ...julySched]);

  const fullyBalancedSchedules = [...beforeJune, ...julySched, ...augustSched];
  saveSchedules(fullyBalancedSchedules);
}

/**
 * LOGIKA HAPUS PEGAWAI (SOFT DELETE):
 * 1. Status menjadi nonaktif.
 * 2. Jadwal masa depan dibatalkan (from today or deletion date).
 * 3. Slot menjadi kosong.
 * 4. Slot kosong bertambah.
 * 5. Coverage Rate diperbarui.
 * 6. Statistik diperbarui otomatis.
 * 7. Auto Rebalancing dijalankan.
 */
export function handleDeleteEmployee(empId: string, effectiveDateStr: string = '2026-06-18') {
  const employees = getEmployees();
  const updatedEmployees = employees.map(emp => {
    if (emp.id === empId) {
      return { ...emp, status: 'nonaktif' as const, deletedAt: effectiveDateStr };
    }
    return emp;
  });
  saveEmployees(updatedEmployees);

  let schedules = getSchedules();

  // Auto Rebalancing for soft delete:
  // - Cancel all schedules of this employee from effectiveDateStr onwards.
  // - Try to fill the newly vacant positions with other active employees who are currently on 'Libur' or 'Cadangan' that day,
  //   respecting consecutive blocks and maintaining valid schedules.
  schedules = schedules.map(daySched => {
    if (daySched.date < effectiveDateStr) return daySched; // Past schedules are preserved (historical)

    // Check all roles and remove the soft-deleted employee
    const activeRoles: RoleKey[] = ['kantorPagi', 'kantorMalam', 'pendawaPagi', 'pendawaMalam', 'kentenMalam', 'cadangan'];
    let modified = false;
    let vacatedRole: RoleKey | null = null;

    activeRoles.forEach(roleKey => {
      if (daySched[roleKey].includes(empId)) {
        daySched[roleKey] = daySched[roleKey].filter(id => id !== empId);
        vacatedRole = roleKey;
        modified = true;
      }
    });

    // Also remove from libur
    if (daySched.libur.includes(empId)) {
      daySched.libur = daySched.libur.filter(id => id !== id);
    }

    // Auto Rebalancing: If we just vacated an active role, let's try to find an active worker to fill it!
    if (modified && vacatedRole) {
      const activeStaff = updatedEmployees.filter(e => e.status === 'aktif');
      // Look at who is currently assigned to 'libur' or 'cadangan' on this day and is available
      const candidates = activeStaff.filter(emp => {
        // Must be currently scheduled as libur or cadangan on this day
        const isLibur = daySched.libur.includes(emp.id);
        const isCadangan = daySched.cadangan.includes(emp.id);
        return isLibur || isCadangan;
      });

      // Filter by consecutive blocks
      let eligible = candidates.filter(emp => {
        const c = getConsecutiveStats(schedules, emp.id, daySched.date);
        const pos = POSITIONS[vacatedRole!];
        const sameShiftStreak = c.consecutiveShift === pos.shift && c.consecutiveShiftBlocks >= 2;
        const sameLocStreak = c.consecutiveLocation === pos.location && c.consecutiveLocationBlocks >= 2;
        return !sameShiftStreak && !sameLocStreak;
      });

      if (eligible.length === 0) {
        eligible = candidates; // relax
      }

      if (eligible.length > 0) {
        // Choose one with high fairness score
        const statsObj = getEmployeeHistoryStats(schedules, activeStaff, daySched.date);
        const scored = eligible.map(emp => {
          const fs = calculateFairnessScore(emp, vacatedRole!, statsObj.totalDaysCalculated, statsObj.stats);
          return { emp, score: fs };
        });
        scored.sort((a, b) => b.score - a.score);
        const chosen = scored[0].emp;

        // Perform trade
        // If they were in cadangan, remove them from there
        if (daySched.cadangan.includes(chosen.id)) {
          daySched.cadangan = daySched.cadangan.filter(id => id !== chosen.id);
        }
        // If they were libur, remove them
        if (daySched.libur.includes(chosen.id)) {
          daySched.libur = daySched.libur.filter(id => id !== chosen.id);
        }

        // Add to vacated role
        daySched[vacatedRole].push(chosen.id);
      }
    }

    return daySched;
  });

  // Re-run schedule balancing for future months using active employees ONLY
  // This will completely avoid scheduling the deleted employee in July/August
  const juneLastDate = '2026-06-30';
  const beforeJune = schedules.filter(s => s.date <= juneLastDate);

  const activeStaff = updatedEmployees.filter(e => e.status === 'aktif');
  const julySched = generateScheduleForMonth(activeStaff, 2026, 6, beforeJune);
  const augustSched = generateScheduleForMonth(activeStaff, 2026, 7, [...beforeJune, ...julySched]);

  const fullyBalanced = [...beforeJune, ...julySched, ...augustSched];
  saveSchedules(fullyBalanced);
}

/**
 * LOGIKA PERGANTIAN PEGAWAI:
 * 1. Pegawai lama nonaktif
 * 2. Pegawai baru aktif
 * 3. Jadwal setelah tanggal efektif dialihkan otomatis
 * 4. Struktur jadwal dipertahankan
 */
export function handleReplaceEmployee(
  oldEmpId: string,
  newEmpName: string,
  newEmpPhone: string,
  effectiveDateStr: string
) {
  // 1. Deactivate old employee effective from effectiveDateStr
  const employees = getEmployees();
  const oldEmp = employees.find(e => e.id === oldEmpId);
  const oldJoin = oldEmp?.joinedDate || '2025-01-01';

  // 2. Add new employee as active
  const newEmpId = `emp_${Date.now()}`;
  const newEmp: Employee = {
    id: newEmpId,
    name: newEmpName,
    phone: newEmpPhone,
    joinedDate: effectiveDateStr,
    status: 'aktif',
    deletedAt: null
  };

  const updatedEmployees = employees.map(emp => {
    if (emp.id === oldEmpId) {
      return { ...emp, status: 'nonaktif' as const, deletedAt: effectiveDateStr };
    }
    return emp;
  });
  updatedEmployees.push(newEmp);
  saveEmployees(updatedEmployees);

  // 3. Re-assign slots: Transfer all schedule items after effectiveDateStr from old to new
  let schedules = getSchedules();
  schedules = schedules.map(daySched => {
    if (daySched.date < effectiveDateStr) return daySched; // maintain past history

    // Substitutes old employee id in active positions
    const keys: RoleKey[] = ['kantorPagi', 'kantorMalam', 'pendawaPagi', 'pendawaMalam', 'kentenMalam', 'cadangan'];
    keys.forEach(k => {
      daySched[k] = daySched[k].map(id => id === oldEmpId ? newEmpId : id);
    });

    // Substitute in libur
    daySched.libur = daySched.libur.map(id => id === oldEmpId ? newEmpId : id);

    return daySched;
  });

  saveSchedules(schedules);
}
