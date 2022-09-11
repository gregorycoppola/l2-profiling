const axios = require('axios')

async function generate_block() {

  console.log('generate_block')
  try {
    const generate_result = await axios.post('http://127.0.0.1:18443/', {
      method: "getnewaddress",
      params: [],
      id: 'curltest',
      jsonrpc: '2.0',
    },
    {
      auth: {
        username: 'username',
        password: 'password',  
      }
    })
    console.log({generate_result})

  }
  catch (error) {

    console.log({error, response:error.response, inner_error: error.response.data.error})
  }


}

async function main() {


  generate_block()
}

main()