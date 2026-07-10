import React from 'react';
import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { FiImage, FiCalendar, FiFolder } from 'react-icons/fi';
import { getThaiYear, transformDriveUrl } from '../services/api';

export default function AlbumCard({ album, index = 0 }) {
  const thaiYear = getThaiYear(album.date);

  // จัดรูปแบบวันที่แสดงผล
  const displayDate = (() => {
    if (!album.date) return '';
    const d = new Date(album.date);
    if (isNaN(d.getTime())) return '';
    const day = d.getDate();
    const months = [
      'ม.ค.', 'ก.พ.', 'มี.ค.', 'เม.ย.', 'พ.ค.', 'มิ.ย.',
      'ก.ค.', 'ส.ค.', 'ก.ย.', 'ต.ค.', 'พ.ย.', 'ธ.ค.'
    ];
    return `${day} ${months[d.getMonth()]} ${thaiYear}`;
  })();

  const categoryColors = {
    'วิชาการ': 'bg-blue-500/10 text-blue-600 dark:text-blue-400',
    'กีฬา': 'bg-rose-500/10 text-rose-600 dark:text-rose-400',
    'คุณธรรม': 'bg-amber-500/10 text-amber-600 dark:text-amber-400',
    'ศิลปะ': 'bg-purple-500/10 text-purple-600 dark:text-purple-400',
    'ทั่วไป': 'bg-slate-500/10 text-slate-600 dark:text-slate-400',
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: index * 0.05, duration: 0.35 }}
    >
      <Link
        to={`/album/${album.id}`}
        className="group block glass-card overflow-hidden hover:shadow-lg hover:-translate-y-1 transition-all duration-300"
      >
        {/* ภาพปกกิจกรรม */}
        <div className="relative aspect-[4/3] overflow-hidden bg-slate-100 dark:bg-slate-800">
          <img
            src={transformDriveUrl(album.cover_image, 400)}
            alt={album.title}
            className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500"
            loading="lazy"
            decoding="async"
          />
          {/* แถบหมวดหมู่ */}
          <div className="absolute top-3 left-3">
            <span className={`inline-flex items-center px-2.5 py-1 rounded-full text-[10px] font-bold backdrop-blur-md ${categoryColors[album.category] || categoryColors['ทั่วไป']} border border-white/20`}>
              {album.category}
            </span>
          </div>
          {/* จำนวนภาพ */}
          <div className="absolute bottom-3 right-3">
            <span className="inline-flex items-center gap-1 px-2 py-1 rounded-full text-[10px] font-bold bg-black/50 text-white backdrop-blur-md">
              <FiImage className="w-3 h-3" />
              {album.photoCount || 0}
            </span>
          </div>
        </div>

        {/* ข้อมูลอัลบั้ม */}
        <div className="p-4 space-y-2">
          <h3 className="text-sm font-bold text-slate-800 dark:text-white leading-snug line-clamp-2 group-hover:text-primary-600 dark:group-hover:text-primary-400 transition-colors">
            {album.title}
          </h3>
          <div className="flex items-center gap-3 text-[10px] text-slate-400 dark:text-slate-500 font-medium">
            <span className="flex items-center gap-1">
              <FiCalendar className="w-3 h-3" />
              {displayDate}
            </span>
          </div>
          {/* พาธ Google Drive จำลอง */}
          <div className="flex items-center gap-1.5 text-[9px] text-slate-300 dark:text-slate-600 font-mono truncate pt-1 border-t border-slate-100 dark:border-slate-800/60">
            <FiFolder className="w-3 h-3 shrink-0" />
            <span className="truncate">{album.drive_folder_path}</span>
          </div>
        </div>
      </Link>
    </motion.div>
  );
}
