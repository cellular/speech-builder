// @flow

const speak = require('./');

describe('speak', () => {
  test('empty', () => {
    const ssml = speak();
    expect(ssml.toString()).toEqual('<speak/>');
  });

  test('version', () => {
    const ssml = speak({ features: { speak: { version: '1.1' } } });
    expect(ssml.toString()).toEqual('<speak version="1.1"/>');
  });

  test('required attributes', () => {
    const ssml = speak('cortana');
    expect(ssml.toString()).toEqual(
      '<speak version="1.0" xmlns="http://www.w3.org/2001/10/synthesis" xml:lang="en-US"/>'
    );
  });

  test('lang option', () => {
    const ssml = speak({ features: 'google', lang: 'de' });
    expect(ssml.toString()).toEqual('<speak xml:lang="de"/>');
  });

  test('lang override', () => {
    const ssml = speak({ features: 'cortana', lang: 'de' });
    expect(ssml.toString()).toEqual(
      '<speak version="1.0" xmlns="http://www.w3.org/2001/10/synthesis" xml:lang="de"/>'
    );
  });
});

describe('add', () => {
  test('string', () => {
    const ssml = speak().add('hello');
    expect(ssml.toString()).toEqual('<speak>hello</speak>');
  });

  test('number', () => {
    const ssml = speak().add(42);
    expect(ssml.toString()).toEqual('<speak>42</speak>');
  });

  test('function', () => {
    const ssml = speak().add(s => s.add('hi'));
    expect(ssml.toString()).toEqual('<speak>hi</speak>');
  });
});

describe('sub', () => {
  test('supported', () => {
    const ssml = speak().sub('kg', 'Kilo');
    expect(ssml.toString()).toEqual(
      '<speak><sub alias="Kilo">kg</sub></speak>'
    );
  });

  test('not supported', () => {
    const ssml = speak({ sub: false }).sub('kg', 'Kilo');
    expect(ssml.toString()).toEqual('<speak>Kilo</speak>');
  });
});

describe('phoneme', () => {
  test('with alphabet', () => {
    const ssml = speak('alexa').phoneme('Quote', '"kvo:t@', 'x-sampa');
    expect(ssml.toString()).toEqual(
      '<speak><phoneme alphabet="x-sampa" ph="&quot;kvo:t@">Quote</phoneme></speak>'
    );
  });

  test('default alphabet', () => {
    const ssml = speak('alexa').phoneme('Quote', 'ˈkvoːtə');
    expect(ssml.toString()).toEqual(
      '<speak><phoneme alphabet="ipa" ph="ˈkvoːtə">Quote</phoneme></speak>'
    );
  });

  test('not supported', () => {
    const ssml = speak('google').phoneme('Quote', 'ˈkvoːtə');
    expect(ssml.toString()).toEqual('<speak>Quote</speak>');
  });
});

describe('break', () => {
  test('empty', () => {
    const ssml = speak()
      .add('take a ')
      .break();
    expect(ssml.toString()).toEqual('<speak>take a <break/></speak>');
  });

  test('time', () => {
    const ssml = speak().break('2s');
    expect(ssml.toString()).toEqual('<speak><break time="2s"/></speak>');
  });

  test('number', () => {
    const ssml = speak().break(250);
    expect(ssml.toString()).toEqual('<speak><break time="250ms"/></speak>');
  });

  test('strength', () => {
    const ssml = speak().break('x-strong');
    expect(ssml.toString()).toEqual(
      '<speak><break strength="x-strong"/></speak>'
    );
  });
});

describe('audio', () => {
  test('with alt text', () => {
    const ssml = speak('google');
    expect(
      ssml.audio({ src: 'welcome.mp3', alt: 'Hello!' }).toString()
    ).toEqual('<speak><audio src="welcome.mp3">Hello!</audio></speak>');
  });

  test('with base', () => {
    const ssml = speak({
      features: 'alexa',
      base: 'https://example.com/',
    });
    expect(ssml.audio('welcome.mp3').toString()).toEqual(
      '<speak><audio src="https://example.com/welcome.mp3"/></speak>'
    );
  });

  test('with xml:base', () => {
    const ssml = speak({
      features: { speak: { base: true }, audio: true },
      base: 'https://example.com',
    }).audio('welcome.mp3');
    expect(ssml.toString()).toEqual(
      '<speak xml:base="https://example.com"><audio src="welcome.mp3"/></speak>'
    );
  });

  test('not supported', () => {
    const ssml = speak({ audio: false });
    expect(
      ssml.audio({ src: 'welcome.mp3', alt: 'Hello!' }).toString()
    ).toEqual('<speak>Hello!</speak>');
  });

  test('children not supported', () => {
    const ssml = speak('alexa');
    expect(
      ssml.audio({ src: 'welcome.mp3', alt: 'Hello!' }).toString()
    ).toEqual('<speak><audio src="welcome.mp3"/></speak>');
  });
});

describe('emphasis', () => {
  test('supported', () => {
    const ssml = speak()
      .add('I mean ')
      .emphasis('wow!');
    expect(ssml.toString()).toEqual(
      '<speak>I mean <emphasis>wow!</emphasis></speak>'
    );
  });

  test('level', () => {
    const ssml = speak()
      .add('I mean ')
      .emphasis('wow!', 'strong');
    expect(ssml.toString()).toEqual(
      '<speak>I mean <emphasis level="strong">wow!</emphasis></speak>'
    );
  });

  test('not supported', () => {
    const ssml = speak({ emphasis: false })
      .add('I mean ')
      .emphasis('wow!');
    expect(ssml.toString()).toEqual('<speak>I mean wow!</speak>');
  });
});

describe('structure', () => {
  test('p,s', () => {
    const ssml = speak()
      .add('hello ')
      .p(p => p.s('one').s('two'))
      .add('three');
    expect(ssml.toString()).toEqual(
      '<speak>hello <p><s>one</s><s>two</s></p>three</speak>'
    );
  });

  test('xml:lang', () => {
    const ssml = speak().s(s => s.lang('de').add('hi'));
    expect(ssml.toString()).toEqual('<speak><s xml:lang="de">hi</s></speak>');
  });
});

describe('lang', () => {
  test('supported', () => {
    const ssml = speak().s(s => s.lang('de').add('hi'));
    expect(ssml.toString()).toEqual('<speak><s xml:lang="de">hi</s></speak>');
  });

  test('not supported', () => {
    const ssml = speak('alexa').s(s => s.lang('de').add('hi'));
    expect(ssml.toString()).toEqual('<speak><s>hi</s></speak>');
  });
});

describe('w', () => {
  test('supported', () => {
    const ssml = speak('alexa')
      .add('read, ')
      .w('amazon:VBD', 'read');
    expect(ssml.toString()).toEqual(
      '<speak>read, <w role="amazon:VBD">read</w></speak>'
    );
  });

  test('not supported', () => {
    const ssml = speak()
      .add('read, ')
      .w('amazon:VBD', 'read');
    expect(ssml.toString()).toEqual('<speak>read, read</speak>');
  });
});

describe('effect', () => {
  test('supported', () => {
    const ssml = speak('alexa').effect('whispered', 'psst');
    expect(ssml.toString()).toEqual(
      '<speak><amazon:effect name="whispered">psst</amazon:effect></speak>'
    );
  });

  test('not supported', () => {
    const ssml = speak().effect('whispered', 'psst');
    expect(ssml.toString()).toEqual('<speak>psst</speak>');
  });
});

describe('say-as', () => {
  test('ordinal', () => {
    const ssml = speak()
      .sayAs('ordinal', 1)
      .add(' try');
    expect(ssml.toString()).toEqual(
      '<speak><say-as interpret-as="ordinal">1</say-as> try</speak>'
    );
  });

  test('date', () => {
    const ssml = speak().sayAs('date', '2018-01-01', 'y');
    expect(ssml.toString()).toEqual(
      '<speak><say-as interpret-as="date" format="y">2018-01-01</say-as></speak>'
    );
  });
});

describe('prosody', () => {
  test('supported', () => {
    const ssml = speak()
      .add('hey ')
      .prosody({ pitch: 'low', rate: 'slow' }, 'ho');
    expect(ssml.toString()).toEqual(
      '<speak>hey <prosody pitch="low" rate="slow">ho</prosody></speak>'
    );
  });

  test('not supported', () => {
    const ssml = speak({ prosody: false })
      .add('hey ')
      .prosody({ pitch: 'low', rate: 'slow' }, 'ho');
    expect(ssml.toString()).toEqual('<speak>hey ho</speak>');
  });
});
