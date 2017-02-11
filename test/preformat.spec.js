'use strict';

const chai = require('chai');
const chaiAsPromised = require('chai-as-promised');
const sinon = require('sinon');

chai.use(chaiAsPromised);
chai.should();

describe('PreFormat', function () {
  const Formatter = require('../');
  const getFixtures = require('./fixtures');

  let formatter;
  let baseMicroformatData;
  let sandbox;

  beforeEach(function () {
    sandbox = sinon.sandbox.create();
    sandbox.useFakeTimers(1435674000000);

    const fixtures = getFixtures();

    formatter = new Formatter();
    baseMicroformatData = fixtures.baseMicroformatData;
  });

  afterEach(function () {
    sandbox.restore();
  });

  describe('preFormat', function () {
    it('should add published', function () {
      delete baseMicroformatData.properties.published;
      return formatter.preFormat(baseMicroformatData).should.eventually.have.deep.property('properties.published[0]').that.is.an.instanceOf(Date).and.eql(new Date(Date.now() - 15000));
    });

    it('should ensure slug', function () {
      delete baseMicroformatData.properties.slug;
      return formatter.preFormat(baseMicroformatData).should.eventually.have.deep.property('properties.slug[0]', 'awesomeness-is-awesome');
    });

    it('should derive social category for replies', function () {
      baseMicroformatData.properties['in-reply-to'] = ['http://example.com/replied/to/page'];
      return formatter.preFormat(baseMicroformatData).should.eventually.have.deep.property('derived.category', 'social');
    });

    it('should derive social category for likes', function () {
      baseMicroformatData.properties['like-of'] = ['http://example.com/liked/page'];
      return formatter.preFormat(baseMicroformatData).should.eventually.have.deep.property('derived.category', 'social');
    });

    it('should derive social category for notes', function () {
      delete baseMicroformatData.properties.name;
      delete baseMicroformatData.properties.slug;
      return formatter.preFormat(baseMicroformatData).should.eventually.have.deep.property('derived.category', 'social');
    });

    it('should derive links category for bookmarks', function () {
      baseMicroformatData.properties.bookmark = ['http://example.com/bookmarked/page'];
      return formatter.preFormat(baseMicroformatData).should.eventually.have.deep.property('derived.category', 'links');
    });

    it('should derive links category for alternative bookmark property', function () {
      baseMicroformatData.properties['bookmark-of'] = ['http://example.com/bookmarked/page'];
      return formatter.preFormat(baseMicroformatData).should.eventually.have.deep.property('derived.category', 'links');
    });

    it('should derive links category for reposts', function () {
      baseMicroformatData.properties['repost-of'] = ['http://example.com/reposted/page'];
      return formatter.preFormat(baseMicroformatData).should.eventually.have.deep.property('derived.category', 'links');
    });

    it('should derive links category for title-less bookmarks', function () {
      delete baseMicroformatData.properties.name;
      delete baseMicroformatData.properties.slug;
      baseMicroformatData.properties.bookmark = ['http://example.com/bookmarked/page'];
      return formatter.preFormat(baseMicroformatData).should.eventually.have.deep.property('derived.category', 'links');
    });

    it('should not derive interaction category for normal post', function () {
      return formatter.preFormat(baseMicroformatData).should.eventually.not.have.deep.property('derived.category');
    });

    it('should not derive interaction category when opted out of', function () {
      formatter = new Formatter({ deriveCategory: false });
      baseMicroformatData.properties['in-reply-to'] = ['http://example.com/replied/to/page'];
      return formatter.preFormat(baseMicroformatData).should.eventually.not.have.deep.property('derived.category');
    });

    it('should use result of deriveCategory() method when provided', function () {
      formatter = new Formatter({ deriveCategory: () => 'foo' });
      return formatter.preFormat(baseMicroformatData).should.eventually.have.deep.property('derived.category', 'foo');
    });

    it('should extract person tags from regular tags', function () {
      baseMicroformatData.properties.category = ['http://example.com/', 'foo', 'http://example.net/'];
      return formatter.preFormat(baseMicroformatData).then(function (result) {
        result.should.have.deep.property('derived.personTags').that.deep.equals([
          'http://example.com/',
          'http://example.net/'
        ]);
        result.should.have.deep.property('properties.category').that.deep.equals(['foo']);
      });
    });

    it('should flag that the data has been preformatted', function () {
      return formatter.preFormat(baseMicroformatData).should.eventually.have.property('preFormatted', true);
    });

    it('should not preformat already preformatted data', function () {
      return formatter.preFormat({ preFormatted: true }).should.eventually.deep.equal({ preFormatted: true });
    });

    it('should add defaults when such are defined', function () {
      formatter = new Formatter({
        defaults: {
          properties: {
            lang: ['en']
          }
        }
      });
      return formatter.preFormat(baseMicroformatData)
        .should.eventually
        .have.deep.property('properties.lang')
        .that.deep.equals(['en']);
    });

    it('should not add defaults when value already exists', function () {
      formatter = new Formatter({
        defaults: {
          properties: {
            content: ['some default content']
          }
        }
      });
      return formatter.preFormat(baseMicroformatData)
        .should.eventually
        .have.deep.property('properties.content')
        .that.deep.equals(['hello world']);
    });

    it('should be able to base slug on default publish times', function () {
      delete baseMicroformatData.properties.name;
      delete baseMicroformatData.properties.published;
      delete baseMicroformatData.properties.slug;

      return formatter.preFormat(baseMicroformatData)
        .should.eventually
        .have.deep.property('properties.slug')
        .that.deep.equals([(51600 - 15) + '']);
    });

    it('should derive english language from content', function () {
      baseMicroformatData.properties.content = ['Another evening at the cottage and Bob was feeling brave. Make some food by himself? Surely, how hard could it be. But as the night went on and the dinner cooked Bob grew ever more desperate. Pepper, salt – all these crazy names of things he had never heard before. It would be a long night for poor Mr Bob.'];

      formatter = new Formatter({
        deriveLanguages: ['eng', 'swe']
      });

      return formatter.preFormat(baseMicroformatData)
        .should.eventually
        .have.deep.property('properties.lang')
        .that.deep.equals(['en']);
    });

    it('should derive swedish language from content', function () {
      baseMicroformatData.properties.content = ['Det var en gång en liten utter som hette Skog. Något ironiskt så för skog var allt annat än det som fanns kvar efter att Skog haft sin framfart i sitt grannskap. Varenda liten plätt var kal som åker. Men Skog var inte ledsen för det. Han hade ju trots allt sig själv.'];

      formatter = new Formatter({
        deriveLanguages: ['eng', 'swe']
      });

      return formatter.preFormat(baseMicroformatData)
        .should.eventually
        .have.deep.property('properties.lang')
        .that.deep.equals(['sv']);
    });

    it('should require opt in for language detection', function () {
      baseMicroformatData.properties.content = ['Det var en gång en liten utter som hette Skog. Något ironiskt så för skog var allt annat än det som fanns kvar efter att Skog haft sin framfart i sitt grannskap. Varenda liten plätt var kal som åker. Men Skog var inte ledsen för det. Han hade ju trots allt sig själv.'];
      return formatter.preFormat(baseMicroformatData)
        .should.eventually
        .not.have.deep.property('properties.lang');
    });

    it('should not require a whitelist for language detection', function () {
      baseMicroformatData.properties.content = ['Du hast mich einen käse mit orangen saft gekaufen.'];

      formatter = new Formatter({
        deriveLanguages: true
      });

      return formatter.preFormat(baseMicroformatData)
        .should.eventually
        .have.deep.property('properties.lang')
        .that.deep.equals(['de']);
    });

    it('should handle undetectable language', function () {
      baseMicroformatData.properties.content = ['Nope'];

      formatter = new Formatter({
        deriveLanguages: true
      });

      return formatter.preFormat(baseMicroformatData)
        .should.eventually
        .not.have.deep.property('properties.lang');
    });

    it('should respect defined language, but convert to ISO 639-1', function () {
      baseMicroformatData.properties.content = ['Det var en gång en liten utter som hette Skog. Något ironiskt så för skog var allt annat än det som fanns kvar efter att Skog haft sin framfart i sitt grannskap. Varenda liten plätt var kal som åker. Men Skog var inte ledsen för det. Han hade ju trots allt sig själv.'];
      baseMicroformatData.properties.lang = ['eng'];

      formatter = new Formatter({
        deriveLanguages: ['eng', 'swe']
      });

      return formatter.preFormat(baseMicroformatData)
        .should.eventually
        .have.deep.property('properties.lang')
        .that.deep.equals(['en']);
    });

    it('should respect unknown languages', function () {
      baseMicroformatData.properties.lang = ['123'];
      return formatter.preFormat(baseMicroformatData)
        .should.eventually
        .have.deep.property('properties.lang')
        .that.deep.equals(['123']);
    });

    it('should derive english language from HTML content', function () {
      baseMicroformatData.properties.content = [{html: 'Another evening at the cottage and Bob was feeling brave. Make some food by himself? Surely, how hard could it be. But as the night went on and the dinner cooked Bob grew ever more desperate. Pepper, salt – all these crazy names of things he had never heard before. It would be a long night for poor Mr Bob.'}];

      formatter = new Formatter({
        deriveLanguages: ['eng', 'swe']
      });

      return formatter.preFormat(baseMicroformatData)
        .should.eventually
        .have.deep.property('properties.lang')
        .that.deep.equals(['en']);
    });
  });
});
