export function formatDate(dateString: string): string {
  try {
    const date = new Date(dateString);
    return new Intl.DateTimeFormat('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
    }).format(date);
  } catch {
    return dateString;
  }
}

export function formatCurrency(amount: number): string {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
  }).format(amount);
}

export function formatDaysRemaining(dueDateString: string): { days: number; isOverdue: boolean } {
  try {
    const due = new Date(dueDateString).getTime();
    const now = new Date().getTime();
    const diffDays = Math.ceil((due - now) / (1000 * 60 * 60 * 24));
    return {
      days: Math.abs(diffDays),
      isOverdue: diffDays < 0,
    };
  } catch {
    return { days: 0, isOverdue: false };
  }
}

