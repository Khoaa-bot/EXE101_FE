import type { MyVoucher } from "../services/api";

type DiscountInput = Pick<MyVoucher, "discountType" | "discountValue" | "maxDiscount" | "minOrder">;

// Voucher đủ điều kiện dùng cho đơn có giá này (chưa dùng, còn hạn, không bị giữ cho lịch khác, đủ đơn tối thiểu).
export function isVoucherUsable(voucher: MyVoucher, price: number | undefined) {
  return voucher.status === "unused" && !voucher.reserved && price !== undefined && price >= voucher.minOrder;
}

// Số tiền giảm trên giá dịch vụ; khớp cách BE tính (giảm tiền, giảm % có trần, tặng dịch vụ không giảm tiền).
export function voucherDiscount(voucher: DiscountInput, price: number | undefined) {
  if (price === undefined || price <= 0 || price < voucher.minOrder) return 0;
  const value = voucher.discountValue ?? 0;
  let discount = 0;
  if (voucher.discountType === "FIXED") discount = value;
  if (voucher.discountType === "PERCENT") {
    discount = Math.floor((price * value) / 100);
    if (voucher.maxDiscount && voucher.maxDiscount > 0) discount = Math.min(discount, voucher.maxDiscount);
  }
  return Math.max(0, Math.min(discount, price));
}
