/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import { UserPlus, Sparkles, Check, Phone, CalendarDays, Lock } from 'lucide-react';
import { handleAddEmployee } from '../utils/db';

interface AddEmployeeViewProps {
  onSuccess: () => void;
}

export default function AddEmployeeView({ onSuccess }: AddEmployeeViewProps) {
  // States
  const [name, setName] = useState('');
  const [phone, setPhone] = useState('');
  const [joinedDate, setJoinedDate] = useState('2026-06-18'); // Default to target date
  
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg('');

    if (name.trim() === '') {
      setErrorMsg('Nama pegawai wajib diisi.');
      return;
    }
    if (phone.trim() === '') {
      setErrorMsg('Nomor HP pegawai wajib diisi.');
      return;
    }
    if (joinedDate.trim() === '') {
      setErrorMsg('Tanggal bergabung wajib diisi.');
      return;
    }

    setLoading(true);

    try {
      // Execute database insert and auto-rebalancing engine
      handleAddEmployee({
        name: name.trim(),
        phone: phone.trim(),
        joinedDate: joinedDate
      });

      // Show success micro-animations
      setSuccess(true);
      setTimeout(() => {
        setSuccess(false);
        setName('');
        setPhone('');
        onSuccess(); // Switch to Schedule tab automatically
      }, 1500);

    } catch (err) {
      console.error(err);
      setErrorMsg('Terjadi kesalahan saat menambahkan pegawai baru.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="mx-auto max-w-xl">
      <div className="rounded-2xl border border-neutral-200 bg-white p-6 shadow-xs dark:border-neutral-800 dark:bg-neutral-950 transition-all duration-300">
        
        {/* Title */}
        <div className="border-b border-neutral-100 pb-5 dark:border-neutral-850">
          <div className="flex items-center gap-2">
            <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-indigo-600 text-white dark:bg-indigo-500">
              <UserPlus className="h-4 w-4" />
            </span>
            <h2 className="text-sm font-extrabold text-neutral-950 dark:text-neutral-50 tracking-tight">
              Tambah Pegawai Baru
            </h2>
          </div>
          <p className="text-[10px] text-neutral-500 mt-1 dark:text-neutral-400">
            Formulir pendaftaran pegawai baru. Sistem otomatis mengatur penempatan jadwal, shift, dan rotasi.
          </p>
        </div>

        {/* Informational warning */}
        <div className="mt-5 rounded-lg bg-neutral-50 p-4 border border-neutral-150 dark:bg-neutral-900/40 dark:border-neutral-800">
          <h4 className="text-[10px] uppercase tracking-wider font-extrabold text-neutral-400 mb-1 flex items-center gap-1.5">
            <Sparkles className="h-3.5 w-3.5 text-amber-500 dark:text-amber-400 animate-pulse" />
            <span>ALGORITMA OTOMATIS AKTIF</span>
          </h4>
          <p className="text-[10px] text-neutral-500 leading-normal dark:text-neutral-450">
            Anda <strong>tidak perlu memilih lokasi, shift kerja, atau waktu libur</strong>. Begitu disimpan, Smart Fair Rotation Engine akan menghitung ketersediaan slot, menilai fairness score, dan otomatis meletakkan pegawai baru pada slot kosong/lokasi yang kekurangan personel secara real-time.
          </p>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="mt-5 space-y-4">
          
          {errorMsg && (
            <div className="text-xs font-bold text-red-600 bg-red-100/30 p-3 rounded-lg border border-red-200 dark:bg-red-950/25 dark:border-red-900/50">
              {errorMsg}
            </div>
          )}

          {/* Name */}
          <div>
            <label htmlFor="input-nama" className="block text-xs font-bold text-neutral-700 dark:text-neutral-300 mb-1">
              Nama Pegawai
            </label>
            <input
              id="input-nama"
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Contoh: Gusti Prabowo"
              disabled={loading || success}
              className="w-full rounded-lg border border-neutral-200 bg-white px-3 py-2.5 text-xs text-neutral-900 outline-hidden focus:border-neutral-900 dark:border-neutral-800 dark:bg-neutral-950 dark:text-neutral-50 dark:focus:border-neutral-700 transition"
            />
          </div>

          {/* Phone */}
          <div>
            <label htmlFor="input-phone" className="block text-xs font-bold text-neutral-700 dark:text-neutral-300 mb-1">
              Nomor Handphone (HP)
            </label>
            <div className="relative">
              <Phone className="absolute top-3 left-3 h-4 w-4 text-neutral-400" />
              <input
                id="input-phone"
                type="tel"
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                placeholder="Contoh: 0812XXXXXXXX"
                disabled={loading || success}
                className="w-full rounded-lg border border-neutral-200 bg-white pl-9 pr-3 py-2.5 text-xs text-neutral-900 outline-hidden focus:border-neutral-900 dark:border-neutral-800 dark:bg-neutral-950 dark:text-neutral-50 dark:focus:border-neutral-700 transition"
              />
            </div>
          </div>

          {/* Joined Date */}
          <div>
            <label htmlFor="input-join-date" className="block text-xs font-bold text-neutral-700 dark:text-neutral-300 mb-1">
              Tanggal Bergabung Kerja
            </label>
            <div className="relative">
              <CalendarDays className="absolute top-3 left-3 h-4 w-4 text-neutral-400" />
              <input
                id="input-join-date"
                type="date"
                value={joinedDate}
                onChange={(e) => setJoinedDate(e.target.value)}
                disabled={loading || success}
                className="w-full rounded-lg border border-neutral-200 bg-white pl-9 pr-3 py-2.5 text-xs text-neutral-900 outline-hidden focus:border-neutral-900 dark:border-neutral-800 dark:bg-neutral-950 dark:text-neutral-50 dark:focus:border-neutral-700 transition"
              />
            </div>
          </div>

          {/* Locked Parameters (Visual feedback of automated system) */}
          <div className="grid grid-cols-3 gap-3 pt-2">
            
            <div className="border border-dashed rounded-lg p-2.5 text-center bg-neutral-50/50 dark:border-neutral-800 dark:bg-transparent relative opacity-70">
              <Lock className="absolute top-1.5 right-1.5 h-3 w-3 text-neutral-400" />
              <span className="block text-[8px] font-bold text-neutral-400 uppercase">Lokasi Jaga</span>
              <span className="text-[10px] font-extrabold text-neutral-500 mt-1 block">Sistem Otomatis</span>
            </div>

            <div className="border border-dashed rounded-lg p-2.5 text-center bg-neutral-50/50 dark:border-neutral-800 dark:bg-transparent relative opacity-70">
              <Lock className="absolute top-1.5 right-1.5 h-3 w-3 text-neutral-400" />
              <span className="block text-[8px] font-bold text-neutral-400 uppercase">Grup Shift</span>
              <span className="text-[10px] font-extrabold text-neutral-500 mt-1 block">Sistem Otomatis</span>
            </div>

            <div className="border border-dashed rounded-lg p-2.5 text-center bg-neutral-50/50 dark:border-neutral-800 dark:bg-transparent relative opacity-70">
              <Lock className="absolute top-1.5 right-1.5 h-3 w-3 text-neutral-400" />
              <span className="block text-[8px] font-bold text-neutral-400 uppercase">Periode Roster</span>
              <span className="text-[10px] font-extrabold text-neutral-500 mt-1 block">Sistem Otomatis</span>
            </div>

          </div>

          {/* Submit */}
          <button
            id="btn-submit-tambah"
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
                <span>Pegawai Berhasil Ditambahkan!</span>
              </>
            ) : loading ? (
              <span>Mengotomatisasi Slot...</span>
            ) : (
              <>
                <UserPlus className="h-4 w-4" />
                <span>Simpan dan Tugaskan Otomatis</span>
              </>
            )}
          </button>

        </form>

      </div>
    </div>
  );
}
