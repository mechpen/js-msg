const Liquid = require("liquid")

const liquid = new Liquid.Engine()

function addLiquidTag(name, newFn) {
  class Tag extends Liquid.Tag {
    constructor(template, tagName, markup) {
      super(template, tagName, markup)
      this.userRender = newFn(markup.trim())
    }

    async render(scope) {
      return await this.userRender(scope.environments[0])
    }
  }

  liquid.registerTag(name, Tag)
}

const processors = {
  pre:  (content, data) => content,  // eslint-disable-line
  post: (content, data) => content,  // eslint-disable-line
  exts: {},
}

const userConfig = {
  addLiquidTag: addLiquidTag,
  processors: processors,
}

function getLiquid(templateDir) {
  liquid.registerFileSystem(new Liquid.LocalFileSystem(templateDir))
  return liquid
}

function runConfig(fn) {
  fn(userConfig)
}

module.exports = {
  processors,
  getLiquid,
  runConfig,
}
