/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React from 'react';
import { Order, Branch, Language } from '../types';

interface Receipt80mmProps {
  order: Order;
  branch: Branch;
  lang: Language;
  onPrint?: () => void;
  onClose?: () => void;
}

export const Receipt80mm: React.FC<Receipt80mmProps> = ({
  order,
  branch,
  lang,
  onPrint,
  onClose
}) => {
  const isVi = lang === 'vi';
  const isPreview = order.id.startsWith('PREVIEW_');

  // Generate real dynamic Payment VietQR string
  // Format: https://img.vietqr.io/image/<BANK_ID>-<ACCOUNT_NO>-<TEMPLATE>.png?amount=<AMOUNT>&addInfo=<INFO>&accountName=<HOLDER>
  const infoNote = `GG_${order.id.slice(-6)}`;
  const qrBaseUrl = `https://img.vietqr.io/image/${branch.bankName || 'Vietcombank'}-${branch.bankAccount}-qr_only.png`;
  const qrParams = `?amount=${order.total}&addInfo=${encodeURIComponent(infoNote)}&accountName=${encodeURIComponent(branch.bankHolder)}`;
  const vietQrUrl = qrBaseUrl + qrParams;

  // Personal loyalty portal dynamic path (emulated client-lookup portal)
  const loyaltyPortalUrl = `https://gaugelato.vn/member/${order.memberPhone || 'guest'}?bill=${order.id}`;
  const loyaltyQrUrl = `https://api.qrserver.com/v1/create-qr-code/?size=150x150&data=${encodeURIComponent(loyaltyPortalUrl)}&color=5B3F23&bgcolor=FFF5E4`;

  return (
    <div className="bg-amber-50/20 p-2 md:p-6 rounded-2xl border border-amber-900/10 max-w-md mx-auto my-4 shadow-sm relative text-[#4A3E3E]" id="receipt-container">
      {/* Receipts Close and Print controls */}
      <div className="flex items-center justify-between mb-4 border-b border-amber-900/10 pb-2 no-print">
        <span className="font-sans text-xs font-bold text-amber-950 uppercase tracking-wider">
          {isPreview ? (isVi ? 'BẢN XEM TRƯỚC HÓA ĐƠN' : 'BILL PREVIEW DRAFT') : (isVi ? 'Mẫu In Thử 80mm' : '80mm Thermal Copy')}
        </span>
        <div className="flex gap-2">
          {!isPreview && (
            <button
              onClick={onPrint || (() => window.print())}
              className="bg-amber-800 text-stone-50 px-3 py-1 text-xs font-medium rounded-lg hover:bg-amber-900 shadow-sm transition flex items-center gap-1 cursor-pointer"
            >
              <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M17 17h2a2 2 0 002-2v-4a2 2 0 00-2-2H5a2 2 0 00-2 2v4a2 2 0 002 2h2m2 4h6a2 2 0 002-2v-4a2 2 0 00-2-2H9a2 2 0 00-2 2v4a2 2 0 002 2zm8-12V5a2 2 0 00-2-2H9a2 2 0 00-2 2v4h10z" />
              </svg>
              {isVi ? 'In Nhiệt' : 'Print Bill'}
            </button>
          )}
          {onClose && (
            <button
              onClick={onClose}
              className="text-stone-500 hover:text-stone-800 border border-stone-200 px-3 py-1 text-xs font-semibold rounded-lg bg-white cursor-pointer transition shadow-2xs"
            >
              {isVi ? 'Đóng' : 'Close'}
            </button>
          )}
        </div>
      </div>

      {/* Actual 80mm styled thermal slip */}
      <div className="bg-white border text-stone-800 p-6 shadow-md border-amber-900/10 rounded-lg max-w-[80mm] mx-auto font-mono text-xs leading-relaxed" id="thermal-receipt">
        {isPreview && (
          <div className="bg-rose-50 border border-rose-300 text-rose-800 px-2 py-2 rounded-xl mb-3 text-center text-[9px] font-bold leading-tight uppercase">
            ⚠️ {isVi ? 'HÓA ĐƠN XEM TRƯỚC (NHÁP)' : 'BILL PREVIEW (DRAFT ONLY)'} <br/>
            {isVi ? 'Giao dịch chưa lưu • Không thanh toán' : 'Not recorded in Cloud database'}
          </div>
        )}
        <div className="text-center mb-4">
          <div className="flex justify-center mb-1">
            {/* Bear Logo representation */}
            <svg viewBox="0 0 100 100" className="w-12 h-12 text-[#5B3F23] fill-current">
              <circle cx="28" cy="22" r="8" />
              <circle cx="72" cy="22" r="8" />
              <path d="M50 32 C 30 32, 20 45, 20 62 C 20 80, 32 88, 50 88 C 68 88, 80 80, 80 62 C 80 45, 70 32, 50 32 Z" fill="none" stroke="#5B3F23" strokeWidth="5"/>
              <ellipse cx="50" cy="65" rx="14" ry="10" fill="#FFEAD2" />
              <circle cx="50" cy="60" r="3.5" />
              <path d="M46 64 C 48 68, 52 68, 54 64" fill="none" stroke="#5B3F23" strokeWidth="1.5" strokeLinecap="round"/>
              <circle cx="38" cy="50" r="3" />
              <circle cx="62" cy="50" r="3" />
            </svg>
          </div>
          <h2 className="text-sm font-bold text-[#5B3F23] uppercase tracking-wide">Gấu Gelato</h2>
          <p className="text-[10px] text-gray-500 italic mt-0.5">{isVi ? 'Ú nu ~ Dễ thương ~ Ngọt ngào' : 'Chubby ~ Cute ~ Sweet'}</p>
          <div className="border-t border-dashed border-gray-400 my-2"></div>
          
          <h3 className="font-bold text-[10px] leading-tight text-left mb-1">{branch.companyName}</h3>
          <p className="text-[9px] text-gray-600 text-left leading-snug">
            {isVi ? 'Đ/c' : 'Add'}: {branch.address}<br />
            {isVi ? 'MST' : 'TAX ID'}: {branch.mst}<br />
            {isVi ? 'Email' : 'E-mail'}: {branch.email}
          </p>
        </div>

        <div className="border-t border-dashed border-gray-400 my-2"></div>

        {/* Bill Metadata */}
        <div className="text-[10px] text-gray-600 leading-tight space-y-0.5">
          <div><strong>{isVi ? 'Mã HD' : 'Bill ID'}:</strong> {order.id}</div>
          <div><strong>{isVi ? 'Ngày' : 'Date'}:</strong> {order.date}</div>
          <div><strong>{isVi ? 'Nhân viên' : 'Staff'}:</strong> {order.staffName} ({order.staffId})</div>
          {order.memberPhone && (
            <div><strong>{isVi ? 'Thành viên' : 'Loyalty Guest'}:</strong> {order.memberPhone}</div>
          )}
        </div>

        <div className="border-t border-dashed border-gray-400 my-2"></div>

        {/* Order Items Table */}
        <table className="w-full text-[10px]">
          <thead>
            <tr className="border-b border-dashed border-gray-400 text-left">
              <th className="pb-1 font-bold w-[60%]">{isVi ? 'Tên món' : 'Description'}</th>
              <th className="pb-1 font-bold text-center w-[15%]">{isVi ? 'SL' : 'Qty'}</th>
              <th className="pb-1 font-bold text-right w-[25%]">{isVi ? 'T.Tiền' : 'Total'}</th>
            </tr>
          </thead>
          <tbody>
            {order.items.map((item, idx) => (
              <tr key={idx} className="align-top">
                <td className="py-1 leading-snug">
                  <div>
                    {isVi ? item.nameVi : item.nameEn}
                    {item.type === 'gram' && (
                      <span className="text-[9px] text-gray-500"> ({item.gramWeight}g)</span>
                    )}
                  </div>
                  {/* Detailed Flavors choose helper */}
                  {item.flavorsSelected && item.flavorsSelected.length > 0 && (
                    <div className="text-[8.5px] text-stone-500 pl-2 leading-none">
                      • {isVi ? 'Vị' : 'Flavors'}: {item.flavorsSelected.join(', ')}
                    </div>
                  )}
                  {/* Toappings selection for weight */}
                  {item.toppingsSelected && item.toppingsSelected.length > 0 && (
                    <div className="text-[8.5px] text-stone-500 pl-2 leading-none">
                      • Topping: {item.toppingsSelected.join(', ')}
                    </div>
                  )}
                </td>
                <td className="py-1 text-center">{item.quantity}</td>
                <td className="py-1 text-right">{(item.price * item.quantity).toLocaleString('vi-VN')}</td>
              </tr>
            ))}
          </tbody>
        </table>

        <div className="border-t border-dashed border-gray-400 my-2"></div>

        {/* Totals Section */}
        <div className="space-y-1 text-[10px]">
          <div className="flex justify-between">
            <span>{isVi ? 'Tổng tiền món' : 'Subtotal'}:</span>
            <span>{order.subtotal.toLocaleString('vi-VN')}đ</span>
          </div>
          {order.discountAmount > 0 && (
            <div className="flex justify-between text-cherry-600 font-semibold text-rose-700">
              <span>{isVi ? 'Giảm khuyến mãi' : 'Discount'}:</span>
              <span>-{order.discountAmount.toLocaleString('vi-VN')}đ</span>
            </div>
          )}
          <div className="flex justify-between text-gray-600">
            <span>VAT ({order.taxRate}%):</span>
            <span>{order.taxAmount.toLocaleString('vi-VN')}đ</span>
          </div>
          <div className="flex justify-between font-bold text-[#5B3F23] border-t border-dotted border-gray-400 pt-1 text-xs">
            <span>{isVi ? 'TỔNG CỘNG' : 'GRAND TOTAL'}:</span>
            <span>{order.total.toLocaleString('vi-VN')}đ</span>
          </div>
        </div>

        <div className="border-t border-dashed border-gray-400 my-2"></div>

        {/* Loyalty Point Tracker */}
        {order.memberPhone && (
          <div className="bg-amber-50/50 p-2 rounded text-[9px] border border-amber-900/10 leading-snug my-2">
            <div className="font-bold text-[#5B3F23] text-center mb-1">🐻 {isVi ? 'ĐIỂM GẤU THÂN THIẾT' : 'CHUBBY LOYALTY CLUB'}</div>
            <div className="flex justify-between">
              <span>{isVi ? 'Lũy kế cũ' : 'Previous Points'}:</span>
              <span>15 {isVi ? 'điểm' : 'pts'}</span>
            </div>
            <div className="flex justify-between text-green-700">
              <span>{isVi ? 'Điểm nhận thêm' : 'Earned Points'}:</span>
              <span>+{Math.max(1, Math.floor(order.total / 10000))} {isVi ? 'điểm' : 'pts'}</span>
            </div>
            <div className="flex justify-between font-bold border-t border-dotted border-amber-900/10 pt-1">
              <span>{isVi ? 'Số điểm hiện tại' : 'Current Points'}:</span>
              <span>{15 + Math.max(1, Math.floor(order.total / 10000))} {isVi ? 'điểm' : 'pts'}</span>
            </div>
          </div>
        )}

        {/* Payments QR block based on checkout selection */}
        {order.paymentMethod === 'qr' ? (
          <div className="text-center my-3 bg-stone-50 p-2 rounded-lg border border-gray-200">
            <p className="text-[8.5px] font-bold text-gray-700 mb-1 leading-none uppercase">
              {isVi ? 'QUÉT MÃ TRẢ TIỀN GẤU' : 'SCAN VIETQR PAY'}
            </p>
            <div className="flex justify-center bg-white p-1.5 border border-stone-200 rounded self-center max-w-[140px] mx-auto">
              <img
                src={vietQrUrl}
                alt="VietQR transfer code"
                className="w-28 h-28 object-contain"
                crossOrigin="anonymous"
              />
            </div>
            <p className="text-[8px] text-gray-500 mt-1 leading-tight">
              {branch.bankName} - {branch.bankAccount}<br />
              {isVi ? 'Nội dung' : 'Info'}: <strong>{infoNote}</strong><br />
              {isVi ? 'Số tiền' : 'Amount'}: <strong>{order.total.toLocaleString('vi-VN')}đ</strong>
            </p>
          </div>
        ) : (
          <div className="text-center my-2 py-1 border border-stone-200 rounded bg-stone-50/50">
            <span className="text-[8.5px] font-semibold text-gray-500">
              * {isVi ? 'ĐÃ THANH TOÁN TIỀN MẶT' : 'PAID BY CASH'} *
            </span>
          </div>
        )}

        <div className="border-t border-dashed border-gray-400 my-2"></div>

        {/* Member QR Link */}
        <div className="text-center">
          <div className="flex justify-center mb-1">
            <img
              src={loyaltyQrUrl}
              alt="Loyalty Link QR"
              className="w-16 h-16 border border-stone-200 p-0.5 rounded"
            />
          </div>
          <p className="text-[7.5px] text-stone-500 leading-tight">
            {isVi ? 'Quét QR để theo dõi tích điểm cá nhân' : 'Scan to access your personal points portal'}<br />
            {isVi ? 'và đổi kem tặng' : 'and claim loyalty gifts'}
          </p>
          <p className="text-[7px] text-gray-400 italic mt-2 uppercase tracking-tight">
            --- {isVi ? 'Cảm ơn Thượng Đế đã ghé tiệm' : 'Thank you for choosing Gấu Gelato'} ---
          </p>
        </div>
      </div>
    </div>
  );
};
