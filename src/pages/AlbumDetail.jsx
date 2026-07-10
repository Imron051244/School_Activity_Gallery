import React, { useState, useMemo, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { motion, AnimatePresence } from 'framer-motion';
import { apiService, getThaiYear, transformDriveUrl } from '../services/api';
import Lightbox from '../components/Lightbox';
import Swal from 'sweetalert2';
import { 
  FiArrowLeft, FiImage, FiCalendar, FiFolder, FiTag, FiGrid, 
  FiEdit, FiTrash2, FiCheckSquare, FiSquare, FiX, FiCheck, FiDownload
} from 'react-icons/fi';

export default function AlbumDetail({ onOpenUploadModal }) {
  const { albumId } = useParams();
  const navigate = useNavigate();
  const qc = useQueryClient();

  const [lightboxOpen, setLightboxOpen] = useState(false);
  const [lightboxIndex, setLightboxIndex] = useState(0);

  const [isManageMode, setIsManageMode] = useState(false);
  const [selectedPhotos, setSelectedPhotos] = useState([]);
  
  // สถานะเกี่ยวกับการซิงค์และโฟลเดอร์ย่อย
  const [isSyncing, setIsSyncing] = useState(false);
  const [activeSubfolderTab, setActiveSubfolderTab] = useState('ทั้งหมด');

  // ดึงข้อมูลอัลบั้ม
  const { data: albums = [] } = useQuery({
    queryKey: ['albums'],
    queryFn: apiService.getAlbums,
    staleTime: 5 * 60 * 1000,
  });
  const album = albums.find(a => a.id === albumId);

  // ดึงข้อมูลภาพในอัลบั้ม
  const { data: photos = [], isLoading } = useQuery({
    queryKey: ['photos', albumId],
    queryFn: () => apiService.getPhotos(albumId),
    enabled: !!albumId,
    staleTime: 5 * 60 * 1000,
  });



  const thaiYear = album ? getThaiYear(album.date) : '';

  // ดึงรายการโฟลเดอร์ย่อยที่มีอยู่ในอัลบั้มนี้
  const subfoldersList = useMemo(() => {
    const list = new Set();
    photos.forEach(p => {
      if (p.subfolder) {
        list.add(p.subfolder);
      }
    });
    return Array.from(list);
  }, [photos]);

  // กรองรูปภาพตามแท็บโฟลเดอร์ย่อย
  const filteredPhotos = useMemo(() => {
    if (activeSubfolderTab === 'ทั้งหมด') return photos;
    if (activeSubfolderTab === 'รูท') return photos.filter(p => !p.subfolder);
    return photos.filter(p => p.subfolder === activeSubfolderTab);
  }, [photos, activeSubfolderTab]);

  // ฟังก์ชันซิงค์รูปภาพจาก Google Drive
  const handleSyncPhotos = async () => {
    setIsSyncing(true);
    try {
      const stats = await apiService.syncAlbumPhotos(albumId);
      qc.invalidateQueries({ queryKey: ['photos', albumId] });
      qc.invalidateQueries({ queryKey: ['albums'] });
      
      Swal.fire({
        title: 'ซิงค์รูปภาพสำเร็จ!',
        html: `เพิ่มรูปภาพใหม่ <strong>${stats.addedCount}</strong> ภาพ<br/>ลบรูปภาพที่หายไป <strong>${stats.removedCount}</strong> ภาพ`,
        icon: 'success',
        confirmButtonText: 'ตกลง',
        confirmButtonColor: '#10b981',
        customClass: {
          popup: 'rounded-3xl font-sans text-sm',
          confirmButton: 'px-6 py-2.5 rounded-xl font-bold text-xs shadow-lg shadow-emerald-500/20'
        }
      });
    } catch (error) {
      console.error(error);
      Swal.fire({
        title: 'เกิดข้อผิดพลาด!',
        text: error.message || 'ไม่สามารถซิงค์รูปภาพกับ Google Drive ได้',
        icon: 'error',
        confirmButtonText: 'ตกลง',
        confirmButtonColor: '#ef4444',
      });
    } finally {
      setIsSyncing(false);
    }
  };

  // จัดรูปแบบวันที่แสดงผล
  const displayDate = useMemo(() => {
    if (!album?.date) return '';
    const d = new Date(album.date);
    if (isNaN(d.getTime())) return '';
    const day = d.getDate();
    const months = [
      'มกราคม', 'กุมภาพันธ์', 'มีนาคม', 'เมษายน', 'พฤษภาคม', 'มิถุนายน',
      'กรกฎาคม', 'สิงหาคม', 'กันยายน', 'ตุลาคม', 'พฤศจิกายน', 'ธันวาคม'
    ];
    return `${day} ${months[d.getMonth()]} ${thaiYear}`;
  }, [album?.date, thaiYear]);

  // ================= MUTATIONS สำหรับการลบ =================

  // 1. ลบอัลบั้ม
  // 1. ลบอัลบั้ม
  const deleteAlbumMutation = useMutation({
    mutationFn: () => apiService.deleteAlbum(albumId),
    onMutate: () => {
      Swal.fire({
        title: 'กำลังลบอัลบั้มกิจกรรม...',
        text: 'ระบบกำลังดำเนินการลบข้อมูลแถวและโฟลเดอร์บนคลาวด์',
        allowOutsideClick: false,
        didOpen: () => {
          Swal.showLoading();
        },
        customClass: {
          popup: 'rounded-3xl font-sans text-sm',
        }
      });
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['albums'] });
      qc.invalidateQueries({ queryKey: ['allPhotos'] });
      qc.invalidateQueries({ queryKey: ['photos', albumId] });
      Swal.fire({
        title: 'ลบอัลบั้มสำเร็จ!',
        text: 'ข้อมูลอัลบั้มและรูปภาพทั้งหมดถูกลบออกจากคลังเรียบร้อยแล้ว',
        icon: 'success',
        confirmButtonText: 'ตกลง',
        confirmButtonColor: '#4f70fa',
      });
      navigate('/');
    },
    onError: (err) => {
      Swal.fire({ title: 'เกิดข้อผิดพลาด', text: err.message, icon: 'error', confirmButtonColor: '#f43f5e' });
    }
  });

  // 2. ลบรูปภาพที่เลือก (Bulk Delete)
  const deletePhotosMutation = useMutation({
    mutationFn: (ids) => apiService.deletePhotos(ids),
    onMutate: () => {
      Swal.fire({
        title: 'กำลังลบรูปภาพกิจกรรม...',
        text: 'ระบบกำลังดำเนินการลบไฟล์จาก Drive และแถวจากแผ่นงาน',
        allowOutsideClick: false,
        didOpen: () => {
          Swal.showLoading();
        },
        customClass: {
          popup: 'rounded-3xl font-sans text-sm',
        }
      });
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['photos', albumId] });
      qc.invalidateQueries({ queryKey: ['albums'] });
      qc.invalidateQueries({ queryKey: ['allPhotos'] });
      setSelectedPhotos([]);
      setIsManageMode(false);
      Swal.fire({
        title: 'ลบรูปภาพสำเร็จ!',
        text: 'รูปภาพที่เลือกถูกลบออกเรียบร้อยแล้ว',
        icon: 'success',
        confirmButtonText: 'ตกลง',
        confirmButtonColor: '#4f70fa',
      });
    },
    onError: (err) => {
      Swal.fire({ title: 'เกิดข้อผิดพลาด', text: err.message, icon: 'error', confirmButtonColor: '#f43f5e' });
    }
  });

  // ฟังก์ชันคลิกลบอัลบั้ม
  const handleDeleteAlbum = () => {
    Swal.fire({
      title: 'ต้องการลบอัลบั้มนี้ใช่หรือไม่?',
      text: 'การลบอัลบั้มจะทำให้รูปภาพทั้งหมดในอัลบั้มถูกลบไปด้วยและไม่สามารถกู้คืนได้',
      icon: 'warning',
      showCancelButton: true,
      confirmButtonText: 'ยืนยันลบ',
      cancelButtonText: 'ยกเลิก',
      confirmButtonColor: '#d33',
      cancelButtonColor: '#3085d6',
      customClass: {
        popup: 'rounded-3xl font-sans text-sm',
      }
    }).then((result) => {
      if (result.isConfirmed) {
        deleteAlbumMutation.mutate();
      }
    });
  };

  // จัดการเลือก/ไม่เลือกรูปภาพ
  const toggleSelectPhoto = (photoId) => {
    setSelectedPhotos(prev => 
      prev.includes(photoId) ? prev.filter(id => id !== photoId) : [...prev, photoId]
    );
  };

  // เลือกทั้งหมด / ล้างการเลือก
  const toggleSelectAll = () => {
    if (selectedPhotos.length === filteredPhotos.length) {
      setSelectedPhotos([]);
    } else {
      setSelectedPhotos(filteredPhotos.map(p => p.id));
    }
  };

  // ยืนยันลบรูปภาพที่เลือก
  const handleDeleteSelectedPhotos = () => {
    if (selectedPhotos.length === 0) return;
    
    Swal.fire({
      title: `ลบรูปภาพ ${selectedPhotos.length} รายการ?`,
      text: 'รูปภาพที่ถูกเลือกจะถูกลบถาวรออกจากระบบจำลอง',
      icon: 'warning',
      showCancelButton: true,
      confirmButtonText: 'ยืนยันลบ',
      cancelButtonText: 'ยกเลิก',
      confirmButtonColor: '#d33',
      cancelButtonColor: '#3085d6',
      customClass: {
        popup: 'rounded-3xl font-sans text-sm',
      }
    }).then((result) => {
      if (result.isConfirmed) {
        deletePhotosMutation.mutate(selectedPhotos);
      }
    });
  };

  // ดาวน์โหลดรูปภาพที่เลือกแบบ Bulk Download
  const handleDownloadSelectedPhotos = () => {
    if (selectedPhotos.length === 0) return;
    
    selectedPhotos.forEach((photoId, idx) => {
      const photo = photos.find(p => p.id === photoId);
      if (photo) {
        setTimeout(() => {
          const url = transformDriveUrl(photo.image_url || photo.url);
          fetch(url)
            .then(resp => resp.blob())
            .then(blob => {
              const blobUrl = window.URL.createObjectURL(blob);
              const a = document.createElement('a');
              a.href = blobUrl;
              a.download = `photo_${photo.id || Date.now()}.jpg`;
              document.body.appendChild(a);
              a.click();
              document.body.removeChild(a);
              window.URL.revokeObjectURL(blobUrl);
            })
            .catch(() => {
              const a = document.createElement('a');
              a.href = url;
              a.target = '_blank';
              a.download = `photo_${photo.id || Date.now()}.jpg`;
              document.body.appendChild(a);
              a.click();
              document.body.removeChild(a);
            });
        }, idx * 250); // ป้องกันบราวเซอร์ตรวจพบคลิกสแปมดาวน์โหลดพร้อมกัน
      }
    });
  };

  const openLightbox = (index) => {
    if (isManageMode) return;
    setLightboxIndex(index);
    setLightboxOpen(true);
  };

  return (
    <div className="space-y-6 animate-fade-in">
      {/* ส่วนควบคุมบนสุด */}
      <div className="flex items-center justify-between">
        <button
          onClick={() => navigate('/')}
          className="inline-flex items-center gap-2 text-sm font-semibold text-slate-500 dark:text-slate-400 hover:text-primary-600 dark:hover:text-primary-400 transition-colors"
        >
          <FiArrowLeft className="w-4 h-4" />
          <span>กลับหน้าหลัก</span>
        </button>

        {album && (
          <div className="flex items-center gap-2">
            <button
              onClick={() => onOpenUploadModal('edit-album', albumId, album)}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-amber-500/10 text-amber-600 dark:text-amber-400 text-xs font-bold hover:bg-amber-500/20 transition-colors"
              title="แก้ไขรายละเอียดอัลบั้ม"
            >
              <FiEdit className="w-3.5 h-3.5" />
              <span>แก้ไขอัลบั้ม</span>
            </button>
            <button
              onClick={handleDeleteAlbum}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-rose-500/10 text-rose-600 dark:text-rose-400 text-xs font-bold hover:bg-rose-500/20 transition-colors"
              title="ลบอัลบั้มนี้พร้อมรูปทั้งหมด"
            >
              <FiTrash2 className="w-3.5 h-3.5" />
              <span>ลบอัลบั้ม</span>
            </button>
          </div>
        )}
      </div>

      {/* ข้อมูลอัลบั้ม */}
      {album && (
        <motion.div
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          className="glass-card overflow-hidden border border-slate-200/50 dark:border-slate-850"
        >
          {/* ภาพปก */}
          <div className="relative h-48 md:h-64 overflow-hidden bg-slate-200 dark:bg-slate-800">
            <img
              src={transformDriveUrl(album.cover_image)}
              alt={album.title}
              className="w-full h-full object-cover"
            />
            <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/30 to-transparent" />
            <div className="absolute bottom-0 left-0 right-0 p-6 space-y-2">
              <h2 className="text-lg md:text-2xl font-black text-white leading-snug">{album.title}</h2>
              <div className="flex flex-wrap items-center gap-3 text-xs text-white/80">
                <span className="flex items-center gap-1"><FiCalendar className="w-3.5 h-3.5" /> {displayDate}</span>
                <span className="flex items-center gap-1"><FiTag className="w-3.5 h-3.5" /> {album.category}</span>
                <span className="flex items-center gap-1"><FiImage className="w-3.5 h-3.5" /> {photos.length} ภาพ</span>
              </div>
            </div>
          </div>

          {/* รายละเอียด */}
          {album.description && (
            <div className="p-5">
              <p className="text-xs md:text-sm text-slate-600 dark:text-slate-400 leading-relaxed">{album.description}</p>
            </div>
          )}
        </motion.div>
      )}

      {/* แผงฟังก์ชันรูปภาพ */}
      <div className="flex items-center justify-between border-b pb-3 border-slate-200/50 dark:border-slate-850">
        <div className="flex items-center gap-3">
          <h3 className="text-sm font-bold text-slate-700 dark:text-slate-350 flex items-center gap-2">
            <FiGrid className="w-4 h-4 text-primary-500" />
            <span>รูปภาพในกิจกรรม ({photos.length} ภาพ)</span>
          </h3>
          {isSyncing && (
            <span className="inline-flex items-center gap-1.5 text-[10px] font-bold text-indigo-500 dark:text-indigo-400 bg-indigo-500/5 dark:bg-indigo-400/5 px-2.5 py-0.5 rounded-full border border-indigo-500/10 dark:border-indigo-400/10">
              <span className="w-1.5 h-1.5 rounded-full bg-indigo-500 dark:bg-indigo-400 animate-ping"></span>
              <span>กำลังตรวจเช็คไฟล์ภาพจาก Drive...</span>
            </span>
          )}
        </div>
        
        <div className="flex items-center gap-2">
          {photos.length > 0 && (
            <button
              onClick={() => {
                setIsManageMode(!isManageMode);
                setSelectedPhotos([]);
              }}
              className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold transition-colors ${
                isManageMode
                  ? 'bg-slate-800 text-white dark:bg-slate-700'
                  : 'bg-primary-500/10 text-primary-600 dark:text-primary-400 hover:bg-primary-500/20'
              }`}
            >
              <FiCheckSquare className="w-3.5 h-3.5" />
              <span>{isManageMode ? 'เสร็จสิ้น' : 'จัดการรูปภาพ'}</span>
            </button>
          )}
          
          <button
            onClick={handleSyncPhotos}
            disabled={isSyncing}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-indigo-500/10 text-indigo-600 dark:text-indigo-400 text-xs font-bold hover:bg-indigo-500/20 transition-colors disabled:opacity-50"
          >
            <FiFolder className={`w-3.5 h-3.5 ${isSyncing ? 'animate-spin' : ''}`} />
            <span>ซิงค์รูปภาพ</span>
          </button>

          <button
            onClick={() => onOpenUploadModal('photo', albumId)}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 text-xs font-bold hover:bg-emerald-500/20 transition-colors"
          >
            <FiImage className="w-3.5 h-3.5" />
            <span>อัปโหลดรูปภาพ</span>
          </button>
        </div>
      </div>

      {/* แถบโหมดเลือกรายการลบ (Bulk Control Panel) */}
      <AnimatePresence>
        {isManageMode && (
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            className="p-3.5 bg-slate-100 dark:bg-slate-900 border dark:border-slate-850 rounded-2xl flex flex-col sm:flex-row items-center justify-between gap-3"
          >
            <div className="flex items-center gap-3">
              <button 
                onClick={toggleSelectAll}
                className="flex items-center gap-1.5 text-xs font-bold text-slate-600 dark:text-slate-400 hover:text-primary-500"
              >
                {selectedPhotos.length === filteredPhotos.length ? <FiCheckSquare className="text-primary-500" /> : <FiSquare />}
                <span>{selectedPhotos.length === filteredPhotos.length ? 'ล้างการเลือก' : 'เลือกทั้งหมด'}</span>
              </button>
              <span className="text-xs font-bold text-slate-500">
                เลือกแล้ว <strong className="text-primary-500 text-sm font-black">{selectedPhotos.length}</strong> / {filteredPhotos.length} ภาพ
              </span>
            </div>

            <div className="flex items-center gap-2 w-full sm:w-auto">
              <button
                disabled={selectedPhotos.length === 0}
                onClick={handleDownloadSelectedPhotos}
                className={`flex-1 sm:flex-initial inline-flex items-center justify-center gap-1.5 px-4 py-2 rounded-xl text-xs font-bold text-white shadow-lg transition-all ${
                  selectedPhotos.length > 0 
                    ? 'bg-emerald-500 hover:bg-emerald-600 shadow-emerald-500/20' 
                    : 'bg-slate-300 dark:bg-slate-800 text-slate-400 dark:text-slate-600 cursor-not-allowed shadow-none'
                }`}
              >
                <FiDownload className="w-3.5 h-3.5" />
                <span>ดาวน์โหลดที่เลือก</span>
              </button>
              <button
                disabled={selectedPhotos.length === 0}
                onClick={handleDeleteSelectedPhotos}
                className={`flex-1 sm:flex-initial inline-flex items-center justify-center gap-1.5 px-4 py-2 rounded-xl text-xs font-bold text-white shadow-lg transition-all ${
                  selectedPhotos.length > 0 
                    ? 'bg-rose-500 hover:bg-rose-600 shadow-rose-500/20' 
                    : 'bg-slate-300 dark:bg-slate-800 text-slate-400 dark:text-slate-600 cursor-not-allowed shadow-none'
                }`}
              >
                <FiTrash2 className="w-3.5 h-3.5" />
                <span>ลบรูปภาพที่เลือก</span>
              </button>
              <button
                onClick={() => {
                  setIsManageMode(false);
                  setSelectedPhotos([]);
                }}
                className="inline-flex items-center justify-center p-2 rounded-xl bg-slate-200 dark:bg-slate-800 text-slate-600 dark:text-slate-400 hover:bg-slate-300 dark:hover:bg-slate-700 transition-colors"
                title="ยกเลิกการเลือก"
              >
                <FiX className="w-4 h-4" />
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Skeletons Loading */}
      {isLoading && (
        <div className="space-y-4">
          <div className="flex items-center gap-3 p-4 bg-primary-500/5 text-primary-600 dark:text-primary-400 border border-primary-500/10 rounded-2xl">
            <div className="w-5 h-5 border-2 border-primary-500 border-t-transparent rounded-full animate-spin shrink-0" />
            <span className="text-xs font-bold">กำลังดึงข้อมูลและแกลเลอรีรูปภาพจาก Google Sheets/Drive...</span>
          </div>
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-3">
            {Array.from({ length: 12 }).map((_, i) => (
              <div key={i} className="aspect-square rounded-2xl bg-slate-200 dark:bg-slate-800 animate-pulse" />
            ))}
          </div>
        </div>
      )}

      {/* แท็บโฟลเดอร์ย่อย (แสดงเฉพาะเมื่อมีโฟลเดอร์ย่อยภายใน) */}
      {!isLoading && subfoldersList.length > 0 && (
        <div className="flex items-center gap-1.5 border-b border-slate-100 dark:border-slate-800 pb-2 mb-4 overflow-x-auto scrollbar-none">
          <button
            onClick={() => {
              setActiveSubfolderTab('ทั้งหมด');
              setSelectedPhotos([]);
            }}
            className={`px-3.5 py-1.5 rounded-full text-xs font-bold transition-all shrink-0 ${
              activeSubfolderTab === 'ทั้งหมด'
                ? 'bg-primary-500 text-white shadow-md shadow-primary-500/10'
                : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 hover:bg-slate-200 dark:hover:bg-slate-700'
            }`}
          >
            ภาพทั้งหมด ({photos.length})
          </button>
          
          <button
            onClick={() => {
              setActiveSubfolderTab('รูท');
              setSelectedPhotos([]);
            }}
            className={`px-3.5 py-1.5 rounded-full text-xs font-bold transition-all shrink-0 ${
              activeSubfolderTab === 'รูท'
                ? 'bg-primary-500 text-white shadow-md shadow-primary-500/10'
                : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 hover:bg-slate-200 dark:hover:bg-slate-700'
            }`}
          >
            โฟลเดอร์หลัก ({photos.filter(p => !p.subfolder).length})
          </button>

          {subfoldersList.map(folder => {
            const count = photos.filter(p => p.subfolder === folder).length;
            return (
              <button
                key={folder}
                onClick={() => {
                  setActiveSubfolderTab(folder);
                  setSelectedPhotos([]);
                }}
                className={`px-3.5 py-1.5 rounded-full text-xs font-bold transition-all shrink-0 flex items-center gap-1 ${
                  activeSubfolderTab === folder
                    ? 'bg-primary-500 text-white shadow-md shadow-primary-500/10'
                    : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 hover:bg-slate-200 dark:hover:bg-slate-700'
                }`}
              >
                <FiFolder className="w-3 h-3 text-indigo-400 dark:text-indigo-400 shrink-0" />
                <span>{folder} ({count})</span>
              </button>
            );
          })}
        </div>
      )}

      {/* รายการรูปภาพ */}
      {!isLoading && filteredPhotos.length > 0 && (
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-3">
          {filteredPhotos.map((photo, index) => {
            const isSelected = selectedPhotos.includes(photo.id);
            return (
              <motion.div
                key={photo.id}
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ delay: index * 0.03 }}
                className={`relative aspect-square rounded-2xl overflow-hidden bg-slate-100 dark:bg-slate-800 cursor-pointer shadow-sm transition-all duration-200 select-none group ${
                  isSelected ? 'ring-4 ring-primary-500 ring-offset-2 dark:ring-offset-slate-950 scale-[0.98]' : 'hover:shadow-md'
                }`}
                onClick={() => isManageMode ? toggleSelectPhoto(photo.id) : openLightbox(index)}
              >
                <img
                  src={transformDriveUrl(photo.image_url || photo.url, 400)}
                  alt={photo.caption || 'ภาพกิจกรรม'}
                  className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
                  loading="lazy"
                  decoding="async"
                />

                {/* ปุ่ม Checkbox มุมซ้ายบน */}
                {(isManageMode || isSelected) ? (
                  <div 
                    className="absolute top-2.5 left-2.5 z-20"
                    onClick={(e) => {
                      e.stopPropagation();
                      if (!isManageMode) setIsManageMode(true);
                      toggleSelectPhoto(photo.id);
                    }}
                  >
                    <div className={`w-6 h-6 rounded-lg flex items-center justify-center text-white transition-colors ${
                      isSelected ? 'bg-primary-500 shadow-md shadow-primary-500/20' : 'bg-black/40 border border-white/40'
                    }`}>
                      {isSelected && <FiCheck className="w-4 h-4 stroke-[3]" />}
                    </div>
                  </div>
                ) : (
                  <div 
                    className="absolute top-2.5 left-2.5 z-20 opacity-0 group-hover:opacity-100 transition-opacity duration-150"
                    onClick={(e) => {
                      e.stopPropagation();
                      setIsManageMode(true);
                      toggleSelectPhoto(photo.id);
                    }}
                  >
                    <div className="w-6 h-6 rounded-lg bg-black/40 border border-white/40 flex items-center justify-center text-white hover:bg-black/60 transition-colors">
                      <FiCheck className="w-3.5 h-3.5 opacity-40 hover:opacity-100" />
                    </div>
                  </div>
                )}

                {/* ปุ่ม Download มุมขวาบน */}
                {!isManageMode && (
                  <button
                    className="absolute top-2.5 right-2.5 z-20 opacity-0 group-hover:opacity-100 transition-opacity duration-150 p-1.5 rounded-lg bg-black/40 hover:bg-black/60 border border-white/20 text-white flex items-center justify-center"
                    onClick={(e) => {
                      e.stopPropagation();
                      const url = transformDriveUrl(photo.image_url || photo.url);
                      fetch(url)
                        .then(resp => resp.blob())
                        .then(blob => {
                          const blobUrl = window.URL.createObjectURL(blob);
                          const a = document.createElement('a');
                          a.href = blobUrl;
                          a.download = `photo_${photo.id || Date.now()}.jpg`;
                          document.body.appendChild(a);
                          a.click();
                          document.body.removeChild(a);
                          window.URL.revokeObjectURL(blobUrl);
                        })
                        .catch(() => {
                          const a = document.createElement('a');
                          a.href = url;
                          a.target = '_blank';
                          a.download = `photo_${photo.id || Date.now()}.jpg`;
                          document.body.appendChild(a);
                          a.click();
                          document.body.removeChild(a);
                        });
                    }}
                    title="ดาวน์โหลดรูปภาพ"
                  >
                    <FiDownload className="w-3.5 h-3.5" />
                  </button>
                )}

                {/* คำบรรยายตอน Hover */}
                {!isManageMode && (
                  <div className="absolute inset-0 bg-black/0 group-hover:bg-black/40 transition-colors flex items-end">
                    <div className="w-full p-2.5 opacity-0 group-hover:opacity-100 transition-opacity">
                      {photo.caption && (
                        <p className="text-white text-[10px] font-semibold truncate">{photo.caption}</p>
                      )}
                    </div>
                  </div>
                )}
              </motion.div>
            );
          })}
        </div>
      )}

      {/* โหมดมีภาพแต่ถูกกรองโดยแท็บแล้วว่าง */}
      {!isLoading && photos.length > 0 && filteredPhotos.length === 0 && (
        <div className="glass-card p-12 text-center space-y-3">
          <div className="w-16 h-16 rounded-2xl bg-slate-100 dark:bg-slate-800 flex items-center justify-center mx-auto">
            <FiFolder className="w-7 h-7 text-slate-300 dark:text-slate-600" />
          </div>
          <p className="text-sm font-bold text-slate-500 dark:text-slate-400">ไม่มีรูปภาพในโฟลเดอร์ย่อยนี้</p>
          <p className="text-xs text-slate-400 dark:text-slate-500">กรุณาสลับไปยังโฟลเดอร์ย่อยอื่นหรือภาพทั้งหมดเพื่อแสดงรูปภาพ</p>
        </div>
      )}

      {/* โหมดว่างไม่มีภาพเลยในกิจกรรม */}
      {!isLoading && photos.length === 0 && (
        <div className="glass-card p-12 text-center space-y-3">
          <div className="w-16 h-16 rounded-2xl bg-slate-100 dark:bg-slate-800 flex items-center justify-center mx-auto">
            <FiImage className="w-7 h-7 text-slate-300 dark:text-slate-600" />
          </div>
          <p className="text-sm font-bold text-slate-500 dark:text-slate-400">ยังไม่มีภาพถ่ายในอัลบั้มนี้</p>
          <p className="text-xs text-slate-400 dark:text-slate-500">กดปุ่ม "อัปโหลดรูปภาพ" หรือกดปุ่ม "ซิงค์จาก Google Drive" เพื่อนำเข้ารูปภาพเข้าตารางทันที</p>
        </div>
      )}

      {/* Lightbox Viewer */}
      <Lightbox
        photos={filteredPhotos}
        currentIndex={lightboxIndex}
        isOpen={lightboxOpen}
        onClose={() => setLightboxOpen(false)}
        onNavigate={setLightboxIndex}
      />
    </div>
  );
}
