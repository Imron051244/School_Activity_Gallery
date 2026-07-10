import React, { useState, useEffect, useRef } from 'react';
import { useForm } from 'react-hook-form';
import Swal from 'sweetalert2';
import { 
  FiSettings, FiLink, FiServer, FiSave, FiDatabase, FiFolder, 
  FiHelpCircle, FiPlus, FiTrash2, FiLayers, FiImage, FiUpload, 
  FiRefreshCw, FiX, FiRotateCw, FiRotateCcw, FiMaximize, FiMinimize 
} from 'react-icons/fi';
import { motion, AnimatePresence } from 'framer-motion';

export default function Settings({ 
  categories = [], 
  onAddCategory, 
  onDeleteCategory,
  branding = { name: 'School Gallery', subtitle: 'แกลเลอรีภาพกิจกรรมโรงเรียน', logo: null },
  onUpdateBranding,
  apiUrl = '',
  onUpdateApiUrl
}) {
  const [newCategoryName, setNewCategoryName] = useState('');
  const [apiEnabled, setApiEnabled] = useState(!!apiUrl);

  const [previewLogo, setPreviewLogo] = useState(branding.logo);
  const fileInputRef = useRef(null);

  // สเตทสําหรับการตัดแต่งรูปภาพโลโก้
  const [originalLogo, setOriginalLogo] = useState(null);
  const [isCropModalOpen, setIsCropModalOpen] = useState(false);
  const [zoom, setZoom] = useState(1);
  const [rotation, setRotation] = useState(0);
  const [offset, setOffset] = useState({ x: 0, y: 0 });
  const [dragging, setDragging] = useState(false);
  const [dragStart, setDragStart] = useState({ x: 0, y: 0 });

  const { register: registerApi, handleSubmit: handleSubmitApi, setValue: setApiValue } = useForm();
  const { register: registerBrand, handleSubmit: handleSubmitBrand, setValue: setBrandValue } = useForm();

  // โหลดค่า API เริ่มต้น
  useEffect(() => {
    setApiEnabled(!!apiUrl);
    setApiValue('api_url', apiUrl);
    setApiValue('api_enabled', !!apiUrl);
  }, [apiUrl, setApiValue]);

  // โหลดค่า แบรนดิ้ง เริ่มต้นลงในฟอร์ม
  useEffect(() => {
    setBrandValue('brand_name', branding.name);
    setBrandValue('brand_subtitle', branding.subtitle);
    setPreviewLogo(branding.logo);
  }, [branding, setBrandValue]);

  const onApiSubmit = (data) => {
    const targetUrl = (data.api_url || '').trim();

    if (data.api_enabled && !targetUrl.startsWith('https://script.google.com/')) {
      Swal.fire({
        title: 'รูปแบบไม่ถูกต้อง',
        text: 'URL ต้องขึ้นต้นด้วย https://script.google.com/',
        icon: 'error',
        confirmButtonColor: '#f43f5e',
      });
      return;
    }

    onUpdateApiUrl(targetUrl, !!data.api_enabled);

    Swal.fire({
      title: 'บันทึกการตั้งค่าสำเร็จ!',
      text: data.api_enabled
        ? 'เชื่อมต่อ Google Sheets จริงเรียบร้อยแล้ว (ระบบจะจดจำค่านี้ไว้ในเครื่องนี้สำหรับการเข้าใช้งานครั้งต่อไป)'
        : 'สลับเข้าสู่โหมดจำลอง (LocalStorage) เรียบร้อยแล้ว',
      icon: 'success',
      confirmButtonText: 'ตกลง',
      confirmButtonColor: '#4f70fa',
    });
  };

  // จัดการบันทึกฟอร์มแบรนดิ้งโรงเรียน
  const onBrandSubmit = (data) => {
    onUpdateBranding({
      name: data.brand_name.trim() || 'School Gallery',
      subtitle: data.brand_subtitle.trim() || 'แกลเลอรีภาพกิจกรรมโรงเรียน',
      logo: previewLogo
    });

    Swal.fire({
      title: 'ปรับแต่งระบบสำเร็จ!',
      text: 'เปลี่ยนชื่อระบบและภาพลักษณ์โลโก้ใหม่เรียบร้อยแล้ว',
      icon: 'success',
      confirmButtonText: 'ตกลง',
      confirmButtonColor: '#4f70fa',
    });
  };

  // เมื่อเลือกไฟล์รูปภาพโลโก้
  const handleLogoFileChange = (e) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        setOriginalLogo(reader.result);
        // เปิดหน้าต่างตัดแต่งรูปภาพ
        setZoom(1);
        setRotation(0);
        setOffset({ x: 0, y: 0 });
        setIsCropModalOpen(true);
      };
      reader.readAsDataURL(file);
    }
    e.target.value = ''; // เคลียร์ค่าเพื่อให้เลือกไฟล์ซ้ำได้
  };

  // เริ่มต้นลากภาพเพื่อปรับตำแหน่ง (เมาส์)
  const handleDragStart = (e) => {
    setDragging(true);
    setDragStart({
      x: e.clientX - offset.x,
      y: e.clientY - offset.y
    });
  };

  // ระหว่างลากภาพ (เมาส์)
  const handleDragMove = (e) => {
    if (!dragging) return;
    setOffset({
      x: e.clientX - dragStart.x,
      y: e.clientY - dragStart.y
    });
  };

  // สิ้นสุดการลาก
  const handleDragEnd = () => {
    setDragging(false);
  };

  // สำหรับอุปกรณ์สัมผัสหน้าจอ (Touch devices)
  const handleTouchStart = (e) => {
    const touch = e.touches[0];
    setDragging(true);
    setDragStart({
      x: touch.clientX - offset.x,
      y: touch.clientY - offset.y
    });
  };

  const handleTouchMove = (e) => {
    if (!dragging) return;
    const touch = e.touches[0];
    setOffset({
      x: touch.clientX - dragStart.x,
      y: touch.clientY - dragStart.y
    });
  };

  // ยืนยันการตัดภาพและเรนเดอร์ลง Canvas เพื่อแปลงเป็นรูปภาพโลโก้จัตุรัสแบบครอบตัดจริง
  const handleConfirmCrop = () => {
    const img = new Image();
    img.src = originalLogo;
    img.onload = () => {
      const canvas = document.createElement('canvas');
      const size = 200; // ขนาดรูปภาพผลลัพธ์
      canvas.width = size;
      canvas.height = size;
      const ctx = canvas.getContext('2d');

      // เคลียร์พื้นหลังเป็นโปร่งแสง
      ctx.fillStyle = 'rgba(255, 255, 255, 0)';
      ctx.fillRect(0, 0, size, size);

      // เลื่อนตำแหน่งจุดหมุนไปตรงกลาง
      ctx.translate(size / 2, size / 2);
      // หมุนภาพ
      ctx.rotate((rotation * Math.PI) / 180);
      // ซูมภาพ
      ctx.scale(zoom, zoom);
      
      // เลื่อนตำแหน่งตามที่ผู้ใช้ลากขยับ (หน้าต่างพรีวิวขนาด 192px หรือ w-48)
      const ratio = size / 192;
      ctx.translate((offset.x * ratio) / zoom, (offset.y * ratio) / zoom);

      // วาดรูปภาพให้อยู่ตรงกลางครอบคลุมพื้นที่ canvas
      const scaleToCover = Math.max(size / img.width, size / img.height);
      const w = img.width * scaleToCover;
      const h = img.height * scaleToCover;
      
      ctx.drawImage(img, -w / 2, -h / 2, w, h);

      // แปลงผลลัพธ์เป็น Base64
      const croppedBase64 = canvas.toDataURL('image/png');
      setPreviewLogo(croppedBase64);
      setIsCropModalOpen(false);
    };
  };

  // รีเซ็ตแบรนดิ้งเป็นค่าตั้งต้นโรงเรียน
  const handleResetBranding = () => {
    Swal.fire({
      title: 'รีเซ็ตเป็นค่าเริ่มต้น?',
      text: 'โลโก้และชื่อระบบจะกลับไปใช้ค่าเริ่มต้นของ School Gallery',
      icon: 'warning',
      showCancelButton: true,
      confirmButtonText: 'ยืนยันรีเซ็ต',
      cancelButtonText: 'ยกเลิก',
      confirmButtonColor: '#ef4444',
      cancelButtonColor: '#6b7280',
    }).then((result) => {
      if (result.isConfirmed) {
        setBrandValue('brand_name', 'School Gallery');
        setBrandValue('brand_subtitle', 'แกลเลอรีภาพกิจกรรมโรงเรียน');
        setPreviewLogo(null);
        onUpdateBranding({
          name: 'School Gallery',
          subtitle: 'แกลเลอรีภาพกิจกรรมโรงเรียน',
          logo: null
        });
      }
    });
  };

  const handleAddCategory = (e) => {
    e.preventDefault();
    const name = newCategoryName.trim();
    if (!name) return;

    if (categories.includes(name)) {
      Swal.fire({
        title: 'คำเตือน!',
        text: 'มีหมวดหมู่นี้ในระบบอยู่แล้ว',
        icon: 'warning',
        confirmButtonText: 'ตกลง',
        confirmButtonColor: '#f59e0b',
      });
      return;
    }

    onAddCategory(name);
    setNewCategoryName('');
  };

  const handleDeleteCategoryClick = (name) => {
    Swal.fire({
      title: `ยืนยันลบหมวดหมู่ "${name}"?`,
      text: 'การลบหมวดหมู่จะไม่ลบอัลบั้มที่ใช้หมวดหมู่นี้ แต่หมวดหมู่นี้จะหายไปจากตัวกรองหน้าหลัก',
      icon: 'warning',
      showCancelButton: true,
      confirmButtonText: 'ลบหมวดหมู่',
      cancelButtonText: 'ยกเลิก',
      confirmButtonColor: '#ef4444',
      cancelButtonColor: '#6b7280',
    }).then((result) => {
      if (result.isConfirmed) {
        onDeleteCategory(name);
      }
    });
  };

  return (
    <div className="space-y-6 max-w-4xl animate-fade-in">
      {/* Header */}
      <div className="glass-card p-6 md:p-8">
        <div className="flex items-center gap-3 mb-3">
          <div className="p-2.5 rounded-xl bg-primary-500 text-white shadow-md shadow-primary-500/20">
            <FiSettings className="w-5 h-5" />
          </div>
          <h2 className="text-xl md:text-2xl font-black text-slate-800 dark:text-white">การตั้งค่าและการปรับแต่ง</h2>
        </div>
        <p className="text-slate-500 dark:text-slate-400 text-xs md:text-sm max-w-2xl leading-relaxed">
          กำหนดค่าเซิร์ฟเวอร์ฐานข้อมูล Google Sheets และปรับแต่งโลโก้ ชื่อโรงเรียน/สถาบัน รวมถึงชื่อหมวดหมู่กิจกรรมได้ด้วยตัวเอง
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="md:col-span-2 space-y-6">
          
          {/* ปรับแต่งภาพลักษณ์โรงเรียน (โลโก้ + ชื่อระบบ) */}
          <form onSubmit={handleSubmitBrand(onBrandSubmit)} className="glass-card p-6 space-y-5">
            <h3 className="text-base font-bold text-slate-800 dark:text-white border-b pb-3 dark:border-slate-800 flex items-center gap-2">
              <FiImage className="text-primary-500" /> ปรับแต่งชื่อระบบและโลโก้โรงเรียน
            </h3>

            {/* อัปโหลดโลโก้โรงเรียน */}
            <div className="flex flex-col sm:flex-row items-center gap-4 p-4 bg-slate-50 dark:bg-slate-800/40 rounded-2xl border border-slate-100 dark:border-slate-800/80">
              <div 
                onClick={() => fileInputRef.current?.click()}
                className="w-16 h-16 rounded-2xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 flex items-center justify-center cursor-pointer hover:border-primary-500 hover:scale-102 transition-all relative overflow-hidden shrink-0 group"
                title="คลิกเพื่ออัปโหลดและปรับแต่งโลโก้"
              >
                {previewLogo ? (
                  <img src={previewLogo} className="w-full h-full object-cover" alt="Logo preview" />
                ) : (
                  <FiUpload className="w-5 h-5 text-slate-450 group-hover:text-primary-500 transition-colors" />
                )}
                <input
                  ref={fileInputRef}
                  type="file"
                  accept="image/*"
                  onChange={handleLogoFileChange}
                  className="hidden"
                />
              </div>

              <div className="text-center sm:text-left space-y-1">
                <span className="text-xs font-bold text-slate-700 dark:text-slate-350 block">โลโก้ประประจำสถาบัน (ตัดแต่งรูปได้)</span>
                <span className="text-[10px] text-slate-450 dark:text-slate-500 block">เมื่อเลือกรูปภาพแล้วระบบจะมีหน้าต่างให้ทำการซูม ขยับลาก และตัดภาพตามสัดส่วนจริงก่อนนำไปใช้</span>
                {previewLogo && (
                  <button 
                    type="button" 
                    onClick={() => setPreviewLogo(null)} 
                    className="text-[9px] font-bold text-rose-500 hover:underline"
                  >
                    ลบโลโก้ / กลับไปใช้ค่าเริ่มต้น
                  </button>
                )}
              </div>
            </div>

            {/* ชื่อโรงเรียน */}
            <div className="space-y-1.5">
              <label className="block text-[10px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider">ชื่อโรงเรียน / ชื่อระบบแกลเลอรี</label>
              <input
                type="text"
                placeholder="เช่น โรงเรียนพัทลุงวิทยา"
                className="w-full px-4 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-transparent text-sm focus:outline-none focus:border-primary-500 transition-colors dark:text-white font-semibold"
                {...registerBrand('brand_name', { required: true })}
              />
            </div>

            {/* คำบรรยายใต้ชื่อ */}
            <div className="space-y-1.5">
              <label className="block text-[10px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider">คำบรรยาย / สโลแกนใต้โลโก้</label>
              <input
                type="text"
                placeholder="เช่น แกลเลอรีภาพกิจกรรมของพวกเรา"
                className="w-full px-4 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-transparent text-sm focus:outline-none focus:border-primary-500 transition-colors dark:text-white text-xs"
                {...registerBrand('brand_subtitle')}
              />
            </div>

            <div className="flex gap-2">
              <button 
                type="submit" 
                className="flex-1 py-2.5 bg-primary-500 hover:bg-primary-600 text-white font-bold rounded-xl text-xs transition-all active:scale-[0.98] flex items-center justify-center gap-1.5 shadow-md shadow-primary-500/20"
              >
                <FiSave className="w-4 h-4" /> บันทึกภาพลักษณ์ใหม่
              </button>
              <button 
                type="button" 
                onClick={handleResetBranding}
                className="px-3.5 py-2.5 bg-slate-200 dark:bg-slate-800 text-slate-600 dark:text-slate-400 hover:bg-slate-350 dark:hover:bg-slate-700 font-bold rounded-xl text-xs transition-all"
                title="รีเซ็ตค่าทั้งหมด"
              >
                <FiRefreshCw className="w-4 h-4" />
              </button>
            </div>
          </form>

          {/* API Config Form */}
          <form onSubmit={handleSubmitApi(onApiSubmit)} className="glass-card p-6 space-y-5">
            <h3 className="text-base font-bold text-slate-800 dark:text-white border-b pb-3 dark:border-slate-800 flex items-center gap-2">
              <FiServer className="text-primary-500" /> กำหนดค่า API (เชื่อมต่อจริง)
            </h3>

            {/* Toggle */}
            <div className="flex items-center justify-between p-3.5 bg-slate-50 dark:bg-slate-800/50 rounded-2xl border border-slate-100 dark:border-slate-800">
              <div>
                <span className="text-xs font-bold text-slate-700 dark:text-slate-200 block mb-0.5">สถานะการเชื่อมต่อจริง</span>
                <span className="text-[10px] text-slate-400 dark:text-slate-500">
                  {apiEnabled ? 'เชื่อมต่อ Google Sheets จริง' : 'โหมดจำลอง (LocalStorage)'}
                </span>
              </div>
              <label className="relative inline-flex items-center cursor-pointer">
                <input type="checkbox" className="sr-only peer" {...registerApi('api_enabled', { onChange: (e) => setApiEnabled(e.target.checked) })} />
                <div className="w-11 h-6 bg-slate-200 dark:bg-slate-700 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-primary-500" />
              </label>
            </div>

            {/* URL Input */}
            <div className="space-y-1.5">
              <label className="block text-[10px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider">Google Apps Script Web App URL</label>
              <div className="relative">
                <span className="absolute inset-y-0 left-0 pl-3.5 flex items-center text-slate-400"><FiLink className="w-4 h-4" /></span>
                <input
                  type="url"
                  disabled={!apiEnabled}
                  placeholder="https://script.google.com/macros/s/.../exec"
                  className={`w-full pl-9 pr-4 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-transparent text-sm focus:outline-none focus:border-primary-500 transition-colors
                    ${!apiEnabled ? 'opacity-50 cursor-not-allowed border-dashed' : 'dark:text-white'}`}
                  {...registerApi('api_url')}
                />
              </div>
              <span className="text-[10px] text-slate-400 dark:text-slate-500 block">* การเชื่อมต่อจะถูกบันทึกไว้ในเครื่องนี้สำหรับการเข้าใช้งานครั้งต่อไป ส่วนผู้ใช้คนอื่นที่เปิดเว็บมาครั้งแรกจะอยู่ในโหมดจำลองเริ่มต้น</span>
            </div>

            <button type="submit" className="w-full py-2.5 bg-primary-500 hover:bg-primary-600 text-white font-bold rounded-xl text-sm transition-all active:scale-[0.98] flex items-center justify-center gap-2 shadow-md shadow-primary-500/20">
              <FiSave className="w-4 h-4" /> บันทึกการตั้งค่า API
            </button>
          </form>

          {/* Manage Categories Section */}
          <div className="glass-card p-6 space-y-5">
            <h3 className="text-base font-bold text-slate-800 dark:text-white border-b pb-3 dark:border-slate-800 flex items-center gap-2">
              <FiLayers className="text-amber-500" /> จัดการหมวดหมู่กิจกรรม (กำหนดเอง)
            </h3>
            
            <form onSubmit={handleAddCategory} className="flex gap-2">
              <input
                type="text"
                placeholder="ป้อนชื่อหมวดหมู่ใหม่ เช่น วิชาการ, เทคโนโลยี, ค่ายศิลปะ"
                value={newCategoryName}
                onChange={(e) => setNewCategoryName(e.target.value)}
                className="flex-1 px-4 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-transparent text-sm focus:outline-none focus:border-primary-500 transition-colors dark:text-white"
              />
              <button
                type="submit"
                className="px-4 py-2.5 bg-amber-500 hover:bg-amber-600 text-white font-bold rounded-xl text-sm flex items-center gap-1.5 shadow-md shadow-amber-500/25 transition-all"
              >
                <FiPlus className="w-4 h-4" />
                <span>เพิ่ม</span>
              </button>
            </form>

            <div className="space-y-2">
              <p className="text-[10px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-wider">รายการหมวดหมู่ปัจจุบัน</p>
              <div className="grid grid-cols-2 gap-2">
                {categories.map(cat => (
                  <div 
                    key={cat} 
                    className="flex items-center justify-between px-3 py-2 bg-slate-50 dark:bg-slate-800/40 rounded-xl border border-slate-100 dark:border-slate-800"
                  >
                    <span className="text-xs font-semibold text-slate-700 dark:text-slate-350">{cat}</span>
                    <button
                      type="button"
                      onClick={() => handleDeleteCategoryClick(cat)}
                      className="p-1.5 text-rose-500 hover:bg-rose-500/10 rounded-lg transition-colors"
                      title={`ลบหมวดหมู่ ${cat}`}
                    >
                      <FiTrash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>

        {/* Database Schema */}
        <div className="space-y-6">
          {/* Drive Structure */}
          <div className="glass-card p-6 space-y-4">
            <h3 className="text-base font-bold text-slate-800 dark:text-white border-b pb-3 dark:border-slate-800 flex items-center gap-2">
              <FiFolder className="text-emerald-500" /> โครงสร้าง Google Drive
            </h3>
            <p className="text-xs text-slate-500 dark:text-slate-400 leading-relaxed">สคริปต์หลังบ้านจะจัดรูปภาพแยกโฟลเดอร์อัตโนมัติตามโครงสร้างนี้:</p>
            <div className="p-4 bg-slate-50 dark:bg-slate-800/50 rounded-2xl border border-slate-100 dark:border-slate-800">
              <div className="text-xs font-mono space-y-1.5">
                <div className="text-emerald-500 font-bold">Google Drive /</div>
                <div className="pl-4 text-blue-500 font-bold">└── School Gallery /</div>
                <div className="pl-8 text-amber-500 font-bold">├── 2569 / <span className="text-slate-400 font-normal">(ปี พ.ศ.)</span></div>
                <div className="pl-12 text-purple-500 font-bold">│   ├── 01-มกราคม / <span className="text-slate-400 font-normal">(เดือน)</span></div>
                <div className="pl-16 text-slate-600 dark:text-slate-300">│   │   └── วันเด็กแห่งชาติ / <span className="text-slate-400 font-normal">(ชื่อกิจกรรม)</span></div>
                <div className="pl-16 text-slate-400">│   │       └── [รูปภาพทั้งหมด]</div>
                <div className="pl-8 text-amber-500 font-bold">└── 2570 /</div>
              </div>
            </div>
          </div>

          <div className="glass-card p-6 space-y-4">
            <h3 className="text-base font-bold text-slate-800 dark:text-white border-b pb-3 dark:border-slate-800 flex items-center gap-2">
              <FiDatabase className="text-blue-500" /> ตารางฐานข้อมูล
            </h3>
            <p className="text-xs text-slate-500 dark:text-slate-400 leading-relaxed">Google Sheets จะแบ่งเป็น 2 แผ่นงาน:</p>

            <div className="space-y-1.5">
              <div className="text-xs font-bold text-slate-700 dark:text-slate-200">1. แผ่นงาน <code className="text-primary-500">Albums</code></div>
              <div className="text-[10px] font-mono bg-slate-50 dark:bg-slate-800 p-2 rounded-lg text-slate-500 dark:text-slate-400 break-all">
                id, title, category, date, cover_image, description, tags
              </div>
            </div>

            <div className="space-y-1.5 pt-2">
              <div className="text-xs font-bold text-slate-700 dark:text-slate-200">2. แผ่นงาน <code className="text-emerald-500">Photos</code></div>
              <div className="text-[10px] font-mono bg-slate-50 dark:bg-slate-800 p-2 rounded-lg text-slate-500 dark:text-slate-400 break-all">
                id, album_id, image_url, drive_file_id, caption, photographer, created_at
              </div>
            </div>

            <div className="p-3 bg-blue-500/5 text-blue-600 dark:text-blue-400 border border-blue-500/10 rounded-2xl flex items-start gap-2">
              <FiHelpCircle className="w-5 h-5 shrink-0 mt-0.5" />
              <p className="text-[10px] leading-relaxed">
                <strong>หมายเหตุ:</strong> สคริปต์หลังบ้านจะสร้างคอลัมน์เหล่านี้ให้อัตโนมัติเมื่อเชื่อมต่อครั้งแรก
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* หน้าต่าง Modal สําหรับการหมุน ซูม และลากตัดแต่งรูปภาพโลโก้ */}
      <AnimatePresence>
        {isCropModalOpen && (
          <>
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 z-[100] bg-black/60 backdrop-blur-sm"
              onClick={() => setIsCropModalOpen(false)}
            />
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 20 }}
              className="fixed inset-0 z-[110] flex items-center justify-center p-4"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="bg-white dark:bg-slate-900 rounded-3xl p-6 w-full max-w-sm border border-slate-200 dark:border-slate-800 shadow-2xl space-y-5">
                <div className="flex items-center justify-between border-b pb-3 dark:border-slate-850">
                  <h3 className="text-sm font-bold text-slate-800 dark:text-white flex items-center gap-2">
                    <FiImage className="text-primary-500" /> ตัดแต่งภาพโลโก้ระบบ
                  </h3>
                  <button onClick={() => setIsCropModalOpen(false)} className="text-slate-400 hover:text-slate-650 p-1 rounded-lg">
                    <FiX className="w-4 h-4" />
                  </button>
                </div>

                {/* กรอบตัดรูปขนาด 192px (w-48 h-48) */}
                <div 
                  className="w-48 h-48 rounded-2xl border-2 border-primary-500 overflow-hidden relative cursor-move mx-auto bg-slate-900 flex items-center justify-center select-none"
                  onMouseDown={handleDragStart}
                  onMouseMove={handleDragMove}
                  onMouseUp={handleDragEnd}
                  onMouseLeave={handleDragEnd}
                  onTouchStart={handleTouchStart}
                  onTouchMove={handleTouchMove}
                  onTouchEnd={handleDragEnd}
                >
                  <img 
                    src={originalLogo} 
                    style={{
                      width: '100%',
                      height: '100%',
                      objectFit: 'cover',
                      transform: `translate(${offset.x}px, ${offset.y}px) rotate(${rotation}deg) scale(${zoom})`,
                      transformOrigin: 'center',
                      transition: dragging ? 'none' : 'transform 0.1s ease-out'
                    }}
                    className="pointer-events-none"
                    alt="Original Uploaded"
                  />
                  {/* กรอบช่วยจัดเล็งภาพ */}
                  <div className="absolute inset-2 border border-dashed border-white/40 rounded-xl pointer-events-none" />
                </div>
                
                <p className="text-[10px] text-center text-slate-400 dark:text-slate-500 font-medium">
                  💡 ลากรูปเพื่อเลื่อนตําแหน่ง | ใช้สไลเดอร์ด้านล่างเพื่อซูม
                </p>

                {/* ปุ่มควบคุมหมุน ซูม */}
                <div className="space-y-3">
                  {/* สไลเดอร์ซูม */}
                  <div className="flex items-center gap-3">
                    <FiMinimize className="w-3.5 h-3.5 text-slate-400" />
                    <input
                      type="range"
                      min="1"
                      max="3"
                      step="0.05"
                      value={zoom}
                      onChange={(e) => setZoom(parseFloat(e.target.value))}
                      className="flex-1 accent-primary-500 h-1 bg-slate-200 dark:bg-slate-800 rounded-lg appearance-none cursor-pointer"
                    />
                    <FiMaximize className="w-3.5 h-3.5 text-slate-400" />
                  </div>

                  {/* หมุนภาพ */}
                  <div className="flex justify-center gap-3">
                    <button
                      type="button"
                      onClick={() => setRotation(r => r - 90)}
                      className="px-3 py-1.5 bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 rounded-lg text-[10px] font-bold text-slate-600 dark:text-slate-350 flex items-center gap-1.5 transition-colors"
                    >
                      <FiRotateCcw className="w-3 h-3" /> หมุนซ้าย
                    </button>
                    <button
                      type="button"
                      onClick={() => setRotation(r => r + 90)}
                      className="px-3 py-1.5 bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 rounded-lg text-[10px] font-bold text-slate-600 dark:text-slate-350 flex items-center gap-1.5 transition-colors"
                    >
                      <FiRotateCw className="w-3 h-3" /> หมุนขวา
                    </button>
                  </div>
                </div>

                {/* ปุ่มลบ และ ยืนยัน */}
                <div className="flex gap-2.5 pt-2">
                  <button
                    type="button"
                    onClick={() => setIsCropModalOpen(false)}
                    className="flex-1 py-2 bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 rounded-xl text-xs font-bold text-slate-600 dark:text-slate-400 transition-colors"
                  >
                    ยกเลิก
                  </button>
                  <button
                    type="button"
                    onClick={handleConfirmCrop}
                    className="flex-1 py-2 bg-primary-500 hover:bg-primary-600 rounded-xl text-xs font-bold text-white shadow-lg shadow-primary-500/20 transition-all active:scale-[0.97]"
                  >
                    ตัดภาพและใช้
                  </button>
                </div>
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </div>
  );
}
