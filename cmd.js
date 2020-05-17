#!/usr/bin/env node

const fs = require("fs")
const path = require("path")
const msg = require("./lib")

function printUsageAndExit(code) {
  console.log("Available args:")
  console.log("  --help         print usage and exit")
  console.log("  --data         print data and exit")
  console.log("  --srcRe re     run build only for sources match re")
  console.log("  --plugin       plugin to use, default is 'blog'")
  console.log("  --config       user config file, default is '.js-msg.js'")
  console.log("  srcDir         source dir")
  console.log("  dstDir         destination dir")
  process.exit(code)
}

function checkArgs() {
  let args = process.argv.slice(2)
  let config = null
  let plugins = []
  let options = {}
  let leftover = []

  for (var i = 0; i < args.length; i++) {
    if (args[i] === "--data") {
      options.data = true
    } else if (args[i] === "--srcRe") {
      options.srcRe = args[++i]
    } else if (args[i] === "--plugin") {
      plugins.push(args[++i])
    } else if (args[i] === "--config") {
      config = args[++i]
    } else if (args[i] === "--help") {
      printUsageAndExit(0)
    } else {
      leftover.push(args[i])
    }
  }

  if (leftover.length != 2) {
    console.log("Invalid args.")
    printUsageAndExit(-1)
  }

  if (plugins.length === 0) {
    plugins.push("blog")
  }
  for (const plugin of plugins) {
    msg.runConfig(require("./plugins/" + plugin))
  }

  if (config !== null) {
    msg.runConfig(path.resolve(process.cwd(), config))
  } else {
    config = path.resolve(process.cwd(), ".js-msg.js")
    if (fs.existsSync(config)) {
      msg.runConfig(require(config))
    }
  }

  let srcDir = leftover[0]
  let dstDir = leftover[1]

  return {srcDir, dstDir, options}
}

async function main() {
  let {srcDir, dstDir, options} = checkArgs()
  try {
    await msg.genSite(srcDir, dstDir, options)
  } catch (e) {
    console.log(e)
  }
}

main()
