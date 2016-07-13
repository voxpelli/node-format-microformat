# Format Microformat

[![Build Status](https://travis-ci.org/voxpelli/node-format-microformat.svg?branch=master)](https://travis-ci.org/voxpelli/node-format-microformat)
[![Coverage Status](https://coveralls.io/repos/voxpelli/node-format-microformat/badge.svg)](https://coveralls.io/r/voxpelli/node-format-microformat)
[![Dependency Status](https://gemnasium.com/voxpelli/node-format-microformat.svg)](https://gemnasium.com/voxpelli/node-format-microformat)
[![js-semistandard-style](https://img.shields.io/badge/code%20style-semistandard-brightgreen.svg?style=flat)](https://github.com/Flet/semistandard)

Formats a Microformat JSON representation into eg. a Jekyll post

## Requirements

Requires at least Node.js 5.x

## Installation

```bash
npm install format-microformat --save
```

## Current status

**Alpha**

Currently formats data into a hardcoded Jekyll style. This is intended to become more dynamic and configurable in the future to adapt to more styles.

## Usage

Simple:

```javascript
var MicropubFormatter = require('format-microformat');

var formatter = new MicropubFormatter();

formatter.formatAll(micropubDocument)
  .then(function (formatted) {
    // Lots of formatted data that one can do lots of fun stuff with. Publish somewhere or such perhaps?
    // Available keys are "filename", "url", "content" and lastly "files" if any files were uploaded
  });
```

Advanced:

```javascript
var MicropubFormatter = require('format-microformat');

var formatter = new MicropubFormatter('http://example.com/');

formatter.preFormat(micropubDocument)
  .then(function (preFormatted) {
    return Promise.all([
      formatter.formatFilename(preFormatted),
      formatter.format(preFormatted),
      formatter.formatURL(preFormatted),
    ]);
  })
  .then(function (lotsOfResolvedStuff) {
    // Lots of formatted data that one can do lots of fun stuff with. Publish somewhere or such perhaps?
  });
```

## Constructor

`new MicropubFormatter([options])`

### Options

* **relativeTo** – if set to a URL, then all formatted URL:s will be resolved to absolute URL:s relative to that one rather then be returned as relative ones.
* **noMarkdown** – if set to `true` then no conversion to Markdown will happen for the content.
* **contentSlug** – if set to `true`, then the slug creation will use the `properties.content` data as a fallback to `properties.name` prior to basing the slug on the timestamp.
* **defaults** – a `micropubDocument` with defaults that will be added as part of the `preFormat()`. Useful to eg. ensure that all documents have a language explicitly set.
* **deriveLanguages** – an array defining what languages, using [ISO 639-3](https://en.wikipedia.org/wiki/ISO_639-3), to autodetect – or `true` to try and autodetect everything

## Methods

* **formatAll(micropubDocument)** – `preFormat`:s and formats everything. Returns a `Promise`that resolves to an object with the keys `filename`, `url`, `content`, `files` and `raw`.
* **preFormat(micropubDocument)** – takes a `micropubDocument` and ensures that all necessary parts are there. **Currently required** to run a `micropubDocument` through this method before handing it to the rest of the methods (except `formatAll()`).
* **formatFilename(preformattedMicropubDocument)**  – returns a filename based on the data in the `micropubDocument`. Includes the relative path to the file – which currently is always `_posts/`
* **formatURL(preformattedMicropubDocument)**  – returns the url the formatted content is expected to live on when published
* **format(preformattedMicropubDocument)** – formats the actual content. Currently it's formatted as an HTML-file with [Jekyll Front Matter](http://jekyllrb.com/docs/frontmatter/). The content of the file is the `properties.content` of the `micropubDocument` – the rest of the data is put into the *front matter*.

## Output formats

For exact implementation of how things are formatted, look at the code and the tests, this is just to get an overview of what one can expect the output to be.

### Filename

The target is to get a filename similar to `_posts/2015-06-30-awesomeness-is-awesome.html`. The date first and then either the defined slug or a slug derived from title or content.

### URL

The target is to get a relatuve URL similar to `2015/06/awesomeness-is-awesome/` where the slug is calculated in the same way as it is for the `filename`. In some cases the URL will be prefixed with a category name – that's the case for eg. replies, likes and bookmarks – the first two are prefixed with `interaction/` and the last one with `bookmark/`.

### Content

The actual content of the file is the HTML of the `properties.content` of the `micropubDocument`. All other properties are added to the [Jekyll Front Matter](http://jekyllrb.com/docs/frontmatter/) together with a couple of other defaults.

Some `micropubDocument` properties receive special handling, the rest are included raw as arrays with an `mf-` prefix to avoid collisions with pre-existing Jekull properties.

The ones with special handling are:

* **content** – isn't part of the front matter but is the actual HTML content of the file
* **name** – inserted as `title` and if not specified, then a value of `''` will be used to avoid automatic generation of titles
* **slug** – inserted as `slug`
* **category** – inserted as `tags`
* **published** – inserted as `date` and formatted as ISO-format

There's also some defaults and derived values:

* **layout** – always set to `micropubpost`
* **category** – derived from other `micropubDocument` properties and only used in some cases, like eg. for replies, likes and bookmarks – it's set to  `interaction`  for the first two and to `bookmark` for the last one

An example of a generated Jekyll Front Matter:

```yaml
layout: micropubpost
date: '2015-06-30T14:34:01.000Z'
title: awesomeness is awesome
slug: awesomeness-is-awesome
category: interaction
mf-like-of:
  - 'http://example.com/liked/page'
```

### Files

An array of objects with a `filename` containing the full path where the file should be uploaded as well as a `buffer` key containing the same buffer object that was part of the original `micropubDocument` files data. Also calculates URL:s for the location of the files post-upload and adds them to the proper `photo`, `video` or `audio` property in the `micropubDocument` so that they are made available in the `content`.

Unlike the other formatting, file formatting happens fully in `preFormat()` as it needs to be done prior to the rest of the step to make the URL:s of the uploaded files available to the rest of the formatting.

Currently supported file keys from the original `micropubDocument`: `photo`, `video` and `audio`

## Format of `micropubDocument`

The format closely matches the [JSON-representation](http://indiewebcamp.com/Micropub#JSON_Syntax) of Micropub.

See the [micropub-express](https://github.com/voxpelli/node-micropub-express#format-of-micropubdocument) module for documentation of this basic object.

In addition to the properties defined by the `micropub-express` module, the `preFormat()` method adds a top level `derived` key that's used internally for values derived from.

The `preFormat()` also flattens the `files` object into an array of files and formats the filenames to the full path where a file should be uploaded.

## Other useful modules

* [micropub-express](https://github.com/voxpelli/node-micropub-express) – an Express 4 Micropub endpoint that accepts and verifies Micropub requests and calls a callback with a parsed `micropubDocument` that can be used with this module
* [github-publish](https://github.com/voxpelli/node-github-publish) – a module that takes a filename and content and publishes that to a GitHub repository. A useful place to send the formatted data that comes out of this module if one wants to add it to a GitHub hosted Jekyll blog of some kind, like eg. [GitHub Pages](https://pages.github.com/).

## Used in

* [webpage-micropub-to-github](https://github.com/voxpelli/webpage-micropub-to-github) – a self-hosteable Micropub endpoint that publishes posts to Jekyll sites by committing them to a GitHub repository
