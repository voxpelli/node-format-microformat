/* jshint node: true */

'use strict';

var _ = require('lodash');
var urlModule = require('url');
var yaml = require('js-yaml');
var strftime = require('strftime');
var ent = require('ent');
var Upndown = require('upndown');

var htmlRegexp = /<[^>]+>/g;
var camelRegexp = /([a-z])([A-Z])/g;
var kebabRegexp = /[^a-z0-9]+/g;

var semiKebabCase = function (name) {
  // Convert camel case to spaces, then ensure everything is lower case and then finally – make kebab
  return _.deburr(name).replace(camelRegexp, '$1 $2').trim().toLowerCase().replace(kebabRegexp, '-');
};

var Formatter = function (options) {
  if (typeof options === 'string') {
    options = { relativeTo: options };
  } else {
    options = _.extend({}, options || {});
  }

  this.relativeTo = options.relativeTo;
  this.markdown = !options.noMarkdown;
};

Formatter.prototype._formatFrontMatter = function (data) {
  var source = data.properties;
  var derived = data.derived || {};

  var target = {
    layout: 'micropubpost',
    date: source.published[0].toISOString(),
    title: null,
  };

  var mapping = {
    name: 'title',
    slug: 'slug',
    category: 'tags',
  };
  var ignore = ['content', 'published', 'url'];

  _.forEach(source, function (value, key) {
    if (!value.length || ignore.indexOf(key) !== -1) { return; }

    if (mapping[key]) {
      target[mapping[key]] = value.join(' ');
    } else {
      target['mf-' + key] = value;
    }
  });

  if (derived.category) {
    target.category = derived.category;
  }

  return '---\n' + yaml.safeDump(target) + '---\n';
};

Formatter.prototype._formatContent = function (data) {
  if (!data.properties.content) {
    return Promise.resolve('');
  } else if (!this.markdown) {
    return Promise.resolve(data.properties.content.join('\n') + '\n');
  }

  var und = new Upndown();

  return new Promise(function (resolve) {
    und.convert(data.properties.content.join('\n'), function (err, markdown) {
      resolve((err ? data.properties.content : markdown) + '\n');
    });
  });
};

Formatter.prototype._formatSlug = function (data) {
  if (data.properties.slug && data.properties.slug[0]) {
    return semiKebabCase(data.properties.slug[0]);
  }

  var name;

  if (data.properties.name) {
    name = data.properties.name[0].trim();
  }
  if (!name && data.properties.content) {
    name = data.properties.content[0].trim();
    name = ent.decode(name.replace(htmlRegexp, ''));
  }

  if (name) {
    name = name.split(/\s+/);
    if (name.length > 5) {
      name = name.slice(0, 5);
    }
    name = name.join(' ');
  } else {
    name = Math.floor(data.properties.published[0].getTime() / 1000) % (24 * 60 * 60) + '';
  }

  return semiKebabCase(name);
};

Formatter.prototype._preFormatFiles = function (data) {
  var that = this;
  var fileResolves = [];

  ['video', 'photo', 'audio'].forEach(function (type) {
    (data.files[type] || []).forEach(function (file) {
      fileResolves.push(Promise.all([
        type,
        file,
        that.formatFilesFilename(type, file, data),
        that.formatFilesURL(type, file, data),
      ]));
    });
  });

  return Promise.all(fileResolves).then(function (files) {
    var newFiles = [];
    _.each(files, function (file) {
      var type = file[0];
      var fileData = file[1];
      var filename = file[2];
      var url = file[3];

      data.properties[type] = data.properties[type] || [];
      data.properties[type].push(url);

      newFiles.push({
        filename: filename,
        buffer: fileData.buffer,
      });
    });

    data.files = newFiles;

    return data;
  });
};

Formatter.prototype.preFormat = function (data) {
  if (data.preFormatted) {
    return Promise.resolve(data);
  }
  data.preFormatted = true;

  data = _.cloneDeep(data, function (value) {
    if (value instanceof Buffer) {
      return value;
    }
  });

  var slug = this._formatSlug(data);

  data.properties.slug = slug ? [slug] : [];
  data.properties.published = [data.properties.published && data.properties.published[0] ? new Date(data.properties.published[0]) : new Date()];

  data.derived = {};

  if (
    !_.isEmpty(data.properties.bookmark) ||
    !_.isEmpty(data.properties['repost-of']) ||
    !_.isEmpty(data.properties['bookmark-of'])
  ) {
    data.derived.category = 'link';
  } else if (
    _.isEmpty(data.properties.name) || // This means it's not an "article", but a "note"
    !_.isEmpty(data.properties['in-reply-to']) ||
    !_.isEmpty(data.properties['like-of'])
  ) {
    data.derived.category = 'social';
  }

  var result = Promise.resolve(data);

  if (!_.isEmpty(data.files)) {
    result = result.then(this._preFormatFiles.bind(this));
  }

  return result;
};

Formatter.prototype.format = function (data) {
  return Promise.all([
    this._formatFrontMatter(data),
    this._formatContent(data),
  ]).then(function (result) {
    return result.join('');
  });
};

Formatter.prototype.formatFilename = function (data) {
  var slug = data.properties.slug[0];

  return Promise.resolve(
    '_posts/' +
    strftime('%Y-%m-%d', data.properties.published[0]) +
    (slug ? '-' + slug : '') +
    (this.markdown ? '.md' : '.html')
  );
};

Formatter.prototype.formatURL = function (data) {
  var derived = data.derived || {};

  var slug = data.properties.slug[0];
  var url = strftime('%Y/%m', data.properties.published[0]) + '/' + (slug ? slug + '/' : '');

  if (derived.category) {
    url = derived.category + '/' + url;
  }

  if (this.relativeTo) {
    url = urlModule.resolve(this.relativeTo, url);
  }

  return Promise.resolve(url);
};

Formatter.prototype._formatFilesSlug = function (type, file) {
  return _.map(file.filename.trim().split('.'), semiKebabCase).join('.');
};

Formatter.prototype.formatFilesFilename = function (type, file, data) {
  var slug = data.properties.slug[0];
  var filename = this._formatFilesSlug(type, file);
  return Promise.resolve('media/' + strftime('%Y-%m', data.properties.published[0])  + (slug ? '-' + slug : '') + '/' + filename);
};

Formatter.prototype.formatFilesURL = function (type, file, data) {
  var that = this;

  return this.formatFilesFilename(type, file, data).then(function (url) {
    if (that.relativeTo) {
      url = urlModule.resolve(that.relativeTo, url);
    }
    return url;
  });
};

Formatter.prototype.formatAll = function (data) {
  var that = this;

  return this.preFormat(data)
    .then(function (formattedData) {
      return Promise.all([
        that.formatFilename(formattedData),
        that.formatURL(formattedData, that.relativeTo),
        that.format(formattedData),
        formattedData.files,
        formattedData,
      ]);
    })
    .then(function (result) {
      return {
        filename: result[0],
        url:      result[1],
        content:  result[2],
        files:    result[3],
        raw:      result[4],
      };
    });
};

module.exports = Formatter;
