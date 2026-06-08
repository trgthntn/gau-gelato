/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import { OperationalExpense, Order, Branch, Language, InventoryLog } from '../types';
import { LOCALES } from '../locales';

interface FinanceManagerProps {
  lang: Language;
  expenses: OperationalExpense[];
  orders: Order[];
  branches: Branch[];
  activeBranchId: string;
  userRole: 'admin' | 'staff';
  inventoryLogs: InventoryLog[];
  onAddExpense: (category: 'rent' | 'utilities' | 'labor' | 'repair' | 'equipment' | 'ingredients' | 'other', amount: number, descVi: string, descEn: string, branchId: string) => void;
}

export const FinanceManager: React.FC<FinanceManagerProps> = ({
  lang,
  expenses,
  orders,
  branches,
  activeBranchId,
  userRole,
  inventoryLogs,
  onAddExpense
}) => {
  const isVi = lang === 'vi';
  const t = LOCALES[lang];
  const isAdmin = userRole === 'admin';

  // Filters state
  const [selectedBranchId, setSelectedBranchId] = useState(isAdmin ? 'ALL' : activeBranchId);
  const [expenseCategory, setExpenseCategory] = useState<'rent' | 'utilities' | 'labor' | 'repair' | 'equipment' | 'ingredients' | 'other'>('utilities');
  const [expenseAmount, setExpenseAmount] = useState<number>(0);
  const [expenseDescVi, setExpenseDescVi] = useState('');
  const [expenseDescEn, setExpenseDescEn] = useState('');
  const [targetBranchExpense, setTargetBranchExpense] = useState(activeBranchId);

  // Compute stats based on filters
  const filteredOrders = orders.filter(o => selectedBranchId === 'ALL' || o.branchId === selectedBranchId);
  const filteredExpenses = expenses.filter(e => selectedBranchId === 'ALL' || e.branchId === selectedBranchId);

  // 1. Gross Revenue
  const totalRevenue = filteredOrders.reduce((sum, o) => sum + o.total, 0);

  // 2. Actual COGS Procurement: We aggregate the total cost of ingredients and materials purchased & stocked-in from logs
  const totalCOGS = inventoryLogs
    .filter(log => selectedBranchId === 'ALL' || log.branchId === selectedBranchId)
    .reduce((sum, log) => {
      if (log.changeAmount > 0 && log.importPrice && log.importPrice > 0) {
        if (log.itemType === 'flavor') {
          // Grams unit: changeAmount / 1000 = kg, multiplied by price per KG
          const weightKg = log.changeAmount / 1000;
          return sum + (weightKg * log.importPrice);
        } else {
          // Piece unit: item count multiplied by price per piece
          return sum + (log.changeAmount * log.importPrice);
        }
      }
      return sum;
    }, 0);

  // 3. Operational expenses (Rent, Wages, Bills)
  const totalOpex = filteredExpenses.reduce((sum, e) => sum + e.amount, 0);

  // 4. Net earning margin (EBITDA)
  const netEarnings = totalRevenue - totalCOGS - totalOpex;

  // 5. Return on Investment (ROI) Ratio %
  const totalInvestedOrSpent = totalCOGS + totalOpex;
  const roiRatio = totalInvestedOrSpent > 0 ? (netEarnings / totalInvestedOrSpent) * 100 : 0;

  const handleCreateExpenseSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (expenseAmount <= 0 || !expenseDescVi || !expenseDescEn) {
      alert(isVi ? "Vui lòng nhập đầy nội dung và số tiền chi phí!" : "Missing cost details or amount!");
      return;
    }

    onAddExpense(
      expenseCategory,
      expenseAmount,
      expenseDescVi,
      expenseDescEn,
      isAdmin ? targetBranchExpense : activeBranchId
    );

    // Reset fields
    setExpenseAmount(0);
    setExpenseDescVi('');
    setExpenseDescEn('');
    alert(isVi ? "Ghi nhận chi phí thành công!" : "Registered expense transaction successfully!");
  };

  return (
    <div className="space-y-6 font-sans text-stone-800">
      
      {/* Header and filters */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b pb-4">
        <div>
          <h3 className="text-xl font-bold text-[#4A3E3E]">🏦 {t.finTitle}</h3>
          <p className="text-xs text-gray-500">
            {isVi 
              ? 'Kiểm tra tỷ mỷ báo cáo tài chính, tổng hợp thu nhập, định lượng giá vốn kem và chi phí hoạt động.'
              : 'Detailed analysis of general ledger cash flows, gross revenues, and operational expenditures.'}
          </p>
        </div>

        {/* Branch Scope filter */}
        <div className="flex items-center gap-1.5 bg-white p-2 border rounded-xl shadow-sm">
          <label className="text-[10px] uppercase font-bold text-gray-400 pl-1">{isVi ? 'Phạm vi chi nhánh' : 'Branch Scope'}</label>
          <select
            value={selectedBranchId}
            disabled={!isAdmin}
            onChange={e => setSelectedBranchId(e.target.value)}
            className="text-xs font-semibold focus:outline-none bg-transparent"
          >
            {isAdmin && <option value="ALL">🌐 {isVi ? 'Tất Cả Chi Nhánh' : 'All Branches (Consolidated)'}</option>}
            {branches.map(b => (
              <option key={b.id} value={b.id}>🏢 {b.name}</option>
            ))}
          </select>
        </div>
      </div>

      {/* KPI Bento Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        
        {/* Gross revenue */}
        <div className="bg-white p-4 rounded-3xl border border-amber-900/5 shadow-sm">
          <span className="block text-[10px] text-gray-400 uppercase tracking-wider font-bold">{t.finTotalRevenue}</span>
          <span className="block text-xl font-mono font-bold text-[#4A3E3E] mt-2">
            {totalRevenue.toLocaleString('vi-VN')}đ
          </span>
          <span className="text-[9px] text-[#A4907C] mt-1 block">● Real-time synced cash & transfer</span>
        </div>

        {/* COGS */}
        <div className="bg-white p-4 rounded-3xl border border-amber-900/5 shadow-sm">
          <span className="block text-[10px] text-gray-400 uppercase tracking-wider font-bold">{t.finTotalCOGS}</span>
          <span className="block text-xl font-mono font-bold text-amber-700 mt-2">
            -{totalCOGS.toLocaleString('vi-VN')}đ
          </span>
          <span className="text-[9px] text-stone-400 mt-1 block">~ Weight scoops & portion ratios cost</span>
        </div>

        {/* Opex */}
        <div className="bg-white p-4 rounded-3xl border border-amber-900/5 shadow-sm">
          <span className="block text-[10px] text-gray-400 uppercase tracking-wider font-bold">{t.finTotalExpenses}</span>
          <span className="block text-xl font-mono font-bold text-rose-650 text-rose-700 mt-2">
            -{totalOpex.toLocaleString('vi-VN')}đ
          </span>
          <span className="text-[9px] text-stone-400 mt-1 block">Wages, rents, utility, capital spending</span>
        </div>

        {/* Profit margin */}
        <div className="bg-white p-4 rounded-3xl border border-amber-900/5 shadow-sm relative overflow-hidden">
          <span className="block text-[10px] text-gray-400 uppercase tracking-wider font-bold">{t.finNetProfit}</span>
          <span className={`block text-xl font-mono font-bold mt-2 ${netEarnings >= 0 ? 'text-green-700' : 'text-red-500'}`}>
            {netEarnings.toLocaleString('vi-VN')}đ
          </span>
          
          {/* Dynamic ROI% ratio badge */}
          <div className="absolute right-3 bottom-3 bg-[#A4907C]/20 text-[#4A3E3E] text-[9.5px] font-bold py-0.5 px-2 rounded-full border border-brand-sage/20 font-mono">
            ROI: {roiRatio.toFixed(1)}%
          </div>
        </div>

      </div>

      {/* Main sections Expense Input and General Ledger list */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        
        {/* Left: Input Operational Expense Form */}
        <div className="bg-white p-5 rounded-3xl border border-amber-900/5 shadow-sm space-y-4">
          <h4 className="text-xs font-bold uppercase tracking-wider text-[#4A3E3E] border-b pb-1.5">
            {t.finAddExpense}
          </h4>

          <form onSubmit={handleCreateExpenseSubmit} className="space-y-3">
            <div>
              <label className="block text-[10px] uppercase font-bold text-gray-500 mb-1">{t.finSelectCategory}</label>
              <select
                value={expenseCategory}
                onChange={e => setExpenseCategory(e.target.value as any)}
                className="w-full text-xs border rounded-xl p-2 bg-[#FDFBF7]/30 focus:outline-none"
              >
                <option value="utilities">⚡ {t.finUtilities}</option>
                <option value="rent">🏠 {t.finRent}</option>
                <option value="labor">👷 {t.finLabor}</option>
                <option value="repair">🛠️ {t.finRepair}</option>
                <option value="equipment">🔧 {t.finEquipment}</option>
                <option value="ingredients">🛒 {t.finIngredients}</option>
                <option value="other">💬 {t.finOther}</option>
              </select>
            </div>

            <div>
              <label className="block text-[10px] uppercase font-bold text-gray-500 mb-1">{t.finAmount}</label>
              <input
                type="number"
                value={expenseAmount <= 0 ? '' : expenseAmount}
                onChange={e => setExpenseAmount(Math.max(0, parseInt(e.target.value) || 0))}
                placeholder={isVi ? 'Đơn vị: VNĐ...' : 'Amount in VNĐ...'}
                className="w-full text-xs border rounded-xl p-2 bg-[#FDFBF7]/30 focus:ring-1 focus:ring-amber-500"
              />
            </div>

            {isAdmin && (
              <div>
                <label className="block text-[10px] uppercase font-bold text-gray-500 mb-1">
                  {isVi ? 'Gán cho chi nhánh' : 'Assign to Branch'}
                </label>
                <select
                  value={targetBranchExpense}
                  onChange={e => setTargetBranchExpense(e.target.value)}
                  className="w-full text-xs border rounded-xl p-2 bg-[#FDFBF7]/30"
                >
                  {branches.map(b => (
                    <option key={b.id} value={b.id}>{b.name}</option>
                  ))}
                </select>
              </div>
            )}

            <div>
              <label className="block text-[10px] uppercase font-bold text-gray-500 mb-1">{t.finDescVi}</label>
              <input
                type="text"
                value={expenseDescVi}
                onChange={e => setExpenseDescVi(e.target.value)}
                placeholder={isVi ? 'Ví dụ: Thanh toán hóa đơn nước tháng 5...' : 'Vietnamese descriptions...'}
                className="w-full text-xs border rounded-xl p-2 bg-[#FDFBF7]/30"
              />
            </div>

            <div>
              <label className="block text-[10px] uppercase font-bold text-gray-500 mb-1">{t.finDescEn}</label>
              <input
                type="text"
                value={expenseDescEn}
                onChange={e => setExpenseDescEn(e.target.value)}
                placeholder="Example: Water utility payment May-2026..."
                className="w-full text-xs border rounded-xl p-2 bg-[#FDFBF7]/30"
              />
            </div>

            <button
              type="submit"
              className="w-full bg-[#4A3E3E] hover:bg-amber-950 text-white font-medium text-xs py-2 px-4 rounded-xl shadow-md transition cursor-pointer"
            >
              📝 {isVi ? 'Ghi sổ giao dịch' : 'Post Transaction Ledger'}
            </button>
          </form>
        </div>

        {/* Right: Detailed General Ledger Accounts scrollable list */}
        <div className="md:col-span-2 bg-white p-5 rounded-3xl border border-amber-900/5 shadow-sm space-y-4">
          <h4 className="text-xs font-bold uppercase tracking-wider text-[#4A3E3E] border-b pb-1.5">
            📰 {t.finGeneralLedger}
          </h4>
          
          <div className="space-y-2.5 max-h-[360px] overflow-y-auto">
            {/* Orders ledger stream */}
            {filteredOrders.length === 0 && filteredExpenses.length === 0 ? (
              <p className="text-gray-400 italic text-xs py-10 text-center">
                {isVi ? 'Chưa ghi nhận dòng doanh thu hay chi đặt hàng nào.' : 'General ledger accounts remain idle.'}
              </p>
            ) : (
              <>
                {/* Consolidating and sorting logs chronologically */}
                {[
                  ...filteredOrders.map(o => ({
                    type: 'credit' as const,
                    date: o.date,
                    amount: o.total,
                    descVi: `Doanh thu bán kem - Bill #${o.id.slice(-6)} tại ${branches.find(b => b.id === o.branchId)?.name}`,
                    descEn: `Ice cream revenue - Bill #${o.id.slice(-6)} at ${branches.find(b => b.id === o.branchId)?.name}`
                  })),
                  ...filteredExpenses.map(e => ({
                    type: 'debit' as const,
                    date: e.date,
                    amount: e.amount,
                    descVi: `[Chi ${e.category.toUpperCase()}] ${e.descriptionVi} (${branches.find(b => b.id === e.branchId)?.name})`,
                    descEn: `[OPEX ${e.category.toUpperCase()}] ${e.descriptionEn} (${branches.find(b => b.id === e.branchId)?.name})`
                  }))
                ]
                  .sort((a, b) => b.date.localeCompare(a.date))
                  .map((item, id) => (
                    <div
                      key={id}
                      className="flex items-center justify-between text-xs font-mono border-b border-stone-50 pb-2 hover:bg-stone-50/50"
                    >
                      <div className="space-y-0.5 max-w-[70%]">
                        <span className="text-[9.5px] text-gray-400 block font-mono">
                          [{item.date}]
                        </span>
                        <span className="text-stone-700 leading-tight block">
                          {isVi ? item.descVi : item.descEn}
                        </span>
                      </div>
                      <span className={`font-bold ${item.type === 'credit' ? 'text-green-700' : 'text-rose-650 text-rose-700'}`}>
                        {item.type === 'credit' ? '+' : '-'}{item.amount.toLocaleString()}đ
                      </span>
                    </div>
                  ))
                }
              </>
            )}
          </div>
        </div>

      </div>
    </div>
  );
};
