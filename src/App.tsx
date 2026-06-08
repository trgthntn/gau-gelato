/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect, useRef } from 'react';
import { 
  Language, Branch, Staff, Flavor, Topping, Accompaniment, 
  Voucher, LoyaltyMember, Order, OrderItem, OperationalExpense, AuditLog, InventoryLog 
} from './types';
import { 
  INITIAL_BRANCHES, INITIAL_STAFF, INITIAL_FLAVORS, 
  INITIAL_TOPPINGS, INITIAL_ACCOMPANIMENTS, INITIAL_VOUCHERS, INITIAL_MEMBERS, getFlavorSvg 
} from './data';
import { LOCALES } from './locales';

import { 
  db, 
  dbSaveBranch, dbDeleteBranch, 
  dbSaveStaff, dbDeleteStaff, 
  dbSaveFlavor, dbDeleteFlavor, 
  dbSaveTopping, dbDeleteTopping, 
  dbSaveAccompaniment, dbDeleteAccompaniment, 
  dbSaveVoucher, dbDeleteVoucher, 
  dbSaveMember, dbDeleteMember, 
  dbSaveOrder, dbDeleteOrder, 
  dbSaveExpense, dbDeleteExpense, 
  dbSaveAuditLog, dbSaveInventoryLog, dbSaveBranchStock,
  handleFirestoreError, OperationType, shouldSkipFirestore
} from './firebase';
import { 
  collection, doc, getDocs, onSnapshot, writeBatch, query, limit 
} from 'firebase/firestore';

// Subcomponents imports
import { Receipt80mm } from './components/Receipt80mm';
import { InvoiceModal } from './components/InvoiceModal';
import { AndroidEmulator } from './components/AndroidEmulator';
import { ZaloSimulator } from './components/ZaloSimulator';
import { InventoryManager } from './components/InventoryManager';
import { FinanceManager } from './components/FinanceManager';
import { AdminManager } from './components/AdminManager';

export default function App() {
  // Helper functions to get initial/cached JSON representing the seed
  const getCachedBranches = () => {
    try {
      const stored = localStorage.getItem('gg_branches');
      return stored ? JSON.parse(stored) : INITIAL_BRANCHES;
    } catch (e) {
      return INITIAL_BRANCHES;
    }
  };
  const getCachedStaff = () => {
    try {
      const stored = localStorage.getItem('gg_staff');
      return stored ? JSON.parse(stored) : INITIAL_STAFF;
    } catch (e) {
      return INITIAL_STAFF;
    }
  };
  const getCachedFlavors = () => {
    try {
      const stored = localStorage.getItem('gg_flavors');
      return stored ? JSON.parse(stored) : INITIAL_FLAVORS;
    } catch (e) {
      return INITIAL_FLAVORS;
    }
  };
  const getCachedToppings = () => {
    try {
      const stored = localStorage.getItem('gg_toppings');
      return stored ? JSON.parse(stored) : INITIAL_TOPPINGS;
    } catch (e) {
      return INITIAL_TOPPINGS;
    }
  };
  const getCachedAccompaniments = () => {
    try {
      const stored = localStorage.getItem('gg_accompaniments');
      return stored ? JSON.parse(stored) : INITIAL_ACCOMPANIMENTS;
    } catch (e) {
      return INITIAL_ACCOMPANIMENTS;
    }
  };
  const getCachedVouchers = () => {
    try {
      const stored = localStorage.getItem('gg_vouchers');
      return stored ? JSON.parse(stored) : INITIAL_VOUCHERS;
    } catch (e) {
      return INITIAL_VOUCHERS;
    }
  };
  const getCachedMembers = () => {
    try {
      const stored = localStorage.getItem('gg_members');
      return stored ? JSON.parse(stored) : INITIAL_MEMBERS;
    } catch (e) {
      return INITIAL_MEMBERS;
    }
  };
  const getCachedOrders = () => {
    try {
      const stored = localStorage.getItem('gg_orders');
      return stored ? JSON.parse(stored) : [];
    } catch (e) {
      return [];
    }
  };
  const getCachedExpenses = () => {
    try {
      const stored = localStorage.getItem('gg_expenses');
      return stored ? JSON.parse(stored) : [];
    } catch (e) {
      return [];
    }
  };
  const getCachedAudits = () => {
    try {
      const stored = localStorage.getItem('gg_audits');
      return stored ? JSON.parse(stored) : [];
    } catch (e) {
      return [];
    }
  };
  const getCachedInventoryLogs = () => {
    try {
      const stored = localStorage.getItem('gg_inventory_logs');
      return stored ? JSON.parse(stored) : [];
    } catch (e) {
      return [];
    }
  };
  const getCachedStocks = () => {
    let stocks: Record<string, Record<string, number>> = {};
    try {
      const stored = localStorage.getItem('gg_stocks');
      if (stored) stocks = JSON.parse(stored);
    } catch (e) {}

    // Ensure all individual branches are initialized
    INITIAL_BRANCHES.forEach(b => {
      if (!stocks[b.id]) stocks[b.id] = {};
      INITIAL_FLAVORS.forEach(f => {
        if (stocks[b.id][f.id] === undefined) stocks[b.id][f.id] = f.stockGrams;
      });
      INITIAL_TOPPINGS.forEach(t => {
        if (stocks[b.id][t.id] === undefined) stocks[b.id][t.id] = t.stockQuantity;
      });
      INITIAL_ACCOMPANIMENTS.forEach(a => {
        if (stocks[b.id][a.id] === undefined) stocks[b.id][a.id] = a.stockQuantity;
      });
    });

    // Ensure 'central' (Kho tổng) is initialized with higher stocks
    if (!stocks['central']) stocks['central'] = {};
    INITIAL_FLAVORS.forEach(f => {
      if (stocks['central'][f.id] === undefined) stocks['central'][f.id] = f.stockGrams * 10; // 10x capacity for central
    });
    INITIAL_TOPPINGS.forEach(t => {
      if (stocks['central'][t.id] === undefined) stocks['central'][t.id] = t.stockQuantity * 5; // 5x capacity for central
    });
    INITIAL_ACCOMPANIMENTS.forEach(a => {
      if (stocks['central'][a.id] === undefined) stocks['central'][a.id] = a.stockQuantity * 5; // 5x capacity for central
    });

    return stocks;
  };

  // --- 1. CORE ENTERPRISE STATE (PERSISTED IN FIRESTORE & LOCALSTORAGE) ---
  const [lang, setLang] = useState<Language>('vi');
  const [branches, setBranches] = useState<Branch[]>(getCachedBranches);
  const [staff, setStaff] = useState<Staff[]>(getCachedStaff);
  const [flavors, setFlavors] = useState<Flavor[]>(getCachedFlavors);
  const [toppings, setToppings] = useState<Topping[]>(getCachedToppings);
  const [accompaniments, setAccompaniments] = useState<Accompaniment[]>(getCachedAccompaniments);
  const [vouchers, setVouchers] = useState<Voucher[]>(getCachedVouchers);
  const [members, setMembers] = useState<LoyaltyMember[]>(getCachedMembers);
  const [orders, setOrders] = useState<Order[]>(getCachedOrders);
  const [expenses, setExpenses] = useState<OperationalExpense[]>(getCachedExpenses);
  const [auditLogs, setAuditLogs] = useState<AuditLog[]>(getCachedAudits);
  const [inventoryLogs, setInventoryLogs] = useState<InventoryLog[]>(getCachedInventoryLogs);
  const [branchStocks, setBranchStocks] = useState<Record<string, Record<string, number>>>(getCachedStocks);

  // System Setup State
  const [isDataLoaded, setIsDataLoaded] = useState(false);
  const [isQuotaExceeded, setIsQuotaExceeded] = useState(!!(window as any).isFirestoreExhausted);
  const [isOffline, setIsOffline] = useState(!!(window as any).isFirestoreOffline);

  useEffect(() => {
    (window as any).onFirestoreErrorTriggered = (msg: string, isQuota: boolean) => {
      if (isQuota) {
        setIsQuotaExceeded(true);
      } else {
        setIsOffline(true);
      }
    };
    return () => {
      delete (window as any).onFirestoreErrorTriggered;
    };
  }, []);

  // Keep track of the values loaded from Firestore to avoid feedback loops
  const prevBranchesRef = useRef<string>(JSON.stringify(getCachedBranches()));
  const prevStaffRef = useRef<string>(JSON.stringify(getCachedStaff()));
  const prevFlavorsRef = useRef<string>(JSON.stringify(getCachedFlavors()));
  const prevToppingsRef = useRef<string>(JSON.stringify(getCachedToppings()));
  const prevAccompanimentsRef = useRef<string>(JSON.stringify(getCachedAccompaniments()));
  const prevVouchersRef = useRef<string>(JSON.stringify(getCachedVouchers()));
  const prevMembersRef = useRef<string>(JSON.stringify(getCachedMembers()));
  const prevOrdersRef = useRef<string>(JSON.stringify(getCachedOrders()));
  const prevExpensesRef = useRef<string>(JSON.stringify(getCachedExpenses()));
  const prevAuditLogsRef = useRef<string>(JSON.stringify(getCachedAudits()));
  const prevInventoryLogsRef = useRef<string>(JSON.stringify(getCachedInventoryLogs()));
  const prevStocksRef = useRef<string>(JSON.stringify(getCachedStocks()));

  const checkAndSeed = async () => {
    if (shouldSkipFirestore()) {
      console.log("Firestore quota limit exceeded. Skipping seating.");
      return;
    }
    try {
      const q = query(collection(db, 'branches'), limit(1));
      const snap = await getDocs(q);
      if (snap.empty) {
        console.log("Seeding Firestore with GG Gelato initial values...");
        const batch = writeBatch(db);
        
        INITIAL_BRANCHES.forEach(b => {
          batch.set(doc(db, 'branches', b.id), b);
        });
        INITIAL_STAFF.forEach(s => {
          batch.set(doc(db, 'staff', s.id), s);
        });
        INITIAL_FLAVORS.forEach(f => {
          batch.set(doc(db, 'flavors', f.id), f);
        });
        INITIAL_TOPPINGS.forEach(t => {
          batch.set(doc(db, 'toppings', t.id), t);
        });
        INITIAL_ACCOMPANIMENTS.forEach(a => {
          batch.set(doc(db, 'accompaniments', a.id), a);
        });
        INITIAL_VOUCHERS.forEach(v => {
          batch.set(doc(db, 'vouchers', v.code), v);
        });
        INITIAL_MEMBERS.forEach(m => {
          batch.set(doc(db, 'members', m.phone), m);
        });
        
        INITIAL_BRANCHES.forEach(b => {
          const stocks: Record<string, number> = {};
          INITIAL_FLAVORS.forEach(f => { stocks[f.id] = f.stockGrams; });
          INITIAL_TOPPINGS.forEach(t => { stocks[t.id] = t.stockQuantity; });
          INITIAL_ACCOMPANIMENTS.forEach(a => { stocks[a.id] = a.stockQuantity; });
          batch.set(doc(db, 'branchStocks', b.id), { branchId: b.id, stocks });
        });

        await batch.commit();
        console.log("Firestore Seeding Complete!");
      }
    } catch (e) {
      console.error("Seeding Error:", e);
      handleFirestoreError(e, OperationType.LIST, 'branches');
    }
  };

  // Load from Firestore with Real-Time Subscriptions
  useEffect(() => {
    let isSubscribed = true;

    if (shouldSkipFirestore() || isQuotaExceeded) {
      console.log("Firestore quota limit exceeded or offline fallback active. Initializing locally with cached storage.");
      setIsDataLoaded(true);
      setIsQuotaExceeded(true);
      return;
    }

    checkAndSeed().then(() => {
      if (!isSubscribed || shouldSkipFirestore() || isQuotaExceeded) return;

      const unsubBranches = onSnapshot(collection(db, 'branches'), (snap) => {
        const list: Branch[] = [];
        snap.forEach(doc => list.push(doc.data() as Branch));
        prevBranchesRef.current = JSON.stringify(list);
        setBranches(list);
      }, (err) => handleFirestoreError(err, OperationType.LIST, 'branches'));

      const unsubStaff = onSnapshot(collection(db, 'staff'), (snap) => {
        const list: Staff[] = [];
        snap.forEach(doc => list.push(doc.data() as Staff));
        prevStaffRef.current = JSON.stringify(list);
        setStaff(list);
      }, (err) => handleFirestoreError(err, OperationType.LIST, 'staff'));

      const unsubFlavors = onSnapshot(collection(db, 'flavors'), (snap) => {
        const list: Flavor[] = [];
        snap.forEach(doc => list.push(doc.data() as Flavor));
        prevFlavorsRef.current = JSON.stringify(list);
        setFlavors(list);
      }, (err) => handleFirestoreError(err, OperationType.LIST, 'flavors'));

      const unsubToppings = onSnapshot(collection(db, 'toppings'), (snap) => {
        const list: Topping[] = [];
        snap.forEach(doc => list.push(doc.data() as Topping));
        prevToppingsRef.current = JSON.stringify(list);
        setToppings(list);
      }, (err) => handleFirestoreError(err, OperationType.LIST, 'toppings'));

      const unsubAcc = onSnapshot(collection(db, 'accompaniments'), (snap) => {
        const list: Accompaniment[] = [];
        snap.forEach(doc => list.push(doc.data() as Accompaniment));
        prevAccompanimentsRef.current = JSON.stringify(list);
        setAccompaniments(list);
      }, (err) => handleFirestoreError(err, OperationType.LIST, 'accompaniments'));

      const unsubVouchers = onSnapshot(collection(db, 'vouchers'), (snap) => {
        const list: Voucher[] = [];
        snap.forEach(doc => list.push(doc.data() as Voucher));
        prevVouchersRef.current = JSON.stringify(list);
        setVouchers(list);
      }, (err) => handleFirestoreError(err, OperationType.LIST, 'vouchers'));

      const unsubMembers = onSnapshot(collection(db, 'members'), (snap) => {
        const list: LoyaltyMember[] = [];
        snap.forEach(doc => list.push(doc.data() as LoyaltyMember));
        prevMembersRef.current = JSON.stringify(list);
        setMembers(list);
      }, (err) => handleFirestoreError(err, OperationType.LIST, 'members'));

      const unsubOrders = onSnapshot(collection(db, 'orders'), (snap) => {
        const list: Order[] = [];
        snap.forEach(doc => list.push(doc.data() as Order));
        list.sort((a, b) => b.id.localeCompare(a.id));
        prevOrdersRef.current = JSON.stringify(list);
        setOrders(list);
      }, (err) => handleFirestoreError(err, OperationType.LIST, 'orders'));

      const unsubExpenses = onSnapshot(collection(db, 'expenses'), (snap) => {
        const list: OperationalExpense[] = [];
        snap.forEach(doc => list.push(doc.data() as OperationalExpense));
        list.sort((a, b) => b.id.localeCompare(a.id));
        prevExpensesRef.current = JSON.stringify(list);
        setExpenses(list);
      }, (err) => handleFirestoreError(err, OperationType.LIST, 'expenses'));

      const unsubAudits = onSnapshot(collection(db, 'auditLogs'), (snap) => {
        const list: AuditLog[] = [];
        snap.forEach(doc => list.push(doc.data() as AuditLog));
        list.sort((a, b) => b.id.localeCompare(a.id));
        prevAuditLogsRef.current = JSON.stringify(list);
        setAuditLogs(list);
      }, (err) => handleFirestoreError(err, OperationType.LIST, 'auditLogs'));

      const unsubInv = onSnapshot(collection(db, 'inventoryLogs'), (snap) => {
        const list: InventoryLog[] = [];
        snap.forEach(doc => list.push(doc.data() as InventoryLog));
        list.sort((a, b) => b.id.localeCompare(a.id));
        prevInventoryLogsRef.current = JSON.stringify(list);
        setInventoryLogs(list);
      }, (err) => handleFirestoreError(err, OperationType.LIST, 'inventoryLogs'));

      const unsubStocks = onSnapshot(collection(db, 'branchStocks'), (snap) => {
        const stocksMap: Record<string, Record<string, number>> = {};
        snap.forEach(doc => {
          const d = doc.data();
          stocksMap[d.branchId] = d.stocks;
        });
        prevStocksRef.current = JSON.stringify(stocksMap);
        setBranchStocks(stocksMap);
      }, (err) => handleFirestoreError(err, OperationType.LIST, 'branchStocks'));

      setIsDataLoaded(true);

      return () => {
        isSubscribed = false;
        unsubBranches();
        unsubStaff();
        unsubFlavors();
        unsubToppings();
        unsubAcc();
        unsubVouchers();
        unsubMembers();
        unsubOrders();
        unsubExpenses();
        unsubAudits();
        unsubInv();
        unsubStocks();
      };
    });
  }, [isQuotaExceeded]);

  // Sync edits dynamically back to Firestore (Loop-Protected)
  useEffect(() => {
    if (!isDataLoaded) return;

    // Branches
    const branchesJson = JSON.stringify(branches);
    if (branchesJson !== prevBranchesRef.current) {
      const prev = JSON.parse(prevBranchesRef.current) as Branch[];
      branches.forEach(b => {
        const old = prev.find(o => o.id === b.id);
        if (!old || JSON.stringify(old) !== JSON.stringify(b)) {
          dbSaveBranch(b);
        }
      });
      prev.forEach(p => {
        if (!branches.some(b => b.id === p.id)) {
          dbDeleteBranch(p.id);
        }
      });
      prevBranchesRef.current = branchesJson;
    }

    // Staff
    const staffJson = JSON.stringify(staff);
    if (staffJson !== prevStaffRef.current) {
      const prev = JSON.parse(prevStaffRef.current) as Staff[];
      staff.forEach(s => {
        const old = prev.find(o => o.id === s.id);
        if (!old || JSON.stringify(old) !== JSON.stringify(s)) {
          dbSaveStaff(s);
        }
      });
      prev.forEach(p => {
        if (!staff.some(s => s.id === p.id)) {
          dbDeleteStaff(p.id);
        }
      });
      prevStaffRef.current = staffJson;
    }

    // Flavors
    const flavorsJson = JSON.stringify(flavors);
    if (flavorsJson !== prevFlavorsRef.current) {
      const prev = JSON.parse(prevFlavorsRef.current) as Flavor[];
      flavors.forEach(f => {
        const old = prev.find(o => o.id === f.id);
        if (!old || JSON.stringify(old) !== JSON.stringify(f)) {
          dbSaveFlavor(f);
        }
      });
      prev.forEach(p => {
        if (!flavors.some(f => f.id === p.id)) {
          dbDeleteFlavor(p.id);
        }
      });
      prevFlavorsRef.current = flavorsJson;
    }

    // Toppings
    const toppingsJson = JSON.stringify(toppings);
    if (toppingsJson !== prevToppingsRef.current) {
      const prev = JSON.parse(prevToppingsRef.current) as Topping[];
      toppings.forEach(t => {
        const old = prev.find(o => o.id === t.id);
        if (!old || JSON.stringify(old) !== JSON.stringify(t)) {
          dbSaveTopping(t);
        }
      });
      prev.forEach(p => {
        if (!toppings.some(t => t.id === p.id)) {
          dbDeleteTopping(p.id);
        }
      });
      prevToppingsRef.current = toppingsJson;
    }

    // Accompaniments
    const accompanimentsJson = JSON.stringify(accompaniments);
    if (accompanimentsJson !== prevAccompanimentsRef.current) {
      const prev = JSON.parse(prevAccompanimentsRef.current) as Accompaniment[];
      accompaniments.forEach(a => {
        const old = prev.find(o => o.id === a.id);
        if (!old || JSON.stringify(old) !== JSON.stringify(a)) {
          dbSaveAccompaniment(a);
        }
      });
      prev.forEach(p => {
        if (!accompaniments.some(a => a.id === p.id)) {
          dbDeleteAccompaniment(p.id);
        }
      });
      prevAccompanimentsRef.current = accompanimentsJson;
    }

    // Vouchers
    const vouchersJson = JSON.stringify(vouchers);
    if (vouchersJson !== prevVouchersRef.current) {
      const prev = JSON.parse(prevVouchersRef.current) as Voucher[];
      vouchers.forEach(v => {
        const old = prev.find(o => o.code === v.code);
        if (!old || JSON.stringify(old) !== JSON.stringify(v)) {
          dbSaveVoucher(v);
        }
      });
      prev.forEach(p => {
        if (!vouchers.some(v => v.code === p.code)) {
          dbDeleteVoucher(p.code);
        }
      });
      prevVouchersRef.current = vouchersJson;
    }

    // Members
    const membersJson = JSON.stringify(members);
    if (membersJson !== prevMembersRef.current) {
      const prev = JSON.parse(prevMembersRef.current) as LoyaltyMember[];
      members.forEach(m => {
        const old = prev.find(o => o.phone === m.phone);
        if (!old || JSON.stringify(old) !== JSON.stringify(m)) {
          dbSaveMember(m);
        }
      });
      prev.forEach(p => {
        if (!members.some(m => m.phone === p.phone)) {
          dbDeleteMember(p.phone);
        }
      });
      prevMembersRef.current = membersJson;
    }

    // Orders
    const ordersJson = JSON.stringify(orders);
    if (ordersJson !== prevOrdersRef.current) {
      const prev = JSON.parse(prevOrdersRef.current) as Order[];
      orders.forEach(o => {
        const old = prev.find(oldO => oldO.id === o.id);
        if (!old || JSON.stringify(old) !== JSON.stringify(o)) {
          dbSaveOrder(o);
        }
      });
      prev.forEach(p => {
        if (!orders.some(o => o.id === p.id)) {
          dbDeleteOrder(p.id);
        }
      });
      prevOrdersRef.current = ordersJson;
    }

    // Expenses
    const expensesJson = JSON.stringify(expenses);
    if (expensesJson !== prevExpensesRef.current) {
      const prev = JSON.parse(prevExpensesRef.current) as OperationalExpense[];
      expenses.forEach(e => {
        const old = prev.find(oldE => oldE.id === e.id);
        if (!old || JSON.stringify(old) !== JSON.stringify(e)) {
          dbSaveExpense(e);
        }
      });
      prev.forEach(p => {
        if (!expenses.some(e => e.id === p.id)) {
          dbDeleteExpense(p.id);
        }
      });
      prevExpensesRef.current = expensesJson;
    }

    // Audit Logs
    const auditLogsJson = JSON.stringify(auditLogs);
    if (auditLogsJson !== prevAuditLogsRef.current) {
      const prev = JSON.parse(prevAuditLogsRef.current) as AuditLog[];
      auditLogs.forEach(al => {
        const old = prev.find(o => o.id === al.id);
        if (!old) {
          dbSaveAuditLog(al);
        }
      });
      prevAuditLogsRef.current = auditLogsJson;
    }

    // Inventory Logs
    const inventoryLogsJson = JSON.stringify(inventoryLogs);
    if (inventoryLogsJson !== prevInventoryLogsRef.current) {
      const prev = JSON.parse(prevInventoryLogsRef.current) as InventoryLog[];
      inventoryLogs.forEach(il => {
        const old = prev.find(o => o.id === il.id);
        if (!old) {
          dbSaveInventoryLog(il);
        }
      });
      prevInventoryLogsRef.current = inventoryLogsJson;
    }

    // Branch Stocks
    const stocksJson = JSON.stringify(branchStocks);
    if (stocksJson !== prevStocksRef.current) {
      const prev = JSON.parse(prevStocksRef.current) as Record<string, Record<string, number>>;
      Object.keys(branchStocks).forEach(bId => {
        const curStocks = branchStocks[bId];
        const oldStocks = prev[bId];
        if (!oldStocks || JSON.stringify(oldStocks) !== JSON.stringify(curStocks)) {
          dbSaveBranchStock(bId, curStocks);
        }
      });
      prevStocksRef.current = stocksJson;
    }

    // Safe redundancies to local storage for instant cold-starts
    localStorage.setItem('gg_branches', branchesJson);
    localStorage.setItem('gg_staff', staffJson);
    localStorage.setItem('gg_flavors', flavorsJson);
    localStorage.setItem('gg_toppings', toppingsJson);
    localStorage.setItem('gg_accompaniments', accompanimentsJson);
    localStorage.setItem('gg_vouchers', vouchersJson);
    localStorage.setItem('gg_members', membersJson);
    localStorage.setItem('gg_orders', ordersJson);
    localStorage.setItem('gg_expenses', expensesJson);
    localStorage.setItem('gg_audits', auditLogsJson);
    localStorage.setItem('gg_inventory_logs', inventoryLogsJson);
    localStorage.setItem('gg_stocks', stocksJson);

  }, [branches, staff, flavors, toppings, accompaniments, vouchers, members, orders, expenses, auditLogs, inventoryLogs, branchStocks, isDataLoaded]);

  // --- OFFLINE BACKUP & RESTORE SYSTEMS ---
  const exportLocalBackup = () => {
    const backup: Record<string, any> = {};
    const keys = [
      'gg_branches', 'gg_staff', 'gg_flavors', 'gg_toppings', 'gg_accompaniments',
      'gg_vouchers', 'gg_members', 'gg_orders', 'gg_expenses', 'gg_audits',
      'gg_inventory_logs', 'gg_stocks'
    ];
    keys.forEach(k => {
      try {
        const stored = localStorage.getItem(k);
        backup[k] = stored ? JSON.parse(stored) : null;
      } catch (e) {}
    });
    const blob = new Blob([JSON.stringify(backup, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `GG_Gelato_LocalDB_Backup_${new Date().toISOString().split('T')[0]}.json`;
    a.click();
    URL.revokeObjectURL(url);
    
    alert(lang === 'vi' 
      ? 'Đã tải xuống file sao lưu cơ sở dữ liệu cục bộ thành công!' 
      : 'Local database backup file downloaded successfully!');
  };

  const handleImportBackup = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (event) => {
      try {
        const data = JSON.parse(event.target?.result as string);
        if (data && typeof data === 'object') {
          Object.entries(data).forEach(([key, val]) => {
            if (val !== null && val !== undefined) {
              localStorage.setItem(key, JSON.stringify(val));
            }
          });
          alert(lang === 'vi' 
            ? 'Đã nhập dữ liệu sao lưu thành công! Trang trang web sẽ tự động tải lại.' 
            : 'Backup imported successfully! The page will now reload.');
          window.location.reload();
        } else {
          alert(lang === 'vi' ? 'File sao lưu không hợp lệ.' : 'Invalid backup file.');
        }
      } catch (err) {
        alert(lang === 'vi' ? 'Có lỗi xảy ra khi đọc file sao lưu.' : 'Error reading backup file.');
        console.error(err);
      }
    };
    reader.readAsText(file);
  };

  // --- 2. AUTHENTICATION & SECURITY STATE ---
  const [activeUser, setActiveUser] = useState<Staff | null>(null);
  const [activeBranch, setActiveBranch] = useState<Branch | null>(null);
  const [loginPhone, setLoginPhone] = useState('');
  const [loginPin, setLoginPin] = useState('');
  const [loginError, setLoginError] = useState(false);

  // Quick Login Assist helper
  const triggerAutoLogin = (phone: string, pin: string) => {
    const matchedEmployee = staff.find(s => s.phone === phone && s.pin === pin);
    if (matchedEmployee) {
      const matchBranch = branches.find(b => b.id === matchedEmployee.branchId) || branches[0];
      setActiveUser(matchedEmployee);
      setActiveBranch(matchBranch);
      setLoginError(false);
      logAudit(
        matchedEmployee.id,
        matchedEmployee.name,
        matchBranch.id,
        matchBranch.name,
        `Tài khoản đăng nhập hệ thống thành công dán quầy.`,
        `Account authenticated and logged into workstation.`
      );
    }
  };

  const handleManualLogin = (e: React.FormEvent) => {
    e.preventDefault();
    const matchedEmployee = staff.find(s => s.phone === loginPhone && s.pin === loginPin);
    if (matchedEmployee) {
      const matchBranch = branches.find(b => b.id === matchedEmployee.branchId) || branches[0];
      setActiveUser(matchedEmployee);
      setActiveBranch(matchBranch);
      setLoginError(false);
      setLoginPhone('');
      setLoginPin('');
      logAudit(
        matchedEmployee.id,
        matchedEmployee.name,
        matchBranch.id,
        matchBranch.name,
        `Nhân viên đăng nhập thành công.`,
        `Staff logged in successfully.`
      );
    } else {
      setLoginError(true);
    }
  };

  const handleLogout = () => {
    if (activeUser && activeBranch) {
      logAudit(
        activeUser.id,
        activeUser.name,
        activeBranch.id,
        activeBranch.name,
        `Nhân viên đăng xuất khỏi quầy.`,
        `Staff logged out from station.`
      );
    }
    setActiveUser(null);
    setActiveBranch(null);
  };

  // Log system audited operations
  const logAudit = (sId: string, sName: string, bId: string, bName: string, vi: string, en: string) => {
    const newLog: AuditLog = {
      id: `AUD_LOG_${Date.now()}_${Math.floor(Math.random() * 1000)}`,
      timestamp: new Date().toISOString().replace('T', ' ').slice(0, 19),
      staffId: sId,
      staffName: sName,
      branchId: bId,
      branchName: bName,
      actionVi: vi,
      actionEn: en,
      details: `Operator: ${sName} (${sId}) at ${bName}`
    };
    setAuditLogs(prev => [newLog, ...prev]);
  };

  // --- 3. SYSTEM TABS & CHANNELS ---
  const [activeTab, setActiveTab] = useState<'sales' | 'inventory' | 'loyalty' | 'invoices' | 'costs' | 'admin' | 'audits' | 'android'>('sales');
  const [loyaltySubTab, setLoyaltySubTab] = useState<'zalo' | 'android' | 'system'>('zalo');

  // --- 4. SALES POS ACTIVE WORKOUT checkout STATES ---
  const [salesModel, setSalesModel] = useState<'set' | 'weight' | 'companions'>('set');
  const [cart, setCart] = useState<OrderItem[]>([]);
  const [vTaxRate, setVTaxRate] = useState<number>(8); // Configurable tax setting defaults to 8%
  
  // Scoop set configuration state
  const [selectedScoopCount, setSelectedScoopCount] = useState<number>(1);
  const [scoopFlavors, setScoopFlavors] = useState<string[]>(['']); // choices IDs for flavor slots
  
  // Custom scoop counts states
  const [customScoopAmount, setCustomScoopAmount] = useState<number>(5);
  const [isBuildingCustomSet, setIsBuildingCustomSet] = useState(false);

  // Weighted scoop gram mixes state
  const [weightInput, setWeightInput] = useState<number>(150);
  const [selectedMixFlavors, setSelectedMixFlavors] = useState<string[]>([]);
  const [selectedMixToppings, setSelectedMixToppings] = useState<string[]>([]);

  // Loyalty and Vouchers Checkout triggers
  const [clientSearchPhone, setClientSearchPhone] = useState('');
  const [activeCustomer, setActiveCustomer] = useState<LoyaltyMember | null>(null);
  const [loyaltyPointsToRedeem, setLoyaltyPointsToRedeem] = useState<number>(0);
  
  const [promoCouponCode, setPromoCouponCode] = useState('');
  const [appliedVoucher, setAppliedVoucher] = useState<Voucher | null>(null);
  const [voucherError, setVoucherError] = useState<string>('');
  
  const [checkoutPaymentMethod, setCheckoutPaymentMethod] = useState<'cash' | 'qr'>('cash');

  // Interactive Receipt & Invoice modalities triggers
  const [receiptOrder, setReceiptOrder] = useState<Order | null>(null);
  const [previewOrder, setPreviewOrder] = useState<Order | null>(null);
  const [invoiceLinkOrder, setInvoiceLinkOrder] = useState<Order | null>(null);

  // Live promotion generation using server-side Gemini 2.5 API
  const [aiPromotionsOutput, setAiPromotionsOutput] = useState<{
    titleVi: string; titleEn: string; contentVi: string; contentEn: string; ctaVi: string; ctaEn: string;
  } | null>(null);
  const [genVibe, setGenVibe] = useState('nhí nhảnh, dễ thương, hài hước');
  const [genSeason, setGenSeason] = useState('Ngày hè nắng nóng sảng khoái');
  const [genTarget, setGenTarget] = useState('Nhóm bạn trẻ thích chụp hình check-in kem');
  const [isGeneratingPromo, setIsGeneratingPromo] = useState(false);

  // Natural Language Voice command simulator state
  const [voiceInputString, setVoiceInputString] = useState('');
  const [isParsingVoice, setIsParsingVoice] = useState(false);

  // Sync scoop choice indexes on count click
  useEffect(() => {
    setScoopFlavors(Array(selectedScoopCount).fill(''));
  }, [selectedScoopCount]);

  // Handle Voice Command text parse
  const handleVoiceOrderSubmit = async (textCmd: string) => {
    if (!textCmd.trim()) return;
    setIsParsingVoice(true);
    let data;
    try {
      const resp = await fetch('/api/voice-order', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ commandText: textCmd })
      });
      if (resp.ok && resp.headers.get('content-type')?.includes('application/json')) {
        data = await resp.json();
      } else {
        throw new Error('Not a JSON response or server error');
      }
    } catch (e) {
      console.warn("API server voice-order fetch failed. Utilizing high-fidelity client-side local parser fallback:", e);
      const lower = textCmd.toLowerCase();
      let items: any[] = [];
      if (lower.includes('set 1') || lower.includes('một viên') || lower.includes('1 viên')) {
        items.push({ type: 'set', quantity: 1, flavorsSelected: ['FL_01'] });
      } else if (lower.includes('set 2') || lower.includes('hai viên') || lower.includes('2 viên')) {
        items.push({ type: 'set', quantity: 1, flavorsSelected: ['FL_01', 'FL_05'] });
      } else if (lower.includes('set 3') || lower.includes('ba viên') || lower.includes('3 viên')) {
        items.push({ type: 'set', quantity: 1, flavorsSelected: ['FL_01', 'FL_02', 'FL_05'] });
      } else if (lower.includes('set 4') || lower.includes('bốn viên') || lower.includes('4 viên')) {
        items.push({ type: 'set', quantity: 1, flavorsSelected: ['FL_01', 'FL_02', 'FL_04', 'FL_05'] });
      }

      if (lower.includes('ốc quế') || lower.includes('cone')) {
        items.push({ type: 'accompaniment', quantity: 1, id: 'AC_CONE' });
      }
      if (lower.includes('waffle')) {
        items.push({ type: 'accompaniment', quantity: 1, id: 'AC_WAFFLE' });
      }
      if (lower.includes('bánh mì') || lower.includes('bread')) {
        items.push({ type: 'accompaniment', quantity: 1, id: 'AC_BREAD' });
      }
      if (lower.includes('gram') || lower.includes('cân')) {
        const match = lower.match(/(\d+)\s*(g|gram)/);
        const grams = match ? parseInt(match[1]) : 150;
        items.push({ type: 'gram', quantity: 1, gramWeight: grams, flavorsSelected: ['FL_08', 'FL_09'] });
      }

      data = {
        items: items.length > 0 ? items : [{ type: 'set', quantity: 1, flavorsSelected: ['FL_01'] }],
        appliedVoucher: lower.includes('voucher') || lower.includes('mã') ? 'GAUCHUBBY' : null,
        memberPhone: lower.match(/0\d{9}/) ? lower.match(/0\d{9}/)[0] : null
      };
    }

    try {
      if (data && data.items && data.items.length > 0) {
        // Clear previous and load structured items
        const newCart: OrderItem[] = data.items.map((it: any, idVal: number) => {
          let price = 15000;
          let nameVi = 'Kem Viên Hảo Hạng';
          let nameEn = 'Premium Scoop Gelato';

          if (it.type === 'set') {
            const count = it.flavorsSelected?.length || 1;
            // set pricing formula
            price = count === 1 ? 15000 : count === 2 ? 25000 : count === 3 ? 35000 : (15000 + (count - 1) * 10000);
            nameVi = `Set ${count} viên Gấu Gelato`;
            nameEn = `Gấu Set of ${count} Scoops`;
          } else if (it.type === 'gram') {
            const wt = it.gramWeight || 150;
            price = Math.round(wt * 300);
            nameVi = `Tô Kem Cân Gram dán tường (${wt}g)`;
            nameEn = `Weighted Gelato Tub (${wt}g)`;
          } else if (it.type === 'accompaniment') {
            const accObj = accompaniments.find(a => a.id === it.id);
            price = accObj ? accObj.price : it.price;
            nameVi = accObj ? accObj.nameVi : (it.nameVi || 'Món ăn kèm');
            nameEn = accObj ? accObj.nameEn : (it.nameEn || 'Side item');
          } else if (it.type === 'topping') {
            const topObj = toppings.find(t => t.id === it.id);
            price = topObj ? topObj.price : (it.price || 4000);
            nameVi = topObj ? topObj.nameVi : 'Topping thêm';
            nameEn = topObj ? topObj.nameEn : 'Extra topping';
          }

          // Map flav names helper
          const mappedFlavList = it.flavorsSelected?.map((fId: string) => {
            const fl = flavors.find(f => f.id === fId);
            return fl ? (lang === 'vi' ? fl.nameVi : fl.nameEn) : 'Gấu Secret';
          }) || [];

          return {
            id: `ITEM_${Date.now()}_${idVal}`,
            type: it.type,
            nameVi,
            nameEn,
            quantity: it.quantity || 1,
            price,
            flavorsSelected: mappedFlavList,
            toppingsSelected: it.toppingsSelected || [],
            gramWeight: it.gramWeight
          };
        });

        setCart(newCart);

        // Apply voucher if return
        if (data.appliedVoucher) {
          const matchV = vouchers.find(v => v.code === data.appliedVoucher);
          if (matchV) setAppliedVoucher(matchV);
        }
        // Search member
        if (data.memberPhone) {
          const matchM = members.find(m => m.phone === data.memberPhone);
          if (matchM) {
            setActiveCustomer(matchM);
            setClientSearchPhone(data.memberPhone);
          }
        }

        alert(lang === 'vi' ? '🤖 Trợ lý AI đã ghi nhận câu lệnh và điền giỏ hàng của bạn!' : '🤖 AI Voice Assistant read order command and generated shopping basket!');
      }
    } catch (e) {
      console.error(e);
    } finally {
      setIsParsingVoice(false);
      setVoiceInputString('');
    }
  };

  // AI Promotional Copilot campaign generation
  const handleAiPromotionsRequest = async () => {
    setIsGeneratingPromo(true);
    try {
      const resp = await fetch('/api/generate-campaign', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          vibe: genVibe,
          season: genSeason,
          targetAudience: genTarget,
          couponCode: appliedVoucher?.code || 'GAUCHUBBY',
          discountPercent: appliedVoucher?.discountType === 'percent' ? appliedVoucher.value : 10,
          activeFlavors: flavors.slice(0, 3).map(f => f.nameVi)
        })
      });
      if (resp.ok && resp.headers.get('content-type')?.includes('application/json')) {
        const data = await resp.json();
        setAiPromotionsOutput(data);
      } else {
        throw new Error('Not a JSON response or server error');
      }
    } catch (e) {
      console.warn("API server campaign fetch failed. Utilizing high-fidelity client-side generator fallback:", e);
      const couponCode = appliedVoucher?.code || 'GAUCHUBBY';
      setAiPromotionsOutput({
        titleVi: `🐻🍦 Gấu Gelato - Siêu Hội Mùa Hè Cùng Bạn Bè & Gia Đình 🍦🐻`,
        titleEn: `🐻🍦 Gấu Gelato - Ultimate Summer Fiesta For Family & Friends 🍦🐻`,
        contentVi: `Chào các Gấu con đáng yêu ơi! Trong bầu không khí ấm áp ngập tràn nắng hè của dịp "${genSeason || 'Hè rực rỡ'}", hãy cùng Gấu Gelato nạp ngay năng lượng bùng nổ ngọt ngào nhé! Đặc biệt giới thiệu vị kem Cookies Choc Chip sánh mịn giòn tan rôm rả, hòa quyện xuất sắc cùng vị kem Cam Thảo Cổ Điển thơm dịu béo ngậy. Đây là sự kết hợp cực "vibe ${genVibe || 'nhí nhảnh, vui vẻ'}" dành riêng cho đại gia đình và nhóm bạn "${genTarget || 'Trẻ trung, năng động'}". Đừng bỏ lỡ nhé!`,
        contentEn: `Hey sweet Bears! Under the bright sunshine of this golden "${genSeason || 'Summer Splendor'}", cool off your tastebuds with Gấu Gelato's premium scoops! Savor our velvety Cookies Choc Chip with satisfying crunch and pair it with the deep, creamy flavor of Wild Licorice. Specily tailored in a "${genVibe || 'cheerful and playful'}" vibe for "${genTarget || 'Families and groups of young mates'}". Let's dig in together!`,
        ctaVi: `🌟 Chỉ cần quét mã thành viên tại quầy, áp dụng ngay mã giảm giá siêu phàm [ ${couponCode} ] để hưởng trọn ưu đãi nhé các quý khách hàng yêu ơi!`,
        ctaEn: `🌟 Simply scan your loyalty card and input voucher coupon [ ${couponCode} ] at any checkout to activate exclusive sweet deals!`
      });
    } finally {
      setIsGeneratingPromo(false);
    }
  };

  // Create loyalty points member lookup
  const handleMemberPointsLookup = () => {
    const match = members.find(m => m.phone === clientSearchPhone);
    if (match) {
      setActiveCustomer(match);
      setLoyaltyPointsToRedeem(0);
    } else {
      // Prompt creation of new user to avoid complex steps
      const newName = prompt(lang === 'vi' ? 'SĐT hợp lệ chưa tích điểm. Hãy nhập tên Khách hàng mới để thiết lập thẻ:' : 'Guest not registered. Input profile name:');
      if (newName) {
        const newMember: LoyaltyMember = {
          phone: clientSearchPhone,
          name: newName,
          gender: 'female',
          points: 0,
          exchangeHistory: []
        };
        setMembers(prev => [...prev, newMember]);
        setActiveCustomer(newMember);
        alert(lang === 'vi' ? 'Tạo thành viên mới thành công!' : 'Loyalty member profile established!');
      }
    }
  };

  // Apply Voucher code check
  const handleVoucherValidation = (customCode?: string) => {
    setVoucherError('');
    const codeToUse = typeof customCode === 'string' ? customCode : promoCouponCode;
    const codeUpper = codeToUse.toUpperCase().trim();
    if (!codeUpper) return;

    if (typeof customCode === 'string') {
      setPromoCouponCode(codeUpper);
    }

    const match = vouchers.find(v => v.code === codeUpper);
    if (!match) {
      const err = lang === 'vi' 
        ? 'Thất bại: Mã Voucher không chính xác hoặc không tồn tại.' 
        : 'Failed: Voucher code is incorrect or does not exist.';
      setVoucherError(err);
      setAppliedVoucher(null);
      alert(err);
      return;
    }

    // 1. Check if disabled
    if (match.disabled) {
      const err = lang === 'vi' 
        ? `Thất bại: Mã Voucher "${match.code}" đã bị khóa hoặc tạm ngưng sử dụng.` 
        : `Failed: Voucher code "${match.code}" has been locked or suspended.`;
      setVoucherError(err);
      setAppliedVoucher(null);
      alert(err);
      return;
    }

    // 2. Check if expired
    const todayObj = new Date();
    const yyyy = todayObj.getFullYear();
    const mm = String(todayObj.getMonth() + 1).padStart(2, '0');
    const dd = String(todayObj.getDate()).padStart(2, '0');
    const todayStr = `${yyyy}-${mm}-${dd}`;

    if (todayStr > match.expiryDate) {
      const err = lang === 'vi' 
        ? `Thất bại: Mã Voucher "${match.code}" đã hết hạn sử dụng (Hết hạn ngày ${match.expiryDate}).` 
        : `Failed: Voucher code "${match.code}" expired on ${match.expiryDate}.`;
      setVoucherError(err);
      setAppliedVoucher(null);
      alert(err);
      return;
    }

    // 3. Check applicable branches
    if (activeBranch && match.applicableBranches && match.applicableBranches.length > 0) {
      const isAll = match.applicableBranches.includes('all');
      const isAllowed = isAll || match.applicableBranches.includes(activeBranch.id);
      if (!isAllowed) {
        const err = lang === 'vi'
          ? `Thất bại: Mã Voucher "${match.code}" không áp dụng tại chi nhánh ${activeBranch.name}.`
          : `Failed: Voucher code "${match.code}" is not applicable to branch ${activeBranch.name}.`;
        setVoucherError(err);
        setAppliedVoucher(null);
        alert(err);
        return;
      }
    }

    // 4. Success check subtotal threshold hint
    const currentSubtotal = cart.reduce((sum, item) => sum + (item.price * item.quantity), 0);
    setAppliedVoucher(match);
    if (currentSubtotal < match.minOrder) {
      const err = lang === 'vi'
        ? `Chưa đủ trị giá bill tối thiểu: Giá trị giỏ hàng (${currentSubtotal.toLocaleString()}đ) chưa đạt mức tối thiểu ${match.minOrder.toLocaleString()}đ để hưởng ưu đãi từ mã "${match.code}".`
        : `Under minimum bill requirement: Current cart (${currentSubtotal.toLocaleString()}đ) has not met the min spend of ${match.minOrder.toLocaleString()}đ for code "${match.code}".`;
      setVoucherError(err);
      alert(err);
    } else {
      setVoucherError('');
      alert(lang === 'vi'
        ? `Áp dụng mã bảo mật ưu đãi thành công!`
        : `Coupon code successfully verified & applied!`);
    }
  };

  // Cart operations
  const addToCartSetModel = () => {
    // Audit choice completion
    if (scoopFlavors.some(f => f === '')) {
      alert(lang === 'vi' ? 'Nhân viên vui lòng bấm chọn vị kem cho toàn bộ viên kem trong Set!' : 'Please tap ice cream flavor tiles for each scoop!');
      return;
    }

    const priceCode = selectedScoopCount === 1 ? 15000 : selectedScoopCount === 2 ? 25000 : selectedScoopCount === 3 ? 35000 : (15000 + (selectedScoopCount - 1) * 10000);
    const labelVi = `Set ${selectedScoopCount} Viên Cao Cấp`;
    const labelEn = `Gấu Scoop Set of ${selectedScoopCount}`;

    // Get flavor translations as listed details
    const mappedFlavList = scoopFlavors.map(fId => {
      const fl = flavors.find(f => f.id === fId);
      return fl ? (lang === 'vi' ? fl.nameVi : fl.nameEn) : 'Gấu Premium';
    });

    const newCartItem: OrderItem = {
      id: `SET_${Date.now()}`,
      type: 'set',
      nameVi: labelVi,
      nameEn: labelEn,
      quantity: 1,
      price: priceCode,
      flavorsSelected: mappedFlavList
    };

    setCart(prev => [...prev, newCartItem]);
    
    // Reset selection defaults
    setScoopFlavors(Array(selectedScoopCount).fill(''));
  };

  const addToCartWeightModel = () => {
    if (weightInput <= 0) {
      alert(lang === 'vi' ? 'Vui lòng nhập trọng lượng thực tế (gram)!' : 'Input valid weight scale grams!');
      return;
    }

    const calculatedPrice = Math.round(weightInput * 300); // 300đ per gram

    const newCartItem: OrderItem = {
      id: `WEIGHT_${Date.now()}`,
      type: 'gram',
      nameVi: `Kem Cân (${weightInput}g)`,
      nameEn: `Weighted Cup (${weightInput}g)`,
      quantity: 1,
      price: calculatedPrice,
      flavorsSelected: [],
      toppingsSelected: [],
      gramWeight: weightInput
    };

    setCart(prev => [...prev, newCartItem]);
    setSelectedMixFlavors([]);
    setSelectedMixToppings([]);
  };

  const addToCartAccompaniments = (item: Topping | Accompaniment, isAcc: boolean) => {
    const exists = cart.find(c => c.id === item.id);
    if (exists) {
      setCart(prev => prev.map(c => c.id === item.id ? { ...c, quantity: c.quantity + 1 } : c));
    } else {
      const newCartItem: OrderItem = {
        id: item.id,
        type: isAcc ? 'accompaniment' : 'topping',
        nameVi: item.nameVi,
        nameEn: item.nameEn,
        quantity: 1,
        price: isAcc ? (item as Accompaniment).price : (item as Topping).price
      };
      setCart(prev => [...prev, newCartItem]);
    }
  };

  const handleRemoveCartItem = (itemId: string) => {
    setCart(prev => prev.filter(c => c.id !== itemId));
  };

  // Pricing calculations
  const calculateFinalPOSCheckoutTotal = () => {
    const subtotal = cart.reduce((sum, item) => sum + (item.price * item.quantity), 0);
    
    // Apply voucher
    let discount = 0;
    if (appliedVoucher) {
      if (subtotal >= appliedVoucher.minOrder) {
        if (appliedVoucher.discountType === 'percent') {
          discount = Math.round((subtotal * appliedVoucher.value) / 100);
        } else {
          discount = appliedVoucher.value;
        }
      }
    }

    // Apply loyalty points
    if (loyaltyPointsToRedeem > 0) {
      discount += loyaltyPointsToRedeem;
    }

    const netAmountBeforeTax = Math.max(0, subtotal - discount);
    const taxAmount = Math.round((netAmountBeforeTax * vTaxRate) / 100);
    const grandTotal = netAmountBeforeTax + taxAmount;

    return {
      subtotal,
      discount,
      taxAmount,
      grandTotal
    };
  };

  // Generate a draft order configuration to preview printed thermal layout before committing
  const handleCheckoutPreview = () => {
    if (cart.length === 0) {
      alert(lang === 'vi' ? 'Giỏ hàng đang trống!' : 'Your cart is empty!');
      return;
    }
    if (!activeUser || !activeBranch) return;

    const { subtotal, discount, taxAmount, grandTotal } = calculateFinalPOSCheckoutTotal();

    const tempOrder: Order = {
      id: `PREVIEW_${Date.now()}`,
      branchId: activeBranch.id,
      staffId: activeUser.id,
      staffName: activeUser.name,
      date: new Date().toISOString().replace('T', ' ').slice(0, 16),
      items: cart,
      subtotal,
      taxRate: vTaxRate,
      taxAmount,
      discountAmount: discount,
      voucherCode: appliedVoucher?.code,
      total: grandTotal,
      paymentMethod: checkoutPaymentMethod,
      memberPhone: activeCustomer?.phone,
      invoiceStatus: 'not_issued'
    };

    setPreviewOrder(tempOrder);
  };

  // Execute actual submission of order (concludes transaction logs, updates physical stocks, adds client loyalty scores)
  const handleCheckoutConclude = () => {
    if (cart.length === 0) return;
    if (!activeUser || !activeBranch) return;

    const { subtotal, discount, taxAmount, grandTotal } = calculateFinalPOSCheckoutTotal();

    // Create unique ID
    const nextBillId = `BILL_GAU_${Date.now()}`;
    
    const newOrder: Order = {
      id: nextBillId,
      branchId: activeBranch.id,
      staffId: activeUser.id,
      staffName: activeUser.name,
      date: new Date().toISOString().replace('T', ' ').slice(0, 16),
      items: cart,
      subtotal,
      taxRate: vTaxRate,
      taxAmount,
      discountAmount: discount,
      voucherCode: appliedVoucher?.code,
      total: grandTotal,
      paymentMethod: checkoutPaymentMethod,
      memberPhone: activeCustomer?.phone,
      invoiceStatus: 'not_issued'
    };

    // Update active memory/databases
    setOrders(prev => [newOrder, ...prev]);

    // Decrement physical stocks for this branch! Recipe formula
    const nextStocks = { ...branchStocks };
    const branchStockMap = { ...(nextStocks[activeBranch.id] || {}) };

    cart.forEach(item => {
      if (item.type === 'set') {
        // Find selecting flavors mapped
        item.flavorsSelected?.forEach(flName => {
          const targetF = flavors.find(f => f.nameVi === flName || f.nameEn === flName);
          if (targetF) {
            branchStockMap[targetF.id] = Math.max(0, (branchStockMap[targetF.id] ?? targetF.stockGrams) - (80 * item.quantity));
          }
        });
      } else if (item.type === 'gram' && item.gramWeight) {
        // Mix ratio distribution
        const size = item.flavorsSelected?.length || 1;
        const weightPerFl = Math.round(item.gramWeight / size);

        item.flavorsSelected?.forEach(flName => {
          const targetF = flavors.find(f => f.nameVi === flName || f.nameEn === flName);
          if (targetF) {
            branchStockMap[targetF.id] = Math.max(0, (branchStockMap[targetF.id] ?? targetF.stockGrams) - (weightPerFl * item.quantity));
          }
        });

        // Mix toppings
        item.toppingsSelected?.forEach(tName => {
          const targetT = toppings.find(t => t.nameVi === tName || t.nameEn === tName);
          if (targetT) {
            branchStockMap[targetT.id] = Math.max(0, (branchStockMap[targetT.id] ?? targetT.stockQuantity) - (1 * item.quantity));
          }
        });
      } else {
        // accompaniments or standard separate topping triggers
        const targetObj = accompaniments.find(a => a.id === item.id) || toppings.find(t => t.id === item.id);
        if (targetObj) {
          branchStockMap[targetObj.id] = Math.max(0, (branchStockMap[targetObj.id] ?? targetObj.stockQuantity) - (1 * item.quantity));
        }
      }
    });

    nextStocks[activeBranch.id] = branchStockMap;
    setBranchStocks(nextStocks);

    // Increment member loyal points
    if (activeCustomer) {
      const gainedScore = Math.max(1, Math.floor(grandTotal / 10000)); // 10k VND = 1 point
      let currentPts = activeCustomer.points;
      
      // subtract used points
      if (loyaltyPointsToRedeem > 0) {
        currentPts = Math.max(0, currentPts - Math.floor(loyaltyPointsToRedeem / 1000)); // 1pt = 1000đ
      }

      const nextMembers = members.map(m => {
        if (m.phone === activeCustomer.phone) {
          return {
            ...m,
            points: currentPts + gainedScore
          };
        }
        return m;
      });
      setMembers(nextMembers);
      setActiveCustomer(nextMembers.find(m => m.phone === activeCustomer.phone) || null);
    }

    // Increment voucher counter
    if (appliedVoucher) {
      setVouchers(prev => prev.map(v => v.code === appliedVoucher.code ? { ...v, usageCount: v.usageCount + 1 } : v));
    }

    // Log audited operation
    logAudit(
      activeUser.id,
      activeUser.name,
      activeBranch.id,
      activeBranch.name,
      `Bán lẻ sỉ kem - Xuất Bill thành công #${nextBillId.slice(-6)}: ${grandTotal.toLocaleString()}đ`,
      `Order checkout success for Bill #${nextBillId.slice(-6)}: ${grandTotal.toLocaleString()}đ`
    );

    // Open Printable 80mm bill receipt instantly
    setReceiptOrder(newOrder);

    // Reset shopping states
    setCart([]);
    setPromoCouponCode('');
    setAppliedVoucher(null);
    setLoyaltyPointsToRedeem(0);
    setClientSearchPhone('');
    setActiveCustomer(null);
    alert(lang === 'vi' ? '🎉 Giao dịch lưu trên mây thành công! In hóa đơn nhiệt cho khách.' : '🎉 Transaction recorded in cloud! Printing thermal receipt copy.');
  };

  // General multi-warehouse inventory operations handler (delta adjustments, direct calibrations, central transfers)
  const handleInventoryAction = (
    targetBranchId: string,
    itemId: string,
    itemType: 'flavor' | 'topping' | 'accompaniment',
    itemName: string,
    actionType: 'delta' | 'calibrate' | 'transfer',
    value: number,
    reasonVi: string,
    reasonEn: string,
    importPrice?: number
  ) => {
    if (!activeUser) return;

    const nextStocks = { ...branchStocks };
    
    // Ensure both target and central exist in local state
    if (!nextStocks[targetBranchId]) nextStocks[targetBranchId] = {};
    if (!nextStocks['central']) nextStocks['central'] = {};

    const branchName = targetBranchId === 'central'
      ? (lang === 'vi' ? 'Kho Tổng' : 'Central Warehouse')
      : (branches.find(b => b.id === targetBranchId)?.name || targetBranchId);

    if (actionType === 'delta') {
      const originalQty = nextStocks[targetBranchId][itemId] ?? 0;
      nextStocks[targetBranchId][itemId] = Math.max(0, originalQty + value);
      
      // Write log
      const logItem: InventoryLog = {
        id: `INV_LOG_${Date.now()}`,
        timestamp: new Date().toISOString().replace('T', ' ').slice(0, 19),
        branchId: targetBranchId,
        itemId,
        itemType,
        changeAmount: value,
        reasonVi,
        reasonEn,
        staffName: activeUser.name,
        importPrice
      };
      setInventoryLogs(prev => [...prev, logItem]);

      logAudit(
        activeUser.id,
        activeUser.name,
        targetBranchId,
        branchName,
        `Điều chỉnh kho [${itemName}]: ${value > 0 ? `+${value}` : `${value}`}`,
        `Raw stockpiles adjusted [${itemName}]: ${value > 0 ? `+${value}` : `${value}`}`
      );
    } 
    else if (actionType === 'calibrate') {
      const originalQty = nextStocks[targetBranchId][itemId] ?? 0;
      nextStocks[targetBranchId][itemId] = Math.max(0, value);
      const diff = value - originalQty;

      // Write log
      const logItem: InventoryLog = {
        id: `INV_LOG_${Date.now()}`,
        timestamp: new Date().toISOString().replace('T', ' ').slice(0, 19),
        branchId: targetBranchId,
        itemId,
        itemType,
        changeAmount: diff,
        reasonVi: `${reasonVi} (Cân chỉnh từ ${originalQty.toLocaleString()} -> ${value.toLocaleString()})`,
        reasonEn: `${reasonEn} (Calibrated from ${originalQty.toLocaleString()} -> ${value.toLocaleString()})`,
        staffName: activeUser.name
      };
      setInventoryLogs(prev => [...prev, logItem]);

      logAudit(
        activeUser.id,
        activeUser.name,
        targetBranchId,
        branchName,
        `Cân chỉnh kho thực tế [${itemName}]: ${originalQty.toLocaleString()} -> ${value.toLocaleString()} (${diff > 0 ? `+${diff}` : `${diff}`})`,
        `Calibrated physical warehouse balance [${itemName}]: ${originalQty.toLocaleString()} -> ${value.toLocaleString()} (${diff > 0 ? `+${diff}` : `${diff}`})`
      );
    } 
    else if (actionType === 'transfer') {
      if (targetBranchId === 'central') return;

      const centralQty = nextStocks['central'][itemId] ?? 0;
      nextStocks['central'][itemId] = Math.max(0, centralQty - value);

      const branchQty = nextStocks[targetBranchId][itemId] ?? 0;
      nextStocks[targetBranchId][itemId] = branchQty + value;

      // Write log record for Central
      const centralLog: InventoryLog = {
        id: `INV_LOG_C_${Date.now()}`,
        timestamp: new Date().toISOString().replace('T', ' ').slice(0, 19),
        branchId: 'central',
        itemId,
        itemType,
        changeAmount: -value,
        reasonVi: `Xuất kho chuyển giao sang chi nhánh ${branchName}. Lý do: ${reasonVi}`,
        reasonEn: `Dispatched stock shipment to branch ${branchName}. Reason: ${reasonEn}`,
        staffName: activeUser.name
      };

      // Write log record for Branch
      const branchLog: InventoryLog = {
        id: `INV_LOG_B_${Date.now()}`,
        timestamp: new Date().toISOString().replace('T', ' ').slice(0, 19),
        branchId: targetBranchId,
        itemId,
        itemType,
        changeAmount: value,
        reasonVi: `Nhận hàng chuyển từ Kho Tổng. Lý do: ${reasonVi}`,
        reasonEn: `Received stock shipment from Central Warehouse. Reason: ${reasonEn}`,
        staffName: activeUser.name
      };

      setInventoryLogs(prev => [...prev, centralLog, branchLog]);

      logAudit(
        activeUser.id,
        activeUser.name,
        targetBranchId,
        branchName,
        `Nhận chuyển kho [${itemName}]: Bổ sung +${value.toLocaleString()} từ Kho Tổng`,
        `Received warehouse transfer [${itemName}]: Replenished +${value.toLocaleString()} from Central Warehouse`
      );

      logAudit(
        activeUser.id,
        activeUser.name,
        'central',
        'Kho Tổng',
        `Xuất chuyển kho [${itemName}]: Chuyển -${value.toLocaleString()} sang chi nhánh ${branchName}`,
        `Transferred stock outbound [${itemName}]: Dispatched -${value.toLocaleString()} to branch ${branchName}`
      );
    }

    setBranchStocks(nextStocks);
  };

  // Operating costs ledger logging actions
  const handleAddCostExpense = (category: any, amt: number, descVi: string, descEn: string, bId: string) => {
    if (!activeUser || !activeBranch) return;

    const targetBranch = bId || activeBranch.id;

    const opexItem: OperationalExpense = {
      id: `EXP_${Date.now()}`,
      date: new Date().toISOString().replace('T', ' ').slice(0, 16),
      category,
      amount: amt,
      descriptionVi: descVi,
      descriptionEn: descEn,
      branchId: targetBranch
    };

    setExpenses(prev => [...prev, opexItem]);

    logAudit(
      activeUser.id,
      activeUser.name,
      targetBranch,
      branches.find(b => b.id === targetBranch)?.name || 'Central Outlet',
      `Ghi nhận sổ sách chi hoạt động [${category}]: -${amt.toLocaleString()}đ (Mô tả: ${descVi})`,
      `Documented operational cash expenditure [${category}]: -${amt.toLocaleString()}đ (Narration: ${descEn})`
    );
  };

  // Staff and branch coordinates mutators (Admin Supreme only)
  const handleAddBranchAction = (bData: Omit<Branch, 'id'>) => {
    const nextId = `CN_${Date.now().toString().slice(-4)}`;
    const newBranch: Branch = { ...bData, id: nextId };
    
    setBranches(prev => [...prev, newBranch]);

    // Initial stocks for new branch
    const nextStocks = { ...branchStocks };
    nextStocks[nextId] = {};
    flavors.forEach(f => { nextStocks[nextId][f.id] = f.stockGrams; });
    toppings.forEach(t => { nextStocks[nextId][t.id] = t.stockQuantity; });
    accompaniments.forEach(a => { nextStocks[nextId][a.id] = a.stockQuantity; });
    setBranchStocks(nextStocks);

    if (activeUser && activeBranch) {
      logAudit(
        activeUser.id,
        activeUser.name,
        activeBranch.id,
        activeBranch.name,
        `Tạo chi nhánh chuỗi kem Gấu mới: "${bData.name}"`,
        `Established new chain branch: "${bData.name}"`
      );
    }
  };

  const handleDeleteBranchAction = (bId: string) => {
    setBranches(prev => prev.filter(b => b.id !== bId));
  };

  const handleUpdateBranchAction = (updatedBranch: Branch) => {
    setBranches(prev => prev.map(b => b.id === updatedBranch.id ? updatedBranch : b));
    if (activeUser && activeBranch) {
      logAudit(
        activeUser.id,
        activeUser.name,
        activeBranch.id,
        activeBranch.name,
        `Chỉnh sửa thông tin chi nhánh: "${updatedBranch.name}"`,
        `Edited branch details for: "${updatedBranch.name}"`
      );
    }
  };

  const handleAddStaffAction = (sData: Omit<Staff, 'id'>) => {
    const nextId = `NV_${Date.now().toString().slice(-4)}`;
    const newStaff: Staff = { ...sData, id: nextId };
    setStaff(prev => [...prev, newStaff]);

    if (activeUser && activeBranch) {
      logAudit(
        activeUser.id,
        activeUser.name,
        activeBranch.id,
        activeBranch.name,
        `Tuyển dụng điều phối nhân sự mới: ${sData.name} vào chi nhánh ${sData.branchId}`,
        `Hired and deployed new staff member: ${sData.name} into branch ${sData.branchId}`
      );
    }
  };

  const handleDeleteStaffAction = (sId: string) => {
    setStaff(prev => prev.filter(s => s.id !== sId));
  };

  const handleUpdateStaffAction = (updatedStaff: Staff) => {
    setStaff(prev => prev.map(s => s.id === updatedStaff.id ? updatedStaff : s));
    if (activeUser && activeBranch) {
      logAudit(
        activeUser.id,
        activeUser.name,
        activeBranch.id,
        activeBranch.name,
        `Chỉnh sửa thông tin nhân sự: [${updatedStaff.role.toUpperCase()}] ${updatedStaff.name}`,
        `Updated staff informational profile: [${updatedStaff.role.toUpperCase()}] ${updatedStaff.name}`
      );
    }
  };

  const handleAddVoucherAction = (vData: Voucher) => {
    setVouchers(prev => [...prev, vData]);
  };

  const handleUpdateVoucherAction = (updatedVoucher: Voucher) => {
    setVouchers(prev => prev.map(v => v.code === updatedVoucher.code ? updatedVoucher : v));
  };

  const handleDeleteVoucherAction = (vCode: string) => {
    setVouchers(prev => prev.filter(v => v.code !== vCode));
  };

  const handleAddFlavorAction = (fData: Omit<Flavor, 'id'>) => {
    const nextId = `f_${Date.now().toString().slice(-4)}`;
    const newFlavor: Flavor = { ...fData, id: nextId };
    setFlavors(prev => [...prev, newFlavor]);
    if (activeUser && activeBranch) {
      logAudit(
        activeUser.id,
        activeUser.name,
        activeBranch.id,
        activeBranch.name,
        `Thêm mới vị kem vào danh mục: ${fData.nameVi}`,
        `Added new flavor to menu register: ${fData.nameEn}`
      );
    }
  };

  const handleUpdateFlavorAction = (updatedFlavor: Flavor) => {
    setFlavors(prev => prev.map(f => f.id === updatedFlavor.id ? updatedFlavor : f));
    if (activeUser && activeBranch) {
      logAudit(
        activeUser.id,
        activeUser.name,
        activeBranch.id,
        activeBranch.name,
        `Cập nhật thông tin vị kem: ${updatedFlavor.nameVi} (Trạng thái: ${updatedFlavor.disabled ? 'Khóa' : 'Hoạt động'})`,
        `Updated flavor info details: ${updatedFlavor.nameEn} (Status: ${updatedFlavor.disabled ? 'Disabled' : 'Active'})`
      );
    }
  };

  const handleDeleteFlavorAction = (fId: string) => {
    setFlavors(prev => prev.filter(f => f.id !== fId));
    if (activeUser && activeBranch) {
      logAudit(
        activeUser.id,
        activeUser.name,
        activeBranch.id,
        activeBranch.name,
        `Xóa vị kem khỏi danh mục: Mã ${fId}`,
        `Removed flavor from registry: Code ${fId}`
      );
    }
  };

  const handleAddToppingAction = (tData: Omit<Topping, 'id'>) => {
    const nextId = `t_${Date.now().toString().slice(-4)}`;
    const newTopping: Topping = { ...tData, id: nextId };
    setToppings(prev => [...prev, newTopping]);
    if (activeUser && activeBranch) {
      logAudit(
        activeUser.id,
        activeUser.name,
        activeBranch.id,
        activeBranch.name,
        `Thêm mới Topping vào danh mục: ${tData.nameVi}`,
        `Added new topping to menu register: ${tData.nameEn}`
      );
    }
  };

  const handleUpdateToppingAction = (updatedTopping: Topping) => {
    setToppings(prev => prev.map(t => t.id === updatedTopping.id ? updatedTopping : t));
    if (activeUser && activeBranch) {
      logAudit(
        activeUser.id,
        activeUser.name,
        activeBranch.id,
        activeBranch.name,
        `Cập nhật thông tin Topping: ${updatedTopping.nameVi} (Trạng thái: ${updatedTopping.disabled ? 'Khóa' : 'Hoạt động'})`,
        `Updated topping info details: ${updatedTopping.nameEn} (Status: ${updatedTopping.disabled ? 'Disabled' : 'Active'})`
      );
    }
  };

  const handleDeleteToppingAction = (tId: string) => {
    setToppings(prev => prev.filter(t => t.id !== tId));
    if (activeUser && activeBranch) {
      logAudit(
        activeUser.id,
        activeUser.name,
        activeBranch.id,
        activeBranch.name,
        `Xóa Topping khỏi danh mục: Mã ${tId}`,
        `Removed topping from registry: Code ${tId}`
      );
    }
  };

  const handleAddAccompanimentAction = (aData: Omit<Accompaniment, 'id'>) => {
    const nextId = `a_${Date.now().toString().slice(-4)}`;
    const newAcc: Accompaniment = { ...aData, id: nextId };
    setAccompaniments(prev => [...prev, newAcc]);
    if (activeUser && activeBranch) {
      logAudit(
        activeUser.id,
        activeUser.name,
        activeBranch.id,
        activeBranch.name,
        `Thêm mới Đồ ăn kèm vào danh mục: ${aData.nameVi}`,
        `Added new accompaniment to menu register: ${aData.nameEn}`
      );
    }
  };

  const handleUpdateAccompanimentAction = (updatedAcc: Accompaniment) => {
    setAccompaniments(prev => prev.map(a => a.id === updatedAcc.id ? updatedAcc : a));
    if (activeUser && activeBranch) {
      logAudit(
        activeUser.id,
        activeUser.name,
        activeBranch.id,
        activeBranch.name,
        `Cập nhật đồ ăn kèm: ${updatedAcc.nameVi} (Trạng thái: ${updatedAcc.disabled ? 'Khóa' : 'Hoạt động'})`,
        `Updated accompaniment details: ${updatedAcc.nameEn} (Status: ${updatedAcc.disabled ? 'Disabled' : 'Active'})`
      );
    }
  };

  const handleDeleteAccompanimentAction = (aId: string) => {
    setAccompaniments(prev => prev.filter(a => a.id !== aId));
    if (activeUser && activeBranch) {
      logAudit(
        activeUser.id,
        activeUser.name,
        activeBranch.id,
        activeBranch.name,
        `Xóa đồ ăn kèm khỏi danh mục: Mã ${aId}`,
        `Removed accompaniment from registry: Code ${aId}`
      );
    }
  };

  // Update electronic invoice codes
  const handleUpdateInvoiceStatus = (bId: string, status: any, invCode: string, explainNote?: string) => {
    setOrders(prev => prev.map(o => {
      if (o.id === bId) {
        return {
          ...o,
          invoiceStatus: status,
          invoiceCode: invCode
        };
      }
      return o;
    }));

    if (activeUser && activeBranch) {
      logAudit(
        activeUser.id,
        activeUser.name,
        activeBranch.id,
        activeBranch.name,
        `Liên kết TCT xuất hóa đơn điện tử VAT Bill #${bId.slice(-6)}. Trạng thái: ${status.toUpperCase()}, Số hóa đơn: ${invCode}. Ghi chú: ${explainNote || 'N/A'}`,
        `E-Invoice API callback synchronized on bill #${bId.slice(-6)}. Status: ${status.toUpperCase()}, Token serial: ${invCode}. Note: ${explainNote || 'N/A'}`
      );
    }
  };

  // Edit/Modify bill (Staff permitted action, but no deleting!)
  const handleSalesBillEditAmount = (billId: string, itemIdxToReduce: number, newReasonText: string) => {
    if (!activeUser || !activeBranch) return;

    const matchedO = orders.find(o => o.id === billId);
    if (!matchedO) return;

    const oldTotal = matchedO.total;
    const itemsUpdated = matchedO.items.map((it, idx) => {
      if (idx === itemIdxToReduce) {
        const nextQty = Math.max(1, it.quantity - 1);
        return { ...it, quantity: nextQty };
      }
      return it;
    });

    // Recalculately subtotals
    const subtotal = itemsUpdated.reduce((sum, item) => sum + (item.price * item.quantity), 0);
    const discount = Math.round((subtotal * (matchedO.voucherCode ? 10 : 0)) / 100);
    const taxAmount = Math.round(((subtotal - discount) * matchedO.taxRate) / 100);
    const newTotal = (subtotal - discount) + taxAmount;

    // Create edit audit note
    const editLog = {
      editedBy: `${activeUser.name} (${activeUser.id})`,
      date: new Date().toISOString().replace('T', ' ').slice(0, 16),
      reason: newReasonText || 'Khách hoàn bớt kem viên tại quầy',
      oldTotal,
      newTotal
    };

    setOrders(prev => prev.map(o => {
      if (o.id === billId) {
        const edits = o.editHistory ? [...o.editHistory, editLog] : [editLog];
        return {
          ...o,
          items: itemsUpdated,
          subtotal,
          taxAmount,
          total: newTotal,
          editHistory: edits
        };
      }
      return o;
    }));

    logAudit(
      activeUser.id,
      activeUser.name,
      activeBranch.id,
      activeBranch.name,
      `Nhân viên điều chỉnh giảm BILL #${billId.slice(-6)}. Số tiền cũ: ${oldTotal.toLocaleString()}đ -> Tiền mới: ${newTotal.toLocaleString()}đ. Lý do: ${newReasonText}`,
      `Staff resized billing totals for BILL #${billId.slice(-6)}. Previous: ${oldTotal.toLocaleString()}đ -> New: ${newTotal.toLocaleString()}đ. Justification: ${newReasonText}`
    );
    alert(lang === 'vi' ? 'Đã chỉnh sửa bill thành công! Trọng tài kiểm toán đã lưu lịch sử.' : 'Bill modified! Edit trace logged in system files.');
  };

  // Render language lookup helpers
  const t = LOCALES[lang];
  const isVi = lang === 'vi';

  // --- RENDERING VIEWS ---

  // 1. Splash secure login screens
  if (!activeUser || !activeBranch) {
    return (
      <div className="min-h-screen bg-[#FFF7EE] flex items-center justify-center p-4 font-sans select-none relative overflow-hidden text-stone-850">
        
        {/* Playful bear ambient backdrops */}
        <div className="absolute top-10 left-10 text-brand-sage/10 pointer-events-none scale-150">
          <svg className="w-56 h-56" viewBox="0 0 100 100" fill="currentColor">
            <path d="M50 20 C 35 20, 20 35, 20 50 C 20 65, 35 80, 50 80 C 65 80, 80 65, 80 50 C 80 35, 65 20, 50 20 Z" />
          </svg>
        </div>

        <div className="w-full max-w-md bg-white rounded-3xl p-6 sm:p-8 border border-amber-900/10 shadow-xl relative z-10 space-y-6">
          <div className="text-center space-y-1">
            <div className="flex justify-center mb-1">
              {/* Gấu Gelato stylized SVG logotype matching brand sheet */}
              <svg viewBox="0 0 100 100" className="w-20 h-20 text-[#5B3F23] fill-current">
                <circle cx="28" cy="22" r="8" />
                <circle cx="72" cy="22" r="8" />
                <path d="M50 32 C 30 32, 20 45, 20 62 C 20 80, 32 88, 50 88 C 68 88, 80 80, 80 62 C 80 45, 70 32, 50 32 Z" fill="none" stroke="#5B3F23" strokeWidth="5"/>
                <ellipse cx="50" cy="65" rx="14" ry="10" fill="#FFF5E4" />
                <circle cx="50" cy="60" r="3.5" />
                <path d="M46 64 C 48 68, 52 68, 54 64" fill="none" stroke="#5B3F23" strokeWidth="1.5" strokeLinecap="round"/>
                <circle cx="38" cy="50" r="3" />
                <circle cx="62" cy="50" r="3" />
              </svg>
            </div>
            <h1 className="text-2xl font-black font-display text-[#5B3F23] tracking-tight">{t.brandName}</h1>
            <p className="text-[10px] uppercase font-bold text-gray-500 tracking-wider font-mono">{t.slogan}</p>
          </div>

          <div className="bg-[#FFF7EE] p-4 rounded-2xl text-center border">
            <p className="text-xs text-stone-600 leading-relaxed font-medium">
              {t.loginIntro}
            </p>
          </div>

          {/* Secure login form */}
          <form onSubmit={handleManualLogin} className="space-y-4">
            <div className="space-y-1">
              <label className="text-[10px] uppercase font-bold text-gray-400 block">{isVi ? 'Số điện thoại nhân sự' : 'Employee Username phone'}</label>
              <input
                type="text"
                required
                value={loginPhone}
                onChange={e => setLoginPhone(e.target.value)}
                placeholder={t.phonePlaceholder}
                className="w-full text-xs font-semibold p-3 border rounded-xl bg-blend-lighten focus:outline-none focus:ring-1 focus:ring-amber-800"
              />
            </div>

            <div className="space-y-1">
              <label className="text-[10px] uppercase font-bold text-gray-400 block">{isVi ? 'Mã PIN bảo mật 10 chữ số' : 'Employee PIN Security key'}</label>
              <input
                type="password"
                required
                maxLength={10}
                value={loginPin}
                onChange={e => setLoginPin(e.target.value)}
                placeholder={t.pinPlaceholder}
                className="w-full text-xs font-mono font-bold p-3 border rounded-xl bg-blend-lighten focus:outline-none focus:ring-1 focus:ring-amber-800"
              />
            </div>

            {loginError && (
              <div className="bg-red-50 text-red-700 p-2 text-center rounded-xl text-xs font-medium leading-tight">
                ⚠️ {t.invalidLogin}
              </div>
            )}

            <button
              type="submit"
              className="w-full bg-[#5B3F23] hover:bg-amber-950 text-white font-bold text-xs py-3 px-4 rounded-xl shadow-lg transition cursor-pointer"
            >
              🔒 {t.loginBtn}
            </button>
          </form>

          {/* Languages Selector */}
          <div className="flex justify-center gap-4 text-xs font-semibold border-t pt-4">
            <button
              onClick={() => setLang('vi')}
              className={`pb-1 px-1 transition ${lang === 'vi' ? 'border-b-2 border-amber-800 text-stone-900' : 'text-stone-400'}`}
            >
              🇻🇳 {t.langVi}
            </button>
            <button
              onClick={() => setLang('en')}
              className={`pb-1 px-1 transition ${lang === 'en' ? 'border-b-2 border-amber-800 text-stone-900' : 'text-stone-400'}`}
            >
              🇺🇸 {t.langEn}
            </button>
          </div>

          {/* Quick tester bypass assist triggers */}
          <div className="pt-2 border-t text-center space-y-1.5 no-print">
            <span className="text-[9px] uppercase font-bold text-gray-400 tracking-wider">Hỗ trợ Tester đăng nhập nhanh</span>
            <div className="flex gap-2">
              <button
                onClick={() => triggerAutoLogin('0966123456', '1234567890')}
                className="bg-[#A8B69A]/20 hover:bg-[#A8B69A]/40 text-[#5B3F23] text-[9.5px] font-semibold py-1 px-2.5 rounded-lg flex-1 border border-[#A8B69A]/30 cursor-pointer"
              >
                🍦 {t.staffAutoLogin}
              </button>
              <button
                onClick={() => triggerAutoLogin('0900000000', '0000000000')}
                className="bg-[#F4AFA3]/20 hover:bg-[#F4AFA3]/40 text-[#5B3F23] text-[9.5px] font-semibold py-1 px-2.5 rounded-lg flex-1 border border-[#F4AFA3]/30 cursor-pointer"
              >
                👑 {t.adminAutoLogin}
              </button>
            </div>
          </div>

        </div>
      </div>
    );
  }

  // Active cashier metrics
  const isUserAdmin = activeUser.role === 'admin';

  return (
    <div className="min-h-screen bg-[#FFF7EE] font-sans flex flex-col justify-between text-stone-800">
      
      {isOffline && (
        <div className="bg-stone-500/10 border-b border-stone-500/10 py-2 px-4 text-center text-[11px] text-stone-700 font-bold flex items-center justify-center gap-2 select-none no-print">
          <span>📶</span>
          <span>{isVi 
            ? "MẤT KẾT NỐI: Đang hoạt động ở chế độ Ngoại tuyến. Dữ liệu của bạn được lưu trữ an toàn trong LocalStorage!" 
            : "OFFLINE STATUS: Operational under offline conditions. System entries cached safely in LocalStorage!"}
          </span>
        </div>
      )}
      
      {/* 2. TOP BANNER BRAND HEADER */}
      <header className="bg-white border-b border-amber-900/10 py-3 px-4 sm:px-6 sticky top-0 z-40 shadow-sm no-print">
        <div className="max-w-7xl mx-auto flex items-center justify-between gap-4">
          
          {/* Logo and store names details */}
          <div className="flex items-center gap-3">
            <div className="flex items-center gap-1">
              <svg viewBox="0 0 100 100" className="w-10 h-10 text-[#5B3F23] fill-current">
                <circle cx="28" cy="22" r="7" />
                <circle cx="72" cy="22" r="7" />
                <path d="M50 32 C 30 32, 20 45, 20 62 C 20 80, 32 88, 50 88 C 68 88, 80 80, 80 62 C 80 45, 70 32, 50 32 Z" fill="none" stroke="#5B3F23" strokeWidth="6"/>
                <ellipse cx="50" cy="65" rx="14" ry="10" fill="#FFF5E4" />
                <circle cx="50" cy="60" r="3.5" />
                <circle cx="38" cy="50" r="35" opacity="0"/>
                <circle cx="38" cy="50" r="2.5" />
                <circle cx="62" cy="50" r="2.5" />
              </svg>
              <div>
                <h1 className="text-base font-black font-display text-[#5B3F23] tracking-tight -mb-0.5">Gấu Gelato</h1>
                <span className="text-[8.5px] uppercase font-bold text-[#A8B69A] tracking-wider block font-mono">{t.freshGelato}</span>
              </div>
            </div>
            
            {/* Active station details */}
            <div className="hidden lg:flex items-center gap-2 border-l pl-3 text-stone-500 text-xs">
              <div>
                <span>{t.branchLabel}: </span>
                <strong className="text-stone-800">{activeBranch.name}</strong>
              </div>
              <div className="align-middle px-2 py-0.5 rounded-full text-[9px] font-bold tracking-widest bg-amber-100 text-amber-800 uppercase">
                {activeUser.role}
              </div>
            </div>
          </div>

          {/* Languages switch and Logout button bar */}
          <div className="flex items-center gap-4">
            
            {/* Flag language switcher */}
            <div className="flex gap-2 text-xs font-semibold">
              <button
                onClick={() => setLang('vi')}
                className={`p-1.5 rounded-lg border transition cursor-pointer ${lang === 'vi' ? 'bg-[#5B3F23] text-stone-50 border-[#5B3F23]' : 'bg-stone-50 text-stone-400'}`}
              >
                🇻🇳 VN
              </button>
              <button
                onClick={() => setLang('en')}
                className={`p-1.5 rounded-lg border transition cursor-pointer ${lang === 'en' ? 'bg-[#5B3F23] text-stone-50 border-[#5B3F23]' : 'bg-stone-50 text-stone-400'}`}
              >
                🇺🇸 EN
              </button>
            </div>

            {/* Operator bio */}
            <div className="text-right hidden sm:block text-xs leading-none">
              <span className="text-[9px] uppercase font-bold text-gray-400 block">{t.staffLabel}</span>
              <strong className="text-[#5B3F23]">{activeUser.name}</strong>
            </div>

            <button
              onClick={handleLogout}
              className="bg-stone-100 hover:bg-stone-200 text-[#5B3F23] text-xs font-bold py-1.5 px-3 rounded-lg border cursor-pointer select-none transition"
            >
              🚪 {t.logout}
            </button>
          </div>

        </div>
      </header>

      {/* 3. NAVIGATION RAIL & MAIN TAB CONTAINER */}
      <nav className="bg-white border-b border-amber-900/10 no-print">
        <div className="max-w-7xl mx-auto overflow-x-auto flex gap-1 p-2">
          
          <button
            onClick={() => setActiveTab('sales')}
            className={`flex-shrink-0 text-xs font-bold py-2 px-4 rounded-xl transition cursor-pointer flex items-center gap-1.5 ${activeTab === 'sales' ? 'bg-[#4A3E3E]/10 text-[#4A3E3E]' : 'text-stone-500 hover:bg-stone-50'}`}
          >
            🛒 {t.tabSales}
          </button>

          <button
            onClick={() => setActiveTab('inventory')}
            className={`flex-shrink-0 text-xs font-bold py-2 px-4 rounded-xl transition cursor-pointer flex items-center gap-1.5 ${activeTab === 'inventory' ? 'bg-[#4A3E3E]/10 text-[#4A3E3E]' : 'text-stone-500 hover:bg-stone-50'}`}
          >
            📦 {t.tabInventory}
          </button>

          <button
            onClick={() => setActiveTab('invoices')}
            className={`flex-shrink-0 text-xs font-bold py-2 px-4 rounded-xl transition cursor-pointer flex items-center gap-1.5 ${activeTab === 'invoices' ? 'bg-[#4A3E3E]/10 text-[#4A3E3E]' : 'text-stone-500 hover:bg-stone-50'}`}
          >
            🧾 {t.tabInvoices}
          </button>

          <button
            onClick={() => setActiveTab('costs')}
            className={`flex-shrink-0 text-xs font-bold py-2 px-4 rounded-xl transition cursor-pointer flex items-center gap-1.5 ${activeTab === 'costs' ? 'bg-[#4A3E3E]/10 text-[#4A3E3E]' : 'text-stone-500 hover:bg-stone-50'}`}
          >
            💰 {t.tabCosts}
          </button>

          {isUserAdmin && (
            <button
              onClick={() => setActiveTab('admin')}
              className={`flex-shrink-0 text-xs font-bold py-2 px-4 rounded-xl transition cursor-pointer flex items-center gap-1.5 ${activeTab === 'admin' ? 'bg-[#4A3E3E]/10 text-[#4A3E3E]' : 'text-stone-500 hover:bg-stone-50'}`}
            >
              👑 {t.tabAdmin}
            </button>
          )}

          <button
            onClick={() => setActiveTab('audits')}
            className={`flex-shrink-0 text-xs font-bold py-2 px-4 rounded-xl transition cursor-pointer flex items-center gap-1.5 ${activeTab === 'audits' ? 'bg-[#4A3E3E]/10 text-[#4A3E3E]' : 'text-stone-500 hover:bg-stone-50'}`}
          >
            📋 {t.tabAudits}
          </button>

          <button
            onClick={() => setActiveTab('loyalty')}
            className={`flex-shrink-0 text-xs font-bold py-2 px-4 rounded-xl transition cursor-pointer flex items-center gap-1.5 ${activeTab === 'loyalty' ? 'bg-[#4A3E3E]/10 text-[#4A3E3E]' : 'text-stone-500 hover:bg-stone-50'}`}
          >
            ⚙️ {t.tabLoyalty}
          </button>

        </div>
      </nav>

      {/* 4. MASTER WORKSPACE GRID PORT */}
      <main className="flex-1 p-4 sm:p-6 max-w-7xl mx-auto w-full">
        
        {/* TAB 1: RETALES POS SALES OUTLET SCREEN */}
        {activeTab === 'sales' && (
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start font-sans">
            
            {/* Left: Interactive Menu Grid Block */}
            <div className="lg:col-span-8 space-y-6">
              
              {/* Selection Modes Switchboard */}
              <div className="flex bg-white p-1.5 rounded-2xl border border-stone-200">
                <button
                  onClick={() => setSalesModel('set')}
                  className={`flex-1 text-xs font-bold py-2.5 px-3 rounded-xl transition cursor-pointer ${salesModel === 'set' ? 'bg-[#4A3E3E] text-stone-50 shadow-sm' : 'text-stone-500 hover:text-stone-800'}`}
                >
                  🐻 {t.modeSet}
                </button>
                <button
                  onClick={() => setSalesModel('weight')}
                  className={`flex-1 text-xs font-bold py-2.5 px-3 rounded-xl transition cursor-pointer ${salesModel === 'weight' ? 'bg-[#4A3E3E] text-stone-50 shadow-sm' : 'text-stone-500 hover:text-stone-800'}`}
                >
                  ⚖️ {t.modeWeight}
                </button>
                <button
                  onClick={() => setSalesModel('companions')}
                  className={`flex-1 text-xs font-bold py-2.5 px-3 rounded-xl transition cursor-pointer ${salesModel === 'companions' ? 'bg-[#4A3E3E] text-stone-50 shadow-sm' : 'text-stone-500 hover:text-stone-800'}`}
                >
                  🍞 {t.modeAccompaniment}
                </button>
              </div>

              {/* SALES CONTENT MODEL FLOWS */}
              {salesModel === 'set' && (
                <div className="bg-white p-5 rounded-3xl border border-amber-900/5 shadow-sm space-y-6">
                  <div className="flex items-center justify-between border-b pb-3 flex-wrap gap-2">
                    <div>
                      <h4 className="font-bold text-base text-[#4A3E3E]">{t.modeSet}</h4>
                      <p className="text-[10px] text-gray-500 mt-0.5">{isVi ? 'Giá bán cố định tính theo số lượng viên tròn ú nu.' : 'Fixed pricing models based on numbers of round scoops.'}</p>
                    </div>

                    {/* Pre-baked scoops togglers */}
                    <div className="flex bg-stone-100 p-1 rounded-xl">
                      {[1, 2, 3].map(num => (
                        <button
                          key={num}
                          onClick={() => {
                            setSelectedScoopCount(num);
                            setIsBuildingCustomSet(false);
                          }}
                          className={`text-xs font-bold px-3 py-1.5 rounded-lg transition cursor-pointer ${selectedScoopCount === num && !isBuildingCustomSet ? 'bg-white text-stone-800 shadow-sm' : 'text-stone-500'}`}
                        >
                          {num} {isVi ? 'Viên' : 'Scoops'}
                        </button>
                      ))}
                      <button
                        onClick={() => {
                          setSelectedScoopCount(customScoopAmount);
                          setIsBuildingCustomSet(true);
                        }}
                        className={`text-xs font-bold px-3 py-1.5 rounded-lg transition cursor-pointer ${isBuildingCustomSet ? 'bg-[#4A3E3E] text-stone-50' : 'text-stone-500'}`}
                      >
                        {isVi ? 'Set tùy chỉnh' : 'Custom Set'}
                      </button>
                    </div>
                  </div>

                  {/* Custom scoops count slider input */}
                  {isBuildingCustomSet && (
                    <div className="bg-amber-50/40 p-4 rounded-2xl border border-amber-950/5 flex items-center justify-between gap-4">
                      <div>
                        <span className="text-[10px] uppercase font-bold text-gray-500">{t.customSetBuilder}</span>
                        <strong className="block text-[#4A3E3E] text-base font-display mt-1">Set {customScoopAmount} Viên = {(15000 + (customScoopAmount - 1) * 10000).toLocaleString('vi-VN')}đ</strong>
                      </div>
                      <input
                        type="range"
                        min="1"
                        max="10"
                        value={customScoopAmount}
                        onChange={e => {
                          const val = parseInt(e.target.value);
                          setCustomScoopAmount(val);
                          setSelectedScoopCount(val);
                        }}
                        className="w-40 accent-amber-850 h-1.5 bg-stone-250 cursor-pointer"
                      />
                    </div>
                  )}

                  {/* Multiple Scoop Chooser Grid indices */}
                  <div className="space-y-4">
                    <span className="block text-xs font-bold text-gray-600 tracking-wide">
                      {t.flavorSelectHelp}
                    </span>

                    <div className="space-y-3.5">
                      {scoopFlavors.map((slotFl, idxSlot) => (
                        <div key={idxSlot} className="bg-stone-50 p-3 rounded-2xl border border-stone-200">
                          <div className="flex justify-between items-center mb-2.5">
                            <span className="text-xs font-bold text-[#4A3E3E]">✓ {isVi ? `Viên kem thứ ${idxSlot + 1}` : `Scoop Slot #${idxSlot + 1}`}</span>
                            <span className="text-[10px] bg-white px-2 py-0.5 rounded border border-gray-350 text-gray-500 italic block leading-none select-none">
                              {slotFl ? (isVi ? flavors.find(f => f.id === slotFl)?.nameVi : flavors.find(f => f.id === slotFl)?.nameEn) : t.notSelected}
                            </span>
                          </div>

                          {/* Grid with 9 colorful illustrations mapping */}
                          <div className="grid grid-cols-3 sm:grid-cols-9 gap-1.5">
                            {flavors.filter(fl => !fl.disabled).map((fl) => (
                              <button
                                key={fl.id}
                                onClick={() => {
                                  const nextFl = [...scoopFlavors];
                                  nextFl[idxSlot] = fl.id;
                                  setScoopFlavors(nextFl);
                                }}
                                className={`p-1 border rounded-xl flex flex-col justify-between items-center transition h-17 select-none cursor-pointer ${scoopFlavors[idxSlot] === fl.id ? 'ring-2 ring-amber-800 scale-102 border-transparent' : 'border-[#4A3E3E]/10 hover:bg-white bg-[#FDFBF7]/30'}`}
                              >
                                {fl.image ? (
                                  <img src={fl.image} referrerPolicy="no-referrer" className="w-8 h-8 rounded-lg object-cover border" alt={fl.nameVi} />
                                ) : (
                                  <div className="w-8 h-8 pointer-events-none" dangerouslySetInnerHTML={{ __html: getFlavorSvg(fl.iconType || 'creamy', fl.color || '#FFAEBC') }} />
                                )}
                                <span className="text-[7px] font-bold tracking-tight text-center truncate w-full block text-stone-700 leading-none mt-1">
                                  {isVi ? fl.nameVi : fl.nameEn}
                                </span>
                              </button>
                            ))}
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>

                  <button
                    onClick={addToCartSetModel}
                    className="w-full bg-[#4A3E3E] hover:bg-amber-950 text-white font-bold text-xs py-3 px-4 rounded-xl shadow cursor-pointer transition"
                  >
                    🛒 {t.addToCart} (Set {selectedScoopCount} {isVi ? 'Viên' : 'Scoops'})
                  </button>
                </div>
              )}

              {/* Weighted scoop mix mode (cân gram) */}
              {salesModel === 'weight' && (
                <div className="bg-white p-5 rounded-3xl border border-amber-900/5 shadow-sm space-y-6">
                  <div>
                    <h4 className="font-bold text-base text-[#4A3E3E]">{t.modeWeight}</h4>
                    <p className="text-[10px] text-gray-500 mt-0.5">{isVi ? 'Khách trộn vị thoải mái tự do, cân trọng lượng thanh toán.' : 'Guests mix colors & amounts. Cashier weighs and enters scale grams.'}</p>
                  </div>

                  {/* Weight Scale inputs */}
                  <div className="bg-[#FDFBF7]/70 p-5 rounded-2xl border flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                    <div className="space-y-0.5">
                      <span className="text-[9.5px] font-bold text-gray-400 block uppercase tracking-wider">{t.weightHelp}</span>
                      <strong className="block text-2xl font-mono font-bold text-[#4A3E3E]">{weightInput} grams = {(weightInput * 300).toLocaleString('vi-VN')}đ</strong>
                    </div>

                    <div className="flex items-center gap-2">
                      <button
                        onClick={() => setWeightInput(prev => Math.max(50, prev - 50))}
                        className="bg-white hover:bg-stone-50 border p-2 text-xs rounded-xl font-bold cursor-pointer transition select-none"
                      >
                        -50g
                      </button>
                      <input
                        type="number"
                        value={weightInput === 0 ? '' : weightInput}
                        onChange={e => setWeightInput(Math.max(0, parseInt(e.target.value) || 0))}
                        placeholder={t.inputWeight}
                        className="w-24 text-center font-mono font-bold text-sm bg-white border rounded-xl p-2.5 focus:outline-none"
                      />
                      <button
                        onClick={() => setWeightInput(prev => prev + 50)}
                        className="bg-white hover:bg-stone-50 border p-2 text-xs rounded-xl font-bold cursor-pointer transition select-none"
                      >
                        +50g
                      </button>
                    </div>
                  </div>

                  <button
                    onClick={addToCartWeightModel}
                    className="w-full bg-[#4A3E3E] hover:bg-amber-950 text-white font-bold text-xs py-3 px-4 rounded-xl shadow cursor-pointer transition"
                  >
                    🛒 {t.addToCart} (Kem cân {weightInput}g)
                  </button>
                </div>
              )}

              {/* Accompaniments side menu */}
              {salesModel === 'companions' && (
                <div className="bg-white p-5 rounded-3xl border border-amber-900/5 shadow-sm space-y-6">
                  <div>
                    <h4 className="font-bold text-base text-[#4A3E3E]">{t.modeAccompaniment}</h4>
                    <p className="text-[10px] text-gray-500 mt-0.5">{isVi ? 'Bạch đậu waffle, vỏ ốc quế giòn nướng thơm lừng bán lẻ riêng biệt.' : 'Waffle baskets, crispy cones and baked brioches served separately.'}</p>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    
                    {/* Accompaniments cards */}
                    <div className="space-y-3.5">
                      <span className="block text-xs font-bold text-gray-500 uppercase tracking-wider">{t.accompanimentHelp}</span>
                      {accompaniments.filter(ac => !ac.disabled).map(ac => (
                        <div key={ac.id} className="flex justify-between items-center p-3.5 rounded-2xl bg-amber-50/15 border border-stone-200">
                          <div>
                            <strong className="block text-xs font-bold text-stone-800">{isVi ? ac.nameVi : ac.nameEn}</strong>
                            <span className="text-[10px] font-mono font-bold text-amber-800 mt-1 block">{ac.price.toLocaleString('vi-VN')}đ</span>
                          </div>
                          <button
                            onClick={() => addToCartAccompaniments(ac, true)}
                            className="bg-[#4A3E3E] hover:bg-amber-900 text-stone-50 font-bold text-[10px] w-8 h-8 rounded-full flex items-center justify-center cursor-pointer select-none py-1"
                          >
                            +
                          </button>
                        </div>
                      ))}
                    </div>

                    {/* Standalone toppings cards */}
                    <div className="space-y-3.5">
                      <span className="block text-xs font-bold text-gray-500 uppercase tracking-wider">{isVi ? 'Sữa, Chocochip & Toppings bán lẻ dán bàn' : 'Retail dry toppings & extra dips'}</span>
                      {toppings.filter(tp => !tp.disabled).map(tp => (
                        <div key={tp.id} className="flex justify-between items-center p-3.5 rounded-2xl bg-amber-50/15 border border-stone-200">
                          <div>
                            <strong className="block text-xs font-bold text-stone-850">{isVi ? tp.nameVi : tp.nameEn}</strong>
                            <span className="text-[10px] font-mono font-bold text-amber-800 mt-1 block">{tp.price.toLocaleString('vi-VN')}đ</span>
                          </div>
                          <button
                            onClick={() => addToCartAccompaniments(tp, false)}
                            className="bg-[#4A3E3E] hover:bg-amber-900 text-stone-50 font-bold text-[10px] w-8 h-8 rounded-full flex items-center justify-center cursor-pointer select-none py-1"
                          >
                            +
                          </button>
                        </div>
                      ))}
                    </div>

                  </div>
                </div>
              )}

            </div>

            {/* Right: Checkout Sidebar POS Summary */}
            <div className="lg:col-span-4 bg-white p-5 rounded-3xl border border-amber-900/5 shadow-md space-y-6">
              <h4 className="text-sm font-bold text-[#4A3E3E] border-b pb-2 tracking-wide uppercase">🛒 {t.cartHeading}</h4>

              {/* Cart List items */}
              <div className="space-y-3 max-h-[220px] overflow-y-auto pr-1">
                {cart.length === 0 ? (
                  <p className="text-gray-400 italic text-xs py-10 text-center select-none">{t.emptyCart}</p>
                ) : (
                  cart.map((item, idx) => (
                    <div key={item.id} className="text-xs flex min-h-12 justify-between items-start border-b border-stone-100 pb-2.5">
                      <div className="space-y-1.5 flex-1 pr-2">
                        <div className="font-bold text-stone-800 leading-tight">
                          {isVi ? item.nameVi : item.nameEn}
                          {item.gramWeight && <span className="text-[9.5px] text-gray-500 font-mono"> ({item.gramWeight}g)</span>}
                        </div>
                        {item.flavorsSelected && item.flavorsSelected.length > 0 && (
                          <div className="text-[9px] text-[#A4907C] font-semibold leading-none lowercase">
                            ({item.flavorsSelected.join(', ')})
                          </div>
                        )}
                        <span className="text-[10.5px] font-mono font-semibold text-[#4A3E3E]">
                          {item.price.toLocaleString()}đ x {item.quantity}
                        </span>
                      </div>
                      <button
                        onClick={() => handleRemoveCartItem(item.id)}
                        className="text-stone-300 hover:text-red-500 text-base font-bold pl-1.5 py-0.5 cursor-pointer leading-none block"
                      >
                        ×
                      </button>
                    </div>
                  ))
                )}
              </div>

              {/* Dynamic point lookup and validation fields */}
              <div className="space-y-4 border-t pt-4">
                
                {/* 1. Member Lookup */}
                <div className="bg-[#FDFBF7]/45 p-3.5 rounded-2xl border space-y-2">
                  <span className="block text-[10px] uppercase font-bold text-stone-600 leading-none">{t.memberLookup}</span>
                  <div className="flex gap-2.5">
                    <input
                      type="text"
                      placeholder={isVi ? 'Nhập sđt khách...' : 'Guest phone...'}
                      value={clientSearchPhone}
                      onChange={e => setClientSearchPhone(e.target.value)}
                      className="text-xs border rounded-xl p-2.5 flex-1 bg-white focus:ring-1 focus:ring-amber-500 outline-none"
                    />
                    <button
                      onClick={handleMemberPointsLookup}
                      className="bg-[#4A3E3E] hover:bg-amber-950 text-white font-bold text-[11px] px-4 rounded-xl cursor-pointer transition shrink-0"
                    >
                      {isVi ? 'Tìm' : 'Find'}
                    </button>
                  </div>

                  {/* Quick select registered members */}
                  {members.length > 0 && (
                    <div className="pt-1.5 space-y-1">
                      <span className="block text-[8px] uppercase tracking-wider font-extrabold text-stone-500 leading-none">{isVi ? '💡 CHỌN NHANH HỘI VIÊN:' : '💡 QUICK SELECT GUEST:'}</span>
                      <div className="grid grid-cols-1 gap-1 max-h-24 overflow-y-auto pr-1">
                        {members.slice(0, 4).map(m => (
                          <div 
                            key={m.phone}
                            onClick={() => {
                              setClientSearchPhone(m.phone);
                              setActiveCustomer(m);
                              setLoyaltyPointsToRedeem(0);
                            }}
                            className={`group rounded-xl p-1.5 px-2 border flex items-center justify-between text-[10px] font-bold cursor-pointer transition select-none ${activeCustomer?.phone === m.phone ? 'bg-amber-900 border-amber-950 text-white' : 'bg-white hover:bg-amber-50 text-stone-700 border-stone-200'}`}
                          >
                            <span className="truncate">👤 {m.name} ({m.phone}) &bull; <strong className={activeCustomer?.phone === m.phone ? 'text-amber-200' : 'text-amber-800'}>{m.points}pt</strong></span>
                            
                            <span className="bg-stone-100 hover:bg-stone-200 text-[#4A3E3E] font-extrabold text-[8.5px] px-1.5 py-0.5 rounded border border-stone-300 block transition select-none shrink-0">
                              {isVi ? 'Áp dụng' : 'Apply'}
                            </span>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {activeCustomer && (
                    <div className="text-[10px] leading-tight space-y-1 bg-white p-2.5 rounded-xl border border-stone-200 mt-2 text-stone-700">
                      <div>🧑  {isVi ? 'Bao gồm Thẻ' : 'Active Card'}: <strong>{activeCustomer.name}</strong></div>
                      <div>🎖️  {t.pointsLabel}: <strong className="text-amber-800">{activeCustomer.points} pts</strong></div>
                      
                      {/* Active point swap discount button */}
                      {activeCustomer.points >= 10 && (
                        <button
                          onClick={() => {
                            const discAmt = activeCustomer.points * 1000; // 1pt = 1000đ
                            setLoyaltyPointsToRedeem(discAmt);
                            alert(isVi ? `Đã dùng ${activeCustomer.points} điểm để trừ ${discAmt.toLocaleString()}đ!` : `Applied ${activeCustomer.points} points for deduction!`);
                          }}
                          className="bg-green-100 hover:bg-green-200 text-green-850 text-[9.5px] font-bold py-1.5 px-2.5 rounded-lg border border-green-300 cursor-pointer block w-full text-center mt-1.5"
                        >
                          🎁 {t.applyPointsDiscount.replace('{points}', (activeCustomer.points * 1000).toLocaleString())}
                        </button>
                      )}
                    </div>
                  )}
                </div>
 
                {/* 2. Voucher validation codes */}
                <div className="bg-[#FDFBF7]/45 p-3.5 rounded-2xl border space-y-2">
                  <span className="block text-[10px] uppercase font-bold text-stone-600 leading-none">{t.voucherApply}</span>
                  <div className="flex gap-2.5">
                    <input
                      type="text"
                      placeholder={t.voucherPlaceholder}
                      value={promoCouponCode}
                      onChange={e => {
                        setPromoCouponCode(e.target.value);
                        setVoucherError('');
                      }}
                      className="text-xs border rounded-xl p-2.5 bg-white flex-1 focus:ring-1 focus:ring-amber-500 outline-none"
                    />
                    <button
                      onClick={() => handleVoucherValidation()}
                      className="bg-[#4A3E3E] hover:bg-amber-950 text-white font-bold text-[11px] px-4 rounded-xl cursor-pointer transition shrink-0"
                    >
                      {isVi ? 'Áp dụng' : 'Apply'}
                    </button>
                  </div>

                  {/* List of active promotion vouchers to instantly tap and apply */}
                  {(() => {
                    const todayStr = new Date().toISOString().split('T')[0];
                    const activeVouchersForQuickSelect = vouchers.filter(v => !v.disabled && v.expiryDate >= todayStr);
                    if (activeVouchersForQuickSelect.length === 0) return null;
                    return (
                      <div className="pt-1.5 space-y-1">
                        <span className="block text-[8px] uppercase tracking-wider font-extrabold text-stone-500 leading-none">
                          {isVi ? '🎫 MÃ GIẢM GIÁ HIỆN CÓ SẴN (BẤM ÁP DỤNG CỤ THỂ):' : '🎫 ACTIVE COUPONS LIST (TAP TO VALIDATE):'}
                        </span>
                        <div className="grid grid-cols-1 gap-1 max-h-28 overflow-y-auto pr-1">
                          {activeVouchersForQuickSelect.map(v => (
                            <div 
                              key={v.code}
                              onClick={() => {
                                handleVoucherValidation(v.code);
                              }}
                              className={`group rounded-xl p-1.5 px-2 border flex items-center justify-between text-[10.5px] font-bold cursor-pointer transition select-none ${appliedVoucher?.code === v.code ? 'bg-amber-900 border-amber-950 text-white' : 'bg-white hover:bg-rose-50 text-stone-700 border-stone-200'}`}
                            >
                              <span className="truncate font-mono">
                                🎫 {v.code} ({v.discountType === 'percent' ? `${v.value}%` : `${(v.value).toLocaleString()}đ`})
                              </span>
                              
                              <span className="bg-stone-100 hover:bg-stone-200 text-[#4A3E3E] font-extrabold text-[8.5px] px-1.5 py-0.5 rounded border border-stone-300 block transition select-none shrink-0">
                                {isVi ? 'Áp dụng' : 'Apply'}
                              </span>
                            </div>
                          ))}
                        </div>
                      </div>
                    );
                  })()}

                  {/* Validation error display line */}
                  {voucherError && (
                    <div className="text-[10px] bg-rose-50 border border-rose-200 text-rose-800 p-2.5 rounded-xl leading-snug mt-1 font-semibold flex items-start gap-1 text-left">
                      <span className="shrink-0">⚠️</span>
                      <span>{voucherError}</span>
                    </div>
                  )}

                  {appliedVoucher && !voucherError && (
                    <div className="mt-1">
                      {(() => {
                        const subtotal = cart.reduce((sum, item) => sum + (item.price * item.quantity), 0);
                        return subtotal >= appliedVoucher.minOrder ? (
                          <span className="text-[9.5px] text-green-700 font-bold block bg-green-50 p-2 rounded-xl border border-green-200 text-left">
                            ✓ {isVi ? 'Đã kích hoạt ưu đãi' : 'Promo Active'}: {appliedVoucher.code} ({appliedVoucher.discountType === 'percent' ? `${appliedVoucher.value}% Off` : `${appliedVoucher.value.toLocaleString()}đ Off`})
                          </span>
                        ) : (
                          <span className="text-[10px] bg-amber-50 border border-amber-250 text-amber-800 p-2.5 rounded-xl leading-snug font-semibold block text-left">
                            ⚠️ {isVi 
                              ? `Đã nhận mã "${appliedVoucher.code}" nhưng CHƯA ĐỦ ĐIỀU KIỆN! Hóa đơn tối thiểu cần đạt ${appliedVoucher.minOrder.toLocaleString()}đ (hiện mới có ${subtotal.toLocaleString()}đ).` 
                              : `Coupon "${appliedVoucher.code}" applied but NOT ACTIVE: Min spend of ${appliedVoucher.minOrder.toLocaleString()}đ is required (currently ${subtotal.toLocaleString()}đ).`}
                          </span>
                        );
                      })()}
                    </div>
                  )}
                </div>

              </div>

              {/* Conclude billing calculations */}
              {cart.length > 0 && (
                <div className="border-t pt-4 space-y-2 text-xs leading-none">
                  {(() => {
                    const { subtotal, discount, taxAmount, grandTotal } = calculateFinalPOSCheckoutTotal();
                    return (
                      <>
                        <div className="flex justify-between">
                          <span>{t.subtotal}:</span>
                          <span className="font-mono font-bold text-stone-700">{subtotal.toLocaleString('vi-VN')}đ</span>
                        </div>
                        {discount > 0 && (
                          <div className="flex justify-between text-rose-700">
                            <span>{t.discount}:</span>
                            <span className="font-mono font-bold">-{discount.toLocaleString('vi-VN')}đ</span>
                          </div>
                        )}
                        <div className="flex justify-between items-center text-gray-500 border-t border-b border-dotted border-stone-200 py-1 my-1">
                          <div className="flex items-center gap-1">
                            <span className="text-[10px] font-medium text-stone-600">{isVi ? 'Tỷ lệ VAT:' : 'VAT:'}</span>
                            <input
                              type="number"
                              min="0"
                              max="100"
                              value={vTaxRate}
                              onChange={(e) => {
                                const val = Math.min(100, Math.max(0, Number(e.target.value) || 0));
                                setVTaxRate(val);
                              }}
                              className="w-10 text-center text-[10.5px] font-extrabold font-mono text-stone-850 bg-stone-50 border border-stone-200 rounded px-1 py-0.5 outline-none focus:ring-1 focus:ring-amber-500"
                            />
                            <span className="font-bold text-[10.5px] text-stone-600">%</span>
                            <div className="flex gap-0.5 ml-1 select-none">
                              {[8, 10].map(rate => (
                                <button
                                  key={rate}
                                  type="button"
                                  onClick={() => setVTaxRate(rate)}
                                  className={`text-[9.5px] font-black leading-none px-1.5 py-0.7 rounded border cursor-pointer transition ${vTaxRate === rate ? 'bg-[#4A3E3E] border-[#4A3E3E] text-white' : 'bg-stone-50 border-stone-200 text-stone-600 hover:bg-stone-100'}`}
                                >
                                  {rate}%
                                </button>
                              ))}
                            </div>
                          </div>
                          <span className="font-mono text-[11px] text-stone-700 font-bold">{taxAmount.toLocaleString('vi-VN')}đ</span>
                        </div>
                        <div className="flex justify-between font-black text-sm text-[#4A3E3E] pt-1">
                          <span>{t.concludeTotal}:</span>
                          <span className="font-mono tracking-tight text-base">{grandTotal.toLocaleString('vi-VN')}đ</span>
                        </div>
                        
                        {/* Earned point preview */}
                        {activeCustomer && (
                          <div className="text-[9px] text-[#A4907C] font-bold pt-1 uppercase">
                            ✓ {t.pointsEarned.replace('{points}', Math.max(1, Math.floor(grandTotal / 10000)).toString())}
                          </div>
                        )}
                      </>
                    );
                  })()}
                </div>
              )}

              {/* Payment Methods selectors and submit triggers */}
              {cart.length > 0 && (
                <div className="space-y-4 border-t pt-4">
                  <div className="space-y-1.5">
                    <span className="block text-[10px] uppercase font-bold text-gray-400">{t.paymentMethod}</span>
                    <div className="grid grid-cols-2 gap-2">
                      <button
                        onClick={() => setCheckoutPaymentMethod('cash')}
                        className={`text-xs p-2 rounded-xl border font-bold cursor-pointer transition flex items-center justify-center gap-1.5 ${checkoutPaymentMethod === 'cash' ? 'bg-[#4A3E3E] text-stone-50 border-[#4A3E3E]' : 'bg-stone-50 text-stone-600 hover:bg-stone-100'}`}
                      >
                        💵 {isVi ? 'Tiền mặt' : 'Cash'}
                      </button>
                      <button
                        onClick={() => setCheckoutPaymentMethod('qr')}
                        className={`text-xs p-2 rounded-xl border font-bold cursor-pointer transition flex items-center justify-center gap-1.5 ${checkoutPaymentMethod === 'qr' ? 'bg-[#4A3E3E] text-stone-50 border-[#4A3E3E]' : 'bg-stone-50 text-stone-600 hover:bg-stone-100'}`}
                      >
                        📲 Quick VietQR
                      </button>
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-2.5">
                    <button
                      type="button"
                      onClick={handleCheckoutPreview}
                      className="bg-[#FDFBF7] hover:bg-stone-50 border border-stone-300 text-stone-750 font-bold text-[11px] py-3.5 px-2 rounded-2xl shadow-2xs transition flex items-center justify-center gap-1 cursor-pointer select-none"
                    >
                      🔍 {isVi ? 'Xem trước Bill' : 'Preview Draft'}
                    </button>
                    <button
                      type="button"
                      onClick={handleCheckoutConclude}
                      className="bg-[#4A3E3E] hover:bg-amber-950 text-white font-black text-[11px] py-3.5 px-2 rounded-2xl shadow-lg transition flex items-center justify-center gap-1 cursor-pointer select-none"
                    >
                      🖨️ {t.checkoutSubmit}
                    </button>
                  </div>
                </div>
              )}

            </div>

          </div>
        )}

        {/* TAB 2: INVENTORY STOCK CONTROL tab */}
        {activeTab === 'inventory' && (
          <InventoryManager
            lang={lang}
            allBranchStocks={branchStocks || {}}
            branches={branches}
            activeBranch={activeBranch}
            activeUser={activeUser}
            flavors={flavors}
            toppings={toppings}
            accompaniments={accompaniments}
            allInventoryLogs={inventoryLogs}
            onInventoryAction={handleInventoryAction}
          />
        )}

        {/* TAB 3: ZALO CAMPAIGNS outreach tab */}
        {activeTab === 'loyalty' && (
          <div className="space-y-8 font-sans">
            
            {/* Sub-tabs switcher */}
            <div className="flex justify-center">
              <div className="bg-[#4A3E3E]/5 p-1 rounded-2xl border border-[#4A3E3E]/10 flex gap-1 shadow-2xs">
                <button
                  type="button"
                  onClick={() => setLoyaltySubTab('zalo')}
                  className={`py-2 px-5 rounded-xl text-xs font-bold transition flex items-center gap-1.5 cursor-pointer ${
                    loyaltySubTab === 'zalo'
                      ? 'bg-[#4A3E3E] text-white shadow-sm'
                      : 'text-stone-500 hover:text-stone-850 hover:bg-[#4A3E3E]/5'
                  }`}
                >
                  💬 {isVi ? 'Hội viên & Chiến dịch Zalo' : 'Zalo Loyalty & Campaigns'}
                </button>
                <button
                  type="button"
                  onClick={() => setLoyaltySubTab('android')}
                  className={`py-2 px-5 rounded-xl text-xs font-bold transition flex items-center gap-1.5 cursor-pointer ${
                    loyaltySubTab === 'android'
                      ? 'bg-[#4A3E3E] text-white shadow-sm'
                      : 'text-stone-500 hover:text-stone-850 hover:bg-[#4A3E3E]/5'
                  }`}
                >
                  🤖 {isVi ? 'Ứng dụng Android' : 'Android App'}
                </button>
                <button
                  type="button"
                  onClick={() => setLoyaltySubTab('system')}
                  className={`py-2 px-5 rounded-xl text-xs font-bold transition flex items-center gap-1.5 cursor-pointer ${
                    loyaltySubTab === 'system'
                      ? 'bg-[#4A3E3E] text-white shadow-sm'
                      : 'text-stone-500 hover:text-stone-850 hover:bg-[#4A3E3E]/5'
                  }`}
                >
                  💾 {isVi ? 'Sao lưu dữ liệu' : 'Data backups'}
                </button>
              </div>
            </div>

            {loyaltySubTab === 'system' && (
              <div className="space-y-8 max-w-4xl mx-auto text-stone-800">
                <div className="bg-emerald-500/10 border border-emerald-500/20 p-5 rounded-3xl text-emerald-800 font-sans space-y-4">
                  <div className="flex items-center gap-3">
                    <span className="flex h-3.5 w-3.5 rounded-full bg-emerald-500 animate-pulse shrink-0"></span>
                    <h4 className="text-base font-bold font-display">
                      {isVi ? 'CƠ SỞ DỮ LIỆU CỤC BỘ (BỀN VỮNG)' : 'LOCAL DURABLE OFFLINE-FIRST ENGINE'}
                    </h4>
                    <span className="ml-auto bg-emerald-100/80 text-emerald-900 border border-emerald-400/30 text-[9px] px-2 py-0.5 rounded font-mono font-bold uppercase">
                      {isVi ? 'Đang hoạt động' : 'ACTIVE'}
                    </span>
                  </div>
                  
                  <p className="text-xs leading-relaxed text-emerald-950">
                    {isVi 
                      ? '🐻 Gấu Gelato tích hợp hệ thống lưu lữu Ngoại Tuyến Toàn Diện (Offline-First) trên cơ chế LocalStorage. Toàn bộ dữ liệu hóa đơn, kho bãi, nhân viên, chi nhánh và sổ sách chi phí đều được lưu trữ trực tiếp trên thiết bị của bạn. Không sợ mất kết nối mạng hay chậm trễ!'
                      : '🐻 Gấu Gelato integrates a complete Client-Side Local Storage database. Sales tickets, live inventories, staff registry, costs ledger are cached locally inside your browser.'}
                  </p>

                  <div className="bg-white/80 p-4 rounded-2xl border border-emerald-500/10 text-xs text-stone-800 space-y-2">
                    <h5 className="font-bold text-[#4A3E3E] uppercase text-[10px] tracking-wider border-b pb-1">
                      📊 {isVi ? 'Thống kê dữ liệu hiện hành' : 'Cached Datatables Statistics'}
                    </h5>
                    <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 pt-1">
                      <div className="bg-stone-50/50 p-2 rounded-xl border border-stone-200/50 text-center">
                        <span className="text-[10px] text-gray-500 block">{isVi ? 'Chi nhánh' : 'Branches'}</span>
                        <strong className="text-base font-mono text-[#4A3E3E] font-bold">{branches.length}</strong>
                      </div>
                      <div className="bg-stone-50/50 p-2 rounded-xl border border-stone-200/50 text-center">
                        <span className="text-[10px] text-gray-500 block">{isVi ? 'Nhân viên' : 'Staff'}</span>
                        <strong className="text-base font-mono text-[#4A3E3E] font-bold">{staff.length}</strong>
                      </div>
                      <div className="bg-stone-50/50 p-2 rounded-xl border border-stone-200/50 text-center">
                        <span className="text-[10px] text-gray-500 block">{isVi ? 'Nguyên liệu' : 'Ingredients'}</span>
                        <strong className="text-base font-mono text-[#4A3E3E] font-bold">{flavors.length + toppings.length + accompaniments.length}</strong>
                      </div>
                      <div className="bg-stone-50/50 p-2 rounded-xl border border-stone-200/50 text-center">
                        <span className="text-[10px] text-gray-500 block">{isVi ? 'Hóa đơn bán' : 'Orders'}</span>
                        <strong className="text-base font-mono text-[#4A3E3E] font-bold">{orders.length}</strong>
                      </div>
                    </div>
                  </div>

                  <div className="pt-2 flex flex-col sm:flex-row gap-3">
                    <button
                      onClick={exportLocalBackup}
                      className="flex-1 bg-emerald-700 hover:bg-emerald-850 text-white text-xs font-bold py-3 px-4 rounded-xl transition cursor-pointer select-none text-center flex items-center justify-center gap-1.5 shadow-sm"
                    >
                      📥 {isVi ? "Tải File backup cơ sở dữ liệu (.json)" : "Export Database JSON"}
                    </button>
                    <label className="flex-1 bg-[#4D3E3E] hover:bg-[#3D2E2E] text-white text-xs font-bold py-3 px-4 rounded-xl transition cursor-pointer select-none text-center flex items-center justify-center gap-1.5 shadow-sm">
                      📤 {isVi ? "Khôi phục dữ liệu từ File (.json)" : "Restore from backup JSON"}
                      <input
                        type="file"
                        accept=".json"
                        onChange={handleImportBackup}
                        className="hidden"
                      />
                    </label>
                  </div>
                </div>

                <div className="bg-white p-6 rounded-3xl border border-amber-900/5 shadow-sm text-xs leading-relaxed space-y-4 text-stone-700">
                  <h4 className="font-bold text-sm text-[#4A3E3E] border-b pb-2">💡 {isVi ? 'Lưu ý vận hành an toàn offline-first' : 'Durable offline operations notice'}</h4>
                  <ul className="list-disc pl-5 space-y-2">
                    <li>
                      <strong>{isVi ? 'Vấn đề tắt nguồn đột ngột hoặc tắt trình duyệt:' : 'Power cuts or browser termination:'}</strong>
                      {isVi 
                        ? ' Trình duyệt tự động ghim dữ liệu LocalStorage vào ổ cứng (SSD/HDD) ngay khi có thay đổi trạng thái bán hàng/nhập kho. Nếu mất điện đột ngột hoặc đóng tab trình duyệt, toàn bộ số liệu của bạn vẫn được giữ nguyên an toàn 100%.'
                        : ' Browsers automatically write LocalStorage entries directly to physical disk. Unexpected power downs or page tabs closed will not result in any data losses.'}
                    </li>
                    <li>
                      <strong>{isVi ? 'Thao tác dọn dẹp bộ nhớ (Clear Cache & Site data):' : 'Clear Browser Cache & Data:'}</strong>
                      {isVi 
                        ? ' Khi người dùng xóa thủ công Cookie và Toàn bộ giữ liệu trang web trên trình duyệt, bộ nhớ LocalStorage có thể bị xóa hoàn toàn. Do đó, quản trị viên nên tải file sao lưu dự phòng (.json) về thiết bị cá nhân hoặc lưu trữ đám mây mỗi ngày để phòng tránh rủi ro.'
                        : ' Clearing all local browser caches could erase your local database. Backup files should be generated daily into secondary folders.'}
                    </li>
                  </ul>
                </div>
              </div>
            )}

            {loyaltySubTab === 'zalo' && (
              <div className="space-y-8">
                <ZaloSimulator 
                  memberList={members} 
                  lang={lang} 
                />

                {/* AI Copywriting Promotion Generator */}
                <div className="bg-white p-5 rounded-3xl border border-amber-900/5 shadow-sm space-y-6 max-w-4xl mx-auto text-stone-850">
                  <div className="border-b pb-2">
                    <span className="bg-yellow-400 text-amber-950 font-sans text-[8.5px] uppercase px-2 py-0.5 rounded-full font-bold">Server Gemini Pro</span>
                    <h4 className="text-sm font-bold text-[#4A3E3E] flex items-center gap-1.5 mt-1">🤖 Gemini AI Promotion Copy Copilot</h4>
                    <p className="text-xs text-gray-500">{isVi ? 'Được cung cấp bởi mô hình Gemini 3.5 Flash để tự động thiết lập chiến dịch giảm giá, content tiếp thị.' : 'Scribbles campaigns copy for Gấu Gelato brand outlets using Gemini Flash.'}</p>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    
                    {/* Gen inputs */}
                    <div className="space-y-3.5">
                      <div>
                        <label className="block text-[10.5px] uppercase font-bold text-gray-400 mb-1">{isVi ? 'Vibe - Phong cách' : 'Copy Tone Vibe'}</label>
                        <input
                          type="text"
                          value={genVibe}
                          onChange={e => setGenVibe(e.target.value)}
                          className="w-full text-xs border rounded-xl p-2.5 bg-[#FDFBF7]/30"
                        />
                      </div>
                      <div>
                        <label className="block text-[10.5px] uppercase font-bold text-gray-400 mb-1">{isVi ? 'Dịp nghỉ / Mùa lễ hội' : 'Season Context'}</label>
                        <input
                          type="text"
                          value={genSeason}
                          onChange={e => setGenSeason(e.target.value)}
                          className="w-full text-xs border rounded-xl p-2.5 bg-[#FDFBF7]/30"
                        />
                      </div>
                      <div>
                        <label className="block text-[10.5px] uppercase font-bold text-gray-400 mb-1">{isVi ? 'Khách hàng mục tiêu' : 'Target demography'}</label>
                        <input
                          type="text"
                          value={genTarget}
                          onChange={e => setGenTarget(e.target.value)}
                          className="w-full text-xs border rounded-xl p-2.5 bg-[#FDFBF7]/30"
                        />
                      </div>
                      <button
                        onClick={handleAiPromotionsRequest}
                        disabled={isGeneratingPromo}
                        className="w-full bg-[#4A3E3E] hover:bg-amber-950 text-white font-bold text-xs py-2.5 px-4 rounded-xl transition cursor-pointer flex justify-center items-center gap-1"
                      >
                        {isGeneratingPromo ? <span className="animate-pulse">Generating copy...</span> : '⚡ Run Copywriter engine'}
                      </button>
                    </div>

                    {/* Gen Output Results displays */}
                    <div className="bg-[#FDFBF7]/50 p-4 rounded-2xl border border-dashed border-amber-900/10 min-h-48 text-xs leading-relaxed space-y-3">
                      <span className="font-bold uppercase text-[9.5px] text-gray-400 block border-b pb-1">Gen output previews:</span>
                      {aiPromotionsOutput ? (
                        <div className="space-y-3.5">
                          <div>
                            <strong className="block text-amber-800 font-bold uppercase text-[10px]">🇻🇳 [VIETNAMESE VERSION]</strong>
                            <h5 className="font-bold text-stone-850 mt-1">{aiPromotionsOutput.titleVi}</h5>
                            <p className="text-stone-600 text-[11px] leading-relaxed mt-0.5">{aiPromotionsOutput.contentVi}</p>
                            <p className="text-[10px] text-stone-500 italic mt-1 font-semibold">{aiPromotionsOutput.ctaVi}</p>
                          </div>

                          <div className="border-t pt-3.5">
                            <strong className="block text-amber-800 font-bold uppercase text-[10px]">🇺🇸 [ENGLISH TRANSLATED]</strong>
                            <h5 className="font-bold text-stone-850 mt-1">{aiPromotionsOutput.titleEn}</h5>
                            <p className="text-stone-600 text-[11px] leading-relaxed mt-0.5">{aiPromotionsOutput.contentEn}</p>
                            <p className="text-[10px] text-stone-500 italic mt-1 font-semibold">{aiPromotionsOutput.ctaEn}</p>
                          </div>
                        </div>
                      ) : (
                        <p className="text-gray-400 italic text-center text-xs py-14 select-none">
                          {isVi 
                            ? 'Nhập các thông số quảng cáo và nhấp nút để mô hình AI tự thiết kế nội dung tiếp thị.' 
                            : 'Tap run to instruct Supreme Gemini AI to frame marketing posts.'}
                        </p>
                      )}
                    </div>

                  </div>
                </div>
              </div>
            )}

            {loyaltySubTab === 'android' && (
              <AndroidEmulator
                lang={lang}
                onScanEmulatedBarcode={(resultScan) => {
                  // Direct match member check code barcode simulation
                  setClientSearchPhone(resultScan);
                  const matchM = members.find(m => m.phone === resultScan);
                  if (matchM) {
                    setActiveCustomer(matchM);
                    setLoyaltyPointsToRedeem(0);
                    setActiveTab('sales');
                  }
                }}
              >
                {/* Inject entire self React DOM subtree to make nested frame views */}
                <div className="scale-95 origin-top min-h-screen">
                  <header className="bg-[#FDFBF7] border-b py-2 px-3 flex items-center justify-between no-print">
                    <span className="font-bold text-xs font-display text-amber-900">🐻 Gấu Gelato Mobile Station</span>
                    <span className="bg-amber-100 text-amber-850 px-1.5 py-0.5 rounded text-[8.5px] uppercase font-bold font-mono">APK Wrap Mode</span>
                  </header>
                  <div className="p-3">
                    <div className="bg-white p-4 rounded-3xl border">
                      <h4 className="text-xs font-bold text-amber-950 border-b pb-1 mb-2">⚡ Quick Actions tablet checkout desk</h4>
                      <div className="flex gap-2.5">
                        <button
                          onClick={() => { setSelectedScoopCount(3); setSalesModel('set'); setActiveTab('sales'); }}
                          className="bg-amber-150 py-1.5 px-3 rounded-lg text-xs leading-none bg-amber-50 cursor-pointer"
                        >
                          Set 3 Scoops scoop
                        </button>
                        <button
                          onClick={() => { setSalesModel('weight'); setActiveTab('sales'); }}
                          className="bg-amber-150 py-1.5 px-3 rounded-lg text-xs leading-none bg-amber-50 cursor-pointer"
                        >
                          Bán theo gram scales
                        </button>
                      </div>
                    </div>
                  </div>
                </div>
              </AndroidEmulator>
            )}

          </div>
        )}

        {/* TAB 4: ELECTRONIC INVOICES audit tab */}
        {activeTab === 'invoices' && (
          <div className="space-y-6 font-sans">
            <div className="bg-white p-5 rounded-3xl border border-amber-900/5 shadow-sm space-y-4">
              <div className="border-b pb-3.5">
                <h3 className="text-lg font-bold text-[#4A3E3E]">🧾 {t.invoiceIntegration}</h3>
                <p className="text-xs text-stone-500">
                  {isVi 
                    ? 'Xuất hóa đơn trực tiếp tại quầy tính tiền, phục hồi thông tin MST hoặc đổi hóa đơn thay thế do biến thiên giá.'
                    : 'Issue direct VAT invoices to guests. Handle replacements or modifications due to edited balances.'}
                </p>
              </div>

              {/* Transactions listing with status invoice tagging */}
              <div className="overflow-x-auto">
                <table className="w-full text-xs text-left">
                  <thead>
                    <tr className="border-b text-gray-500 font-bold">
                      <th className="py-2">BILL ID</th>
                      <th className="py-2">{isVi ? 'Cửa Hàng' : 'Outlet'}</th>
                      <th className="py-2">{isVi ? 'Ngày Xuất' : 'Date'}</th>
                      <th className="py-2 text-right">{isVi ? 'Doanh Thu (đ)' : 'Grand Total'}</th>
                      <th className="py-2 text-center">{isVi ? 'Mẫu Số VAT' : 'E-Invoice ID'}</th>
                      <th className="py-2 text-center">{isVi ? 'Trạng Thái' : 'Status'}</th>
                      <th className="py-2 text-right">{isVi ? 'Liên kết API' : 'API Action'}</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-stone-100">
                    {orders.map(o => (
                      <tr key={o.id} className="hover:bg-[#FDFBF7]/10 text-stone-700">
                        <td className="py-3 font-mono font-bold">#{o.id.slice(-6)}</td>
                        <td className="py-3">{branches.find(b => b.id === o.branchId)?.name || 'Default'}</td>
                        <td className="py-3">{o.date}</td>
                        <td className="py-3 text-right font-mono font-bold">{o.total.toLocaleString()}</td>
                        <td className="py-3 text-center font-mono text-[10px] text-gray-500">{o.invoiceCode || '---'}</td>
                        <td className="py-3 text-center">
                          <span className={`inline-block px-2.5 py-0.5 rounded-full text-[9px] font-bold uppercase leading-none ${
                            o.invoiceStatus === 'issued' ? 'bg-green-100 text-green-800' :
                            o.invoiceStatus === 'replaced' ? 'bg-indigo-100 text-indigo-700' :
                            o.invoiceStatus === 'canceled' ? 'bg-red-100 text-red-700' :
                            'bg-gray-100 text-gray-500'
                          }`}>
                            {o.invoiceStatus === 'issued' && (isVi ? 'Đã xuất' : 'Issued')}
                            {o.invoiceStatus === 'replaced' && (isVi ? 'Thay thế' : 'Replaced')}
                            {o.invoiceStatus === 'canceled' && (isVi ? 'Đã Hủy' : 'Voided')}
                            {o.invoiceStatus === 'not_issued' && (isVi ? 'Chưa Xuất' : 'Not Issued')}
                          </span>
                        </td>
                        <td className="py-3 text-right no-print">
                          <button
                            onClick={() => setInvoiceLinkOrder(o)}
                            className="bg-amber-800 hover:bg-amber-900 border text-white font-medium text-[10.5px] py-1 px-2.5 rounded-lg cursor-pointer"
                          >
                            🔗 {isVi ? 'Cấu hình API' : 'Link API'}
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        )}

        {/* TAB 5: COSTS & ACCOUNTING EXPENSES tab */}
        {activeTab === 'costs' && (
          <FinanceManager
            lang={lang}
            expenses={expenses}
            orders={orders}
            branches={branches}
            activeBranchId={activeBranch.id}
            userRole={activeUser.role}
            inventoryLogs={inventoryLogs}
            onAddExpense={handleAddCostExpense}
          />
        )}

        {/* TAB 6: ADMIN CHAIN CONSOLE supreme admin overrides */}
        {activeTab === 'admin' && isUserAdmin && (
          <AdminManager
            lang={lang}
            branches={branches}
            staff={staff}
            vouchers={vouchers}
            orders={orders}
            flavors={flavors}
            toppings={toppings}
            accompaniments={accompaniments}
            onAddBranch={handleAddBranchAction}
            onDeleteBranch={handleDeleteBranchAction}
            onUpdateBranch={handleUpdateBranchAction}
            onAddStaff={handleAddStaffAction}
            onDeleteStaff={handleDeleteStaffAction}
            onUpdateStaff={handleUpdateStaffAction}
            onAddVoucher={handleAddVoucherAction}
            onUpdateVoucher={handleUpdateVoucherAction}
            onDeleteVoucher={handleDeleteVoucherAction}
            onAddFlavor={handleAddFlavorAction}
            onUpdateFlavor={handleUpdateFlavorAction}
            onDeleteFlavor={handleDeleteFlavorAction}
            onAddTopping={handleAddToppingAction}
            onUpdateTopping={handleUpdateToppingAction}
            onDeleteTopping={handleDeleteToppingAction}
            onAddAccompaniment={handleAddAccompanimentAction}
            onUpdateAccompaniment={handleUpdateAccompanimentAction}
            onDeleteAccompaniment={handleDeleteAccompanimentAction}
          />
        )}

        {/* TAB 7: SYSTEM AUDITS & ORDERS trace ledger */}
        {activeTab === 'audits' && (
          <div className="space-y-6 font-sans">
            
            {/* Sales ledger detail */}
            <div className="bg-white p-5 rounded-3xl border border-amber-900/5 shadow-sm space-y-4">
              <h4 className="text-sm font-bold text-[#4A3E3E] flex items-center gap-1.5 border-b pb-2">
                <span>🛒 {isVi ? 'Quản lý lịch sử Giao dịch & Chỉnh sửa Bill tại Quầy' : 'Audit checkout sales & Resizing balance reports'}</span>
              </h4>

              <div className="space-y-4">
                {orders.map(o => {
                  const bName = branches.find(b => b.id === o.branchId)?.name || 'Central station';
                  const isOwnBranchInAdminBounds = isUserAdmin || o.branchId === activeBranch.id;

                  if (!isOwnBranchInAdminBounds) return null;

                  return (
                    <div key={o.id} className="p-4 bg-stone-50 rounded-2xl border text-xs space-y-3">
                      <div className="flex justify-between items-start flex-wrap gap-2 border-b pb-2">
                        <div>
                          <strong className="text-sm text-stone-850">Bill ID: {o.id}</strong>
                          <span className="text-[10px] text-gray-500 block leading-tight mt-0.5 font-mono">
                            📍 {bName} • Cashier: {o.staffName} ({o.staffId}) • Date: {o.date}
                          </span>
                        </div>
                        <div className="flex gap-1.5">
                          {/* Receipt print copies */}
                          <button
                            onClick={() => setReceiptOrder(o)}
                            className="bg-white hover:bg-stone-100 border text-stone-700 font-bold text-[10px] py-1 px-2 rounded-lg cursor-pointer transition select-none"
                          >
                            🖨️ {isVi ? 'Mẫu In 80mm' : 'Print Draft'}
                          </button>
                        </div>
                      </div>

                      {/* Purchased Item details */}
                      <div className="space-y-1.5">
                        <span className="block text-[10px] uppercase font-bold text-gray-400">Purchased Items:</span>
                        <div className="space-y-1 pl-2">
                          {o.items.map((it, idx) => (
                            <div key={idx} className="flex justify-between font-mono text-[10.5px]">
                              <span>
                                {isVi ? it.nameVi : it.nameEn} x {it.quantity}
                                {it.flavorsSelected && it.flavorsSelected.length > 0 && (
                                  <span className="text-[9px] text-[#A4907C] font-bold block pl-2 lowercase">
                                    ({it.flavorsSelected.join(', ')})
                                  </span>
                                )}
                              </span>
                              <div className="flex gap-2">
                                <span className="font-bold">{(it.price * it.quantity).toLocaleString()}đ</span>
                                {/* Edit / resize bill quantity button - staff allowed to reduce (but not delete) */}
                                {it.quantity > 1 && (
                                  <button
                                    onClick={() => {
                                      const reason = prompt(isVi ? 'Nhập lý do hoàn trả/chỉnh giảm số lượng:' : 'Input item returns reason justify:');
                                      if (reason) handleSalesBillEditAmount(o.id, idx, reason);
                                    }}
                                    className="text-red-500 font-semibold hover:underline text-[9.5px] cursor-pointer"
                                  >
                                    -1 {isVi ? 'chiếc/viên' : 'qty'}
                                  </button>
                                )}
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>

                      {/* Financial billing summary */}
                      <div className="flex justify-between font-mono font-bold text-stone-800 border-t pt-1.5 text-[10.5px]">
                        <span>VAT ({o.taxRate}%): {o.taxAmount.toLocaleString()}đ</span>
                        <span className="text-amber-800 text-xs">Total payment: {o.total.toLocaleString()}đ</span>
                      </div>

                      {/* Resizing trace logs block */}
                      {o.editHistory && o.editHistory.length > 0 && (
                        <div className="bg-amber-100/30 p-2.5 rounded-lg border border-dashed border-amber-900/10 text-[9.5px] font-mono leading-relaxed space-y-1 text-stone-600">
                          <strong className="text-amber-900 uppercase block font-bold">✍️ Audit edits traces history:</strong>
                          {o.editHistory.map((h, hidx) => (
                            <div key={hidx} className="border-b border-stone-200/50 pb-1 last:border-0">
                              <div>[{h.date}] By: {h.editedBy}</div>
                              <div>Reason: <strong className="text-stone-700">{h.reason}</strong></div>
                              <div>Resize margin: {h.oldTotal.toLocaleString()}đ → {h.newTotal.toLocaleString()}đ</div>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Supreme Audits lists */}
            <div className="bg-white p-5 rounded-3xl border border-amber-900/5 shadow-sm space-y-4">
              <h4 className="text-sm font-bold text-[#4A3E3E] flex items-center gap-1.5 border-b pb-2">
                <span>📋 {isVi ? 'Nhật ký vận hành Hệ Thống Tổng Hợp' : 'Supreme Chronological Operational Audit file'}</span>
              </h4>

              <div className="space-y-2 max-h-72 overflow-y-auto">
                {auditLogs.map(log => (
                  <div key={log.id} className="text-[11px] leading-snug border-b pb-2 font-mono flex items-start gap-2 text-stone-750">
                    <span className="text-gray-400">[{log.timestamp}]</span>
                    <span className="text-amber-950 font-bold">({log.branchName})</span>
                    <span className="text-stone-800 flex-1">{isVi ? log.actionVi : log.actionEn}</span>
                  </div>
                ))}
              </div>
            </div>

          </div>
        )}



      </main>

      {/* --- MODAL POPUPS CHANNEL --- */}

      {/* 1. Thermal printed receipt modal 80mm */}
      {receiptOrder && (
        <div className="fixed inset-0 bg-stone-900/60 flex items-center justify-center p-4 z-50 overflow-y-auto no-print">
          <div className="bg-transparent max-w-sm w-full">
            <Receipt80mm
              order={receiptOrder}
              branch={branches.find(b => b.id === receiptOrder.branchId) || branches[0]}
              lang={lang}
              onPrint={() => { window.print(); }}
              onClose={() => setReceiptOrder(null)}
            />
          </div>
        </div>
      )}

      {/* 1b. Draft invoice preview modal 80mm */}
      {previewOrder && (
        <div className="fixed inset-0 bg-stone-900/65 flex items-center justify-center p-4 z-50 overflow-y-auto no-print">
          <div className="bg-transparent max-w-sm w-full animate-in fade-in zoom-in duration-200">
            <Receipt80mm
              order={previewOrder}
              branch={branches.find(b => b.id === previewOrder.branchId) || branches[0]}
              lang={lang}
              onClose={() => setPreviewOrder(null)}
            />
          </div>
        </div>
      )}

      {/* 2. Tax Electronic Invoices linkages modal */}
      {invoiceLinkOrder && activeBranch && (
        <InvoiceModal
          order={invoiceLinkOrder}
          branch={branches.find(b => b.id === invoiceLinkOrder.branchId) || activeBranch}
          lang={lang}
          onUpdateInvoice={(nextStatus, invoiceCode, explainReason) => {
            handleUpdateInvoiceStatus(invoiceLinkOrder.id, nextStatus, invoiceCode, explainReason);
          }}
          onClose={() => setInvoiceLinkOrder(null)}
        />
      )}

      {/* 3. Footer branded label */}
      <footer className="bg-white border-t border-amber-900/10 py-4 text-center text-[10px] text-gray-400 no-print">
        <p>© 2026 Gấu Gelato. All Rights Reserved. Fresh Gelato, Happy Everyday.</p>
        <p className="mt-1">Designed by DeepMind • Hosted in Cloud Server Workspace</p>
      </footer>

    </div>
  );
}
