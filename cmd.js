#!/usr/bin/env node

const msg = require("./lib")

async function main() {
  try {
    let options = msg.checkArgs(process.argv.slice(2))
    msg.runConfig(options)
    await msg.genSite(options)
  } catch (e) {
    console.log(e)
  }
}

main()
