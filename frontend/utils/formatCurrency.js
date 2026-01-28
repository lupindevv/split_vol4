export function formatCurrency(value) {
    if (value === null || value === undefined) {
        throw new TypeError('Value provided to formatCurrency must be numeric');
    }

    const amount = Number.parseFloat(value);
    if (Number.isNaN(amount)) {
        throw new TypeError('Value provided to formatCurrency must be numeric');
    }

    return `€${amount.toFixed(2)}`;
}

export function parseCurrency(value) {
    if (typeof value !== 'string') {
        throw new TypeError('Currency value must be a string');
    }

    const trimmed = value.trim();
    if (!trimmed) {
        throw new TypeError('Unable to parse currency amount');
    }

    const withoutCurrency = trimmed.replace(/[\s€$£]/g, '');
    const cleaned = withoutCurrency.replace(/[^0-9,.-]/g, '');
    const decimalSeparator = cleaned.includes(',') && cleaned.includes('.')
        ? (cleaned.lastIndexOf(',') > cleaned.lastIndexOf('.') ? ',' : '.')
        : (cleaned.includes(',') ? ',' : '.');

    let normalized = cleaned;
    if (decimalSeparator === ',') {
        normalized = cleaned.replace(/\./g, '').replace(',', '.');
    } else {
        normalized = cleaned.replace(/,/g, '');
    }

    const amount = Number.parseFloat(normalized);

    if (Number.isNaN(amount)) {
        throw new TypeError('Unable to parse currency amount');
    }

    return amount;
}