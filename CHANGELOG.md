## 0.7.0 (2016-07-16)


#### Features

* **main:** made permalink style configurable ([2c987995](https://github.com/voxpelli/node-format-microformat/commit/2c98799531cb860b71423f583c8518a38a9f97e7))


#### Breaking Changes

* now uses Jekyll's default permalink style instead of "/:categories/:year/:month/:title/" as previously
 ([2c987995](https://github.com/voxpelli/node-format-microformat/commit/2c98799531cb860b71423f583c8518a38a9f97e7))
* New minimum Node.js version: 5.x
 ([1e1c50b4](https://github.com/voxpelli/node-format-microformat/commit/1e1c50b45156645a9888497a9b9d3a521dc7b8c2))


## 0.6.0 (2016-03-09)


#### Features

* **main:** Jekyll 3 compatibility ([8040c422](https://github.com/voxpelli/node-format-microformat/commit/8040c422c355cf576bad6b5b361ad86dc3b2cf1f))


### 0.5.1 (2015-09-07)


#### Bug Fixes

* **main:** some bugs with new type of HTML-content ([9d131e04](https://github.com/voxpelli/node-format-microformat/commit/9d131e04de3e2d25bc6cc078f6a9fc63e976068b))


## 0.5.0 (2015-08-28)


#### Features

* **main:** require content.html for html content ([962e66a8](https://github.com/voxpelli/node-format-microformat/commit/962e66a89533f614a5b6f2583d8480157847da29))


### 0.4.1 (2015-08-07)


#### Bug Fixes

* **main:** should detect undetectable language ([b5134b5f](https://github.com/voxpelli/node-format-microformat/commit/b5134b5fbc1d5f782e6aee6c2823effe64b2f6a9))


#### Features

* **main:** extract person tags from categories ([c245871f](https://github.com/voxpelli/node-format-microformat/commit/c245871f2e18fe514436cfbdad1ef240bea615c9))


## 0.4.0 (2015-07-26)


#### Bug Fixes

* **main:** rename "link" to "links" ([bd30567c](https://github.com/voxpelli/node-format-microformat/commit/bd30567c57e0caeadd1ee9dc848cd2f08842b9ce))


#### Features

* **main:** optin: if no language, autodetect it ([bbfc567b](https://github.com/voxpelli/node-format-microformat/commit/bbfc567bf52154240a511ea3c94d8bc76dcb6b43))


### 0.3.2 (2015-07-24)


#### Bug Fixes

* **main:**
  * preformat publish time before slug ([b8c7813b](https://github.com/voxpelli/node-format-microformat/commit/b8c7813b14bf0848f40d456afd5b1c0564ff8f11))
  * by default don't base slug on content ([affb0f73](https://github.com/voxpelli/node-format-microformat/commit/affb0f7361e32feac9098ada20c7f4cf310eb8f7))
  * avoid dashes in beginning/end of slug ([39508870](https://github.com/voxpelli/node-format-microformat/commit/39508870ed929c9eb11eb4404ab0ca381c39b653))


#### Features

* **main:**
  * expose language in top Front Matter ([1de72fb7](https://github.com/voxpelli/node-format-microformat/commit/1de72fb7c95809b2f3ed77853d0de32653940249))
  * make it possible to define defaults ([072455ef](https://github.com/voxpelli/node-format-microformat/commit/072455ef7c6776ba9502bb56be294b771f50107b))


### 0.3.1 (2015-07-22)


#### Bug Fixes

* **main:**
  * categorize "notes" as social activity ([5a991355](https://github.com/voxpelli/node-format-microformat/commit/5a9913557251df85e0e98a2b477126ee7ae5de22))
  * ignore url properties ([4c8b007b](https://github.com/voxpelli/node-format-microformat/commit/4c8b007b253eb1baeb23e5a6b5659f8cafe4b933))


#### Features

* **main:** expose preformatted data in formatAll ([f0fd23f6](https://github.com/voxpelli/node-format-microformat/commit/f0fd23f62220eb5a41c3b17f08a37e5cfbe28c9b))


## 0.3.0 (2015-07-21)


#### Features

* **main:** convert HTML to markdown ([721b3523](https://github.com/voxpelli/node-format-microformat/commit/721b352377f09509c99ad84b0ab42c94ce705b49))


### 0.2.2 (2015-07-21)


#### Bug Fixes

* **main:**
  * map interactions to other categories ([6d617888](https://github.com/voxpelli/node-format-microformat/commit/6d617888b25a738d42504e4c733efc81fe044911))
  * slug creation now handles foreign chars ([87f3d80a](https://github.com/voxpelli/node-format-microformat/commit/87f3d80a9765b1c8ec272b76d82edfc061529077))
  * improved kebab casing ([874a1af7](https://github.com/voxpelli/node-format-microformat/commit/874a1af70e6bb2bd5f94aa10470aaae0a1176a40))
  * support the "bookmark-of" as well ([d793dc89](https://github.com/voxpelli/node-format-microformat/commit/d793dc89c9f8596bb17f93d7467005f3ce26f209))


### 0.2.1 (2015-07-21)


#### Bug Fixes

* **main:** restore original full date in filenames ([073512fe](https://github.com/voxpelli/node-format-microformat/commit/073512fe41cf9cc9557a58df23e777a5f2789b08))


## 0.2.0 (2015-07-20)


#### Bug Fixes

* **main:**
  * make a custom kebab case converter ([07fce582](https://github.com/voxpelli/node-format-microformat/commit/07fce582568a31fa91c652ed41b0ad4ee3d10755))
  * match details in URL:s and filenames ([aabb49fe](https://github.com/voxpelli/node-format-microformat/commit/aabb49fe5608f8d6736b04367b100a9ad298f820))


#### Features

* **main:**
  * added the single-call formatAll() ([74b51df7](https://github.com/voxpelli/node-format-microformat/commit/74b51df7dd14db06f680379c38651702737f64b4))
  * support formatting of files ([4431ee75](https://github.com/voxpelli/node-format-microformat/commit/4431ee750d34b7afe4afc8ad881e7408ebf7d272))
  * make relativeTo an object property ([2144a899](https://github.com/voxpelli/node-format-microformat/commit/2144a899c9295e168a4cb77d8830fbaf42076cfc))


#### Breaking Changes

* make relativeTo an object property

This makes it easier to ensure that all relative URL:s gets resolved to the same absolute one.
 ([2144a899](https://github.com/voxpelli/node-format-microformat/commit/2144a899c9295e168a4cb77d8830fbaf42076cfc))


### 0.1.2 (2015-07-16)


#### Features

* **main:**
  * derive bookmarks as its own category ([f2d78c40](https://github.com/voxpelli/node-format-microformat/commit/f2d78c409f782ca5d8880570ffa5216f18cdc465))
  * interaction category for interactions ([d626eae3](https://github.com/voxpelli/node-format-microformat/commit/d626eae35cb4f19e8b2e25982ae5477c01da0d8c))


### 0.1.1 (2015-07-07)


#### Bug Fixes

* **main:**
  * remove HTML before content slug calc ([12b5da6f](https://github.com/voxpelli/node-format-microformat/commit/12b5da6f6cb4aa91ea2eaa15b06659c36a7c926e))
  * ensure there's always a slug ([fb31d702](https://github.com/voxpelli/node-format-microformat/commit/fb31d7027f02e8837d1055a6516dc8658404bf65))
  * explicitly set title to null ([e4ed6196](https://github.com/voxpelli/node-format-microformat/commit/e4ed61960bb3ceed5b851efbdda4de1700af4bf6))
  * change + test prefix of mf-properties ([a3b7e426](https://github.com/voxpelli/node-format-microformat/commit/a3b7e4262685e0847a858d529173783442dafe1e))
  * save categories as tags ([b5158e6d](https://github.com/voxpelli/node-format-microformat/commit/b5158e6de16dfe626e12ebd049603ac8d44e7c7c))


#### Features

* **main:**
  * default to micropub specific layout ([24753174](https://github.com/voxpelli/node-format-microformat/commit/247531748600f1118f42726231391f33d5d2786e))
  * support the slug property ([361b030b](https://github.com/voxpelli/node-format-microformat/commit/361b030b8a1f809f8071614911ef3352e06fee7f))
