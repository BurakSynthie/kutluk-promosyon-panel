export function formatTL(value: number) {
  return new Intl.NumberFormat("tr-TR", {
    style: "currency",
    currency: "TRY",
    maximumFractionDigits: 0,
  }).format(value);
}

export function addBusinessDays(startDate: string, businessDays: number) {
  const date = new Date(startDate);
  let addedDays = 0;

  while (addedDays < businessDays) {
    date.setDate(date.getDate() + 1);

    const day = date.getDay();
    const isWeekend = day === 0 || day === 6;

    if (!isWeekend) {
      addedDays++;
    }
  }

  return date.toLocaleDateString("tr-TR", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
  });
}

export function getOrderDueStatus(startDate: string, businessDays: number) {
  const due = new Date(startDate);
  let addedDays = 0;

  while (addedDays < businessDays) {
    due.setDate(due.getDate() + 1);

    const day = due.getDay();
    const isWeekend = day === 0 || day === 6;

    if (!isWeekend) {
      addedDays++;
    }
  }

  const today = new Date();
  today.setHours(0, 0, 0, 0);
  due.setHours(0, 0, 0, 0);

  const diffMs = due.getTime() - today.getTime();
  const diffDays = Math.ceil(diffMs / (1000 * 60 * 60 * 24));

  if (diffDays < 0) {
    return {
      type: "late",
      label: `${Math.abs(diffDays)} gün gecikti`,
    };
  }

  if (diffDays <= 2) {
    return {
      type: "soon",
      label: diffDays === 0 ? "Bugün çıkmalı" : `${diffDays} gün kaldı`,
    };
  }

  return {
    type: "normal",
    label: "Zamanında",
  };
}