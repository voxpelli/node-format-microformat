'use strict';

const chai = require('chai');
const chaiAsPromised = require('chai-as-promised');
const sinon = require('sinon');
const sinonChai = require('sinon-chai');

chai.use(chaiAsPromised);
chai.use(sinonChai);
chai.should();

describe('Filename', () => {
  const Formatter = require('../');
  const getFixtures = require('./fixtures');

  let formatter;
  let baseMicroformatData;
  let sandbox;

  beforeEach(() => {
    const fixtures = getFixtures();

    formatter = new Formatter();
    baseMicroformatData = fixtures.baseMicroformatData;
    sandbox = sinon.sandbox.create();
  });

  afterEach(() => {
    sandbox.restore();
  });

  describe('formatFilename', () => {
    it('should use slug', () => {
      return formatter.formatFilename(baseMicroformatData).should.eventually.equal('_posts/2015-06-30-awesomeness-is-awesome.md');
    });

    it('should have a HTML file type if opted out of Markdown', () => {
      formatter = new Formatter({ noMarkdown: true });
      return formatter.formatFilename(baseMicroformatData).should.eventually.equal('_posts/2015-06-30-awesomeness-is-awesome.html');
    });

    it('should support custom filename style', () => {
      formatter = new Formatter({
        filenameStyle: 'content/notes/:year/:month/:slug'
      });
      return formatter.formatFilename(baseMicroformatData).should.eventually.equal('content/notes/2015/06/awesomeness-is-awesome.md');
    });

    it('should support custom filename style through callback', () => {
      const filenameStyle = sinon.stub().returns('content/notes/:year/:month/:slug');

      formatter = new Formatter({ filenameStyle });

      return formatter.formatFilename(baseMicroformatData).should.eventually.equal('content/notes/2015/06/awesomeness-is-awesome.md')
        .then(() => {
          filenameStyle.should.have.been.called;
        });
    });

    it('should support custom filename style through callback returning Promise', () => {
      const filenameStyle = sinon.stub().resolves('content/notes/:year/:month/:slug');

      formatter = new Formatter({ filenameStyle });

      return formatter.formatFilename(baseMicroformatData).should.eventually.equal('content/notes/2015/06/awesomeness-is-awesome.md');
    });
  });
});
