/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import { Flavor, Topping, Accompaniment, InventoryLog, Language, Branch, Staff } from '../types';
import { LOCALES } from '../locales';

interface InventoryManagerProps {
  lang: Language;
  allBranchStocks: Record<string, Record<string, number>>; // Full stocks map: branchId -> itemId -> values
  branches: Branch[];
  activeBranch: Branch;
  activeUser: Staff | null;
  flavors: Flavor[];
  toppings: Topping[];
  accompaniments: Accompaniment[];
  allInventoryLogs: InventoryLog[];
  onInventoryAction: (
    targetBranchId: string,
    itemId: string,
    itemType: 'flavor' | 'topping' | 'accompaniment',
    itemName: string,
    actionType: 'delta' | 'calibrate' | 'transfer',
    value: number,
    reasonVi: string,
    reasonEn: string,
    importPrice?: number
  ) => void;
}

export const InventoryManager: React.FC<InventoryManagerProps> = ({
  lang,
  allBranchStocks,
  branches,
  activeBranch,
  activeUser,
  flavors,
  toppings,
  accompaniments,
  allInventoryLogs,
  onInventoryAction
}) => {
  const isVi = lang === 'vi';
  const t = LOCALES[lang];

  // Selected warehouse/branch to view & adjust
  const [selectedBranchId, setSelectedBranchId] = useState<string>('central');

  // Sub-tab for stock operations on the right side
  // 'calibrate' = Cân chỉnh tồn kho thực tế (Direct Calibration)
  // 'delta' = Nhập/Xuất kho thủ công (Delta adjustment)
  // 'transfer' = Cấp phát hàng (Distribute/replenish from Central)
  const [activeOpsTab, setActiveOpsTab] = useState<'calibrate' | 'delta' | 'transfer'>('calibrate');

  // Form states
  const [selectedItemId, setSelectedItemId] = useState('');
  const [directCalibrateValue, setDirectCalibrateValue] = useState<number | ''>('');
  const [adjustAmount, setAdjustAmount] = useState<number | ''>('');
  const [transferAmount, setTransferAmount] = useState<number | ''>('');
  const [transferTargetBranchId, setTransferTargetBranchId] = useState<string>(''); // Used when sending from central
  const [notes, setNotes] = useState('');
  const [importPriceInput, setImportPriceInput] = useState<number | ''>('');

  // Selected branch/warehouse metadata
  const selectedBranchName = selectedBranchId === 'central'
    ? (isVi ? '🏢 KHO TỔNG (Trụ sở trung tâm)' : '🏢 CENTRAL WAREHOUSE (HQ)')
    : (branches.find(b => b.id === selectedBranchId)?.name || selectedBranchId);

  // Get current stocks for selected warehouse
  const currentStocks = allBranchStocks[selectedBranchId] || {};

  // Form selections and computed helpers
  const selectedItem = flavors.find(f => f.id === selectedItemId) ||
                       toppings.find(t => t.id === selectedItemId) ||
                       accompaniments.find(a => a.id === selectedItemId);

  let selectedItemType: 'flavor' | 'topping' | 'accompaniment' = 'flavor';
  let selectedItemUnit = isVi ? 'đơn vị' : 'units';
  let currentStockVal = 0;

  if (selectedItem) {
    if (flavors.some(f => f.id === selectedItem.id)) {
      selectedItemType = 'flavor';
      selectedItemUnit = isVi ? 'Gram (g)' : 'Grams (g)';
      currentStockVal = currentStocks[selectedItem.id] ?? 10000;
    } else if (toppings.some(t => t.id === selectedItem.id)) {
      selectedItemType = 'topping';
      selectedItemUnit = isVi ? 'Cái / Chiếc' : 'Pieces / Pcs';
      currentStockVal = currentStocks[selectedItem.id] ?? 50;
    } else {
      selectedItemType = 'accompaniment';
      selectedItemUnit = isVi ? 'Cái / Chiếc' : 'Pieces / Pcs';
      currentStockVal = currentStocks[selectedItem.id] ?? 30;
    }
  }

  // --- Actions triggers ---

  // 1. Direct Calibration (Cân chỉnh kho thực tế)
  const handleApplyCalibration = () => {
    if (!selectedItemId || directCalibrateValue === '' || directCalibrateValue < 0) {
      alert(isVi ? 'Vui lòng chọn nguyên liệu và định lượng cân chỉnh đúng thực tế!' : 'Please select an item and provide a valid actual physical count!');
      return;
    }

    const itemName = isVi ? (selectedItem?.nameVi || '') : (selectedItem?.nameEn || '');
    const oldQty = currentStockVal;
    const newQty = Number(directCalibrateValue);
    const diff = newQty - oldQty;

    const reasonTextVi = notes.trim()
      ? `Cân chỉnh kho thực tế: ${notes.trim()}`
      : `Định kỳ đối soát tồn kho thực tế tại quầy`;
    const reasonTextEn = notes.trim()
      ? `Direct physical count calibration: ${notes.trim()}`
      : `Routine physical counter-balance reconciliation`;

    onInventoryAction(
      selectedBranchId,
      selectedItemId,
      selectedItemType,
      itemName,
      'calibrate',
      newQty,
      reasonTextVi,
      reasonTextEn
    );

    // Reset states
    setDirectCalibrateValue('');
    setNotes('');
    alert(isVi 
      ? `Cân chỉnh thực tế thành công!\nTừ: ${oldQty.toLocaleString()} -> ${newQty.toLocaleString()} (${diff >= 0 ? `+${diff}` : diff} ${selectedItemUnit})` 
      : `Calibrated successfully!\nFrom: ${oldQty.toLocaleString()} -> ${newQty.toLocaleString()} (${diff >= 0 ? `+${diff}` : diff} ${selectedItemUnit})`
    );
  };

  // 2. Manual Delta Adjustments (+ or -)
  const handleApplyDeltaAmount = (isReplenish: boolean) => {
    if (!selectedItemId || adjustAmount === '' || adjustAmount <= 0) {
      alert(isVi ? 'Vui lòng chọn nguyên liệu và lượng di chuyển hợp lệ!' : 'Please select an item and provide a valid amount!');
      return;
    }

    const itemName = isVi ? (selectedItem?.nameVi || '') : (selectedItem?.nameEn || '');
    const amountVal = Number(adjustAmount);
    const netAmount = isReplenish ? amountVal : -amountVal;

    const priceVal = isReplenish && importPriceInput !== '' ? Number(importPriceInput) : undefined;

    const reasonTextVi = isReplenish 
      ? `Nhập thêm kho thủ công: ${notes.trim() || 'Thủ kho nhập bồi hoàn'}${priceVal ? ` (Giá nhập: ${priceVal.toLocaleString('vi-VN')}đ)` : ''}`
      : `Xuất hao hụt / Hủy sản phẩm lỗi: ${notes.trim() || 'Hao hụt hao mòn hao phí'}`;

    const reasonTextEn = isReplenish 
      ? `Manual replenishment: ${notes.trim() || 'Warehouse refill'}${priceVal ? ` (Import price: ${priceVal.toLocaleString('vi-VN')}đ)` : ''}`
      : `Scrapped / Leakage loss write-offs: ${notes.trim() || 'Operational write-off'}`;

    onInventoryAction(
      selectedBranchId,
      selectedItemId,
      selectedItemType,
      itemName,
      'delta',
      netAmount,
      reasonTextVi,
      reasonTextEn,
      priceVal
    );

    setAdjustAmount('');
    setImportPriceInput('');
    setNotes('');
    alert(isVi ? "Đã cập nhật kho hàng thành công!" : "Inventory level updated successfully!");
  };

  // 3. Central Transfer (Cấp phát hàng giữa Kho tổng & Chi nhánh)
  const handleApplyTransfer = () => {
    if (!selectedItemId || transferAmount === '' || transferAmount <= 0) {
      alert(isVi ? 'Vui lòng chọn nguyên liệu và nhập số lượng cần chuyển!' : 'Please select an item and provide a valid transfer amount!');
      return;
    }

    const value = Number(transferAmount);
    const itemName = isVi ? (selectedItem?.nameVi || '') : (selectedItem?.nameEn || '');

    if (selectedBranchId === 'central') {
      // We are at central and dispatching to branch
      if (!transferTargetBranchId) {
        alert(isVi ? 'Vui lòng chọn chi nhánh đích để cấp phát hàng!' : 'Please select the target branch outlet to supply!');
        return;
      }

      const centralStock = allBranchStocks['central']?.[selectedItemId] ?? 0;
      if (centralStock < value) {
        alert(isVi 
          ? `Kho Tổng không đủ hàng tồn kho. (Còn lại: ${centralStock.toLocaleString()} ${selectedItemUnit})` 
          : `Central Warehouse does not have enough stock. (Available: ${centralStock.toLocaleString()} ${selectedItemUnit})`
        );
        return;
      }

      const targetBranchName = branches.find(b => b.id === transferTargetBranchId)?.name || transferTargetBranchId;
      const reasonVi = notes.trim() 
        ? `Lệnh cấp hàng trung tâm: ${notes.trim()}`
        : `Xuất hàng trung tâm hoàn cấp chi nhánh`;
      const reasonEn = notes.trim()
        ? `Central supply order: ${notes.trim()}`
        : `HQ replenishment shipment output`;

      onInventoryAction(
        transferTargetBranchId,
        selectedItemId,
        selectedItemType,
        itemName,
        'transfer',
        value,
        reasonVi,
        reasonEn
      );

      setTransferAmount('');
      setNotes('');
      alert(isVi 
        ? `Cấp hàng thành công!\nSố lượng: ${value.toLocaleString()} ${selectedItemUnit} đã được chuyển từ Kho Tổng đến ${targetBranchName}.` 
        : `Transferred successfully!\nAmount: ${value.toLocaleString()} ${selectedItemUnit} shipped from Central to ${targetBranchName}.`
      );

    } else {
      // We are at a branch and pulling from central
      const centralStock = allBranchStocks['central']?.[selectedItemId] ?? 0;
      if (centralStock < value) {
        alert(isVi 
          ? `Kho Tổng không đủ hàng để cấp phát. (Tồn Kho Tổng hiện tại: ${centralStock.toLocaleString()} ${selectedItemUnit})`
          : `Central Warehouse has insufficient stock. (HQ Available: ${centralStock.toLocaleString()} ${selectedItemUnit})`
        );
        return;
      }

      const reasonVi = notes.trim() 
        ? `Nhận bồi hoàn từ Kho Tổng: ${notes.trim()}`
        : `Yêu cầu cấp bồi hoàn Gelato từ Kho Tổng`;
      const reasonEn = notes.trim()
        ? `Replenished from HQ Central: ${notes.trim()}`
        : `Branch refill demand from Central Stock`;

      onInventoryAction(
        selectedBranchId,
        selectedItemId,
        selectedItemType,
        itemName,
        'transfer',
        value,
        reasonVi,
        reasonEn
      );

      setTransferAmount('');
      setNotes('');
      alert(isVi 
        ? `Yêu cầu bồi hoàn kho thành công!\nNhận +${value.toLocaleString()} ${selectedItemUnit} từ Kho Tổng.` 
        : `Replenished stock successfully!\nPulled +${value.toLocaleString()} ${selectedItemUnit} from Central Warehouse.`
      );
    }
  };

  // Filter logs for the selected warehouse
  const filteredLogs = allInventoryLogs.filter(l => l.branchId === selectedBranchId);

  return (
    <div className="space-y-6 font-sans text-stone-800">
      
      {/* HEADER SECTION */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b pb-4 border-stone-200">
        <div>
          <h3 className="text-xl font-black text-[#4A3E3E] flex items-center gap-1.5">
            <span>📦 {isVi ? 'Quản Lý Kho Nguyên Liệu Chuỗi' : 'Chain Inventory & Raw Materials'}</span>
          </h3>
          <p className="text-xs text-stone-500">
            {isVi 
              ? 'Hệ thống đối soát song hành: Kho Tổng & Kho riêng chi nhánh. Cho phép cân chỉnh thực tế & chuyển giao nguyên vật liệu.'
              : 'Enterprise multi-warehouse control: Central warehouse & outlet branches. Calibrate physical stock levels & distribute materials.'}
          </p>
        </div>
        
        {/* Active operator indicator */}
        {activeUser && (
          <div className="bg-[#4A3E3E]/5 px-3 py-1.5 rounded-2xl border border-[#4A3E3E]/10 text-right shrink-0">
            <span className="block text-[8.5px] font-extrabold uppercase tracking-wider text-stone-500 leading-none">
              {isVi ? 'NHÂN VIÊN THỰC HIỆN J-LOG:' : 'LOGGING AS OPERATOR:'}
            </span>
            <span className="text-xs font-black text-[#4A3E3E]">{activeUser.name} ({isVi ? 'MSSV/Vụ' : 'Staff'})</span>
          </div>
        )}
      </div>

      {/* WAREHOUSE SELECTOR GRID */}
      <div className="bg-[#FAF6EE] p-4 rounded-3xl border border-amber-900/10 shadow-3xs">
        <span className="block text-[9px] uppercase tracking-wider font-black text-stone-600 mb-2">
          {isVi ? '🔍 CHỌN KHO HÀNG CẦN QUẢN LÝ & TRA CỨU TỒN:' : '🔍 SELECT TARGET WAREHOUSE TO MANAGE & AUDIT:'}
        </span>
        
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-2.5">
          {/* Central Warehouse card button */}
          <button
            type="button"
            onClick={() => {
              setSelectedBranchId('central');
              setSelectedItemId('');
            }}
            className={`p-3 rounded-2xl border text-left transition select-none flex flex-col justify-between cursor-pointer ${
              selectedBranchId === 'central'
                ? 'bg-amber-950 border-amber-950 text-white shadow-md'
                : 'bg-white hover:bg-stone-50 border-stone-200 text-stone-850'
            }`}
          >
            <div className="flex items-center gap-1.5">
              <span className="text-base">🏢</span>
              <span className="font-extrabold text-[12px]">{isVi ? 'Kho Tổng Trung Tâm' : 'HQ Central Stock'}</span>
            </div>
            <span className={`text-[10px] mt-1 ${selectedBranchId === 'central' ? 'text-amber-200' : 'text-stone-500'}`}>
              {isVi ? '• Điều hành chuỗi Gấu' : '• Global warehouse'}
            </span>
          </button>

          {/* Individual Branch Buttons */}
          {branches.map(b => (
            <button
              key={b.id}
              type="button"
              onClick={() => {
                setSelectedBranchId(b.id);
                setSelectedItemId('');
              }}
              className={`p-3 rounded-2xl border text-left transition select-none flex flex-col justify-between cursor-pointer ${
                selectedBranchId === b.id
                  ? 'bg-[#4A3E3E] border-[#4A3E3E] text-white shadow-md'
                  : 'bg-white hover:bg-stone-50 border-stone-200 text-stone-850'
              }`}
            >
              <div className="flex items-center gap-1.5">
                <span className="text-base">📍</span>
                <span className="font-extrabold text-[12px] truncate">{b.name.replace('Gấu Gelato - ', '')}</span>
              </div>
              <span className={`text-[10px] mt-1 ${selectedBranchId === b.id ? 'text-[#EFE7DC]' : 'text-stone-500'}`}>
                {b.id === activeBranch.id ? (isVi ? '• Quầy bạn đang trực' : '• Your current station') : (isVi ? '• Xem tồn chi nhánh' : '• Branch depot')}
              </span>
            </button>
          ))}
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        {/* LEFT COLUMN: ACTIVE INVENTORY DATA LIST */}
        <div className="lg:col-span-2 space-y-4">
          <div className="bg-white p-4 sm:p-5 rounded-3xl border border-amber-900/5 shadow-3xs">
            
            <div className="flex items-center justify-between border-b pb-2 mb-3">
              <div>
                <h4 className="text-xs font-black uppercase tracking-wider text-[#4A3E3E]">
                  📦 {isVi ? `Bảng kê hàng hóa: ${selectedBranchName}` : `Depot items: ${selectedBranchName}`}
                </h4>
                <p className="text-[10.5px] text-stone-500">
                  {isVi ? 'Danh mục kem ký, topping, bánh ăn kèm có trong kho.' : 'List of flavors, toppings, accompaniments stored.'}
                </p>
              </div>
              
              <span className="text-[10.5px] font-bold font-mono bg-stone-100 text-stone-600 px-2.5 py-0.7 rounded-xl">
                {isVi ? 'Tồn kho thực tế' : 'Actual available sync'}
              </span>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-xs text-left">
                <thead>
                  <tr className="border-b text-gray-500 font-bold text-[10.5px]">
                    <th className="py-2">{isVi ? 'Tên Nguyên Liệu' : 'Ingredient Description'}</th>
                    <th className="py-2">{isVi ? 'Loại' : 'Type'}</th>
                    <th className="py-2 text-right">{isVi ? 'Tồn hiện tại' : 'Qty Avaliable'}</th>
                    <th className="py-2 text-right">{isVi ? 'Đơn vị' : 'Unit'}</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-stone-100 text-[11.5px]">
                  
                  {/* FLAVORS */}
                  {flavors.map(f => {
                    const stock = currentStocks[f.id] ?? 0;
                    // Low stock logic: Gelatos < 2000g
                    const isLow = stock < 2000;
                    return (
                      <tr 
                        key={f.id} 
                        onClick={() => setSelectedItemId(f.id)}
                        className={`hover:bg-[#FAF6EE]/30 cursor-pointer transition ${selectedItemId === f.id ? 'bg-[#FAF6EE]/60 font-semibold' : ''}`}
                      >
                        <td className="py-2.5 font-medium flex items-center gap-2">
                          <span className="w-2.5 h-2.5 rounded-full inline-block shrink-0" style={{ backgroundColor: f.color }} />
                          <span className="truncate">{isVi ? f.nameVi : f.nameEn}</span>
                          {isLow && (
                            <span className="text-[8px] font-black bg-red-100 text-red-650 px-1 py-0.5 rounded leading-none uppercase shrink-0">
                              {isVi ? 'Hết/Yếu' : 'Low'}
                            </span>
                          )}
                        </td>
                        <td className="py-2.5 text-stone-500">{isVi ? 'Kem ký Gelato' : 'Scoop Flavor'}</td>
                        <td className={`py-2.5 text-right font-mono font-black ${isLow ? 'text-red-500' : 'text-stone-850'}`}>
                          {stock.toLocaleString()}
                        </td>
                        <td className="py-2.5 text-right text-gray-400 font-mono">{t.grams}</td>
                      </tr>
                    );
                  })}

                  {/* TOPPINGS */}
                  {toppings.map(tp => {
                    const stock = currentStocks[tp.id] ?? 0;
                    const isLow = stock < 20;
                    return (
                      <tr 
                        key={tp.id}
                        onClick={() => setSelectedItemId(tp.id)}
                        className={`hover:bg-[#FAF6EE]/30 cursor-pointer transition ${selectedItemId === tp.id ? 'bg-[#FAF6EE]/60 font-semibold' : ''}`}
                      >
                        <td className="py-2.5 font-medium pl-4.5 flex items-center gap-1.5 ">
                          <span className="text-gray-400">🍬</span>
                          <span className="truncate">{isVi ? tp.nameVi : tp.nameEn}</span>
                          {isLow && (
                            <span className="text-[8px] font-black bg-red-100 text-red-650 px-1 py-0.5 rounded leading-none uppercase shrink-0">
                              {isVi ? 'Yếu' : 'Low'}
                            </span>
                          )}
                        </td>
                        <td className="py-2.5 text-stone-500">{isVi ? 'Topping rắc' : 'Topping'}</td>
                        <td className={`py-2.5 text-right font-mono font-black ${isLow ? 'text-red-500' : 'text-stone-850'}`}>
                          {stock.toLocaleString()}
                        </td>
                        <td className="py-2.5 text-right text-gray-400 font-mono">{t.pieces}</td>
                      </tr>
                    );
                  })}

                  {/* ACCOMPANIMENTS */}
                  {accompaniments.map(ac => {
                    const stock = currentStocks[ac.id] ?? 0;
                    const isLow = stock < 15;
                    return (
                      <tr 
                        key={ac.id}
                        onClick={() => setSelectedItemId(ac.id)}
                        className={`hover:bg-[#FAF6EE]/30 cursor-pointer transition ${selectedItemId === ac.id ? 'bg-[#FAF6EE]/60 font-semibold' : ''}`}
                      >
                        <td className="py-2.5 font-medium pl-4.5 flex items-center gap-1.5">
                          <span className="text-gray-400">🧇</span>
                          <span className="truncate">{isVi ? ac.nameVi : ac.nameEn}</span>
                          {isLow && (
                            <span className="text-[8px] font-black bg-red-100 text-red-650 px-1 py-0.5 rounded leading-none uppercase shrink-0">
                              {isVi ? 'Yếu' : 'Low'}
                            </span>
                          )}
                        </td>
                        <td className="py-2.5 text-stone-500">{isVi ? 'Bánh ốc quế / kèm' : 'Accompaniment'}</td>
                        <td className={`py-2.5 text-right font-mono font-black ${isLow ? 'text-red-500' : 'text-stone-850'}`}>
                          {stock.toLocaleString()}
                        </td>
                        <td className="py-2.5 text-right text-gray-400 font-mono">{t.pieces}</td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>

            <div className="mt-3 bg-amber-50/50 p-2.5 rounded-2xl border border-amber-900/5 text-[10.5px] text-amber-900 leading-snug">
              💡 {isVi 
                ? 'Mẹo: Click vào bất kỳ dòng vật liệu nào trên danh sách sản phẩm để nạp nhanh thông tin sang bảng điều khiển bên phải.' 
                : 'Tip: Tap any row in the list to automatically populate the controllers on the right panel.'}
            </div>

          </div>
        </div>

        {/* RIGHT COLUMN: INTEGRATED INTERACTIVE OPERATION PANEL */}
        <div className="space-y-4">
          <div className="bg-white rounded-3xl border border-amber-900/5 shadow-sm overflow-hidden text-xs">
            
            {/* Action Mode Swift Switcher */}
            <div className="grid grid-cols-3 border-b border-stone-100 text-[10px] font-black text-center bg-stone-50 select-none">
              <button
                type="button"
                onClick={() => {
                  setActiveOpsTab('calibrate');
                  setNotes('');
                }}
                className={`py-3 transition cursor-pointer ${
                  activeOpsTab === 'calibrate'
                    ? 'bg-white text-amber-950 font-black border-r border-[#FAF6EE] relative after:absolute after:bottom-0 after:left-0 after:right-0 after:h-0.7 after:bg-amber-950'
                    : 'text-stone-500 hover:text-stone-850 hover:bg-stone-100/50'
                }`}
              >
                🎯 {isVi ? 'CÂN CHỈNH' : 'CALIBRATE'}
              </button>
              <button
                type="button"
                onClick={() => {
                  setActiveOpsTab('delta');
                  setNotes('');
                }}
                className={`py-3 transition cursor-pointer border-l border-r border-stone-100 ${
                  activeOpsTab === 'delta'
                    ? 'bg-white text-amber-950 font-black relative after:absolute after:bottom-0 after:left-0 after:right-0 after:h-0.7 after:bg-amber-950'
                    : 'text-stone-500 hover:text-stone-850 hover:bg-stone-100/50'
                }`}
              >
                🔄 {isVi ? 'NHẬP/XUẤT' : 'IN / OUT'}
              </button>
              <button
                type="button"
                onClick={() => {
                  setActiveOpsTab('transfer');
                  setNotes('');
                }}
                className={`py-3 transition cursor-pointer ${
                  activeOpsTab === 'transfer'
                    ? 'bg-white text-amber-950 font-black border-l border-[#FAF6EE] relative after:absolute after:bottom-0 after:left-0 after:right-0 after:h-0.7 after:bg-amber-950'
                    : 'text-stone-500 hover:text-stone-850 hover:bg-stone-100/50'
                }`}
              >
                🚚 {isVi ? 'CHUYỂN KHO' : 'TRANSFER'}
              </button>
            </div>

            <div className="p-4 space-y-4">
              
              {/* SECTION: COMMON SELECTED ITEM INFO SUMMARY */}
              <div className="bg-[#FAF6EE]/50 p-3 rounded-2xl border border-amber-900/5 space-y-1">
                <span className="block text-[8.5px] tracking-wider text-amber-900 uppercase font-black">
                  {isVi ? '🎯 NGUYÊN LIỆU ĐANG CHỌN ĐIỀU CHỈNH:' : '🎯 SELECTED INGREDIENT TO OPERATE:'}
                </span>
                
                {selectedItem ? (
                  <div className="flex justify-between items-center mt-1">
                    <div>
                      <span className="text-sm font-black text-[#4A3E3E]">
                        {isVi ? selectedItem.nameVi : selectedItem.nameEn}
                      </span>
                      <span className="block text-[10px] text-stone-500 capitalize">
                        {isVi ? 'Tồn hiện tại kho này:' : 'Current balance in this depot:'}{' '}
                        <strong className="text-amber-950 font-mono font-black">{currentStockVal.toLocaleString()}</strong> ({selectedItemUnit})
                      </span>
                    </div>
                    
                    {/* Tiny Unit Icon */}
                    <span className="text-xl px-1">
                      {selectedItemType === 'flavor' ? '🍦' : selectedItemType === 'topping' ? '🍬' : '🧇'}
                    </span>
                  </div>
                ) : (
                  <p className="text-[11px] text-stone-400 italic py-1">
                    {isVi ? '⚠️ Hãy click chọn 1 loại nguyên liệu ở bảng danh sách bên trái.' : '⚠️ Please select an item from the left table view first.'}
                  </p>
                )}
              </div>

              {/* DYNAMIC OPERATION FORM BLOCK */}
              {selectedItem && (
                <div className="space-y-3">
                  
                  {/* FORM 1: DIRECT CALIBRATION MODE */}
                  {activeOpsTab === 'calibrate' && (
                    <div className="space-y-3">
                      <div className="bg-amber-50 text-amber-950 p-2.5 rounded-2xl text-[10.5px] leading-snug border border-amber-900/5 font-semibold">
                        ⚙️ {isVi 
                          ? 'Dùng khi kiểm kho thực tế có sai lệch. Nhập thẳng số lượng đếm được thực tế, hệ thống tự động bồi hoàn số dư chênh lệch.'
                          : 'Use to correct discrepancy. Input the actual physical count, systemic balances will synchronize automatically.'}
                      </div>

                      <div>
                        <label className="block text-[10px] uppercase font-bold text-stone-500 mb-1">
                          {isVi ? 'Lượng thực tế đếm được / cân được:' : 'Actual counted / weighed amount:'}
                        </label>
                        <div className="relative">
                          <input
                            type="number"
                            min="0"
                            value={directCalibrateValue}
                            onChange={e => {
                              const val = e.target.value;
                              setDirectCalibrateValue(val === '' ? '' : Math.max(0, parseInt(val) || 0));
                            }}
                            placeholder={isVi ? `Ví dụ: nhập số tồn chính xác đếm được...` : `e.g. correct quantity...`}
                            className="w-full text-xs border rounded-xl p-2.5 pr-20 bg-stone-50 focus:outline-none focus:ring-1 focus:ring-amber-500 font-extrabold font-mono"
                          />
                          <span className="absolute right-3 top-2.5 text-[10px] font-black text-stone-400">
                            {selectedItemUnit.split(' ')[0]}
                          </span>
                        </div>

                        {directCalibrateValue !== '' && (
                          <div className="text-[10px] text-stone-500 font-mono mt-1 pr-1 flex justify-between">
                            <span>{isVi ? 'Chênh lệch tính toán:' : 'Computed difference:'}</span>
                            <span className={directCalibrateValue - currentStockVal >= 0 ? 'text-green-600 font-bold' : 'text-red-500 font-bold'}>
                              {directCalibrateValue - currentStockVal >= 0 
                                ? `+${(directCalibrateValue - currentStockVal).toLocaleString()}` 
                                : (directCalibrateValue - currentStockVal).toLocaleString()}{' '}
                              {selectedItemUnit.split(' ')[0]}
                            </span>
                          </div>
                        )}
                      </div>
                    </div>
                  )}

                  {/* FORM 2: DELTA ADJUSTMENTS MODE */}
                  {activeOpsTab === 'delta' && (
                    <div className="space-y-3">
                      <div>
                        <label className="block text-[10px] uppercase font-bold text-stone-500 mb-1">
                          {isVi ? 'Khối lượng / Số lượng tăng giảm (+/-):' : 'Replenish / Scrap quantity (+/-):'}
                        </label>
                        <div className="relative">
                          <input
                            type="number"
                            min="1"
                            value={adjustAmount}
                            onChange={e => {
                              const val = e.target.value;
                              setAdjustAmount(val === '' ? '' : Math.max(1, parseInt(val) || 0));
                            }}
                            placeholder={isVi ? 'Số lượng thay đổi (g hoặc chiếc)...' : 'Value delta quantity...'}
                            className="w-full text-xs border rounded-xl p-2.5 pr-18 bg-stone-50 focus:outline-none focus:ring-1 focus:ring-amber-500 font-extrabold font-mono"
                          />
                          <span className="absolute right-3 top-2.5 text-[10px] font-black text-stone-400">
                            {selectedItemUnit.split(' ')[0]}
                          </span>
                        </div>
                      </div>

                      {/* Import Price input */}
                      <div>
                        <label className="block text-[10px] uppercase font-bold text-stone-500 mb-1">
                          {selectedItemType === 'flavor' 
                            ? (isVi ? 'Đơn giá nhập kho (đ / kg):' : 'Import price (đ / kg):')
                            : (isVi ? 'Đơn giá nhập kho (đ / chiếc):' : 'Import price (đ / item):')}
                        </label>
                        <div className="relative">
                          <input
                            type="number"
                            min="0"
                            value={importPriceInput}
                            onChange={e => {
                              const val = e.target.value;
                              setImportPriceInput(val === '' ? '' : Math.max(0, parseInt(val) || 0));
                            }}
                            placeholder={isVi ? 'Ví dụ: 120000' : 'e.g. 12000s'}
                            className="w-full text-xs border rounded-xl p-2.5 pr-12 bg-stone-50 focus:outline-none focus:ring-1 focus:ring-amber-500 font-bold font-mono"
                          />
                          <span className="absolute right-3 top-2.5 text-[10px] font-black text-stone-400">
                            đ / {selectedItemType === 'flavor' ? 'kg' : (isVi ? 'chiếc' : 'pcs')}
                          </span>
                        </div>
                        <p className="text-[10px] text-amber-900/60 leading-none mt-1">
                          💡 {isVi ? 'Chỉ áp dụng khi ấn nút [Nhập thêm]' : 'Only applied when clicking the [Refill (+)] button'}
                        </p>
                      </div>
                    </div>
                  )}

                  {/* FORM 3: CENTRAL / BRANCH WAREHOUSE TRANSFERS MODE */}
                  {activeOpsTab === 'transfer' && (
                    <div className="space-y-3">
                      
                      {selectedBranchId === 'central' ? (
                        /* SENDER BLOCK: we are on Central and sending to chosen Branch */
                        <div className="space-y-3">
                          <div className="bg-blue-50 text-blue-900 border border-blue-200/50 p-2.5 rounded-2xl text-[10px] leading-snug font-medium">
                            🚚 {isVi 
                              ? `Bạn đang ở Kho Tổng. Lệnh này sẽ XUẤT nguyên liệu từ Kho Tổng để CẤP PHÁT (chuyển đi) tới chi nhánh được lựa chọn.` 
                              : `HQ dispatch: This action deducts items from Central Warehouse and dispatches/ships them to the chosen branch outlet.`}
                          </div>

                          <div>
                            <label className="block text-[10px] uppercase font-bold text-stone-500 mb-1">
                              {isVi ? 'Chọn chi nhánh nhận hàng:' : 'Select Destination Branch:'}
                            </label>
                            <select
                              value={transferTargetBranchId}
                              onChange={e => setTransferTargetBranchId(e.target.value)}
                              className="w-full text-xs border rounded-xl p-2 bg-stone-50 focus:outline-none focus:ring-1 focus:ring-amber-500"
                            >
                              <option value="">{isVi ? '-- Chọn chi nhánh nhận hàng --' : '-- Choose target branch --'}</option>
                              {branches.map(b => (
                                <option key={b.id} value={b.id}>{b.name}</option>
                              ))}
                            </select>
                          </div>
                        </div>
                      ) : (
                        /* RECEIVER BLOCK: we are on Branch and pulling replenish from HQ Central */
                        <div className="space-y-2">
                          <div className="bg-amber-50/70 text-amber-900 border border-amber-200 p-2.5 rounded-2xl text-[10px] leading-snug">
                            🚚 {isVi 
                              ? `Yêu cầu cấp tiếp tế: Lấy và trừ hàng từ Kho Tổng (còn tồn: ${(allBranchStocks['central']?.[selectedItemId] ?? 0).toLocaleString()} ${selectedItemUnit.split(' ')[0]}) bối hoàn trực tiếp vào chi nhánh ${selectedBranchName}.` 
                              : `B replenishment: Grab stock directly from Central Warehouse (HQ balance: ${(allBranchStocks['central']?.[selectedItemId] ?? 0).toLocaleString()} ${selectedItemUnit.split(' ')[0]}) and transfer into ${selectedBranchName}.`}
                          </div>
                        </div>
                      )}

                      <div>
                        <label className="block text-[10px] uppercase font-bold text-stone-500 mb-1">
                          {isVi ? 'Số lượng chuyển kho:' : 'Stock transfer quantity:'}
                        </label>
                        <div className="relative">
                          <input
                            type="number"
                            min="1"
                            value={transferAmount}
                            onChange={e => {
                              const val = e.target.value;
                              setTransferAmount(val === '' ? '' : Math.max(1, parseInt(val) || 0));
                            }}
                            placeholder={isVi ? 'Nhập lượng chuyển kho bãi...' : 'Input quantity to transfer...'}
                            className="w-full text-xs border rounded-xl p-2.5 pr-18 bg-stone-50 font-extrabold font-mono focus:ring-1 focus:ring-amber-500"
                          />
                          <span className="absolute right-3 top-2.5 text-[10px] font-black text-stone-400">
                            {selectedItemUnit.split(' ')[0]}
                          </span>
                        </div>
                      </div>

                    </div>
                  )}

                  {/* COMMON NOTES EXPLANATION INPUT */}
                  <div>
                    <label className="block text-[10px] uppercase font-bold text-stone-500 mb-1">
                      {isVi ? 'Lý do & Ghi chú kiểm toán:' : 'Audit justification / dispatch notes:'}
                    </label>
                    <input
                      type="text"
                      value={notes}
                      onChange={e => setNotes(e.target.value)}
                      placeholder={isVi ? 'Nhập buổi sáng, bù hao hụt cân dính, kiểm kê tháng...' : 'Periodic counter revision...'}
                      className="w-full text-xs border rounded-xl p-2.5 bg-stone-50 focus:outline-none focus:ring-1 focus:ring-amber-500"
                    />
                  </div>

                  {/* SUBMIT BUTTON ACTIONS BY MODES */}
                  <div className="pt-2">
                    
                    {/* BUTTONS FOR DIRECT CALIBRATION */}
                    {activeOpsTab === 'calibrate' && (
                      <button
                        type="button"
                        onClick={handleApplyCalibration}
                        disabled={directCalibrateValue === '' || directCalibrateValue < 0}
                        className="w-full bg-amber-950 hover:bg-neutral-900 text-white font-extrabold py-3 px-4 rounded-xl shadow-md transition disabled:opacity-40 cursor-pointer flex items-center justify-center gap-1.5"
                      >
                        🎯 {isVi ? 'XÁC NHẬN CÂN CHỈNH THỰC TẾ' : 'SET PHYSICAL COUNT IN DEPOT'}
                      </button>
                    )}

                    {/* BUTTONS FOR DELTA ADJUSTMENTS */}
                    {activeOpsTab === 'delta' && (
                      <div className="grid grid-cols-2 gap-2">
                        <button
                          type="button"
                          onClick={() => handleApplyDeltaAmount(true)}
                          disabled={!adjustAmount || Number(adjustAmount) <= 0}
                          className="bg-green-650 hover:bg-green-700 text-white font-extrabold py-3 px-2 rounded-xl shadow cursor-pointer transition disabled:opacity-40 text-[11px] flex items-center justify-center gap-1"
                        >
                          📥 {isVi ? 'Nhập thêm' : 'Refill (+)'}
                        </button>
                        <button
                          type="button"
                          onClick={() => handleApplyDeltaAmount(false)}
                          disabled={!adjustAmount || Number(adjustAmount) <= 0}
                          className="bg-red-600 hover:bg-red-700 text-white font-extrabold py-3 px-2 rounded-xl shadow cursor-pointer transition disabled:opacity-40 text-[11px] flex items-center justify-center gap-1"
                        >
                          📤 {isVi ? 'Xuất hủy' : 'Scrap (-)'}
                        </button>
                      </div>
                    )}

                    {/* BUTTONS FOR TRANSFERS */}
                    {activeOpsTab === 'transfer' && (
                      <button
                        type="button"
                        onClick={handleApplyTransfer}
                        disabled={transferAmount === '' || Number(transferAmount) <= 0}
                        className="w-full bg-[#4A3E3E] hover:bg-stone-900 text-white font-extrabold py-3 px-4 rounded-xl shadow-md transition disabled:opacity-40 cursor-pointer flex items-center justify-center gap-1.5"
                      >
                        🚚 {selectedBranchId === 'central' 
                          ? (isVi ? 'CẤP PHÁT ĐI CHI NHÁNH' : 'DISPATCH OUT TO BRANCH')
                          : (isVi ? 'TIẾP TẾ TỪ KHO TỔNG' : 'PULL FROM HQ CENTRAL')}
                      </button>
                    )}

                  </div>

                </div>
              )}

            </div>
          </div>
        </div>

      </div>

      {/* BOTTOM: SYSTEMATIC INVENTORY TRANSACTION LOGS (CHRONOLOGICAL) */}
      <div className="bg-white p-4 sm:p-5 rounded-3xl border border-amber-900/5 shadow-3xs space-y-3">
        <div className="flex flex-col sm:flex-row justify-between sm:items-center border-b pb-2 gap-2">
          <div>
            <h4 className="text-xs font-black uppercase tracking-wider text-[#4A3E3E]">
              📋 {isVi ? `Nhật ký điều phối kiểm kho: ${selectedBranchName}` : `Movement audit logs: ${selectedBranchName}`}
            </h4>
            <p className="text-[10.5px] text-stone-500">
              {isVi ? 'Danh sách ghi chép tự động toàn bộ giao dịch di biến động kho để kế toán đối soát.' : 'Auditable record of all automatic and manual operations in this warehouse.'}
            </p>
          </div>
          
          <span className="text-[10px] font-bold font-mono bg-amber-50 text-amber-950 border border-amber-900/10 px-2 py-0.5 rounded-lg select-none shrink-0 self-start sm:self-auto">
            {isVi ? `Tổng số: ${filteredLogs.length} sự kiện` : `Total: ${filteredLogs.length} events`}
          </span>
        </div>

        <div className="space-y-1.5 max-h-56 overflow-y-auto pr-1">
          {filteredLogs.length === 0 ? (
            <p className="text-stone-400 italic text-xs py-5 text-center">
              {isVi ? 'Chưa có nhật ký hoạt động kho bãi nào lưu trữ cho địa điểm này.' : 'No inventory movement logs saved for this depot.'}
            </p>
          ) : (
            filteredLogs.slice().reverse().map((log) => {
              const changeAmountStyle = log.changeAmount > 0 
                ? 'bg-green-50 text-green-700 border-green-200' 
                : log.changeAmount < 0 
                  ? 'bg-red-50 text-red-700 border-red-200' 
                  : 'bg-stone-50 text-stone-600 border-stone-200';
              
              const isFlavor = flavors.some(f => f.id === log.itemId);
              const unitLabel = isFlavor ? (isVi ? 'g' : 'g') : (isVi ? 'cái' : 'pcs');

              return (
                <div key={log.id} className="text-[11.5px] leading-snug flex items-center justify-between p-2 rounded-xl border border-stone-50 bg-[#FAFBFD]/50 hover:bg-stone-50 transition font-mono">
                  <div className="flex items-start gap-2.5 min-w-0">
                    {/* Timestamp & Operator */}
                    <div className="shrink-0 flex flex-col">
                      <span className="text-stone-400 text-[10px]">
                        {log.timestamp.includes(' ') ? log.timestamp.split(' ')[1] : log.timestamp}
                      </span>
                      <span className="font-extrabold text-[#4A3E3E] text-[10px] leading-none mt-0.5">
                        👤 {log.staffName.split(' ')[log.staffName.split(' ').length - 1] || log.staffName}
                      </span>
                    </div>
                    
                    {/* Reason translation */}
                    <span className="text-stone-700 font-medium truncate shrink-1">
                      {isVi ? log.reasonVi : log.reasonEn}
                    </span>
                  </div>

                  {/* Quantity adjustment flag */}
                  <span className={`px-2 py-1 rounded-lg border font-black text-right shrink-0 text-[11px] ${changeAmountStyle}`}>
                    {log.changeAmount > 0 ? `+${log.changeAmount.toLocaleString()}` : log.changeAmount.toLocaleString()} {unitLabel}
                  </span>
                </div>
              );
            })
          )}
        </div>
      </div>
      
    </div>
  );
};
