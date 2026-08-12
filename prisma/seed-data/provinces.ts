// ข้อมูลตั้งต้น 77 จังหวัดของไทย (76 จังหวัด + กรุงเทพมหานคร)
// แบ่งภาคตามเกณฑ์สำนักงานสถิติแห่งชาติ (6 ภาค): กลาง, เหนือ, ตะวันออกเฉียงเหนือ, ตะวันออก, ตะวันตก, ใต้

export type ProvinceSeed = {
  nameTh: string;
  nameEn: string;
  slug: string;
  region: string;
};

export const provinces: ProvinceSeed[] = [
  // ภาคกลาง
  { nameTh: "กรุงเทพมหานคร", nameEn: "Bangkok", slug: "bangkok", region: "ภาคกลาง" },
  { nameTh: "กำแพงเพชร", nameEn: "Kamphaeng Phet", slug: "kamphaeng-phet", region: "ภาคกลาง" },
  { nameTh: "ชัยนาท", nameEn: "Chai Nat", slug: "chai-nat", region: "ภาคกลาง" },
  { nameTh: "นครนายก", nameEn: "Nakhon Nayok", slug: "nakhon-nayok", region: "ภาคกลาง" },
  { nameTh: "นครปฐม", nameEn: "Nakhon Pathom", slug: "nakhon-pathom", region: "ภาคกลาง" },
  { nameTh: "นครสวรรค์", nameEn: "Nakhon Sawan", slug: "nakhon-sawan", region: "ภาคกลาง" },
  { nameTh: "นนทบุรี", nameEn: "Nonthaburi", slug: "nonthaburi", region: "ภาคกลาง" },
  { nameTh: "ปทุมธานี", nameEn: "Pathum Thani", slug: "pathum-thani", region: "ภาคกลาง" },
  { nameTh: "พระนครศรีอยุธยา", nameEn: "Phra Nakhon Si Ayutthaya", slug: "phra-nakhon-si-ayutthaya", region: "ภาคกลาง" },
  { nameTh: "พิจิตร", nameEn: "Phichit", slug: "phichit", region: "ภาคกลาง" },
  { nameTh: "พิษณุโลก", nameEn: "Phitsanulok", slug: "phitsanulok", region: "ภาคกลาง" },
  { nameTh: "เพชรบูรณ์", nameEn: "Phetchabun", slug: "phetchabun", region: "ภาคกลาง" },
  { nameTh: "ลพบุรี", nameEn: "Lopburi", slug: "lopburi", region: "ภาคกลาง" },
  { nameTh: "สมุทรปราการ", nameEn: "Samut Prakan", slug: "samut-prakan", region: "ภาคกลาง" },
  { nameTh: "สมุทรสงคราม", nameEn: "Samut Songkhram", slug: "samut-songkhram", region: "ภาคกลาง" },
  { nameTh: "สมุทรสาคร", nameEn: "Samut Sakhon", slug: "samut-sakhon", region: "ภาคกลาง" },
  { nameTh: "สิงห์บุรี", nameEn: "Sing Buri", slug: "sing-buri", region: "ภาคกลาง" },
  { nameTh: "สุโขทัย", nameEn: "Sukhothai", slug: "sukhothai", region: "ภาคกลาง" },
  { nameTh: "สุพรรณบุรี", nameEn: "Suphan Buri", slug: "suphan-buri", region: "ภาคกลาง" },
  { nameTh: "สระบุรี", nameEn: "Saraburi", slug: "saraburi", region: "ภาคกลาง" },
  { nameTh: "อ่างทอง", nameEn: "Ang Thong", slug: "ang-thong", region: "ภาคกลาง" },
  { nameTh: "อุทัยธานี", nameEn: "Uthai Thani", slug: "uthai-thani", region: "ภาคกลาง" },
  { nameTh: "ตาก", nameEn: "Tak", slug: "tak", region: "ภาคกลาง" },

  // ภาคเหนือ
  { nameTh: "เชียงใหม่", nameEn: "Chiang Mai", slug: "chiang-mai", region: "ภาคเหนือ" },
  { nameTh: "เชียงราย", nameEn: "Chiang Rai", slug: "chiang-rai", region: "ภาคเหนือ" },
  { nameTh: "แม่ฮ่องสอน", nameEn: "Mae Hong Son", slug: "mae-hong-son", region: "ภาคเหนือ" },
  { nameTh: "ลำปาง", nameEn: "Lampang", slug: "lampang", region: "ภาคเหนือ" },
  { nameTh: "ลำพูน", nameEn: "Lamphun", slug: "lamphun", region: "ภาคเหนือ" },
  { nameTh: "น่าน", nameEn: "Nan", slug: "nan", region: "ภาคเหนือ" },
  { nameTh: "พะเยา", nameEn: "Phayao", slug: "phayao", region: "ภาคเหนือ" },
  { nameTh: "แพร่", nameEn: "Phrae", slug: "phrae", region: "ภาคเหนือ" },
  { nameTh: "อุตรดิตถ์", nameEn: "Uttaradit", slug: "uttaradit", region: "ภาคเหนือ" },

  // ภาคตะวันออกเฉียงเหนือ
  { nameTh: "อำนาจเจริญ", nameEn: "Amnat Charoen", slug: "amnat-charoen", region: "ภาคตะวันออกเฉียงเหนือ" },
  { nameTh: "บุรีรัมย์", nameEn: "Buriram", slug: "buriram", region: "ภาคตะวันออกเฉียงเหนือ" },
  { nameTh: "บึงกาฬ", nameEn: "Bueng Kan", slug: "bueng-kan", region: "ภาคตะวันออกเฉียงเหนือ" },
  { nameTh: "ชัยภูมิ", nameEn: "Chaiyaphum", slug: "chaiyaphum", region: "ภาคตะวันออกเฉียงเหนือ" },
  { nameTh: "กาฬสินธุ์", nameEn: "Kalasin", slug: "kalasin", region: "ภาคตะวันออกเฉียงเหนือ" },
  { nameTh: "ขอนแก่น", nameEn: "Khon Kaen", slug: "khon-kaen", region: "ภาคตะวันออกเฉียงเหนือ" },
  { nameTh: "เลย", nameEn: "Loei", slug: "loei", region: "ภาคตะวันออกเฉียงเหนือ" },
  { nameTh: "มหาสารคาม", nameEn: "Maha Sarakham", slug: "maha-sarakham", region: "ภาคตะวันออกเฉียงเหนือ" },
  { nameTh: "มุกดาหาร", nameEn: "Mukdahan", slug: "mukdahan", region: "ภาคตะวันออกเฉียงเหนือ" },
  { nameTh: "นครพนม", nameEn: "Nakhon Phanom", slug: "nakhon-phanom", region: "ภาคตะวันออกเฉียงเหนือ" },
  { nameTh: "นครราชสีมา", nameEn: "Nakhon Ratchasima", slug: "nakhon-ratchasima", region: "ภาคตะวันออกเฉียงเหนือ" },
  { nameTh: "หนองบัวลำภู", nameEn: "Nong Bua Lam Phu", slug: "nong-bua-lam-phu", region: "ภาคตะวันออกเฉียงเหนือ" },
  { nameTh: "หนองคาย", nameEn: "Nong Khai", slug: "nong-khai", region: "ภาคตะวันออกเฉียงเหนือ" },
  { nameTh: "ร้อยเอ็ด", nameEn: "Roi Et", slug: "roi-et", region: "ภาคตะวันออกเฉียงเหนือ" },
  { nameTh: "สกลนคร", nameEn: "Sakon Nakhon", slug: "sakon-nakhon", region: "ภาคตะวันออกเฉียงเหนือ" },
  { nameTh: "ศรีสะเกษ", nameEn: "Si Sa Ket", slug: "si-sa-ket", region: "ภาคตะวันออกเฉียงเหนือ" },
  { nameTh: "สุรินทร์", nameEn: "Surin", slug: "surin", region: "ภาคตะวันออกเฉียงเหนือ" },
  { nameTh: "อุดรธานี", nameEn: "Udon Thani", slug: "udon-thani", region: "ภาคตะวันออกเฉียงเหนือ" },
  { nameTh: "อุบลราชธานี", nameEn: "Ubon Ratchathani", slug: "ubon-ratchathani", region: "ภาคตะวันออกเฉียงเหนือ" },
  { nameTh: "ยโสธร", nameEn: "Yasothon", slug: "yasothon", region: "ภาคตะวันออกเฉียงเหนือ" },

  // ภาคตะวันออก
  { nameTh: "ฉะเชิงเทรา", nameEn: "Chachoengsao", slug: "chachoengsao", region: "ภาคตะวันออก" },
  { nameTh: "จันทบุรี", nameEn: "Chanthaburi", slug: "chanthaburi", region: "ภาคตะวันออก" },
  { nameTh: "ชลบุรี", nameEn: "Chonburi", slug: "chonburi", region: "ภาคตะวันออก" },
  { nameTh: "ปราจีนบุรี", nameEn: "Prachinburi", slug: "prachinburi", region: "ภาคตะวันออก" },
  { nameTh: "ระยอง", nameEn: "Rayong", slug: "rayong", region: "ภาคตะวันออก" },
  { nameTh: "สระแก้ว", nameEn: "Sa Kaeo", slug: "sa-kaeo", region: "ภาคตะวันออก" },
  { nameTh: "ตราด", nameEn: "Trat", slug: "trat", region: "ภาคตะวันออก" },

  // ภาคตะวันตก
  { nameTh: "กาญจนบุรี", nameEn: "Kanchanaburi", slug: "kanchanaburi", region: "ภาคตะวันตก" },
  { nameTh: "ประจวบคีรีขันธ์", nameEn: "Prachuap Khiri Khan", slug: "prachuap-khiri-khan", region: "ภาคตะวันตก" },
  { nameTh: "เพชรบุรี", nameEn: "Phetchaburi", slug: "phetchaburi", region: "ภาคตะวันตก" },
  { nameTh: "ราชบุรี", nameEn: "Ratchaburi", slug: "ratchaburi", region: "ภาคตะวันตก" },

  // ภาคใต้
  { nameTh: "ชุมพร", nameEn: "Chumphon", slug: "chumphon", region: "ภาคใต้" },
  { nameTh: "กระบี่", nameEn: "Krabi", slug: "krabi", region: "ภาคใต้" },
  { nameTh: "นครศรีธรรมราช", nameEn: "Nakhon Si Thammarat", slug: "nakhon-si-thammarat", region: "ภาคใต้" },
  { nameTh: "นราธิวาส", nameEn: "Narathiwat", slug: "narathiwat", region: "ภาคใต้" },
  { nameTh: "ปัตตานี", nameEn: "Pattani", slug: "pattani", region: "ภาคใต้" },
  { nameTh: "พังงา", nameEn: "Phang Nga", slug: "phang-nga", region: "ภาคใต้" },
  { nameTh: "พัทลุง", nameEn: "Phatthalung", slug: "phatthalung", region: "ภาคใต้" },
  { nameTh: "ภูเก็ต", nameEn: "Phuket", slug: "phuket", region: "ภาคใต้" },
  { nameTh: "ระนอง", nameEn: "Ranong", slug: "ranong", region: "ภาคใต้" },
  { nameTh: "สตูล", nameEn: "Satun", slug: "satun", region: "ภาคใต้" },
  { nameTh: "สงขลา", nameEn: "Songkhla", slug: "songkhla", region: "ภาคใต้" },
  { nameTh: "สุราษฎร์ธานี", nameEn: "Surat Thani", slug: "surat-thani", region: "ภาคใต้" },
  { nameTh: "ตรัง", nameEn: "Trang", slug: "trang", region: "ภาคใต้" },
  { nameTh: "ยะลา", nameEn: "Yala", slug: "yala", region: "ภาคใต้" },
];
