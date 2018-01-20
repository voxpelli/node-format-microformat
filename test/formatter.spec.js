'use strict';

const chai = require('chai');
const chaiAsPromised = require('chai-as-promised');

chai.use(chaiAsPromised);
chai.should();

describe('Formatter', function () {
  const Formatter = require('../');
  const getFixtures = require('./fixtures');

  let formatter;
  let baseMicroformatData;

  beforeEach(function () {
    const fixtures = getFixtures();

    formatter = new Formatter();
    baseMicroformatData = fixtures.baseMicroformatData;
  });

  describe('format', function () {
    it('should return a fully formatted page on sunny day content', function () {
      return formatter.format(baseMicroformatData).should.eventually.equal(
        '---\n' +
        'layout: micropubpost\n' +
        'date: \'2015-06-30T14:34:01.000Z\'\n' +
        'title: awesomeness is awesome\n' +
        'slug: awesomeness-is-awesome\n' +
        '---\n' +
        'hello world\n'
      );
    });

    it('should handle non-existing title', function () {
      delete baseMicroformatData.properties.name;

      return formatter.format(baseMicroformatData).should.eventually.equal(
        '---\n' +
        'layout: micropubpost\n' +
        'date: \'2015-06-30T14:34:01.000Z\'\n' +
        'title: \'\'\n' +
        'slug: awesomeness-is-awesome\n' +
        '---\n' +
        'hello world\n'
      );
    });

    it('should handle non-existing content', function () {
      delete baseMicroformatData.properties.content;

      return formatter.format(baseMicroformatData).should.eventually.equal(
        '---\n' +
        'layout: micropubpost\n' +
        'date: \'2015-06-30T14:34:01.000Z\'\n' +
        'title: awesomeness is awesome\n' +
        'slug: awesomeness-is-awesome\n' +
        '---\n'
      );
    });

    it('should handle categories', function () {
      baseMicroformatData.properties.category = ['foo', 'bar'];

      return formatter.format(baseMicroformatData).should.eventually.equal(
        '---\n' +
        'layout: micropubpost\n' +
        'date: \'2015-06-30T14:34:01.000Z\'\n' +
        'title: awesomeness is awesome\n' +
        'slug: awesomeness-is-awesome\n' +
        'tags: foo bar\n' +
        '---\n' +
        'hello world\n'
      );
    });

    it('should handle language', function () {
      baseMicroformatData.properties.lang = ['en'];

      return formatter.format(baseMicroformatData).should.eventually.equal(
        '---\n' +
        'layout: micropubpost\n' +
        'date: \'2015-06-30T14:34:01.000Z\'\n' +
        'title: awesomeness is awesome\n' +
        'slug: awesomeness-is-awesome\n' +
        'lang: en\n' +
        '---\n' +
        'hello world\n'
      );
    });

    it('should handle additional microformat content', function () {
      baseMicroformatData.properties.foo = ['bar'];

      return formatter.format(baseMicroformatData).should.eventually.equal(
        '---\n' +
        'layout: micropubpost\n' +
        'date: \'2015-06-30T14:34:01.000Z\'\n' +
        'title: awesomeness is awesome\n' +
        'slug: awesomeness-is-awesome\n' +
        'mf-foo:\n' +
        '  - bar\n' +
        '---\n' +
        'hello world\n'
      );
    });

    it('should ignore urls', function () {
      // TODO: We might want to eventually change this and actually expose the URL to Jekyll as the prefered permalink
      //      But when doing so we should also treat the URL as a unique identifier and make sure to replace any
      //      previous file that might have that same explicit or implied URL.
      //      For now we don't have any such logic and thus we should simply just ignore this property until it can
      //      be handled better.

      baseMicroformatData.properties.url = ['http://example.com/'];

      return formatter.format(baseMicroformatData).should.eventually.equal(
        '---\n' +
        'layout: micropubpost\n' +
        'date: \'2015-06-30T14:34:01.000Z\'\n' +
        'title: awesomeness is awesome\n' +
        'slug: awesomeness-is-awesome\n' +
        '---\n' +
        'hello world\n'
      );
    });

    it('should handle a "like" document', function () {
      delete baseMicroformatData.properties.name;
      delete baseMicroformatData.properties.content;
      baseMicroformatData.properties.slug = [];
      baseMicroformatData.properties['like-of'] = ['http://example.com/liked/page'];

      return formatter.format(baseMicroformatData).should.eventually.equal(
        '---\n' +
        'layout: micropubpost\n' +
        'date: \'2015-06-30T14:34:01.000Z\'\n' +
        'title: \'\'\n' +
        'mf-like-of:\n' +
        '  - \'http://example.com/liked/page\'\n' +
        '---\n'
      );
    });

    it('should handle derived, real, categories', function () {
      baseMicroformatData.derived = { category: 'interaction' };

      return formatter.format(baseMicroformatData).should.eventually.equal(
        '---\n' +
        'layout: micropubpost\n' +
        'date: \'2015-06-30T14:34:01.000Z\'\n' +
        'title: awesomeness is awesome\n' +
        'slug: awesomeness-is-awesome\n' +
        'category: interaction\n' +
        '---\n' +
        'hello world\n'
      );
    });

    it('should handle derived layout', function () {
      baseMicroformatData.derived = { layout: 'epiclayout' };

      return formatter.format(baseMicroformatData).should.eventually.equal(
        '---\n' +
        'layout: epiclayout\n' +
        'date: \'2015-06-30T14:34:01.000Z\'\n' +
        'title: awesomeness is awesome\n' +
        'slug: awesomeness-is-awesome\n' +
        '---\n' +
        'hello world\n'
      );
    });

    it('should handle disabled layout', function () {
      baseMicroformatData.derived = { layout: false };

      return formatter.format(baseMicroformatData).should.eventually.equal(
        '---\n' +
        'date: \'2015-06-30T14:34:01.000Z\'\n' +
        'title: awesomeness is awesome\n' +
        'slug: awesomeness-is-awesome\n' +
        '---\n' +
        'hello world\n'
      );
    });

    it('should handle derived person-tags', function () {
      baseMicroformatData.derived = { personTags: ['http://example.com/'] };

      return formatter.format(baseMicroformatData).should.eventually.equal(
        '---\n' +
        'layout: micropubpost\n' +
        'date: \'2015-06-30T14:34:01.000Z\'\n' +
        'title: awesomeness is awesome\n' +
        'slug: awesomeness-is-awesome\n' +
        'persontags:\n' +
        '  - \'http://example.com/\'\n' +
        '---\n' +
        'hello world\n'
      );
    });

    it('should convert HTML to Markdown', function () {
      baseMicroformatData.properties.content = [{ html: '<p>Abc</p><p>123</p><ul><li>Foo</li><li>Bar</li></ul>' }];
      return formatter.format(baseMicroformatData).should.eventually.equal(
        '---\n' +
        'layout: micropubpost\n' +
        'date: \'2015-06-30T14:34:01.000Z\'\n' +
        'title: awesomeness is awesome\n' +
        'slug: awesomeness-is-awesome\n' +
        '---\n' +
        'Abc\n' +
        '\n' +
        '123\n' +
        '\n' +
        '* Foo\n' +
        '* Bar\n'
      );
    });

    it('should not convert HTML to Markdown if opted out', function () {
      baseMicroformatData.properties.content = [{ html: '<p>Abc</p><p>123</p><ul><li>Foo</li><li>Bar</li></ul>' }];

      formatter = new Formatter({ noMarkdown: true });

      return formatter.format(baseMicroformatData).should.eventually.equal(
        '---\n' +
        'layout: micropubpost\n' +
        'date: \'2015-06-30T14:34:01.000Z\'\n' +
        'title: awesomeness is awesome\n' +
        'slug: awesomeness-is-awesome\n' +
        '---\n' +
        '<p>Abc</p><p>123</p><ul><li>Foo</li><li>Bar</li></ul>\n'
      );
    });

    it('should escape HTML if sent as plain text', function () {
      baseMicroformatData.properties.content = ['<p>Abc</p><p>123</p><ul><li>Foo</li><li>Bar</li></ul>'];
      return formatter.format(baseMicroformatData).should.eventually.equal(
        '---\n' +
        'layout: micropubpost\n' +
        'date: \'2015-06-30T14:34:01.000Z\'\n' +
        'title: awesomeness is awesome\n' +
        'slug: awesomeness-is-awesome\n' +
        '---\n' +
        '&lt;p&gt;Abc&lt;/p&gt;&lt;p&gt;123&lt;/p&gt;&lt;ul&gt;&lt;li&gt;Foo&lt;/li&gt;&lt;li&gt;Bar&lt;/li&gt;&lt;/ul&gt;\n'
      );
    });

    it('should support content.value', function () {
      baseMicroformatData.properties.content = [
        { html: '<p>Abc</p><p>123</p><ul><li>Foo</li><li>Bar</li></ul>' },
        { value: '<p>Abc</p><p>123</p><ul><li>Foo</li><li>Bar</li></ul>' }
      ];
      return formatter.format(baseMicroformatData).should.eventually.equal(
        '---\n' +
        'layout: micropubpost\n' +
        'date: \'2015-06-30T14:34:01.000Z\'\n' +
        'title: awesomeness is awesome\n' +
        'slug: awesomeness-is-awesome\n' +
        '---\n' +
        'Abc\n' +
        '\n' +
        '123\n' +
        '\n' +
        '* Foo\n' +
        '* Bar\n' +
        '&lt;p&gt;Abc&lt;/p&gt;&lt;p&gt;123&lt;/p&gt;&lt;ul&gt;&lt;li&gt;Foo&lt;/li&gt;&lt;li&gt;Bar&lt;/li&gt;&lt;/ul&gt;\n'
      );
    });
  });
});
