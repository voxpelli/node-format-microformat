'use strict';

const chai = require('chai');
const chaiAsPromised = require('chai-as-promised');

chai.use(chaiAsPromised);
chai.should();

describe('Files', function () {
  const Formatter = require('../');
  const getFixtures = require('./fixtures');

  let formatter;
  let baseMicroformatData;

  beforeEach(function () {
    const fixtures = getFixtures();

    formatter = new Formatter();
    baseMicroformatData = fixtures.baseMicroformatData;
  });

  describe('_formatFilesSlug', function () {
    it('should handle a regular filename', function () {
      formatter._formatFilesSlug('photo', { filename: 'example.jpg' }).should.equal('example.jpg');
    });

    it('should handle a complex filename', function () {
      formatter._formatFilesSlug('photo', { filename: '123.ExampleIs Very-Cool.jpg' }).should.equal('123.example-is-very-cool.jpg');
    });
  });

  describe('_preFormatFiles', function () {
    it('should format files correctly', function () {
      const bufferFoo = new Buffer('sampledata');

      baseMicroformatData.files = {
        photo: [
          { filename: 'foo.jpg', buffer: bufferFoo },
          { filename: 'bar.png', buffer: new Buffer('sampledata') }
        ]
      };

      return formatter._preFormatFiles(baseMicroformatData)
        .should.eventually
        .have.property('files')
        .that.is.an('array')
        .of.length(2)
        .that.deep.equals([
          {
            filename: 'media/2015-06-awesomeness-is-awesome/foo.jpg',
            buffer: new Buffer('sampledata')
          },
          {
            filename: 'media/2015-06-awesomeness-is-awesome/bar.png',
            buffer: new Buffer('sampledata')
          }
        ])
        .and.has.deep.property('[0].buffer', bufferFoo);
    });

    it('should format file URL:s correctly', function () {
      baseMicroformatData.files = {
        photo: [{ filename: 'foo.jpg', buffer: new Buffer('sampledata') }],
        video: [{ filename: 'foo.mp4', buffer: new Buffer('sampledata') }],
        audio: [{ filename: 'foo.mp3', buffer: new Buffer('sampledata') }]
      };

      return formatter._preFormatFiles(baseMicroformatData)
        .should.eventually
        .have.property('properties')
        .that.contains.all.keys('photo', 'video', 'audio')
        .and.have.property('video')
        .that.deep.equals(['media/2015-06-awesomeness-is-awesome/foo.mp4']);
    });

    it('should make file URL:s absolute if relativeTo is defined', function () {
      formatter = new Formatter('http://example.com/bar/');

      baseMicroformatData.files = {
        audio: [{ filename: 'foo.mp3', buffer: new Buffer('sampledata') }]
      };

      return formatter._preFormatFiles(baseMicroformatData)
        .should.eventually
        .have.deep.property('properties.audio')
        .that.deep.equals(['http://example.com/bar/media/2015-06-awesomeness-is-awesome/foo.mp3']);
    });

    it('should honor any pre-existing URL:s', function () {
      baseMicroformatData.properties.audio = ['http://example.com/pre-existing/url'];
      baseMicroformatData.files = {
        audio: [{ filename: 'foo.mp3', buffer: new Buffer('sampledata') }]
      };

      return formatter._preFormatFiles(baseMicroformatData)
        .should.eventually
        .have.deep.property('properties.audio')
        .that.deep.equals([
          'http://example.com/pre-existing/url',
          'media/2015-06-awesomeness-is-awesome/foo.mp3'
        ]);
    });

    it('should support configurable files styles', function () {
      formatter = new Formatter({
        filesStyle: 'files/:year/:month/:slug/:filesslug'
      });

      baseMicroformatData.files = {
        photo: [{ filename: 'bar.png', buffer: new Buffer('sampledata') }]
      };

      return formatter._preFormatFiles(baseMicroformatData)
        .should.eventually
        .have.property('files')
        .that.deep.equals([
          {
            filename: 'files/2015/06/awesomeness-is-awesome/bar.png',
            buffer: new Buffer('sampledata')
          }
        ]);
    });
  });
});
