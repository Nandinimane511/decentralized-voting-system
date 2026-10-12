# Decentralized Voting System Using Ethereum Blockchain

A secure, verifiable, and transparent electronic voting system built with Ethereum smart contracts, Web3, Express.js, and MetaMask.

---

## 📋 Project Overview
- **Smart Contract:** `contracts/Voting.sol` (written in Solidity 0.8.20)
- **Local Blockchain:** Ganache (RPC Server: `http://127.0.0.1:7545`, Network ID: `5777` or `1337`) or Hardhat Local Node (`http://127.0.0.1:8545`)
- **Backend API:** Node.js + Express.js (Port `8080`)
- **Frontend:** Vanilla HTML5, CSS3, JavaScript (Ethers.js v6)
- **Wallet Integration:** MetaMask browser extension

---

## 🚀 Quick Step-by-Step Installation Guide

### Step 1: Install Prerequisites
1. **Node.js** (v18+ or v22+) - *Already installed on your system!*
2. **Ganache** (Download Ganache GUI from [trufflesuite.com/ganache](https://trufflesuite.com/ganache/) or use built-in CLI)
3. **MetaMask Extension** (Install in Google Chrome, Brave, or Edge from [metamask.io](https://metamask.io))

---

### Step 2: Open Ganache (Local Blockchain)
1. Open Ganache GUI.
2. Click **"Quickstart"** (Ethereum).
3. Confirm the RPC Server is running on **`HTTP://127.0.0.1:7545`** (Network ID: 5777).
4. Ganache will display 10 test accounts, each funded with 100 fake ETH.

---

### Step 3: Configure MetaMask
1. Open your MetaMask browser extension.
2. Click the network dropdown (top left) → **Add Network** → **Add a network manually**:
   - **Network Name:** `Ganache Local`
   - **New RPC URL:** `http://127.0.0.1:7545`
   - **Chain ID:** `1337` (or `5777` if prompted)
   - **Currency Symbol:** `ETH`
3. Click **Save** and switch to `Ganache Local`.
4. Import an Account:
   - In Ganache, click the **key icon** 🔑 next to the first account (Account 0).
   - Copy the **Private Key**.
   - In MetaMask, click Account selector → **Add account or hardware wallet** → **Import account** → Paste the Private Key.
   - You should now see ~100 ETH in MetaMask!

---

### Step 4: Compile & Deploy Smart Contract
From this project folder in terminal:
```bash
# 1. Compile Solidity smart contract
npm run compile

# 2. Deploy to Ganache
npm run deploy:ganache
```
*Note: This automatically deploys the contract and generates `public/contract-config.json` containing the contract address and ABI.*

---

### Step 5: Start the Web Application
```bash
npm start
```
The application will start on: **`http://localhost:8080`**

---

## 👥 Default Credentials for Demo Testing

| Role | Voter ID | Password | Access Rights |
| :--- | :--- | :--- | :--- |
| **Administrator** | `admin` | `password123` | Add candidates, set voting dates, view live count |
| **Voter 1** | `voter1` | `password123` | View ballot, cast vote via MetaMask |
| **Voter 2** | `voter2` | `password123` | View ballot, cast vote via MetaMask |
| **Voter 3** | `voter3` | `password123` | View ballot, cast vote via MetaMask |

---

## 🛡️ Key Blockchain Security Features
- **One Vote Per Blockchain Address:** Enforced by `mapping(address => bool) public voters` in Solidity.
- **Time Validation:** Votes can only be cast within the admin-defined `startDate` and `endDate`.
- **Tamper-Proof Audit Trail:** All votes are permanently registered as transactions on the Ethereum blockchain.
- **Role-Based Portals:** Separate login sessions for Election Administrators and Voters.
