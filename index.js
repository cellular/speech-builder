// @flow

const ssml = require('./ssml');
const features = require('./features');
const variations = require('./variations');

module.exports = {
  ssml,
  ...features,
  ...variations,
};
