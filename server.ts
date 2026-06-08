/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import express from 'express';
import path from 'path';
import { createServer as createViteServer } from 'vite';
import { GoogleGenAI } from '@google/genai';
import dotenv from 'dotenv';

dotenv.config();

const app = express();
const PORT = 3000;

app.use(express.json());

// Lazy-initialized Gemini AI Client
let aiClient: GoogleGenAI | null = null;

function getAiClient(): GoogleGenAI {
  if (!aiClient) {
    const apiKey = process.env.GEMINI_API_KEY;
    if (!apiKey || apiKey === 'MY_GEMINI_API_KEY' || apiKey === '') {
      throw new Error('GEMINI_API_KEY is not configured or uses placeholder value.');
    }
    aiClient = new GoogleGenAI({ apiKey });
  }
  return aiClient;
}

// 1. API: AI Promotional Copilot API using Gemini 2.5-flash
app.post('/api/generate-campaign', async (req, res) => {
  const { vibe, season, targetAudience, couponCode, discountPercent, activeFlavors } = req.body;

  try {
    const ai = getAiClient();
    const prompt = `
      Bạn là Chuyên gia Marketing đáng yêu và ngọt ngào của thương hiệu kem tươi Ý "Gấu Gelato" (với slogan Ú nu - Dễ thương - Ngọt ngào).
      Hãy tạo một chiến dịch quảng cáo và nội dung bài viết gửi tới khách hàng thân thiết qua Zalo hoặc mạng xã hội.

      Thông tin chiến dịch:
      - Phong cách chủ đạo (vibe): ${vibe || 'nhí nhảnh, vui vẻ'}
      - Dịp/Mùa lễ: ${season || 'Mùa hè nắng nóng'}
      - Đối tượng mục tiêu: ${targetAudience || 'Gia đình có trẻ em và nhóm bạn trẻ'}
      - Mã Voucher áp dụng: ${couponCode || 'GAUCHUBBY'} (Giảm ${discountPercent || '10'}%)
      - Các vị kem nổi bật đang đẩy mạnh tồn kho: ${activeFlavors ? activeFlavors.join(', ') : 'Cookies Choc Chip, Mật Ong Thiên Nhiên, Cầu Vồng Kỳ Diệu'}

      Yêu cầu đầu ra:
      Hãy viết bằng cả tiếng Việt (VN) và tiếng Anh (EN). Cấu trúc nội dung gồm:
      1. Tiêu đề chiến dịch hấp dẫn (Campaign Title) kèm các Emoji cực dễ thương liên quan tới Gấu 🐻 và Kem 🍦.
      2. Đoạn văn quảng cáo ngọt ngào lôi cuốn kích thích vị giác người đọc. Hãy khéo léo đưa tên các vị kem nổi bật bên trên vào bài viết.
      3. Thông điệp kêu gọi hành động (Call to action) ngắn gọn đi kèm hướng dẫn tích lũy điểm và quét mã QR tại quầy để đổi quà.

      Hãy trả về kết quả dưới dạng cấu trúc JSON sạch sau đây (KHÔNG dùng markdown trọc, chỉ trả về chuỗi JSON thô để parse được trực tiếp, không bọc lót lùm xùm):
      {
        "titleVi": "...",
        "titleEn": "...",
        "contentVi": "...",
        "contentEn": "...",
        "ctaVi": "...",
        "ctaEn": "..."
      }
    `;

    const response = await ai.models.generateContent({
      model: 'gemini-2.5-flash',
      contents: prompt,
      config: {
        responseMimeType: 'application/json'
      }
    });

    const text = response.text || '{}';
    // Deep strip backticks just in case
    const cleanJson = text.replace(/```json/gi, '').replace(/```/g, '').trim();
    res.json(JSON.parse(cleanJson));

  } catch (error: any) {
    console.warn('Gemini API skipped or errored:', error.message);
    
    // Fallback static high-quality generated content matching the Gấu Gelato theme
    const mockResponses: Record<string, any> = {
      default: {
        titleVi: `🐻🍦 SIÊU ĐẠI TIỆC GẤU GELATO - XUA TAN NẮNG HÈ CÙNG GẤU 🍦🐻`,
        titleEn: `🐻🍦 GIANT GẤU GELATO PARTY - COOL OFF THE SUMMER WITH THE BEAR 🍦🐻`,
        contentVi: `Chào các Gấu Con thân mến! Mùa hè nóng nực thế này mà được thưởng thức những viên kem Gelato mềm mịn, ú nu cốt kem sánh béo ngậy thì còn gì tuyệt bằng! Gấu Gelato đặc biệt gợi ý cho bạn vị kem Cookies Choc Chip giòn rụm kết hợp với sắc màu kỳ diệu của kem Cầu Vồng Rainbow rực rỡ. Đừng quên thử vị Mật Ong ngọt ngào dẻo thơm mát lạnh nhé. Nhập ngay mã voucher ${couponCode || 'GAUCHUBBY'} để nhận ưu đãi cực hời cho ngày hè thêm mọng nước!`,
        contentEn: `Hello dear Chubby Bears! In this scorching summer heat, nothing beats having a velvety scoop of fresh Italian Gelato with rich flavor bases. Gấu Gelato highly recommends our signature Cookies Choc Chip mixed together with the magical colors of Rainbow Gelato. Also, do not forget to savor our pure golden Honey flavor. Use coupon code ${couponCode || 'GAUCHUBBY'} now and enjoy sweet savings!`,
        ctaVi: `👉 Ghé ngay chi nhánh gần nhất, tích lũy điểm trực tiếp qua Zalo để đổi kem miễn phí nhé các Gấu ơi!`,
        ctaEn: `👉 Visit our nearest store now! Scan your QR code at checkout to accumulate loyalty points for free scoops!`
      }
    };
    
    res.json({
      ...mockResponses.default,
      warning: 'Running in mock simulation mode because GEMINI_API_KEY is not defined in setting secrets.'
    });
  }
});

// 2. API: AI Order Command Parser / Voice command parser using Gemini 2.5-flash
app.post('/api/voice-order', async (req, res) => {
  const { commandText } = req.body;

  if (!commandText) {
    return res.status(400).json({ error: 'Command text is required' });
  }

  try {
    const ai = getAiClient();
    const prompt = `
      Bạn là Trợ lý AI nhận diện đơn hàng tại quầy kem Gấu Gelato.
      Nhiệm vụ của bạn là phân tích câu nói tự nhiên của khách hàng hoặc nhân viên thu ngân thành một cấu trúc danh sách đơn hàng chi tiết.
      Các dịch vụ của tiệm gồm:
      - Set kem viên: bán theo set 1 viên (15000), 2 viên (25000), 3 viên (35000), 4 viên (45000),... hoặc set tự chế (giá tính tăng dần 10000đ mỗi viên thêm, ví dụ set 5 viên là 55000).
      - Bán theo gram: mix vị bất kỳ, giá là 300đ cho mỗi gram (ví dụ 100g = 30000), thêm topping thoải mái.
      - Món ăn kèm (accompaniment):
        * Bánh Kẹp Waffle Nóng: giá 10000đ (id: AC_WAFFLE)
        * Vỏ Ốc Quế Giòn Rụm: giá 5000đ (id: AC_CONE)
        * Bánh Mì Kẹp Kem Gấu: giá 8000đ (id: AC_BREAD)
      - Topping thêm:
        * Sữa Đặc Cao Cấp: giá 3000đ (id: TP_MILK)
        * Sô Cô La Chip: giá 4000đ (id: TP_CHOCO)
        * Hạt Hạnh Nhân Cắt Lát: giá 5000đ (id: TP_ALMOND)
        * Kẹo Xốp Dẻo Marshmallow: giá 5000đ (id: TP_MARSH)
        * Sốt Caramel Chảy Ngọt: giá 3000đ (id: TP_CARAMEL)

      Các vị kem hiện tại:
      - Cookies Choc Chip (FL_01)
      - Mật Ong Thiên Nhiên (FL_02)
      - Cam Thảo Cổ Điển (FL_03)
      - Kẹo Cao Su Hồng (FL_04)
      - Cầu Vồng Kỳ Diệu (FL_05)
      - Mâm Xôi Chanh Tây & Cam (FL_06)
      - Nho Khô Rượu Rum (FL_07)
      - Khoai Môn Béo Dẻo (FL_08)
      - Cappuccino Thượng Hạng (FL_09)

      Hãy phân tích câu lệnh sau: "${commandText}"

      Trả về kết quả dưới dạng JSON sau (không chứa markdown nào khác để có thể parse trực tiếp):
      {
        "items": [
          {
            "type": "set" hoặc "gram" hoặc "accompaniment" hoặc "topping",
            "quantity": số lượng,
            "flavorsSelected": [danh sách id vị kem tương ứng nếu có],
            "toppingsSelected": [danh sách id topping nếu có],
            "gramWeight": số gram nếu là bán theo gram
          }
        ],
        "appliedVoucher": "mã voucher nếu người dùng nói kiểu có mã giảm giá XYZ hoặc null",
        "memberPhone": "số điện thoại thành viên nôm na nếu có nhắc đến sđt khách hàng hoặc null"
      }
    `;

    const response = await ai.models.generateContent({
      model: 'gemini-2.5-flash',
      contents: prompt,
      config: {
        responseMimeType: 'application/json'
      }
    });

    const text = response.text || '{}';
    const cleanJson = text.replace(/```json/gi, '').replace(/```/g, '').trim();
    res.json(JSON.parse(cleanJson));

  } catch (error: any) {
    console.warn('Voice parser fallback:', error.message);

    // Simple regex parsing fallback for common scenarios if API key is not present
    let items: any[] = [];
    const lower = commandText.toLowerCase();

    if (lower.includes('set 1') || lower.includes('một viên') || lower.includes('1 viên')) {
      items.push({ type: 'set', quantity: 1, flavorsSelected: ['FL_01'] });
    } else if (lower.includes('set 2') || lower.includes('hai viên') || lower.includes('2 viên')) {
      items.push({ type: 'set', quantity: 1, flavorsSelected: ['FL_01', 'FL_05'] });
    } else if (lower.includes('set 3') || lower.includes('ba viên') || lower.includes('3 viên')) {
      items.push({ type: 'set', quantity: 1, flavorsSelected: ['FL_01', 'FL_02', 'FL_05'] });
    }
    
    if (lower.includes('ốc quế') || lower.includes('cone')) {
      items.push({ type: 'accompaniment', quantity: 1, nameVi: 'Vỏ Ốc Quế Giòn Rụm', price: 5000, id: 'AC_CONE' });
    }
    if (lower.includes('waffle')) {
      items.push({ type: 'accompaniment', quantity: 1, nameVi: 'Bánh Kẹp Waffle Nóng', price: 10000, id: 'AC_WAFFLE' });
    }
    if (lower.includes('bánh mì') || lower.includes('brioche')) {
      items.push({ type: 'accompaniment', quantity: 1, nameVi: 'Bánh Mì Kẹp Kem Gấu', price: 8000, id: 'AC_BREAD' });
    }
    if (lower.includes('gram') || lower.includes('cân')) {
      const match = lower.match(/(\d+)\s*(g|gram)/);
      const grams = match ? parseInt(match[1]) : 200;
      items.push({ type: 'gram', quantity: 1, gramWeight: grams, flavorsSelected: ['FL_08', 'FL_09'] });
    }

    res.json({
      items: items.length > 0 ? items : [{ type: 'set', quantity: 1, flavorsSelected: ['FL_01'] }],
      appliedVoucher: lower.includes('voucher') ? 'GAUCHUBBY' : null,
      memberPhone: lower.match(/0\d{9}/) ? lower.match(/0\d{9}/)[0] : null,
      warning: 'Running on in-app keyword heuristic matcher (Gemini API is waiting for key configuration).'
    });
  }
});

// Serve assets with Vite in Dev mode, and static files in Prod mode
async function startServer() {
  if (process.env.NODE_ENV !== 'production') {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), 'dist');
    app.use(express.static(distPath));
    app.get('*', (req, res) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`Gấu Gelato POS server booted successfully on http://0.0.0.0:${PORT}`);
  });
}

startServer();
