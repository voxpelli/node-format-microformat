'use strict';

const chai = require('chai');
const chaiAsPromised = require('chai-as-promised');

chai.use(chaiAsPromised);
chai.should();

describe('FormatAll', function () {
  const Formatter = require('../');
  const getFixtures = require('./fixtures');

  let formatter;
  let baseMicroformatData;

  beforeEach(function () {
    const fixtures = getFixtures();

    formatter = new Formatter();
    baseMicroformatData = fixtures.baseMicroformatData;
  });

  describe('formatAll', function () {
    it('should format everything correctly', function () {
      const photoBuffer = Buffer.from('sampledata');

      baseMicroformatData.files = {
        photo: [
          {
            filename: 'bar.png',
            buffer: photoBuffer
          }
        ]
      };

      formatter = new Formatter({
        relativeTo: 'http://example.com/bar/',
        permalinkStyle: '/:categories/:year/:month/:title/'
      });

      return formatter.formatAll(baseMicroformatData, 'http://example.com/bar/')
        .should.eventually
        .have.all.keys('filename', 'url', 'content', 'files', 'raw')
        .that.deep.equals({
          filename: '_posts/2015-06-30-awesomeness-is-awesome.md',
          url: 'http://example.com/bar/2015/06/awesomeness-is-awesome/',
          content: '---\n' +
            'layout: micropubpost\n' +
            'date: \'2015-06-30T14:34:01.000Z\'\n' +
            'title: awesomeness is awesome\n' +
            'slug: awesomeness-is-awesome\n' +
            'mf-photo:\n' +
            '  - \'http://example.com/bar/media/2015-06-awesomeness-is-awesome/bar.png\'\n' +
            '---\n' +
            'hello world\n',
          files: [{
            filename: 'media/2015-06-awesomeness-is-awesome/bar.png',
            buffer: photoBuffer
          }],
          raw: {
            derived: {},
            files: [{
              filename: 'media/2015-06-awesomeness-is-awesome/bar.png',
              buffer: photoBuffer
            }],
            preFormatted: true,
            properties: {
              content: ['hello world'],
              name: ['awesomeness is awesome'],
              photo: ['http://example.com/bar/media/2015-06-awesomeness-is-awesome/bar.png'],
              published: [new Date(1435674841000)],
              slug: ['awesomeness-is-awesome']
            },
            type: ['h-entry']
          }

        });
    });
  });
});
