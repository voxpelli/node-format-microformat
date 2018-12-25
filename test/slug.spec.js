'use strict';

const chai = require('chai');
const chaiAsPromised = require('chai-as-promised');

chai.use(chaiAsPromised);
chai.should();

describe('Slug', function () {
  const Formatter = require('../');
  const getFixtures = require('./fixtures');

  let formatter;
  let baseMicroformatData;

  beforeEach(function () {
    const fixtures = getFixtures();

    formatter = new Formatter();
    baseMicroformatData = fixtures.baseMicroformatData;
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
      formatter = new Formatter({ contentSlug: true });
      formatter._formatSlug(baseMicroformatData).should.equal('hello-world');
    });

    it('should ignore html-tags when basing slug on content', function () {
      delete baseMicroformatData.properties.name;
      baseMicroformatData.properties.content = [{ html: '<h1>Foo</h1> Bar &amp; <strong>Abc</strong>' }];
      formatter = new Formatter({ contentSlug: true });
      // Test twice so that we don't get a non-reusable regexp!
      formatter._formatSlug(baseMicroformatData).should.equal('foo-bar-abc');
      formatter._formatSlug(baseMicroformatData).should.equal('foo-bar-abc');
    });

    it('should ultimately fall back to publish time', function () {
      delete baseMicroformatData.properties.name;
      formatter._formatSlug(baseMicroformatData).should.equal('52441');
    });

    it('should limit length of extracted slug', function () {
      baseMicroformatData.properties.name = ['One Two Three Four Five Six Seven'];
      formatter._formatSlug(baseMicroformatData).should.equal('one-two-three-four-five');

      baseMicroformatData.properties.content = baseMicroformatData.properties.name;
      delete baseMicroformatData.properties.name;
      formatter = new Formatter({ contentSlug: true });
      formatter._formatSlug(baseMicroformatData).should.equal('one-two-three-four-five');
    });

    it('should properly format abbreviations', function () {
      baseMicroformatData.properties.name = ['Another CSS-feature is the FooBar'];
      formatter._formatSlug(baseMicroformatData).should.equal('another-css-feature-is-the-foo-bar');
    });

    it('should properly handle swedish chars', function () {
      baseMicroformatData.properties.name = ['ÖverÄnda på Slottet'];
      formatter._formatSlug(baseMicroformatData).should.equal('over-anda-pa-slottet');
    });

    it('should ensure slug doesnt start or end with a dash', function () {
      delete baseMicroformatData.properties.name;
      baseMicroformatData.properties.content = [',One Two Three Four Five, Six Seven'];
      formatter = new Formatter({ contentSlug: true });
      formatter._formatSlug(baseMicroformatData).should.equal('one-two-three-four-five');
    });
  });
});
