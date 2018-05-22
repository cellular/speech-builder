// @flow

const url = require('url');
const xmlbuilder = require('xmlbuilder');
const { ssml10, presets } = require('./features');

/*::
type Features = typeof ssml10;
type Opts = {
  features: Features,
  base?: ?string,
  lang?: ?string
}
*/

class SpeechBuilder {
  /*::
  opts: Opts;
  features: Features;
  el: any;
  */

  constructor(opts /*: Opts */, el /*: any */) {
    const { features } = opts;
    this.opts = opts;
    this.features = features;
    this.el = el || xmlbuilder.begin().ele('speak');

    const { version, xmlns, base, lang } = features.speak;
    if (version) this.el.att('version', version);
    if (xmlns) this.el.att('xmlns', xmlns);
    if (opts.base && base) this.el.att('xml:base', opts.base);

    this.lang(opts.lang || lang);
  }

  /**
   * Private helper method to resolve relative URLs.
   * @private
   */
  resolve(href /*: string */) {
    if (this.features.speak.base) {
      // platform supports xml:base, keep relative
      return href;
    }
    // resolve from opts.base
    const { base } = this.opts;
    return url.resolve(base || '', href);
  }

  /**
   * Adds an `xml:lang` attribute to the current node.
   * If not supported, this is a no-op.
   */
  lang(lang /*: ?string */) {
    if (lang && this.features.lang) {
      const { name } = this.el;
      if (/^(speak|p|s|voice)$/.test(name)) {
        this.el.att('xml:lang', lang);
      }
    }
    return this;
  }

  /**
   * Adds text. Characters with special meaning in XML are properly escaped.
   */
  add(content /*: any */) {
    if (typeof content == 'function') content(this);
    else if (typeof content == 'string' || typeof content == 'number') {
      this.el.text(content);
    }
    return this;
  }

  /**
   * Adds a `<sub>` tag. If substitions are not supported,
   * the alias is added as text instead.
   */
  sub(text /*: string */, alias /*: string */) {
    if (!this.features.sub) return this.add(alias);
    this.el.ele('sub', { alias }, text);
    return this;
  }

  /**
   * Adds a `<phoneme>` tag. If phonemes are not supported,
   * the text is added as-is.
   */
  phoneme(
    text /*: string */,
    ph /*: string */,
    alphabet /*: string */ = 'ipa'
  ) {
    if (!this.features.phoneme) return this.add(text);
    this.el.ele('phoneme', { alphabet, ph }, text);
    return this;
  }

  /**
   * Adds a `<break>` tag. If not supported, this is a no-op.
   */
  break(time /*: ?string | number */) {
    if (this.features.break) {
      const attrs = {};
      if (time) {
        if (typeof time == 'number') time = `${time}ms`;
        const type = /\d/.test(time) ? 'time' : 'strength';
        attrs[type] = time;
      }
      this.el.ele('break', attrs);
    }
    return this;
  }

  /**
   * Adds an `<audio>` tag. If not supported, the alt text
   * is added as plain text.
   */
  audio(src /*: string | {src: string, alt?: string } */) {
    let alt;
    if (typeof src == 'object') {
      alt = src.alt;
      src = src.src;
    }
    if (!src || !this.features.audio) return this.add(alt);
    const audio = this.el.ele('audio', { src: this.resolve(src) });
    if (alt && this.features.audio.children) audio.txt(alt);
    return this;
  }

  /**
   * Internal helper method to wrap content inside a tag.
   * @private
   */
  wrap(content /*: any */, tag /*: string */, attrs /*: ?Object */) {
    let builder = this;
    const supported = this.features[tag];
    if (supported) {
      const name = typeof supported == 'string' ? supported : tag;
      const el = this.el.ele(name, attrs);
      builder = new SpeechBuilder(this.opts, el);
    }
    builder.add(content);
    return this;
  }

  /**
   * Adds an `<emphasis>` tag. If not supported, the text is added as-is.
   */
  emphasis(content /*: any */, level /*: ?string */) {
    const attrs = {};
    if (level) attrs.level = level;
    return this.wrap(content, 'emphasis', attrs);
  }

  /**
   * Adds a `<p>` tag. If not supported, the text is added as-is.
   */
  p(content /*: any */) {
    return this.wrap(content, 'p');
  }

  /**
   * Adds an `<s>` tag. If not supported, the text is added as-is.
   */
  s(content /*:any */) {
    return this.wrap(content, 's');
  }

  /**
   * Adds a `<w>` tag. If not supported, the text is added as-is.
   */
  w(role /*: string */, content /*: any */) {
    return this.wrap(content, 'w', { role });
  }

  /**
   * Adds an `<*:effect>` tag. If not supported, the text is added as-is.
   * NOTE: The namespace can be configured via the `effect` feature setting.
   */
  effect(name /*: string */, content /*: any */) {
    return this.wrap(content, 'effect', { name });
  }

  /**
   * Adds an `<say-`as> tag. If not supported, the text is added as-is.
   */
  sayAs(
    interpretAs /*: string */,
    text /*: string|number */,
    format /*: ?string */,
    detail /*: ?string|number */
  ) {
    if (!this.features.sayAs) return this.add(text);
    const attrs /*: Object */ = { 'interpret-as': interpretAs };
    if (format) attrs.format = format;
    if (detail) attrs.detail = detail;
    this.el.ele('say-as', attrs, text);
    return this;
  }

  /**
   * Adds a `<prosody>` tag. If not supported, the text is added as-is.
   */
  prosody(attrs /*: Object */, text /*: any */) {
    if (!this.features.prosody) return this.add(text);
    this.el.ele('prosody', attrs, text);
    return this;
  }

  toString() /*: string */ {
    return this.el.end();
  }

  replace(pattern, replacement) {
    return this.toString().replace(pattern, replacement);
  }
}

function features(opts /*: any */) /*: Features */ {
  if (typeof opts == 'string') opts = presets[opts];
  if (typeof opts == 'object') return { ...presets.default, ...opts };
  return ssml10;
}

function configure(opts /*: any */ = {}) /*: Opts */ {
  if (opts && opts.features) return { ...opts, ...configure(opts.features) };
  return { features: features(opts) };
}

function ssml(opts /*: ?string | Object */) {
  return new SpeechBuilder(configure(opts));
}

module.exports = {
  ssml,
};
