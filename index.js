'use strict';

var _ = require('lodash');
var urlModule = require('url');
var yaml = require('js-yaml');
var strftime = require('strftime');
var ent = require('ent');
var Upndown = require('upndown');
var franc = require('franc');
var iso6393 = require('iso-639-3');

var htmlRegexp = /<[^>]+>/g;
var camelRegexp = /([a-z])([A-Z])/g;
var kebabRegexp = /[^a-z0-9]+/g;
var whitespaceRegexp = /\s+/g;
var httpRegexp = /^http(s?):\/\//;

var getMfValue = function (data) {
  return _(data || [])
    .map(function (item) {
      if (!item) { return; }
      if (item.value) { return item.value; }
      if (item.html) {
        return ent.decode(item.html.replace(htmlRegexp, ' '))
          .replace(whitespaceRegexp, ' ')
          .trim();
      }
      if (typeof item === 'string') { return item; }
    })
    .filter()
    .value();
};

var semiKebabCase = function (name) {
  // Convert camel case to spaces, then ensure everything is lower case and then finally – make kebab
  return _.deburr(name)
    .replace(camelRegexp, '$1 $2')
    .trim()
    .toLowerCase()
    .replace(kebabRegexp, ' ')
    .trim()
    .replace(whitespaceRegexp, '-');
};

var Formatter = function (options) {
  if (typeof options === 'string') {
    options = { relativeTo: options };
  } else {
    options = Object.assign({}, options || {});
  }

  this.relativeTo = options.relativeTo;
  this.markdown = !options.noMarkdown;
  this.contentSlug = !!options.contentSlug;
  this.defaults = options.defaults;
  this.deriveLanguages = options.deriveLanguages || false;
};

Formatter.prototype._formatFrontMatter = function (data) {
  var source = data.properties;
  var derived = data.derived || {};

  // TODO: Include the "type" property so that more than the now assumed "h-entry" can be supported

  var target = {
    layout: 'micropubpost',
    date: source.published[0].toISOString(),
    title: ''
  };

  var mapping = {
    name: 'title',
    slug: 'slug',
    category: 'tags',
    lang: 'lang'
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
  if (derived.personTags) {
    target.persontags = derived.personTags;
  }

  return '---\n' + yaml.safeDump(target) + '---\n';
};

Formatter.prototype._formatContent = function (data) {
  var content = data.properties.content;

  if (!content) { return Promise.resolve(''); }

  content = [].concat(content);

  var und = new Upndown();
  var self = this;

  if (Array.isArray(content)) {
    return Promise.all(content.map(function (content) {
      if (typeof content !== 'object') {
        content = { value: content };
      }

      if (content.html) {
        return self.markdown ? new Promise(function (resolve) {
          und.convert(content.html, function (err, markdown) {
            resolve(err ? content.html : markdown);
          });
        }) : content.html;
      }

      return _.escape(content.value || '');
    }))
      .then(result => result.filter(value => !!value).join('\n') + '\n');
  }
};

Formatter.prototype._formatSlug = function (data) {
  if (data.properties.slug && data.properties.slug[0]) {
    return semiKebabCase(data.properties.slug[0]);
  }

  var name;

  if (data.properties.name) {
    name = data.properties.name[0].trim();
  }
  if (!name && !_.isEmpty(data.properties.content) && this.contentSlug) {
    name = getMfValue(data.properties.content).join('\n');
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
  var fileResolves = [];

  ['video', 'photo', 'audio'].forEach(type => {
    (data.files[type] || []).forEach(file => {
      fileResolves.push(Promise.all([
        type,
        file,
        this.formatFilesFilename(type, file, data),
        this.formatFilesURL(type, file, data)
      ]));
    });
  });

  return Promise.all(fileResolves).then(files => {
    var newFiles = [];

    files.forEach(file => {
      var type = file[0];
      var fileData = file[1];
      var filename = file[2];
      var url = file[3];

      data.properties[type] = data.properties[type] || [];
      data.properties[type].push(url);

      newFiles.push({
        filename: filename,
        buffer: fileData.buffer
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

  data = _.cloneDeepWith(data, value => value instanceof Buffer ? value : undefined);

  data.properties.published = [data.properties.published && data.properties.published[0] ? new Date(data.properties.published[0]) : new Date()];

  var slug = this._formatSlug(data);
  data.properties.slug = slug ? [slug] : [];

  var strippedContent, estimatedLang;
  if (_.isEmpty(data.properties.lang) && this.deriveLanguages && !_.isEmpty(data.properties.content)) {
    strippedContent = getMfValue(data.properties.content).join('\n');

    if (strippedContent !== '') {
      estimatedLang = franc(strippedContent, this.deriveLanguages === true ? {} : { whitelist: this.deriveLanguages });
    }

    if (estimatedLang && estimatedLang !== 'und' && (this.deriveLanguages === true || this.deriveLanguages.indexOf(estimatedLang) !== -1)) {
      data.properties.lang = [estimatedLang];
    }
  }

  if (Array.isArray(data.properties.lang)) {
    data.properties.lang = data.properties.lang.map(lang => {
      if (!lang || lang.length !== 3) { return lang; }

      var code = iso6393.get(lang);

      if (code) {
        return code.iso6391;
      }

      return lang;
    });
  }

  data.derived = {};

  if (!_.isEmpty(data.properties.category)) {
    data.derived.personTags = [];

    data.properties.category = data.properties.category.filter(tag => {
      if (httpRegexp.test(tag)) {
        data.derived.personTags.push(tag);
        return false;
      }
      return true;
    });

    if (_.isEmpty(data.derived.personTags)) {
      delete data.derived.personTags;
    }
  }

  if (
    !_.isEmpty(data.properties.bookmark) ||
    !_.isEmpty(data.properties['repost-of']) ||
    !_.isEmpty(data.properties['bookmark-of'])
  ) {
    data.derived.category = 'links';
  } else if (
    _.isEmpty(data.properties.name) || // This means it's not an "article", but a "note"
    !_.isEmpty(data.properties['in-reply-to']) ||
    !_.isEmpty(data.properties['like-of'])
  ) {
    data.derived.category = 'social';
  }

  _.defaultsDeep(data, this.defaults || {});

  var result = Promise.resolve(data);

  if (!_.isEmpty(data.files)) {
    result = result.then(this._preFormatFiles.bind(this));
  }

  return result;
};

Formatter.prototype.format = function (data) {
  return Promise.all([
    this._formatFrontMatter(data),
    this._formatContent(data)
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
  return file.filename.trim().split('.').map(name => semiKebabCase(name)).join('.');
};

Formatter.prototype.formatFilesFilename = function (type, file, data) {
  var slug = data.properties.slug[0];
  var filename = this._formatFilesSlug(type, file);
  return Promise.resolve('media/' + strftime('%Y-%m', data.properties.published[0]) + (slug ? '-' + slug : '') + '/' + filename);
};

Formatter.prototype.formatFilesURL = function (type, file, data) {
  return this.formatFilesFilename(type, file, data)
    .then(url => this.relativeTo ? urlModule.resolve(this.relativeTo, url) : url);
};

Formatter.prototype.formatAll = function (data) {
  return this.preFormat(data)
    .then(formattedData => Promise.all([
      this.formatFilename(formattedData),
      this.formatURL(formattedData, this.relativeTo),
      this.format(formattedData),
      formattedData.files,
      formattedData
    ]))
    .then(result => ({
      filename: result[0],
      url: result[1],
      content: result[2],
      files: result[3],
      raw: result[4]
    }));
};

module.exports = Formatter;
