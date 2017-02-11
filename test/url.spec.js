'use strict';

const chai = require('chai');
const chaiAsPromised = require('chai-as-promised');

chai.use(chaiAsPromised);
chai.should();

describe('URL', function () {
  const Formatter = require('../');
  const getFixtures = require('./fixtures');

  let formatter;
  let baseMicroformatData;

  beforeEach(function () {
    const fixtures = getFixtures();

    formatter = new Formatter({
      permalinkStyle: '/:categories/:year/:month/:title/'
    });
    baseMicroformatData = fixtures.baseMicroformatData;
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
  });
});
