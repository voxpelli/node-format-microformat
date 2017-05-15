'use strict';

const chai = require('chai');
const chaiAsPromised = require('chai-as-promised');
const sinon = require('sinon');
const sinonChai = require('sinon-chai');

chai.use(chaiAsPromised);
chai.use(sinonChai);
chai.should();

describe('Files', function () {
  const Formatter = require('../');
  const getFixtures = require('./fixtures');

  let formatter;
  let baseMicroformatData;
  let sandbox;

  beforeEach(function () {
    const fixtures = getFixtures();

    formatter = new Formatter();
    baseMicroformatData = fixtures.baseMicroformatData;
    sandbox = sinon.sandbox.create();
  });

  afterEach(function () {
    sandbox.restore();
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
      const bufferFoo = Buffer.from('sampledata');

      baseMicroformatData.files = {
        photo: [
          { filename: 'foo.jpg', buffer: bufferFoo },
          { filename: 'bar.png', buffer: Buffer.from('sampledata') }
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
            buffer: Buffer.from('sampledata')
          },
          {
            filename: 'media/2015-06-awesomeness-is-awesome/bar.png',
            buffer: Buffer.from('sampledata')
          }
        ])
        .and.has.deep.property('[0].buffer', bufferFoo);
    });

    it('should format file URL:s correctly', function () {
      baseMicroformatData.files = {
        photo: [{ filename: 'foo.jpg', buffer: Buffer.from('sampledata') }],
        video: [{ filename: 'foo.mp4', buffer: Buffer.from('sampledata') }],
        audio: [{ filename: 'foo.mp3', buffer: Buffer.from('sampledata') }]
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
        audio: [{ filename: 'foo.mp3', buffer: Buffer.from('sampledata') }]
      };

      return formatter._preFormatFiles(baseMicroformatData)
        .should.eventually
        .have.deep.property('properties.audio')
        .that.deep.equals(['http://example.com/bar/media/2015-06-awesomeness-is-awesome/foo.mp3']);
    });

    it('should honor any pre-existing URL:s', function () {
      baseMicroformatData.properties.audio = ['http://example.com/pre-existing/url'];
      baseMicroformatData.files = {
        audio: [{ filename: 'foo.mp3', buffer: Buffer.from('sampledata') }]
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
        photo: [{ filename: 'bar.png', buffer: Buffer.from('sampledata') }]
      };

      return formatter._preFormatFiles(baseMicroformatData)
        .should.eventually
        .have.property('files')
        .that.deep.equals([
          {
            filename: 'files/2015/06/awesomeness-is-awesome/bar.png',
            buffer: Buffer.from('sampledata')
          }
        ]);
    });

    it('should support configurable files styles through callback', function () {
      const filesStyle = sinon.stub().returns('files/:year/:month/:slug/:filesslug');

      formatter = new Formatter({ filesStyle });

      baseMicroformatData.files = {
        photo: [{ filename: 'bar.png', buffer: Buffer.from('sampledata') }]
      };

      return formatter._preFormatFiles(baseMicroformatData)
        .should.eventually
        .have.property('files')
        .that.deep.equals([
          {
            filename: 'files/2015/06/awesomeness-is-awesome/bar.png',
            buffer: Buffer.from('sampledata')
          }
        ])
        .then(() => {
          filesStyle.should.have.been.called;
        });
    });

    it('should support configurable files styles through callback returning Promise', function () {
      const filesStyle = sinon.stub().resolves('files/:year/:month/:slug/:filesslug');

      formatter = new Formatter({ filesStyle });

      baseMicroformatData.files = {
        photo: [{ filename: 'bar.png', buffer: Buffer.from('sampledata') }]
      };

      return formatter._preFormatFiles(baseMicroformatData)
        .should.eventually
        .have.property('files')
        .that.deep.equals([
          {
            filename: 'files/2015/06/awesomeness-is-awesome/bar.png',
            buffer: Buffer.from('sampledata')
          }
        ]);
    });
  });
});
