const express = require('express')
const app = express()
const port = process.env.PORT || 3000

const redis = require('redis')
const redisClient = redis.createClient()
redisClient.on('error', (err) => {console.log('Redis ' + err)})
const redisConnect = async () => {redisClient.connect()}; redisConnect();

app.use(express.json())

app.get('/hit', async function (req, res) {
    let ip = req.headers['x-forwarded-for'] || req.ip

    if((await redisClient.keys(ip)).length == 0) {
        await redisClient.hSet(ip, 'value', ip)
        await redisClient.hSet(ip, 'times-hit', 1)
    }
    else {
        redisClient.hIncrBy(ip, 'times-hit', 1)
    }
    
    res.set('Content-Type', 'application/json')
    res.send(JSON.stringify({
        'your-ip': ip,
        'times-hit': await redisClient.hGet(ip, 'times-hit')
    }, null, 4))
})

app.get('/ips', async function (req, res) {
    const hashes = await redisClient.keys('*')
    const ipsAndHits = []
    for(let i = 0; i < hashes.length; i++) {
        ipsAndHits.push({
            'ip': await redisClient.hGet(hashes[i], 'value'),
            'times-hit': await redisClient.hGet(hashes[i], 'times-hit'),
        })
    }
    
    res.set('Content-Type', 'application/json')
    res.send(JSON.stringify(ipsAndHits, null, 4))
})

app.get('/ip/:ip', async function (req, res) {
    const ip = req.params.ip

    res.set('Content-Type', 'application/json')
    res.send(JSON.stringify({
        'ip': await redisClient.hGet(ip, 'value'),
        'times-hit': await redisClient.hGet(ip, 'times-hit')
    }, null, 4))
})

app.get('/stats', async function (req, res) {
    const ips = await redisClient.keys('*')
    let hitsCount = 0
    for(let i = 0; i < ips.length; i++) {
        hitsCount += parseInt(await redisClient.hGet(ips[i], 'times-hit'))
    }
    const uniqueHitsCount = ips.length

    res.set('Content-Type', 'application/json')
    res.send(JSON.stringify({
        'total-hits': hitsCount,
        'unique-hits': uniqueHitsCount,
        'unique-hits-percent': (uniqueHitsCount/hitsCount) * 100 + '%'
    }, null, 4))
})

app.post('/load', async function (req, res) {
    const dataFromJson = require(req.body['path'])
    let ips = []
    let timesHit = []
    dataFromJson.forEach((data) => {
        ips.push(data.ip)
        timesHit.push(data['times-hit'])
    });

    for(let i = 0; i < ips.length; i++) {
        redisClient.hSet(ips[i], 'value', ips[i])
        redisClient.hSet(ips[i], 'times-hit', timesHit[i])
    }

    res.send('Data loaded')
})

app.listen(port, function (err) {
    if(err) {console.log(err)}

    console.log('Running on http://localhost:' + port)
})