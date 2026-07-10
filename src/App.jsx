import React, { useState, useEffect, useMemo } from 'react';
import { BrowserRouter as Router, Routes, Route, useLocation } from 'react-router-dom';
import { QueryClient, QueryClientProvider, useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { apiService, getThaiYear } from './services/api';
import Sidebar from './components/Sidebar';
import FABMenu from './components/FABMenu';
import UploadModal from './components/UploadModal';
import Home from './pages/Home';
import AlbumDetail from './pages/AlbumDetail';
import Settings from './pages/Settings';
import Swal from 'sweetalert2';
import { FiMenu, FiImage } from 'react-icons/fi';

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      refetchOnWindowFocus: false,
      retry: 1,
    },
  },
});

function AppContent() {
  const qc = useQueryClient();
  const location = useLocation();
  
  const [apiUrl, setApiUrl] = useState(() => localStorage.getItem('school_gallery_api_url') || '');
  const [mobileSidebarOpen, setMobileSidebarOpen] = useState(false);
  const [modalOpen, setModalOpen] = useState(false);
  const [modalType, setModalType] = useState('album');
  const [targetAlbumId, setTargetAlbumId] = useState('');
  const [editData, setEditData] = useState(null); // เก็บข้อมูลอัลบั้มสำหรับฟอร์มแก้ไข

  // สถานะการปรับแต่งภาพลักษณ์ของแบรนด์ (โลโก้ + ชื่อโรงเรียน)
  const [branding, setBranding] = useState(() => {
    return {
      name: localStorage.getItem('school_gallery_name') || 'School Gallery',
      subtitle: localStorage.getItem('school_gallery_subtitle') || 'ระบบบันทึกคลังภาพกิจกรรม ปี พ.ศ. 2569 – 2570',
      logo: localStorage.getItem('school_gallery_logo') || null
    };
  });

  // ตัวกรอง
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('ทั้งหมด');
  const [selectedYear, setSelectedYear] = useState('ทั้งหมด');

  // ธีม
  const [theme, setTheme] = useState(() => localStorage.getItem('theme') || 'light');

  // ดึงอัลบั้ม
  const { data: albums = [] } = useQuery({
    queryKey: ['albums'],
    queryFn: apiService.getAlbums,
  });

  // ดึงหมวดหมู่ไดนามิก
  const { data: categories = [] } = useQuery({
    queryKey: ['categories'],
    queryFn: apiService.getCategories,
  });

  // หาปี พ.ศ. ทั้งหมด
  const availableYears = useMemo(() => {
    const years = albums.map(a => getThaiYear(a.date)).filter(Boolean);
    return [...new Set(years)].sort((a, b) => b - a);
  }, [albums]);

  // สลับธีม
  useEffect(() => {
    const root = document.documentElement;
    if (theme === 'dark') {
      root.classList.add('dark');
    } else {
      root.classList.remove('dark');
    }
    localStorage.setItem('theme', theme);
  }, [theme]);

  const toggleTheme = () => setTheme(prev => prev === 'light' ? 'dark' : 'light');

  // จัดการอัปเดตแบรนดิ้งโลโก้/ชื่อโรงเรียน
  const handleUpdateBranding = (newBranding) => {
    localStorage.setItem('school_gallery_name', newBranding.name);
    localStorage.setItem('school_gallery_subtitle', newBranding.subtitle);
    if (newBranding.logo) {
      localStorage.setItem('school_gallery_logo', newBranding.logo);
    } else {
      localStorage.removeItem('school_gallery_logo');
    }
    setBranding({
      name: newBranding.name,
      subtitle: newBranding.subtitle,
      logo: newBranding.logo
    });
  };

  // Mutation สร้างอัลบั้ม
  const createAlbumMutation = useMutation({
    mutationFn: apiService.createAlbum,
    onSuccess: (newAlbum) => {
      qc.invalidateQueries({ queryKey: ['albums'] });
      Swal.fire({
        title: 'สร้างอัลบั้มสำเร็จ!',
        text: `อัลบั้ม "${newAlbum.title}" ถูกเพิ่มลงในระบบแล้ว`,
        icon: 'success',
        confirmButtonText: 'ตกลง',
        confirmButtonColor: '#4f70fa',
      });
    },
    onError: (error) => {
      Swal.fire({ title: 'เกิดข้อผิดพลาด', text: error.message, icon: 'error', confirmButtonColor: '#f43f5e' });
    },
  });

  // Mutation แก้ไขอัลบั้ม
  const updateAlbumMutation = useMutation({
    mutationFn: ({ albumId, albumData }) => apiService.updateAlbum(albumId, albumData),
    onSuccess: (updatedAlbum, variables) => {
      qc.invalidateQueries({ queryKey: ['albums'] });
      
      const oldAlbum = albums.find(a => a.id === variables.albumId);
      const oldPath = oldAlbum ? oldAlbum.drive_folder_path : '';
      const newPath = updatedAlbum ? updatedAlbum.drive_folder_path : '';
      
      let folderMsg = 'รายละเอียดอัลบั้มถูกปรับปรุงเรียบร้อยแล้ว';
      if (oldPath && newPath && oldPath !== newPath) {
        folderMsg = `ย้ายและเปลี่ยนชื่อโฟลเดอร์จำลองบน Google Drive สำเร็จ!\n\nจาก: ${oldPath}\n\nไปยัง: ${newPath}`;
      }

      Swal.fire({
        title: 'แก้ไขอัลบั้มและจัดการโฟลเดอร์สำเร็จ!',
        html: `<pre class="text-[10px] text-left font-mono whitespace-pre-wrap bg-slate-50 dark:bg-slate-800 p-2.5 rounded-xl border dark:border-slate-700">${folderMsg}</pre>`,
        icon: 'success',
        confirmButtonText: 'ตกลง',
        confirmButtonColor: '#4f70fa',
      });
    },
    onError: (error) => {
      Swal.fire({ title: 'เกิดข้อผิดพลาด', text: error.message, icon: 'error', confirmButtonColor: '#f43f5e' });
    },
  });

  // Mutation อัปโหลดรูปภาพ
  const uploadPhotoMutation = useMutation({
    mutationFn: ({ albumId, photoData }) => apiService.uploadPhoto(albumId, photoData),
    onSuccess: (_, variables) => {
      qc.invalidateQueries({ queryKey: ['photos', variables.albumId] });
      qc.invalidateQueries({ queryKey: ['albums'] });
      qc.invalidateQueries({ queryKey: ['allPhotos'] });
      Swal.fire({
        title: 'อัปโหลดสำเร็จ!',
        text: 'ภาพกิจกรรมถูกจัดเก็บลงในระบบเรียบร้อยแล้ว',
        icon: 'success',
        confirmButtonText: 'ตกลง',
        confirmButtonColor: '#10b981',
      });
    },
    onError: (error) => {
      Swal.fire({ title: 'เกิดข้อผิดพลาด', text: error.message, icon: 'error', confirmButtonColor: '#f43f5e' });
    },
  });

  // Mutation เพิ่มหมวดหมู่ใหม่
  const addCategoryMutation = useMutation({
    mutationFn: apiService.addCategory,
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['categories'] });
      Swal.fire({
        title: 'เพิ่มหมวดหมู่สำเร็จ!',
        text: 'หมวดหมู่กิจกรรมที่กำหนดเองถูกบันทึกเรียบร้อยแล้ว',
        icon: 'success',
        confirmButtonText: 'ตกลง',
        confirmButtonColor: '#4f70fa',
      });
    },
    onError: (error) => {
      Swal.fire({ title: 'เกิดข้อผิดพลาด', text: error.message, icon: 'error', confirmButtonColor: '#f43f5e' });
    }
  });

  // Mutation ลบหมวดหมู่
  const deleteCategoryMutation = useMutation({
    mutationFn: apiService.deleteCategory,
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['categories'] });
      Swal.fire({
        title: 'ลบหมวดหมู่สำเร็จ!',
        text: 'นำหมวดหมู่ออกจากรายการเรียบร้อยแล้ว',
        icon: 'success',
        confirmButtonText: 'ตกลง',
        confirmButtonColor: '#4f70fa',
      });
    },
    onError: (error) => {
      Swal.fire({ title: 'เกิดข้อผิดพลาด', text: error.message, icon: 'error', confirmButtonColor: '#f43f5e' });
    }
  });

  const handleOpenModal = (type, albumId = '', albumData = null) => {
    setModalType(type);
    setEditData(albumData);
    setTargetAlbumId(albumId || (albums[0]?.id || ''));
    setModalOpen(true);
  };

  const handleSubmit = async (dataOrAlbumId, photoData) => {
    if (modalType === 'album') {
      await createAlbumMutation.mutateAsync(dataOrAlbumId);
    } else if (modalType === 'edit-album') {
      await updateAlbumMutation.mutateAsync({ albumId: dataOrAlbumId, albumData: photoData });
    } else {
      await uploadPhotoMutation.mutateAsync({ albumId: dataOrAlbumId, photoData });
    }
  };

  // หัวข้อตามเส้นทาง
  const pageTitle = (() => {
    if (location.pathname === '/') return 'แกลเลอรีภาพกิจกรรมของโรงเรียน';
    if (location.pathname.startsWith('/album/')) return 'ภาพถ่ายกิจกรรม';
    if (location.pathname === '/settings') return 'แผงควบคุมการตั้งค่า';
    return '';
  })();

  const pageSubtitle = (() => {
    if (location.pathname === '/') return branding.subtitle;
    if (location.pathname.startsWith('/album/')) return 'รายละเอียดกิจกรรมและรูปภาพ';
    if (location.pathname === '/settings') return 'ตั้งค่า API, จัดการหมวดหมู่ และกำหนดรูปลักษณ์ระบบ';
    return '';
  })();

  return (
    <div className="min-h-screen flex font-sans">
      <Sidebar
        selectedCategory={selectedCategory}
        setSelectedCategory={setSelectedCategory}
        selectedYear={selectedYear}
        setSelectedYear={setSelectedYear}
        availableYears={availableYears}
        categories={categories}
        branding={branding} // ส่งค่า แบรนดิ้ง ไปที่เมนูข้าง
        theme={theme}
        toggleTheme={toggleTheme}
        isOpen={mobileSidebarOpen}
        setIsOpen={setMobileSidebarOpen}
      />

      <main className="flex-1 md:pl-20 lg:pl-64 min-w-0 flex flex-col min-h-screen bg-slate-50 dark:bg-slate-950">
        {/* Mobile Header */}
        <header className="md:hidden sticky top-0 z-30 flex items-center justify-between px-4 py-3 bg-white/80 dark:bg-slate-950/80 backdrop-blur-md border-b border-slate-100 dark:border-slate-900 shrink-0">
          <div className="flex items-center gap-2">
            {branding.logo ? (
              <img src={branding.logo} className="w-8 h-8 rounded-lg object-cover shrink-0" alt="logo" />
            ) : (
              <div className="w-8 h-8 rounded-lg bg-gradient-to-tr from-primary-600 to-primary-400 flex items-center justify-center text-white shrink-0">
                <FiImage className="w-4 h-4" />
              </div>
            )}
            <span className="text-sm font-bold text-slate-800 dark:text-white">{branding.name}</span>
          </div>
          <button onClick={() => setMobileSidebarOpen(true)} className="p-2 text-slate-500 hover:text-slate-700 dark:hover:text-white rounded-lg hover:bg-slate-100 dark:hover:bg-slate-900">
            <FiMenu className="w-5 h-5" />
          </button>
        </header>

        <div className="flex-1 p-4 md:p-6 lg:p-8 space-y-6">
          {/* Page Header */}
          <div>
            <h2 className="text-xl md:text-2xl font-black text-slate-800 dark:text-white tracking-wide">{pageTitle}</h2>
            <p className="text-[10px] md:text-xs text-slate-500 dark:text-slate-400 font-semibold mt-0.5 uppercase tracking-wider">{pageSubtitle}</p>
          </div>

          <Routes>
            <Route path="/" element={
              <Home
                searchQuery={searchQuery} setSearchQuery={setSearchQuery}
                selectedCategory={selectedCategory} setSelectedCategory={setSelectedCategory}
                selectedYear={selectedYear} setSelectedYear={setSelectedYear}
                categories={categories}
              />
            } />
            <Route path="/album/:albumId" element={<AlbumDetail onOpenUploadModal={handleOpenModal} />} />
            <Route path="/settings" element={
              <Settings 
                categories={categories}
                onAddCategory={(cat) => addCategoryMutation.mutate(cat)}
                onDeleteCategory={(cat) => deleteCategoryMutation.mutate(cat)}
                branding={branding}
                onUpdateBranding={handleUpdateBranding} // ส่งฟังก์ชันเซฟแบรนดิ้ง
                apiUrl={apiUrl}
                onUpdateApiUrl={(url, enabled) => {
                  localStorage.setItem('school_gallery_api_url', url);
                  localStorage.setItem('school_gallery_api_enabled', enabled ? 'true' : 'false');
                  setApiUrl(url);
                  qc.invalidateQueries();
                }}
              />
            } />
          </Routes>
        </div>
      </main>

      <FABMenu onOpenModal={(type) => handleOpenModal(type, targetAlbumId)} />
      <UploadModal
        type={modalType}
        isOpen={modalOpen}
        onClose={() => setModalOpen(false)}
        albums={albums}
        selectedAlbumId={targetAlbumId}
        initialData={editData}
        categories={categories}
        onSubmit={handleSubmit}
      />
    </div>
  );
}

export default function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <Router>
        <AppContent />
      </Router>
    </QueryClientProvider>
  );
}
