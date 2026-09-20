const money = new Intl.NumberFormat("en-AU", {
  style: "currency",
  currency: "AUD",
});

export const formatMoney = (n: number): string => money.format(n);

export const round2 = (n: number): number => Math.round(n * 100) / 100;

export const formatDate = (value?: string | null): string => {
  if (!value) return "—";
  const d = new Date(value);
  if (isNaN(d.getTime())) return value;
  return d.toLocaleDateString("en-AU", {
    day: "numeric",
    month: "short",
    year: "numeric",
  });
};