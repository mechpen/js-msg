#!/usr/bin/env node

const argv = require("minimist")(process.argv.slice(2))
const msg = require("./lib")

async function main() {
  try {
    msg.runConfig(argv)
    await msg.genSite(argv._[0], argv._[1], argv)
  } catch (e) {
    console.log(e)
    console.log(e.stack)
  }
}

main()
