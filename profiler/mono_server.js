import express from 'express';
import pkg from 'stacks-encoding-native-js';
const { decodeTransaction } = pkg;

function makeAndLaunchServer(port) {
  const app = express()
  app.use(express.json({limit: '50mb'}));
  app.use(express.urlencoded({extended: true, limit: '50mb'}));
  app.post('*', (req, res) => {
    var tx_part = ''
    if (req.body.transactions) {
      for (const transaction of req.body.transactions) {
        const decodedTx = decodeTransaction(transaction.raw_tx)
        tx_part += '|||' + JSON.stringify(decodedTx)
      }
    }
    console.log(JSON.stringify(req.params) + ' ' + JSON.stringify(req.body) + tx_part)
    res.sendStatus(200);
  })

  app.listen(port, () => {
    console.log(`${port} Listener started on port ${port}`)
  })
  
  return app
}

makeAndLaunchServer(50303)