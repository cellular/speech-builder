// @flow

const { ssml, random, chance } = require('.');
const { mockRandom, resetMockRandom } = require('jest-mock-random');

afterAll(resetMockRandom);

test('ssml', () => {
  expect(
    ssml()
      .add('Hello')
      .emphasis('world')
      .toString()
  ).toEqual('<speak>Hello<emphasis>world</emphasis></speak>');
});

test('random', () => {
  mockRandom(0.3);
  expect(
    ssml()
      .add(random('hallo', 'hello', 'ciao', 'hola', 'salut'))
      .add('world')
      .toString()
  ).toEqual('<speak>hello world</speak>');
});

test('random', () => {
  mockRandom(0.3);
  expect(
    ssml()
      .add('hello')
      .add(chance(0.5, 'beautiful'))
      .add('world')
      .toString()
  ).toEqual('<speak>hello beautiful world</speak>');
});
