// @flow

const url = require('url');
const xmlbuilder = require('xmlbuilder');
const escapeRe = require('escape-string-regexp');
const { ssml10, presets } = require('./features');

/*::
type Features = typeof ssml10;
type Opts = {
  features: Features,
  base?: ?string,
  lang?: ?string,
  pretty?: boolean,
  lexicon?: {
    [string]: string | {[string]: string}
  }
}
*/

class SpeechBuilder {
  /*::
  opts: Opts;
  features: Features;
  el: any;
  lexiconRe: ?RegExp;
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
    if (opts.lexicon) {
      const words = Object.keys(opts.lexicon)
        .map(escapeRe)
        .join('|');
      this.lexiconRe = new RegExp(`(${words})|(.+?)`, 'g');
    }
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
  addText(text /*: string | number */) {
    this.el.text(text);
    return this;
  }

  /**
   * Like `addText` but prepends a space (unless it's the first token or the
   * previous one alreads ends with whitespace).
   */
  addToken(text /*: string | number */) {
    const s = String(text);
    const startsWithSpace = /^\s/.test(s);
    if (!startsWithSpace) {
      const { children } = this.el;
      const l = children.length;
      if (l) {
        const last = children[l - 1];
        const { value } = last;
        if (value && /\S$/.test(value)) this.addText(' ');
      }
    }
    const { lexicon } = this.opts;
    const re = this.lexiconRe;
    if (lexicon && re) {
      let m;
      while ((m = re.exec(s))) {
        const [, grapheme, literal] = m;
        if (grapheme) {
          const ph = lexicon[grapheme];
          if (ph) this.phoneme(grapheme, ph);
          else this.addText(grapheme);
        } else this.addText(literal);
      }
    } else {
      this.addText(s);
    }
    return this;
  }

  /**
   * Like `addToken` but also accepts a function or an array.
   */
  add(content /*: any */) {
    if (typeof content == 'function') content(this);
    else if (content instanceof Array) {
      content.forEach(c => this.add(c));
    } else if (typeof content == 'string' || typeof content == 'number') {
      this.addToken(content);
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
   * Array of supported phoneme alphabets.
   * @private
   */
  get alphabets() {
    const { phoneme } = this.features;
    if (phoneme instanceof Array) return phoneme;
    if (typeof phoneme == 'string') return [phoneme];
    if (phoneme) return ['ipa'];
    return [];
  }

  /**
   * Returns the first supported phoneme from an object keyed
   * by alphabet.
   * @private
   */
  getSupportedPhoneme(dict /*: { [string]: string } */) {
    const { alphabets } = this;
    if (this.features.sub) alphabets.push('sub');
    const alphabet = alphabets.find(a => a in dict);
    if (alphabet && alphabet in dict) {
      return {
        alphabet,
        ph: dict[alphabet],
      };
    }
  }

  /**
   * Adds a `<phoneme>` tag. When an object with notations in
   * different alphabets is passed as `ph`, the first one
   * that is supported will be used. For platforms without phoneme
   * support, the special `sub` alphabet can be used to generate
   * a `<sub>` tag as fallback.
   */
  phoneme(text /*: string */, ph /*: string | { [string]: string } */) {
    const dict = typeof ph == 'object' ? ph : { ipa: ph };
    const attrs = this.getSupportedPhoneme(dict);
    if (!attrs) return this.addText(text);
    if (attrs.alphabet == 'sub') return this.sub(text, attrs.ph);
    this.el.ele('phoneme', attrs, text);
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
   * Adds an `<say-as>` tag. If not supported, the text is added as-is.
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
    return this.el.end({
      pretty: this.opts.pretty,
    });
  }

  /**
   * Duck-type as string to support the Jovo framework.
   */
  replace(
    pattern /*: string | RegExp */,
    replacement /*: string | Function */
  ) {
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

module.exports = function ssml(opts /*: ?string | Object */) {
  return new SpeechBuilder(configure(opts));
};
