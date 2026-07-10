// ข้อมูลจำลองกิจกรรม (Mock Albums)
export const initialAlbums = [
  {
    id: "album-1",
    title: "กิจกรรมวันไหว้ครู ประจำปีการศึกษา 2569",
    category: "วิชาการ",
    date: "2026-06-11",
    cover_image: "https://images.unsplash.com/photo-1544717305-2782549b5136?w=800&auto=format&fit=crop&q=80",
    description: "พิธีไหว้ครูเพื่อแสดงความกตัญญูกตเวทิตาต่อครูบาอาจารย์ ประจำปีการศึกษา 2569 ณ หอประชุมใหญ่โรงเรียน",
    tags: "ไหว้ครู, 2569, กิจกรรมร่วมใจ"
  },
  {
    id: "album-2",
    title: "การแข่งขันกีฬาสีภายใน 'แคแสดเกมส์ 2569'",
    category: "กีฬา",
    date: "2026-11-20",
    cover_image: "https://images.unsplash.com/photo-1461896836934-ffe607ba8211?w=800&auto=format&fit=crop&q=80",
    description: "การแข่งขันกรีฑาและกีฬาสีภายในเพื่อส่งเสริมสุขภาพและความสามัคคีในหมู่คณะ",
    tags: "กีฬาสี, แคแสดเกมส์, กรีฑา"
  },
  {
    id: "album-3",
    title: "ค่ายวิทยาศาสตร์และสิ่งแวดล้อม ม.ปลาย",
    category: "วิชาการ",
    date: "2026-08-15",
    cover_image: "https://images.unsplash.com/photo-1532094349884-543bc11b234d?w=800&auto=format&fit=crop&q=80",
    description: "กิจกรรมทัศนศึกษาและการศึกษาเรียนรู้นอกห้องเรียนเกี่ยวกับชีววิทยาและระบบนิเวศป่าชายเลน",
    tags: "ค่ายวิทย์, ม.ปลาย, วิทยาศาสตร์"
  },
  {
    id: "album-4",
    title: "กิจกรรมทำบุญตักบาตรเนื่องในวันขึ้นปีใหม่ 2570",
    category: "คุณธรรม",
    date: "2027-01-04",
    cover_image: "https://images.unsplash.com/photo-1609137144814-7e56b46091ad?w=800&auto=format&fit=crop&q=80",
    description: "คณะครู บุคลากร และนักเรียนร่วมใจตักบาตรข้าวสารอาหารแห้งแด่พระสงฆ์เพื่อความเป็นสิริมงคล",
    tags: "ทำบุญ, ปีใหม่, 2570"
  },
  {
    id: "album-5",
    title: "ค่ายศิลปะสร้างสรรค์และการวาดภาพทิวทัศน์",
    category: "ศิลปะ",
    date: "2027-02-12",
    cover_image: "https://images.unsplash.com/photo-1513364776144-60967b0f800f?w=800&auto=format&fit=crop&q=80",
    description: "การฝึกอบรมทักษะการวาดภาพสีน้ำและประกวดผลงานศิลปะของนักเรียนมัธยมศึกษาตอนต้น",
    tags: "ศิลปะ, ค่ายศิลปะ, สีน้ำ"
  },
  {
    id: "album-6",
    title: "การประชุมผู้ปกครองภาคเรียนที่ 1/2569",
    category: "ทั่วไป",
    date: "2026-05-17",
    cover_image: "https://images.unsplash.com/photo-1524178232363-1fb2b075b655?w=800&auto=format&fit=crop&q=80",
    description: "การประชุมชี้แจงนโยบายการเรียนการสอนและมอบทุนการศึกษาสำหรับนักเรียนเรียนดี",
    tags: "ประชุมผู้ปกครอง, 1/2569, มอบทุน"
  }
];

// ข้อมูลจำลองรูปภาพกิจกรรม (Mock Photos)
export const initialPhotos = [
  // รูปภาพของกิจกรรม ไหว้ครู 2569 (album-1)
  {
    id: "p1-1",
    album_id: "album-1",
    image_url: "https://images.unsplash.com/photo-1577896851231-70ef18881754?w=800&auto=format&fit=crop&q=80",
    caption: "บรรยากาศนักเรียนนำพานดอกไม้ขึ้นไหว้ครูบนเวที",
    photographer: "นายสมชาย ถ่ายภาพ",
    created_at: "2026-06-11T09:15:00Z"
  },
  {
    id: "p1-2",
    album_id: "album-1",
    image_url: "https://images.unsplash.com/photo-1497633762265-9d179a990aa6?w=800&auto=format&fit=crop&q=80",
    caption: "คุณครูหัวหน้ากลุ่มสาระฯ รับพานดอกไม้จากตัวแทนนักเรียน",
    photographer: "นางสาวศิริพร แสงงาม",
    created_at: "2026-06-11T09:30:00Z"
  },
  {
    id: "p1-3",
    album_id: "album-1",
    image_url: "https://images.unsplash.com/photo-1546410531-bb4caa6b424d?w=800&auto=format&fit=crop&q=80",
    caption: "พิธีมอบรางวัลการประกวดพานไหว้ครูประเภทสวยงามและสร้างสรรค์",
    photographer: "นายสมชาย ถ่ายภาพ",
    created_at: "2026-06-11T10:00:00Z"
  },

  // รูปภาพของกิจกรรม กีฬาสี แคแสดเกมส์ (album-2)
  {
    id: "p2-1",
    album_id: "album-2",
    image_url: "https://images.unsplash.com/photo-1508962914676-134849a727f0?w=800&auto=format&fit=crop&q=80",
    caption: "ขบวนพาเหรดกองทัพดรัมเมเยอร์และวงโยธวาทิตประจำโรงเรียน",
    photographer: "นายสมชาย ถ่ายภาพ",
    created_at: "2026-11-20T08:30:00Z"
  },
  {
    id: "p2-2",
    album_id: "album-2",
    image_url: "https://images.unsplash.com/photo-1476480862126-209bfaa8edc8?w=800&auto=format&fit=crop&q=80",
    caption: "การแข่งขันวิ่งผลัด 4x100 เมตรชาย ม.ปลาย รอบชิงชนะเลิศ",
    photographer: "นายอภิชาติ ปานทอง",
    created_at: "2026-11-20T10:15:00Z"
  },
  {
    id: "p2-3",
    album_id: "album-2",
    image_url: "https://images.unsplash.com/photo-1517649763962-0c623066013b?w=800&auto=format&fit=crop&q=80",
    caption: "กองเชียร์สีส้มแสดงสแตนด์เชียร์สุดอลังการคว้ารางวัลชนะเลิศ",
    photographer: "นางสาวศิริพร แสงงาม",
    created_at: "2026-11-20T14:30:00Z"
  },

  // รูปภาพของกิจกรรม ค่ายวิทย์ (album-3)
  {
    id: "p3-1",
    album_id: "album-3",
    image_url: "https://images.unsplash.com/photo-1530210124550-912dc1381cb8?w=800&auto=format&fit=crop&q=80",
    caption: "นักเรียนทดลองเก็บตัวอย่างน้ำเพื่อตรวจสอบคุณภาพในป่าชายเลน",
    photographer: "นายอภิชาติ ปานทอง",
    created_at: "2026-08-15T11:00:00Z"
  },
  {
    id: "p3-2",
    album_id: "album-3",
    image_url: "https://images.unsplash.com/photo-1516321318423-f06f85e504b3?w=800&auto=format&fit=crop&q=80",
    caption: "การนำเสนอโครงงานสิ่งแวดล้อมภายหลังกิจกรรมลงพื้นที่ศึกษาวิจัย",
    photographer: "นางสาวศิริพร แสงงาม",
    created_at: "2026-08-15T16:00:00Z"
  },

  // รูปภาพของกิจกรรม วันขึ้นปีใหม่ 2570 (album-4)
  {
    id: "p4-1",
    album_id: "album-4",
    image_url: "https://images.unsplash.com/photo-1588072432836-e10032774350?w=800&auto=format&fit=crop&q=80",
    caption: "ผอ.โรงเรียน จุดธูปเทียนบูชาพระรัตนตรัย เริ่มพิธีสงฆ์",
    photographer: "นายสมชาย ถ่ายภาพ",
    created_at: "2027-01-04T07:30:00Z"
  },
  {
    id: "p4-2",
    album_id: "album-4",
    image_url: "https://images.unsplash.com/photo-1516627145497-ae6968895b74?w=800&auto=format&fit=crop&q=80",
    caption: "นักเรียนและผู้ปกครองร่วมกันถวายภัตตาหารเช้าแด่พระสงฆ์",
    photographer: "นายอภิชาติ ปานทอง",
    created_at: "2027-01-04T08:15:00Z"
  },

  // รูปภาพของค่ายศิลปะ (album-5)
  {
    id: "p5-1",
    album_id: "album-5",
    image_url: "https://images.unsplash.com/photo-1579783902614-a3fb3927b6a5?w=800&auto=format&fit=crop&q=80",
    caption: "การสาธิตการลงน้ำหนักเงาโดยวิทยากรพิเศษจากมหาวิทยาลัยศิลปะ",
    photographer: "นางสาวศิริพร แสงงาม",
    created_at: "2027-02-12T10:00:00Z"
  },

  // รูปภาพประชุมผู้ปกครอง (album-6)
  {
    id: "p6-1",
    album_id: "album-6",
    image_url: "https://images.unsplash.com/photo-1517245386807-bb43f82c33c4?w=800&auto=format&fit=crop&q=80",
    caption: "ผอ. ชี้แจงเป้าหมายนโยบายด้านวิชาการและเทคโนโลยีสารสนเทศแก่ผู้ปกครอง",
    photographer: "นายสมชาย ถ่ายภาพ",
    created_at: "2026-05-17T09:00:00Z"
  }
];
