/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import { Users, AlertCircle, RefreshCw, Check, CalendarDays, Phone, UserMinus, UserPlus } from 'lucide-react';
import { Employee } from '../types';
import { handleReplaceEmployee } from '../utils/db';

interface ChangeEmployeeViewProps {
  employees: Employee[];
  onSuccess: () => void;
}

export default function ChangeEmployeeView({ employees, onSuccess }: ChangeEmployeeViewProps) {
  
  // Filter active employees list to select as old employee
  const activeEmployees = employees.filter(e => e.status === 'aktif');

  // Form states
  const [oldEmpId, setOldEmpId] = useState('');
  const [newEmpName, setNewEmpName] = useState('');
  const [newEmpPhone, setNewEmpPhone] = useState('');
  const [effectiveDate, setEffectiveDate] = useState('2026-06-18'); // Default to target date

  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg('');

    if (oldEmpId === '') {
      setErrorMsg('Silakan pilih pegawai lama yang akan digantikan.');
      return;
    }
    if (newEmpName.trim() === '') {
      setErrorMsg('Nama pegawai baru wajib diisi.');
      return;
    }
    if (newEmpPhone.trim() === '') {
      setErrorMsg('Nomor HP pegawai baru wajib diisi.');
      return;
    }
    if (effectiveDate.trim() === '') {
      setErrorMsg('Tanggal efektif pergantian wajib ditentukan.');
      return;
    }

    setLoading(true);

    try {
      // Execute the replacement logic from db.ts
      handleReplaceEmployee(oldEmpId, newEmpName.trim(), newEmpPhone.trim(), effectiveDate);

      setSuccess(true);
      setTimeout(() => {
        setSuccess(false);
        setOldEmpId('');
        setNewEmpName('');
        setNewEmpPhone('');
        onSuccess(); // Redirect to Schedule automatically on complete
      }, 1500);

    } catch (err) {
      console.error(err);
      setErrorMsg('Terjadi kesalahan saat melakukan pergantian pegawai.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="mx-auto max-w-xl">
      <div className="rounded-2xl border border-neutral-200 bg-white p-6 shadow-xs dark:border-neutral-800 dark:bg-neutral-950 transition-all duration-300">
        
        {/* Header */}
        <div className="border-b border-neutral-100 pb-5 dark:border-neutral-850">
          <div className="flex items-center gap-2">
            <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-indigo-600 text-white dark:bg-indigo-500">
              <RefreshCw className="h-4 w-4" />
            </span>
            <h2 className="text-sm font-extrabold text-neutral-950 dark:text-neutral-50 tracking-tight">
              Pergantian Pegawai (Substitusi)
            </h2>
          </div>
          <p className="text-[10px] text-neutral-500 mt-1 dark:text-neutral-400">
            Formulir pergantian (takeover) posisi kerja pegawai lama kepada pegawai baru secara instan dan aman.
          </p>
        </div>

        {/* Info box explaining safety of change */}
        <div className="mt-5 rounded-lg bg-neutral-50 p-4 border border-neutral-150 dark:bg-neutral-900/40 dark:border-neutral-800 flex gap-3">
          <AlertCircle className="h-5 w-5 text-neutral-800 dark:text-neutral-200 flex-shrink-0 mt-0.5" />
          <div className="space-y-1">
            <h4 className="text-[10.5px] font-extrabold text-neutral-900 dark:text-neutral-100">
              MEKANISME TRANSFER AMAN (ROLLOVER)
            </h4>
            <p className="text-[10px] text-neutral-500 leading-normal dark:text-neutral-450">
              Pegawai lama akan dinonaktifkan secara <em>soft-delete</em> (tetap mempertahankan catatan historis mereka), sedangkan pegawai baru akan otomatis mengambil alih seluruh struktur jadwal tugas shift dan lokasi pegawai lama setelah <strong>Tanggal Efektif</strong>.
            </p>
          </div>
        </div>

        {/* Form Body */}
        <form onSubmit={handleSubmit} className="mt-5 space-y-4">
          
          {errorMsg && (
            <div className="text-xs font-bold text-red-600 bg-red-100/30 p-3 rounded-lg border border-red-200 dark:bg-red-950/25 dark:border-red-900/50">
              {errorMsg}
            </div>
          )}

          {/* Old Employee Select Dropdown */}
          <div>
            <label htmlFor="select-old-emp" className="block text-xs font-bold text-neutral-700 dark:text-neutral-300 mb-1 flex items-center gap-1.5">
              <UserMinus className="h-3.5 w-3.5 text-neutral-500" />
              <span>Pilih Pegawai Lama</span>
            </label>
            <select
              id="select-old-emp"
              value={oldEmpId}
              onChange={(e) => setOldEmpId(e.target.value)}
              disabled={loading || success}
              className="w-full rounded-lg border border-neutral-200 bg-white px-3 py-2.5 text-xs text-neutral-900 outline-hidden focus:border-neutral-900 dark:border-neutral-800 dark:bg-neutral-950 dark:text-neutral-50 transition"
            >
              <option value="">-- Pilih Pegawai --</option>
              {activeEmployees.map(emp => (
                <option key={emp.id} value={emp.id}>
                  {emp.name} ({emp.phone})
                </option>
              ))}
            </select>
          </div>

          <div className="border-t border-dashed border-neutral-150 my-6 dark:border-neutral-850" />

          {/* New Employee Name */}
          <div>
            <label htmlFor="input-new-name" className="block text-xs font-bold text-neutral-700 dark:text-neutral-300 mb-1 flex items-center gap-1.5">
              <UserPlus className="h-3.5 w-3.5 text-neutral-500" />
              <span>Nama Pegawai Baru</span>
            </label>
            <input
              id="input-new-name"
              type="text"
              value={newEmpName}
              onChange={(e) => setNewEmpName(e.target.value)}
              placeholder="Contoh: Muhammad Rafli"
              disabled={loading || success}
              className="w-full rounded-lg border border-neutral-200 bg-white px-3 py-2.5 text-xs text-neutral-900 outline-hidden focus:border-neutral-900 dark:border-neutral-800 dark:bg-neutral-950 dark:text-neutral-50 dark:focus:border-neutral-700 transition"
            />
          </div>

          {/* New Employee Phone */}
          <div>
            <label htmlFor="input-new-phone" className="block text-xs font-bold text-neutral-700 dark:text-neutral-300 mb-1 flex items-center gap-1.5">
              <Phone className="h-3.5 w-3.5 text-neutral-500" />
              <span>Nomor HP Pegawai Baru</span>
            </label>
            <input
              id="input-new-phone"
              type="tel"
              value={newEmpPhone}
              onChange={(e) => setNewEmpPhone(e.target.value)}
              placeholder="Contoh: 0812XXXXXXXX"
              disabled={loading || success}
              className="w-full rounded-lg border border-neutral-200 bg-white px-3 py-2.5 text-xs text-neutral-900 outline-hidden focus:border-neutral-900 dark:border-neutral-800 dark:bg-neutral-950 dark:text-neutral-50 dark:focus:border-neutral-700 transition"
            />
          </div>

          {/* Effective Date */}
          <div>
            <label htmlFor="input-effective-date" className="block text-xs font-bold text-neutral-700 dark:text-neutral-300 mb-1 flex items-center gap-1.5">
              <CalendarDays className="h-3.5 w-3.5 text-neutral-500" />
              <span>Tanggal Efektif Serah Terima</span>
            </label>
            <input
              id="input-effective-date"
              type="date"
              value={effectiveDate}
              onChange={(e) => setEffectiveDate(e.target.value)}
              disabled={loading || success}
              className="w-full rounded-lg border border-neutral-200 bg-white px-3 py-2.5 text-xs text-neutral-900 outline-hidden focus:border-neutral-900 dark:border-neutral-800 dark:bg-neutral-950 dark:text-neutral-50 dark:focus:border-neutral-700 transition"
            />
          </div>

          {/* Submit */}
          <button
            id="btn-submit-ganti"
            type="submit"
            disabled={loading || success}
            className={`w-full rounded-lg py-3 text-xs font-bold text-white transition-all shadow-sm flex items-center justify-center gap-2 cursor-pointer ${
              success
                ? 'bg-emerald-600'
                : 'bg-indigo-600 hover:bg-indigo-500 active:scale-99 dark:bg-indigo-600 dark:hover:bg-indigo-500'
            }`}
          >
            {success ? (
              <>
                <Check className="h-4 w-4" />
                <span>Pengalihan Selesai & Berhasil!</span>
              </>
            ) : loading ? (
              <span>Mengalihkan Tugas...</span>
            ) : (
              <>
                <RefreshCw className="h-4 w-4" />
                <span>Lakukan Substitusi & Rollover</span>
              </>
            )}
          </button>

        </form>

      </div>
    </div>
  );
}
