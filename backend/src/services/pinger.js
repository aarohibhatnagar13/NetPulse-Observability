const axios = require('axios');
const net = require('net');
async function checkHttp(url) 
{
  const startTime = Date.now();
    try
    {
    const response = await axios.get(url, {
    timeout: 5000 });
    const endTime = Date.now();
    const latency = endTime - startTime;
    console.log(`Latency: ${latency} ms`);
    return { 
        status: 'up',
        latency: latency
        };
    
  
   }

   catch(error)
   {
        return { 
            status:'down', 
            latency:null
        }
    }
  
}

async function checkTcp(host, port) {
  return new Promise((resolve) => {

    // Start stopwatch
    const startTime = Date.now();

    // Create TCP socket
    const socket = new net.Socket();

    // Timeout after 5 seconds
    socket.setTimeout(5000);

    // Attempt connection
    socket.connect(port, host, () => {

      // Connection successful
      const endTime = Date.now();
      const latency = endTime - startTime;

      socket.destroy();

      resolve({ // resolve is the return in a Promise
                // when a promise is complete return the thing menitoned in reoslve
        status: 'up',
        latency: latency
      });
    });

    // Connection failed
    socket.on('error', (err) => {

      socket.destroy();

      resolve({
        status: 'down',
        latency: null
      });
    });

    // Connection timed out
    socket.on('timeout', () => {

      socket.destroy();

      resolve({
        status: 'down',
        latency: null
      });
    });

  });
}
module.exports = {checkHttp,checkTcp};