import React from 'react';
import AlbumCard from './AlbumCard';
import { FiInbox } from 'react-icons/fi';

export default function AlbumGrid({ albums = [], isLoading = false }) {
  // Skeleton loading cards
  if (isLoading) {
    return (
      <div className="space-y-4">
        {/* กล่องแจ้งเตือนการโหลดข้อมูล */}
        <div className="flex items-center gap-3 p-4 bg-primary-500/5 text-primary-600 dark:text-primary-400 border border-primary-500/10 rounded-2xl">
          <div className="w-5 h-5 border-2 border-primary-500 border-t-transparent rounded-full animate-spin shrink-0" />
          <span className="text-xs font-bold">กำลังดึงข้อมูลคลังอัลบั้มกิจกรรมล่าสุดจาก Google Sheets...</span>
        </div>
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4">
          {Array.from({ length: 8 }).map((_, i) => (
            <div key={i} className="glass-card overflow-hidden animate-pulse">
              <div className="aspect-[4/3] bg-slate-200 dark:bg-slate-800" />
              <div className="p-4 space-y-2.5">
                <div className="h-3.5 bg-slate-200 dark:bg-slate-800 rounded-full w-3/4" />
                <div className="h-3 bg-slate-100 dark:bg-slate-850 rounded-full w-1/2" />
                <div className="h-2 bg-slate-100 dark:bg-slate-850 rounded-full w-full" />
              </div>
            </div>
          ))}
        </div>
      </div>
    );
  }

  // ไม่พบผลลัพธ์
  if (albums.length === 0) {
    return (
      <div className="glass-card p-12 text-center space-y-3">
        <div className="w-16 h-16 rounded-2xl bg-slate-100 dark:bg-slate-800 flex items-center justify-center mx-auto">
          <FiInbox className="w-7 h-7 text-slate-300 dark:text-slate-600" />
        </div>
        <p className="text-sm font-bold text-slate-500 dark:text-slate-400">ไม่พบอัลบั้มกิจกรรม</p>
        <p className="text-xs text-slate-400 dark:text-slate-500">ลองปรับเปลี่ยนตัวกรองหรือคำค้นหาใหม่</p>
      </div>
    );
  }

  return (
    <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4">
      {albums.map((album, index) => (
        <AlbumCard key={album.id} album={album} index={index} />
      ))}
    </div>
  );
}
