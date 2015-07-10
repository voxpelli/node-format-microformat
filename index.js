/* jshint node: true */

'use strict';

var _ = require('lodash');
var urlModule = require('url');
var yaml = require('js-yaml');
var strftime = require('strftime');
var ent = require('ent');

var htmlRegexp = /<[^>]+>/g;

var Formatter = function () {};

Formatter.prototype._formatFrontMatter = function (data) {
  var source = data.properties;
  var derived = data.derived || {};

  var target = {
    layout: 'micropubpost',
    date: source.published[0].toISOString(),
    title: null,
  };

  //TODO: Make configurable?
  var mapping = {
    name: 'title',
    slug: 'slug',
    category: 'tags',
  };
  var ignore = ['content', 'published'];

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
  return data.properties.content ? data.properties.content + '\n' : '';
};

Formatter.prototype._formatSlug = function (data) {
  if (data.properties.slug && data.properties.slug[0]) {
    return _.kebabCase(data.properties.slug[0]);
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

  return _.kebabCase(name);
};

Formatter.prototype.preFormat = function (data) {
  data = _.cloneDeep(data);

  var slug = this._formatSlug(data);

  data.properties.slug = slug ? [slug] : [];
  data.properties.published = [data.properties.published && data.properties.published[0] ? new Date(data.properties.published[0]) : new Date()];

  data.derived = {};

  if (!_.isEmpty(data.properties['in-reply-to']) || !_.isEmpty(data.properties['like-of'])) {
    data.derived.category = 'interaction';
  }

  return Promise.resolve(data);
};

Formatter.prototype.format = function (data) {
  return Promise.resolve(this._formatFrontMatter(data) + this._formatContent(data));
};

Formatter.prototype.formatFilename = function (data) {
  var slug = data.properties.slug[0];
  return Promise.resolve('_posts/' + strftime('%Y-%m-%d', data.properties.published[0]) + (slug ? '-' + slug : '') + '.html');
};

Formatter.prototype.formatURL = function (data, relativeTo) {
  var derived = data.derived || {};

  var slug = data.properties.slug[0];
  var url = strftime('%Y/%m', data.properties.published[0]) + '/' + (slug ? slug + '/' : '');

  if (derived.category) {
    url = derived.category + '/' + url;
  }

  if (relativeTo) {
    url = urlModule.resolve(relativeTo, url);
  }

  return Promise.resolve(url);
};

module.exports = Formatter;
