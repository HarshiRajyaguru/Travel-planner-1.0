const fs   = require('fs')
const path = require('path')

const FILE = path.join(__dirname, 'data.json')

function read() {
  try {
    return JSON.parse(fs.readFileSync(FILE, 'utf-8'))
  } catch {
    return { trips: [], nextId: 1 }
  }
}

function write(data) {
  fs.writeFileSync(FILE, JSON.stringify(data, null, 2))
}

module.exports = { read, write }
