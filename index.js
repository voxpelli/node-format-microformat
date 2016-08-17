'use strict';

const _ = require('lodash');
const urlModule = require('url');
const yaml = require('js-yaml');
const strftime = require('strftime');
const ent = require('ent');
const Upndown = require('upndown');
const franc = require('franc');
const iso6393 = require('iso-639-3');
const jekyllUtils = require('jekyll-utils');

const htmlRegexp = /<[^>]+>/g;
const camelRegexp = /([a-z])([A-Z])/g;
const kebabRegexp = /[^a-z0-9]+/g;
const whitespaceRegexp = /\s+/g;
const httpRegexp = /^http(s?):\/\//;

const getMfValue = function (data) {
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

const semiKebabCase = function (name) {
  // Convert camel case to spaces, then ensure everything is lower case and then finally – make kebab
  return _.deburr(name)
    .replace(camelRegexp, '$1 $2')
    .trim()
    .toLowerCase()
    .replace(kebabRegexp, ' ')
    .trim()
    .replace(whitespaceRegexp, '-');
};

const Formatter = function (options) {
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
  this.permalinkStyle = options.permalinkStyle;
  this.deriveCategory = options.deriveCategory === undefined ? true : options.deriveCategory;
};

Formatter.prototype._resolveFrontMatterData = function (data) {
  const source = data.properties;
  const derived = data.derived || {};

  // TODO: Include the "type" property so that more than the now assumed "h-entry" can be supported

  const target = {
    layout: 'micropubpost',
    date: source.published[0].toISOString(),
    title: ''
  };

  const mapping = {
    name: 'title',
    slug: 'slug',
    category: 'tags',
    lang: 'lang'
  };
  const ignore = ['content', 'published', 'url'];

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

  return target;
};

Formatter.prototype._formatFrontMatter = function (data) {
  const frontMatterData = data.frontMatterData || this._resolveFrontMatterData(data);
  return '---\n' + yaml.safeDump(frontMatterData) + '---\n';
};

Formatter.prototype._formatContent = function (data) {
  data = data.formattedData || data;

  let content = data.properties.content;

  if (!content) { return Promise.resolve(''); }

  content = [].concat(content);

  const und = new Upndown();

  if (Array.isArray(content)) {
    return Promise.all(content.map(content => {
      if (typeof content !== 'object') {
        content = { value: content };
      }

      if (content.html) {
        return this.markdown ? new Promise(function (resolve) {
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

  let name;

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
  const fileResolves = [];

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
    const newFiles = [];

    files.forEach(file => {
      const type = file[0];
      const fileData = file[1];
      const filename = file[2];
      const url = file[3];

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

  const slug = this._formatSlug(data);
  data.properties.slug = slug ? [slug] : [];

  let strippedContent, estimatedLang;
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

      const code = iso6393.get(lang);

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

  if (typeof this.deriveCategory === 'function') {
    data.derived.category = this.deriveCategory(data.properties);
    if (!data.derived.category) {
      delete data.derived.category;
    }
  } else if (!this.deriveCategory) {
    // Do nothing
  } else if (
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

  let result = Promise.resolve(data);

  if (!_.isEmpty(data.files)) {
    result = result.then(this._preFormatFiles.bind(this));
  }

  return result;
};

Formatter.prototype._precalculate = function (formattedData) {
  return Promise.all([
    this.formatFilename(formattedData),
    this._resolveFrontMatterData(formattedData)
  ])
    .then(result => ({
      formattedData,
      filename: result[0],
      frontMatterData: result[1]
    }));
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
  const slug = data.properties.slug[0];

  return Promise.resolve(
    '_posts/' +
    strftime('%Y-%m-%d', data.properties.published[0]) +
    (slug ? '-' + slug : '') +
    (this.markdown ? '.md' : '.html')
  );
};

Formatter.prototype._getJekyllResource = function (data) {
  return Promise.resolve(data.formattedData ? data : this._precalculate(data))
    .then(data => ({
      basename_without_ext: data.filename, // TODO: Complete
      date: data.formattedData.properties.published[0],
      data: {
        categories: data.frontMatterData.category ? [].concat(data.frontMatterData.category) : [],
        slug: data.frontMatterData.slug
      }
    }));
};

Formatter.prototype.formatURL = function (data) {
  return this._getJekyllResource(data)
    .then(jekyllResource => {
      let url = jekyllUtils.generateUrl(this.permalinkStyle, jekyllResource).replace(/^\/+/, '');

      if (this.relativeTo) {
        url = urlModule.resolve(this.relativeTo, url);
      }

      return url;
    });
};

Formatter.prototype._formatFilesSlug = function (type, file) {
  return file.filename.trim().split('.').map(name => semiKebabCase(name)).join('.');
};

Formatter.prototype.formatFilesFilename = function (type, file, data) {
  const slug = data.properties.slug[0];
  const filename = this._formatFilesSlug(type, file);
  return Promise.resolve('media/' + strftime('%Y-%m', data.properties.published[0]) + (slug ? '-' + slug : '') + '/' + filename);
};

Formatter.prototype.formatFilesURL = function (type, file, data) {
  return this.formatFilesFilename(type, file, data)
    .then(url => this.relativeTo ? urlModule.resolve(this.relativeTo, url) : url);
};

Formatter.prototype.formatAll = function (data) {
  return this.preFormat(data)
    .then(formattedData => this._precalculate(formattedData))
    .then(result => Promise.all([
      result.filename,
      this.formatURL(result, this.relativeTo),
      this.format(result),
      result.formattedData.files,
      result.formattedData
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
