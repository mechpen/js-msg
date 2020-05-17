const fs = require("fs")
const path = require("path")
const yaml = require("js-yaml")
const utils = require("./utils")
const sources = require("./sources")
const config = require("./config")

async function collectTreeData(srcDir) {
  let treeData = {
    copyThrough: [],
    allpages: [],
    nodes: {},
  }

  await utils.walkPath(srcDir, (name) => {
    let relative = path.relative(srcDir, name)

    if (path.basename(name) == ".data.yaml") {
      let d = yaml.safeLoad(fs.readFileSync(name, "utf-8"))
      let dir = utils.dirname(relative)

      if (d.templateDir !== undefined) {
        d.templateDir = path.join(dir, d.templateDir)
      }

      if (Array.isArray(d.copyThrough)) {
        for (const x of d.copyThrough) {
          treeData.copyThrough.push(path.join(dir, x))
        }
        delete d.copyThrough
      }

      treeData.nodes[dir] = d
    }
  })

  await utils.walkPath(srcDir, async (name) => {
    let relative = path.relative(srcDir, name)
    let d = treeData.nodes[utils.dirname(relative)]

    if (d !== undefined) {
      if (relative === d.templateDir) {
        return true
      }
      if (Array.isArray(d.copyThrough) && d.copyThrough.includes(relative)) {
        return true
      }
    }

    let page = sources.getSource(treeData.nodes, srcDir, relative)
    if (page !== undefined) {
      page.data.source = relative

      if (config.processors.pre) {
        page.body = await config.processors.pre(page.body, page.data)
      }

      treeData.allpages.push(page.data)
    }
  })

  return treeData
}

async function renderPages(treeData, srcDir, dstDir, options) {
  let srcRe = options.srcRe || ".*"
  for (const page of treeData.allpages) {
    if (page.source.match(srcRe) !== null) {
      await renderOnePage(treeData, srcDir, dstDir, page.source)
    }
  }
}

async function renderOnePage(treeData, srcDir, dstDir, relative) {
  console.log("Building " + relative + "...")

  let ext = null
  let output = null
  let data = {
    allpages: treeData.allpages,
    current: relative,
    content: output,
    srcDir: srcDir,
    dstDir: dstDir,
  }

  for (;;) {
    // set fs path to cwd for "include" tag
    let cwd = path.join(srcDir, utils.dirname(data.current))
    let liquid = config.getLiquid(cwd)

    let source = sources.getSource(treeData.nodes, srcDir, data.current)

    ext = path.extname(data.current)
    data = utils.merge(source.data, data)
    output = await liquid.parseAndRender(source.body, data)

    if (config.processors.exts[ext]) {
      output = await config.processors.exts[ext](output, data)
    }

    if (!data.template) {
      break
    }

    data.content = output
    data.current = path.join(data.templateDir, data.template)
    delete data.templateDir
    delete data.template
  }

  if (config.processors.post) {
    output = await config.processors.post(output, data)
  }

  let dst = path.join(dstDir, utils.stemname(relative)) + ext
  fs.mkdirSync(utils.dirname(dst), {recursive: true})
  fs.writeFileSync(dst, output)
}

async function copyThrough(copyPaths, srcDir, dstDir) {
  console.log("Copying files...")

  for (const copyPath of copyPaths) {
    let src = path.join(srcDir, copyPath)
    let dst = path.join(dstDir, copyPath)

    fs.mkdirSync(utils.dirname(dst), {recursive: true})
    await utils.cp(src, dst)
  }
}

async function genSite(srcDir, dstDir, options) {
  let treeData = await collectTreeData(srcDir)
  if (options.data) {
    console.log(JSON.stringify(treeData, null, "  "))
    return
  }

  await renderPages(treeData, srcDir, dstDir, options)
  await copyThrough(treeData.copyThrough, srcDir, dstDir)
  console.log("Done")
}

module.exports = {
  runConfig: config.runConfig,
  genSite: genSite,
}
