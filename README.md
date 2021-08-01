<h1 align="center">
  dev-sandbox <sup>[beta]</sup>
</h1>

<div align="center">
  <a href="http://www.typescriptlang.org/"><img src="https://img.shields.io/badge/%3C%2F%3E-TypeScript-%230074c1.svg" alt="TypeScript" /></a>
  <a href="https://github.com/prettier/prettier"><img src="https://img.shields.io/badge/code_style-prettier-f8bc45.svg" alt="code style: prettier" /></a>
  <a href="https://www.npmjs.com/package/dev-sandbox"><img src="https://badge.fury.io/js/dev-sandbox.svg" alt="npm version" /></a>
  <a href="https://david-dm.org/iam-medvedev/dev-sandbox"><img src="https://status.david-dm.org/gh/iam-medvedev/dev-sandbox.svg" alt="David" /></a>
  <a href="https://david-dm.org/iam-medvedev/dev-sandbox"><img src="https://status.david-dm.org/gh/iam-medvedev/dev-sandbox.svg?type=dev" alt="David" /></a>
  <a href="https://github.com/semantic-release/semantic-release"><img src="https://img.shields.io/badge/%20%20%F0%9F%93%A6%F0%9F%9A%80-semantic--release-e10079.svg" alt="semantic-release" /></a>
</div>

<div align="center">
  Play with your local code live in browser
</div>

![dev-sandbox](https://raw.githubusercontent.com/iam-medvedev/dev-sandbox/master/screenshot.png)

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
