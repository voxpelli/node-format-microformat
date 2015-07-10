/* jshint node: true */
/* global beforeEach, afterEach, describe, it */

'use strict';

var chai = require('chai');
var chaiAsPromised = require('chai-as-promised');
var sinon = require('sinon');

chai.use(chaiAsPromised);

// var should = chai.should();
chai.should();

describe('Formatter', function () {
  var Formatter = require('../');
  var formatter;
  var baseMicroformatData;
  var clock;

  beforeEach(function () {
    clock = sinon.useFakeTimers(1435674000000);

    formatter = new Formatter();
    baseMicroformatData = {
      'type': ['h-entry'],
      'properties': {
        'content': ['hello world'],
        'name': ['awesomeness is awesome'],
        'slug': ['awesomeness-is-awesome'],
        'published': [new Date(1435674841000)],
      },
    };
  });

  afterEach(function () {
    clock.restore();
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
        'title: null\n' +
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

    it('should handle a "like" document', function () {
      delete baseMicroformatData.properties.name;
      delete baseMicroformatData.properties.content;
      baseMicroformatData.properties.slug = [];
      baseMicroformatData.properties['like-of'] = ['http://example.com/liked/page'];

      return formatter.format(baseMicroformatData).should.eventually.equal(
        '---\n' +
        'layout: micropubpost\n' +
        'date: \'2015-06-30T14:34:01.000Z\'\n' +
        'title: null\n' +
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

  });

  describe('_formatSlug', function () {

    beforeEach(function () {
      delete baseMicroformatData.properties.slug;
    });

    it('should base slug on title', function () {
      formatter._formatSlug(baseMicroformatData).should.equal('awesomeness-is-awesome');
    });

    it('should fall back to base slug on content', function () {
      delete baseMicroformatData.properties.name;
      formatter._formatSlug(baseMicroformatData).should.equal('hello-world');
    });

    it('should ignore html-tags when basing slug on content', function () {
      delete baseMicroformatData.properties.name;
      baseMicroformatData.properties.content = ['<h1>Foo</h1> Bar &amp; <strong>Abc</strong>'];
      // Test twice so that we don't get a non-reusable regexp!
      formatter._formatSlug(baseMicroformatData).should.equal('foo-bar-abc');
      formatter._formatSlug(baseMicroformatData).should.equal('foo-bar-abc');
    });

    it('should ulimately fall back to publish time', function () {
      delete baseMicroformatData.properties.name;
      delete baseMicroformatData.properties.content;
      formatter._formatSlug(baseMicroformatData).should.equal('52441');
    });

    it('should limit length of extracted slug', function () {
      baseMicroformatData.properties.name = ['One Two Three Four Five Six Seven'];
      formatter._formatSlug(baseMicroformatData).should.equal('one-two-three-four-five');

      baseMicroformatData.properties.content = baseMicroformatData.properties.name;
      delete baseMicroformatData.properties.name;
      formatter._formatSlug(baseMicroformatData).should.equal('one-two-three-four-five');
    });

  });

  describe('formatFilename', function () {

    it('should use slug', function () {
      return formatter.formatFilename(baseMicroformatData).should.eventually.equal('_posts/2015-06-30-awesomeness-is-awesome.html');
    });

  });

  describe('formatURL', function () {

    it('should base URL on slug', function () {
      return formatter.formatURL(baseMicroformatData).should.eventually.equal('2015/06/awesomeness-is-awesome/');
    });

    it('should return absolute URL when requested', function () {
      return formatter.formatURL(baseMicroformatData, 'http://example.com/foo/').should.eventually.equal('http://example.com/foo/2015/06/awesomeness-is-awesome/');
    });

    it('should include derived category if any', function () {
      baseMicroformatData.derived = { category: 'interaction' };
      return formatter.formatURL(baseMicroformatData).should.eventually.equal('interaction/2015/06/awesomeness-is-awesome/');
    });

  });

  describe('preFormat', function () {

    it('should add published', function () {
      delete baseMicroformatData.properties.published;
      return formatter.preFormat(baseMicroformatData).should.eventually.have.deep.property('properties.published[0]').that.is.an.instanceOf(Date).and.eql(new Date());
    });

    it('should ensure slug', function () {
      delete baseMicroformatData.properties.slug;
      return formatter.preFormat(baseMicroformatData).should.eventually.have.deep.property('properties.slug[0]', 'awesomeness-is-awesome');
    });

    it('should derive interaction category for replies', function () {
      baseMicroformatData.properties['in-reply-to'] = ['http://example.com/replied/to/page'];
      return formatter.preFormat(baseMicroformatData).should.eventually.have.deep.property('derived.category', 'interaction');
    });

    it('should derive interaction category for likes', function () {
      baseMicroformatData.properties['like-of'] = ['http://example.com/liked/page'];
      return formatter.preFormat(baseMicroformatData).should.eventually.have.deep.property('derived.category', 'interaction');
    });

    it('should derive bookmark category for bookmarks', function () {
      baseMicroformatData.properties.bookmark = ['http://example.com/bookmarked/page'];
      return formatter.preFormat(baseMicroformatData).should.eventually.have.deep.property('derived.category', 'bookmark');
    });

    it('should not derive interaction category for normal post', function () {
      return formatter.preFormat(baseMicroformatData).should.eventually.not.have.deep.property('derived.category');
    });

  });

});
