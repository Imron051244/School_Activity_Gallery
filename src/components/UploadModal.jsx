import React, { useState, useRef, useEffect, useMemo } from 'react';
import { useForm } from 'react-hook-form';
import { motion, AnimatePresence } from 'framer-motion';
import { FiX, FiUpload, FiImage, FiFolder, FiEdit, FiPlus } from 'react-icons/fi';
import { getDriveFolderPath } from '../services/api';
import Swal from 'sweetalert2';


// รายชื่อเดือนภาษาไทย
const thaiMonths = [
  'มกราคม', 'กุมภาพันธ์', 'มีนาคม', 'เมษายน', 'พฤษภาคม', 'มิถุนายน',
  'กรกฎาคม', 'สิงหาคม', 'กันยายน', 'ตุลาคม', 'พฤศจิกายน', 'ธันวาคม'
];

// ฟังก์ชันย่อและบีบอัดรูปภาพฝั่งผู้ใช้ (Client-side Image Resizing & Compression)
const compressImage = (file, maxWidth = 1600, maxHeight = 1600, quality = 0.8) => {
  return new Promise((resolve, reject) => {
    // ข้ามไฟล์ที่ไม่ใช่รูปภาพ
    if (!file.type.startsWith('image/')) {
      reject(new Error('ไฟล์ไม่ใช่รูปภาพ'));
      return;
    }
    
    const reader = new FileReader();
    reader.readAsDataURL(file);
    reader.onload = (event) => {
      const img = new Image();
      img.src = event.target.result;
      img.onload = () => {
        const canvas = document.createElement('canvas');
        let width = img.width;
        let height = img.height;

        // คำนวณขนาดย่อโดยยังรักษาอัตราส่วนเดิม (Aspect Ratio)
        if (width > height) {
          if (width > maxWidth) {
            height = Math.round((height * maxWidth) / width);
            width = maxWidth;
          }
        } else {
          if (height > maxHeight) {
            width = Math.round((width * maxHeight) / height);
            height = maxHeight;
          }
        }

        canvas.width = width;
        canvas.height = height;

        const ctx = canvas.getContext('2d');
        ctx.drawImage(img, 0, 0, width, height);

        // บีบอัดไฟล์ในฟอร์แมต JPEG ด้วยคุณภาพระดับมาตรฐาน 80%
        const compressedBase64 = canvas.toDataURL('image/jpeg', quality);
        resolve(compressedBase64);
      };
      img.onerror = (err) => reject(err);
    };
    reader.onerror = (err) => reject(err);
  });
};

export default function UploadModal({ 
  type = 'album', 
  isOpen, 
  onClose, 
  albums = [], 
  selectedAlbumId, 
  initialData = null, 
  categories = [],
  onSubmit 
}) {
  const { register, handleSubmit, watch, reset, setValue, formState: { errors, isSubmitting } } = useForm();
  
  // สำหรับการสร้าง/แก้ไขอัลบั้ม (รูปภาพเดียว)
  const [previewImage, setPreviewImage] = useState(null);
  
  // สำหรับการอัปโหลดรูปภาพกิจกรรม (หลายรูปภาพ)
  const [previewImages, setPreviewImages] = useState([]); 
  
  const fileInputRef = useRef(null);

  const watchDate = watch('date');
  const watchTitle = watch('title');
  const watchAlbumId = watch('album_id');
  const watchCategory = watch('category');

  // สถานะตัวเลือก วัน เดือน ปี (พ.ศ.) ในภาษาไทย
  const [selDay, setSelDay] = useState(new Date().getDate());
  const [selMonth, setSelMonth] = useState(new Date().getMonth());
  const [selYearBE, setSelYearBE] = useState(new Date().getFullYear() + 543);

  // สร้างอาร์เรย์วัน (1-31)
  const daysArray = useMemo(() => Array.from({ length: 31 }, (_, i) => i + 1), []);
  // สร้างอาร์เรย์ปี พ.ศ. ย้อนหลัง 5 ปี และล่วงหน้า 5 ปี
  const yearsBEArray = useMemo(() => {
    const currentYearBE = new Date().getFullYear() + 543;
    return Array.from({ length: 15 }, (_, i) => (currentYearBE - 10) + i);
  }, []);

  // ซิงก์ค่าตัวเลือก วัน-เดือน-ปี ภาษาไทย กลับไปเป็นค่ารูปแบบสากล (YYYY-MM-DD) ของฟอร์มหลัก
  useEffect(() => {
    if (type === 'album' || type === 'edit-album') {
      const yearAD = selYearBE - 543;
      const monthStr = String(selMonth + 1).padStart(2, '0');
      const dayStr = String(selDay).padStart(2, '0');
      const dateStr = `${yearAD}-${monthStr}-${dayStr}`;
      setValue('date', dateStr);
    }
  }, [selDay, selMonth, selYearBE, setValue, type]);

  // โหลดข้อมูลเก่าลงในฟอร์มเมื่อเข้าโหมดแก้ไขอัลบั้ม
  useEffect(() => {
    if (isOpen) {
      if (initialData) {
        setValue('title', initialData.title || '');
        setValue('category', initialData.category || '');
        setValue('date', initialData.date || '');
        setValue('description', initialData.description || '');
        setPreviewImage(initialData.cover_image || null);

        // โหลดลิงก์เดิมที่ระบุมา
        if (initialData.drive_folder_path && initialData.drive_folder_path.startsWith('http')) {
          setValue('custom_folder_url', initialData.drive_folder_path);
        } else {
          setValue('custom_folder_url', '');
        }

        // แปลงวันที่แบบสากลเป็นตัวเลือกภาษาไทย
        if (initialData.date) {
          const d = new Date(initialData.date);
          if (!isNaN(d.getTime())) {
            setSelDay(d.getDate());
            setSelMonth(d.getMonth());
            setSelYearBE(d.getFullYear() + 543);
          }
        }
      } else {
        reset();
        setPreviewImage(null);
        setPreviewImages([]);
        setValue('custom_folder_url', '');
        // รีเซ็ตตัวเลือกวันเวลาภาษาไทยกลับเป็นวันปัจจุบัน
        const d = new Date();
        setSelDay(d.getDate());
        setSelMonth(d.getMonth());
        setSelYearBE(d.getFullYear() + 543);
      }
    }
  }, [isOpen, initialData, setValue, reset]);

  // คำนวณพาธจำลอง Drive สำหรับอัลบั้ม
  const simulatedPath = (type === 'album' || type === 'edit-album')
    ? getDriveFolderPath(watchDate, watchTitle, watchCategory)
    : '';

  // คำนวณพาธจำลอง Drive สำหรับรูปภาพใหม่
  const selectedAlbumPath = (() => {
    if (type !== 'photo') return '';
    const album = albums.find(a => a.id === (watchAlbumId || selectedAlbumId));
    return album ? getDriveFolderPath(album.date, album.title, album.category) : '';
  })();

  // จัดการเลือกไฟล์
  const handleFileChange = (e) => {
    const files = Array.from(e.target.files || []);
    if (files.length === 0) return;

    if (type === 'album' || type === 'edit-album') {
      const file = files[0];
      compressImage(file, 1600, 1600, 0.8)
        .then(compressedBase64 => {
          setPreviewImage(compressedBase64);
        })
        .catch(err => {
          console.error("Compression error, falling back to original FileReader:", err);
          const reader = new FileReader();
          reader.onloadend = () => {
            setPreviewImage(reader.result);
          };
          reader.readAsDataURL(file);
        });
    } else {
      files.forEach(file => {
        compressImage(file, 1600, 1600, 0.8)
          .then(compressedBase64 => {
            setPreviewImages(prev => [
              ...prev,
              {
                id: `img-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
                base64: compressedBase64,
                name: file.name
              }
            ]);
          })
          .catch(err => {
            console.error("Compression error, falling back to original FileReader:", err);
            const reader = new FileReader();
            reader.onloadend = () => {
              setPreviewImages(prev => [
                ...prev,
                {
                  id: `img-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
                  base64: reader.result,
                  name: file.name
                }
              ]);
            };
            reader.readAsDataURL(file);
          });
      });
    }
    e.target.value = '';
  };

  // ลบรูปออกจากรายการเตรียมอัปโหลด
  const removePreviewImage = (id) => {
    setPreviewImages(prev => prev.filter(img => img.id !== id));
  };

  // ส่งฟอร์ม
  const onFormSubmit = async (data) => {
    try {
      if (type === 'album') {
        Swal.fire({
          title: 'กำลังสร้างอัลบั้มกิจกรรม...',
          text: 'กำลังตั้งค่าระบบและเปิดโฟลเดอร์สำหรับจัดเก็บรูปภาพในระบบคลาวด์',
          allowOutsideClick: false,
          didOpen: () => {
            Swal.showLoading();
          },
          customClass: {
            popup: 'rounded-3xl font-sans text-sm',
          }
        });
        await onSubmit({
          title: data.title,
          category: data.category,
          date: data.date,
          description: data.description || '',
          tags: '',
          cover_image: previewImage || ''
        });
      } else if (type === 'edit-album') {
        Swal.fire({
          title: 'กำลังบันทึกการแก้ไข...',
          text: 'กำลังปรับปรุงข้อมูลในฐานข้อมูลแผ่นงาน',
          allowOutsideClick: false,
          didOpen: () => {
            Swal.showLoading();
          },
          customClass: {
            popup: 'rounded-3xl font-sans text-sm',
          }
        });
        await onSubmit(initialData.id, {
          title: data.title,
          category: data.category,
          date: data.date,
          description: data.description || '',
          tags: '',
          cover_image: previewImage || ''
        });
      } else {
        if (previewImages.length === 0) {
          Swal.fire({
            title: 'คำเตือน!',
            text: 'กรุณาเลือกรูปภาพอย่างน้อย 1 ภาพ',
            icon: 'warning',
            confirmButtonText: 'ตกลง',
            confirmButtonColor: '#f59e0b',
          });
          return;
        }

        Swal.fire({
          title: 'กำลังอัปโหลดรูปภาพกิจกรรม...',
          html: `กำลังเตรียมความพร้อมในการอัปโหลดภาพ (0/${previewImages.length})`,
          allowOutsideClick: false,
          didOpen: () => {
            Swal.showLoading();
          },
          customClass: {
            popup: 'rounded-3xl font-sans text-sm',
          }
        });

        // อัปโหลดเรียงลำดับทีละรูปภาพเพื่อป้องกันปัญหา Race Conditions (อัปโหลดข้อมูลไม่เข้า) ในชีต
        for (let i = 0; i < previewImages.length; i++) {
          const img = previewImages[i];
          Swal.update({
            html: `กำลังอัปโหลดรูปภาพที่ <strong>${i + 1}</strong> จาก <strong>${previewImages.length}</strong> ภาพ<br/><span class="text-[11px] text-slate-400">กรุณาอย่าปิดหน้าจอหรือเปลี่ยนหน้าต่างนี้</span>`
          });
          
          await onSubmit(data.album_id || selectedAlbumId, {
            caption: data.caption || '',
            photographer: '',
            fileBase64: img.base64,
            fileName: img.name,
            isBatch: true
          });
        }
        
        Swal.close();
        Swal.fire({
          title: 'อัปโหลดสำเร็จ!',
          text: `นำเข้าภาพถ่ายกิจกรรมทั้งหมดจำนวน ${previewImages.length} รูปภาพเรียบร้อยแล้ว`,
          icon: 'success',
          confirmButtonText: 'ตกลง',
          confirmButtonColor: '#10b981',
          customClass: {
            popup: 'rounded-3xl font-sans text-sm',
          }
        });
      }

      reset();
      setPreviewImage(null);
      setPreviewImages([]);
      onClose();
    } catch (err) {
      console.error('Submit error:', err);
      Swal.fire({
        title: 'เกิดข้อผิดพลาด!',
        text: err.message || 'ไม่สามารถบันทึกข้อมูลได้สำเร็จ',
        icon: 'error',
        confirmButtonColor: '#ef4444',
      });
    }
  };

  const handleClose = () => {
    reset();
    setPreviewImage(null);
    setPreviewImages([]);
    onClose();
  };

  const isEditMode = type === 'edit-album';
  const isPhotoType = type === 'photo';

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          {/* Overlay */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-[80] bg-black/40 backdrop-blur-sm"
            onClick={handleClose}
          />

          {/* Modal */}
          <motion.div
            initial={{ opacity: 0, scale: 0.95, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: 20 }}
            transition={{ type: 'spring', damping: 25, stiffness: 300 }}
            className="fixed inset-0 z-[85] flex items-center justify-center p-4"
          >
            <div className="bg-white dark:bg-slate-900 rounded-3xl shadow-2xl w-full max-w-lg max-h-[85vh] overflow-y-auto border border-slate-200 dark:border-slate-800" onClick={(e) => e.stopPropagation()}>
              {/* Header */}
              <div className="flex items-center justify-between p-5 border-b border-slate-100 dark:border-slate-800">
                <div className="flex items-center gap-3">
                  <div className={`w-10 h-10 rounded-xl flex items-center justify-center text-white shadow-md ${
                    isEditMode 
                      ? 'bg-gradient-to-br from-amber-500 to-orange-600'
                      : type === 'album' 
                        ? 'bg-gradient-to-br from-primary-500 to-indigo-600' 
                        : 'bg-gradient-to-br from-emerald-500 to-teal-600'
                  }`}>
                    {isEditMode ? <FiEdit className="w-5 h-5" /> : type === 'album' ? <FiFolder className="w-5 h-5" /> : <FiImage className="w-5 h-5" />}
                  </div>
                  <div>
                    <h3 className="text-base font-bold text-slate-800 dark:text-white">
                      {isEditMode ? 'แก้ไขข้อมูลอัลบั้มกิจกรรม' : type === 'album' ? 'สร้างอัลบั้มกิจกรรมใหม่' : 'อัปโหลดรูปภาพกิจกรรม'}
                    </h3>
                    <p className="text-[10px] text-slate-400 dark:text-slate-500 font-medium">
                      {isEditMode ? 'บันทึกการแก้ไขรายละเอียดอัลบั้ม' : type === 'album' ? 'เพิ่มอัลบั้มใหม่ลงในคลัง' : 'เพิ่มรูปภาพเข้าอัลบั้มที่เลือก'}
                    </p>
                  </div>
                </div>
                <button onClick={handleClose} className="p-2 rounded-lg text-slate-400 hover:text-slate-600 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors">
                  <FiX className="w-5 h-5" />
                </button>
              </div>

              {/* Form */}
              <form onSubmit={handleSubmit(onFormSubmit)} className="p-5 space-y-4">
                {(type === 'album' || isEditMode) ? (
                  <>
                    {/* ชื่อกิจกรรม */}
                    <div>
                      <label className="block text-[10px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider mb-1.5">
                        ชื่อกิจกรรม *
                      </label>
                      <input
                        type="text"
                        placeholder="เช่น กิจกรรมวันไหว้ครู ปี 2570"
                        className="w-full px-4 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-transparent text-sm focus:outline-none focus:border-primary-500 transition-colors dark:text-white"
                        {...register('title', { required: 'กรุณากรอกชื่อกิจกรรม' })}
                      />
                      {errors.title && <p className="text-[10px] text-rose-500 mt-1">{errors.title.message}</p>}
                    </div>

                    {/* หมวดหมู่ + วันที่จัดกิจกรรมแบบภาษาไทย */}
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
                      <div>
                        <label className="block text-[10px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider mb-1.5">
                          หมวดหมู่ *
                        </label>
                        <select
                          className="w-full px-4 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-transparent text-sm focus:outline-none focus:border-primary-500 transition-colors dark:text-white"
                          {...register('category', { required: 'เลือกหมวดหมู่' })}
                        >
                          <option value="">เลือก...</option>
                          {categories.map(cat => (
                            <option key={cat} value={cat}>{cat}</option>
                          ))}
                        </select>
                        {errors.category && <p className="text-[10px] text-rose-500 mt-1">{errors.category.message}</p>}
                      </div>
                      
                      {/* วันที่จัดกิจกรรม - ออกแบบให้เป็นตัวเลือก วัน เดือน ปี (พ.ศ.) ภาษาไทย โดยตรง */}
                      <div>
                        <label className="block text-[10px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider mb-1.5">
                          วันที่จัดกิจกรรม (พ.ศ.) *
                        </label>
                        <div className="grid grid-cols-3 gap-1.5">
                          {/* เลือกวัน */}
                          <select
                            value={selDay}
                            onChange={(e) => setSelDay(Number(e.target.value))}
                            className="w-full px-2 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-xs focus:outline-none focus:border-primary-500 transition-colors dark:text-white font-medium"
                          >
                            {daysArray.map(d => (
                              <option key={d} value={d}>วัน {d}</option>
                            ))}
                          </select>
                          
                          {/* เลือกเดือน */}
                          <select
                            value={selMonth}
                            onChange={(e) => setSelMonth(Number(e.target.value))}
                            className="w-full px-1.5 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-xs focus:outline-none focus:border-primary-500 transition-colors dark:text-white font-medium"
                          >
                            {thaiMonths.map((m, index) => (
                              <option key={m} value={index}>{m}</option>
                            ))}
                          </select>
                          
                          {/* เลือกปี พ.ศ. */}
                          <select
                            value={selYearBE}
                            onChange={(e) => setSelYearBE(Number(e.target.value))}
                            className="w-full px-2 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-xs focus:outline-none focus:border-primary-500 transition-colors dark:text-white font-medium"
                          >
                            {yearsBEArray.map(y => (
                              <option key={y} value={y}>พ.ศ. {y}</option>
                            ))}
                          </select>
                        </div>
                        {/* ซ่อนข้อมูลวันที่ไว้เพื่อส่งค่าผ่าน useForm */}
                        <input type="hidden" {...register('date', { required: 'ระบุวันที่จัดกิจกรรม' })} />
                        {errors.date && <p className="text-[10px] text-rose-500 mt-1">{errors.date.message}</p>}
                      </div>
                    </div>

                    {/* รายละเอียด */}
                    <div>
                      <label className="block text-[10px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider mb-1.5">
                        รายละเอียดกิจกรรม
                      </label>
                      <textarea
                        placeholder="อธิบายรายละเอียดกิจกรรมสั้นๆ..."
                        rows={3}
                        className="w-full px-4 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-transparent text-sm focus:outline-none focus:border-primary-500 transition-colors resize-none dark:text-white"
                        {...register('description')}
                      />
                    </div>

                    {/* พาธ Drive จำลอง */}
                    {simulatedPath && (
                      <div className="p-3 bg-slate-50 dark:bg-slate-800/50 rounded-xl border border-slate-100 dark:border-slate-800 space-y-1">
                        <p className="text-[10px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-wider flex items-center gap-1.5">
                          <FiFolder className="w-3 h-3" /> พาธจัดเก็บบน Google Drive (จำลอง)
                        </p>
                        <p className="text-xs font-mono text-primary-600 dark:text-primary-400 break-all">{simulatedPath}</p>
                      </div>
                    )}
                  </>
                ) : (
                  <>
                    {/* เลือกอัลบั้ม */}
                    <div>
                      <label className="block text-[10px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider mb-1.5">
                        เลือกอัลบั้มปลายทาง *
                      </label>
                      <select
                        className="w-full px-4 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-transparent text-sm focus:outline-none focus:border-primary-500 transition-colors dark:text-white"
                        defaultValue={selectedAlbumId}
                        {...register('album_id', { required: 'เลือกอัลบั้ม' })}
                      >
                        {albums.map(album => (
                          <option key={album.id} value={album.id}>{album.title}</option>
                        ))}
                      </select>
                    </div>

                    {/* คำบรรยายภาพ */}
                    <div>
                      <label className="block text-[10px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider mb-1.5">
                        คำบรรยายภาพ (จะใช้กับรูปภาพทั้งหมดที่อัปโหลดพร้อมกันชุดนี้)
                      </label>
                      <input
                        type="text"
                        placeholder="เช่น บรรยากาศภายในงาน"
                        className="w-full px-4 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-transparent text-sm focus:outline-none focus:border-primary-500 transition-colors dark:text-white"
                        {...register('caption')}
                      />
                    </div>

                    {/* พาธ Drive ของอัลบั้ม */}
                    {selectedAlbumPath && (
                      <div className="p-3 bg-slate-50 dark:bg-slate-800/50 rounded-xl border border-slate-100 dark:border-slate-800 space-y-1">
                        <p className="text-[10px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-wider flex items-center gap-1.5">
                          <FiFolder className="w-3 h-3" /> จัดเก็บลงโฟลเดอร์
                        </p>
                        <p className="text-xs font-mono text-emerald-600 dark:text-emerald-400 break-all">{selectedAlbumPath}</p>
                      </div>
                    )}
                  </>
                )}

                {/* ส่วนการเลือกและอัปโหลดรูป */}
                <div>
                  <label className="block text-[10px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider mb-1.5">
                    {isEditMode ? 'เปลี่ยนรูปภาพปก (ไม่บังคับ)' : type === 'album' ? 'ภาพปกอัลบั้ม (ไม่บังคับ)' : 'เลือกรูปภาพกิจกรรม (เลือกได้หลายภาพ) *'}
                  </label>
                  
                  {isPhotoType && previewImages.length > 0 ? (
                    <div className="border border-slate-200 dark:border-slate-800 p-3 rounded-2xl space-y-3">
                      <div className="grid grid-cols-4 gap-2.5 max-h-52 overflow-y-auto pr-1">
                        {previewImages.map(img => (
                          <div key={img.id} className="relative aspect-square rounded-xl overflow-hidden border border-slate-100 dark:border-slate-800 group bg-slate-50 dark:bg-slate-950">
                            <img src={img.base64} alt="preview" className="w-full h-full object-cover" />
                            <button
                              type="button"
                              onClick={() => removePreviewImage(img.id)}
                              className="absolute top-1 right-1 p-1 bg-rose-500 text-white rounded-md opacity-90 hover:opacity-100 transition-opacity"
                              title="ลบออกจากรายการ"
                            >
                              <FiX className="w-3 h-3" />
                            </button>
                          </div>
                        ))}
                        <button
                          type="button"
                          onClick={() => fileInputRef.current?.click()}
                          className="aspect-square rounded-xl border-2 border-dashed border-slate-200 dark:border-slate-700 hover:border-primary-500 dark:hover:border-primary-500 flex flex-col items-center justify-center text-slate-400 dark:text-slate-500 transition-colors"
                        >
                          <FiPlus className="w-5 h-5" />
                          <span className="text-[9px] font-bold mt-1">เพิ่มภาพ</span>
                        </button>
                      </div>
                      
                      <div className="flex items-center justify-between text-[10px] text-slate-400 font-semibold border-t pt-2 dark:border-slate-800">
                        <span>เลือกไว้ทั้งหมด {previewImages.length} ภาพ</span>
                        <button 
                          type="button" 
                          onClick={() => setPreviewImages([])} 
                          className="text-rose-500 hover:underline"
                        >
                          ล้างรายการทั้งหมด
                        </button>
                      </div>
                    </div>
                  ) : (
                    <div
                      onClick={() => fileInputRef.current?.click()}
                      className="relative border-2 border-dashed border-slate-200 dark:border-slate-700 rounded-xl p-6 text-center cursor-pointer hover:border-primary-500 dark:hover:border-primary-500 transition-colors group"
                    >
                      {previewImage ? (
                        <div className="relative inline-block max-h-40 mx-auto rounded-lg overflow-hidden">
                          <img src={previewImage} alt="Preview" className="max-h-40 object-contain rounded-lg" />
                          <button
                            type="button"
                            onClick={(e) => {
                              e.stopPropagation();
                              setPreviewImage(null);
                            }}
                            className="absolute top-2 right-2 p-1.5 bg-rose-500 hover:bg-rose-600 text-white rounded-lg shadow-md transition-all z-10"
                            title="ลบภาพปกออก"
                          >
                            <FiX className="w-4 h-4" />
                          </button>
                        </div>
                      ) : (
                        <div className="space-y-2">
                          <FiUpload className="w-8 h-8 mx-auto text-slate-300 dark:text-slate-600 group-hover:text-primary-500 transition-colors" />
                          <p className="text-xs text-slate-400 dark:text-slate-500 font-medium">คลิกเพื่อเลือกไฟล์ภาพ</p>
                          <p className="text-[10px] text-slate-300 dark:text-slate-600">
                            {isPhotoType ? 'เลือกได้ครั้งละหลายรูปพร้อมกัน' : 'JPG, PNG, WebP (ไม่เกิน 10MB)'}
                          </p>
                        </div>
                      )}
                    </div>
                  )}

                  <input
                    ref={fileInputRef}
                    type="file"
                    accept="image/*"
                    multiple={isPhotoType}
                    className="hidden"
                    onChange={handleFileChange}
                  />
                </div>

                {/* ปุ่มบันทึก */}
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className={`w-full py-3 rounded-xl text-white font-bold text-sm transition-all active:scale-[0.98] shadow-lg flex items-center justify-center gap-2
                    ${isEditMode
                      ? 'bg-gradient-to-r from-amber-500 to-orange-600 hover:from-amber-600 hover:to-orange-700 shadow-orange-500/20'
                      : type === 'album'
                        ? 'bg-gradient-to-r from-primary-500 to-indigo-600 hover:from-primary-600 hover:to-indigo-700 shadow-primary-500/20'
                        : 'bg-gradient-to-r from-emerald-500 to-teal-600 hover:from-emerald-600 hover:to-teal-700 shadow-emerald-500/20'
                    }
                    ${isSubmitting ? 'opacity-70 cursor-not-allowed' : ''}
                  `}
                >
                  {isSubmitting ? (
                    <span className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                  ) : (
                    <>
                      {isEditMode ? <FiEdit className="w-4 h-4" /> : type === 'album' ? <FiFolder className="w-4 h-4" /> : <FiUpload className="w-4 h-4" />}
                      <span>
                        {isEditMode 
                          ? 'บันทึกการแก้ไข' 
                          : type === 'album' 
                            ? 'สร้างอัลบั้ม' 
                            : `อัปโหลด ${previewImages.length > 0 ? previewImages.length : ''} รูปภาพ`
                        }
                      </span>
                    </>
                  )}
                </button>
              </form>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}
