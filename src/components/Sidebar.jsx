import React, { useState, useEffect } from 'react';
import { NavLink, useLocation } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { apiService } from '../services/api';
import {
  FiHome, FiImage, FiSettings, FiSun, FiMoon, FiX, FiChevronDown, FiLayers, FiCalendar
} from 'react-icons/fi';

const defaultBranding = {
  name: 'School Gallery',
  subtitle: 'ระบบบันทึกคลังภาพกิจกรรม ปี พ.ศ. 2569 – 2570',
  logo: null
};

export default function Sidebar({
  selectedCategory, setSelectedCategory,
  selectedYear, setSelectedYear,
  availableYears = [],
  categories = [],
  branding = defaultBranding, // รับค่า branding โลโก้และชื่อโรงเรียน
  theme, toggleTheme,
  isOpen, setIsOpen
}) {
  const location = useLocation();
  const [showFilters, setShowFilters] = useState(true);

  // ปิด drawer เมื่อเปลี่ยนหน้า
  useEffect(() => {
    setIsOpen(false);
  }, [location.pathname]);

  const navItems = [
    { path: '/', icon: FiHome, label: 'หน้าหลัก' },
    { path: '/settings', icon: FiSettings, label: 'ตั้งค่า' },
  ];

  const displayCategories = ['ทั้งหมด', ...(Array.isArray(categories) ? categories : [])];

  const SidebarContent = () => (
    <div className="flex flex-col h-full">
      {/* Logo */}
      <div className="p-5 border-b border-slate-100 dark:border-slate-800/60">
        <div className="flex items-center gap-3">
          {branding.logo ? (
            <img 
              src={branding.logo} 
              className="w-10 h-10 rounded-2xl object-cover shadow-md shadow-primary-500/10 shrink-0" 
              alt="logo" 
            />
          ) : (
            <div className="w-10 h-10 rounded-2xl bg-gradient-to-br from-primary-500 to-indigo-600 flex items-center justify-center text-white shadow-lg shadow-primary-500/30 shrink-0">
              <FiImage className="w-5 h-5" />
            </div>
          )}
          <div className="min-w-0 flex-1">
            <h1 className="text-sm font-extrabold text-slate-800 dark:text-white truncate leading-tight">
              {branding.name || 'School Gallery'}
            </h1>
            <p className="text-[10px] text-slate-400 dark:text-slate-500 font-medium truncate mt-0.5">
              {branding.subtitle || 'แกลเลอรีภาพกิจกรรมโรงเรียน'}
            </p>
          </div>
        </div>
      </div>

      {/* Navigation Links */}
      <nav className="px-3 pt-4 space-y-1">
        {navItems.map(item => (
          <NavLink
            key={item.path}
            to={item.path}
            className={({ isActive }) =>
              `flex items-center gap-3 px-3.5 py-2.5 rounded-xl text-sm font-semibold transition-all duration-200 group
               ${isActive
                 ? 'bg-primary-500/10 text-primary-600 dark:text-primary-400 shadow-sm'
                 : 'text-slate-500 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800/50 hover:text-slate-700 dark:hover:text-slate-200'
               }`
            }
          >
            <item.icon className="w-[18px] h-[18px] shrink-0" />
            <span className="truncate">{item.label}</span>
          </NavLink>
        ))}
      </nav>

      {/* Filters Section */}
      {location.pathname === '/' && (
        <div className="px-3 mt-6 flex-1 overflow-y-auto">
          <button
            onClick={() => setShowFilters(!showFilters)}
            className="flex items-center justify-between w-full px-3.5 py-2 rounded-xl text-xs font-bold uppercase tracking-wider text-slate-400 dark:text-slate-500 hover:text-slate-600 dark:hover:text-slate-300 transition-colors"
          >
            <span className="flex items-center gap-2"><FiLayers className="w-3.5 h-3.5" /> ตัวกรอง</span>
            <FiChevronDown className={`w-3.5 h-3.5 transition-transform ${showFilters ? 'rotate-180' : ''}`} />
          </button>

          <AnimatePresence>
            {showFilters && (
              <motion.div
                initial={{ height: 0, opacity: 0 }}
                animate={{ height: 'auto', opacity: 1 }}
                exit={{ height: 0, opacity: 0 }}
                transition={{ duration: 0.2 }}
                className="overflow-hidden"
              >
                {/* Category Filter */}
                <div className="px-2 pt-2 pb-3">
                  <p className="text-[10px] uppercase tracking-wider text-slate-400 dark:text-slate-500 font-bold mb-2 px-2 flex items-center gap-1.5">
                    <FiLayers className="w-3 h-3" /> หมวดหมู่
                  </p>
                  <div className="space-y-0.5">
                    {displayCategories.map(cat => (
                      <button
                        key={cat}
                        onClick={() => setSelectedCategory(cat)}
                        className={`w-full text-left px-3 py-1.5 rounded-lg text-xs font-medium transition-all duration-150
                          ${selectedCategory === cat
                            ? 'bg-primary-500/10 text-primary-600 dark:text-primary-400 font-semibold'
                            : 'text-slate-500 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800/50 hover:text-slate-700 dark:hover:text-slate-200'
                          }`}
                      >
                        {cat}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Year Filter */}
                {availableYears.length > 0 && (
                  <div className="px-2 pt-2 pb-3">
                    <p className="text-[10px] uppercase tracking-wider text-slate-400 dark:text-slate-500 font-bold mb-2 px-2 flex items-center gap-1.5">
                      <FiCalendar className="w-3 h-3" /> ปีการศึกษา (พ.ศ.)
                    </p>
                    <div className="space-y-0.5">
                      <button
                        onClick={() => setSelectedYear('ทั้งหมด')}
                        className={`w-full text-left px-3 py-1.5 rounded-lg text-xs font-medium transition-all
                          ${selectedYear === 'ทั้งหมด'
                            ? 'bg-primary-500/10 text-primary-600 dark:text-primary-400 font-semibold'
                            : 'text-slate-500 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800/50'
                          }`}
                      >
                        ทั้งหมด
                      </button>
                      {availableYears.map(year => (
                        <button
                          key={year}
                          onClick={() => setSelectedYear(String(year))}
                          className={`w-full text-left px-3 py-1.5 rounded-lg text-xs font-medium transition-all
                            ${String(selectedYear) === String(year)
                              ? 'bg-primary-500/10 text-primary-600 dark:text-primary-400 font-semibold'
                              : 'text-slate-500 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800/50'
                            }`}
                        >
                          พ.ศ. {year}
                        </button>
                      ))}
                    </div>
                  </div>
                )}
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      )}

      {/* Spacer */}
      <div className="flex-1" />

      {/* Theme Toggle */}
      <div className="p-4 border-t border-slate-100 dark:border-slate-800/60">
        <button
          onClick={toggleTheme}
          className="w-full flex items-center justify-center gap-2.5 px-4 py-2.5 rounded-xl bg-slate-100 dark:bg-slate-800/60 text-slate-600 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-700/60 text-xs font-semibold transition-all"
        >
          {theme === 'dark' ? <FiSun className="w-4 h-4 text-amber-400" /> : <FiMoon className="w-4 h-4 text-indigo-500" />}
          <span>{theme === 'dark' ? 'โหมดสว่าง' : 'โหมดมืด'}</span>
        </button>

        {/* สถานะโหมดเชื่อมต่อ */}
        {(() => {
          const isApiReal = localStorage.getItem('school_gallery_api_enabled') === 'true';
          return (
            <div className="mt-3 flex items-center justify-center gap-1.5 text-[10px]">
              <span className={`w-1.5 h-1.5 rounded-full animate-pulse ${isApiReal ? 'bg-emerald-400' : 'bg-amber-400'}`} />
              <span className="text-slate-400 dark:text-slate-500 font-bold">
                {isApiReal ? 'เชื่อมต่อจริง (Google Sheets)' : 'โหมดจำลอง (LocalStorage)'}
              </span>
            </div>
          );
        })()}
      </div>
    </div>
  );

  return (
    <>
      {/* Desktop Sidebar (lg: 256px) */}
      <aside className="hidden lg:flex fixed inset-y-0 left-0 z-40 w-64 flex-col glass-nav">
        <SidebarContent />
      </aside>

      {/* Tablet Sidebar (md: icon only 80px) */}
      <aside className="hidden md:flex lg:hidden fixed inset-y-0 left-0 z-40 w-20 flex-col glass-nav items-center py-5">
        {branding.logo ? (
          <img 
            src={branding.logo} 
            className="w-10 h-10 rounded-2xl object-cover shadow-md mb-6 shrink-0" 
            alt="logo" 
          />
        ) : (
          <div className="w-10 h-10 rounded-2xl bg-gradient-to-br from-primary-500 to-indigo-600 flex items-center justify-center text-white shadow-lg shadow-primary-500/30 mb-6 shrink-0">
            <FiImage className="w-5 h-5" />
          </div>
        )}
        <nav className="flex flex-col items-center gap-2 flex-1">
          {navItems.map(item => (
            <NavLink
              key={item.path}
              to={item.path}
              title={item.label}
              className={({ isActive }) =>
                `p-3 rounded-xl transition-all duration-200
                 ${isActive
                   ? 'bg-primary-500/10 text-primary-600 dark:text-primary-400'
                   : 'text-slate-400 dark:text-slate-500 hover:bg-slate-100 dark:hover:bg-slate-800/50 hover:text-slate-600'
                 }`
              }
            >
              <item.icon className="w-5 h-5" />
            </NavLink>
          ))}
        </nav>
        <button onClick={toggleTheme} className="p-3 rounded-xl text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800/50 transition-all" title="สลับธีม">
          {theme === 'dark' ? <FiSun className="w-5 h-5 text-amber-400" /> : <FiMoon className="w-5 h-5 text-indigo-500" />}
        </button>
      </aside>

      {/* Mobile Drawer Overlay */}
      <AnimatePresence>
        {isOpen && (
          <>
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setIsOpen(false)}
              className="fixed inset-0 z-50 bg-black/40 backdrop-blur-sm md:hidden"
            />
            <motion.aside
              initial={{ x: '-100%' }}
              animate={{ x: 0 }}
              exit={{ x: '-100%' }}
              transition={{ type: 'spring', damping: 25, stiffness: 300 }}
              className="fixed inset-y-0 left-0 z-50 w-72 bg-white dark:bg-slate-950 shadow-2xl md:hidden flex flex-col"
            >
              <button
                onClick={() => setIsOpen(false)}
                className="absolute top-4 right-4 p-2 rounded-lg text-slate-400 hover:text-slate-600 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
              >
                <FiX className="w-5 h-5" />
              </button>
              <SidebarContent />
            </motion.aside>
          </>
        )}
      </AnimatePresence>
    </>
  );
}
