const currencyFormatter = new Intl.NumberFormat('es-MX', {
  style: 'currency',
  currency: 'MXN',
  maximumFractionDigits: 2,
});

const dateFormatter = new Intl.DateTimeFormat('es-MX', {
  dateStyle: 'medium',
});

export function formatCurrency(value: number | string) {
  return currencyFormatter.format(Number(value));
}

export function formatDate(value: string | null) {
  if (!value) {
    return 'Sin fecha';
  }

  return dateFormatter.format(new Date(value));
}

export function formatProgramType(programType: string) {
  switch (programType) {
    case 'STANDARD':
      return 'Escalonado';
    case 'RESET':
      return 'Reinicio';
    case 'RESCUE':
      return 'Rescate';
    case 'FULL_PRICE':
    default:
      return 'Precio completo';
  }
}