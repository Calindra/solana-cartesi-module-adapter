import { strict as assert } from 'node:assert';
import { describe, it } from 'node:test';

function sum(a: number, b: number): number {
  return a + b;
}

describe('portal', () => {
  it('should return the sum of two numbers', () => {
    assert.strictEqual(sum(1, 2), 3);
  });
});
