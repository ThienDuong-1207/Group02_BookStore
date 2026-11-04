/** "120.000 ₫" – prices are whole VND (US-19 M1 format). */
export function formatPrice(price: number): string {
  return `${new Intl.NumberFormat("vi-VN").format(price)} ₫`;
}
