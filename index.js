const express = require('express')
const app = express()
const port = process.env.PORT || 3000

const redis = require('redis')
const redisClient = redis.createClient()
redisClient.on('error', (err) => {console.log('Redis ' + err)})
const redisConnect = async () => {redisClient.connect()}; redisConnect();

app.get('/', async function (req, res) {
    let ip = req.headers['x-forwarded-for'] || req.ip

    if((await redisClient.keys(ip)).length == 0) {
        await redisClient.hSet(ip, 'value', ip)
        await redisClient.hSet(ip, 'times-hit', 1)
    }
    else {
        redisClient.hIncrBy(ip, 'times-hit', 1)
    }
    
    res.set('Content-Type', 'application/json')
    res.send({
        'your-ip': ip,
        'times-hit': await redisClient.hGet(ip, 'times-hit')
    })
})

app.listen(port, function (err) {
    if(err) {console.log(err)}

    console.log('Running on http://localhost:' + port)
})