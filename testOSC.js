// const osc = require('node-osc');
// const client = new osc.Client('localhost', 8000); // Replace 8080 with your OSC server port

// client.send('/eos/cue/2/fire', 42); // Send an OSC message to the server


// // Optional: Close the client after a certain period
// setTimeout(() => {
//   client.close();
// }, 5000);


const osc = require('node-osc');
const readline = require('readline');

const client = new osc.Client('localhost', 8000); // Replace 8000 with your OSC server port

const rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout
});

console.log('Type your OSC messages in the format: /address, value');
console.log('Example: /eos/cue/2/fire, 42');

rl.on('line', (input) => {
    const [address, value] = input.split(',').map(item => item.trim());
    if (address && value !== undefined) {
        client.send(address, Number(value));
        console.log(`Sent: ${address}, ${value}`);
    } else if (address) {
        client.send(address);
    } else {
        console.log('Invalid format. Use: /address, value');
    }
});