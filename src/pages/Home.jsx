import React, { useMemo, useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { apiService, getThaiYear, transformDriveUrl } from '../services/api';
import DashboardStats from '../components/DashboardStats';
import AlbumGrid from '../components/AlbumGrid';
import Lightbox from '../components/Lightbox';
import { Link } from 'react-router-dom';
import { 
  FiSearch, FiX, FiClock, FiGrid, FiImage, FiCalendar 
} from 'react-icons/fi';

export default function Home({
  searchQuery, setSearchQuery,
  selectedCategory, setSelectedCategory,
  selectedYear, setSelectedYear,
  categories = []
}) {
  // สำหรับเปิดดู Lightbox ของรูปที่อัปเดตล่าสุด
  const [lightboxOpen, setLightboxOpen] = useState(false);
  const [lightboxIndex, setLightboxIndex] = useState(0);

  // ดึงอัลบั้ม
  const { data: albums = [], isLoading: albumsLoading, error: albumsError } = useQuery({
    queryKey: ['albums'],
    queryFn: apiService.getAlbums,
    staleTime: 5 * 60 * 1000, // แคชข้อมูล 5 นาที ไม่ยิง API ซ้ำหากอยู่ในระยะเวลา
  });

  // ดึงภาพถ่ายทั้งหมดในระบบ
  const { data: allPhotos = [], isLoading: photosLoading } = useQuery({
    queryKey: ['allPhotos'],
    queryFn: apiService.getAllPhotos,
    staleTime: 5 * 60 * 1000,
  });

  // กรองรายการอัลบั้ม
  const filteredAlbums = useMemo(() => {
    let filtered = [...albums];

    // ค้นหาอย่างรวดเร็ว
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      filtered = filtered.filter(a =>
        a.title.toLowerCase().includes(q) ||
        (a.description || '').toLowerCase().includes(q) ||
        (a.tags || '').toLowerCase().includes(q)
      );
    }

    // กรองหมวดหมู่
    if (selectedCategory && selectedCategory !== 'ทั้งหมด') {
      filtered = filtered.filter(a => a.category === selectedCategory);
    }

    // กรองปี พ.ศ.
    if (selectedYear && selectedYear !== 'ทั้งหมด') {
      filtered = filtered.filter(a => String(getThaiYear(a.date)) === String(selectedYear));
    }

    return filtered;
  }, [albums, searchQuery, selectedCategory, selectedYear]);

  // กิจกรรมล่าสุด (Recent Activities) - 3 อัลบั้มแรกเรียงตามวันที่
  const recentAlbums = useMemo(() => {
    return [...albums]
      .sort((a, b) => new Date(b.date) - new Date(a.date))
      .slice(0, 3);
  }, [albums]);

  // รูปที่อัปโหลดล่าสุด (Recent Photos) - 6 รูปแรกเรียงตาม created_at
  const recentPhotos = useMemo(() => {
    const parentAlbumsMap = new Map(albums.map(a => [a.id, a]));
    
    return [...allPhotos]
      .sort((a, b) => new Date(b.created_at) - new Date(a.created_at))
      .slice(0, 6)
      .map(photo => {
        // แปะพาธไดเรกทอรีเข้าไปด้วยเพื่อให้ Lightbox ค้นเจอพาธไดรฟ์
        const parentAlbum = parentAlbumsMap.get(photo.album_id);
        const folderPath = parentAlbum ? parentAlbum.drive_folder_path || getDriveFolderPath(parentAlbum.date, parentAlbum.title, parentAlbum.category) : '';
        return {
          ...photo,
          drive_folder_path: folderPath
        };
      });
  }, [allPhotos, albums]);

  const handleOpenLightbox = (index) => {
    setLightboxIndex(index);
    setLightboxOpen(true);
  };

  return (
    <div className="space-y-6 animate-fade-in">
      {/* 1. สถิติหน้าแดชบอร์ด */}
      <DashboardStats albums={albums} photos={allPhotos} />

      {/* โครงสร้างเลย์เอาต์หลัก 2 คอลัมน์ (Desktop: 3:1) */}
      <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
        
        {/* คอลัมน์ซ้าย: ค้นหากิจกรรม และกริดอัลบั้มหลัก */}
        <div className="lg:col-span-3 space-y-6">
          
          {/* ช่องค้นหากิจกรรมอย่างรวดเร็ว */}
          <div className="glass-card p-5 space-y-4">
            <h3 className="text-xs font-bold text-slate-400 dark:text-slate-500 uppercase tracking-wider flex items-center gap-2">
              <FiSearch className="w-4 h-4 text-primary-500" />
              <span>ค้นหากิจกรรมอย่างรวดเร็ว</span>
            </h3>

            <div className="flex flex-col sm:flex-row gap-3">
              <div className="relative flex-1">
                <FiSearch className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-450" />
                <input
                  type="text"
                  placeholder="ค้นหากิจกรรมของคุณที่นี่... (เช่น ชื่อกิจกรรม, แท็ก, รายละเอียด)"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full pl-10 pr-10 py-2.5 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900/60 text-sm focus:outline-none focus:border-primary-500 transition-colors dark:text-white"
                />
                {searchQuery && (
                  <button 
                    onClick={() => setSearchQuery('')} 
                    className="absolute right-3 top-1/2 -translate-y-1/2 p-1 rounded-md text-slate-350 hover:text-slate-550 transition-colors"
                  >
                    <FiX className="w-4 h-4" />
                  </button>
                )}
              </div>

              {/* แสดงสถิติค้นเจอผลลัพธ์ */}
              <div className="flex items-center justify-between sm:justify-start gap-3 shrink-0">
                <span className="text-xs font-bold text-slate-450 dark:text-slate-500">
                  ค้นพบ {filteredAlbums.length} กิจกรรม
                </span>
                {(selectedCategory !== 'ทั้งหมด' || selectedYear !== 'ทั้งหมด' || searchQuery) && (
                  <button
                    onClick={() => {
                      setSelectedCategory('ทั้งหมด');
                      setSelectedYear('ทั้งหมด');
                      setSearchQuery('');
                    }}
                    className="text-[10px] font-bold px-2.5 py-1 bg-rose-500/10 text-rose-600 dark:text-rose-400 rounded-full hover:bg-rose-500/25 transition-colors"
                  >
                    ล้างตัวกรอง
                  </button>
                )}
              </div>
            </div>
          </div>

          {/* อัลบั้มกิจกรรมหลัก */}
          <div className="space-y-4">
            <h4 className="text-sm font-bold text-slate-700 dark:text-slate-300 flex items-center gap-2">
              <FiGrid className="w-4 h-4 text-primary-500" />
              <span>อัลบั้มกิจกรรมทั้งหมด</span>
            </h4>
            
            {albumsError && (
              <div className="glass-card p-6 text-center text-rose-500">
                <p className="text-sm font-bold">{albumsError.message}</p>
              </div>
            )}

            <AlbumGrid albums={filteredAlbums} isLoading={albumsLoading} />
          </div>
        </div>

        {/* คอลัมน์ขวา: กิจกรรมล่าสุด และรูปภาพอัปโหลดล่าสุด */}
        <div className="space-y-6">
          
          {/* กิจกรรมอัปเดตล่าสุด */}
          <div className="glass-card p-5 space-y-4">
            <h3 className="text-xs font-bold text-slate-400 dark:text-slate-500 uppercase tracking-wider flex items-center gap-1.5">
              <FiClock className="w-4 h-4 text-primary-500" />
              <span>กิจกรรมอัปเดตล่าสุด</span>
            </h3>

            <div className="space-y-3">
              {albumsLoading && (
                Array.from({ length: 3 }).map((_, i) => (
                  <div key={i} className="flex gap-3 animate-pulse">
                    <div className="w-12 h-12 rounded-lg bg-slate-200 dark:bg-slate-800 shrink-0" />
                    <div className="flex-1 space-y-1.5 py-1">
                      <div className="h-3.5 bg-slate-200 dark:bg-slate-800 rounded w-5/6" />
                      <div className="h-2.5 bg-slate-200 dark:bg-slate-800 rounded w-1/2" />
                    </div>
                  </div>
                ))
              )}

              {!albumsLoading && recentAlbums.length > 0 && (
                recentAlbums.map(item => {
                  const itemYear = getThaiYear(item.date);
                  return (
                    <Link
                      key={item.id}
                      to={`/album/${item.id}`}
                      className="flex gap-3 hover:bg-slate-100/50 dark:hover:bg-slate-800/40 p-1.5 -m-1.5 rounded-xl transition-colors group"
                    >
                      <div className="w-12 h-12 rounded-xl overflow-hidden bg-slate-150 dark:bg-slate-800 shrink-0">
                        <img src={transformDriveUrl(item.cover_image)} alt={item.title} className="w-full h-full object-cover" />
                      </div>
                      <div className="min-w-0 flex-1">
                        <h4 className="text-xs font-bold text-slate-800 dark:text-white truncate group-hover:text-primary-500 transition-colors">
                          {item.title}
                        </h4>
                        <p className="text-[10px] text-slate-400 dark:text-slate-500 flex items-center gap-1 mt-1 font-semibold">
                          <FiCalendar className="w-3 h-3" />
                          <span>พ.ศ. {itemYear}</span>
                        </p>
                      </div>
                    </Link>
                  );
                })
              )}

              {!albumsLoading && recentAlbums.length === 0 && (
                <p className="text-center text-xs text-slate-400 dark:text-slate-500">ไม่มีกิจกรรมล่าสุด</p>
              )}
            </div>
          </div>

          {/* รูปที่อัปโหลดล่าสุด */}
          <div className="glass-card p-5 space-y-4">
            <h3 className="text-xs font-bold text-slate-400 dark:text-slate-500 uppercase tracking-wider flex items-center gap-1.5">
              <FiImage className="w-4 h-4 text-emerald-500" />
              <span>รูปที่อัปโหลดล่าสุด</span>
            </h3>

            <div className="grid grid-cols-3 gap-2">
              {photosLoading && (
                <div className="col-span-3 flex flex-col items-center justify-center py-6 space-y-2">
                  <div className="w-5 h-5 border-2 border-primary-500 border-t-transparent rounded-full animate-spin" />
                  <span className="text-[10px] font-bold text-slate-450 dark:text-slate-500">กำลังดึงรูปภาพล่าสุด...</span>
                </div>
              )}

              {!photosLoading && recentPhotos.length > 0 && (
                recentPhotos.map((photo, index) => (
                  <div
                    key={photo.id}
                    onClick={() => handleOpenLightbox(index)}
                    className="relative aspect-square rounded-xl overflow-hidden bg-slate-100 dark:bg-slate-800 cursor-pointer shadow-sm hover:scale-[1.03] transition-transform duration-250 border border-slate-100 dark:border-slate-850"
                  >
                    <img src={transformDriveUrl(photo.image_url || photo.url)} alt={photo.caption} className="w-full h-full object-cover" />
                  </div>
                ))
              )}
            </div>
            
            {!photosLoading && recentPhotos.length === 0 && (
              <p className="text-center text-xs text-slate-450 dark:text-slate-500 py-3">ยังไม่มีรูปภาพอัปโหลด</p>
            )}
          </div>

        </div>

      </div>

      {/* Lightbox เปิดดูรูปที่อัปโหลดล่าสุด */}
      <Lightbox
        photos={recentPhotos}
        currentIndex={lightboxIndex}
        isOpen={lightboxOpen}
        onClose={() => setLightboxOpen(false)}
        onNavigate={setLightboxIndex}
      />
    </div>
  );
}
