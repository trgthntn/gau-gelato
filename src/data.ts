/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { Branch, Staff, Flavor, Topping, Accompaniment, Voucher, LoyaltyMember } from './types';

export const INITIAL_BRANCHES: Branch[] = [
  {
    id: 'CN_Q6',
    name: 'Gấu Gelato - Quận 6 (Trụ chính)',
    companyName: 'CÔNG TY TNHH GẤU GELATO VIỆT NAM',
    mst: '0317894561',
    address: '142 Hậu Giang, Phường 6, Quận 6, TP. Hồ Chí Minh',
    email: 'hoadon.q6@gaugelato.vn',
    bankName: 'Vietcombank',
    bankAccount: '1025588994',
    bankHolder: 'NGUYEN VAN CHUBBY'
  },
  {
    id: 'CN_Q1',
    name: 'Gấu Gelato - Quận 1 (Bến Nghé)',
    companyName: 'CHI NHÁNH CÔNG TY TNHH GẤU GELATO VIỆT NAM - QUẬN 1',
    mst: '0317894561-001',
    address: '88 Nguyễn Huệ, Phường Bến Nghé, Quận 1, TP. Hồ Chí Minh',
    email: 'hoadon.q1@gaugelato.vn',
    bankName: 'MB Bank',
    bankAccount: '190088889999',
    bankHolder: 'NGUYEN VAN CHUBBY'
  },
  {
    id: 'CN_BT',
    name: 'Gấu Gelato - Bình Thạnh (D2)',
    companyName: 'CHI NHÁNH CÔNG TY TNHH GẤU GELATO VIỆT NAM - BÌNH THẠNH',
    mst: '0317894561-002',
    address: '215 Nguyễn Gia Trí, Phường 25, Quận Bình Thạnh, TP. Hồ Chí Minh',
    email: 'hoadon.bt@gaugelato.vn',
    bankName: 'Techcombank',
    bankAccount: '190333555222',
    bankHolder: 'NGUYEN VAN CHUBBY'
  }
];

export const INITIAL_STAFF: Staff[] = [
  {
    id: 'NV_01',
    name: 'Đặng Minh Châu',
    cccd: '079304015694',
    phone: '0966123456',
    startDate: '2025-01-10',
    gender: 'female',
    address: '45/8 Cao Lỗ, Phường 4, Quận 8, TP. HCM',
    notes: 'Nhân viên ưu tú, pha chế thạo, nhanh nhẹn.',
    role: 'staff',
    branchId: 'CN_Q6',
    pin: '1234567890' // 10 digit pin
  },
  {
    id: 'NV_02',
    name: 'Lê Hoàng Minh',
    cccd: '079203011452',
    phone: '0909123456',
    startDate: '2025-03-15',
    gender: 'male',
    address: '112 Trần Hưng Đạo, Quận 5, TP. HCM',
    notes: 'Sinh viên làm thêm, ca tối.',
    role: 'staff',
    branchId: 'CN_Q1',
    pin: '0909123456'
  },
  {
    id: 'NV_03',
    name: 'Nguyễn Bích Ngọc',
    cccd: '079302008459',
    phone: '0918123456',
    startDate: '2025-04-01',
    gender: 'female',
    address: '33 Phan Xích Long, Phú Nhuận, TP. HCM',
    notes: 'Chuyên ca chiều, hỗ trợ nhiệt tình.',
    role: 'staff',
    branchId: 'CN_BT',
    pin: '0918123456'
  },
  {
    id: 'AD_01',
    name: 'Bé Gấu Admin',
    cccd: '001099999999',
    phone: '0900000000',
    startDate: '2024-01-01',
    gender: 'other',
    address: 'Trụ sở chính Gấu Gelato',
    notes: 'Hệ thống Quản trị viên tối cao.',
    role: 'admin',
    branchId: 'CN_Q6',
    pin: '0000000000'
  }
];

export const INITIAL_FLAVORS: Flavor[] = [
  {
    id: 'FL_01',
    nameVi: 'Cookies Choc Chip',
    nameEn: 'Choc Chips Cookie',
    color: '#FFF2DF',
    iconType: 'cookie',
    descVi: 'Kem nền bơ sữa béo ngậy trộn lẫn bánh quy sô cô la giòn rụm và sô cô la chip thượng hạng.',
    descEn: 'Rich buttery base swirled with crunchy chocolate cookies and premium chocolate chips.',
    stockGrams: 15000,
    costPerKg: 110000
  },
  {
    id: 'FL_02',
    nameVi: 'Mật Ong Thiên Nhiên',
    nameEn: 'Honey',
    color: '#FFF7C2',
    iconType: 'honey',
    descVi: 'Gelato sữa tươi nguyên chất quyện chảy dòng mật ong rừng tự nhiên và mẩu tổ ong vàng giòn ngọt ngào.',
    descEn: 'Fresh whole milk gelato rippled with wild forest honey and golden sweet honeycomb bits.',
    stockGrams: 12000,
    costPerKg: 125000
  },
  {
    id: 'FL_03',
    nameVi: 'Cam Thảo Cổ Điển',
    nameEn: 'Licorice',
    color: '#D4DBE1',
    iconType: 'licorice',
    descVi: 'Hương vị cam thảo xám đen độc đáo, thanh mát dễ chịu mang phong cách trà quý tộc Châu Âu.',
    descEn: 'Unique grey licorice flavor, refreshingly smooth with elegant European vibes.',
    stockGrams: 8000,
    costPerKg: 130000
  },
  {
    id: 'FL_04',
    nameVi: 'Kẹo Cao Su Hồng',
    nameEn: 'Pink Bubblegum',
    color: '#FFDCE4',
    iconType: 'bubblegum',
    descVi: 'Hương kẹo Gum ngọt lịm trẻ thơ, điểm xuyết các viên thạch dẻo xanh lá, xanh lam vui mắt.',
    descEn: 'Sweet childhood bubblegum flavour dotted with joyful green and blue gummy inclusions.',
    stockGrams: 10000,
    costPerKg: 105000
  },
  {
    id: 'FL_05',
    nameVi: 'Cầu Vồng Kỳ Diệu',
    nameEn: 'Rainbow',
    color: '#F9D1E6',
    iconType: 'rainbow',
    descVi: 'Sự pha trộn sắc màu kỳ dệu từ dâu tây, xoài vàng và việt quất tạo làn sóng gelato mát lạnh rực rỡ.',
    descEn: 'Magical neon swirls of strawberry, sweet mango and blueberry gelato waves.',
    stockGrams: 14000,
    costPerKg: 120000
  },
  {
    id: 'FL_06',
    nameVi: 'Mâm Xôi Chanh Tây & Cam',
    nameEn: 'Raspberry, Lime & Orange',
    color: '#FFEAA7',
    iconType: 'citrus_berry',
    descVi: 'Thanh mát bùng nổ vị chua của mâm xôi, vị chanh tây sảng khoái kết hợp tép cam ngọt mọng nước.',
    descEn: 'Zesty sorbet explosion of tart raspberry, crisp key lime and citrus sweet orange sections.',
    stockGrams: 11000,
    costPerKg: 115000
  },
  {
    id: 'FL_07',
    nameVi: 'Nho Khô Rượu Rum',
    nameEn: 'Rum Raisin',
    color: '#FFF5E4',
    iconType: 'rum_raisin',
    descVi: 'Vị nồng ấm của rượu Rum hảo hạng ngấm sâu vào từng quả nho khô đen dẻo thơm trên nền kem ngậy.',
    descEn: 'Aged Caribbean dark rum soaked plump raisins into soft, rich vanilla cream custard.',
    stockGrams: 9000,
    costPerKg: 140000
  },
  {
    id: 'FL_08',
    nameVi: 'Khoai Môn Béo Dẻo',
    nameEn: 'Taro',
    color: '#E1D5F5',
    iconType: 'taro',
    descVi: 'Sự mịn màng của khoai môn thơm lừng, ngọt thanh dịu nhẹ đậm chất Á Đông mộc mạc đặc sắc.',
    descEn: 'Creamy smooth purple taro, mildly sweet with aromatic East Asian earthy richness.',
    stockGrams: 15000,
    costPerKg: 95000
  },
  {
    id: 'FL_09',
    nameVi: 'Cappuccino Thượng Hạng',
    nameEn: 'Cappuccino Custom',
    color: '#E8D5CE',
    iconType: 'cappuccino',
    descVi: 'Nốt trầm đắng nhẹ từ hạt cà phê Espresso cao cấp, dậy mùi bọt sữa béo và chút bột cacao phủ mịn.',
    descEn: 'Rich, bold robusta coffee bean base coupled with sweet cream froth and light cocoa dust.',
    stockGrams: 10000,
    costPerKg: 120000
  }
];

export const INITIAL_TOPPINGS: Topping[] = [
  { id: 'TP_MILK', nameVi: 'Sữa Đặc Cao Cấp', nameEn: 'Condensed Milk Extra', price: 3000, stockQuantity: 100 },
  { id: 'TP_CHOCO', nameVi: 'Sô Cô La Chip', nameEn: 'Chocolate Chips Addon', price: 4000, stockQuantity: 150 },
  { id: 'TP_ALMOND', nameVi: 'Hạt Hạnh Nhân Cắt Lát', nameEn: 'Almond Flakes', price: 5000, stockQuantity: 80 },
  { id: 'TP_MARSH', nameVi: 'Kẹo Xốp Dẻo Marshmallow', nameEn: 'Mini Marshmallows', price: 5000, stockQuantity: 90 },
  { id: 'TP_CARAMEL', nameVi: 'Sốt Caramel Chảy Ngọt', nameEn: 'Warm Caramel Drizzle', price: 3000, stockQuantity: 120 }
];

export const INITIAL_ACCOMPANIMENTS: Accompaniment[] = [
  { id: 'AC_WAFFLE', nameVi: 'Bánh Kẹp Waffle Nóng', nameEn: 'Warm Waffle Basket', price: 10000, stockQuantity: 50 },
  { id: 'AC_CONE', nameVi: 'Vỏ Ốc Quế Giòn Rụm', nameEn: 'Crispy Waffle Cone', price: 5000, stockQuantity: 200 },
  { id: 'AC_BREAD', nameVi: 'Bánh Mì Kẹp Kem Gấu', nameEn: 'Soft Brioche Gelato Bun', price: 8000, stockQuantity: 40 }
];

export const INITIAL_VOUCHERS: Voucher[] = [
  {
    code: 'GAUCHUBBY',
    campaignVi: 'Tri ân khách hàng - Set 10%',
    campaignEn: 'Chubby loyalty appreciation campaign',
    discountType: 'percent',
    value: 10,
    minOrder: 30000,
    expiryDate: '2026-12-31',
    usageCount: 142
  },
  {
    code: 'GAUCONE',
    campaignVi: 'Giải nhiệt mì hè - Tặng 10k',
    campaignEn: 'Cool Summer - 10k discount',
    discountType: 'fixed',
    value: 10000,
    minOrder: 40000,
    expiryDate: '2026-08-31',
    usageCount: 89
  },
  {
    code: 'GAUKHAITRUONG',
    campaignVi: 'Sự kiện khai trương Gấu Q1 - Khuyến mãi 20k',
    campaignEn: 'District 1 store launch promotion group',
    discountType: 'fixed',
    value: 20000,
    minOrder: 60000,
    expiryDate: '2026-06-30',
    usageCount: 204
  }
];

export const INITIAL_MEMBERS: LoyaltyMember[] = [
  {
    phone: '0966456789',
    name: 'Phạm Phương Thảo',
    gender: 'female',
    points: 15,
    exchangeHistory: [
      { id: 'R_01', date: '2026-05-15 14:20', rewardVi: 'Đổi vỏ ốc quế', rewardEn: 'Exchange crispy waffle cone', pointsCost: 5 }
    ]
  },
  {
    phone: '0909555111',
    name: 'Trần Minh Quân',
    gender: 'male',
    points: 42,
    exchangeHistory: []
  },
  {
    phone: '0912345678',
    name: 'Nguyễn Cẩm Vân',
    gender: 'female',
    points: 8,
    exchangeHistory: []
  }
];

// Custom 512px height styled SVGs representing each flavor in full SVG illustrations
export const getFlavorSvg = (iconType: string, color: string) => {
  switch (iconType) {
    case 'cookie':
      return `
        <svg viewBox="0 0 100 100" class="w-full h-full">
          <ellipse cx="50" cy="55" rx="36" ry="32" fill="${color}" stroke="#5A4027" stroke-width="2"/>
          <path d="M22 45 C 30 35, 45 35, 52 42 C 60 33, 75 35, 78 46" fill="none" stroke="#5A4027" stroke-width="2" stroke-linecap="round"/>
          <circle cx="34" cy="50" r="1.5" fill="#5A4027"/>
          <circle cx="66" cy="50" r="1.5" fill="#5A4027"/>
          <path d="M44 65 Q 50 71 56 65" fill="none" stroke="#5A4027" stroke-width="2" stroke-linecap="round"/>
          <!-- Cookie bits -->
          <circle cx="50" cy="80" r="16" fill="#D2B48C" stroke="#7B5C3D" stroke-width="1.5"/>
          <circle cx="45" cy="74" r="2.5" fill="#5A4027"/>
          <circle cx="55" cy="76" r="2" fill="#5A4027"/>
          <circle cx="48" cy="84" r="2.5" fill="#5A4027"/>
          <circle cx="56" cy="83" r="1.5" fill="#5A4027"/>
          <path d="M40 80 Q 42 78 44 80" fill="none" stroke="#7B5C3D" stroke-width="1"/>
          <!-- Chocolate chips on scoop -->
          <circle cx="30" cy="58" r="3" fill="#5A4027"/>
          <path d="M28 56 Q 30 55 31 57" stroke="#331D0F" stroke-width="1" fill="none"/>
          <circle cx="70" cy="56" r="2.5" fill="#5A4027"/>
          <circle cx="54" cy="46" r="3" fill="#5A4027"/>
          <circle cx="50" cy="58" r="3.5" fill="#5A4027"/>
        </svg>
      `;
    case 'honey':
      return `
        <svg viewBox="0 0 100 100" class="w-full h-full">
          <ellipse cx="50" cy="55" rx="36" ry="32" fill="${color}" stroke="#5A4027" stroke-width="2"/>
          <circle cx="34" cy="50" r="1.5" fill="#5A4027"/>
          <circle cx="66" cy="50" r="1.5" fill="#5A4027"/>
          <path d="M42 63 Q 50 69 58 63" fill="none" stroke="#5A4027" stroke-width="2" stroke-linecap="round"/>
          <!-- Honey Drips -->
          <path d="M24 45 C 30 55, 33 63, 33 68 C 33 72, 29 74, 27 70 C 26 66, 26 50, 24 45 Z" fill="#F39C12"/>
          <path d="M45 42 C 48 55, 51 68, 51 72 C 51 77, 44 79, 43 73 C 42 68, 43 50, 45 42 Z" fill="#F39C12"/>
          <path d="M68 45 C 64 55, 60 62, 59 66 C 58 69, 62 71, 64 67 C 65 63, 67 52, 68 45 Z" fill="#F39C12"/>
          <!-- Honeycomb -->
          <polygon points="72,70 82,70 87,78 82,86 72,86 67,78" fill="#F1C40F" stroke="#D35400" stroke-width="1"/>
          <polygon points="80,75 88,75 92,82 88,89 80,89 76,82" fill="#F1C40F" stroke="#D35400" stroke-width="1" opacity="0.8"/>
          <!-- Shiny -->
          <ellipse cx="40" cy="35" rx="10" ry="4" fill="#FFFFFF" opacity="0.5" transform="rotate(-15 40 35)"/>
        </svg>
      `;
    case 'licorice':
      return `
        <svg viewBox="0 0 100 100" class="w-full h-full">
          <ellipse cx="50" cy="55" rx="36" ry="32" fill="${color}" stroke="#34495E" stroke-width="2"/>
          <circle cx="34" cy="50" r="1.5" fill="#2C3E50"/>
          <circle cx="66" cy="50" r="1.5" fill="#2C3E50"/>
          <path d="M43 65 Q 50 71 57 65" fill="none" stroke="#2C3E50" stroke-width="2"/>
          <!-- Licorice Rolls with details -->
          <g transform="translate(40, 70)">
            <rect x="0" y="2" width="22" height="12" rx="4" fill="#2c3e50" stroke="#1a252f" stroke-width="1.5"/>
            <rect x="2" y="4" width="18" height="8" rx="2" fill="#E74C3C"/>
            <rect x="4" y="6" width="14" height="4" rx="1" fill="#2c3e50"/>
          </g>
          <g transform="translate(18, 62) rotate(-25)">
            <rect x="0" y="2" width="18" height="10" rx="3" fill="#2c3e50" stroke="#1a252f" stroke-width="1.5"/>
            <rect x="2" y="4" width="14" height="6" rx="2" fill="#E74C3C"/>
          </g>
          <g transform="translate(62, 60) rotate(30)">
            <rect x="0" y="2" width="18" height="10" rx="3" fill="#2c3e50" stroke="#1a252f" stroke-width="1.5"/>
            <rect x="2" y="4" width="14" height="6" rx="2" fill="#E74C3C"/>
          </g>
        </svg>
      `;
    case 'bubblegum':
      return `
        <svg viewBox="0 0 100 100" class="w-full h-full">
          <ellipse cx="50" cy="55" rx="36" ry="32" fill="${color}" stroke="#C87A8A" stroke-width="2"/>
          <circle cx="34" cy="50" r="1.5" fill="#7D3241"/>
          <circle cx="66" cy="50" r="1.5" fill="#7D3241"/>
          <path d="M43 64 Q 50 70 57 64" fill="none" stroke="#7D3241" stroke-width="2"/>
          <!-- Colorful inclusions -->
          <circle cx="28" cy="40" r="2.5" fill="#2ECC71"/>
          <circle cx="42" cy="36" r="3" fill="#3498DB"/>
          <circle cx="70" cy="38" r="3.5" fill="#FFF"/>
          <circle cx="68" cy="48" r="2.5" fill="#2ECC71"/>
          <circle cx="26" cy="58" r="3" fill="#E67E22"/>
          <circle cx="54" cy="42" r="2.5" fill="#9B59B6"/>
          <!-- Big bubble gum popping on side -->
          <circle cx="65" cy="74" r="14" fill="#FF85A2" stroke="#D1506F" stroke-width="1.5"/>
          <ellipse cx="61" cy="69" rx="4" ry="2" fill="#FFF" opacity="0.6" transform="rotate(-30 61 69)"/>
        </svg>
      `;
    case 'rainbow':
      return `
        <svg viewBox="0 0 100 100" class="w-full h-full">
          <defs>
            <linearGradient id="rainbowGrad" x1="0" y1="0" x2="1" y2="1">
              <stop offset="0%" stop-color="#FFADAD" />
              <stop offset="25%" stop-color="#FFD6A5" />
              <stop offset="50%" stop-color="#FDFFB6" />
              <stop offset="75%" stop-color="#CAFFBF" />
              <stop offset="100%" stop-color="#9BF6FF" />
            </linearGradient>
          </defs>
          <ellipse cx="50" cy="55" rx="36" ry="32" fill="url(#rainbowGrad)" stroke="#8E44AD" stroke-width="2"/>
          <circle cx="34" cy="50" r="1.5" fill="#512E5F"/>
          <circle cx="66" cy="50" r="1.5" fill="#512E5F"/>
          <path d="M42 63 Q 50 69 58 63" fill="none" stroke="#512E5F" stroke-width="2"/>
          <!-- Swirl design lines -->
          <path d="M22 45 C 33 30, 67 30, 78 45" fill="none" stroke="#E8DAEF" stroke-width="2" opacity="0.7"/>
          <path d="M26 55 C 36 43, 64 43, 74 55" fill="none" stroke="#E8DAEF" stroke-width="1.5" opacity="0.6"/>
          <!-- Small colored candy ball details -->
          <circle cx="22" cy="73" r="5" fill="#9BF6FF" stroke="#5DADE2" stroke-width="1"/>
          <circle cx="33" cy="78" r="4" fill="#FFADAD" stroke="#EC7063" stroke-width="1"/>
          <circle cx="75" cy="73" r="6" fill="#FDFFB6" stroke="#F4D03F" stroke-width="1"/>
        </svg>
      `;
    case 'citrus_berry':
      return `
        <svg viewBox="0 0 100 100" class="w-full h-full">
          <ellipse cx="50" cy="55" rx="36" ry="32" fill="${color}" stroke="#E67E22" stroke-width="2"/>
          <!-- Tri-segment representation (Raspberry, Lime, Orange) -->
          <path d="M50 23 C 65 23, 86 35, 86 55 Q 50 55 50 23 Z" fill="#F23B5F" opacity="0.3"/>
          <path d="M14 55 C 14 35, 35 23, 50 23 Q 50 55 14 55 Z" fill="#2ECC71" opacity="0.35"/>
          <path d="M14 55 C 14 65, 35 87, 50 87 Q 50 55 14 55 Z" fill="#FF9F43" opacity="0.4"/>
          
          <circle cx="34" cy="50" r="1.5" fill="#5E3F1F"/>
          <circle cx="66" cy="50" r="1.5" fill="#5E3F1F"/>
          <path d="M43 65 Q 50 71 57 65" fill="none" stroke="#5E3F1F" stroke-width="2"/>
          
          <!-- Fruit Slices -->
          <!-- Orange slice -->
          <circle cx="64" cy="74" r="10" fill="#FF9F43" stroke="#D35400" stroke-width="1"/>
          <circle cx="64" cy="74" r="8" fill="#FFDCBB"/>
          <path d="M64 64 L 64 84 M 54 74 L 74 74" stroke="#FF9F43" stroke-width="1"/>
          
          <!-- Lime slice -->
          <path d="M30 68 A 8 8 0 0 1 44 76 Z" fill="#2ECC71" stroke="#27AE60" stroke-width="1" />
          
          <!-- Raspberry -->
          <g transform="translate(18, 38)">
            <circle cx="5" cy="5" r="3.5" fill="#D32F2F"/>
            <circle cx="9" cy="5" r="3" fill="#D32F2F"/>
            <circle cx="7" cy="9" r="3.2" fill="#D32F2F"/>
            <circle cx="4" cy="8" r="2.8" fill="#C2185B"/>
          </g>
        </svg>
      `;
    case 'rum_raisin':
      return `
        <svg viewBox="0 0 100 100" class="w-full h-full">
          <ellipse cx="50" cy="55" rx="36" ry="32" fill="${color}" stroke="#8E44AD" stroke-width="2"/>
          <circle cx="34" cy="50" r="1.5" fill="#4A235A"/>
          <circle cx="66" cy="50" r="1.5" fill="#4A235A"/>
          <path d="M43 64 Q 50 70 57 64" fill="none" stroke="#4A235A" stroke-width="2"/>
          <!-- Raisins (dark purple soft blobs) -->
          <path d="M28 58 Q 24 60 26 64 Q 30 66 31 61 Q 31 57 28 58 Z" fill="#4A235A"/>
          <path d="M68 56 Q 72 58 70 63 Q 66 65 65 60 Q 64 55 68 56 Z" fill="#4A235A"/>
          <path d="M46 45 Q 49 43 51 47 Q 52 51 48 52 Q 44 50 46 45 Z" fill="#4A235A"/>
          <!-- Rum Liquid ripples (brown curls) -->
          <path d="M24 45 C 32 38, 48 42, 54 36" fill="none" stroke="#D35400" stroke-width="2"/>
          <path d="M42 62 C 50 56, 68 60, 76 52" fill="none" stroke="#D35400" stroke-width="1.5"/>
          <!-- Rum bottle mini symbol -->
          <g transform="translate(42, 68)">
            <rect x="2" y="5" width="14" height="13" rx="1.5" fill="#D35400" stroke="#7E5109" stroke-width="1"/>
            <rect x="6" y="1" width="6" height="4" fill="#D35400" stroke="#7E5109" stroke-width="1"/>
            <rect x="4" y="9" width="10" height="5" fill="#FFF" opacity="0.6"/>
          </g>
        </svg>
      `;
    case 'taro':
      return `
        <svg viewBox="0 0 100 100" class="w-full h-full">
          <ellipse cx="50" cy="55" rx="36" ry="32" fill="${color}" stroke="#6C3483" stroke-width="2"/>
          <circle cx="34" cy="50" r="1.5" fill="#4A0E17"/>
          <circle cx="66" cy="50" r="1.5" fill="#4A0E17"/>
          <path d="M43 65 Q 50 71 57 65" fill="none" stroke="#4A0E17" stroke-width="2"/>
          <!-- Taro chunk illustration with purple details -->
          <path d="M54 75 L 74 65 L 86 75 L 66 85 Z" fill="#BE9EDE" stroke="#6C3483" stroke-width="1.5"/>
          <!-- Taro stripes/texture -->
          <path d="M60 76 L 68 72 M 66 79 L 75 74 M 72 82 L 80 77" stroke="#8E44AD" stroke-width="1" stroke-linecap="round"/>
          <ellipse cx="61" cy="40" rx="4" ry="2" fill="#D8BFD8" stroke="#8E44AD" stroke-width="1"/>
        </svg>
      `;
    case 'cappuccino':
      return `
        <svg viewBox="0 0 100 100" class="w-full h-full">
          <ellipse cx="50" cy="55" rx="36" ry="32" fill="${color}" stroke="#5E3F2E" stroke-width="2"/>
          <circle cx="34" cy="50" r="1.5" fill="#3D251A"/>
          <circle cx="66" cy="50" r="1.5" fill="#3D251A"/>
          <path d="M42 63 Q 50 69 58 63" fill="none" stroke="#3D251A" stroke-width="2"/>
          <!-- Whipped cream swirl -->
          <path d="M38 52 C 34 38, 48 24, 52 18 C 54 22, 58 26, 62 28 C 68 30, 72 38, 66 48 C 60 56, 44 60, 38 52 Z" fill="#FDFEFE" stroke="#8A6E5F" stroke-width="1" opacity="0.9"/>
          <!-- Cocoa powder sprinkles (tiny brown dots) -->
          <circle cx="44" cy="38" r="1" fill="#3D251A"/>
          <circle cx="50" cy="32" r="1.2" fill="#3D251A"/>
          <circle cx="53" cy="41" r="1" fill="#3D251A"/>
          <circle cx="58" cy="35" r="0.8" fill="#3D251A"/>
          <!-- Coffee Beans -->
          <g transform="translate(68, 65) rotate(15)">
            <ellipse cx="8" cy="5" rx="7" ry="5" fill="#5E3F2E" stroke="#3D251A" stroke-width="1"/>
            <path d="M2 5 Q 8 2 14 5" fill="none" stroke="#3D251A" stroke-width="1" stroke-linecap="round"/>
          </g>
          <g transform="translate(18, 68) rotate(-25)">
            <ellipse cx="6" cy="4" rx="5" ry="3.5" fill="#5E3F2E" opacity="0.9"/>
          </g>
        </svg>
      `;
    default:
      return `
        <svg viewBox="0 0 100 100" class="w-full h-full">
          <circle cx="50" cy="50" r="35" fill="${color}" stroke="#5B3F23" stroke-width="2"/>
          <circle cx="38" cy="45" r="2" fill="#5B3F23"/>
          <circle cx="62" cy="45" r="2" fill="#5B3F23"/>
          <path d="M44 60 Q 50 65 56 60" fill="none" stroke="#5B3F23" stroke-width="2"/>
        </svg>
      `;
  }
};
