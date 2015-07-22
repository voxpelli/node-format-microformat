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
