'use strict';

module.exports = function () {
  const baseMicroformatData = {
    'type': ['h-entry'],
    'properties': {
      'content': ['hello world'],
      'name': ['awesomeness is awesome'],
      'slug': ['awesomeness-is-awesome'],
      'published': [new Date(1435674841000)]
    }
  };

  return {
    baseMicroformatData
  };
};
