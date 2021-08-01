[![License: WTFPL](https://img.shields.io/badge/License-WTFPL-brightgreen.svg)](http://www.wtfpl.net/about/)
[![TypeScript](https://img.shields.io/badge/%3C%2F%3E-TypeScript-%230074c1.svg)](http://www.typescriptlang.org/)
[![code style: prettier](https://img.shields.io/badge/code_style-prettier-f8bc45.svg)](https://github.com/prettier/prettier)
[![npm version](https://badge.fury.io/js/dev-sandbox.svg)](https://www.npmjs.com/package/dev-sandbox)
[![David](https://status.david-dm.org/gh/iam-medvedev/dev-sandbox.svg?type=dev)](https://david-dm.org/iam-medvedev/dev-sandbox)
[![David](https://status.david-dm.org/gh/iam-medvedev/dev-sandbox.svg?type=peer)](https://david-dm.org/iam-medvedev/dev-sandbox)
[![semantic-release](https://img.shields.io/badge/%20%20%F0%9F%93%A6%F0%9F%9A%80-semantic--release-e10079.svg)](https://github.com/semantic-release/semantic-release)

<h1 align="center">
  dev-sandbox <sup>[beta]</sup>
</h1>

<div align="center">
  Play with your local code live in browser
</div>

![dev-sandbox](./screenshot.png)

## Features

- Deploys sandbox from root of your package.
- [Typescript](https://www.typescriptlang.org/) ready. Recognizes the types of local files and installed packages.
- Builds the code using [esbuild](https://esbuild.github.io) and sends the result directly to the browser.
- Syntax highlighting and code validation using [monaco](https://microsoft.github.io/monaco-editor/).

## Install

You can install `dev-sandbox` globally and use it from any local package.

```sh
$ yarn global add dev-sandbox
```

or

```sh
$ npm i -g dev-sandbox
```

## Usage

```
$ cd ./my-package
$ dev-sandbox

> Start listening on http://localhost:3000
```

## License

`dev-sandbox` is [MIT licensed](./LICENSE).
