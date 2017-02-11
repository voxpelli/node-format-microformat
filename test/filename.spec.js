'use strict';

const chai = require('chai');
const chaiAsPromised = require('chai-as-promised');

chai.use(chaiAsPromised);
chai.should();

describe('Filename', function () {
  const Formatter = require('../');
  const getFixtures = require('./fixtures');

  let formatter;
  let baseMicroformatData;

  beforeEach(function () {
    const fixtures = getFixtures();

    formatter = new Formatter();
    baseMicroformatData = fixtures.baseMicroformatData;
  });

  describe('formatFilename', function () {
    it('should use slug', function () {
      return formatter.formatFilename(baseMicroformatData).should.eventually.equal('_posts/2015-06-30-awesomeness-is-awesome.md');
    });

    it('should have a HTML file type if opted out of Markdown', function () {
      formatter = new Formatter({ noMarkdown: true });
      return formatter.formatFilename(baseMicroformatData).should.eventually.equal('_posts/2015-06-30-awesomeness-is-awesome.html');
    });
  });
});
