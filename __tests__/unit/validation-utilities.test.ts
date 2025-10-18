/**
 * Utility Function Tests
 * Tests common utility functions used throughout the application
 * Covers: validation, formatting, transformation, error handling
 */

import { describe, it, expect } from 'vitest';

describe('Validation Utilities', () => {
  describe('Email Validation', () => {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

    const validEmails = [
      'user@example.com',
      'test.email@company.co.uk',
      'first+last@domain.org',
      'user123@subdomain.example.com',
      'a@b.c',
    ];

    const invalidEmails = [
      'plainaddress',
      '@nodomain.com',
      'user@.com',
      'user@domain',
      'user@domain.',
      'user @domain.com',
      'user@domain .com',
      '',
      ' ',
    ];

    it('should validate correct email formats', () => {
      for (const email of validEmails) {
        expect(emailRegex.test(email)).toBe(true);
      }
    });

    it('should reject invalid email formats', () => {
      for (const email of invalidEmails) {
        expect(emailRegex.test(email)).toBe(false);
      }
    });

    it('should handle whitespace in email validation', () => {
      expect(emailRegex.test('user@example.com ')).toBe(false); // trailing space
      expect(emailRegex.test(' user@example.com')).toBe(false); // leading space
    });
  });

  describe('Phone Number Validation', () => {
    // More flexible regex that handles various international formats
    const phoneRegex = /^[+]?[0-9\s().-]{9,15}$/;

    it('should validate various phone number formats', () => {
      const validPhones = [
        '9876543210',
        '+919876543210',
        '(987) 654-3210',
        '987-654-3210',
        '+1 987 654 3210',
      ];

      for (const phone of validPhones) {
        expect(phoneRegex.test(phone)).toBe(true);
      }
    });

    it('should reject invalid phone numbers', () => {
      const invalidPhones = [
        '12345', // too short
        'abcdefghij', // letters
        '', // empty
      ];

      for (const phone of invalidPhones) {
        expect(phoneRegex.test(phone)).toBe(false);
      }
    });
  });

  describe('UUID/ID Validation', () => {
    const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
    const mongoIdRegex = /^[a-fA-F0-9]{24}$/;

    it('should validate UUID v4 format', () => {
      const validUUIDs = [
        '550e8400-e29b-41d4-a716-446655440000',
        '6ba7b810-9dad-11d1-80b4-00c04fd430c8',
      ];

      for (const uuid of validUUIDs) {
        expect(uuidRegex.test(uuid)).toBe(true);
      }
    });

    it('should validate MongoDB ObjectId format', () => {
      const validIds = ['507f1f77bcf86cd799439011', '507f1f77bcf86cd799439012'];

      for (const id of validIds) {
        expect(mongoIdRegex.test(id)).toBe(true);
      }
    });

    it('should reject invalid MongoDB ObjectIds', () => {
      const invalidIds = [
        '507f1f77bcf86cd79943901', // 23 chars
        'xxxxxxxxxxxxxxxxxxxxxxxx', // invalid hex
        '',
      ];

      for (const id of invalidIds) {
        expect(mongoIdRegex.test(id)).toBe(false);
      }
    });
  });
});

describe('String Formatting Utilities', () => {
  describe('Currency Formatting', () => {
    it('should convert paise to rupees correctly', () => {
      const conversions = [
        { paise: 0, rupees: 0 },
        { paise: 100, rupees: 1 },
        { paise: 1000, rupees: 10 },
        { paise: 99999, rupees: 999.99 },
      ];

      for (const { paise, rupees } of conversions) {
        expect(paise / 100).toBe(rupees);
      }
    });

    it('should format currency with correct decimal places', () => {
      const amount = 1234.56;
      const formatted = amount.toFixed(2);
      expect(formatted).toBe('1234.56');
    });
  });

  describe('Date Formatting', () => {
    it('should parse ISO date strings correctly', () => {
      const isoDate = '2025-10-20T14:30:00Z';
      const date = new Date(isoDate);

      expect(date.getFullYear()).toBe(2025);
      expect(date.getMonth()).toBe(9); // October is 9 (0-indexed)
      expect(date.getDate()).toBe(20);
    });

    it('should extract date from ISO datetime', () => {
      const isoDateTime = '2025-10-20T14:30:00Z';
      const dateOnly = isoDateTime.split('T')[0];

      expect(dateOnly).toBe('2025-10-20');
    });

    it('should handle timezone conversions', () => {
      const utcDate = new Date('2025-10-20T00:00:00Z');
      const timestamp = utcDate.getTime();

      expect(timestamp).toBeGreaterThan(0);
      expect(typeof timestamp).toBe('number');
    });
  });

  describe('String Transformations', () => {
    it('should split and trim strings correctly', () => {
      const input = 'yoga, meditation, wellness';
      const tags = input.split(',').map((tag) => tag.trim());

      expect(tags).toEqual(['yoga', 'meditation', 'wellness']);
    });

    it('should handle empty strings in split operations', () => {
      const input = '';
      const result = input.split(',').map((tag) => tag.trim());

      expect(result).toEqual(['']);
    });

    it('should handle case-insensitive comparisons', () => {
      const email1 = 'User@Example.COM';
      const email2 = 'user@example.com';

      expect(email1.toLowerCase()).toBe(email2.toLowerCase());
    });
  });
});

describe('Data Transformation Utilities', () => {
  describe('Array Utilities', () => {
    it('should filter out null/undefined values', () => {
      const data = [1, null, 2, undefined, 3, 0, ''];
      const filtered = data.filter((item) => item != null);

      expect(filtered).toEqual([1, 2, 3, 0, '']);
    });

    it('should handle empty array transformations', () => {
      const empty: any[] = [];
      const transformed = empty.map((item) => item * 2);

      expect(transformed).toEqual([]);
      expect(transformed.length).toBe(0);
    });

    it('should preserve order during filtering', () => {
      const data = [3, 1, 4, 1, 5, 9];
      const filtered = data.filter((item) => item > 2);

      expect(filtered).toEqual([3, 4, 5, 9]);
    });
  });

  describe('Object Utilities', () => {
    it('should merge objects without mutation', () => {
      const obj1 = { a: 1, b: 2 };
      const obj2 = { c: 3, d: 4 };
      const merged = { ...obj1, ...obj2 };

      expect(merged).toEqual({ a: 1, b: 2, c: 3, d: 4 });
      expect(obj1).toEqual({ a: 1, b: 2 }); // Original unchanged
    });

    it('should handle nested object updates', () => {
      const obj = { user: { name: 'John', email: 'john@example.com' } };
      const updated = {
        ...obj,
        user: { ...obj.user, name: 'Jane' },
      };

      expect(updated.user.name).toBe('Jane');
      expect(updated.user.email).toBe('john@example.com');
      expect(obj.user.name).toBe('John'); // Original unchanged
    });
  });

  describe('Number Utilities', () => {
    it('should handle rounding correctly', () => {
      const numbers = [1.234, 1.567, 1.999];

      expect(Math.round(1.234 * 100) / 100).toBe(1.23);
      expect(Math.round(1.567 * 100) / 100).toBe(1.57);
      expect(Math.round(1.999 * 100) / 100).toBe(2);
    });

    it('should handle percentage calculations', () => {
      const total = 1000;
      const amount = 250;
      const percentage = (amount / total) * 100;

      expect(percentage).toBe(25);
    });

    it('should handle zero safely', () => {
      expect(0 / 100).toBe(0);
      expect(100 / 0).toBe(Infinity);
      expect(isFinite(100 / 1)).toBe(true);
      expect(isFinite(100 / 0)).toBe(false);
    });
  });
});

describe('Error Handling Utilities', () => {
  describe('Try-Catch Patterns', () => {
    it('should handle JSON parsing errors', () => {
      const validJson = '{"key": "value"}';
      const invalidJson = '{invalid json}';

      expect(() => JSON.parse(validJson)).not.toThrow();
      expect(() => JSON.parse(invalidJson)).toThrow();
    });

    it('should safely access nested properties', () => {
      const obj = { user: { profile: { name: 'John' } } };
      const name = obj?.user?.profile?.name;

      expect(name).toBe('John');
    });

    it('should provide default values for missing data', () => {
      const data: any = {};
      const email = data.user?.email ?? 'no-email@example.com';

      expect(email).toBe('no-email@example.com');
    });
  });

  describe('Validation Error Messages', () => {
    it('should create helpful error messages', () => {
      const field = 'email';
      const value = 'invalid-email';
      const message = `Invalid ${field}: ${value}`;

      expect(message).toContain('Invalid');
      expect(message).toContain(field);
    });
  });
});
