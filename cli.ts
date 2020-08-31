const Stats = require('./src').default
const fs = require('fs')

const dbLocation = process.argv[2]
const stateRoot = process.argv[3]
const stats = new Stats(dbLocation, stateRoot)

stats.start().then(results => {
    fs.writeFileSync('data.json', JSON.stringify(results))
})