/* jshint node: true */

'use strict';

var _ = require('lodash');
var urlModule = require('url');
var yaml = require('js-yaml');
var strftime = require('strftime');

var Formatter = function () {};

Formatter.prototype._formatFrontMatter = function (source) {
  var target = {
    layout: 'micropubpost',
    date: source.published[0].toISOString(),
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

  return '---\n' + yaml.safeDump(target) + '---\n';
};

Formatter.prototype._formatContent = function (data) {
  return data.content ? data.content + '\n' : '';
};

Formatter.prototype._formatSlug = function (data) {
  if (data.properties.slug && data.properties.slug[0]) {
    return _.kebabCase(data.properties.slug[0]);
  }

  var name = (data.properties.name || data.properties.content || [''])[0].trim();

  if (name) {
    name = name.split(/\s+/);
    if (name.length > 5) {
      name = name.slice(0, 5);
    }
    name = name.join(' ');
  }

  return name ? _.kebabCase(name) : '';
};

Formatter.prototype.preFormat = function (data) {
  data = _.cloneDeep(data);

  var slug = this._formatSlug(data);

  data.properties.slug = slug ? [slug] : [];
  data.properties.published = [data.properties.published && data.properties.published[0] ? new Date(data.properties.published[0]) : new Date()];

  return Promise.resolve(data);
};

Formatter.prototype.format = function (data) {
  return Promise.resolve(this._formatFrontMatter(data.properties) + this._formatContent(data.properties));
};

Formatter.prototype.formatFilename = function (data) {
  var slug = data.properties.slug[0];
  return Promise.resolve('_posts/' + strftime('%Y-%m-%d', data.properties.published[0]) + (slug ? '-' + slug : '') + '.html');
};

Formatter.prototype.formatURL = function (data, relativeTo) {
  var slug = data.properties.slug[0];
  var url = strftime('%Y/%m', data.properties.published[0]) + '/' + (slug ? slug + '/' : '');

  if (relativeTo) {
    url = urlModule.resolve(relativeTo, url);
  }

  return Promise.resolve(url);
};

module.exports = Formatter;
