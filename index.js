const express = require('express')
const app = express()
const port = process.env.PORT || 3000

app.get('/', function (req, res) {
    let ip = req.headers['x-forwarded-for'] || req.ip

    res.set('Content-Type', 'application/json')
    res.send({
        'your-ip': ip
    })
})

app.listen(port, function (err) {
    if(err) {console.log(err)}

    console.log('Running on http://localhost:' + port)
})