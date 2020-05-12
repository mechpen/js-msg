const fs = require("fs")
const path = require("path")
const fm = require("front-matter")
const utils = require("./utils")
const config = require("./config")

var sources = {}

function findSource(name) {
  let candidates = []

  Object.keys(config.sourceExts).forEach((ext) => {
    let pathName = name + ext
    if (fs.existsSync(pathName)) {
      candidates.push(pathName)
    }
  })

  if (candidates.length > 1) {
    throw "Duplicated source for " + name
  }
  return candidates[0]
}

function getPathData(ctx, pathName) {
  let treeData = ctx.data
  let nodePath = ctx.options.srcDir
  let data = treeData[nodePath] || {}

  let names = pathName.slice(nodePath.length).split(path.sep)
  if (names[0] === "") {
    names = names.slice(1)
  }

  names.forEach((name) => {
    nodePath = path.join(nodePath, name)

    let d = treeData[nodePath]
    if (d !== undefined) {
      data = utils.mergeLeft(data, d)
    }
  })

  return data
}

function getSource(ctx, sourceName, required) {
  let ext = path.extname(sourceName)
  if (ext !== "" && config.sourceExts[ext] === undefined) {
    return
  }

  let name = utils.stemname(sourceName)
  let source = sources[name]
  if (source !== undefined) {
    return source
  }

  let pathName = findSource(name)
  if (pathName === undefined && required !== true) {
    return
  }
  if (pathName === undefined || (ext !== "" && pathName !== sourceName)) {
    throw "Invalid source " + name
  }

  ext = path.extname(pathName)
  let obj = fm(fs.readFileSync(pathName, "utf-8"))
  let pathData = getPathData(ctx, pathName)

  source = {
    data: utils.mergeLeft(pathData, obj.attributes),
    body: config.sourceExts[ext](obj.body),
  }
  sources[name] = source

  return source
}

module.exports = {
  getSource,
}
