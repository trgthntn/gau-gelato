/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import { Order, Branch, Language } from '../types';

interface InvoiceModalProps {
  order: Order;
  branch: Branch;
  lang: Language;
  onUpdateInvoice: (status: 'issued' | 'replaced' | 'canceled', invoiceCode: string, editExplain?: string) => void;
  onClose: () => void;
}

export const InvoiceModal: React.FC<InvoiceModalProps> = ({
  order,
  branch,
  lang,
  onUpdateInvoice,
  onClose
}) => {
  const isVi = lang === 'vi';
  
  // Local state for buyer credentials
  const [buyerName, setBuyerName] = useState(order.memberPhone ? 'Thành viên Gấu Thân Thiết' : 'Khách hàng lẻ');
  const [buyerCompany, setBuyerCompany] = useState('');
  const [buyerMst, setBuyerMst] = useState('');
  const [buyerAddress, setBuyerAddress] = useState('');
  const [buyerEmail, setBuyerEmail] = useState('');
  const [reasonExplain, setReasonExplain] = useState('');
  
  // API logs states
  const [isTransmitting, setIsTransmitting] = useState(false);
  const [apiLogs, setApiLogs] = useState<string[]>([]);
  const [activeInvoiceCode, setActiveInvoiceCode] = useState(order.invoiceCode || '');
  const [activeStatus, setActiveStatus] = useState(order.invoiceStatus);

  // Simulates standard RESTful E-Invoice transmission payload
  const triggerInvoiceApi = (action: 'CREATE' | 'REPLACE_TYPO' | 'REPLACE_BILL_EDIT' | 'CANCEL') => {
    setIsTransmitting(true);
    setApiLogs([]);
    
    let step1 = `[POST] Initializing secure connection to S-Invoice/VNPT E-Invoice Gateways...`;
    let step2 = `[PAYLOAD] Sending metadata: MST_SELL: ${branch.mst}, TOTAL: ${order.total}đ, VATRate: ${order.taxRate}%`;
    let step3 = '';
    let step4 = '';
    
    if (action === 'CREATE') {
      step3 = `[TRANSMIT] Emitting new invoice payload for buyer "${buyerName}" (${buyerCompany || 'Individual'})...`;
    } else if (action === 'REPLACE_TYPO') {
      step3 = `[TRANSMIT] Emitting REPLACEMENT invoice for Old Serial: ${activeInvoiceCode || 'HD-2026-0001'}. Reason: Revision of client details: "${reasonExplain || 'Sai thông tin MST'}".`;
    } else if (action === 'REPLACE_BILL_EDIT') {
      step3 = `[TRANSMIT] Emitting REPLACEMENT invoice for Old Serial: ${activeInvoiceCode || 'HD-2026-0001'}. Adjusted pricing: New Total: ${order.total}đ (Previous: ${order.subtotal}đ).`;
    } else {
      step3 = `[TRANSMIT] Sending Cancel request for Invoice: ${activeInvoiceCode}.`;
    }

    const logHistory = [step1, step2, step3];
    
    // Stagger fake logs streaming
    let currentIdx = 0;
    const interval = setInterval(() => {
      if (currentIdx < logHistory.length) {
        setApiLogs(prev => [...prev, logHistory[currentIdx]]);
        currentIdx++;
      } else {
        clearInterval(interval);
        // Completed API request
        setTimeout(() => {
          const generatedCode = `MST-${branch.mst.slice(0, 4)}-${Math.floor(100000 + Math.random() * 900000)}`;
          let resultLog = '';
          let nextStat: 'issued' | 'replaced' | 'canceled' = 'issued';

          if (action === 'CANCEL') {
            resultLog = `[SUCCESS] 200 OK. Invoice ${activeInvoiceCode} marked as VOIDED on Tax Agency registers database.`;
            nextStat = 'canceled';
            setActiveInvoiceCode('');
          } else if (action === 'REPLACE_TYPO' || action === 'REPLACE_BILL_EDIT') {
            resultLog = `[SUCCESS] 200 OK. Replacement invoice generated successfully. Tax Portal ID: ${generatedCode}. Old invoice has been overwritten.`;
            nextStat = 'replaced';
            setActiveInvoiceCode(generatedCode);
          } else {
            resultLog = `[SUCCESS] 201 Created. VAT Electronic invoice registered at Tax Department. Token: ${generatedCode}.`;
            nextStat = 'issued';
            setActiveInvoiceCode(generatedCode);
          }

          setApiLogs(prev => [...prev, resultLog]);
          setIsTransmitting(false);
          setActiveStatus(nextStat);
          onUpdateInvoice(nextStat, generatedCode, reasonExplain);
        }, 1200);
      }
    }, 450);
  };

  return (
    <div className="fixed inset-0 bg-stone-900/60 flex items-center justify-center p-4 z-50 overflow-y-auto no-print">
      <div className="bg-[#FFF7EE] rounded-3xl p-6 max-w-2xl w-full border border-amber-900/10 shadow-2xl space-y-6 max-h-[90vh] overflow-y-auto font-sans">
        
        {/* Header */}
        <div className="flex items-center justify-between border-b border-amber-900/5 pb-3">
          <div className="flex items-center gap-2">
            <div className="bg-[#5B3F23] text-cream-50 p-2 rounded-xl text-white">
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
              </svg>
            </div>
            <div>
              <h3 className="text-lg font-bold text-[#5B3F23]">
                {isVi ? 'Liên Kết Xuất Hóa Đơn Điện Tử' : 'VAT E-Invoice API Portal'}
              </h3>
              <p className="text-xs text-gray-500">
                {isVi ? `Đơn hàng #${order.id} • Tổng: ${order.total.toLocaleString()}đ` : `Bill #${order.id} • Total: ${order.total.toLocaleString()}đ`}
              </p>
            </div>
          </div>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600 bg-stone-100 p-1.5 rounded-full cursor-pointer">
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        {/* Current status info */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="bg-amber-50 p-3 rounded-2xl border border-amber-900/5 text-center">
            <span className="text-[10px] text-gray-500 block uppercase font-bold tracking-wider mb-1">
              {isVi ? 'Trạng thái hóa thân' : 'Current Code Status'}
            </span>
            <span className={`inline-block px-3 py-1 rounded-full text-xs font-semibold ${
              activeStatus === 'issued' ? 'bg-green-100 text-green-800' :
              activeStatus === 'replaced' ? 'bg-indigo-100 text-indigo-800' :
              activeStatus === 'canceled' ? 'bg-red-100 text-red-800' :
              'bg-gray-100 text-gray-800'
            }`}>
              {activeStatus === 'issued' && (isVi ? 'Đã phát hành mới' : 'Issued')}
              {activeStatus === 'replaced' && (isVi ? 'Được Thay Thế' : 'Replaced')}
              {activeStatus === 'canceled' && (isVi ? 'Đã hủy bỏ' : 'Canceled/Voided')}
              {activeStatus === 'not_issued' && (isVi ? 'Chưa xuất' : 'Not Issued')}
            </span>
          </div>

          <div className="bg-amber-50 p-3 rounded-2xl border border-amber-900/5 text-center md:col-span-2">
            <span className="text-[10px] text-gray-500 block uppercase font-bold tracking-wider mb-1">
              {isVi ? 'Mẫu số hóa đơn TCT' : 'Tax Agency Authenticator Serial'}
            </span>
            <span className="font-mono text-xs font-bold text-stone-700">
              {activeInvoiceCode || 'N/A (Chưa được cấp / Not issued)'}
            </span>
          </div>
        </div>

        {/* Invoice Purchaser inputs */}
        <div className="space-y-4 bg-white p-4 rounded-3xl border border-amber-900/5 shadow-sm">
          <h4 className="text-xs font-bold uppercase tracking-wider text-[#5B3F23] border-b pb-1.5">
            {isVi ? 'Thông tin đối tác / Khách hàng xuất hóa đơn' : 'Purchaser / Corporate Financial details'}
          </h4>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-medium text-gray-600 mb-1">{isVi ? 'Tên khách hàng' : 'Purchaser Name'}</label>
              <input
                type="text"
                value={buyerName}
                onChange={e => setBuyerName(e.target.value)}
                className="w-full text-xs border rounded-xl p-2 bg-[#FFF7EE]/30 focus:outline-none focus:ring-1 focus:ring-amber-500"
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-gray-600 mb-1">{isVi ? 'Tên Đơn vị (Doanh nghiệp)' : 'Company Name'}</label>
              <input
                type="text"
                value={buyerCompany}
                onChange={e => setBuyerCompany(e.target.value)}
                placeholder={isVi ? 'Công ty TNHH ABC...' : 'ABC Company Ltd.'}
                className="w-full text-xs border rounded-xl p-2 bg-[#FFF7EE]/30 focus:outline-none focus:ring-1 focus:ring-amber-500"
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-gray-600 mb-1">{isVi ? 'Mã số thuế (MST)' : 'Tax Registration ID (MST)'}</label>
              <input
                type="text"
                value={buyerMst}
                onChange={e => setBuyerMst(e.target.value)}
                placeholder="0312345678"
                className="w-full text-xs border rounded-xl p-2 bg-[#FFF7EE]/30 focus:outline-none focus:ring-1 focus:ring-amber-500"
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-gray-600 mb-1">{isVi ? 'Email nhận hóa đơn' : 'Receipt Invoicing E-mail'}</label>
              <input
                type="text"
                value={buyerEmail}
                onChange={e => setBuyerEmail(e.target.value)}
                placeholder="company@domain.com"
                className="w-full text-xs border rounded-xl p-2 bg-[#FFF7EE]/30 focus:outline-none focus:ring-1 focus:ring-amber-500"
              />
            </div>
            <div className="md:col-span-2">
              <label className="block text-xs font-medium text-gray-600 mb-1">{isVi ? 'Địa chỉ khách hàng' : 'Purchaser Address'}</label>
              <input
                type="text"
                value={buyerAddress}
                onChange={e => setBuyerAddress(e.target.value)}
                placeholder={isVi ? 'Số 123 Đường X, Quận Y, TP. HCM' : '123 X Road, Ward Y, HCMC'}
                className="w-full text-xs border rounded-xl p-2 bg-[#FFF7EE]/30"
              />
            </div>
          </div>
        </div>

        {/* Action triggers */}
        <div className="space-y-3">
          <span className="block text-xs font-bold text-gray-500 uppercase tracking-wider">{isVi ? 'Hành động tích điểm E-Invoice' : 'E-Invoice API Action Control'}</span>
          <div className="flex flex-wrap gap-2.5">
            {activeStatus === 'not_issued' ? (
              <button
                onClick={() => triggerInvoiceApi('CREATE')}
                disabled={isTransmitting}
                className="bg-[#5B3F23] hover:bg-amber-950 text-white font-medium text-xs py-2.5 px-4 rounded-xl shadow-md cursor-pointer transition flex items-center gap-1.5 disabled:opacity-50"
              >
                <span>{isVi ? '⚡ Phát hành hóa đơn VAT Mới' : '⚡ Issue New VAT Invoice'}</span>
              </button>
            ) : (
              <>
                {/* Typo correction replacement */}
                <div className="w-full bg-[#FFF7EE]/10 p-3 rounded-2xl border border-amber-900/5 space-y-2.5">
                  <div>
                    <label className="block text-xs font-medium text-gray-600 mb-1">
                      {isVi ? 'Lý do điều chỉnh / thay thế' : 'Reason for correction/replacement'}
                    </label>
                    <input
                      type="text"
                      value={reasonExplain}
                      onChange={e => setReasonExplain(e.target.value)}
                      placeholder={isVi ? 'Nhập lý do (ví dụ: Thay thế do viết sai MST khách hàng)...' : 'Input justification (e.g. Typo in buyer tax ID)...'}
                      className="w-full text-xs border rounded-xl p-2 bg-white"
                    />
                  </div>
                  <div className="flex gap-2">
                    <button
                      onClick={() => triggerInvoiceApi('REPLACE_TYPO')}
                      disabled={isTransmitting || !reasonExplain}
                      className="bg-indigo-600 hover:bg-indigo-700 text-white font-medium text-xs py-2 px-3 rounded-lg flex-1 cursor-pointer disabled:opacity-40 transition"
                    >
                      {isVi ? '🔄 Phát hành Thay thế (Sai thông tin)' : '🔄 Emit Replace (Incorrect Details)'}
                    </button>
                    
                    <button
                      onClick={() => triggerInvoiceApi('REPLACE_BILL_EDIT')}
                      disabled={isTransmitting}
                      className="bg-amber-600 hover:bg-amber-700 text-white font-medium text-xs py-2 px-3 rounded-lg flex-1 cursor-pointer disabled:opacity-40 transition"
                    >
                      {isVi ? '✍️ Phát hành Thay thế (Sửa đơn hóa)' : '✍️ Emit Replace (Edited Order)'}
                    </button>
                    
                    <button
                      onClick={() => triggerInvoiceApi('CANCEL')}
                      disabled={isTransmitting}
                      className="bg-red-600 hover:bg-red-700 text-white font-medium text-xs py-2 px-3 rounded-lg cursor-pointer transition disabled:opacity-50"
                    >
                      {isVi ? '❌ Hủy hóa đơn gốc' : '❌ Cancel Original'}
                    </button>
                  </div>
                </div>
              </>
            )}
          </div>
        </div>

        {/* Live E-Invoice API Terminal logs */}
        <div className="bg-stone-900 text-green-400 p-4 rounded-2xl font-mono text-xs space-y-1.5 h-36 overflow-y-auto shadow-inner border border-stone-800">
          <div className="text-gray-400 border-b border-stone-800 pb-1 flex items-center justify-between">
            <span>{isVi ? '🤖 LOG DIỄN TIẾN API TRỰC TUYẾN' : '🤖 API LIVE CONNECTION LOGGER'}</span>
            {isTransmitting && <span className="animate-pulse text-amber-500">Connecting...</span>}
          </div>
          {apiLogs.length === 0 ? (
            <p className="text-stone-500 italic mt-2">
              {isVi ? 'Chờ kích hoạt lệnh xuất hóa đơn điện tử...' : 'Waiting for e-invoicing transmission actions...'}
            </p>
          ) : (
            apiLogs.map((log, idx) => (
              <p
                key={idx}
                className={
                  log.startsWith('[SUCCESS]') ? 'text-green-300 font-semibold' :
                  log.startsWith('[POST]') ? 'text-blue-300' :
                  log.startsWith('[PAYLOAD]') ? 'text-yellow-200' :
                  'text-amber-100'
                }
              >
                {log}
              </p>
            ))
          )}
        </div>

        {/* Success notify badge */}
        {order.invoiceStatus !== 'not_issued' && !isTransmitting && (
          <div className="bg-green-50 text-green-800 p-3 rounded-2xl text-xs flex items-center gap-2 border border-green-200">
            <svg className="w-4 h-4 text-green-600" fill="currentColor" viewBox="0 0 20 20">
              <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
            </svg>
            <span>{isVi ? 'Liên kết API hoàn tất! Hóa đơn điện tử của khách hàng đã sẵn sàng tra cứu.' : 'API connection ready! Guest electronic invoice has been parsed tax validated.'}</span>
          </div>
        )}

      </div>
    </div>
  );
};
