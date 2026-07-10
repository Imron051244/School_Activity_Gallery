import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { FiPlus, FiFolder, FiImage, FiX } from 'react-icons/fi';

export default function FABMenu({ onOpenModal }) {
  const [isOpen, setIsOpen] = useState(false);

  const menuItems = [
    { label: 'สร้างอัลบั้มใหม่', icon: FiFolder, type: 'album', color: 'bg-primary-500 hover:bg-primary-600 shadow-primary-500/30' },
    { label: 'อัปโหลดรูปภาพ', icon: FiImage, type: 'photo', color: 'bg-emerald-500 hover:bg-emerald-600 shadow-emerald-500/30' },
  ];

  const handleClick = (type) => {
    setIsOpen(false);
    onOpenModal(type);
  };

  return (
    <div className="fixed bottom-6 right-6 z-50 flex flex-col-reverse items-end gap-3">
      {/* ปุ่ม FAB หลัก */}
      <motion.button
        whileTap={{ scale: 0.9 }}
        onClick={() => setIsOpen(!isOpen)}
        className={`w-14 h-14 rounded-2xl flex items-center justify-center text-white shadow-xl transition-all duration-300
          ${isOpen 
            ? 'bg-rose-500 hover:bg-rose-600 shadow-rose-500/30 rotate-45' 
            : 'bg-gradient-to-br from-primary-500 to-indigo-600 hover:from-primary-600 hover:to-indigo-700 shadow-primary-500/30'
          }`}
      >
        {isOpen ? <FiX className="w-6 h-6 -rotate-45" /> : <FiPlus className="w-6 h-6" />}
      </motion.button>

      {/* เมนูย่อย */}
      <AnimatePresence>
        {isOpen && (
          <div className="flex flex-col items-end gap-2.5">
            {menuItems.map((item, index) => (
              <motion.div
                key={item.type}
                initial={{ opacity: 0, y: 10, scale: 0.8 }}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                exit={{ opacity: 0, y: 10, scale: 0.8 }}
                transition={{ delay: index * 0.08 }}
                className="flex items-center gap-2.5"
              >
                <span className="px-3 py-1.5 rounded-lg bg-slate-800 dark:bg-slate-700 text-white text-xs font-semibold shadow-lg whitespace-nowrap">
                  {item.label}
                </span>
                <button
                  onClick={() => handleClick(item.type)}
                  className={`w-11 h-11 rounded-xl flex items-center justify-center text-white shadow-lg transition-all ${item.color}`}
                >
                  <item.icon className="w-5 h-5" />
                </button>
              </motion.div>
            ))}
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}
