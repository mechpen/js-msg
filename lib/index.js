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

function collectData(ctx) {
  let srcDir = ctx.options.srcDir
  let dstDir = ctx.options.dstDir
  ctx.data = {
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
          ctx.data._copyThrough.push({
            src: path.join(dir, x),
            dst: path.join(dstDir, dir.slice(srcDir.length), x)
          })
        })
        delete d._copyThrough
      }

      ctx.data[dir] = d
    }
  })

  utils.walkPath(srcDir, (name) => {
    let d = ctx.data[path.dirname(name)]

    if (d !== undefined) {
      if (name === d._templateDir) {
        return true
      }
      if (Array.isArray(d._copyThrough) && d._copyThrough.includes(name)) {
        return true
      }
    }

    let page = sources.getSource(ctx, name)
    if (page !== undefined) {
      addPageData(page.data, name, srcDir, dstDir)
      ctx.data._pages.push(page.data)
    }
  })

  ctx.data._pages.sort((a, b) => {
    return a._url < b._url ? -1 : a._url > b._url ? 1 : 0
  })
}

async function renderPages(ctx) {
  let pathRe = ctx.options.pathRe || ".*"
  for (const page of ctx.data._pages) {
    if (page._url.match(pathRe) !== null) {
      await renderOnePage(ctx, page)
    }
  }
}

async function renderOnePage(ctx, page) {
  console.log("Building " + page._url + "...")
  let renderData = {
    _pages: ctx.data._pages,
    _curr: page._src,
  }

  for (;;) {
    let source = sources.getSource(ctx, renderData._curr, true)
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

async function copyThrough(ctx) {
  console.log("Copying files...")

  for (const {src, dst} of ctx.data._copyThrough) {
    await utils.cpDir(src, dst)
  }
}

function checkArgs(args) {
  let options = {}
  let leftover = []

  for (var i = 0; i < args.length; i++) {
    if (args[i] === "--data") {
      options.data = true
    } else if (args[i] === "--pathRe") {
      options.pathRe = args[++i]
    } else if (args[i] === "--config") {
      options.config = args[++i]
    } else {
      leftover.push(args[i])
    }
  }

  if (leftover.length != 2) {
    throw "Invalid args " + leftover.join(" ")
  }

  options.srcDir = leftover[0]
  options.dstDir = leftover[1]

  return options
}

module.exports = {
  checkArgs: checkArgs,

  runConfig: (options) => {
    let fileName = options.config || ".js-msg.js"
    config.runConfig(fileName)
  },

  genSite: async (options) => {
    options.srcDir = path.resolve(options.srcDir)
    options.dstDir = path.resolve(options.dstDir)
    let ctx = { options: options }

    collectData(ctx)
    if (options.data) {
      console.log(JSON.stringify(ctx, null, "  "))
      return
    }
    await renderPages(ctx)
    await copyThrough(ctx)
    console.log("Done")
  },
}
