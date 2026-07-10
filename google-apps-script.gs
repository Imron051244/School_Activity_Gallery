/**
 * Google Apps Script for School Activity Gallery REST API (Live API Backend)
 * 
 * วิธีการติดตั้ง:
 * 1. เปิด Google Sheets > คลิกเมนู "ส่วนขยาย" (Extensions) > "Apps Script"
 * 2. ลบโค้ดเดิมทั้งหมดในไฟล์ Code.gs ออก
 * 3. คัดลอกซอร์สโค้ดนี้ไปวางและกดบันทึก
 * 4. กดปุ่ม "การทำให้ใช้งานได้" (Deploy) > "การทำให้ใช้งานได้ใหม่" (New deployment)
 * 5. เลือกประเภทการทำงานเป็น "เว็บแอป" (Web app)
 * 6. ตั้งค่าสิทธิ์การเข้าถึง (Who has access) เป็น "ทุกคน" (Anyone)
 * 7. กด Deploy และคัดลอก Web App URL ไปวางในหน้าตั้งค่าของโปรเจกต์ React
 */

// ชื่อโฟลเดอร์รากหลักบน Google Drive
const ROOT_FOLDER_NAME = "School Gallery";

// แผ่นงานฐานข้อมูลในชีต
const ALBUMS_SHEET = "Albums";
const PHOTOS_SHEET = "Photos";
const CATEGORIES_SHEET = "Categories";

/**
 * จัดการคำขอ HTTP GET (อ่านข้อมูล)
 */
function doGet(e) {
  try {
    const action = e.parameter.action;
    const ss = SpreadsheetApp.getActiveSpreadsheet();
    checkAndInitSheets(ss);

    if (action === "getAlbums") {
      const albumsData = getAlbumsWithCount(ss);
      return jsonResponse(albumsData);
    } 
    else if (action === "getPhotos") {
      const albumId = e.parameter.albumId;
      if (!albumId) throw new Error("Missing parameter: albumId");
      const photosData = getPhotosForAlbum(ss, albumId);
      return jsonResponse(photosData);
    } 
    else if (action === "getAllPhotos") {
      const photosSheet = ss.getSheetByName(PHOTOS_SHEET);
      const photosData = getSheetDataAsObjects(photosSheet);
      return jsonResponse(photosData);
    }
    else if (action === "getCategories") {
      const categoriesSheet = ss.getSheetByName(CATEGORIES_SHEET);
      const rows = categoriesSheet.getDataRange().getValues();
      const categoriesList = [];
      for (let i = 1; i < rows.length; i++) {
        if (rows[i][0]) categoriesList.push(rows[i][0]);
      }
      return jsonResponse(categoriesList);
    }
    else {
      return jsonResponse({ error: "Invalid action." }, 400);
    }
  } catch (error) {
    return jsonResponse({ error: error.message }, 500);
  }
}

/**
 * จัดการคำขอ HTTP POST (สร้างอัลบั้ม อัปโหลดไฟล์ แก้ไข และลบข้อมูลโฟลเดอร์)
 */
function doPost(e) {
  try {
    const postData = JSON.parse(e.postData.contents);
    const action = postData.action;
    const ss = SpreadsheetApp.getActiveSpreadsheet();
    checkAndInitSheets(ss);

    if (action === "createAlbum") {
      const album = createAlbumRow(ss, postData);
      return jsonResponse({ success: true, album: album });
    } 
    else if (action === "updateAlbum") {
      const album = updateAlbumRowAndFolder(ss, postData);
      return jsonResponse({ success: true, album: album });
    } 
    else if (action === "deleteAlbum") {
      deleteAlbumRowAndFolder(ss, postData.album_id);
      return jsonResponse({ success: true });
    } 
    else if (action === "uploadPhoto") {
      const photo = uploadPhotoToDriveAndSheet(ss, postData);
      return jsonResponse({ success: true, photo: photo });
    } 
    else if (action === "deletePhotos") {
      deletePhotosRows(ss, postData.photo_ids);
      return jsonResponse({ success: true });
    } 
    else if (action === "syncAlbumPhotos") {
      const stats = syncAlbumPhotos(ss, postData.album_id);
      return jsonResponse({ success: true, stats: stats });
    }
    else if (action === "addCategory") {
      const categoriesSheet = ss.getSheetByName(CATEGORIES_SHEET);
      const category = postData.category;
      if (category) {
        const rows = categoriesSheet.getDataRange().getValues();
        let exists = false;
        for (let i = 1; i < rows.length; i++) {
          if (rows[i][0] === category) { exists = true; break; }
        }
        if (!exists) {
          categoriesSheet.appendRow([category]);
        }
      }
      return jsonResponse({ success: true });
    }
    else if (action === "deleteCategory") {
      const categoriesSheet = ss.getSheetByName(CATEGORIES_SHEET);
      const category = postData.category;
      const rows = categoriesSheet.getDataRange().getValues();
      for (let i = rows.length - 1; i >= 1; i--) {
        if (rows[i][0] === category) {
          categoriesSheet.deleteRow(i + 1);
        }
      }
      return jsonResponse({ success: true });
    }
    else {
      return jsonResponse({ error: "Invalid action." }, 400);
    }
  } catch (error) {
    return jsonResponse({ error: error.message }, 500);
  }
}

/**
 * ดึงรายการอัลบั้มและนับจำนวนรูปภาพกิจกรรม
 */
function getAlbumsWithCount(ss) {
  const albumsSheet = ss.getSheetByName(ALBUMS_SHEET);
  const photosSheet = ss.getSheetByName(PHOTOS_SHEET);
  
  const albums = getSheetDataAsObjects(albumsSheet);
  const photos = getSheetDataAsObjects(photosSheet);
  
  return albums.map(album => {
    const count = photos.filter(p => p.album_id === album.id).length;
    return {
      ...album,
      photoCount: count
    };
  });
}

/**
 * ดึงรายการภาพทั้งหมดในอัลบั้มที่เลือก
 */
function getPhotosForAlbum(ss, albumId) {
  const photosSheet = ss.getSheetByName(PHOTOS_SHEET);
  const photos = getSheetDataAsObjects(photosSheet);
  return photos.filter(p => p.album_id === albumId);
}

/**
 * เพิ่มแถวอัลบั้มกิจกรรมใน Google Sheet
 */
function createAlbumRow(ss, data) {
  const sheet = ss.getSheetByName(ALBUMS_SHEET);
  const newId = "album-" + Date.now();
  const dateStr = data.date;
  const category = data.category || "ทั่วไป";
  
  // 1. จัดการเลือกหรือสร้างโฟลเดอร์ Google Drive
  let folder;
  if (data.custom_folder_url) {
    const folderId = extractFolderId(data.custom_folder_url);
    try {
      folder = DriveApp.getFolderById(folderId);
      folder.setSharing(DriveApp.Access.ANYONE_WITH_LINK, DriveApp.Permission.VIEW);
    } catch (e) {
      Logger.log("Failed to connect existing folder, creating new instead: " + e.message);
      folder = getFolderStructure(dateStr, data.title, category);
    }
  } else {
    folder = getFolderStructure(dateStr, data.title, category);
  }
  const folderUrl = folder.getUrl();

  // 2. จัดการอัปโหลดภาพปก
  let coverImageUrl = data.cover_image || "";
  if (data.fileBase64 && data.fileName) {
    coverImageUrl = saveBase64FileToDrive(folder, data.fileBase64, data.fileName);
  } else if (!coverImageUrl) {
    coverImageUrl = "https://images.unsplash.com/photo-1427504494785-3a9ca7044f45?w=800";
  }
  
  const newRow = [
    newId,
    data.title,
    category,
    dateStr,
    coverImageUrl,
    data.description || "",
    data.tags || "",
    folderUrl // คอลัมน์ที่ 8: drive_folder_path
  ];
  
  sheet.appendRow(newRow);
  
  return {
    id: newId,
    title: data.title,
    category: category,
    date: dateStr,
    cover_image: coverImageUrl,
    description: data.description || "",
    tags: data.tags || "",
    drive_folder_path: folderUrl
  };
}

/**
 * อัปเดตข้อมูลแถวอัลบั้มใน Google Sheets และแก้ไขชื่อโฟลเดอร์ใน Google Drive
 */
function updateAlbumRowAndFolder(ss, data) {
  const sheet = ss.getSheetByName(ALBUMS_SHEET);
  const rows = sheet.getDataRange().getValues();
  const albumId = data.album_id;
  
  let targetRowIndex = -1;
  let oldTitle = "";
  let oldDate = "";
  let oldCategory = "";
  let oldCover = "";
  let oldFolderUrl = "";

  for (let i = 1; i < rows.length; i++) {
    if (rows[i][0] === albumId) {
      targetRowIndex = i + 1; // 1-indexed for sheets API
      oldTitle = rows[i][1];
      oldCategory = rows[i][2];
      oldDate = rows[i][3];
      oldCover = rows[i][4];
      oldFolderUrl = rows[i][7] || "";
      break;
    }
  }

  if (targetRowIndex === -1) throw new Error("Album not found: " + albumId);

  const newTitle = data.title;
  const newDate = data.date;
  const newCategory = data.category || "ทั่วไป";
  const newDescription = data.description || "";
  const newTags = data.tags || "";
  let newCover = data.cover_image || oldCover;

  // 1. จัดการโฟลเดอร์ Google Drive (อัปเดต หรือ เปลี่ยนชื่อ/ย้ายโฟลเดอร์)
  let folder;
  if (data.custom_folder_url) {
    const folderId = extractFolderId(data.custom_folder_url);
    try {
      folder = DriveApp.getFolderById(folderId);
      folder.setSharing(DriveApp.Access.ANYONE_WITH_LINK, DriveApp.Permission.VIEW);
    } catch (e) {
      folder = getFolderStructure(newDate, newTitle, newCategory, albumId);
    }
  } else {
    folder = findAlbumFolder(oldDate, oldTitle, oldCategory, albumId);
    if (folder) {
      // จัดระบบการย้ายโครงสร้างโฟลเดอร์เมื่อมีการแก้ไขข้อมูลอัลบั้ม
      try {
        let rootFolder;
        const roots = DriveApp.getFoldersByName(ROOT_FOLDER_NAME);
        if (roots.hasNext()) { rootFolder = roots.next(); } else { rootFolder = DriveApp.createFolder(ROOT_FOLDER_NAME); }
        
        let catFolder;
        const catFolders = rootFolder.getFoldersByName(newCategory);
        if (catFolders.hasNext()) { catFolder = catFolders.next(); } else { catFolder = rootFolder.createFolder(newCategory); }
        
        const cleanTitle = newTitle.replace(/[\/\\:*?"<>|]/g, "_");
        let albumFolder;
        const albumFolders = catFolder.getFoldersByName(cleanTitle);
        if (albumFolders.hasNext()) { albumFolder = albumFolders.next(); } else { albumFolder = catFolder.createFolder(cleanTitle); }
        
        // ย้ายโฟลเดอร์ปี พ.ศ. ไปที่ Parent ใหม่
        const oldParentId = folder.getParents().hasNext() ? folder.getParents().next().getId() : "";
        if (oldParentId && oldParentId !== albumFolder.getId()) {
          folder.moveTo(albumFolder);
        }
        
        // เปลี่ยนชื่อปี พ.ศ. หากมีการเปลี่ยนแปลงวันที่
        const date = new Date(newDate);
        const yearBE = (isNaN(date.getTime()) ? new Date().getFullYear() : date.getFullYear()) + 543;
        const yearNameStr = yearBE.toString();
        if (folder.getName() !== yearNameStr) {
          folder.setName(yearNameStr);
        }
      } catch (err) {
        Logger.log("Error moving folder: " + err.message);
      }
    } else {
      folder = getFolderStructure(newDate, newTitle, newCategory, albumId);
    }
  }
  const folderUrl = folder ? folder.getUrl() : oldFolderUrl;

  // 2. อัปโหลดภาพปกใหม่ถ้ามีการแนบไฟล์เข้ามาใหม่
  if (data.fileBase64 && data.fileName && folder) {
    newCover = saveBase64FileToDrive(folder, data.fileBase64, data.fileName);
  }

  // อัปเดตข้อมูลใน Sheet
  sheet.getRange(targetRowIndex, 2).setValue(newTitle);
  sheet.getRange(targetRowIndex, 3).setValue(newCategory);
  sheet.getRange(targetRowIndex, 4).setValue(newDate);
  sheet.getRange(targetRowIndex, 5).setValue(newCover);
  sheet.getRange(targetRowIndex, 6).setValue(newDescription);
  sheet.getRange(targetRowIndex, 7).setValue(newTags);
  sheet.getRange(targetRowIndex, 8).setValue(folderUrl);

  return {
    id: albumId,
    title: newTitle,
    category: newCategory,
    date: newDate,
    cover_image: newCover,
    description: newDescription,
    tags: newTags,
    drive_folder_path: folderUrl
  };
}

/**
 * ลบแถวอัลบั้มกิจกรรมใน Google Sheet และย้ายโฟลเดอร์ Google Drive ลงถังขยะ
 */
function deleteAlbumRowAndFolder(ss, albumId) {
  const albumsSheet = ss.getSheetByName(ALBUMS_SHEET);
  const photosSheet = ss.getSheetByName(PHOTOS_SHEET);
  
  const albums = getSheetDataAsObjects(albumsSheet);
  const targetAlbum = albums.find(a => a.id === albumId);
  
  if (targetAlbum) {
    try {
      const folder = findAlbumFolder(targetAlbum.date, targetAlbum.title, targetAlbum.category, albumId);
      if (folder) {
        // ดึงโฟลเดอร์แม่ (ซึ่งคือโฟลเดอร์กิจกรรมหลัก เช่น "กิจกรรมวันไหว้ครู") เพื่อลบโฟลเดอร์กิจกรรมทั้งหมดไม่ให้ตกค้าง
        const parents = folder.getParents();
        if (parents.hasNext()) {
          const parentFolder = parents.next();
          const categoryFolder = parentFolder.getParents().hasNext() ? parentFolder.getParents().next() : null;
          
          // ลบโฟลเดอร์กิจกรรมหลัก
          parentFolder.setTrashed(true);
          
          // ล้างโฟลเดอร์ประเภทขยะ (หากไม่มีกิจกรรมเหลืออยู่ในประเภทนี้แล้ว)
          if (categoryFolder) {
            cleanUpEmptyParents(categoryFolder);
          }
        } else {
          folder.setTrashed(true);
        }
      }
    } catch (e) {
      Logger.log("Error deleting Drive folder: " + e.message);
    }
  }

  // ฟังก์ชันย่อยทำความสะอาดโฟลเดอร์ประเภทที่ว่างเปล่า (Recursive Cleanup)
  function cleanUpEmptyParents(parentFolder) {
    try {
      if (!parentFolder) return;
      const name = parentFolder.getName();
      if (name === ROOT_FOLDER_NAME || name === "Drive") return;
      
      // ตรวจสอบว่ามีโฟลเดอร์หรือไฟล์ที่ยังไม่ได้ถูกลบอยู่ในนี้หรือไม่
      const subfolders = parentFolder.getFolders();
      let hasContent = false;
      while (subfolders.hasNext()) {
        const sub = subfolders.next();
        if (!sub.isTrashed()) {
          hasContent = true;
          break;
        }
      }
      
      if (!hasContent) {
        const files = parentFolder.getFiles();
        while (files.hasNext()) {
          const file = files.next();
          if (!file.isTrashed()) {
            hasContent = true;
            break;
          }
        }
      }
      
      // หากไม่มีข้อมูลใดๆ ตกค้าง ให้ลบโฟลเดอร์นี้และลูปทำความสะอาดขึ้นไปชั้นบน
      if (!hasContent) {
        const nextParents = parentFolder.getParents();
        parentFolder.setTrashed(true);
        if (nextParents.hasNext()) {
          cleanUpEmptyParents(nextParents.next());
        }
      }
    } catch (e) {
      Logger.log("Error cleaning up empty parents: " + e.message);
    }
  }

  const albumRows = albumsSheet.getDataRange().getValues();
  for (let i = albumRows.length - 1; i >= 1; i--) {
    if (albumRows[i][0] === albumId) {
      albumsSheet.deleteRow(i + 1);
    }
  }

  const photoRows = photosSheet.getDataRange().getValues();
  for (let i = photoRows.length - 1; i >= 1; i--) {
    if (photoRows[i][1] === albumId) {
      photosSheet.deleteRow(i + 1);
    }
  }
}

/**
 * ลบรายการรูปภาพในชีต Photos
 */
function deletePhotosRows(ss, photoIds) {
  const sheet = ss.getSheetByName(PHOTOS_SHEET);
  const rows = sheet.getDataRange().getValues();
  
  for (let i = rows.length - 1; i >= 1; i--) {
    if (photoIds.indexOf(rows[i][0]) !== -1) {
      const driveFileId = rows[i][3];
      if (driveFileId) {
        try {
          const file = DriveApp.getFileById(driveFileId);
          if (file) file.setTrashed(true);
        } catch (e) {
          Logger.log("Error deleting photo file from Drive: " + e.message);
        }
      }
      sheet.deleteRow(i + 1);
    }
  }
}

/**
 * อัปโหลดรูปภาพไปยัง Google Drive และบันทึกข้อมูลเข้า Sheet Photos
 */
function uploadPhotoToDriveAndSheet(ss, data) {
  const albumsSheet = ss.getSheetByName(ALBUMS_SHEET);
  const photosSheet = ss.getSheetByName(PHOTOS_SHEET);
  
  const albums = getSheetDataAsObjects(albumsSheet);
  const targetAlbum = albums.find(a => a.id === data.album_id);
  if (!targetAlbum) throw new Error("Target album not found: " + data.album_id);
  
  const folder = getFolderStructure(targetAlbum.date, targetAlbum.title, targetAlbum.category, data.album_id);
  
  let imageUrl = "";
  let driveFileId = "";

  if (data.fileBase64 && data.fileName && folder) {
    const fileResult = saveBase64FileToDriveWithId(folder, data.fileBase64, data.fileName);
    imageUrl = fileResult.url;
    driveFileId = fileResult.id;
  } else if (data.image_url) {
    imageUrl = data.image_url;
  } else {
    throw new Error("No image data provided or Drive folder access issue");
  }

  const newId = "photo-" + Date.now();
  const createdAt = new Date().toISOString();

  const newRow = [
    newId,
    data.album_id,
    imageUrl,
    driveFileId,
    data.caption || "",
    data.photographer || "ช่างภาพโรงเรียน",
    createdAt,
    data.subfolder || ""
  ];

  photosSheet.appendRow(newRow);

  return {
    id: newId,
    album_id: data.album_id,
    image_url: imageUrl,
    caption: data.caption || "",
    photographer: data.photographer || "ช่างภาพโรงเรียน",
    created_at: createdAt,
    subfolder: data.subfolder || ""
  };
}

/**
 * ซิงค์ภาพทั้งหมดจาก Google Drive (รวมถึงภาพในโฟลเดอร์ย่อย) เข้าสู่ Sheets
 */
function syncAlbumPhotos(ss, albumId) {
  const albumsSheet = ss.getSheetByName(ALBUMS_SHEET);
  const photosSheet = ss.getSheetByName(PHOTOS_SHEET);
  
  const albums = getSheetDataAsObjects(albumsSheet);
  const targetAlbum = albums.find(a => a.id === albumId);
  if (!targetAlbum) throw new Error("Target album not found");
  
  const folder = getFolderStructure(targetAlbum.date, targetAlbum.title, targetAlbum.category, albumId);
  if (!folder) throw new Error("Google Drive folder not found");
  
  // 1. ดึงข้อมูลรูปภาพปัจจุบันในสเปรดชีตของอัลบั้มนี้
  const existingPhotos = getSheetDataAsObjects(photosSheet).filter(p => p.album_id === albumId);
  const existingFileIds = existingPhotos.map(p => p.drive_file_id).filter(id => id);
  
  const filesInDrive = []; // { id, name, url, subfolder }
  
  // 2. สแกนไฟล์รูปภาพในโฟลเดอร์หลัก (คือโฟลเดอร์ปี พ.ศ. ตามโครงสร้างใหม่)
  const rootFiles = folder.getFiles();
  while (rootFiles.hasNext()) {
    const file = rootFiles.next();
    if (isImageFile(file)) {
      try {
        file.setSharing(DriveApp.Access.ANYONE_WITH_LINK, DriveApp.Permission.VIEW);
      } catch(e) {
        Logger.log("Failed to set share settings for file: " + file.getName());
      }
      filesInDrive.push({
        id: file.getId(),
        name: file.getName(),
        url: "https://lh3.googleusercontent.com/d/" + file.getId(),
        subfolder: ""
      });
    }
  }
  
  // 3. สแกนโฟลเดอร์ย่อย (Subfolders) เพื่อดึงข้อมูลโฟลเดอร์ที่ผู้ใช้สร้างเพิ่มเอง
  const subfolders = folder.getFolders();
  while (subfolders.hasNext()) {
    const subfolder = subfolders.next();
    const subfolderName = subfolder.getName();
    const subFiles = subfolder.getFiles();
    while (subFiles.hasNext()) {
      const file = subFiles.next();
      if (isImageFile(file)) {
        try {
          file.setSharing(DriveApp.Access.ANYONE_WITH_LINK, DriveApp.Permission.VIEW);
        } catch(e) {
          Logger.log("Failed to set share settings for subfolder file: " + file.getName());
        }
        filesInDrive.push({
          id: file.getId(),
          name: file.getName(),
          url: "https://lh3.googleusercontent.com/d/" + file.getId(),
          subfolder: subfolderName
        });
      }
    }
  }
  
  // 4. เปรียบเทียบและอัปเดตข้อมูลลงชีต
  let addedCount = 0;
  let removedCount = 0;
  
  const driveFileIds = filesInDrive.map(f => f.id);
  
  // ก. เพิ่มรูปภาพใหม่ที่พบใน Drive แต่ยังไม่มีใน Sheet
  const newRows = [];
  filesInDrive.forEach(file => {
    if (existingFileIds.indexOf(file.id) === -1) {
      const newId = "photo-" + Date.now() + "-" + Math.floor(Math.random() * 1000000);
      const createdAt = new Date().toISOString();
      newRows.push([
        newId,
        albumId,
        file.url,
        file.id,
        file.name.split(".")[0], // ใช้ชื่อไฟล์เป็นคำอธิบายภาพ
        "ช่างภาพโรงเรียน",
        createdAt,
        file.subfolder // คอลัมน์ที่ 8: subfolder
      ]);
      addedCount++;
    }
  });
  if (newRows.length > 0) {
    photosSheet.getRange(photosSheet.getLastRow() + 1, 1, newRows.length, newRows[0].length).setValues(newRows);
  }
  
  // ข. ลบข้อมูลรูปภาพใน Sheet ที่ไม่มีไฟล์อยู่ใน Drive แล้ว (ซิงค์การลบรูปภาพ)
  const allRows = photosSheet.getDataRange().getValues();
  const headers = allRows[0];
  const remainingRows = [headers];
  
  for (let i = 1; i < allRows.length; i++) {
    const row = allRows[i];
    const rowAlbumId = row[1];
    const rowFileId = row[3];
    
    if (rowAlbumId === albumId && rowFileId) {
      if (driveFileIds.indexOf(rowFileId) === -1) {
        removedCount++;
        continue; // Exclude (delete) this row
      }
    }
    remainingRows.push(row);
  }
  
  if (removedCount > 0) {
    photosSheet.clearContents();
    photosSheet.getRange(1, 1, remainingRows.length, headers.length).setValues(remainingRows);
  }
  
  return { addedCount: addedCount, removedCount: removedCount };
}

function isImageFile(file) {
  const mime = file.getMimeType();
  return mime && mime.toLowerCase().indexOf("image/") === 0;
}

/**
 * บันทึกไฟล์ Base64 และสร้างลิงก์แสดงผลของ Drive
 */
function saveBase64FileToDrive(folder, base64Data, fileName) {
  const result = saveBase64FileToDriveWithId(folder, base64Data, fileName);
  return result.url;
}

function saveBase64FileToDriveWithId(folder, base64Data, fileName) {
  const base64Clean = base64Data.split(",")[1];
  const decoded = Utilities.base64Decode(base64Clean);
  const mimeType = base64Data.split(";")[0].split(":")[1];
  
  const blob = Utilities.newBlob(decoded, mimeType, fileName);
  const file = folder.createFile(blob);
  
  file.setSharing(DriveApp.Access.ANYONE_WITH_LINK, DriveApp.Permission.VIEW);
  
  const fileId = file.getId();
  const directImageUrl = "https://lh3.googleusercontent.com/d/" + fileId;
  
  return { url: directImageUrl, id: fileId };
}

/**
 * ค้นหาโฟลเดอร์ของกิจกรรมย่อยตามลำดับชั้น ประเภท/กิจกรรม/ปี
 */
function findAlbumFolder(dateString, albumTitle, category, albumId) {
  // หากมีบันทึกในระบบเป็น URL อยู่แล้ว ให้คืนโฟลเดอร์นั้นกลับไปทันที
  if (albumId) {
    const ss = SpreadsheetApp.getActiveSpreadsheet();
    const sheet = ss.getSheetByName(ALBUMS_SHEET);
    const rows = sheet.getDataRange().getValues();
    for (let i = 1; i < rows.length; i++) {
      if (rows[i][0] === albumId) {
        const savedPath = rows[i][7]; // drive_folder_path
        if (savedPath && savedPath.indexOf("http") !== -1) {
          const folderId = extractFolderId(savedPath);
          try {
            return DriveApp.getFolderById(folderId);
          } catch (e) {
            Logger.log("Failed to get folder by ID: " + e.message);
          }
        }
        break;
      }
    }
  }

  // ค้นหาตามโครงสร้าง ประเภท > กิจกรรม > ปี
  let rootFolder;
  const roots = DriveApp.getFoldersByName(ROOT_FOLDER_NAME);
  if (!roots.hasNext()) return null;
  rootFolder = roots.next();

  const catName = category || "ทั่วไป";
  const catFolders = rootFolder.getFoldersByName(catName);
  if (!catFolders.hasNext()) return null;
  const catFolder = catFolders.next();

  const cleanTitle = albumTitle.replace(/[\/\\:*?"<>|]/g, "_");
  const albumFolders = catFolder.getFoldersByName(cleanTitle);
  if (!albumFolders.hasNext()) return null;
  const albumFolder = albumFolders.next();

  const date = new Date(dateString);
  const yearBE = (isNaN(date.getTime()) ? new Date().getFullYear() : date.getFullYear()) + 543;
  const yearNameStr = yearBE.toString();
  const yearFolders = albumFolder.getFoldersByName(yearNameStr);
  if (!yearFolders.hasNext()) return null;
  return yearFolders.next();
}

/**
 * สร้างและดึงสิทธิ์โฟลเดอร์ 4 ลำดับชั้น: School Gallery / ประเภท / กิจกรรม / ปี พ.ศ. /
 */
function getFolderStructure(dateString, albumTitle, category, albumId) {
  if (albumId) {
    const ss = SpreadsheetApp.getActiveSpreadsheet();
    const sheet = ss.getSheetByName(ALBUMS_SHEET);
    const rows = sheet.getDataRange().getValues();
    for (let i = 1; i < rows.length; i++) {
      if (rows[i][0] === albumId) {
        const savedPath = rows[i][7];
        if (savedPath && savedPath.indexOf("http") !== -1) {
          const folderId = extractFolderId(savedPath);
          try {
            return DriveApp.getFolderById(folderId);
          } catch (e) {
            Logger.log("Failed to find existing folder by ID: " + e.message);
          }
        }
        break;
      }
    }
  }

  let rootFolder;
  const roots = DriveApp.getFoldersByName(ROOT_FOLDER_NAME);
  if (roots.hasNext()) {
    rootFolder = roots.next();
  } else {
    rootFolder = DriveApp.createFolder(ROOT_FOLDER_NAME);
  }

  // ชั้นที่ 2: ประเภทหมวดหมู่
  const catName = category || "ทั่วไป";
  let catFolder;
  const catFolders = rootFolder.getFoldersByName(catName);
  if (catFolders.hasNext()) {
    catFolder = catFolders.next();
  } else {
    catFolder = rootFolder.createFolder(catName);
  }

  // ชั้นที่ 3: ชื่อกิจกรรม
  const cleanTitle = albumTitle.replace(/[\/\\:*?"<>|]/g, "_");
  let albumFolder;
  const albumFolders = catFolder.getFoldersByName(cleanTitle);
  if (albumFolders.hasNext()) {
    albumFolder = albumFolders.next();
  } else {
    albumFolder = catFolder.createFolder(cleanTitle);
  }

  // ชั้นที่ 4: ปี พ.ศ.
  const date = new Date(dateString);
  const yearBE = (isNaN(date.getTime()) ? new Date().getFullYear() : date.getFullYear()) + 543;
  const yearNameStr = yearBE.toString();
  let yearFolder;
  const yearFolders = albumFolder.getFoldersByName(yearNameStr);
  if (yearFolders.hasNext()) {
    yearFolder = yearFolders.next();
  } else {
    yearFolder = albumFolder.createFolder(yearNameStr);
  }
  
  return yearFolder;
}

/**
 * พาร์สข้อมูลชีตฐานข้อมูลออกมาเป็น Array of Objects คีย์ตามแถวหัวตาราง
 */
function getSheetDataAsObjects(sheet) {
  const range = sheet.getDataRange();
  const values = range.getValues();
  if (values.length <= 1) return [];
  
  const headers = values[0];
  const objects = [];
  
  for (let r = 1; r < values.length; r++) {
    const row = values[r];
    const obj = {};
    for (let c = 0; c < headers.length; c++) {
      obj[headers[c]] = row[c];
    }
    objects.push(obj);
  }
  
  return objects;
}

/**
 * กำหนดค่าตารางและคอลัมน์เริ่มต้นให้โดยอัตโนมัติหากเพิ่งเปิดใช้ครั้งแรก
 */
function checkAndInitSheets(ss) {
  let albumsSheet = ss.getSheetByName(ALBUMS_SHEET);
  if (!albumsSheet) {
    albumsSheet = ss.insertSheet(ALBUMS_SHEET);
    albumsSheet.appendRow(["id", "title", "category", "date", "cover_image", "description", "tags", "drive_folder_path"]);
    albumsSheet.getRange("A1:H1").setFontWeight("bold").setBackground("#d9e6ff");
  } else {
    const range = albumsSheet.getRange(1, 1, 1, albumsSheet.getLastColumn());
    const headers = range.getValues()[0];
    if (headers.indexOf("drive_folder_path") === -1) {
      albumsSheet.getRange(1, headers.length + 1).setValue("drive_folder_path")
        .setFontWeight("bold").setBackground("#d9e6ff");
    }
  }

  let photosSheet = ss.getSheetByName(PHOTOS_SHEET);
  if (!photosSheet) {
    photosSheet = ss.insertSheet(PHOTOS_SHEET);
    photosSheet.appendRow(["id", "album_id", "image_url", "drive_file_id", "caption", "photographer", "created_at", "subfolder"]);
    photosSheet.getRange("A1:H1").setFontWeight("bold").setBackground("#d1e7dd");
  } else {
    const range = photosSheet.getRange(1, 1, 1, photosSheet.getLastColumn());
    const headers = range.getValues()[0];
    if (headers.indexOf("subfolder") === -1) {
      photosSheet.getRange(1, headers.length + 1).setValue("subfolder")
        .setFontWeight("bold").setBackground("#d1e7dd");
    }
  }

  let categoriesSheet = ss.getSheetByName(CATEGORIES_SHEET);
  if (!categoriesSheet) {
    categoriesSheet = ss.insertSheet(CATEGORIES_SHEET);
    categoriesSheet.appendRow(["category"]);
    categoriesSheet.getRange("A1").setFontWeight("bold").setBackground("#fff3cd");
    ["วิชาการ", "กีฬา", "คุณธรรม", "ศิลปะ", "ทั่วไป"].forEach(cat => {
      categoriesSheet.appendRow([cat]);
    });
  }
}

/**
 * สกัด Folder ID ออกมาจาก URL หรือ Link Google Drive
 */
function extractFolderId(urlOrId) {
  if (!urlOrId) return null;
  const urlStr = urlOrId.trim();
  if (urlStr.indexOf("drive.google.com") !== -1) {
    const match = urlStr.match(/\/folders\/([a-zA-Z0-9_-]+)/) || urlStr.match(/[?&]id=([a-zA-Z0-9_-]+)/);
    if (match && match[1]) return match[1];
  }
  return urlStr;
}

/**
 * ส่งข้อมูลออกเป็น JSON
 */
function jsonResponse(data, statusCode = 200) {
  return ContentService.createTextOutput(JSON.stringify(data))
    .setMimeType(ContentService.MimeType.JSON);
}
