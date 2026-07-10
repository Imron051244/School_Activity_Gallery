import axios from 'axios';
import { initialAlbums, initialPhotos } from './mockData';

const ALBUMS_KEY = 'school_gallery_albums';
const PHOTOS_KEY = 'school_gallery_photos';

const getApiUrl = () => {
  return localStorage.getItem('school_gallery_api_url') || '';
};

const isApiEnabled = () => {
  const val = localStorage.getItem('school_gallery_api_enabled');
  if (val === null) return false; // เริ่มต้นที่โหมดจำลอง (Offline / LocalStorage) เสมอสำหรับผู้ใช้ใหม่
  return val === 'true';
};

/**
 * แปลงลิงก์ Google Drive เก่าที่ถูกบล็อก (docs.google.com/uc) 
 * ให้กลายเป็นลิงก์ thumbnail (drive.google.com/thumbnail) ที่แสดงผลบนเว็บได้จริง
 */
export const transformDriveUrl = (url, size = 1000) => {
  if (!url) return '';
  const urlStr = String(url);
  if (urlStr.includes('drive.google.com') || urlStr.includes('docs.google.com') || urlStr.includes('googleusercontent.com')) {
    const matchId = urlStr.match(/[?&]id=([^&]+)/) || urlStr.match(/\/d\/([a-zA-Z0-9_-]+)/);
    let fileId = '';
    if (matchId && matchId[1]) {
      fileId = matchId[1];
    } else {
      const matchPath = urlStr.match(/\/file\/d\/([^\/]+)/);
      if (matchPath && matchPath[1]) {
        fileId = matchPath[1];
      }
    }
    if (fileId) {
      const cleanId = fileId.split(/[?&#/]/)[0];
      return `https://drive.google.com/thumbnail?id=${cleanId}&sz=w${size}`;
    }
  }
  return url;
};

// ดีเลย์จำลองการโหลดข้อมูล 500-800ms
const delay = (ms = 500) => new Promise(resolve => setTimeout(resolve, ms));

/**
 * คำนวณปี พ.ศ. (ค.ศ. + 543)
 */
export const getThaiYear = (dateString) => {
  if (!dateString) return '';
  const date = new Date(dateString);
  if (isNaN(date.getTime())) return '';
  return date.getFullYear() + 543;
};

/**
 * ดึงชื่อโฟลเดอร์เดือนตามโครงสร้าง (เช่น "08-สิงหาคม")
 */
export const getThaiMonthFolder = (dateString) => {
  if (!dateString) return '';
  const date = new Date(dateString);
  if (isNaN(date.getTime())) return '';
  
  const monthNumber = String(date.getMonth() + 1).padStart(2, '0');
  const monthNames = [
    'มกราคม', 'กุมภาพันธ์', 'มีนาคม', 'เมษายน', 'พฤษภาคม', 'มิถุนายน',
    'กรกฎาคม', 'สิงหาคม', 'กันยายน', 'ตุลาคม', 'พฤศจิกายน', 'ธันวาคม'
  ];
  const monthName = monthNames[date.getMonth()];
  return `${monthNumber}-${monthName}`;
};

/**
 * สร้างพาธ Google Drive ของอัลบั้มกิจกรรม
 * รูปแบบ: School Gallery / [ปี พ.ศ.] / [เดือน] / [ชื่อกิจกรรม] /
 */
export const getDriveFolderPath = (dateString, albumTitle, category) => {
  const titleStr = String(albumTitle || '').trim();
  if (!titleStr) return '';
  const catName = String(category || 'ทั่วไป').trim();
  const cleanTitle = titleStr.replace(/[\/\\:*?"<>|]/g, '_');
  const yearBE = dateString ? getThaiYear(dateString) : new Date().getFullYear() + 543;
  return `School Gallery/${catName}/${cleanTitle}/${yearBE}/`;
};

const CATEGORIES_KEY = 'school_gallery_categories';
const defaultCategories = ['วิชาการ', 'กีฬา', 'คุณธรรม', 'ศิลปะ', 'ทั่วไป'];

// เติมข้อมูลตั้งต้นลง LocalStorage สำหรับการรันแบบออฟไลน์
const initializeLocalStorage = () => {
  if (localStorage.getItem('school_gallery_api_enabled') === null) {
    localStorage.setItem('school_gallery_api_enabled', 'false');
  }
  if (!localStorage.getItem(ALBUMS_KEY)) {
    localStorage.setItem(ALBUMS_KEY, JSON.stringify(initialAlbums));
  }
  if (!localStorage.getItem(PHOTOS_KEY)) {
    localStorage.setItem(PHOTOS_KEY, JSON.stringify(initialPhotos));
  }
  if (!localStorage.getItem(CATEGORIES_KEY)) {
    localStorage.setItem(CATEGORIES_KEY, JSON.stringify(defaultCategories));
  }
};
initializeLocalStorage();

// กำหนด headers สำหรับการส่ง POST request ไปยัง Google Apps Script เพื่อเลี่ยงปัญหา CORS OPTIONS preflight
const postHeaders = {
  headers: {
    'Content-Type': 'text/plain;charset=utf-8'
  }
};

export const apiService = {
  // ดึงข้อมูลอัลบั้มทั้งหมดพร้อมนับจำนวนภาพในแต่ละอัลบั้ม
  getAlbums: async () => {
    const url = getApiUrl();
    const enabled = isApiEnabled();

    if (enabled && url) {
      try {
        const response = await axios.get(url, { params: { action: 'getAlbums' } });
        return response.data.map(album => ({
          ...album,
          drive_folder_path: album.drive_folder_path || getDriveFolderPath(album.date, album.title, album.category)
        }));
      } catch (error) {
        console.error("API Error fetching albums, falling back to LocalStorage:", error);
        throw new Error("ไม่สามารถเชื่อมต่อ Google Sheets API ได้ กรุณาตรวจสอบ URL หรือรันโหมดออฟไลน์แทน");
      }
    } else {
      // โหมดออฟไลน์ (LocalStorage)
      await delay(50);
      const albums = JSON.parse(localStorage.getItem(ALBUMS_KEY)) || [];
      const photos = JSON.parse(localStorage.getItem(PHOTOS_KEY)) || [];

      const albumsWithDetails = albums.map(album => {
        const count = photos.filter(p => p.album_id === album.id).length;
        return {
          ...album,
          photoCount: count,
          drive_folder_path: getDriveFolderPath(album.date, album.title, album.category)
        };
      });

      return albumsWithDetails.sort((a, b) => new Date(b.date) - new Date(a.date));
    }
  },

  // ดึงข้อมูลภาพในอัลบั้มที่เลือก
  getPhotos: async (albumId) => {
    const url = getApiUrl();
    const enabled = isApiEnabled();

    if (enabled && url) {
      try {
        const response = await axios.get(url, { params: { action: 'getPhotos', albumId } });
        return response.data;
      } catch (error) {
        console.error("API Error fetching photos, falling back to LocalStorage:", error);
        throw new Error("ไม่สามารถเรียกรูปภาพผ่าน API ได้");
      }
    } else {
      // โหมดออฟไลน์ (LocalStorage)
      await delay(50);
      const photos = JSON.parse(localStorage.getItem(PHOTOS_KEY)) || [];
      const albumPhotos = photos.filter(photo => photo.album_id === albumId);
      
      const albums = JSON.parse(localStorage.getItem(ALBUMS_KEY)) || [];
      const parentAlbum = albums.find(a => a.id === albumId);
      const driveFolder = parentAlbum ? parentAlbum.drive_folder_path || getDriveFolderPath(parentAlbum.date, parentAlbum.title, parentAlbum.category) : '';

      return albumPhotos.map(photo => ({
        ...photo,
        drive_folder_path: driveFolder
      })).sort((a, b) => new Date(b.created_at) - new Date(a.created_at));
    }
  },

  // สร้างอัลบั้มใหม่
  createAlbum: async (albumData) => {
    const url = getApiUrl();
    const enabled = isApiEnabled();

    if (enabled && url) {
      try {
        const response = await axios.post(url, JSON.stringify({
          action: 'createAlbum',
          ...albumData
        }), postHeaders);
        return response.data.album;
      } catch (error) {
        console.error("API Error creating album:", error);
        throw new Error("ไม่สามารถเชื่อมบันทึกข้อมูลอัลบั้มลง Google Sheet ได้");
      }
    } else {
      // โหมดออฟไลน์ (LocalStorage)
      await delay(50);
      const albums = JSON.parse(localStorage.getItem(ALBUMS_KEY)) || [];
      const newId = `album-${Date.now()}`;
      
      const newAlbum = {
        id: newId,
        title: albumData.title,
        category: albumData.category,
        date: albumData.date,
        cover_image: albumData.cover_image || "https://images.unsplash.com/photo-1427504494785-3a9ca7044f45?w=800",
        description: albumData.description || "",
        tags: albumData.tags || "",
        drive_folder_path: albumData.custom_folder_url || getDriveFolderPath(albumData.date, albumData.title, albumData.category)
      };

      albums.push(newAlbum);
      localStorage.setItem(ALBUMS_KEY, JSON.stringify(albums));
      return newAlbum;
    }
  },

  // เพิ่มรูปภาพใหม่ลงในอัลบั้ม
  uploadPhoto: async (albumId, photoData) => {
    const url = getApiUrl();
    const enabled = isApiEnabled();

    if (enabled && url) {
      try {
        const response = await axios.post(url, JSON.stringify({
          action: 'uploadPhoto',
          album_id: albumId,
          fileBase64: photoData.fileBase64,
          fileName: photoData.fileName,
          caption: photoData.caption,
          photographer: photoData.photographer
        }), postHeaders);
        return response.data.photo;
      } catch (error) {
        console.error("API Error uploading photo:", error);
        throw new Error("เกิดข้อผิดพลาดในการอัปโหลดภาพขึ้นคลาวด์");
      }
    } else {
      // โหมดออฟไลน์ (LocalStorage)
      await delay(50);
      const photos = JSON.parse(localStorage.getItem(PHOTOS_KEY)) || [];
      
      // ใช้ภาพอัปโหลดจริง (Base64) หรือสุ่มภาพ Unsplash เป็นตัวเลือกสำรอง
      const finalUrl = photoData.fileBase64 || "https://images.unsplash.com/photo-1516627145497-ae6968895b74?w=800";
      
      const newPhoto = {
        id: `photo-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
        album_id: albumId,
        image_url: finalUrl,
        caption: photoData.caption || "",
        photographer: photoData.photographer || "ช่างภาพโรงเรียน",
        created_at: new Date().toISOString()
      };

      photos.push(newPhoto);
      localStorage.setItem(PHOTOS_KEY, JSON.stringify(photos));
      return newPhoto;
    }
  },

  // แก้ไขข้อมูลอัลบั้ม
  updateAlbum: async (albumId, albumData) => {
    const url = getApiUrl();
    const enabled = isApiEnabled();

    if (enabled && url) {
      try {
        const response = await axios.post(url, JSON.stringify({
          action: 'updateAlbum',
          album_id: albumId,
          ...albumData
        }), postHeaders);
        return response.data.album;
      } catch (error) {
        console.error("API Error updating album:", error);
        throw new Error("ไม่สามารถแก้ไขอัลบั้มบน Google Sheet ได้");
      }
    } else {
      await delay(50);
      const albums = JSON.parse(localStorage.getItem(ALBUMS_KEY)) || [];
      const index = albums.findIndex(a => a.id === albumId);
      if (index !== -1) {
        albums[index] = {
          ...albums[index],
          title: albumData.title,
          category: albumData.category,
          date: albumData.date,
          description: albumData.description || '',
          tags: albumData.tags || '',
          cover_image: albumData.cover_image || albums[index].cover_image,
          drive_folder_path: albumData.custom_folder_url || albums[index].drive_folder_path || getDriveFolderPath(albumData.date, albumData.title, albumData.category)
        };
        localStorage.setItem(ALBUMS_KEY, JSON.stringify(albums));
        return albums[index];
      }
      throw new Error("ไม่พบอัลบั้มที่ต้องการแก้ไข");
    }
  },

  // ลบอัลบั้ม
  deleteAlbum: async (albumId) => {
    const url = getApiUrl();
    const enabled = isApiEnabled();

    if (enabled && url) {
      try {
        await axios.post(url, JSON.stringify({
          action: 'deleteAlbum',
          album_id: albumId
        }), postHeaders);
        return true;
      } catch (error) {
        console.error("API Error deleting album:", error);
        throw new Error("ไม่สามารถลบอัลบั้มบน Google Sheet ได้");
      }
    } else {
      await delay(50);
      let albums = JSON.parse(localStorage.getItem(ALBUMS_KEY)) || [];
      albums = albums.filter(a => a.id !== albumId);
      localStorage.setItem(ALBUMS_KEY, JSON.stringify(albums));

      let photos = JSON.parse(localStorage.getItem(PHOTOS_KEY)) || [];
      photos = photos.filter(p => p.album_id !== albumId);
      localStorage.setItem(PHOTOS_KEY, JSON.stringify(photos));
      return true;
    }
  },

  // ลบรูปภาพแบบเดี่ยว หรือแบบหลายรายการพร้อมกัน (Bulk Delete)
  deletePhotos: async (photoIds) => {
    const url = getApiUrl();
    const enabled = isApiEnabled();

    if (enabled && url) {
      try {
        await axios.post(url, JSON.stringify({
          action: 'deletePhotos',
          photo_ids: photoIds
        }), postHeaders);
        return true;
      } catch (error) {
        console.error("API Error deleting photos:", error);
        throw new Error("ไม่สามารถลบรูปภาพบนคลาวด์ได้");
      }
    } else {
      await delay(50);
      let photos = JSON.parse(localStorage.getItem(PHOTOS_KEY)) || [];
      photos = photos.filter(p => !photoIds.includes(p.id));
      localStorage.setItem(PHOTOS_KEY, JSON.stringify(photos));
      return true;
    }
  },

  // ซิงค์รูปภาพกิจกรรมจาก Google Drive
  syncAlbumPhotos: async (albumId) => {
    const url = getApiUrl();
    const enabled = isApiEnabled();

    if (enabled && url) {
      try {
        const response = await axios.post(url, JSON.stringify({
          action: 'syncAlbumPhotos',
          album_id: albumId
        }), postHeaders);
        return response.data.stats;
      } catch (error) {
        console.error("API Error syncing album photos:", error);
        throw new Error("ไม่สามารถซิงค์รูปภาพกับ Google Drive ได้");
      }
    } else {
      await delay(50);
      return { addedCount: 0, removedCount: 0 };
    }
  },

  // ดึงหมวดหมู่ทั้งหมด
  getCategories: async () => {
    const url = getApiUrl();
    const enabled = isApiEnabled();

    if (enabled && url) {
      try {
        const response = await axios.get(url, { params: { action: 'getCategories' } });
        if (response.data && Array.isArray(response.data)) {
          return response.data;
        }
      } catch (error) {
        console.error("API Error fetching categories, falling back to LocalStorage:", error);
      }
    }
    
    await delay(200);
    return JSON.parse(localStorage.getItem(CATEGORIES_KEY)) || defaultCategories;
  },

  // เพิ่มหมวดหมู่ใหม่
  addCategory: async (categoryName) => {
    const url = getApiUrl();
    const enabled = isApiEnabled();

    if (enabled && url) {
      try {
        await axios.post(url, JSON.stringify({
          action: 'addCategory',
          category: categoryName
        }), postHeaders);
        return true;
      } catch (error) {
        console.error("API Error adding category:", error);
      }
    }

    await delay(300);
    const categories = JSON.parse(localStorage.getItem(CATEGORIES_KEY)) || defaultCategories;
    if (!categories.includes(categoryName)) {
      categories.push(categoryName);
      localStorage.setItem(CATEGORIES_KEY, JSON.stringify(categories));
    }
    return true;
  },

  // ลบหมวดหมู่
  deleteCategory: async (categoryName) => {
    const url = getApiUrl();
    const enabled = isApiEnabled();

    if (enabled && url) {
      try {
        await axios.post(url, JSON.stringify({
          action: 'deleteCategory',
          category: categoryName
        }), postHeaders);
        return true;
      } catch (error) {
        console.error("API Error deleting category:", error);
      }
    }

    await delay(300);
    let categories = JSON.parse(localStorage.getItem(CATEGORIES_KEY)) || defaultCategories;
    categories = categories.filter(c => c !== categoryName);
    localStorage.setItem(CATEGORIES_KEY, JSON.stringify(categories));
    return true;
  },

  // ดึงรูปภาพทั้งหมดที่มีอยู่
  getAllPhotos: async () => {
    const url = getApiUrl();
    const enabled = isApiEnabled();

    if (enabled && url) {
      try {
        const response = await axios.get(url, { params: { action: 'getAllPhotos' } });
        return response.data;
      } catch (error) {
        console.error("API Error fetching all photos:", error);
      }
    }

    await delay(300);
    return JSON.parse(localStorage.getItem(PHOTOS_KEY)) || [];
  }
};
