/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import { Language } from '../types';

interface AndroidEmulatorProps {
  lang: Language;
  onScanEmulatedBarcode: (barcodeResult: string) => void;
  children: React.ReactNode;
}

export const AndroidEmulator: React.FC<AndroidEmulatorProps> = ({
  lang,
  onScanEmulatedBarcode,
  children
}) => {
  const isVi = lang === 'vi';
  
  // States
  const [deviceMode, setDeviceMode] = useState<'none' | 'tablet' | 'phone'>('none');
  const [barcodeQuery, setBarcodeQuery] = useState('');
  const [printerStatus, setPrinterStatus] = useState<'disconnected' | 'connected'>('disconnected');
  const [scannerStatus, setScannerStatus] = useState<boolean>(true);

  // Quick emulate barcode code scanner
  const handleScanClick = (code: string) => {
    onScanEmulatedBarcode(code);
    const textMsg = isVi 
      ? `[Quét mã vạch] Thành công! Nhập sản phẩm mã: ${code}` 
      : `[Barcode Scanner] Scan success! Passed product/phone code: ${code}`;
    alert(textMsg);
  };

  if (deviceMode === 'none') {
    return (
      <div className="bg-amber-50/50 p-6 rounded-3xl border border-amber-900/5 shadow-sm space-y-6 max-w-4xl mx-auto font-sans text-stone-800">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-amber-900/10 pb-4">
          <div>
            <h3 className="text-xl font-bold text-[#4A3E3E] flex items-center gap-1.5">
              <span>🤖 Android Native Deployment & Tablet POS</span>
            </h3>
            <p className="text-xs text-gray-500">
              {isVi 
                ? 'Cách đóng gói ứng dụng Gấu Gelato thành file APK/AAB cho Tablet & điện thoại chuyên dụng tại quầy.'
                : 'Learn how to package the Gấu Gelato web app into native Android APKs for heavy-duty checkout tablets.'}
            </p>
          </div>
          <div className="flex flex-wrap gap-2">
            <button
               onClick={() => setDeviceMode('tablet')}
               className="bg-amber-800 hover:bg-amber-900 text-white font-medium text-xs px-3 py-2 rounded-xl border border-amber-950 transition cursor-pointer"
            >
              🖥️ {isVi ? 'Mô phỏng Giao diện Tablet' : 'Simulate Tablet View'}
            </button>
            <button
               onClick={() => setDeviceMode('phone')}
               className="bg-amber-700 hover:bg-amber-800 text-white font-medium text-xs px-3 py-2 rounded-xl transition cursor-pointer"
            >
              📱 {isVi ? 'Mô phỏng Giao diện Điện Thoại' : 'Simulate Phone View'}
            </button>
          </div>
        </div>

        {/* Capacitor build tutorials */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="space-y-4">
            <h4 className="text-sm font-bold text-amber-950 uppercase tracking-wide">
              {isVi ? 'Đóng Gói Ứng Dụng với Capacitor' : 'Step-by-step Native Packaging'}
            </h4>
            <p className="text-xs leading-relaxed text-stone-600">
              {isVi 
                ? 'Ứng dụng được viết hoàn toàn tương thích để chạy mượt mà dưới dạng ứng dụng lai (Hybrid App) trên Android, hỗ trợ kết nối trực tiếp thiết bị ngoại vi qua Bluetooth/OTG.'
                : 'Our codebase is fully modularized and optimized to work seamlessly as a Hybrid Android app wrapped under Capacitor Framework, facilitating peripheral calls.'}
            </p>
            
            <div className="bg-stone-900 text-amber-200 p-4 rounded-2xl font-mono text-xs space-y-3 shadow-inner border border-stone-800">
              <div>
                <p className="text-stone-500 mb-1"># 1. Cài đặt Capacitor Core và CLI</p>
                <p className="text-green-400">npm install @capacitor/core @capacitor/cli</p>
              </div>
              <div>
                <p className="text-stone-500 mb-1"># 2. Khởi tạo dự án Android</p>
                <p className="text-green-400">npx cap init "Gau Gelato POS" "com.gaugelato.pos"</p>
              </div>
              <div>
                <p className="text-stone-500 mb-1"># 3. Add nền tảng Android SDK</p>
                <p className="text-green-400">npm install @capacitor/android && npx cap add android</p>
              </div>
              <div>
                <p className="text-stone-500 mb-1"># 4. Build nén mã nguồn & đồng bộ sang Studio</p>
                <p className="text-green-400">npm run build && npx cap sync</p>
              </div>
            </div>
          </div>

          <div className="space-y-4 bg-white p-5 rounded-3xl border border-amber-900/5 shadow-sm">
            <h4 className="text-sm font-bold text-[#4A3E3E]">
              {isVi ? '🎯 Lợi ích khi xuất file cài đặt APK' : '🎯 Benefits of POS Android APK'}
            </h4>
            <ul className="text-xs text-stone-600 space-y-2.5 list-disc pl-5">
              <li>
                <strong>{isVi ? 'Chế độ Kiosk Kính' : 'Kiosk Screen Lock'}</strong>:
                {isVi ? ' Khóa thiết bị chỉ hiển thị màn hình bán hàng Gấu Gelato, chống nhân viên thoát ra bấm game.' : ' Prevent cashiers from exiting active checkout panels to keep device dedicated.'}
              </li>
              <li>
                <strong>{isVi ? 'Tích hợp Máy Quét Mã Vạch OTG' : 'OTG Barcode Scans'}</strong>:
                {isVi ? ' Nhận diện sđt hội viên hoặc quét voucher giấy tốc độ cao qua camera hoặc máy quét chuyên dụng.' : ' Instantly search customer records or coupons bypassing slow manual entry processes.'}
              </li>
              <li>
                <strong>{isVi ? 'In hóa đơn nhiệt trực tiếp' : 'Bluetooth Thermal Feeds'}</strong>:
                {isVi ? ' Gửi lệnh in 80mm không dây qua giao thức Bluetooth RFCOMM tới máy in dán tường.' : ' Flush layouts straight onto physical receipts wirelessly.'}
              </li>
              <li>
                <strong>{isVi ? 'Chế độ offline tạm thời' : 'Local Offline Buffering'}</strong>:
                {isVi ? ' Tiếp tục bán hàng, lưu tạm bill trong SQLite cục bộ khi đứt mạng và tự động đồng bộ khi có sóng.' : ' Keeps queue moving with internal database buffers during network drops.'}
              </li>
            </ul>

            <div className="flex gap-2 pt-2 border-t mt-4">
              <span className="inline-flex items-center gap-1.5 text-xs text-amber-800 bg-amber-50 px-3 py-1 rounded-full border border-amber-900/10 font-bold">
                📱 {isVi ? 'Đáp ứng tốt từ sđt mộc mạc tới Tablet 12 Inch' : 'Autoscale content from smartphone views to 12" wide Tablets'}
              </span>
            </div>
          </div>
        </div>

        {/* Emulate scanners */}
        <div className="border-t border-amber-900/10 pt-4 space-y-3">
          <span className="block text-xs font-bold text-gray-500 uppercase tracking-wider">
            {isVi ? 'Mô phỏng tích hợp phần cứng tại quầy Gấu Gelato' : 'Hardware Integrations Testing sandbox'}
          </span>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
            <div className="bg-white p-3 rounded-2xl border flex items-center justify-between">
              <div>
                <span className="text-xs font-bold block">{isVi ? 'Máy in Bill Bluetooth' : 'Receipt Printer'}</span>
                <span className="text-[10px] text-gray-500">80mm thermal, 203 DPI</span>
              </div>
              <button
                onClick={() => setPrinterStatus(prev => prev === 'connected' ? 'disconnected' : 'connected')}
                className={`text-[10px] px-2.5 py-1.5 rounded-lg border font-medium cursor-pointer ${
                  printerStatus === 'connected' ? 'bg-green-100 text-green-800 border-green-300' : 'bg-stone-50 text-stone-600'
                }`}
              >
                {printerStatus === 'connected' ? (isVi ? '● Đã kết nối' : 'Connected') : (isVi ? 'Mất kết nối' : 'Disconnected')}
              </button>
            </div>

            <div className="bg-white p-3 rounded-2xl border flex items-center justify-between">
              <div>
                <span className="text-xs font-bold block">{isVi ? 'Súng Quét Barcode/QR' : 'Barcode Scanner Gun'}</span>
                <span className="text-[10px] text-gray-500">USB Laser scanning emu</span>
              </div>
              <button
                onClick={() => setScannerStatus(prev => !prev)}
                className={`text-[10px] px-2.5 py-1.5 rounded-lg border font-medium cursor-pointer ${
                  scannerStatus ? 'bg-green-100 text-green-800 border-green-300' : 'bg-stone-50 text-stone-600'
                }`}
              >
                {scannerStatus ? (isVi ? 'Kích hoạt Laser' : 'Laser Active') : (isVi ? 'Tắt quét' : 'Inactive')}
              </button>
            </div>

            <div className="bg-white p-3 rounded-2xl border space-y-2">
              <span className="text-xs font-bold block">{isVi ? 'Quét Thử Thẻ Hội Viên VIP' : 'Simulate Member card scan'}</span>
              <div className="flex gap-1.5">
                <button
                  onClick={() => handleScanClick('0966456789')}
                  className="bg-amber-150 hover:bg-amber-200 text-stone-700 text-[10px] px-2 py-1 border rounded bg-amber-50 cursor-pointer"
                >
                  [Phạm Phương Thảo]
                </button>
                <button
                  onClick={() => handleScanClick('0909555111')}
                  className="bg-amber-150 hover:bg-amber-200 text-stone-700 text-[10px] px-2 py-1 border rounded bg-amber-50 cursor-pointer"
                >
                  [Trần Minh Quân]
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // Device layout simulator container (Tablet or Phone context wrapping standard children POS view)
  return (
    <div className="bg-stone-900 grid grid-rows-1 justify-items-center p-2 sm:p-6 rounded-3xl min-h-[92vh] font-sans no-print text-white">
      <div className="w-full flex items-center justify-between mb-4 border-b border-stone-800 pb-3">
        <div className="flex items-center gap-2">
          <span className="text-sm font-bold text-amber-400">🤖 {isVi ? 'Đang bật khung mô phỏng' : 'Simulating Android App Wrapper'}</span>
          <span className="bg-stone-800 px-2 py-0.5 rounded text-[10px] uppercase font-bold text-gray-400 font-mono">
            {deviceMode === 'tablet' ? 'ANDROID TABLET (16:9)' : 'ANDROID SMARTPHONE (19.5:9)'}
          </span>
        </div>
        <button
          onClick={() => setDeviceMode('none')}
          className="text-xs text-stone-400 bg-stone-800 px-3 py-1.5 rounded-xl border border-stone-700 hover:text-white cursor-pointer"
        >
          ❌ {isVi ? 'Tắt giả lập' : 'Exit simulator'}
        </button>
      </div>

      <div className="w-full max-w-6xl mx-auto flex items-center justify-center">
        {deviceMode === 'tablet' ? (
          /* Tablet Shell Wrapper aspect h-768px w-1024px ratio */
          <div className="w-full bg-stone-950 p-[16px] rounded-[36px] border-[12px] border-stone-800 shadow-2xl relative">
            {/* Camera dot */}
            <div className="absolute top-[50%] left-[3px] w-2 h-2 rounded-full bg-stone-750 transform translate-y-[-50%]" />
            <div className="bg-[#FDFBF7] rounded-2xl overflow-y-auto aspect-[4/3] max-h-[70vh] text-stone-800">
              {children}
            </div>
            {/* Android bar */}
            <div className="flex justify-center text-center mt-2.5">
              <div className="w-24 h-1.5 bg-stone-700 rounded-full cursor-pointer" onClick={() => setDeviceMode('none')} />
            </div>
          </div>
        ) : (
          /* Phone Shell aspect ratio scaled */
          <div className="w-full max-w-sm bg-stone-900 p-[12px] rounded-[48px] border-[10px] border-stone-800 shadow-2xl relative">
            <div className="absolute top-[8px] left-[50%] transform translate-x-[-50%] w-24 h-4 bg-stone-950 rounded-full flex items-center justify-center">
              <div className="w-2 h-2 rounded-full bg-stone-800" />
            </div>
            <div className="bg-[#FDFBF7] rounded-[32px] overflow-y-auto aspect-[9/19.5] max-h-[80vh] text-stone-800 mt-2">
              {children}
            </div>
            <div className="flex justify-center text-center mt-2">
              <div className="w-16 h-1 bg-stone-700 rounded-full" />
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
