import { initializeApp } from 'firebase/app';
import { getAuth } from 'firebase/auth';
import { 
  getFirestore, doc, getDocFromServer, collection, setDoc, deleteDoc, 
  getDocs, onSnapshot, writeBatch, query, limit, getDoc,
  disableNetwork
} from 'firebase/firestore';
import firebaseConfig from '../firebase-applet-config.json';
import { 
  Branch, Staff, Flavor, Topping, Accompaniment, Voucher, LoyaltyMember, Order, OperationalExpense, AuditLog, InventoryLog 
} from './types';

const app = initializeApp(firebaseConfig);
// CRITICAL: The app will break without this custom databaseInstanceId mapping
export const db = getFirestore(app, firebaseConfig.firestoreDatabaseId);
export const auth = getAuth();

// Initialize isFirestoreExhausted status from localStorage if present
if (typeof window !== 'undefined') {
  (window as any).isFirestoreExhausted = true; // Always enabled for sustainable Offline-First
}

export function shouldSkipFirestore(): boolean {
  return true; // Always return true to run in pure high-performance Offline-First Local Database mode, bypassing all Firebase quota limitations and network lag.
}

export enum OperationType {
  CREATE = 'create',
  UPDATE = 'update',
  DELETE = 'delete',
  LIST = 'list',
  GET = 'get',
  WRITE = 'write',
}

export interface FirestoreErrorInfo {
  error: string;
  operationType: OperationType;
  path: string | null;
  authInfo: {
    userId?: string | null;
    email?: string | null;
    emailVerified?: boolean | null;
    isAnonymous?: boolean | null;
    tenantId?: string | null;
    providerInfo?: {
      providerId?: string | null;
      email?: string | null;
    }[];
  }
}

export function handleFirestoreError(error: unknown, operationType: OperationType, path: string | null) {
  const errMsg = error instanceof Error ? error.message : String(error);
  const errInfo: FirestoreErrorInfo = {
    error: errMsg,
    authInfo: {
      userId: auth.currentUser?.uid,
      email: auth.currentUser?.email,
      emailVerified: auth.currentUser?.emailVerified,
      isAnonymous: auth.currentUser?.isAnonymous,
      tenantId: auth.currentUser?.tenantId,
      providerInfo: auth.currentUser?.providerData?.map(provider => ({
        providerId: provider.providerId,
        email: provider.email,
      })) || []
    },
    operationType,
    path
  };
  console.warn('Firestore Operation Degraded (Offline-Fallback Active): ', JSON.stringify(errInfo));
  
  // Set global fallback states for UI warning indicators
  const errCode = (error && typeof error === 'object' && 'code' in error) ? String((error as any).code) : '';
  const isQuota = errCode.includes('resource-exhausted') || 
                  errMsg.toLowerCase().includes('quota') || 
                  errMsg.toLowerCase().includes('exhausted') || 
                  errMsg.toLowerCase().includes('resource-exhausted') || 
                  errMsg.toLowerCase().includes('quota limit exceeded') || 
                  errMsg.toLowerCase().includes('resource_exhausted');
  if (isQuota) {
    (window as any).isFirestoreExhausted = true;
    try {
      localStorage.setItem('isFirestoreExhausted', 'true');
    } catch (e) {}
    disableNetwork(db).catch(() => {});
  } else {
    // Other errors (like offline network or permission)
    (window as any).isFirestoreOffline = true;
  }
  
  if ((window as any).onFirestoreErrorTriggered) {
    try {
      (window as any).onFirestoreErrorTriggered(errMsg, isQuota);
    } catch (e) {
      // ignore callbacks errors
    }
  }
}

export async function testConnection() {
  if (shouldSkipFirestore()) {
    console.log("Offline-First Local Database Mode Active. Skipping Firestore connection checks.");
    return;
  }
  try {
    await getDocFromServer(doc(db, 'test', 'connection'));
    console.log("Firebase Connection verified successfully.");
  } catch (error) {
    const errMsg = error instanceof Error ? error.message : String(error);
    const errCode = (error && typeof error === 'object' && 'code' in error) ? String((error as any).code) : '';
    const isQuota = errCode.includes('resource-exhausted') || 
                    errMsg.toLowerCase().includes('quota') || 
                    errMsg.toLowerCase().includes('exhausted') || 
                    errMsg.toLowerCase().includes('resource-exhausted') || 
                    errMsg.toLowerCase().includes('quota limit exceeded') || 
                    errMsg.toLowerCase().includes('resource_exhausted');
    if (isQuota) {
      handleFirestoreError(error, OperationType.GET, 'test/connection');
    } else if (error instanceof Error && error.message.includes('the client is offline')) {
      console.error("Please check your Firebase configuration. Client is offline.");
    } else {
      console.log("Connection check completed (either offline or permission checked safely).");
    }
  }
}
testConnection();

// --- Firestore Mutation Wrappers ---

export async function dbSaveBranch(branch: Branch) {
  if (shouldSkipFirestore()) return;
  const path = `branches/${branch.id}`;
  try {
    await setDoc(doc(db, 'branches', branch.id), branch);
  } catch (error) {
    handleFirestoreError(error, OperationType.WRITE, path);
  }
}

export async function dbDeleteBranch(id: string) {
  if (shouldSkipFirestore()) return;
  const path = `branches/${id}`;
  try {
    await deleteDoc(doc(db, 'branches', id));
  } catch (error) {
    handleFirestoreError(error, OperationType.DELETE, path);
  }
}

export async function dbSaveStaff(staff: Staff) {
  if (shouldSkipFirestore()) return;
  const path = `staff/${staff.id}`;
  try {
    await setDoc(doc(db, 'staff', staff.id), staff);
  } catch (error) {
    handleFirestoreError(error, OperationType.WRITE, path);
  }
}

export async function dbDeleteStaff(id: string) {
  if (shouldSkipFirestore()) return;
  const path = `staff/${id}`;
  try {
    await deleteDoc(doc(db, 'staff', id));
  } catch (error) {
    handleFirestoreError(error, OperationType.DELETE, path);
  }
}

export async function dbSaveFlavor(flavor: Flavor) {
  if (shouldSkipFirestore()) return;
  const path = `flavors/${flavor.id}`;
  try {
    await setDoc(doc(db, 'flavors', flavor.id), flavor);
  } catch (error) {
    handleFirestoreError(error, OperationType.WRITE, path);
  }
}

export async function dbDeleteFlavor(id: string) {
  if (shouldSkipFirestore()) return;
  const path = `flavors/${id}`;
  try {
    await deleteDoc(doc(db, 'flavors', id));
  } catch (error) {
    handleFirestoreError(error, OperationType.DELETE, path);
  }
}

export async function dbSaveTopping(topping: Topping) {
  if (shouldSkipFirestore()) return;
  const path = `toppings/${topping.id}`;
  try {
    await setDoc(doc(db, 'toppings', topping.id), topping);
  } catch (error) {
    handleFirestoreError(error, OperationType.WRITE, path);
  }
}

export async function dbDeleteTopping(id: string) {
  if (shouldSkipFirestore()) return;
  const path = `toppings/${id}`;
  try {
    await deleteDoc(doc(db, 'toppings', id));
  } catch (error) {
    handleFirestoreError(error, OperationType.DELETE, path);
  }
}

export async function dbSaveAccompaniment(acc: Accompaniment) {
  if (shouldSkipFirestore()) return;
  const path = `accompaniments/${acc.id}`;
  try {
    await setDoc(doc(db, 'accompaniments', acc.id), acc);
  } catch (error) {
    handleFirestoreError(error, OperationType.WRITE, path);
  }
}

export async function dbDeleteAccompaniment(id: string) {
  if (shouldSkipFirestore()) return;
  const path = `accompaniments/${id}`;
  try {
    await deleteDoc(doc(db, 'accompaniments', id));
  } catch (error) {
    handleFirestoreError(error, OperationType.DELETE, path);
  }
}

export async function dbSaveVoucher(voucher: Voucher) {
  if (shouldSkipFirestore()) return;
  const path = `vouchers/${voucher.code}`;
  try {
    await setDoc(doc(db, 'vouchers', voucher.code), voucher);
  } catch (error) {
    handleFirestoreError(error, OperationType.WRITE, path);
  }
}

export async function dbDeleteVoucher(code: string) {
  if (shouldSkipFirestore()) return;
  const path = `vouchers/${code}`;
  try {
    await deleteDoc(doc(db, 'vouchers', code));
  } catch (error) {
    handleFirestoreError(error, OperationType.DELETE, path);
  }
}

export async function dbSaveMember(member: LoyaltyMember) {
  if (shouldSkipFirestore()) return;
  const path = `members/${member.phone}`;
  try {
    await setDoc(doc(db, 'members', member.phone), member);
  } catch (error) {
    handleFirestoreError(error, OperationType.WRITE, path);
  }
}

export async function dbDeleteMember(phone: string) {
  if (shouldSkipFirestore()) return;
  const path = `members/${phone}`;
  try {
    await deleteDoc(doc(db, 'members', phone));
  } catch (error) {
    handleFirestoreError(error, OperationType.DELETE, path);
  }
}

export async function dbSaveOrder(order: Order) {
  if (shouldSkipFirestore()) return;
  const path = `orders/${order.id}`;
  try {
    await setDoc(doc(db, 'orders', order.id), order);
  } catch (error) {
    handleFirestoreError(error, OperationType.WRITE, path);
  }
}

export async function dbDeleteOrder(id: string) {
  if (shouldSkipFirestore()) return;
  const path = `orders/${id}`;
  try {
    await deleteDoc(doc(db, 'orders', id));
  } catch (error) {
    handleFirestoreError(error, OperationType.DELETE, path);
  }
}

export async function dbSaveExpense(expense: OperationalExpense) {
  if (shouldSkipFirestore()) return;
  const path = `expenses/${expense.id}`;
  try {
    await setDoc(doc(db, 'expenses', expense.id), expense);
  } catch (error) {
    handleFirestoreError(error, OperationType.WRITE, path);
  }
}

export async function dbDeleteExpense(id: string) {
  if (shouldSkipFirestore()) return;
  const path = `expenses/${id}`;
  try {
    await deleteDoc(doc(db, 'expenses', id));
  } catch (error) {
    handleFirestoreError(error, OperationType.DELETE, path);
  }
}

export async function dbSaveAuditLog(log: AuditLog) {
  if (shouldSkipFirestore()) return;
  const path = `auditLogs/${log.id}`;
  try {
    await setDoc(doc(db, 'auditLogs', log.id), log);
  } catch (error) {
    handleFirestoreError(error, OperationType.WRITE, path);
  }
}

export async function dbSaveInventoryLog(log: InventoryLog) {
  if (shouldSkipFirestore()) return;
  const path = `inventoryLogs/${log.id}`;
  try {
    await setDoc(doc(db, 'inventoryLogs', log.id), log);
  } catch (error) {
    handleFirestoreError(error, OperationType.WRITE, path);
  }
}

export async function dbSaveBranchStock(branchId: string, stocks: Record<string, number>) {
  if (shouldSkipFirestore()) return;
  const path = `branchStocks/${branchId}`;
  try {
    await setDoc(doc(db, 'branchStocks', branchId), { branchId, stocks });
  } catch (error) {
    handleFirestoreError(error, OperationType.WRITE, path);
  }
}

