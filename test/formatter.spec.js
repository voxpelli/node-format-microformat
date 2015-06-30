/* jshint node: true */
/* global beforeEach, describe, it */

'use strict';

var chai = require('chai');
var chaiAsPromised = require('chai-as-promised');

chai.use(chaiAsPromised);

// var should = chai.should();
chai.should();

describe('Formatter', function () {
  var Formatter = require('../');
  var formatter;
  var baseMicroformatData;

  beforeEach(function () {
    formatter = new Formatter();
    baseMicroformatData = {
      'type': ['h-entry'],
      'properties': {
        'content': ['hello world'],
        'name': ['awesomeness is awesome'],
        'published': [new Date(1435674841000)],
      },
    };
  });

  describe('format', function () {

    it('should return a fully formatted page on sunny day content', function () {
      return formatter.format(baseMicroformatData).should.eventually.equal(
        '---\n' +
        'layout: post\n' +
        'date: \'2015-06-30T14:34:01.000Z\'\n' +
        'title: awesomeness is awesome\n' +
        '---\n' +
        'hello world\n'
      );
    });

    it('should handle non-existing title', function () {
      delete baseMicroformatData.properties.name;

      return formatter.format(baseMicroformatData).should.eventually.equal(
        '---\n' +
        'layout: post\n' +
        'date: \'2015-06-30T14:34:01.000Z\'\n' +
        '---\n' +
        'hello world\n'
      );
    });

    it('should handle non-existing content', function () {
      delete baseMicroformatData.properties.content;

      return formatter.format(baseMicroformatData).should.eventually.equal(
        '---\n' +
        'layout: post\n' +
        'date: \'2015-06-30T14:34:01.000Z\'\n' +
        'title: awesomeness is awesome\n' +
        '---\n'
      );
    });

    it('should handle categories', function () {
      baseMicroformatData.properties.category = ['foo', 'bar'];

      return formatter.format(baseMicroformatData).should.eventually.equal(
        '---\n' +
        'layout: post\n' +
        'date: \'2015-06-30T14:34:01.000Z\'\n' +
        'title: awesomeness is awesome\n' +
        'categories: foo bar\n' +
        '---\n' +
        'hello world\n'
      );
    });

  });

  describe('formatFilename', function () {

    it('should base file name on title', function () {
      return formatter.formatFilename(baseMicroformatData).should.eventually.equal('_posts/2015-06-30-awesomeness-is-awesome.html');
    });

    it('should fall back on content', function () {
      delete baseMicroformatData.properties.name;
      return formatter.formatFilename(baseMicroformatData).should.eventually.equal('_posts/2015-06-30-hello-world.html');
    });

    it('should ulimately fallback to just date', function () {
      delete baseMicroformatData.properties.name;
      delete baseMicroformatData.properties.content;
      return formatter.formatFilename(baseMicroformatData).should.eventually.equal('_posts/2015-06-30.html');
    });

  });

  describe('formatURL', function () {

    it('should base URL on name', function () {
      return formatter.formatURL(baseMicroformatData).should.eventually.equal('2015/06/awesomeness-is-awesome/');
    });

    it('should return absolute URL when requested', function () {
      return formatter.formatURL(baseMicroformatData, 'http://example.com/foo/').should.eventually.equal('http://example.com/foo/2015/06/awesomeness-is-awesome/');
    });

  });
});
