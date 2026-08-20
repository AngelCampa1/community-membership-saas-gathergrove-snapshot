import {
  isEmail,
  isNonEmptyString,
  isPositiveNumber,
  isOfType,
  isArray,
  isObject,
  isFunction,
  isPromise,
  isError,
  assertIsString,
  assertIsNumber,
  assertIsArray,
  exhaustiveSwitch,
  typedKeys,
  typedEntries,
  safeJsonParse,
  TypeSafetyPatterns
} from '../type-safety-patterns';

describe('Type Safety Patterns', () => {
  describe('Branded Type Guards', () => {
    describe('isEmail', () => {
      it('should return true for valid email addresses', () => {
        expect(isEmail('user@example.com')).toBe(true);
        expect(isEmail('test.user@domain.co.uk')).toBe(true);
        expect(isEmail('name+tag@company.org')).toBe(true);
        expect(isEmail('user123@test-domain.com')).toBe(true);
      });

      it('should return false for invalid email addresses', () => {
        expect(isEmail('invalid')).toBe(false);
        expect(isEmail('no-at-sign.com')).toBe(false);
        expect(isEmail('@no-local.com')).toBe(false);
        expect(isEmail('no-domain@')).toBe(false);
        expect(isEmail('spaces in@email.com')).toBe(false);
        expect(isEmail('no-dot@domain')).toBe(false);
        expect(isEmail('')).toBe(false);
      });

      it('should handle edge cases', () => {
        expect(isEmail('a@b.c')).toBe(true); // Minimal valid email
        expect(isEmail('user@sub.domain.example.com')).toBe(true); // Subdomain
        expect(isEmail('user..name@example.com')).toBe(true); // Double dots (technically valid)
      });
    });

    describe('isNonEmptyString', () => {
      it('should return true for non-empty strings', () => {
        expect(isNonEmptyString('hello')).toBe(true);
        expect(isNonEmptyString('  text  ')).toBe(true);
        expect(isNonEmptyString('123')).toBe(true);
        expect(isNonEmptyString('a')).toBe(true);
      });

      it('should return false for empty or whitespace-only strings', () => {
        expect(isNonEmptyString('')).toBe(false);
        expect(isNonEmptyString('   ')).toBe(false);
        expect(isNonEmptyString('\t')).toBe(false);
        expect(isNonEmptyString('\n')).toBe(false);
        expect(isNonEmptyString('  \t\n  ')).toBe(false);
      });

      it('should trim whitespace before checking', () => {
        expect(isNonEmptyString('  hello  ')).toBe(true);
        expect(isNonEmptyString('\ttext\n')).toBe(true);
      });
    });

    describe('isPositiveNumber', () => {
      it('should return true for positive numbers', () => {
        expect(isPositiveNumber(1)).toBe(true);
        expect(isPositiveNumber(0.1)).toBe(true);
        expect(isPositiveNumber(1000)).toBe(true);
        expect(isPositiveNumber(Number.MAX_SAFE_INTEGER)).toBe(true);
      });

      it('should return false for non-positive numbers', () => {
        expect(isPositiveNumber(0)).toBe(false);
        expect(isPositiveNumber(-1)).toBe(false);
        expect(isPositiveNumber(-0.1)).toBe(false);
        expect(isPositiveNumber(-1000)).toBe(false);
      });

      it('should return false for infinity and NaN', () => {
        expect(isPositiveNumber(Infinity)).toBe(false);
        expect(isPositiveNumber(-Infinity)).toBe(false);
        expect(isPositiveNumber(NaN)).toBe(false);
      });

      it('should return true for very small positive numbers', () => {
        expect(isPositiveNumber(0.0001)).toBe(true);
        expect(isPositiveNumber(Number.MIN_VALUE)).toBe(true);
      });
    });
  });

  describe('Generic Type Guards', () => {
    describe('isOfType', () => {
      it('should use predicate to determine type', () => {
        const isString = (val: unknown): val is string => typeof val === 'string';

        expect(isOfType('hello', isString)).toBe(true);
        expect(isOfType(123, isString)).toBe(false);
      });

      it('should work with custom type predicates', () => {
        interface User {
          name: string;
          age: number;
        }

        const isUser = (val: unknown): val is User => {
          return (
            typeof val === 'object' &&
            val !== null &&
            'name' in val &&
            'age' in val &&
            typeof (val as User).name === 'string' &&
            typeof (val as User).age === 'number'
          );
        };

        expect(isOfType({ name: 'John', age: 30 }, isUser)).toBe(true);
        expect(isOfType({ name: 'John' }, isUser)).toBe(false);
        expect(isOfType('not a user', isUser)).toBe(false);
      });
    });

    describe('isArray', () => {
      it('should return true for arrays', () => {
        expect(isArray([])).toBe(true);
        expect(isArray([1, 2, 3])).toBe(true);
        expect(isArray(['a', 'b'])).toBe(true);
        expect(isArray([{ key: 'value' }])).toBe(true);
        expect(isArray(new Array(10))).toBe(true);
      });

      it('should return false for non-arrays', () => {
        expect(isArray('not array')).toBe(false);
        expect(isArray(123)).toBe(false);
        expect(isArray({ length: 3 })).toBe(false); // Array-like but not array
        expect(isArray(null)).toBe(false);
        expect(isArray(undefined)).toBe(false);
      });

      it('should work with typed arrays', () => {
        expect(isArray<number>([1, 2, 3])).toBe(true);
        expect(isArray<string>(['a', 'b'])).toBe(true);
      });
    });

    describe('isObject', () => {
      it('should return true for plain objects', () => {
        expect(isObject({})).toBe(true);
        expect(isObject({ key: 'value' })).toBe(true);
        expect(isObject({ nested: { obj: true } })).toBe(true);
        expect(isObject(Object.create(null))).toBe(true);
      });

      it('should return false for non-objects', () => {
        expect(isObject(null)).toBe(false);
        expect(isObject(undefined)).toBe(false);
        expect(isObject('string')).toBe(false);
        expect(isObject(123)).toBe(false);
        expect(isObject(true)).toBe(false);
      });

      it('should return false for arrays', () => {
        expect(isObject([])).toBe(false);
        expect(isObject([1, 2, 3])).toBe(false);
      });

      it('should return true for object instances', () => {
        class TestClass {}
        expect(isObject(new TestClass())).toBe(true);
        expect(isObject(new Date())).toBe(true);
        expect(isObject(new Error())).toBe(true);
      });
    });

    describe('isFunction', () => {
      it('should return true for functions', () => {
        expect(isFunction(() => {})).toBe(true);
        expect(isFunction(function() {})).toBe(true);
        expect(isFunction(async () => {})).toBe(true);
        expect(isFunction(function* () {})).toBe(true);
        expect(isFunction(Math.max)).toBe(true);
      });

      it('should return false for non-functions', () => {
        expect(isFunction(123)).toBe(false);
        expect(isFunction('string')).toBe(false);
        expect(isFunction({})).toBe(false);
        expect(isFunction([])).toBe(false);
        expect(isFunction(null)).toBe(false);
        expect(isFunction(undefined)).toBe(false);
      });

      it('should return true for class constructors', () => {
        class TestClass {}
        expect(isFunction(TestClass)).toBe(true);
      });
    });

    describe('isPromise', () => {
      it('should return true for promises', () => {
        expect(isPromise(Promise.resolve())).toBe(true);
        expect(isPromise(Promise.reject().catch(() => {}))).toBe(true);
        expect(isPromise(new Promise(() => {}))).toBe(true);
      });

      it('should return false for non-promises', () => {
        expect(isPromise({})).toBe(false);
        expect(isPromise({ then: () => {} })).toBe(false); // Promise-like but not Promise
        expect(isPromise(async () => {})).toBe(false); // Async function, not promise
        expect(isPromise(123)).toBe(false);
        expect(isPromise(null)).toBe(false);
      });

      it('should work with async function results', () => {
        const asyncFunc = async () => 'result';
        const promise = asyncFunc();
        expect(isPromise(promise)).toBe(true);
      });
    });

    describe('isError', () => {
      it('should return true for Error instances', () => {
        expect(isError(new Error())).toBe(true);
        expect(isError(new Error('message'))).toBe(true);
        expect(isError(new TypeError())).toBe(true);
        expect(isError(new ReferenceError())).toBe(true);
        expect(isError(new RangeError())).toBe(true);
      });

      it('should return false for non-errors', () => {
        expect(isError({ message: 'error' })).toBe(false);
        expect(isError('error string')).toBe(false);
        expect(isError(123)).toBe(false);
        expect(isError(null)).toBe(false);
        expect(isError(undefined)).toBe(false);
      });

      it('should return true for custom error classes', () => {
        class CustomError extends Error {}
        expect(isError(new CustomError())).toBe(true);
      });
    });
  });

  describe('Type Assertions', () => {
    describe('assertIsString', () => {
      it('should not throw for strings', () => {
        expect(() => assertIsString('hello')).not.toThrow();
        expect(() => assertIsString('')).not.toThrow();
        expect(() => assertIsString('123')).not.toThrow();
      });

      it('should throw for non-strings', () => {
        expect(() => assertIsString(123)).toThrow('Expected string, got number');
        expect(() => assertIsString(true)).toThrow('Expected string, got boolean');
        expect(() => assertIsString({})).toThrow('Expected string, got object');
        expect(() => assertIsString(null)).toThrow('Expected string, got object');
        expect(() => assertIsString(undefined)).toThrow('Expected string, got undefined');
      });

      it('should narrow type after assertion', () => {
        const value: unknown = 'test';
        assertIsString(value);
        // Type is now narrowed to string
        const length: number = value.length;
        expect(length).toBe(4);
      });
    });

    describe('assertIsNumber', () => {
      it('should not throw for numbers', () => {
        expect(() => assertIsNumber(123)).not.toThrow();
        expect(() => assertIsNumber(0)).not.toThrow();
        expect(() => assertIsNumber(-1)).not.toThrow();
        expect(() => assertIsNumber(1.5)).not.toThrow();
        expect(() => assertIsNumber(NaN)).not.toThrow();
        expect(() => assertIsNumber(Infinity)).not.toThrow();
      });

      it('should throw for non-numbers', () => {
        expect(() => assertIsNumber('123')).toThrow('Expected number, got string');
        expect(() => assertIsNumber(true)).toThrow('Expected number, got boolean');
        expect(() => assertIsNumber({})).toThrow('Expected number, got object');
        expect(() => assertIsNumber(null)).toThrow('Expected number, got object');
      });

      it('should narrow type after assertion', () => {
        const value: unknown = 42;
        assertIsNumber(value);
        // Type is now narrowed to number
        const doubled: number = value * 2;
        expect(doubled).toBe(84);
      });
    });

    describe('assertIsArray', () => {
      it('should not throw for arrays', () => {
        expect(() => assertIsArray([])).not.toThrow();
        expect(() => assertIsArray([1, 2, 3])).not.toThrow();
        expect(() => assertIsArray(['a', 'b'])).not.toThrow();
        expect(() => assertIsArray(new Array(10))).not.toThrow();
      });

      it('should throw for non-arrays', () => {
        expect(() => assertIsArray('not array')).toThrow('Expected array, got string');
        expect(() => assertIsArray(123)).toThrow('Expected array, got number');
        expect(() => assertIsArray({})).toThrow('Expected array, got object');
        expect(() => assertIsArray(null)).toThrow('Expected array, got object');
      });

      it('should narrow type after assertion', () => {
        const value: unknown = [1, 2, 3];
        assertIsArray<number>(value);
        // Type is now narrowed to number[]
        const sum: number = value.reduce((a, b) => a + b, 0);
        expect(sum).toBe(6);
      });
    });
  });

  describe('Utility Functions', () => {
    describe('exhaustiveSwitch', () => {
      it('should always throw an error', () => {
        expect(() => exhaustiveSwitch('test' as never)).toThrow('Unhandled case: test');
        expect(() => exhaustiveSwitch(123 as never)).toThrow('Unhandled case: 123');
      });

      it('should be used in exhaustive switch statements', () => {
        type Status = 'idle' | 'loading' | 'success';

        function handleStatus(status: Status): string {
          switch (status) {
            case 'idle':
              return 'Idle';
            case 'loading':
              return 'Loading';
            case 'success':
              return 'Success';
            default:
              // If we add a new status and forget to handle it, TypeScript will error here
              return exhaustiveSwitch(status);
          }
        }

        expect(handleStatus('idle')).toBe('Idle');
        expect(handleStatus('loading')).toBe('Loading');
        expect(handleStatus('success')).toBe('Success');
      });
    });

    describe('typedKeys', () => {
      it('should return typed keys of an object', () => {
        const obj = { a: 1, b: 'two', c: true };
        const keys = typedKeys(obj);

        expect(keys).toEqual(['a', 'b', 'c']);
        expect(keys).toHaveLength(3);
      });

      it('should work with empty objects', () => {
        const obj = {};
        const keys = typedKeys(obj);

        expect(keys).toEqual([]);
      });

      it('should preserve key types', () => {
        interface User {
          name: string;
          age: number;
        }

        const user: User = { name: 'John', age: 30 };
        const keys = typedKeys(user);

        // Keys are typed as ('name' | 'age')[]
        expect(keys).toContain('name');
        expect(keys).toContain('age');
      });

      it('should work with objects with symbol keys', () => {
        const sym = Symbol('test');
        const obj = { a: 1, [sym]: 'symbol value' };
        const keys = typedKeys(obj);

        // Object.keys doesn't include symbol keys
        expect(keys).toEqual(['a']);
      });
    });

    describe('typedEntries', () => {
      it('should return typed entries of an object', () => {
        const obj = { a: 1, b: 'two', c: true };
        const entries = typedEntries(obj);

        expect(entries).toEqual([
          ['a', 1],
          ['b', 'two'],
          ['c', true]
        ]);
      });

      it('should work with empty objects', () => {
        const obj = {};
        const entries = typedEntries(obj);

        expect(entries).toEqual([]);
      });

      it('should preserve types in entries', () => {
        interface User {
          name: string;
          age: number;
        }

        const user: User = { name: 'John', age: 30 };
        const entries = typedEntries(user);

        expect(entries).toHaveLength(2);
        entries.forEach(([key, value]) => {
          if (key === 'name') {
            expect(typeof value).toBe('string');
          } else if (key === 'age') {
            expect(typeof value).toBe('number');
          }
        });
      });

      it('should allow iteration with proper types', () => {
        const obj = { a: 1, b: 2, c: 3 };
        let sum = 0;

        for (const [key, value] of typedEntries(obj)) {
          sum += value;
        }

        expect(sum).toBe(6);
      });
    });

    describe('safeJsonParse', () => {
      interface User {
        name: string;
        age: number;
      }

      const isUser = (value: unknown): value is User => {
        return (
          typeof value === 'object' &&
          value !== null &&
          'name' in value &&
          'age' in value &&
          typeof (value as User).name === 'string' &&
          typeof (value as User).age === 'number'
        );
      };

      it('should parse valid JSON that passes validation', () => {
        const json = '{"name":"John","age":30}';
        const result = safeJsonParse(json, isUser);

        expect(result).toEqual({ name: 'John', age: 30 });
      });

      it('should return null for invalid JSON', () => {
        const json = '{invalid json}';
        const result = safeJsonParse(json, isUser);

        expect(result).toBeNull();
      });

      it('should return null when validation fails', () => {
        const json = '{"name":"John"}'; // Missing age
        const result = safeJsonParse(json, isUser);

        expect(result).toBeNull();
      });

      it('should return null for JSON that parses but has wrong type', () => {
        const json = '["array", "not", "user"]';
        const result = safeJsonParse(json, isUser);

        expect(result).toBeNull();
      });

      it('should work with primitive validators', () => {
        const isString = (val: unknown): val is string => typeof val === 'string';

        expect(safeJsonParse('"hello"', isString)).toBe('hello');
        expect(safeJsonParse('123', isString)).toBeNull();
        expect(safeJsonParse('true', isString)).toBeNull();
      });

      it('should work with array validators', () => {
        const isNumberArray = (val: unknown): val is number[] => {
          return Array.isArray(val) && val.every(item => typeof item === 'number');
        };

        expect(safeJsonParse('[1,2,3]', isNumberArray)).toEqual([1, 2, 3]);
        expect(safeJsonParse('[1,"2",3]', isNumberArray)).toBeNull();
      });

      it('should handle edge cases', () => {
        const isAny = (_val: unknown): _val is any => true;

        expect(safeJsonParse('null', isAny)).toBeNull(); // Validator returns true but value is null
        expect(safeJsonParse('{}', isAny)).toEqual({});
        expect(safeJsonParse('[]', isAny)).toEqual([]);
      });
    });
  });

  describe('TypeSafetyPatterns Export', () => {
    it('should export all type guard functions', () => {
      expect(TypeSafetyPatterns.isEmail).toBe(isEmail);
      expect(TypeSafetyPatterns.isNonEmptyString).toBe(isNonEmptyString);
      expect(TypeSafetyPatterns.isPositiveNumber).toBe(isPositiveNumber);
      expect(TypeSafetyPatterns.isOfType).toBe(isOfType);
      expect(TypeSafetyPatterns.isArray).toBe(isArray);
      expect(TypeSafetyPatterns.isObject).toBe(isObject);
      expect(TypeSafetyPatterns.isFunction).toBe(isFunction);
      expect(TypeSafetyPatterns.isPromise).toBe(isPromise);
      expect(TypeSafetyPatterns.isError).toBe(isError);
    });

    it('should export all assertion functions', () => {
      expect(TypeSafetyPatterns.assertIsString).toBe(assertIsString);
      expect(TypeSafetyPatterns.assertIsNumber).toBe(assertIsNumber);
      expect(TypeSafetyPatterns.assertIsArray).toBe(assertIsArray);
    });

    it('should export all utility functions', () => {
      expect(TypeSafetyPatterns.exhaustiveSwitch).toBe(exhaustiveSwitch);
      expect(TypeSafetyPatterns.typedKeys).toBe(typedKeys);
      expect(TypeSafetyPatterns.typedEntries).toBe(typedEntries);
      expect(TypeSafetyPatterns.safeJsonParse).toBe(safeJsonParse);
    });

    it('should be a const object', () => {
      // Attempting to modify should fail in TypeScript (runtime test for const assertion)
      expect(Object.isFrozen(TypeSafetyPatterns)).toBe(false); // Not actually frozen, but const in TS
      expect(typeof TypeSafetyPatterns).toBe('object');
    });
  });

  describe('Integration Tests', () => {
    it('should work together in a real-world scenario', () => {
      interface ApiUser {
        id: number;
        email: string;
        name: string;
      }

      const isApiUser = (val: unknown): val is ApiUser => {
        if (!isObject(val)) return false;

        const obj = val as Record<string, unknown>;
        return (
          typeof obj.id === 'number' &&
          isPositiveNumber(obj.id) &&
          typeof obj.email === 'string' &&
          isEmail(obj.email) &&
          typeof obj.name === 'string' &&
          isNonEmptyString(obj.name)
        );
      };

      const validUserJson = '{"id":1,"email":"user@example.com","name":"John Doe"}';
      const invalidUserJson = '{"id":-1,"email":"invalid","name":""}';

      const validUser = safeJsonParse(validUserJson, isApiUser);
      const invalidUser = safeJsonParse(invalidUserJson, isApiUser);

      expect(validUser).toEqual({ id: 1, email: 'user@example.com', name: 'John Doe' });
      expect(invalidUser).toBeNull();
    });

    it('should handle form validation scenario', () => {
      interface FormData {
        email: string;
        age: string;
        terms: boolean;
      }

      function validateForm(data: unknown): FormData | null {
        if (!isObject(data)) return null;

        const obj = data as Record<string, unknown>;

        try {
          assertIsString(obj.email);
          assertIsString(obj.age);

          if (!isEmail(obj.email)) return null;
          if (!isNonEmptyString(obj.age)) return null;

          const ageNum = parseInt(obj.age, 10);
          if (!isPositiveNumber(ageNum)) return null;

          return {
            email: obj.email,
            age: obj.age,
            terms: Boolean(obj.terms)
          };
        } catch {
          return null;
        }
      }

      expect(validateForm({ email: 'user@test.com', age: '25', terms: true })).toEqual({
        email: 'user@test.com',
        age: '25',
        terms: true
      });

      expect(validateForm({ email: 'invalid', age: '25', terms: true })).toBeNull();
      expect(validateForm({ email: 'user@test.com', age: '-5', terms: true })).toBeNull();
      expect(validateForm('not an object')).toBeNull();
    });
  });
});
