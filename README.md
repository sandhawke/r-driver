# r-driver
[![NPM version][npm-image]][npm-url]

Do stats processing by talking to a subprocess running R

## Motivation

I need correlations and stuff (like Krippendorff's Alpha) in my
Node.JS app.  I can't find a module to do that, so let's have R do it.

I don't really know R or want to think about how it works most of the
time, so I want to hide it behind this module.

R is also a bit slow to start up and load libraries, so we stream
commands to it, and have each command give us back line-delimitted
JSON.

## Install

Step 1. Install [R](https://www.r-project.org/) and the libraries we need.
Lots of ways to do this.  On debian:

```terminal
$ sudo apt-get install r-base r-cran-hmisc r-cran-rjson
```

The libraries you need depend on the functions you use. You'll
probably need to use cran directly for some of them, since they're not
in debian.

Step 2. Install this module

```terminal
$ npm i --save r-driver
```

## API

Function are added on an ad hoc basis.

For example, using [rcorr](https://www.rdocumentation.org/packages/Hmisc/versions/4.1-1/topics/rcorr):

```js
const {RDriver} = require('r-driver')
const rd = new RDriver()
rd.rcorr([[1,1],[1,1],[1,1],[2,1],[1,0],[0,0],[0,1],[1,1]])
    .then(out => {
        console.log(out)
    })
```

See test.js

## See Also

Some other packages that run R for you.  They don't try to wrap it so
much.
* https://www.npmjs.com/package/rstats
* https://www.npmjs.com/package/js-call-r
* https://www.npmjs.com/package/r-script

[npm-image]: https://img.shields.io/npm/v/r-driver.svg?style=flat-square
[npm-url]: https://npmjs.org/package/r-driver
