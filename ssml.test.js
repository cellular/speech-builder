// @flow

const ssml = require('./ssml');

describe('speak', () => {
  test('empty', () => {
    const speak = ssml();
    expect(speak.toString()).toEqual('<speak/>');
  });

  test('version', () => {
    const speak = ssml({ features: { speak: { version: '1.1' } } });
    expect(speak.toString()).toEqual('<speak version="1.1"/>');
  });

  test('required attributes', () => {
    const speak = ssml('cortana');
    expect(speak.toString()).toEqual(
      '<speak version="1.0" xmlns="http://www.w3.org/2001/10/synthesis" xml:lang="en-US"/>'
    );
  });

  test('lang option', () => {
    const speak = ssml({ features: 'google', lang: 'de' });
    expect(speak.toString()).toEqual('<speak xml:lang="de"/>');
  });

  test('lang override', () => {
    const speak = ssml({ features: 'cortana', lang: 'de' });
    expect(speak.toString()).toEqual(
      '<speak version="1.0" xmlns="http://www.w3.org/2001/10/synthesis" xml:lang="de"/>'
    );
  });
});

describe('add', () => {
  test('string', () => {
    const speak = ssml().add('hello');
    expect(speak.toString()).toEqual('<speak>hello</speak>');
  });

  test('tokens', () => {
    const speak = ssml()
      .add('hello')
      .add('world');
    expect(speak.toString()).toEqual('<speak>hello world</speak>');
  });

  test('number', () => {
    const speak = ssml().add(42);
    expect(speak.toString()).toEqual('<speak>42</speak>');
  });

  test('function', () => {
    const speak = ssml().add(s => s.add('hi'));
    expect(speak.toString()).toEqual('<speak>hi</speak>');
  });
});

describe('sub', () => {
  test('supported', () => {
    const speak = ssml().sub('kg', 'Kilo');
    expect(speak.toString()).toEqual(
      '<speak><sub alias="Kilo">kg</sub></speak>'
    );
  });

  test('not supported', () => {
    const speak = ssml({ sub: false }).sub('kg', 'Kilo');
    expect(speak.toString()).toEqual('<speak>Kilo</speak>');
  });
});

describe('phoneme', () => {
  test('with alphabet', () => {
    const speak = ssml('alexa').phoneme('Quote', {
      'x-sampa': '"kvo:t@',
    });
    expect(speak.toString()).toEqual(
      '<speak><phoneme alphabet="x-sampa" ph="&quot;kvo:t@">Quote</phoneme></speak>'
    );
  });

  test('default alphabet', () => {
    const speak = ssml('alexa').phoneme('Quote', 'ˈkvoːtə');
    expect(speak.toString()).toEqual(
      '<speak><phoneme alphabet="ipa" ph="ˈkvoːtə">Quote</phoneme></speak>'
    );
  });

  test('not supported', () => {
    const speak = ssml('google').phoneme('Quote', 'ˈkvoːtə');
    expect(speak.toString()).toEqual('<speak>Quote</speak>');
  });

  test('sub fallback', () => {
    const speak = ssml('google').phoneme('Quote', {
      ipa: 'ˈkvoːtə',
      sub: 'Kwote',
    });
    expect(speak.toString()).toEqual(
      '<speak><sub alias="Kwote">Quote</sub></speak>'
    );
  });
});

describe('break', () => {
  test('empty', () => {
    const speak = ssml()
      .add('take a ')
      .break();
    expect(speak.toString()).toEqual('<speak>take a <break/></speak>');
  });

  test('time', () => {
    const speak = ssml().break('2s');
    expect(speak.toString()).toEqual('<speak><break time="2s"/></speak>');
  });

  test('number', () => {
    const speak = ssml().break(250);
    expect(speak.toString()).toEqual('<speak><break time="250ms"/></speak>');
  });

  test('strength', () => {
    const speak = ssml().break('x-strong');
    expect(speak.toString()).toEqual(
      '<speak><break strength="x-strong"/></speak>'
    );
  });
});

describe('audio', () => {
  test('with alt text', () => {
    const speak = ssml('google');
    expect(
      speak.audio({ src: 'welcome.mp3', alt: 'Hello!' }).toString()
    ).toEqual('<speak><audio src="welcome.mp3">Hello!</audio></speak>');
  });

  test('with base', () => {
    const speak = ssml({
      features: 'alexa',
      base: 'https://example.com/',
    });
    expect(speak.audio('welcome.mp3').toString()).toEqual(
      '<speak><audio src="https://example.com/welcome.mp3"/></speak>'
    );
  });

  test('with xml:base', () => {
    const speak = ssml({
      features: { speak: { base: true }, audio: true },
      base: 'https://example.com',
    }).audio('welcome.mp3');
    expect(speak.toString()).toEqual(
      '<speak xml:base="https://example.com"><audio src="welcome.mp3"/></speak>'
    );
  });

  test('not supported', () => {
    const speak = ssml({ audio: false });
    expect(
      speak.audio({ src: 'welcome.mp3', alt: 'Hello!' }).toString()
    ).toEqual('<speak>Hello!</speak>');
  });

  test('children not supported', () => {
    const speak = ssml('alexa');
    expect(
      speak.audio({ src: 'welcome.mp3', alt: 'Hello!' }).toString()
    ).toEqual('<speak><audio src="welcome.mp3"/></speak>');
  });
});

describe('emphasis', () => {
  test('supported', () => {
    const speak = ssml()
      .add('I mean ')
      .emphasis('wow!');
    expect(speak.toString()).toEqual(
      '<speak>I mean <emphasis>wow!</emphasis></speak>'
    );
  });

  test('level', () => {
    const speak = ssml()
      .add('I mean ')
      .emphasis('wow!', 'strong');
    expect(speak.toString()).toEqual(
      '<speak>I mean <emphasis level="strong">wow!</emphasis></speak>'
    );
  });

  test('not supported', () => {
    const speak = ssml({ emphasis: false })
      .add('I mean ')
      .emphasis('wow!');
    expect(speak.toString()).toEqual('<speak>I mean wow!</speak>');
  });
});

describe('structure', () => {
  test('p,s', () => {
    const speak = ssml()
      .add('hello ')
      .p(p => p.s('one').s('two'))
      .add('three');
    expect(speak.toString()).toEqual(
      '<speak>hello <p><s>one</s><s>two</s></p>three</speak>'
    );
  });

  test('xml:lang', () => {
    const speak = ssml().s(s => s.lang('de').add('hi'));
    expect(speak.toString()).toEqual('<speak><s xml:lang="de">hi</s></speak>');
  });
});

describe('lang', () => {
  test('supported', () => {
    const speak = ssml().s(s => s.lang('de').add('hi'));
    expect(speak.toString()).toEqual('<speak><s xml:lang="de">hi</s></speak>');
  });

  test('not supported', () => {
    const speak = ssml('alexa').s(s => s.lang('de').add('hi'));
    expect(speak.toString()).toEqual('<speak><s>hi</s></speak>');
  });
});

describe('w', () => {
  test('supported', () => {
    const speak = ssml('alexa')
      .add('read, ')
      .w('amazon:VBD', 'read');
    expect(speak.toString()).toEqual(
      '<speak>read, <w role="amazon:VBD">read</w></speak>'
    );
  });

  test('not supported', () => {
    const speak = ssml()
      .add('read, ')
      .w('amazon:VBD', 'read');
    expect(speak.toString()).toEqual('<speak>read, read</speak>');
  });
});

describe('effect', () => {
  test('supported', () => {
    const speak = ssml('alexa').effect('whispered', 'psst');
    expect(speak.toString()).toEqual(
      '<speak><amazon:effect name="whispered">psst</amazon:effect></speak>'
    );
  });

  test('not supported', () => {
    const speak = ssml().effect('whispered', 'psst');
    expect(speak.toString()).toEqual('<speak>psst</speak>');
  });
});

describe('say-as', () => {
  test('ordinal', () => {
    const speak = ssml()
      .sayAs('ordinal', 1)
      .add(' try');
    expect(speak.toString()).toEqual(
      '<speak><say-as interpret-as="ordinal">1</say-as> try</speak>'
    );
  });

  test('date', () => {
    const speak = ssml().sayAs('date', '2018-01-01', 'y');
    expect(speak.toString()).toEqual(
      '<speak><say-as interpret-as="date" format="y">2018-01-01</say-as></speak>'
    );
  });
});

describe('prosody', () => {
  test('supported', () => {
    const speak = ssml()
      .add('hey ')
      .prosody({ pitch: 'low', rate: 'slow' }, 'ho');
    expect(speak.toString()).toEqual(
      '<speak>hey <prosody pitch="low" rate="slow">ho</prosody></speak>'
    );
  });

  test('not supported', () => {
    const speak = ssml({ prosody: false })
      .add('hey ')
      .prosody({ pitch: 'low', rate: 'slow' }, 'ho');
    expect(speak.toString()).toEqual('<speak>hey ho</speak>');
  });
});

describe('lexicon', () => {
  test('add', () => {
    const speak = ssml({
      features: 'alexa',
      lexicon: {
        foo: 'fu',
        bar: { sub: 'ba' },
      },
    }).add('foo bar');
    expect(speak.toString()).toEqual(
      '<speak><phoneme alphabet="ipa" ph="fu">foo</phoneme> <sub alias="ba">bar</sub></speak>'
    );
  });
});
