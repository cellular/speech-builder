// @flow

const ssml10 = {
  speak: {
    version: '1.0',
    xmlns: 'http://www.w3.org/2001/10/synthesis',
    lang: 'en-US',
    base: '',
  },
  lang: true,
  p: true,
  s: true,
  sayAs: true,
  phoneme: true,
  prosody: true,
  sub: true,
  break: true,
  emphasis: true,
  audio: {
    children: true,
  },
};

const presets = {
  default: {
    ...ssml10,
    speak: {},
  },

  alexa: {
    ...ssml10,
    speak: {},
    lang: false,
    phoneme: ['ipa', 'x-sampa'],
    audio: {
      children: false,
    },
    w: true,
    effect: 'amazon:effect',
  },

  google: {
    ...ssml10,
    speak: {},
    phoneme: false,
    prosody: false,
  },

  cortana: {
    ...ssml10,
    emphasis: false,
    phoneme: ['ipa', 'sapi', 'ups'],
  },
};

module.exports = {
  ssml10,
  presets,
};
