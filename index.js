const fs = require('fs-extra')
const lineJSONParser = require('ldjson-stream')
const { spawn } = require('child_process')
const debug = require('debug')(__filename.split('/').slice(-1).join())

class RDriver {
  /**
   * Given x[rowIndex][columnIndex], output the R syntax to generate
   * that matrix.  Or x[columnIndex][rowIndex] if you add the
   * transpose flag.
   *
   * Objects or arrays are fine.  Order will be JS's Objects.values
   * order, such as it is.  If you care, then pass arrays.
   */
  matrixR (x, transpose) {
    let values = []
    let cols = null
    for (const row of Object.values(x)) {
      const rowArray = [...Object.values(row)]
      if (cols === null) {
        cols = rowArray.length
      } else {
        if (cols !== rowArray.length) throw Error('uneven row length')
      }
      values.push(...rowArray)
    }
    values = values.map(x => x === undefined ? 'NA' : x)
    if (!transpose) {
      return `matrix(c(${values.join(',')}),byrow=TRUE,ncol=${cols})`
    } else {
      return `matrix(c(${values.join(',')}),byrow=FALSE,nrow=${cols})`
    }
  }

  async krippAlpha (matrix, type = 'interval') {
    return this.ask(`# krippAlpha
library('irr')
d <- ${this.matrixR(matrix)}
out <- kripp.alpha(d, ${JSON.stringify(type)})`)
  }

  async rcorr (matrix) {
    return this.ask(`# rcorr
library('Hmisc')
d <- ${this.matrixR(matrix)}
out <- rcorr(d)`)
  }

  async ggcorr (matrix, imageFileName = 'out-ggcorr.png') {
    return this.ask(`# ggcorr
library('GGally')
d <- ${this.matrixR(matrix)}
ggcorr(d,label=TRUE)
ggsave(${JSON.stringify(imageFileName)})
out<-TRUE`)
  }

  /*
  async runR1 (text) {
    debug('running R', text)
    await fs.writeFile('out-script.R', text) // just for debugging
    const stdout = await execa.stdout('Rscript', ['--vanilla',
                                                  '--slave',
                                                  '-'
                                                 ], {input:text});
    debug('R output', stdout)
    return JSON.parse(stdout)
  }
  */

  /* async */
  ask (text) {
    text = text + `
library('rjson')
cat(toJSON(out))
cat('\n')
`
    return new Promise(resolve => {
      debug('long running R', text)

      if (this.waiting) {
        // we could serialize them for you, but ... you PROBABLY want to
        // just be using await, so this shouldn't be a problem, I think.
        throw new Error('longRunR called before previous one had resolved')
      }
      this.waiting = resolve

      fs.writeFileSync('out-script.R', text) // just for debugging

      if (!this.child) {
        console.error('Spawning Rscript sub-process; it may produce some messages')
        debug('spawning new R')
        this.child = spawn('Rscript', ['--vanilla', '--slave', '--silent', '-'])
        // we could send these to a file, or ... something.
        this.child.stderr.pipe(process.stderr)
        this.child.stdout.pipe(lineJSONParser.parse())
          .on('data', obj => {
            debug('got from R: %o', obj)
            const w = this.waiting
            this.waiting = null
            if (w) {
              w(obj)
            } else {
              console.error('extra output from R: ' + JSON.stringify(obj))
            }
          })
      }

      this.child.stdin.write(text)
      debug('sent to R: %o', text)
    })
  }

  stop () {
    if (this.child) {
      this.child.stdin.write('quit()\n')
      debug('telling R to quit')
      this.child.stdin.end()
      this.child = null
    }
  }
}

module.exports = { RDriver }
