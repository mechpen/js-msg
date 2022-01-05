const fs = require("fs")
const path = require("path")
const utils = require("./utils")
const config = require("./config")
const treeData = require("./treeData")

async function renderPages(treeData, srcDir, dstDir) {
  for (const node of treeData.getPageNodes()) {
    await renderOnePage(node, srcDir, dstDir)
  }
}

async function renderOnePage(node, srcDir, dstDir) {
  console.log(`Building ${node.path} ...`)

  let ext = null
  let data = utils.merge(node.mergeData(), {
    _source: node.path,
    _current: node.path,
    _input: null,
    _srcDir: srcDir,
    _dstDir: dstDir,
  })

  for (;;) {
    // set fs path to cwd for "include" tag
    let cwd = path.join(srcDir, utils.dirname(data._current))
    let liquid = config.getLiquid(cwd)

    data._input = await liquid.parseAndRender(data._body, data)

    ext = path.extname(data._current)
    if (config.processors.exts[ext]) {
      data._input = await config.processors.exts[ext](data._input, data)
    }

    if (!data._template) {
      break
    }

    let templatePath = path.join(data._templateDir, data._template)
    let templateData = treeData.readTemplateData(srcDir, templatePath)

    data._current = templatePath
    data._body = templateData._body
    data._template = templateData._template
  }

  if (config.processors.post) {
    data._input = await config.processors.post(data._input, data)
  }

  let dst = path.join(dstDir, utils.stemname(data._source)) + ext
  fs.mkdirSync(utils.dirname(dst), {recursive: true})
  fs.writeFileSync(dst, data._input)
}

module.exports = {
  renderPages,
}
