// @flow

const ssml = {
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
    ...ssml,
    speak: {},
  },

  alexa: {
    ...ssml,
    speak: {},
    lang: false,
    audio: {
      children: false,
    },
    w: true,
    effect: 'amazon:effect',
  },

  google: {
    ...ssml,
    speak: {},
    phoneme: false,
    prosody: false,
  },

  cortana: {
    ...ssml,
    emphasis: false,
  },
};

module.exports = {
  ssml,
  presets,
};
