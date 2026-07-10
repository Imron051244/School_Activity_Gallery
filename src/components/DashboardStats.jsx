import React from 'react';
import { motion } from 'framer-motion';
import { FiImage, FiFolder, FiHardDrive } from 'react-icons/fi';

export default function DashboardStats({ albums = [], photos = [] }) {
  const totalAlbums = albums.length;
  const totalPhotos = photos.length || albums.reduce((sum, a) => sum + (a.photoCount || 0), 0);
  
  // คำนวณขนาดพื้นที่จัดเก็บแบบจำลอง: เริ่มต้น 15.4 MB + ขนาดเฉลี่ยภาพละ 0.45 MB
  const simulatedSizeMB = (15.4 + totalPhotos * 0.45).toFixed(1);
  const totalSpaceGB = 15; // พื้นที่ Google Drive ฟรีทั่วไป
  // แปลงขนาดที่ใช้ไปเป็น GB (1 GB = 1024 MB)
  const simulatedSizeGB = (simulatedSizeMB / 1024).toFixed(3);
  const percentUsed = ((simulatedSizeGB / totalSpaceGB) * 100).toFixed(2);

  const stats = [
    {
      label: 'กิจกรรมทั้งหมด',
      value: totalAlbums,
      subtext: 'อัลบั้มบันทึกในคลัง',
      icon: FiFolder,
      color: 'from-primary-500 to-indigo-600',
      shadow: 'shadow-primary-500/20',
    },
    {
      label: 'รูปภาพทั้งหมด',
      value: totalPhotos,
      subtext: 'รูปถ่ายบันทึกบนคลาวด์',
      icon: FiImage,
      color: 'from-emerald-500 to-teal-600',
      shadow: 'shadow-emerald-500/20',
    },
    {
      label: 'พื้นที่จัดเก็บใช้งาน',
      value: `${simulatedSizeMB} MB`,
      subtext: `ใช้ไปแล้ว ${percentUsed}% จาก 15 GB`,
      icon: FiHardDrive,
      color: 'from-amber-500 to-orange-600',
      shadow: 'shadow-amber-500/20',
      isStorage: true
    },
  ];

  return (
    <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
      {stats.map((stat, index) => (
        <motion.div
          key={stat.label}
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: index * 0.1, duration: 0.4 }}
          className="glass-card p-5 flex flex-col justify-between group hover:shadow-md transition-shadow duration-300 min-h-[110px]"
        >
          <div className="flex items-center gap-4">
            <div className={`w-12 h-12 rounded-2xl bg-gradient-to-br ${stat.color} flex items-center justify-center text-white shadow-lg ${stat.shadow} shrink-0 group-hover:scale-105 transition-transform duration-300`}>
              <stat.icon className="w-5 h-5" />
            </div>
            <div className="min-w-0 flex-1">
              <p className="text-2xl font-black text-slate-800 dark:text-white leading-none">
                {stat.value}
              </p>
              <p className="text-[10px] font-bold text-slate-400 dark:text-slate-500 mt-1 uppercase tracking-wider truncate">
                {stat.label}
              </p>
            </div>
          </div>

          {/* ถ้าเป็นกล่องพื้นที่จัดเก็บ ให้แสดง Progress Bar จำลอง */}
          {stat.isStorage ? (
            <div className="mt-3.5 space-y-1">
              <div className="w-full bg-slate-100 dark:bg-slate-800 rounded-full h-1.5 overflow-hidden">
                <div 
                  className="bg-gradient-to-r from-amber-500 to-orange-500 h-full rounded-full transition-all duration-550"
                  style={{ width: `${Math.max(2, parseFloat(percentUsed) * 10)}%` }} // ทำให้มองเห็นแถบได้ง่ายแม้จะใช้ไปน้อย
                />
              </div>
              <p className="text-[9px] font-bold text-slate-400 dark:text-slate-500 text-right">{stat.subtext}</p>
            </div>
          ) : (
            <p className="text-[9px] font-bold text-slate-450 dark:text-slate-500 mt-3 text-right">
              {stat.subtext}
            </p>
          )}
        </motion.div>
      ))}
    </div>
  );
}
