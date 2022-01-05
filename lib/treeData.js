const fs = require("fs")
const path = require("path")
const fm = require("front-matter")
const yaml = require("js-yaml")
const glob = require("glob")
const utils = require("./utils")
const config = require("./config")

function readDirData(srcDir, pathName, tree) {
  let relPath = path.relative(srcDir, pathName)
  let parent = tree.getNode(utils.dirname(relPath))

  if (parent !== undefined && parent.getData("_templateDir") === relPath) {
    return
  }
  if (tree.copyThrough.includes(relPath)) {
    return
  }

  let dataPath = path.join(pathName, "_data.yaml")
  if (!fs.existsSync(dataPath)) {
    return {}
  }

  let data = yaml.load(fs.readFileSync(dataPath, "utf-8"))

  if (data._templateDir !== undefined) {
    data._templateDir = path.join(relPath, data._templateDir)
  }

  if (data._copyThrough !== undefined) {
    for (const pattern of data._copyThrough) {
      let copyThrough = glob.sync(path.join(pathName, pattern))
        .map(p => path.relative(srcDir, p))
      tree.copyThrough = tree.copyThrough.concat(copyThrough)
    }
    delete data._copyThrough
  }

  return data
}

async function readPageData(srcDir, pathName, tree) {
  let relPath = path.relative(srcDir, pathName)

  if (tree.copyThrough.includes(relPath)) {
    return
  }

  let ext = path.extname(pathName)
  if (config.processors.exts[ext] === undefined) {
    return
  }

  let obj = fm(fs.readFileSync(pathName, "utf-8"))
  let data = obj.attributes
  data._body = obj.body
  data._source = relPath

  if (config.processors.pre) {
    data._body = await config.processors.pre(data._body, data)
  }

  return data
}

function isPageData(data) {
  return data._body !== undefined
}

function readTemplateData(srcDir, pathName) {
  pathName = path.join(srcDir, pathName)
  let obj = fm(fs.readFileSync(pathName, "utf-8"))
  return {
    _body: obj.body,
    _template: obj.attributes._template,
  }
}

module.exports = {
  isPageData,
  readDirData,
  readPageData,
  readTemplateData,
}
