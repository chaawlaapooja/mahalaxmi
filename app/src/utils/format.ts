export const formatCurrency = (amount: number) =>
  new Intl.NumberFormat('en-IN', {
    style: 'currency',
    currency: 'INR',
    maximumFractionDigits: 2,
  }).format(amount);

export const formatDate = (date: string | Date) =>
  new Intl.DateTimeFormat('en-IN', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
  }).format(new Date(date));

export const monthLabel = (year: number, month: number) => {
  const d = new Date(year, month - 1, 1);
  return d.toLocaleDateString('en-IN', { month: 'short', year: 'numeric' });
};
