import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import { formatCurrency, parseCurrency } from '../src/utils/formatCurrency.js';

describe('formatCurrency', () => {
    it('formats numeric input with euro symbol and two decimals', () => {
        assert.equal(formatCurrency(12), '€12.00');
        assert.equal(formatCurrency(12.3), '€12.30');
    });

    it('formats numeric strings by parsing them', () => {
        assert.equal(formatCurrency('19.958'), '€19.96');
    });

    it('throws for non-numeric values', () => {
        assert.throws(() => formatCurrency('abc'), TypeError);
        assert.throws(() => formatCurrency(null), TypeError);
    });
});

describe('parseCurrency', () => {
    it('parses euro strings with symbols and commas', () => {
        assert.equal(parseCurrency('€19,95'), 19.95);
        assert.equal(parseCurrency('EUR 1,234.50'), 1234.5);
    });

    it('throws when provided with a non-string value', () => {
        assert.throws(() => parseCurrency(123));
    });

    it('throws when the string cannot be parsed', () => {
        assert.throws(() => parseCurrency('no money here'));
    });
});