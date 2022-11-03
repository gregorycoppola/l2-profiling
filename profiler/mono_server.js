// const express = require('express')
import express from 'express';

import {
  info_log,
} from './logger.js';


function makeServer(port) {
  const app = express()
  app.use(express.json({limit: '50mb'}));
  app.use(express.urlencoded({extended: true, limit: '50mb'}));
  app.post('*', (req, res) => {
    // console.log(JSON.stringify(req.query))
    console.log(JSON.stringify(req.params) + ' ' + JSON.stringify(req.body))
    res.sendStatus(200);
  })

  app.listen(port, () => {
    info_log(`${port} Listener started on port ${port}`)
  })
  
  return app
}

let server = makeServer(50303)