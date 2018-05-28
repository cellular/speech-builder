// @flow

/**
 * Returns a random argument.
 */
function random(...args /*: any */) {
  return randomItem(args);
}

/**
 * Returns a random item from the given array.
 */
function randomItem(array /*: any[] */) {
  const length = array == null ? 0 : array.length;
  return length ? array[Math.floor(Math.random() * length)] : undefined;
}

/**
 * Returns `value` with the given probability, `false` otherwise.
 */
function chance(probability /*: number */ = 0.5, value /*: any */ = true) {
  return probability > Math.random() && value;
}

module.exports = {
  random,
  randomItem,
  chance,
};
