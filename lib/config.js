const path = require("path")
const Liquid = require("liquid")
const MarkdownIt = require("markdown-it")

const liquid = new Liquid.Engine()

function addLiquidTag(name, newFn) {
  function Tag(template, tagName, markup) {
    Liquid.Tag.call(this, template, tagName, markup)
    this.userTag = newFn(markup.trim())
  }

  Tag.prototype = Object.create(Liquid.Tag.prototype)

  Tag.prototype.render = function(scope) {
    if (this.userTag.render !== undefined) {
      return this.userTag.render(scope.environments[0])
    }
  }

  Tag.prototype.name = name

  liquid.registerTag(name, Tag)
}

var userConfig = {
  addLiquidTag: addLiquidTag,

  getMarkdown: () => new MarkdownIt(),

  setSourceExt: (ext, fn) => {
    config.sourceExts[ext] = fn
  },
}

var config = {
  sourceExts: {
    ".md": (x) => userConfig.getMarkdown().render(x),
    ".html": (x) => x,
  },

  getLiquid: (templateDir) => {
    liquid.registerFileSystem(new Liquid.LocalFileSystem(templateDir))
    return liquid
  },

  runConfig: runConfig,
}

function runConfig(fileName) {
  pathName = path.resolve(process.cwd(), fileName)
  require(pathName)(userConfig)
}

module.exports = config
