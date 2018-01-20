'use strict';

const pathModule = require('path');
const urlModule = require('url');
const escapeHtml = require('escape-html');
const yaml = require('js-yaml');
const ent = require('ent');
const Upndown = require('upndown');
const franc = require('franc');
const iso6393 = require('iso-639-3');
const jekyllUtils = require('jekyll-utils');

const deburr = require('lodash.deburr');
const defaultsDeep = require('lodash.defaultsdeep');
const cloneDeepWith = require('lodash.clonedeepwith');

const htmlRegexp = /<[^>]+>/g;
const camelRegexp = /([a-z])([A-Z])/g;
const kebabRegexp = /[^a-z0-9]+/g;
const whitespaceRegexp = /\s+/g;
const httpRegexp = /^http(s?):\/\//;

const isEmpty = function (value) {
  if (!value) { return true; }
  if (Array.isArray(value) && value.length === 0) { return true; }
  if (typeof value === 'object' && Object.keys(value).length === 0) { return true; }
  return false;
};

const getMfValue = function (data) {
  return (data || [])
    .map(item => {
      if (!item) { return; }
      if (item.value) { return item.value; }
      if (item.html) {
        return ent.decode(item.html.replace(htmlRegexp, ' '))
          .replace(whitespaceRegexp, ' ')
          .trim();
      }
      if (typeof item === 'string') { return item; }
    })
    .filter(item => !!item);
};

const semiKebabCase = function (name) {
  // Convert camel case to spaces, then ensure everything is lower case and then finally – make kebab
  return deburr(name)
    .replace(camelRegexp, '$1 $2')
    .trim()
    .toLowerCase()
    .replace(kebabRegexp, ' ')
    .trim()
    .replace(whitespaceRegexp, '-');
};

const zipObject = function (keys, values) {
  const result = {};

  keys.forEach((key, i) => {
    result[key] = values[i];
  });

  return result;
};

const objectPromiseAll = function (obj, mapMethod) {
  const keys = Object.keys(obj);
  return Promise.all(keys.map(key => mapMethod ? mapMethod(obj[key], key) : obj[key]))
    .then(result => zipObject(keys, result));
};

const resolveValue = function (value, arg) {
  if (typeof value === 'function') {
    value = value(arg);
  }

  return Promise.resolve(value);
};

const resolveCallbackParameter = function (value, data) {
  return resolveValue(value, (data.formattedData || data).properties);
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
  this.filenameStyle = options.filenameStyle || '_posts/:year-:month-:day-:slug';
  this.filesStyle = options.filesStyle || 'media/:year-:month-:slug/:filesslug';
  this.permalinkStyle = options.permalinkStyle;
  this.deriveCategory = options.deriveCategory === undefined ? true : options.deriveCategory;

  if (typeof this.filenameStyle !== 'function' && !this.filenameStyle.includes(':')) {
    throw new Error('Invalid filenameStyle, must include a placeholder');
  }

  if (typeof this.filesStyle !== 'function' && !this.filesStyle.includes(':filesslug')) {
    throw new Error('Invalid filesStyle, must include :filesslug');
  }
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

  Object.keys(source).forEach(key => {
    const value = source[key];

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
        return this.markdown ? new Promise(resolve => {
          und.convert(content.html, (err, markdown) => {
            resolve(err ? content.html : markdown);
          });
        }) : content.html;
      }

      return escapeHtml(content.value || '');
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
  if (!name && !isEmpty(data.properties.content) && this.contentSlug) {
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

  data = cloneDeepWith(data, value => value instanceof Buffer ? value : undefined);

  data.preFormatted = true;

  data.properties.published = [
    data.properties.published && data.properties.published[0]
      ? new Date(data.properties.published[0])
      // Default to a time 15 seconds into the past to avoid issues with time being out of sync between
      // the Micropub server and the build server, that has proven to be an issue otherwise.
      : new Date(Date.now() - 15000)
  ];

  const slug = this._formatSlug(data);
  data.properties.slug = slug ? [slug] : [];

  let strippedContent, estimatedLang;
  if (isEmpty(data.properties.lang) && this.deriveLanguages && !isEmpty(data.properties.content)) {
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

  if (!isEmpty(data.properties.category)) {
    data.derived.personTags = [];

    data.properties.category = data.properties.category.filter(tag => {
      if (httpRegexp.test(tag)) {
        data.derived.personTags.push(tag);
        return false;
      }
      return true;
    });

    if (isEmpty(data.derived.personTags)) {
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
    !isEmpty(data.properties.bookmark) ||
    !isEmpty(data.properties['repost-of']) ||
    !isEmpty(data.properties['bookmark-of'])
  ) {
    data.derived.category = 'links';
  } else if (
    isEmpty(data.properties.name) || // This means it's not an "article", but a "note"
    !isEmpty(data.properties['in-reply-to']) ||
    !isEmpty(data.properties['like-of'])
  ) {
    data.derived.category = 'social';
  }

  defaultsDeep(data, this.defaults || {});

  let result = Promise.resolve(data);

  if (!isEmpty(data.files)) {
    result = result.then(this._preFormatFiles.bind(this));
  }

  return result;
};

Formatter.prototype._precalculate = function (formattedData, { skipFilename } = {}) {
  return Promise.all([
    skipFilename ? undefined : this.formatFilename(formattedData),
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
  ])
    .then(result => result.join(''));
};

Formatter.prototype._getFileExtension = function () {
  return this.markdown ? 'md' : 'html';
};

Formatter.prototype.formatFilename = function (data) {
  return objectPromiseAll({
    jekyllResource: this._getJekyllResource(data, { skipFilename: true }),
    filenameStyle: resolveCallbackParameter(this.filenameStyle, data)
  })
    .then(({ jekyllResource, filenameStyle }) =>
      jekyllUtils.generateUrl(filenameStyle, jekyllResource).replace(/^\/+/, '') +
      '.' +
      this._getFileExtension()
    );
};

Formatter.prototype._getJekyllResource = function (data, { skipFilename } = {}) {
  return Promise.resolve(data.formattedData ? data : this._precalculate(data, { skipFilename }))
    .then(data => ({
      basename_without_ext: data.filename ? pathModule.basename(data.filename, this._getFileExtension()) : data.frontMatterData.slug,
      date: data.formattedData.properties.published[0],
      data: {
        categories: data.frontMatterData.category ? [].concat(data.frontMatterData.category) : [],
        slug: data.frontMatterData.slug
      }
    }));
};

Formatter.prototype.formatURL = function (data) {
  return objectPromiseAll({
    jekyllResource: this._getJekyllResource(data),
    permalinkStyle: resolveCallbackParameter(this.permalinkStyle, data)
  })
    .then(({ jekyllResource, permalinkStyle }) => {
      let url = jekyllUtils.generateUrl(permalinkStyle, jekyllResource).replace(/^\/+/, '');

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
  return objectPromiseAll({
    jekyllResource: this._getJekyllResource(data, { skipFilename: true }),
    filesStyle: resolveCallbackParameter(this.filesStyle, data)
  })
    .then(({ jekyllResource, filesStyle }) => ({
      jekyllResource,
      filesStyle: filesStyle.split(':filesslug').join(this._formatFilesSlug(type, file))
    }))
    .then(({ jekyllResource, filesStyle }) => jekyllUtils.generateUrl(filesStyle, jekyllResource).replace(/^\/+/, ''));
};

Formatter.prototype.formatFilesURL = function (type, file, data) {
  return this.formatFilesFilename(type, file, data)
    .then(url => this.relativeTo ? urlModule.resolve(this.relativeTo, url) : url);
};

Formatter.prototype.formatAll = function (data) {
  return this.preFormat(data)
    .then(formattedData => this._precalculate(formattedData))
    .then(result => Promise.all([
      this.formatFilename(result),
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
