'use strict';

const chai = require('chai');
const chaiAsPromised = require('chai-as-promised');
const sinon = require('sinon');
const sinonChai = require('sinon-chai');

chai.use(chaiAsPromised);
chai.use(sinonChai);
chai.should();

describe('URL', function () {
  const Formatter = require('../');
  const getFixtures = require('./fixtures');

  let formatter;
  let baseMicroformatData;
  let sandbox;

  beforeEach(function () {
    const fixtures = getFixtures();

    formatter = new Formatter({
      permalinkStyle: '/:categories/:year/:month/:title/'
    });
    baseMicroformatData = fixtures.baseMicroformatData;
    sandbox = sinon.sandbox.create();
  });

  afterEach(function () {
    sandbox.restore();
  });

  describe('formatURL', function () {
    it('should base URL on slug', function () {
      return formatter.formatURL(baseMicroformatData).should.eventually.equal('2015/06/awesomeness-is-awesome/');
    });

    it('should support undefined permalink style', function () {
      formatter = new Formatter();
      return formatter.formatURL(baseMicroformatData).should.eventually.equal('2015/06/30/awesomeness-is-awesome.html');
    });

    it('should return absolute URL when requested', function () {
      formatter = new Formatter('http://example.com/foo/');
      return formatter.formatURL(baseMicroformatData).should.eventually.equal('http://example.com/foo/2015/06/30/awesomeness-is-awesome.html');
    });

    it('should include derived category if any', function () {
      baseMicroformatData.derived = { category: 'interaction' };
      return formatter.formatURL(baseMicroformatData).should.eventually.equal('interaction/2015/06/awesomeness-is-awesome/');
    });

    it('should support name in permalink style', function () {
      formatter = new Formatter({
        permalinkStyle: '/:name'
      });
      return formatter.formatURL(baseMicroformatData).should.eventually.equal('2015-06-30-awesomeness-is-awesome');
    });

    it('should support custom permalink style through callback', function () {
      const permalinkStyle = sinon.stub().returns('/:name');

      formatter = new Formatter({ permalinkStyle });

      return formatter.formatURL(baseMicroformatData).should.eventually.equal('2015-06-30-awesomeness-is-awesome');
    });

    it('should support custom permalink style through callback returning Promise', function () {
      const permalinkStyle = sinon.stub().resolves('/:name');

      formatter = new Formatter({ permalinkStyle });

      return formatter.formatURL(baseMicroformatData).should.eventually.equal('2015-06-30-awesomeness-is-awesome');
    });
  });
});
