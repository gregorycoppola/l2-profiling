// const express = require('express')
import express from 'express';

import {
  info_log,
} from './logger.js';

import {
  deserializeTransaction,
} from '@stacks/transactions';

export class Observer {
  constructor(port) {
    this.port = port
    this.transactions_seen = []
    this.transaction_id_set = new Set()
    this.show_mempool_alerts = true
  }
  transactions_seen_fn() {
    return this.transactions_seen
  }
  transactions_id_set() {
    return this.transaction_id_set
  }
  get_port() {
    return this.port
  }
  stop_showing_mempool_alerts() {
    info_log(`${this.port} will stop showing mempool alerts`)
    this.show_mempool_alerts = false
  }
  makeServer() {
    const app = express()
    app.use(express.json({limit: '50mb'}));
    app.use(express.urlencoded({limit: '50mb'}));
  
    var blocks_seen = 0
  
    app.post('/new_block', (req, res) => {
      blocks_seen += 1
  
      const transactions = req.body.transactions
  
      var this_txids = []
      for (let i = 0; i < transactions.length; i++) {
        const transaction = transactions[i]
        this.transactions_seen.push(transaction)
        this.transaction_id_set.add(transaction.txid)
        this_txids.push(transaction.txid)
      }
  
      // don't print out more than 10 transactions
      const this_txids_length_string = this_txids.length > 10 ? '' : this_txids.toString();
      info_log(`${this.port} /new_block: #txs=${this_txids.length} txids=${this_txids_length_string}`)
      res.sendStatus(200);
    })
  
    app.post('/new_burn_block', (req, res) => {
      info_log(`${this.port} /new_burn_block`)
      res.sendStatus(200);
    })
  
    app.post('/new_mempool_tx', (req, res) => {
      if (this.show_mempool_alerts) {
        info_log(`${this.port} /new_mempool_tx`)
      }
      res.sendStatus(200);
    })
  
    app.post('/drop_mempool_tx', (req, res) => {
      info_log(`${this.port} /drop_mempool_tx`)
      res.sendStatus(200);
    })
  
    app.listen(this.port, () => {
      info_log(`${this.port} Listener started on port ${this.port}`)
    })
    
    return app
  }
}

