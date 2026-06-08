/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import { Branch, Staff, Voucher, Language, Order } from '../types';
import { LOCALES } from '../locales';

interface AdminManagerProps {
  lang: Language;
  branches: Branch[];
  staff: Staff[];
  vouchers: Voucher[];
  orders: Order[];
  onAddBranch: (branch: Omit<Branch, 'id'>) => void;
  onDeleteBranch: (id: string) => void;
  onUpdateBranch: (branch: Branch) => void;
  onAddStaff: (employee: Omit<Staff, 'id'>) => void;
  onDeleteStaff: (id: string) => void;
  onUpdateStaff: (employee: Staff) => void;
  onAddVoucher: (voucher: Voucher) => void;
  onUpdateVoucher: (voucher: Voucher) => void;
  onDeleteVoucher: (code: string) => void;
}

export const AdminManager: React.FC<AdminManagerProps> = ({
  lang,
  branches,
  staff,
  vouchers,
  orders = [],
  onAddBranch,
  onDeleteBranch,
  onUpdateBranch,
  onAddStaff,
  onDeleteStaff,
  onUpdateStaff,
  onAddVoucher,
  onUpdateVoucher,
  onDeleteVoucher
}) => {
  const isVi = lang === 'vi';
  const t = LOCALES[lang];

  const todayObj = new Date();
  const yyyy = todayObj.getFullYear();
  const mm = String(todayObj.getMonth() + 1).padStart(2, '0');
  const dd = String(todayObj.getDate()).padStart(2, '0');
  const todayStr = `${yyyy}-${mm}-${dd}`;

  // Subtabs within admin manager console
  const [activeSubTab, setActiveSubTab] = useState<'branches' | 'staff' | 'vouchers'>('branches');

  // Voucher custom sub-tabs & usage tracker
  const [voucherSubTab, setVoucherSubTab] = useState<'valid' | 'invalid'>('valid');
  const [selectedUsageVoucher, setSelectedUsageVoucher] = useState<Voucher | null>(null);

  // Edit states
  const [editingBranch, setEditingBranch] = useState<Branch | null>(null);
  const [editingStaff, setEditingStaff] = useState<Staff | null>(null);
  const [editingVoucher, setEditingVoucher] = useState<Voucher | null>(null);

  // Forms state for adding/editing Branch
  const [bName, setBName] = useState('');
  const [bCompany, setBCompany] = useState('');
  const [bMst, setBMst] = useState('');
  const [bAddress, setBAddress] = useState('');
  const [bEmail, setBEmail] = useState('');
  const [bBank, setBBank] = useState('Vietcombank');
  const [bAccount, setBAccount] = useState('');
  const [bHolder, setBHolder] = useState('');

  // Forms state for adding/editing staff
  const [sName, setSName] = useState('');
  const [sCccd, setSCccd] = useState('');
  const [sPhone, setSPhone] = useState('');
  const [sPin, setSPin] = useState('');
  const [sGender, setSGender] = useState<'male' | 'female' | 'other'>('female');
  const [sBranchId, setSBranchId] = useState(branches[0]?.id || 'CN_Q6');
  const [sNotes, setSNotes] = useState('');

  // Form state for adding/editing Voucher
  const [vCode, setVCode] = useState('');
  const [vCampVi, setVCampVi] = useState('');
  const [vCampEn, setVCampEn] = useState('');
  const [vType, setVType] = useState<'percent' | 'fixed'>('percent');
  const [vVal, setVVal] = useState<number>(0);
  const [vMin, setVMin] = useState<number>(0);
  const [vExpiry, setVExpiry] = useState('2026-12-31');
  const [vDisabled, setVDisabled] = useState<boolean>(false);
  const [vBranches, setVBranches] = useState<string[]>(['all']);

  // Helpers for starting/cancelling edits
  const startEditBranch = (branch: Branch) => {
    setEditingBranch(branch);
    setBName(branch.name);
    setBCompany(branch.companyName);
    setBMst(branch.mst);
    setBAddress(branch.address);
    setBEmail(branch.email);
    setBBank(branch.bankName);
    setBAccount(branch.bankAccount);
    setBHolder(branch.bankHolder);
  };

  const cancelEditBranch = () => {
    setEditingBranch(null);
    setBName('');
    setBCompany('');
    setBMst('');
    setBAddress('');
    setBEmail('');
    setBAccount('');
    setBHolder('');
  };

  const startEditStaff = (employee: Staff) => {
    setEditingStaff(employee);
    setSName(employee.name);
    setSCccd(employee.cccd);
    setSPhone(employee.phone);
    setSPin(employee.pin);
    setSGender(employee.gender);
    setSBranchId(employee.branchId);
    setSNotes(employee.notes);
  };

  const cancelEditStaff = () => {
    setEditingStaff(null);
    setSName('');
    setSCccd('');
    setSPhone('');
    setSPin('');
    setSGender('female');
    setSBranchId(branches[0]?.id || 'CN_Q6');
    setSNotes('');
  };

  const startEditVoucher = (voucher: Voucher) => {
    setEditingVoucher(voucher);
    setVCode(voucher.code);
    setVCampVi(voucher.campaignVi);
    setVCampEn(voucher.campaignEn);
    setVType(voucher.discountType);
    setVVal(voucher.value);
    setVMin(voucher.minOrder);
    setVExpiry(voucher.expiryDate);
    setVDisabled(voucher.disabled || false);
    setVBranches(voucher.applicableBranches || ['all']);
  };

  const cancelEditVoucher = () => {
    setEditingVoucher(null);
    setVCode('');
    setVCampVi('');
    setVCampEn('');
    setVVal(0);
    setVMin(0);
    setVDisabled(false);
    setVBranches(['all']);
  };

  const handleBranchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!bName || !bCompany || !bMst || !bAddress || !bEmail || !bAccount || !bHolder) {
      alert(isVi ? "Vui lòng nhập đầy đủ các trường thông tin chi nhánh!" : "Please fill in all branch metrics!");
      return;
    }

    if (editingBranch) {
      onUpdateBranch({
        ...editingBranch,
        name: bName,
        companyName: bCompany,
        mst: bMst,
        address: bAddress,
        email: bEmail,
        bankName: bBank,
        bankAccount: bAccount,
        bankHolder: bHolder.toUpperCase()
      });
      alert(isVi ? "Cập nhật chi nhánh thành công!" : "Branch updated successfully!");
      cancelEditBranch();
    } else {
      onAddBranch({
        name: bName,
        companyName: bCompany,
        mst: bMst,
        address: bAddress,
        email: bEmail,
        bankName: bBank,
        bankAccount: bAccount,
        bankHolder: bHolder.toUpperCase()
      });
      cancelEditBranch();
      alert(isVi ? "Thêm chi nhánh thành công!" : "Branch outlet added successfully!");
    }
  };

  const handleStaffSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!sName || !sCccd || !sPhone || !sPin) {
      alert(isVi ? "Vui lòng nhập đầy đủ họ tên, CCCD, Số điện thoại và mã PIN 10 chữ số!" : "Required fields: Name, Citizen ID, Tel and 10-digit PIN Code!");
      return;
    }
    if (sPin.length !== 10) {
      alert(isVi ? "Mã PIN bảo mật bắt buộc phải có độ dài đúng 10 chữ số!" : "PIN Code must be exactly 10 digits!");
      return;
    }

    if (editingStaff) {
      onUpdateStaff({
        ...editingStaff,
        name: sName,
        cccd: sCccd,
        phone: sPhone,
        pin: sPin,
        gender: sGender,
        branchId: sBranchId,
        notes: sNotes
      });
      alert(isVi ? "Cập nhật nhân sự thành công!" : "Employee profile updated successfully!");
      cancelEditStaff();
    } else {
      onAddStaff({
        name: sName,
        cccd: sCccd,
        phone: sPhone,
        startDate: new Date().toISOString().split('T')[0],
        gender: sGender,
        address: isVi ? 'Thành viên Gấu Gelato' : 'Active team member residency',
        notes: sNotes,
        role: 'staff',
        branchId: sBranchId,
        pin: sPin
      });
      cancelEditStaff();
      alert(isVi ? "Đã điều phối và thêm nhân sự mới thành công!" : "Headed and recruited new staff member successfully!");
    }
  };

  const handleVoucherSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!vCode || !vCampVi || !vCampEn || vVal <= 0) {
      alert(isVi ? "Vui lòng hoàn thành mã code, tên chiến dịch quảng bá và trị giá giảm!" : "Please configure code name, campaign translations and discount values!");
      return;
    }

    const finalBranches = vBranches.length === 0 ? ['all'] : vBranches;
    const voucherData: Voucher = {
      code: vCode.toUpperCase().trim(),
      campaignVi: vCampVi,
      campaignEn: vCampEn,
      discountType: vType,
      value: vVal,
      minOrder: vMin,
      expiryDate: vExpiry,
      usageCount: editingVoucher ? editingVoucher.usageCount : 0,
      disabled: vDisabled,
      applicableBranches: finalBranches
    };

    if (editingVoucher) {
      onUpdateVoucher(voucherData);
      alert(isVi ? "Cập nhật Voucher thành công!" : "Voucher updated successfully!");
      cancelEditVoucher();
    } else {
      onAddVoucher(voucherData);
      cancelEditVoucher();
      alert(isVi ? "Thiết lập Voucher thành công!" : "Voucher coupon registered successfully!");
    }
  };

  const toggleVoucherActive = (v: Voucher) => {
    const nextDisabled = !v.disabled;
    onUpdateVoucher({
      ...v,
      disabled: nextDisabled
    });
    alert(isVi 
      ? `Đã ${nextDisabled ? 'khóa' : 'kích hoạt'} mã Voucher "${v.code}" thành công!`
      : `Voucher code "${v.code}" has been ${nextDisabled ? 'disabled' : 'activated'}!`);
  };

  const handleExportUsageToExcel = (voucher: Voucher) => {
    const matching = orders.filter(o => o.voucherCode === voucher.code);
    if (matching.length === 0) {
      alert(isVi ? "Chưa có hóa đơn nào áp dụng mã này để xuất báo cáo!" : "No sales orders have applied this voucher yet!");
      return;
    }

    // CSV structure
    let csvContent = "";
    
    // Header
    const headers = isVi 
      ? ["Mã Hóa Đơn", "Ngày Giao Dịch", "Chi Nhánh", "Nhân Viên POS", "Tổng Ban Đầu (đ)", "Tiền Giảm (đ)", "Thực Thu (đ)", "Phương Thức"]
      : ["Invoice Code", "Timestamp", "Branch Name", "Cashier POS", "Subtotal (đ)", "Discount Amount (đ)", "Total Amount (đ)", "Payment Method"];
    
    csvContent += headers.map(h => `"${h.replace(/"/g, '""')}"`).join(",") + "\n";

    matching.forEach(o => {
      const bName = branches.find(b => b.id === o.branchId)?.name || o.branchId;
      const row = [
        o.id,
        o.date,
        bName,
        o.staffName,
        o.subtotal,
        o.discountAmount,
        o.total,
        o.paymentMethod.toUpperCase()
      ];
      csvContent += row.map(v => `"${String(v).replace(/"/g, '""')}"`).join(",") + "\n";
    });

    try {
      const blob = new Blob(["\uFEFF" + csvContent], { type: "text/csv;charset=utf-8;" });
      const url = URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.setAttribute("href", url);
      link.setAttribute("download", `Bao_Cao_Su_Dung_Voucher_${voucher.code}.csv`);
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);
    } catch (err) {
      alert(isVi ? "Không thể xuất tệp tin, vui lòng thử lại." : "Could not export CSV file, please try again.");
    }
  };

  return (
    <div className="space-y-6 font-sans text-stone-800">
      
      {/* Warning Admin help */}
      <div className="bg-amber-100/40 p-4 rounded-3xl border border-amber-900/10 text-[#4A3E3E] text-xs">
        <strong>🔒 {t.adminSectionHelp}</strong>
      </div>

      {/* Sub tabs view switcher */}
      <div className="flex bg-amber-50/40 p-1.5 rounded-2xl border border-amber-900/10 max-w-lg shadow-xs">
        <button
          onClick={() => setActiveSubTab('branches')}
          className={`flex-1 flex items-center justify-center gap-1.5 py-2 rounded-xl font-bold text-xs select-none cursor-pointer transition ${
            activeSubTab === 'branches'
              ? 'bg-[#4A3E3E] text-white shadow-xs'
              : 'text-stone-500 hover:text-stone-800'
          }`}
        >
          🏢 {isVi ? 'Danh Sách Chi Nhánh' : 'Branches List'}
        </button>
        <button
          onClick={() => setActiveSubTab('staff')}
          className={`flex-1 flex items-center justify-center gap-1.5 py-2 rounded-xl font-bold text-xs select-none cursor-pointer transition ${
            activeSubTab === 'staff'
              ? 'bg-[#4A3E3E] text-white shadow-xs'
              : 'text-stone-500 hover:text-stone-800'
          }`}
        >
          👷 {isVi ? 'Quản Lý Nhân Sự' : 'Staff Directory'}
        </button>
        <button
          onClick={() => setActiveSubTab('vouchers')}
          className={`flex-1 flex items-center justify-center gap-1.5 py-2 rounded-xl font-bold text-xs select-none cursor-pointer transition ${
            activeSubTab === 'vouchers'
              ? 'bg-[#4A3E3E] text-white shadow-xs'
              : 'text-stone-500 hover:text-stone-800'
          }`}
        >
          🎫 {isVi ? 'Voucher Khuyến Mãi' : 'Promotions & Vouchers'}
        </button>
      </div>

      {/* 1. Branch outlet listing and creation form */}
      {activeSubTab === 'branches' && (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
          {/* List of branches (left 7 cols) */}
          <div className="lg:col-span-7 bg-white p-6 rounded-3xl border border-amber-900/5 shadow-sm space-y-4">
            <h4 className="text-sm font-bold text-[#4A3E3E] flex items-center gap-2 border-b pb-2">
              <span>🏢 {isVi ? 'Danh Sách Chi Nhánh Đang Hoạt Động' : 'Active Store Branches List'}</span>
              <span className="text-xs font-normal text-stone-500 font-mono ml-auto">({branches.length})</span>
            </h4>
            <div className="space-y-3 max-h-[500px] overflow-y-auto pr-1">
              {branches.map(b => (
                <div key={b.id} className="p-4 rounded-2xl bg-amber-50/10 border border-amber-900/5 hover:bg-amber-50/20 transition flex items-start gap-3">
                  <div className="flex-1 space-y-1">
                    <div className="flex items-center gap-1.5">
                      <strong className="text-stone-850 text-xs sm:text-sm font-bold">{b.name}</strong>
                      <span className="bg-amber-100 text-amber-900 text-[9px] px-1.5 py-0.5 rounded-full font-mono font-bold uppercase">{b.id}</span>
                    </div>
                    <span className="text-[11px] text-stone-600 block"><span className="font-semibold">{isVi ? 'Địa chỉ' : 'Addr'}:</span> {b.address}</span>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-4 gap-y-0.5 pt-1.5 text-[10.5px] text-stone-500 border-t border-dashed mt-1.5">
                      <span><strong>MST:</strong> {b.mst}</span>
                      <span><strong>Email:</strong> {b.email}</span>
                      <span><strong>{isVi ? 'Đại diện' : 'Representative'}:</strong> {b.companyName}</span>
                      <span><strong>{isVi ? 'Ngân hàng' : 'Bank'}:</strong> {b.bankName} - {b.bankAccount} ({b.bankHolder})</span>
                    </div>
                  </div>
                  <div className="flex flex-col gap-1.5 text-right shrink-0">
                    <button
                      onClick={() => startEditBranch(b)}
                      className="text-amber-850 font-bold hover:text-amber-950 hover:bg-amber-150/40 px-2.5 py-1 rounded-lg text-xs cursor-pointer select-none transition border border-amber-800/10"
                    >
                      ✏️ {isVi ? 'Sửa' : 'Edit'}
                    </button>
                    {branches.length > 1 && (
                      <button
                        onClick={() => {
                          if (confirm(isVi ? `Bạn chắc chắn muốn xóa chi nhánh ${b.name}?` : `Delete branch ${b.name}?`)) {
                            onDeleteBranch(b.id);
                          }
                        }}
                        className="text-red-500 hover:text-red-700 hover:bg-red-50 px-2.5 py-1 rounded-lg text-xs cursor-pointer select-none transition"
                      >
                        🗑️ {isVi ? 'Xóa' : 'Delete'}
                      </button>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Form Create/Edit Branch (right 5 cols) */}
          <div className="lg:col-span-5 bg-white p-6 rounded-3xl border border-amber-900/5 shadow-sm space-y-4">
            <h4 className="text-sm font-bold text-[#4A3E3E] flex items-center justify-between border-b pb-2">
              <span>{editingBranch ? `✏️ ${isVi ? 'Sửa thông tin Chi nhánh' : 'Edit Branch Outline'}` : `✨ ${isVi ? 'Thêm Chi nhánh mới' : 'Create Branch Outline'}`}</span>
              {editingBranch && (
                <button
                  type="button"
                  onClick={cancelEditBranch}
                  className="text-xs text-stone-400 hover:text-stone-700 font-medium underline"
                >
                  {isVi ? 'Hủy sửa' : 'Cancel Edit'}
                </button>
              )}
            </h4>

            <form onSubmit={handleBranchSubmit} className="space-y-4 pt-1">
              <div className="space-y-3">
                <div>
                  <label className="block text-[10.5px] font-bold uppercase text-stone-500 mb-1">{isVi ? 'Tên chi nhánh' : 'Branch Name'}</label>
                  <input
                    type="text"
                    placeholder={isVi ? 'Tên cửa hàng (ví dụ: Gấu Gelato - Quận 7)' : 'Store Outlet Name'}
                    value={bName}
                    onChange={e => setBName(e.target.value)}
                    className="w-full text-xs border rounded-xl p-2.5 bg-[#FDFBF7]/30 font-medium"
                    required
                  />
                </div>
                <div>
                  <label className="block text-[10.5px] font-bold uppercase text-stone-500 mb-1">{isVi ? 'Pháp nhân doanh nghiệp' : 'Corporate Entity'}</label>
                  <input
                    type="text"
                    placeholder={isVi ? 'Đại diện Đơn vị pháp nhân' : 'Corporate Entity Name'}
                    value={bCompany}
                    onChange={e => setBCompany(e.target.value)}
                    className="w-full text-xs border rounded-xl p-2.5 bg-[#FDFBF7]/30"
                    required
                  />
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-[10.5px] font-bold uppercase text-stone-500 mb-1">{isVi ? 'Mã số thuế' : 'Tax MST'}</label>
                    <input
                      type="text"
                      placeholder={isVi ? 'Mã số thuế doanh nghiệp' : 'Tax MST ID Number'}
                      value={bMst}
                      onChange={e => setBMst(e.target.value)}
                      className="w-full text-xs border rounded-xl p-2.5 bg-[#FDFBF7]/30 font-mono"
                      required
                    />
                  </div>
                  <div>
                    <label className="block text-[10.5px] font-bold uppercase text-stone-500 mb-1">{isVi ? 'Email hóa đơn' : 'Contact Email'}</label>
                    <input
                      type="email"
                      placeholder={isVi ? 'Email liên hệ hóa đơn' : 'Operational Email contact'}
                      value={bEmail}
                      onChange={e => setBEmail(e.target.value)}
                      className="w-full text-xs border rounded-xl p-2.5 bg-[#FDFBF7]/30 font-mono"
                      required
                    />
                  </div>
                </div>
                <div>
                  <label className="block text-[10.5px] font-bold uppercase text-stone-500 mb-1">{isVi ? 'Địa chỉ xuất hóa đơn' : 'Invoicing Address'}</label>
                  <input
                    type="text"
                    placeholder={isVi ? 'Địa chỉ chi nhánh' : 'Outlet Invoicing Address'}
                    value={bAddress}
                    onChange={e => setBAddress(e.target.value)}
                    className="w-full text-xs border rounded-xl p-2.5 bg-[#FDFBF7]/30"
                    required
                  />
                </div>
                <div className="border-t border-stone-100 pt-3 space-y-3">
                  <span className="block text-[11px] font-bold text-stone-600">🏦 {isVi ? 'Thông tin Ngân hàng chuyển khoản (VietQR)' : 'Transfer Bank Account Info'}</span>
                  <div className="grid grid-cols-3 gap-2">
                    <div className="col-span-1">
                      <label className="block text-[9px] font-bold uppercase text-stone-400 mb-0.5">{isVi ? 'Mã ngân hàng' : 'Bank Key'}</label>
                      <select
                        value={bBank}
                        onChange={e => setBBank(e.target.value)}
                        className="w-full text-xs border rounded-xl p-2 bg-[#FDFBF7]/30"
                      >
                        <option value="Vietcombank">Vietcombank</option>
                        <option value="MB Bank">MB Bank</option>
                        <option value="Techcombank">Techcombank</option>
                        <option value="ACB">ACB Bank</option>
                      </select>
                    </div>
                    <div className="col-span-2">
                      <label className="block text-[9px] font-bold uppercase text-stone-400 mb-0.5">{isVi ? 'Số tài khoản' : 'Acc Number'}</label>
                      <input
                        type="text"
                        placeholder={isVi ? 'Tài khoản ngân hàng' : 'Account Serial Number'}
                        value={bAccount}
                        onChange={e => setBAccount(e.target.value)}
                        className="w-full text-xs border rounded-xl p-2 bg-[#FDFBF7]/30 font-mono"
                        required
                      />
                    </div>
                  </div>
                  <div>
                    <label className="block text-[10.5px] font-bold uppercase text-stone-500 mb-1">{isVi ? 'Tên Chủ Thẻ (VIẾT HOA KHÔNG DẤU)' : 'Cardholder (UPPERCASE)'}</label>
                    <input
                      type="text"
                      placeholder={isVi ? 'Tên Chủ Thẻ (VIẾT HOA KHÔNG DẤU)' : 'Cardholder Fullname (UPPERCASE)'}
                      value={bHolder}
                      onChange={e => setBHolder(e.target.value)}
                      className="w-full text-xs border rounded-xl p-2.5 bg-[#FDFBF7]/30 font-mono"
                      required
                    />
                  </div>
                </div>
              </div>

              <div className="flex gap-2">
                {editingBranch && (
                  <button
                    type="button"
                    onClick={cancelEditBranch}
                    className="flex-1 bg-stone-100 hover:bg-stone-200 text-stone-700 font-bold text-xs py-2.5 px-4 rounded-xl cursor-pointer transition text-center"
                  >
                    {isVi ? 'Hủy' : 'Cancel'}
                  </button>
                )}
                <button
                  type="submit"
                  className="flex-2 bg-[#4A3E3E] hover:bg-amber-950 text-white font-bold text-xs py-2.5 px-4 rounded-xl shadow cursor-pointer transition text-center"
                >
                  {editingBranch ? (isVi ? '💾 Cập nhật chi nhánh' : '💾 Save Branch') : `+ ${isVi ? 'Thêm Chi nhánh mới' : 'Add New Branch'}`}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* 2. HR Management and Staff coordinates */}
      {activeSubTab === 'staff' && (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
          {/* List of staff (left 7 cols) */}
          <div className="lg:col-span-7 bg-white p-6 rounded-3xl border border-amber-900/5 shadow-sm space-y-4">
            <h4 className="text-sm font-bold text-[#4A3E3E] flex items-center gap-2 border-b pb-2">
              <span>👷 {isVi ? 'Danh Sách Nhân Sự Chuỗi Cửa Hàng' : 'Chain Staff & Employee List'}</span>
              <span className="text-xs font-normal text-stone-500 font-mono ml-auto">({staff.length})</span>
            </h4>
            <div className="space-y-3 max-h-[500px] overflow-y-auto pr-1">
              {staff.map(s => {
                const bName = branches.find(b => b.id === s.branchId)?.name || 'Central Office';
                return (
                  <div key={s.id} className="p-4 rounded-2xl bg-amber-50/10 border border-amber-900/5 hover:bg-amber-50/20 transition flex items-start gap-3">
                    <div className="flex-1 space-y-1">
                      <div className="flex items-center gap-1.5 flex-wrap">
                        <strong className="text-stone-850 text-xs sm:text-sm font-bold">{s.name}</strong>
                        <span className="bg-amber-100 text-amber-900 text-[9px] px-1.5 py-0.5 rounded-full font-mono font-bold uppercase">{s.role}</span>
                        <span className="text-[10px] bg-stone-100 text-stone-600 px-1.5 py-0.5 rounded font-mono font-bold">{s.id}</span>
                      </div>
                      <span className="text-[11px] text-[#A4907C] font-semibold block">📍 {bName}</span>
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-4 gap-y-0.5 pt-1.5 text-[10.5px] text-stone-500 border-t border-dashed mt-1.5">
                        <span><strong>{isVi ? 'SĐT Đăng nhập:' : 'Login Tel:'}</strong> {s.phone}</span>
                        <span><strong>CCCD:</strong> {s.cccd}</span>
                        <span><strong>Mã PIN POS:</strong> <span className="font-mono font-bold text-amber-800 bg-amber-50 px-1 py-0.2 rounded border border-amber-200">{s.pin}</span></span>
                        <span><strong>{isVi ? 'Ghi chú:' : 'Notes:'}</strong> {s.notes || '-'}</span>
                      </div>
                    </div>
                    <div className="flex flex-col gap-1.5 text-right shrink-0">
                      <button
                        onClick={() => startEditStaff(s)}
                        className="text-amber-850 font-bold hover:text-amber-950 hover:bg-amber-150/40 px-2.5 py-1 rounded-lg text-xs cursor-pointer select-none transition border border-amber-800/10"
                      >
                        ✏️ {isVi ? 'Sửa' : 'Edit'}
                      </button>
                      {staff.length > 1 && s.role !== 'admin' && (
                        <button
                          onClick={() => {
                            if (confirm(isVi ? `Bạn muốn cho thôi việc / xóa nhân sự ${s.name}?` : `Remove employee ${s.name}?`)) {
                              onDeleteStaff(s.id);
                            }
                          }}
                          className="text-red-500 hover:text-red-700 hover:bg-red-50 px-2.5 py-1 rounded-lg text-xs cursor-pointer select-none transition"
                        >
                          🗑️ {isVi ? 'Xóa' : 'Delete'}
                        </button>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Form Create/Edit Staff (right 5 cols) */}
          <div className="lg:col-span-5 bg-white p-6 rounded-3xl border border-amber-900/5 shadow-sm space-y-4">
            <h4 className="text-sm font-bold text-[#4A3E3E] flex items-center justify-between border-b pb-2">
              <span>{editingStaff ? `✏️ ${isVi ? 'Sửa thông tin Nhân sự' : 'Edit Employee Profile'}` : `✨ ${isVi ? 'Tuyển dụng & Đăng ký POS' : 'Recruit POS Staff'}`}</span>
              {editingStaff && (
                <button
                  type="button"
                  onClick={cancelEditStaff}
                  className="text-xs text-stone-400 hover:text-stone-700 font-medium underline"
                >
                  {isVi ? 'Hủy sửa' : 'Cancel Edit'}
                </button>
              )}
            </h4>

            <form onSubmit={handleStaffSubmit} className="space-y-4 pt-1">
              <div className="space-y-3">
                <div>
                  <label className="block text-[10.5px] font-bold uppercase text-stone-500 mb-1">{isVi ? 'Họ và tên' : 'Employee Full Name'}</label>
                  <input
                    type="text"
                    placeholder={isVi ? 'Ví dụ: Nguyễn Văn Gấu' : 'e.g. Alexis Brown'}
                    value={sName}
                    onChange={e => setSName(e.target.value)}
                    className="w-full text-xs border rounded-xl p-2.5 bg-[#FDFBF7]/30 font-medium"
                    required
                  />
                </div>
                <div>
                  <label className="block text-[10.5px] font-bold uppercase text-stone-500 mb-1">{isVi ? 'Số CCCD (12 chữ số)' : 'CCCD Citizen ID (12 digits)'}</label>
                  <input
                    type="text"
                    placeholder={isVi ? 'Nhập CCCD' : 'Citizen ID number'}
                    value={sCccd}
                    onChange={e => setSCccd(e.target.value)}
                    className="w-full text-xs border rounded-xl p-2.5 bg-[#FDFBF7]/30 font-mono"
                    required
                  />
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-[10.5px] font-bold uppercase text-stone-500 mb-1">{isVi ? 'SĐT Đăng Nhập' : 'Login Telephone'}</label>
                    <input
                      type="text"
                      placeholder={isVi ? 'Số điện thoại' : 'Telephone number'}
                      value={sPhone}
                      onChange={e => setSPhone(e.target.value)}
                      className="w-full text-xs border rounded-xl p-2.5 bg-[#FDFBF7]/30 font-mono"
                      required
                    />
                  </div>
                  <div>
                    <label className="block text-[10.5px] font-bold uppercase text-stone-500 mb-1">{isVi ? 'Mã PIN POS (10 số)' : 'POS PIN (10 digits)'}</label>
                    <input
                      type="text"
                      placeholder={isVi ? '10 chữ số bảo mật' : '10 digit secure PIN'}
                      value={sPin}
                      onChange={e => setSPin(e.target.value)}
                      maxLength={10}
                      className="w-full text-xs border rounded-xl p-2.5 bg-[#FDFBF7]/30 font-mono font-bold"
                      required
                    />
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-[10.5px] font-bold uppercase text-stone-500 mb-1">{isVi ? 'Giới tính' : 'Gender'}</label>
                    <select
                      value={sGender}
                      onChange={e => setSGender(e.target.value as any)}
                      className="w-full text-xs border rounded-xl p-2.5 bg-[#FDFBF7]/30 font-medium"
                    >
                      <option value="female">{isVi ? 'Nữ' : 'Female'}</option>
                      <option value="male">{isVi ? 'Nam' : 'Male'}</option>
                      <option value="other">{isVi ? 'Khác' : 'Other'}</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-[10.5px] font-bold uppercase text-stone-500 mb-1">{isVi ? 'Cơ sở chi nhánh' : 'Branch outlet'}</label>
                    <select
                      value={sBranchId}
                      onChange={e => setSBranchId(e.target.value)}
                      className="w-full text-xs border rounded-xl p-2.5 bg-[#FDFBF7]/30 font-medium"
                    >
                      {branches.map(b => (
                        <option key={b.id} value={b.id}>{b.name}</option>
                      ))}
                    </select>
                  </div>
                </div>
                <div>
                  <label className="block text-[10.5px] font-bold uppercase text-stone-500 mb-1">{isVi ? 'Ghi chú năng lực / Hồ sơ' : 'HR profile background notes'}</label>
                  <input
                    type="text"
                    placeholder={isVi ? 'Ví dụ: Ca sáng, quản lý kho tốt...' : 'Background notes...'}
                    value={sNotes}
                    onChange={e => setSNotes(e.target.value)}
                    className="w-full text-xs border rounded-xl p-2.5 bg-[#FDFBF7]/30"
                  />
                </div>
              </div>

              <div className="flex gap-2">
                {editingStaff && (
                  <button
                    type="button"
                    onClick={cancelEditStaff}
                    className="flex-1 bg-stone-100 hover:bg-stone-200 text-stone-700 font-bold text-xs py-2.5 px-4 rounded-xl cursor-pointer transition text-center"
                  >
                    {isVi ? 'Hủy' : 'Cancel'}
                  </button>
                )}
                <button
                  type="submit"
                  className="flex-2 bg-[#4A3E3E] hover:bg-amber-950 text-white font-bold text-xs py-2.5 px-4 rounded-xl shadow cursor-pointer transition text-center"
                >
                  {editingStaff ? (isVi ? '💾 Cập nhật hồ sơ' : '💾 Update Employee') : `+ ${isVi ? 'Tuyển dụng Nhân sự mới' : 'Deploy Employee'}`}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* 3. Voucher campaigns and promos view */}
      {activeSubTab === 'vouchers' && (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
          {/* List of active promotions (left 7 cols) */}
          <div className="lg:col-span-7 bg-white p-6 rounded-3xl border border-amber-900/5 shadow-sm space-y-4">
            <div className="flex items-center justify-between border-b pb-2 flex-wrap gap-2">
              <h4 className="text-sm font-bold text-[#4A3E3E] flex items-center gap-2">
                <span>🎟️ {isVi ? 'Ưu Đãi & Voucher Chuỗi Kem Gấu' : 'Active Discount Coupons Ledger'}</span>
                <span className="text-xs font-normal text-stone-500 font-mono">({vouchers.length})</span>
              </h4>

              {/* Sub-tabs within Voucher List */}
              <div className="flex bg-rose-50/50 p-1 rounded-xl border border-rose-200/50">
                <button
                  type="button"
                  onClick={() => setVoucherSubTab('valid')}
                  className={`py-1 px-3 rounded-lg text-center text-[11px] font-bold transition select-none cursor-pointer ${
                    voucherSubTab === 'valid'
                      ? 'bg-rose-500 text-white shadow-xs'
                      : 'text-stone-500 hover:text-stone-850'
                  }`}
                >
                  {isVi ? 'Còn hạn dùng' : 'Active'} ({
                    vouchers.filter(v => {
                      const isExpired = todayStr > v.expiryDate;
                      return !v.disabled && !isExpired;
                    }).length
                  })
                </button>
                <button
                  type="button"
                  onClick={() => setVoucherSubTab('invalid')}
                  className={`py-1 px-3 rounded-lg text-center text-[11px] font-bold transition select-none cursor-pointer ${
                    voucherSubTab === 'invalid'
                      ? 'bg-stone-500 text-white shadow-xs'
                      : 'text-stone-500 hover:text-stone-850'
                  }`}
                >
                  {isVi ? 'Hết hạn / Khóa' : 'Expired / Locked'} ({
                    vouchers.filter(v => {
                      const isExpired = todayStr > v.expiryDate;
                      return v.disabled || isExpired;
                    }).length
                  })
                </button>
              </div>
            </div>

            {/* List view of selected voucher tab */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5 max-h-[550px] overflow-y-auto pr-1">
              {vouchers.filter(v => {
                const isExpired = todayStr > v.expiryDate;
                const isCurrentlyValid = !v.disabled && !isExpired;
                return voucherSubTab === 'valid' ? isCurrentlyValid : !isCurrentlyValid;
              }).map(v => {
                const isExpired = todayStr > v.expiryDate;
                // Count exact match orders using references
                const usedInOrdersCount = orders.filter(o => o.voucherCode === v.code).length;

                return (
                  <div 
                    key={v.code} 
                    className={`p-4 rounded-2xl transition flex flex-col justify-between relative overflow-hidden border ${
                      v.disabled 
                        ? 'bg-stone-50/50 border-stone-200/60 opacity-80' 
                        : isExpired 
                          ? 'bg-amber-50/20 border-amber-200/40 opacity-90'
                          : 'bg-rose-50/25 border-rose-300/35 hover:bg-rose-50/45'
                    }`}
                  >
                    {/* Badge showing status/date */}
                    <div className="absolute right-2.5 top-2 flex flex-col items-end gap-1">
                      <span className={`text-[9px] px-2 py-0.5 rounded-full font-bold shadow-2xs shrink-0 ${
                        isExpired 
                          ? 'bg-amber-100 text-amber-800' 
                          : 'bg-rose-100/90 text-rose-800'
                      }`}>
                        📅 {v.expiryDate}
                      </span>
                      {v.disabled && (
                        <span className="bg-red-100 text-red-800 text-[8px] px-1.5 py-0.2 rounded font-black font-sans uppercase">
                          {isVi ? 'BỊ KHÓA' : 'LOCKED'}
                        </span>
                      )}
                      {isExpired && !v.disabled && (
                        <span className="bg-stone-200 text-stone-700 text-[8px] px-1.5 py-0.2 rounded font-black font-sans uppercase">
                          {isVi ? 'HẾT HẠN' : 'EXPIRED'}
                        </span>
                      )}
                    </div>

                    <div className="space-y-1.5 mt-1">
                      <span className="font-mono font-bold text-xs bg-rose-200 text-rose-850 px-2 py-0.5 rounded block max-w-fit shadow-2xs border border-rose-300/30">
                        {v.code}
                      </span>
                      <strong className="block text-stone-800 text-xs sm:text-[13px] leading-tight pt-1 font-bold">
                        {isVi ? v.campaignVi : v.campaignEn}
                      </strong>
                      <p className="text-[11px] text-gray-500 leading-normal pt-1 space-y-0.5">
                        <div><strong>{isVi ? 'Loại ưu đãi:' : 'Benefit:'}</strong> {v.discountType === 'percent' ? `${v.value}% discount` : `${v.value.toLocaleString()}đ off`}</div>
                        <div><strong>{isVi ? 'Đơn tối thiểu:' : 'Min Spend:'}</strong> {v.minOrder.toLocaleString()}đ</div>
                        
                        {/* Branches information details display */}
                        <div className="text-[10px] text-amber-900 bg-amber-500/5 px-2 py-1 rounded border border-amber-500/10 mt-1 max-w-fit">
                          <strong>📍 {isVi ? 'Chi nhánh áp dụng: ' : 'Branches: '}</strong>
                          {(!v.applicableBranches || v.applicableBranches.includes('all')) ? (
                            <span>{isVi ? 'Tất cả chi nhánh' : 'All Branches'}</span>
                          ) : (
                            <span>
                              {v.applicableBranches.map(bId => branches.find(b => b.id === bId)?.name || bId).join(', ')}
                            </span>
                          )}
                        </div>
                      </p>
                    </div>

                    <div className="border-t border-rose-200/40 pt-2.5 mt-3.5 flex flex-col gap-2.5">
                      <div className="flex justify-between items-center text-[10.5px] font-mono text-gray-600 flex-wrap gap-1">
                        <span>
                          {isVi ? 'Đã dùng: ' : 'Used: '}
                          <button
                            type="button"
                            onClick={() => setSelectedUsageVoucher(v)}
                            className="text-rose-800 font-bold p-1 bg-white hover:bg-rose-50 rounded border border-rose-200 cursor-pointer text-xs underline"
                            title={isVi ? "Xem danh sách bill" : "View bills list"}
                          >
                            📊 {usedInOrdersCount} bill
                          </button>
                        </span>

                        {/* Quick Active and Disable Toggle Buttons */}
                        <button
                          type="button"
                          onClick={() => toggleVoucherActive(v)}
                          className={`text-[10px] font-bold px-2 py-0.5 rounded cursor-pointer select-none transition border ${
                            v.disabled 
                              ? 'bg-emerald-100 hover:bg-emerald-200 text-emerald-800 border-emerald-300' 
                              : 'bg-amber-100 hover:bg-amber-200 text-amber-800 border-amber-300'
                          }`}
                        >
                          {v.disabled 
                            ? (isVi ? '🔓 Bảo Hồi' : '🔓 Enable') 
                            : (isVi ? '🔒 Khóa Lại' : '🔒 Disable')}
                        </button>
                      </div>

                      <div className="flex justify-end gap-1.5 pt-1 border-t border-dashed border-stone-200">
                        <button
                          onClick={() => setSelectedUsageVoucher(v)}
                          className="text-[#5B3F23] hover:text-[#4A3E3E] font-medium px-2 py-1 bg-orange-50 hover:bg-orange-100 border border-orange-200/50 rounded text-[10px] cursor-pointer select-none transition"
                        >
                          📋 {isVi ? 'Xem Lịch Sử' : 'Usage History'}
                        </button>
                        <button
                          onClick={() => startEditVoucher(v)}
                          className="text-amber-800 font-bold hover:text-amber-950 hover:bg-amber-100/55 px-2 py-1 rounded text-[10px] cursor-pointer select-none transition border border-amber-200/40"
                        >
                          ✏️ {isVi ? 'Sửa' : 'Edit'}
                        </button>
                        <button
                          onClick={() => {
                            if (confirm(isVi ? `Bạn muốn xóa mã Voucher ${v.code}?` : `Delete voucher code ${v.code}?`)) {
                              onDeleteVoucher(v.code);
                            }
                          }}
                          className="text-red-500 hover:text-red-700 font-bold hover:bg-red-50 px-2 py-1 rounded text-[10px] cursor-pointer select-none transition"
                        >
                          🗑️ {isVi ? 'Xóa' : 'Delete'}
                        </button>
                      </div>
                    </div>
                  </div>
                );
              })}
              
              {vouchers.filter(v => {
                const isExpired = todayStr > v.expiryDate;
                const isCurrentlyValid = !v.disabled && !isExpired;
                return voucherSubTab === 'valid' ? isCurrentlyValid : !isCurrentlyValid;
              }).length === 0 && (
                <div className="col-span-2 text-center py-10 bg-amber-50/10 rounded-2xl border border-dashed border-amber-900/10 text-stone-500 text-xs">
                  {isVi ? 'Không có mã Voucher nào thuộc về danh mục này.' : 'No voucher found in this section.'}
                </div>
              )}
            </div>
          </div>

          {/* Form Create/Edit Voucher (right 5 cols) */}
          <div className="lg:col-span-5 bg-white p-6 rounded-3xl border border-amber-900/5 shadow-sm space-y-4">
            <h4 className="text-sm font-bold text-[#4A3E3E] flex items-center justify-between border-b pb-2">
              <span>{editingVoucher ? `✏️ ${isVi ? 'Sửa thông tin Voucher' : 'Edit Coupon Detail'}` : `✨ ${isVi ? 'Đăng ký Voucher mới' : 'Establish New Coupon'}`}</span>
              {editingVoucher && (
                <button
                  type="button"
                  onClick={cancelEditVoucher}
                  className="text-xs text-stone-400 hover:text-stone-700 font-medium underline"
                >
                  {isVi ? 'Hủy sửa' : 'Cancel Edit'}
                </button>
              )}
            </h4>

            <form onSubmit={handleVoucherSubmit} className="space-y-4 pt-1">
              <div className="space-y-3">
                <div>
                  <label className="block text-[10.5px] font-bold uppercase text-stone-500 mb-1">{isVi ? 'Mã Code Voucher (Viết liền không dấu)' : 'Voucher Code String'}</label>
                  <input
                    type="text"
                    placeholder={isVi ? 'Mã Code (ví dụ: GAUHE2026)' : 'Voucher Code String'}
                    value={vCode}
                    onChange={e => setVCode(e.target.value)}
                    className="w-full text-xs border rounded-xl p-2.5 bg-[#FDFBF7]/30 font-mono font-bold text-amber-900"
                    required
                    disabled={!!editingVoucher} // Code string is primary key
                  />
                  {editingVoucher && <p className="text-[9px] text-stone-400 mt-1">{isVi ? 'Mã Voucher không thể thay đổi sau khi tạo.' : 'Voucher code cannot be altered.'}</p>}
                </div>
                <div>
                  <label className="block text-[10.5px] font-bold uppercase text-stone-500 mb-1">{isVi ? 'Tên chiến dịch quảng bá (Tiếng Việt)' : 'Campaign Name (Vietnamese)'}</label>
                  <input
                    type="text"
                    placeholder={isVi ? 'Ví dụ: Ngày Hội Kem Gấu' : 'e.g. Bear Gelato Festival'}
                    value={vCampVi}
                    onChange={e => setVCampVi(e.target.value)}
                    className="w-full text-xs border rounded-xl p-2.5 bg-[#FDFBF7]/30 font-medium"
                    required
                  />
                </div>
                <div>
                  <label className="block text-[10.5px] font-bold uppercase text-stone-500 mb-1">{isVi ? 'Tên chiến dịch quảng bá (Tiếng Anh)' : 'Campaign Name (English)'}</label>
                  <input
                    type="text"
                    placeholder={isVi ? 'Ví dụ: Bear Gelato Happy Day' : 'e.g. Bear Gelato Happy Day'}
                    value={vCampEn}
                    onChange={e => setVCampEn(e.target.value)}
                    className="w-full text-xs border rounded-xl p-2.5 bg-[#FDFBF7]/30"
                    required
                  />
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-[10.5px] font-bold uppercase text-stone-500 mb-1">{isVi ? 'Hình thức giảm' : 'Discount Formulation'}</label>
                    <select
                      value={vType}
                      onChange={e => setVType(e.target.value as any)}
                      className="w-full text-xs border rounded-xl p-2.5 bg-[#FDFBF7]/30 font-medium"
                    >
                      <option value="percent">{isVi ? 'Phần trăm (%)' : 'Percentage (%)'}</option>
                      <option value="fixed">{isVi ? 'Số tiền giảm (đ)' : 'Fixed Amount (đ)'}</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-[10.5px] font-bold uppercase text-stone-500 mb-1">{isVi ? 'Trị giá giảm' : 'Discount Face Value'}</label>
                    <input
                      type="number"
                      placeholder={isVi ? 'Trị giá...' : 'value...'}
                      value={vVal <= 0 ? '' : vVal}
                      onChange={e => setVVal(Math.max(0, parseInt(e.target.value) || 0))}
                      className="w-full text-xs border rounded-xl p-2.5 bg-[#FDFBF7]/30 font-mono font-bold text-amber-950"
                      required
                    />
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-[10.5px] font-bold uppercase text-stone-500 mb-1">{isVi ? 'Yêu cầu đơn tối thiểu' : 'Min Order Limit'}</label>
                    <input
                      type="number"
                      placeholder={isVi ? 'Tối thiểu...' : 'min price...'}
                      value={vMin <= 0 ? '' : vMin}
                      onChange={e => setVMin(Math.max(0, parseInt(e.target.value) || 0))}
                      className="w-full text-xs border rounded-xl p-2.5 bg-[#FDFBF7]/30 font-mono"
                      required
                    />
                  </div>
                  <div>
                    <label className="block text-[10.5px] font-bold uppercase text-stone-500 mb-1">{isVi ? 'Hạn sử dụng' : 'Expiry Deadline'}</label>
                    <input
                      type="date"
                      value={vExpiry}
                      onChange={e => setVExpiry(e.target.value)}
                      className="w-full text-xs border rounded-xl p-2.5 bg-[#FDFBF7]/30 font-mono font-medium"
                      required
                    />
                  </div>
                </div>

                {/* Branch Selection Section */}
                <div>
                  <label className="block text-[10.5px] font-bold uppercase text-stone-500 mb-1">
                    📍 {isVi ? 'Chi nhánh áp dụng' : 'Applicable Branches'}
                  </label>
                  <div className="p-3 bg-[#FDFBF7]/30 border rounded-xl space-y-2 max-h-36 overflow-y-auto">
                    <label className="flex items-center gap-2 text-xs font-bold text-amber-900 cursor-pointer select-none">
                      <input
                        type="checkbox"
                        checked={vBranches.includes('all')}
                        onChange={(e) => {
                          if (e.target.checked) {
                            setVBranches(['all']);
                          } else {
                            setVBranches([]);
                          }
                        }}
                        className="rounded text-amber-800 focus:ring-amber-500 h-3.5 w-3.5"
                      />
                      ✨ {isVi ? 'Tất cả chi nhánh' : 'All store branches'}
                    </label>
                    
                    {!vBranches.includes('all') && (
                      <div className="pl-4 border-l-2 border-dashed border-amber-900/10 space-y-2 mt-2">
                        {branches.map(b => (
                          <label key={b.id} className="flex items-center gap-2 text-xs font-medium text-stone-700 cursor-pointer select-none hover:text-stone-900">
                            <input
                              type="checkbox"
                              checked={vBranches.includes(b.id)}
                              onChange={(e) => {
                                if (e.target.checked) {
                                  setVBranches(prev => [...prev.filter(x => x !== 'all'), b.id]);
                                } else {
                                  setVBranches(prev => prev.filter(x => x !== b.id));
                                }
                              }}
                              className="rounded text-[#4A3E3E] focus:ring-amber-500 h-3.5 w-3.5"
                            />
                            {b.name}
                          </label>
                        ))}
                      </div>
                    )}
                  </div>
                </div>

                {/* Disabled Checkbox Status Expose */}
                <div className="pt-2">
                  <label className="flex items-center gap-2 text-xs font-bold text-[#4A3E3E] cursor-pointer select-none">
                    <input
                      type="checkbox"
                      checked={!vDisabled}
                      onChange={(e) => setVDisabled(!e.target.checked)}
                      className="rounded text-[#4A3E3E] focus:ring-amber-500 h-3.5 w-3.5"
                    />
                    🟢 {isVi ? 'Kích hoạt ngay (Cho phép sử dụng)' : 'Activate Coupon (Usable Status)'}
                  </label>
                </div>
              </div>

              <div className="flex gap-2">
                {editingVoucher && (
                  <button
                    type="button"
                    onClick={cancelEditVoucher}
                    className="flex-1 bg-stone-100 hover:bg-stone-200 text-stone-700 font-bold text-xs py-2.5 px-4 rounded-xl cursor-pointer transition text-center"
                  >
                    {isVi ? 'Hủy' : 'Cancel'}
                  </button>
                )}
                <button
                  type="submit"
                  className="flex-2 bg-[#4A3E3E] hover:bg-amber-950 text-white font-bold text-xs py-2.5 px-4 rounded-xl shadow cursor-pointer transition text-center"
                >
                  {editingVoucher ? (isVi ? '💾 Cập nhật chiến dịch' : '💾 Update Coupon') : `+ ${isVi ? 'Kích hoạt chiến dịch' : 'Deploy Coupon'}`}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* 4. selectedUsageVoucher Usage Modal popup details */}
      {selectedUsageVoucher && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-stone-900/60 backdrop-blur-xs">
          <div className="bg-white w-full max-w-4xl rounded-3xl shadow-2xl overflow-hidden border border-stone-100 flex flex-col max-h-[85vh]">
            {/* Header */}
            <div className="bg-[#4A3E3E] text-white p-5 flex items-center justify-between">
              <div>
                <h3 className="text-sm font-black uppercase tracking-wider font-mono">
                  🎫 {isVi ? 'Lịch sử áp dụng Voucher:' : 'Voucher Usage History:'} <span className="bg-amber-400 text-amber-950 px-2 py-0.5 rounded ml-1 font-bold">{selectedUsageVoucher.code}</span>
                </h3>
                <p className="text-xs text-stone-200 mt-1">
                  {isVi ? selectedUsageVoucher.campaignVi : selectedUsageVoucher.campaignEn} &bull; {isVi ? 'Hạn dùng: ' : 'Expiry: '}{selectedUsageVoucher.expiryDate}
                </p>
              </div>
              <button
                type="button"
                onClick={() => setSelectedUsageVoucher(null)}
                className="text-white hover:text-stone-300 bg-[#352c2c] hover:bg-[#201a1a] w-8 h-8 rounded-full flex items-center justify-center cursor-pointer transition font-bold"
              >
                ✕
              </button>
            </div>

            {/* Content Body */}
            <div className="p-6 overflow-y-auto space-y-4 flex-1">
              <div className="flex items-center justify-between flex-wrap gap-2 bg-rose-50/35 p-3.5 rounded-2xl border border-rose-100/50">
                <div className="text-xs leading-relaxed text-stone-600">
                  <div>• {isVi ? 'Mức giảm ưu đãi: ' : 'Benefit amount: '}<strong className="text-rose-800">{selectedUsageVoucher.discountType === 'percent' ? `${selectedUsageVoucher.value}%` : `${selectedUsageVoucher.value.toLocaleString()}đ`}</strong></div>
                  <div>• {isVi ? 'Yêu cầu thanh toán tối thiểu: ' : 'Min billing requirements: '}<strong>{selectedUsageVoucher.minOrder.toLocaleString()}đ</strong></div>
                  <div>• {isVi ? 'Chi nhánh áp dụng: ' : 'Branches configuration: '}
                    <strong>
                      {(!selectedUsageVoucher.applicableBranches || selectedUsageVoucher.applicableBranches.includes('all'))
                        ? (isVi ? 'Tất cả chi nhánh' : 'All store outlets')
                        : selectedUsageVoucher.applicableBranches.map(bId => branches.find(b => b.id === bId)?.name || bId).join(', ')
                      }
                    </strong>
                  </div>
                </div>

                <button
                  type="button"
                  onClick={() => handleExportUsageToExcel(selectedUsageVoucher)}
                  className="bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs py-2 px-3.5 rounded-xl cursor-pointer shadow-xs hover:shadow transition flex items-center gap-1.5"
                >
                  🟢 📥 {isVi ? 'Xuất báo cáo Excel (CSV)' : 'Export Excel Report (CSV)'}
                </button>
              </div>

              {/* Bills transaction ledger table history */}
              <div className="border border-stone-200/60 rounded-2xl overflow-hidden">
                <div className="overflow-x-auto">
                  <table className="w-full text-left text-xs min-w-[600px]">
                    <thead className="bg-stone-100 text-stone-600 uppercase text-[10px] font-mono tracking-wider">
                      <tr>
                        <th className="py-3 px-4">{isVi ? 'Mã Hóa Đơn' : 'Bill Code'}</th>
                        <th className="py-3 px-4">{isVi ? 'Ngày Tháng' : 'Timestamp'}</th>
                        <th className="py-3 px-4">{isVi ? 'Chi Nhánh' : 'Outlet'}</th>
                        <th className="py-3 px-4">{isVi ? 'Nhân Viên' : 'Cashier'}</th>
                        <th className="py-3 px-4 text-right">{isVi ? 'Tổng tiền' : 'Subtotal'}</th>
                        <th className="py-3 px-4 text-right">{isVi ? 'Giảm giá' : 'Discount'}</th>
                        <th className="py-3 px-4 text-right bg-rose-50 text-rose-900">{isVi ? 'Thực Thu' : 'Total Paid'}</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-stone-100 font-medium">
                      {orders.filter(o => o.voucherCode === selectedUsageVoucher.code).map(o => {
                        const bName = branches.find(b => b.id === o.branchId)?.name || o.branchId;
                        return (
                          <tr key={o.id} className="hover:bg-stone-50/50 transition">
                            <td className="py-3 px-4 font-mono font-bold text-stone-800">{o.id}</td>
                            <td className="py-3 px-4 text-stone-500 font-mono text-[11px]">{o.date}</td>
                            <td className="py-3 px-4 text-stone-700">{bName}</td>
                            <td className="py-3 px-4 text-stone-600">{o.staffName}</td>
                            <td className="py-3 px-4 text-right font-mono text-stone-700">{o.subtotal.toLocaleString()}đ</td>
                            <td className="py-3 px-4 text-right font-mono text-rose-700 font-bold">-{o.discountAmount.toLocaleString()}đ</td>
                            <td className="py-3 px-4 text-right font-mono font-bold bg-rose-50/40 text-rose-800">{o.total.toLocaleString()}đ</td>
                          </tr>
                        );
                      })}

                      {orders.filter(o => o.voucherCode === selectedUsageVoucher.code).length === 0 && (
                        <tr>
                          <td colSpan={7} className="text-center py-10 text-stone-400">
                            {isVi 
                              ? 'Chưa có giao dịch kem gấu nào được ghi nhận áp dụng mã voucher này.' 
                              : 'No customer checkout has used this discount coupon code yet.'}
                          </td>
                        </tr>
                      )}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>

            {/* Footer */}
            <div className="bg-stone-50 border-t p-4 flex justify-end">
              <button
                type="button"
                onClick={() => setSelectedUsageVoucher(null)}
                className="bg-stone-200 hover:bg-stone-300 text-stone-700 font-bold text-xs py-2 px-5 rounded-xl cursor-pointer transition text-center"
              >
                {isVi ? 'Đóng lại' : 'Close View'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
