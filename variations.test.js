// @flow

const { chance, random, randomItem } = require('./variations');
const { mockRandom, resetMockRandom } = require('jest-mock-random');

afterAll(resetMockRandom);

describe('chance', () => {
  test('1', () => {
    expect(chance(1)).toBeTruthy();
  });

  test('0', () => {
    expect(chance(0)).toBeFalsy();
  });

  test('0.5', () => {
    mockRandom(0.4);
    expect(chance(0.5, 'foo')).toBe('foo');
  });
});

describe('random', () => {
  test('one arg', () => {
    mockRandom(0.4);
    expect(random('a')).toBe('a');
  });

  test('two args', () => {
    mockRandom([0.1, 0.6]);
    expect(random('a', 'b')).toBe('a');
    expect(random('a', 'b')).toBe('b');
  });
});

describe('randomItem', () => {
  test('one item', () => {
    mockRandom(0.1);
    expect(randomItem([1])).toBe(1);
  });

  test('two items', () => {
    mockRandom(0.9);
    expect(randomItem([1, 2])).toBe(2);
  });
});
