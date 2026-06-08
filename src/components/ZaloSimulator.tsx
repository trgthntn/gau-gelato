/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import { LoyaltyMember, Language } from '../types';

interface ZaloSimulatorProps {
  memberList: LoyaltyMember[];
  lang: Language;
}

export const ZaloSimulator: React.FC<ZaloSimulatorProps> = ({
  memberList,
  lang
}) => {
  const isVi = lang === 'vi';
  const [selectedMember, setSelectedMember] = useState<string>(memberList[0]?.phone || '');
  const [selectedTemplate, setSelectedTemplate] = useState<'promo' | 'gift'>('promo');
  const [customMsgTitle, setCustomMsgTitle] = useState('ĐÓNG KHUÂN KEM GẤU - NHẬN QUÀ CỰC NGẦU');
  const [isSending, setIsSending] = useState(false);
  const [sentAlert, setSentAlert] = useState(false);

  const activeMember = memberList.find(m => m.phone === selectedMember) || memberList[0];

  const handleSendZns = () => {
    setIsSending(true);
    setTimeout(() => {
      setIsSending(false);
      setSentAlert(true);
      setTimeout(() => setSentAlert(false), 3000);
    }, 1000);
  };

  const currentPoints = activeMember?.points || 0;

  return (
    <div className="bg-amber-50/40 p-4 sm:p-6 rounded-3xl border border-amber-900/5 shadow-sm max-w-4xl mx-auto space-y-6 font-sans text-stone-800">
      <div className="border-b border-amber-900/10 pb-3">
        <h3 className="text-lg font-bold text-[#4A3E3E] flex items-center gap-1.5">
          <span>💬 {isVi ? 'Hệ Thống Zalo ZNS Khách Hàng Thân Thiết' : 'Zalo ZNS Loyalty Notification System'}</span>
        </h3>
        <p className="text-xs text-gray-500">
          {isVi 
            ? 'Gửi tin nhắn thương hiệu tới ứng dụng Zalo của hội viên đã quét tích điểm.'
            : 'Send promotional notifications and point updates directly to customer mobile phone via Zalo API.'}
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 items-start">
        {/* Left: Campaign selector */}
        <div className="space-y-4">
          <div className="space-y-3 bg-white p-4 rounded-2xl border border-amber-900/5 shadow-sm">
            <span className="block text-xs font-bold text-gray-500 uppercase tracking-wider">
              {isVi ? '1. Chọn Khách hàng gấu nhận tin' : '1. Target Customer Phone'}
            </span>
            <select
              value={selectedMember}
              onChange={e => setSelectedMember(e.target.value)}
              className="w-full text-xs border rounded-xl p-2 bg-[#FDFBF7]/30 focus:outline-none focus:ring-1 focus:ring-amber-500"
            >
              {memberList.map((m) => (
                <option key={m.phone} value={m.phone}>
                  {m.name} - {m.phone} ({m.points} {isVi ? 'điểm' : 'pts'})
                </option>
              ))}
            </select>
          </div>

          <div className="space-y-3 bg-white p-4 rounded-2xl border border-amber-900/5 shadow-sm">
            <span className="block text-xs font-bold text-gray-500 uppercase tracking-wider">
              {isVi ? '2. Cấu hình Mẫu tin nhắn Zalo' : '2. Message template details'}
            </span>
            
            <div className="space-y-2">
              <label className="flex items-center gap-2 text-xs">
                <input
                  type="radio"
                  name="zalo_template"
                  checked={selectedTemplate === 'promo'}
                  onChange={() => {
                    setSelectedTemplate('promo');
                    setCustomMsgTitle(isVi ? 'SIÊU TIỆC MÙA HÈ - TẶNG THƯỞNG 1 VỊ KEM' : 'SUMMER GELATO SPECIAL - CLAIM 1 FREE SCOOP');
                  }}
                  className="text-amber-800 focus:ring-amber-500"
                />
                <span>🔥 {isVi ? 'Mẫu 1: Ưu Đãi Mùa Hè Rực Rỡ' : 'Template 1: Sparkling Summer Offer'}</span>
              </label>

              <label className="flex items-center gap-2 text-xs">
                <input
                  type="radio"
                  name="zalo_template"
                  checked={selectedTemplate === 'gift'}
                  onChange={() => {
                    setSelectedTemplate('gift');
                    setCustomMsgTitle(isVi ? 'ĐẶC QUYỀN HỘI VIÊN GẤU GELATO HẠNG VIP' : 'GẤU GELATO VIP BELOVED EXCLUSIVE GIFT');
                  }}
                  className="text-amber-800 focus:ring-amber-500"
                />
                <span>🎁 {isVi ? 'Mẫu 2: Tri Ân Cuối Tuần (Đổi quà miễn phí)' : 'Template 2: Weekend Milestone Benefit'}</span>
              </label>
            </div>

            <div className="pt-2 border-t mt-2">
              <label className="block text-[10px] uppercase font-bold text-gray-500 mb-1">{isVi ? 'Tiêu đề hiển thị' : 'Message Display Title'}</label>
              <input
                type="text"
                 value={customMsgTitle}
                 onChange={e => setCustomMsgTitle(e.target.value)}
                 className="w-full text-xs border rounded-xl p-2 bg-[#FDFBF7]/30"
              />
            </div>
          </div>

          <button
            onClick={handleSendZns}
            disabled={isSending || memberList.length === 0}
            className="w-full bg-[#4A3E3E] hover:bg-amber-950 text-white font-medium text-xs py-2.5 px-4 rounded-xl shadow-md cursor-pointer transition flex items-center justify-center gap-2"
          >
            {isSending ? (
              <span className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></span>
            ) : (
              <span>📨 {isVi ? 'GỬI TIN NHẮN ZALO TRỰC TIẾP' : 'DISPATCH ZALO CAMPAIGN'}</span>
            )}
          </button>

          {sentAlert && (
            <div className="bg-green-150 border border-green-300 text-green-800 p-2 text-center rounded-xl text-xs font-semibold animate-bounce bg-green-50">
              🎉 {isVi ? 'Đã gửi thành công tin nhắn thương hiệu tới máy khách hàng!' : 'System sent brand notification to subscriber successfully!'}
            </div>
          )}
        </div>

        {/* Right: Premium Smartphone Preview mockup */}
        <div className="space-y-3">
          <span className="block text-xs font-bold text-gray-400 uppercase tracking-wider">
            {isVi ? '3. Preview giao diện trên điện thoại khách hàng' : '3. Live View on customer phone screen'}
          </span>
          
          <div className="max-w-[280px] mx-auto bg-stone-900 p-3 rounded-[36px] border-4 border-stone-850 shadow-lg select-none">
            <div className="bg-[#FDFBF7] rounded-[24px] overflow-hidden min-h-[380px] flex flex-col justify-between font-sans text-stone-800 text-xs">
              
              {/* Phone Header */}
              <div className="bg-blue-600 text-white p-3 pt-4 flex items-center gap-2">
                <div className="bg-white rounded-full p-0.5 w-6 h-6 flex items-center justify-center">
                  <span className="text-[#0068FF] font-black text-[9px]">Z</span>
                </div>
                <div>
                  <h4 className="font-bold text-[10px] leading-tight">Zalo ZNS Official</h4>
                  <p className="text-[7.5px] opacity-80">{isVi ? 'Tin nhắn Thương Hiệu' : 'Certified Brand SMS'}</p>
                </div>
              </div>

              {/* Msg Content Card */}
              <div className="p-3 flex-1 flex flex-col justify-start space-y-2.5">
                <div className="bg-white p-3 rounded-xl border space-y-2 shadow-sm">
                  {/* Brand and blue badge */}
                  <div className="flex items-center gap-1.5 border-b pb-1.5">
                    <div className="bg-[#4A3E3E] text-stone-50 p-1 rounded w-5 h-5 flex items-center justify-center font-bold text-[7px] text-white">G</div>
                    <div>
                      <h5 className="font-bold text-[9px] text-[#4A3E3E]">GẤU GELATO CẬP NHẬT</h5>
                      <p className="text-[7px] text-gray-400">Ghé tiệm tích điểm: {activeMember?.phone}</p>
                    </div>
                  </div>

                  {/* Title */}
                  <h6 className="font-bold text-stone-800 text-[10px] leading-tight border-b pb-1">
                    {customMsgTitle}
                  </h6>

                  {/* Texts details content */}
                  <p className="text-[8px] text-gray-600 leading-snug">
                    {isVi ? 'Kính gửi Gấu Cưng' : 'Dear beloved guest'} <strong>{activeMember?.name || 'Khách Hàng'}</strong>,<br />
                    {selectedTemplate === 'promo' ? (
                      isVi 
                        ? 'Chào hè mát lạnh sảng khoái với bộ siêu tập vị kem tươi Ú Nu mới! Bạn đang nhận ngay mã Quà Đặc Biệt:'
                        : 'Cool down with our brand new rich Gelato selection! Claim your exclusive member Summer code:'
                    ) : (
                      isVi
                        ? 'Gấu Gelato tri ân sự đồng hành ngọt ngào của bạn. Nhân dịp này, bạn nhận được đặc quyền đổi kem miễn phí:'
                        : 'Gấu Gelato values your regular support! Redeeem your milestone reward voucher listed below:'
                    )}
                  </p>

                  {/* Red highlighted coupon card detail */}
                  <div className="bg-rose-50 border border-dashed border-rose-300 p-2 rounded-lg text-center font-bold text-rose-800 text-[10px]">
                    {selectedTemplate === 'promo' ? 'CODE: GAUCHUBBY (Giảm 10%)' : 'VOCHER: MIENPHI1VIEN'}
                  </div>

                  <div className="text-[8px] text-gray-500 leading-tight space-y-0.5 border-t pt-1.5">
                    <div>• {isVi ? 'Điểm tích lũy hiện có' : 'Active points'}: <strong className="text-amber-800">{currentPoints} {isVi ? 'điểm' : 'pts'}</strong></div>
                    <div>• {isVi ? 'Hạn dùng' : 'Expires'}: <strong>{isVi ? '31/12/2026' : '12/31/2026'}</strong></div>
                  </div>
                </div>
              </div>

              {/* Message Buttons Action bar */}
              <div className="p-2 border-t bg-stone-50 flex gap-1 justify-center leading-none">
                <a
                  href="#portal"
                  className="bg-[#0068FF] text-white text-[8px] py-1.5 px-3 rounded text-center font-semibold font-sans block w-full shadow-sm"
                  onClick={(e) => { e.preventDefault(); alert(isVi ? 'Dẫn tới trang portal theo dõi tích lũy của khách hàng!' : 'Opens customer portal link!'); }}
                >
                  🔗 {isVi ? 'Xem Trang Theo Dõi Điểm' : 'Check Points History'}
                </a>
              </div>

            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
