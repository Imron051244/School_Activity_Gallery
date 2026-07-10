import React, { useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { FiX, FiChevronLeft, FiChevronRight, FiDownload } from 'react-icons/fi';
import { transformDriveUrl } from '../services/api';

export default function Lightbox({ photos = [], currentIndex = 0, isOpen, onClose, onNavigate }) {
  const current = photos[currentIndex];
  const hasPrev = currentIndex > 0;
  const hasNext = currentIndex < photos.length - 1;

  // ควบคุมด้วยคีย์บอร์ด
  const handleKeyDown = useCallback((e) => {
    if (!isOpen) return;
    if (e.key === 'Escape') onClose();
    if (e.key === 'ArrowLeft' && hasPrev) onNavigate(currentIndex - 1);
    if (e.key === 'ArrowRight' && hasNext) onNavigate(currentIndex + 1);
  }, [isOpen, currentIndex, hasPrev, hasNext, onClose, onNavigate]);

  useEffect(() => {
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [handleKeyDown]);

  // ล็อค scroll body
  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = '';
    }
    return () => { document.body.style.overflow = ''; };
  }, [isOpen]);

  if (!current) return null;

  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 z-[100] bg-black/90 backdrop-blur-md flex flex-col items-center justify-center"
          onClick={onClose}
        >
          {/* ปุ่มปิด */}
          <button
            onClick={onClose}
            className="absolute top-4 right-4 z-10 p-2.5 rounded-xl bg-white/10 hover:bg-white/20 text-white transition-colors"
            title="ปิดหน้าต่าง"
          >
            <FiX className="w-5 h-5" />
          </button>

          {/* ปุ่มดาวน์โหลด */}
          <button
            onClick={(e) => {
              e.stopPropagation();
              const url = transformDriveUrl(current.image_url || current.url);
              
              // กลไกดาวน์โหลดแบบครอบคลุม: พยายามดึงเป็น Blob ก่อนเพื่อดาวน์โหลดเงียบ (ช่วยให้ตั้งชื่อไฟล์ได้)
              // หากติด CORS จะเปิดในแท็บใหม่เพื่อเซฟอัตโนมัติ
              fetch(url)
                .then(resp => resp.blob())
                .then(blob => {
                  const blobUrl = window.URL.createObjectURL(blob);
                  const a = document.createElement('a');
                  a.href = blobUrl;
                  a.download = `photo_${current.id || Date.now()}.jpg`;
                  document.body.appendChild(a);
                  a.click();
                  document.body.removeChild(a);
                  window.URL.revokeObjectURL(blobUrl);
                })
                .catch(() => {
                  const a = document.createElement('a');
                  a.href = url;
                  a.target = '_blank';
                  a.download = `photo_${current.id || Date.now()}.jpg`;
                  document.body.appendChild(a);
                  a.click();
                  document.body.removeChild(a);
                });
            }}
            className="absolute top-4 right-16 z-10 p-2.5 rounded-xl bg-white/10 hover:bg-white/20 text-white transition-colors flex items-center gap-1.5 text-xs font-bold"
            title="ดาวน์โหลดรูปภาพลงเครื่อง"
          >
            <FiDownload className="w-4 h-4" />
            <span className="hidden sm:inline">ดาวน์โหลด</span>
          </button>

          {/* ตัวนับ */}
          <div className="absolute top-4 left-4 z-10 px-3 py-1.5 rounded-full bg-white/10 text-white text-xs font-bold backdrop-blur-md">
            {currentIndex + 1} / {photos.length}
          </div>

          {/* ภาพ */}
          <motion.div
            key={current.id}
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.95 }}
            transition={{ duration: 0.2 }}
            className="relative max-w-[90vw] max-h-[75vh] flex items-center justify-center"
            onClick={(e) => e.stopPropagation()}
          >
            <img
              src={transformDriveUrl(current.image_url || current.url, 1600)}
              alt={current.caption || 'ภาพกิจกรรม'}
              className="max-w-full max-h-[75vh] object-contain rounded-lg shadow-2xl"
            />
          </motion.div>

          {/* ปุ่มเลื่อนซ้าย */}
          {hasPrev && (
            <button
              onClick={(e) => { e.stopPropagation(); onNavigate(currentIndex - 1); }}
              className="absolute left-4 top-1/2 -translate-y-1/2 p-3 rounded-xl bg-white/10 hover:bg-white/20 text-white transition-colors"
            >
              <FiChevronLeft className="w-6 h-6" />
            </button>
          )}

          {/* ปุ่มเลื่อนขวา */}
          {hasNext && (
            <button
              onClick={(e) => { e.stopPropagation(); onNavigate(currentIndex + 1); }}
              className="absolute right-4 top-1/2 -translate-y-1/2 p-3 rounded-xl bg-white/10 hover:bg-white/20 text-white transition-colors"
            >
              <FiChevronRight className="w-6 h-6" />
            </button>
          )}

          {/* ข้อมูลภาพด้านล่าง */}
          <div className="absolute bottom-0 left-0 right-0 p-5 bg-gradient-to-t from-black/80 to-transparent" onClick={(e) => e.stopPropagation()}>
            <div className="max-w-2xl mx-auto text-center space-y-1.5">
              {current.caption && (
                <p className="text-white text-sm font-semibold">{current.caption}</p>
              )}

            </div>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
