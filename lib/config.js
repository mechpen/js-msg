const Liquid = require("liquid")

const liquid = new Liquid.Engine()

function addLiquidTag(name, newFn) {
  function Tag(template, tagName, markup) {
    Liquid.Tag.call(this, template, tagName, markup)
    this.userRender = newFn(markup.trim())
  }

  Tag.prototype = Object.create(Liquid.Tag.prototype)

  Tag.prototype.render = async function(scope) {
    if (this.userRender) {
      return await this.userRender(scope.environments[0])
    }
  }

  Tag.prototype.name = name

  liquid.registerTag(name, Tag)
}

const processors = {
  pre:  (x) => x,  // 2nd arg "data" is modified in place
  post: (x) => x,  // 2nd arg "data" is modified in place
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
