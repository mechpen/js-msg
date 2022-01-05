#!/usr/bin/env node

const fs = require("fs")
const path = require("path")
const jsmsg = require("./lib")

function printUsageAndExit(code) {
  console.log("Available args:")
  console.log("  --help         print usage and exit")
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
  let leftover = []

  for (var i = 0; i < args.length; i++) {
    if (args[i] === "--plugin") {
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
    if (plugin !== "null") {
      jsmsg.runConfig(require("./plugins/" + plugin))
    }
  }

  if (config !== null) {
    jsmsg.runConfig(path.resolve(process.cwd(), config))
  } else {
    config = path.resolve(process.cwd(), ".js-msg.js")
    if (fs.existsSync(config)) {
      jsmsg.runConfig(require(config))
    }
  }

  let srcDir = leftover[0]
  let dstDir = leftover[1]

  return {srcDir, dstDir}
}

async function main() {
  let {srcDir, dstDir} = checkArgs()
  try {
    await jsmsg.genSite(srcDir, dstDir)
  } catch (e) {
    console.log(e)
  }
}

main()
