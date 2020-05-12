const fs = require("fs")
const path = require("path")
const yaml = require("js-yaml")
const utils = require("./utils")
const sources = require("./sources")
const config = require("./config")

function addPageData(page, src, srcDir, dstDir) {
  let url = utils.stemname(src.slice(srcDir.length)) + ".html"

  page._src = src
  page._dst = path.join(dstDir, url)
  page._url = url.split(path.sep).join("/")
  page._date = utils.guessDate(page._url)
}

function collectData(srcDir, dstDir) {
  let data = {
    _copyThrough: [],
    _pages: [],
  }

  utils.walkPath(srcDir, (name) => {
    if (path.basename(name) == "_data.yaml") {
      let dir = path.dirname(name)
      let d = yaml.safeLoad(fs.readFileSync(name, "utf-8"))

      if (d._templateDir !== undefined) {
        d._templateDir = path.join(dir, d._templateDir)
      }

      if (Array.isArray(d._copyThrough)) {
        d._copyThrough.forEach((x) => {
          data._copyThrough.push({
            src: path.join(dir, x),
            dst: path.join(dstDir, dir.slice(srcDir.length), x)
          })
        })
        delete d._copyThrough
      }

      data[dir] = d
    }
  })

  utils.walkPath(srcDir, (name) => {
    let d = data[path.dirname(name)]

    if (d !== undefined) {
      if (name === d._templateDir) {
        return true
      }
      if (Array.isArray(d._copyThrough) && d._copyThrough.includes(name)) {
        return true
      }
    }

    let page = sources.getSource(name, data)
    if (page !== undefined) {
      addPageData(page.data, name, srcDir, dstDir)
      data._pages.push(page.data)
    }
  })

  data._pages.sort((a, b) => {
    return a._url < b._url ? -1 : a._url > b._url ? 1 : 0
  })
  return data
}

async function renderPages(data, pathRe) {
  for (const page of data._pages) {
    if (page._url.match(pathRe) !== null) {
      await renderOnePage(page._src, data)
    }
  }
}

async function renderOnePage(name, data) {
  console.log("Building " + name + "...")
  let renderData = {
    _pages: data._pages,
    _curr: name,
  }

  for (;;) {
    let source = sources.getSource(renderData._curr, data, true)
    renderData = utils.mergeLeft(source.data, renderData)

    let liquid = config.getLiquid(path.dirname(renderData._curr))
    renderData._body = await liquid.parseAndRender(source.body, renderData)

    if (!renderData._template) {
      break
    }

    renderData._curr = path.join(renderData._templateDir, renderData._template)
    delete renderData._templateDir
    delete renderData._template
  }

  // FIXME: dom transforms

  fs.mkdirSync(path.dirname(renderData._dst), {recursive: true})
  fs.writeFileSync(renderData._dst, renderData._body)
}

async function copyThrough(items) {
  for (const {src, dst} of items) {
    await utils.cpDir(src, dst)
  }
}

module.exports = {
  runConfig: (options) => {
    let fileName = options.config || ".js-msg.js"
    config.runConfig(fileName)
  },

  genSite: async (src, dst, options) => {
    src = utils.trimPath(src)
    dst = utils.trimPath(dst)

    let data = collectData(src, dst)
    if (options.data) {
      console.log(JSON.stringify(data, null, "  "))
      return
    }
    let pathRe = options.pathRe || ".*"
    await renderPages(data, pathRe)

    await copyThrough(data._copyThrough)
    console.log("Done")
  },
}
