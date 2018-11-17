/* eslint-env node */

const path = require('path')
const merge = require('webpack-merge')

const {
  setupIO,
  setupDevServer,
  loadHTML,
  loadJS,
  loadMacro,
  loadMedia,
  loadFont,
  minify,
  forceCaseSensitivePath,
  generateSourceMaps,
  cleanupBuilds,
} = require('webpack-config-parts')

const BASE_DIR = __dirname
const ENTRY = path.join(BASE_DIR, 'src/index.js')
const DIST_DIR = path.join(BASE_DIR, 'dist')

const blackEnginePath = path.resolve(__dirname, '../dist/es6-module.js')

const commonConfig = merge([
  {
    resolve: {
      alias: {
        res: path.resolve(__dirname, 'src/assets/'),

        'black-engine': blackEnginePath,
      },
    },
  },
  loadHTML(),
  loadJS({
    include: [path.resolve(__dirname, 'src'), blackEnginePath],
  }),
  loadMacro(),
  loadMedia(),
  loadFont(),
  forceCaseSensitivePath(),
])

const developmentConfig = () =>
  merge([
    setupIO({
      entry: ENTRY,
      outputDIR: DIST_DIR,
    }),
    setupDevServer(),
    commonConfig,
    generateSourceMaps({ production: false }),
  ])

const productionConfig = () =>
  merge([
    minify(),
    setupIO({
      entry: ENTRY,
      outputDIR: DIST_DIR,
      production: true,
    }),
    commonConfig,
    generateSourceMaps({ production: true }),
    cleanupBuilds(DIST_DIR, { root: BASE_DIR }),
  ])

/* eslint-disable-next-line */
module.exports = function(_, { mode } = { mode: 'NO_MODE' }) {
  const config =
    mode === 'production' ? productionConfig() : developmentConfig()

  return config
}
