const fs = require("fs")
const path = require("path")
const fm = require("front-matter")
const utils = require("./utils")
const config = require("./config")

const sources = {}

function getPathData(treeData, pathName) {
  let nodePath = ""
  let data = treeData[nodePath]

  for (const name of pathName.split(path.sep).slice(0, -1)) {
    nodePath = path.join(nodePath, name)

    let d = treeData[nodePath]
    if (d !== undefined) {
      data = utils.merge(data, d)
    }
  }

  return data
}

function getSource(treeData, srcDir, relative) {
  let ext = path.extname(relative)
  if (config.processors.exts[ext] === undefined) {
    return
  }

  let source = sources[relative]
  if (source !== undefined) {
    return source
  }

  let name = path.join(srcDir, relative)
  let obj = fm(fs.readFileSync(name, "utf-8"))
  let pathData = getPathData(treeData, relative)

  source = {
    data: utils.merge(pathData, obj.attributes),
    body: obj.body,
  }
  sources[relative] = source

  return source
}

module.exports = {
  getSource,
}
