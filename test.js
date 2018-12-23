const test = require('tape')
const { RDriver } = require('.')
// const debug = require('debug')(__filename.split('/').slice(-1).join())

test(t => {
  const d = new RDriver()
  t.equal(d.matrixR([[1, 2], [3, 4]]), 'matrix(c(1,2,3,4),byrow=TRUE,ncol=2)')
  t.equal(d.matrixR([[1, 2], [3, 4]], true), 'matrix(c(1,2,3,4),byrow=FALSE,nrow=2)')
  t.equal(d.matrixR([{ a: 1, b: 2 }, [3, 4]]), 'matrix(c(1,2,3,4),byrow=TRUE,ncol=2)')
  t.equal(d.matrixR({ a: [1, 2], b: [3, 4] }, true), 'matrix(c(1,2,3,4),byrow=FALSE,nrow=2)')

  try {
    t.equal(d.matrixR([[1, 2, 3], [3, 4]]), '')
    t.fail()
  } catch (e) {
    t.equal(e.message, 'uneven row length')
  }

  t.end()
})

test(async (t) => {
  const d = new RDriver()
  let m, x

  m = [[10, 11], [11, 10], [10, 11], [11, 10], [11, 10]]
  x = await d.rcorr(m)
  t.deepEqual(x, { r: [ 1, -1, -1, 1 ], n: [ 5, 5, 5, 5 ], P: [ 'NA', 0, 0, 'NA' ] })

  m = [[1, 0], [1, 0], [1, 0], [1, 0], [1, 0]]
  x = await d.rcorr(m)
  t.deepEqual(x, { r: [ 1, 'NaN', 'NaN', 1 ], n: [ 5, 5, 5, 5 ], P: [ 'NA', 'NaN', 'NaN', 'NA' ] })

  m = [[1, 1], [1, 1], [1, 1], [2, 1], [1, 0], [0, 0], [0, 1], [1, 1]]
  x = await d.rcorr(m)
  t.deepEqual(x, {
    r: [ 1, 0.361157559257308, 0.361157559257308, 1 ],
    n: [ 8, 8, 8, 8 ],
    P: [ 'NA', 0.379409789480354, 0.379409789480354, 'NA' ]
  })

  t.deepEqual(
    await d.krippAlpha([
      [1, 1, 2, 3, 4, 1, 1, 2, 3],
      [1, 1, 2, 3, 4, 1, 1, 1, 3]
    ]),
    { method: 'Krippendorff\'s alpha',
      subjects: 9,
      raters: 2,
      'irr.name':
      'alpha',
      value: 0.954907161803713,
      'stat.name': 'nil',
      statistic: null,
      cm: [ 8, 1, 0, 0, 1, 2, 0, 0, 0, 0, 4, 0, 0, 0, 0, 2 ],
      'data.values': [ '1', '2', '3', '4' ],
      nmatchval: 18,
      'data.level': 'interval'
    }
  )

  await d.ggcorr(m, 'out-text.png')

  d.stop()
  t.end()
})
