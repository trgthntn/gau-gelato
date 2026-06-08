# Firebase Security Spec - GG Gelato Platform

## 1. Data Invariants
- **Branches**: No two branches can share the same tax/MST number.
- **Staff**: Role must be strictly 'admin' or 'staff'. The secure pin is exactly 10 characters or digits.
- **Orders**: A sales order cannot have a negative draft total, subtotal, or negative tax amount.
- **Vouchers**: Disallow negative discount values or usage count under 0.
- **BranchStock**: Stock levels cannot be set to a negative value.

## 2. The Dirty Dozen Payloads (Malicious Injections Attempted)

### IP-1: Admin Privilege Escalation (Staff Profile Mod)
Staff member attempts to update their role to `admin`.
```json
{
  "id": "staff_abc",
  "name": "Jane Staff",
  "role": "admin"
}
```
*Expected: PERMISSION_DENIED (Only genuine Admins can modify rolls or users cannot self-escalate).*

### IP-2: Negative Stock Poisoning
Attempting to update gelato stock to negative.
```json
{
  "branchId": "branch_hcm",
  "stocks": {
    "flavor_taro": -1000
  }
}
```
*Expected: PERMISSION_DENIED (Must be >= 0).*

### IP-3: Ghost/Shadow Field Injection
Attempting to save an order with a ghost field `isFreeDiscountApproved` bypass.
```json
{
  "id": "order_123",
  "branchId": "b1",
  "total": 0,
  "isFreeDiscountApproved": true
}
```
*Expected: PERMISSION_DENIED (Keys of order must match exact schema properties).*

### IP-4: Zero Price Fraud on Accompaniments
Injecting a price of 0 for retail accompaniments.
```json
{
  "id": "corn_extra",
  "price": 0
}
```
*Expected: PERMISSION_DENIED (Accompaniment prices must be positive).*

### IP-5: Direct Stock Hack
Direct non-audited stock adjustment on general branch stocks.
```json
{
  "branchId": "branch_hcm",
  "stocks": {
    "flavor_taro": 9999999
  }
}
```
*Expected: PERMISSION_DENIED (Only validated actions can change stocks).*

### IP-6: Fake Voucher Usage Counter
Decrementing voucher usage count from the client.
```json
{
  "code": "GIFT50",
  "usageCount": -99
}
```
*Expected: PERMISSION_DENIED.*

### IP-7: Future Expired Voucher Invalidation
Deploying a voucher with empty date.
```json
{
  "code": "VIP99",
  "expiryDate": ""
}
```
*Expected: PERMISSION_DENIED (Expiry date must be of proper format).*

### IP-8: Fake Loyalty Points Credit
Crediting 99999 points to a loyalty member without exchange logic.
```json
{
  "phone": "0966456789",
  "points": 99999
}
```
*Expected: PERMISSION_DENIED.*

### IP-9: Invalid IP-Character Poisoning (ID Injection)
Injecting highly illegal chars into branch ID.
```json
{
  "id": "branch_hcm!!!!!$$$$"
}
```
*Expected: PERMISSION_DENIED (Ids must strictly match alphabetical/alphanumeric regex).*

### IP-10: Self-Assigned Member Points
Creating a member with starting points 50000.
```json
{
  "phone": "0911222333",
  "points": 50000
}
```
*Expected: PERMISSION_DENIED.*

### IP-11: Empty Order Injection
Order with negative subtotal.
```json
{
  "id": "order_bad",
  "subtotal": -50000
}
```
*Expected: PERMISSION_DENIED.*

### IP-12: Audit Log Erasure
Deleting historical audit logs.
```json
{
  "id": "log_xyz"
}
```
*Expected: PERMISSION_DENIED (Audit logs are create-only; update/delete is locked).*
