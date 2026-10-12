const express = require('express');
const cors = require('cors');
const path = require('path');

const app = express();
const PORT = process.env.PORT || 8080;

app.use(cors());
app.use(express.json());
app.use(express.static(path.join(__dirname, 'public')));

// Pre-registered users for academic demonstration (Voters and Administrator)
const users = [
  { voterId: 'admin', password: 'password123', role: 'admin', name: 'Election Commission Admin' },
  { voterId: 'voter1', password: 'password123', role: 'voter', name: 'Nandini Mane' },
  { voterId: 'voter2', password: 'password123', role: 'voter', name: 'Tejal Mhatre' },
  { voterId: 'voter3', password: 'password123', role: 'voter', name: 'Amruta Bachhav' },
  { voterId: 'voter4', password: 'password123', role: 'voter', name: 'Student Voter 4' },
];

// Authentication API
app.post('/api/login', (req, res) => {
  const { voterId, password } = req.body;

  if (!voterId || !password) {
    return res.status(400).json({ success: false, message: 'Please enter both Voter ID and Password.' });
  }

  const user = users.find(u => u.voterId.toLowerCase() === voterId.trim().toLowerCase() && u.password === password);

  if (!user) {
    return res.status(401).json({ success: false, message: 'Invalid credentials. Please verify your Voter ID and Password.' });
  }

  // Return user info and simulated auth token/session
  return res.json({
    success: true,
    user: {
      voterId: user.voterId,
      role: user.role,
      name: user.name
    }
  });
});

// Voter registration endpoint (optional)
app.post('/api/register', (req, res) => {
  const { voterId, password, name } = req.body;
  if (!voterId || !password) {
    return res.status(400).json({ success: false, message: 'Missing fields' });
  }

  const exists = users.find(u => u.voterId.toLowerCase() === voterId.trim().toLowerCase());
  if (exists) {
    return res.status(400).json({ success: false, message: 'Voter ID is already registered' });
  }

  users.push({ voterId: voterId.trim(), password, role: 'voter', name: name || 'Registered Voter' });
  return res.json({ success: true, message: 'Voter registered successfully' });
});

// Automatic Faucet to fund MetaMask accounts with Ganache ETH
const { ethers } = require('ethers');
app.post('/api/faucet', async (req, res) => {
  const { address } = req.body;
  if (!address) {
    return res.status(400).json({ success: false, message: 'Address is required' });
  }

  try {
    const provider = new ethers.JsonRpcProvider('http://127.0.0.1:7545');
    const signer = await provider.getSigner(0);
    const tx = await signer.sendTransaction({
      to: address,
      value: ethers.parseEther('10.0')
    });
    await tx.wait();
    console.log(`Successfully sent 10 ETH to ${address}! TxHash: ${tx.hash}`);
    return res.json({ success: true, message: 'Sent 10 ETH', txHash: tx.hash });
  } catch (error) {
    console.error('Faucet error:', error);
    return res.status(500).json({ success: false, message: error.message });
  }
});

// Fallback route for SPA / direct link navigation
app.get('*', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

app.listen(PORT, () => {
  console.log(`=======================================================`);
  console.log(` Decentralized Voting System Server Running!`);
  console.log(` Web Application: http://localhost:${PORT}`);
  console.log(` Default Admin:   admin / password123`);
  console.log(` Sample Voters:   voter1 / password123`);
  console.log(`                  voter2 / password123`);
  console.log(`                  voter3 / password123`);
  console.log(`=======================================================`);
});
