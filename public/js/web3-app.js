// Web3 and Smart Contract Bridge using Ethers.js
let provider = null;
let signer = null;
let votingContract = null;
let userAddress = null;
let contractConfig = null;

// Initialize on page load
window.addEventListener('DOMContentLoaded', async () => {
  // Authentication check
  const userRole = localStorage.getItem('user_role');
  if (!userRole) {
    window.location.href = 'index.html';
    return;
  }

  // Admin page restriction check
  if (window.location.pathname.includes('admin.html') && userRole !== 'admin') {
    alert('Access Denied: Only administrators can access this page.');
    window.location.href = 'dashboard.html';
    return;
  }

  await loadContractConfig();
  await initWeb3();
});

// Load Deployed Contract ABI and Address
async function loadContractConfig() {
  try {
    const res = await fetch('/contract-config.json');
    if (res.ok) {
      contractConfig = await res.json();
    } else {
      console.warn("contract-config.json not found yet. Using placeholder until contract deployment.");
    }
  } catch (err) {
    console.warn("Could not load contract-config.json:", err);
  }
}

// Initialize MetaMask / Ethereum Provider
async function initWeb3() {
  const walletBadge = document.getElementById('walletBadge');
  const walletAddressEl = document.getElementById('walletAddress');
  const walletDot = document.getElementById('walletDot');
  const connectBtn = document.getElementById('connectWalletBtn');

  if (typeof window.ethereum === 'undefined') {
    if (walletAddressEl) walletAddressEl.innerText = 'MetaMask Not Detected';
    if (walletDot) walletDot.style.backgroundColor = '#ef4444';
    if (connectBtn) {
      connectBtn.innerText = 'Install MetaMask';
      connectBtn.style.display = 'inline-block';
      connectBtn.onclick = () => window.open('https://metamask.io/download/', '_blank');
    }
    showAlert('MetaMask extension is required to interact with the blockchain. Please install MetaMask.', 'error');
    return;
  }

  try {
    provider = new ethers.BrowserProvider(window.ethereum);

    // Prompt user to switch or add Ganache Local network automatically
    try {
      await window.ethereum.request({
        method: 'wallet_switchEthereumChain',
        params: [{ chainId: '0x539' }], // 1337 in hex
      });
    } catch (switchError) {
      if (switchError.code === 4902 || switchError.message?.includes('Unrecognized') || switchError.code === -32603) {
        try {
          await window.ethereum.request({
            method: 'wallet_addEthereumChain',
            params: [{
              chainId: '0x539',
              chainName: 'Ganache Local',
              rpcUrls: ['http://127.0.0.1:7545'],
              nativeCurrency: { name: 'ETH', symbol: 'ETH', decimals: 18 }
            }]
          });
        } catch (addError) {
          console.warn('Could not auto-add Ganache network:', addError);
        }
      }
    }
    
    // Request accounts
    const accounts = await provider.send("eth_requestAccounts", []);
    if (accounts.length > 0) {
      userAddress = accounts[0];
      signer = await provider.getSigner();

      // Check balance, auto-fund with 10 ETH from Ganache faucet if below 0.05 ETH
      try {
        const balance = await provider.getBalance(userAddress);
        if (balance < ethers.parseEther("0.05")) {
          console.log("Low balance. Requesting 10 ETH from Ganache faucet for", userAddress);
          await fetch('/api/faucet', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ address: userAddress })
          });
        }
      } catch (faucetErr) {
        console.warn("Auto-faucet error:", faucetErr);
      }

      if (walletAddressEl) {
        walletAddressEl.innerText = `${userAddress.substring(0, 6)}...${userAddress.substring(userAddress.length - 4)}`;
        walletAddressEl.title = userAddress;
      }
      if (walletDot) walletDot.style.backgroundColor = '#10b981';
      if (connectBtn) connectBtn.style.display = 'none';

      // Setup Contract Instance
      if (contractConfig && contractConfig.address) {
        votingContract = new ethers.Contract(contractConfig.address, contractConfig.abi, signer);
        await refreshElectionData();
      } else {
        showAlert('Contract not deployed yet. Please run deployment script first.', 'waiting');
      }
    }
  } catch (error) {
    console.error('Wallet connection error:', error);
    if (walletAddressEl) walletAddressEl.innerText = 'Wallet Disconnected';
    if (walletDot) walletDot.style.backgroundColor = '#ef4444';
    showAlert('MetaMask connection rejected. Please connect your wallet.', 'error');
  }

  // Listen for account changes
  if (window.ethereum) {
    window.ethereum.on('accountsChanged', (accounts) => {
      window.location.reload();
    });
    window.ethereum.on('chainChanged', () => {
      window.location.reload();
    });
  }
}

// Refresh live data from smart contract
async function refreshElectionData() {
  if (!votingContract) return;

  try {
    // 1. Fetch Election Dates (matching contract.getDates())
    await loadElectionDates();

    // 2. Fetch Candidates
    if (document.getElementById('candidateTableBody')) {
      await loadVoterCandidates();
    }
    if (document.getElementById('adminCandidateTableBody')) {
      await loadAdminCandidates();
    }
  } catch (err) {
    console.error('Error refreshing election data:', err);
  }
}

// Load Election Schedule
async function loadElectionDates() {
  const datesEl = document.getElementById('scheduleDates');
  const subEl = document.getElementById('scheduleSub');
  if (!datesEl) return;

  try {
    const [startBig, endBig] = await votingContract.getDates();
    const start = Number(startBig);
    const end = Number(endBig);

    if (start === 0 && end === 0) {
      datesEl.innerText = 'Election schedule has not been configured yet.';
      return;
    }

    const startDate = new Date(start * 1000);
    const endDate = new Date(end * 1000);

    const options = { weekday: 'short', month: 'short', day: 'numeric', year: 'numeric' };
    datesEl.innerText = `${startDate.toLocaleDateString('en-US', options)} - ${endDate.toLocaleDateString('en-US', options)}`;
    
    if (subEl) {
      subEl.innerText = `Election dates saved: ${startDate.toLocaleDateString()} to ${endDate.toLocaleDateString()}`;
    }

    // Pre-populate admin date pickers if on admin page
    const startInput = document.getElementById('startDate');
    const endInput = document.getElementById('endDate');
    if (startInput && endInput && !startInput.value) {
      const toLocalISO = (d) => new Date(d.getTime() - d.getTimezoneOffset() * 60000).toISOString().slice(0, 16);
      startInput.value = toLocalISO(startDate);
      endInput.value = toLocalISO(endDate);
    }
  } catch (err) {
    console.error('Failed to get dates:', err);
    datesEl.innerText = 'Could not load dates from smart contract.';
  }
}

// Load Candidates on Voter Portal
async function loadVoterCandidates() {
  const tbody = document.getElementById('candidateTableBody');
  const castVoteBtn = document.getElementById('castVoteBtn');
  if (!tbody) return;

  try {
    // Check if voter has already voted
    let hasVoted = false;
    if (userAddress) {
      hasVoted = await votingContract.voters(userAddress);
    }

    const countBig = await votingContract.getCountCandidates();
    const count = Number(countBig);

    if (count === 0) {
      tbody.innerHTML = `<tr><td colspan="4" style="text-align:center; padding: 24px; color: #94a3b8;">No candidates registered yet. Please check back later.</td></tr>`;
      return;
    }

    let rowsHtml = '';
    let totalVotes = 0;
    const candidatesList = [];

    for (let i = 1; i <= count; i++) {
      const candidate = await votingContract.getCandidate(i);
      const id = Number(candidate[0]);
      const name = candidate[1];
      const party = candidate[2];
      const votes = Number(candidate[3]);

      totalVotes += votes;
      candidatesList.push({ id, name, party, votes });

      rowsHtml += `
        <tr>
          <td>
            <input type="radio" name="candidateSelection" value="${id}" class="radio-select" ${hasVoted ? 'disabled' : ''}>
          </td>
          <td><strong>${name}</strong></td>
          <td>${party}</td>
          <td>${votes}</td>
        </tr>
      `;
    }
    tbody.innerHTML = rowsHtml;

    // Render Live Results Breakdown with Progress Bars
    renderResultsAnalytics(candidatesList, totalVotes);

    // Enable/disable vote button based on state
    if (hasVoted) {
      showAlert('Your account has already voted.', 'waiting');
      if (castVoteBtn) castVoteBtn.disabled = true;
    } else {
      // Listen to radio selection to enable vote button
      const radios = document.querySelectorAll('input[name="candidateSelection"]');
      radios.forEach(r => {
        r.addEventListener('change', () => {
          if (castVoteBtn) castVoteBtn.disabled = false;
        });
      });
    }
  } catch (err) {
    console.error('Failed to load voter candidates:', err);
    tbody.innerHTML = `<tr><td colspan="4" style="text-align:center; color: #ef4444;">Failed to read candidates from blockchain.</td></tr>`;
  }
}

// Cast Vote Action
const castVoteBtn = document.getElementById('castVoteBtn');
if (castVoteBtn) {
  castVoteBtn.addEventListener('click', async () => {
    const selected = document.querySelector('input[name="candidateSelection"]:checked');
    if (!selected) {
      alert('Please select a candidate first.');
      return;
    }

    const candidateId = Number(selected.value);
    castVoteBtn.disabled = true;
    showAlert('Waiting for your MetaMask transaction confirmation...', 'waiting');

    try {
      const tx = await votingContract.vote(candidateId);
      showAlert(`Transaction submitted! Hash: ${tx.hash.substring(0, 16)}... Confirming on blockchain...`, 'waiting');

      await tx.wait();
      showAlert('Vote successfully recorded on the blockchain!', 'success');
      await refreshElectionData();
    } catch (err) {
      console.error('Voting error:', err);
      const reason = err.reason || err.message || 'Transaction rejected or failed';
      showAlert(`Vote failed: ${reason}`, 'error');
      castVoteBtn.disabled = false;
    }
  });
}

// Load Candidates on Admin Portal
async function loadAdminCandidates() {
  const tbody = document.getElementById('adminCandidateTableBody');
  if (!tbody) return;

  try {
    const countBig = await votingContract.getCountCandidates();
    const count = Number(countBig);

    if (count === 0) {
      tbody.innerHTML = `<tr><td colspan="4" style="text-align:center; padding: 20px; color: #94a3b8;">No candidates added yet. Use form above to add candidates.</td></tr>`;
      return;
    }

    let rowsHtml = '';
    let totalVotes = 0;
    const candidatesList = [];

    for (let i = 1; i <= count; i++) {
      const candidate = await votingContract.getCandidate(i);
      const id = Number(candidate[0]);
      const name = candidate[1];
      const party = candidate[2];
      const votes = Number(candidate[3]);

      totalVotes += votes;
      candidatesList.push({ id, name, party, votes });

      rowsHtml += `
        <tr>
          <td><strong>${id}</strong></td>
          <td>${name}</td>
          <td>${party}</td>
          <td><span style="font-weight: 700; color: #2563eb;">${votes}</span></td>
        </tr>
      `;
    }
    tbody.innerHTML = rowsHtml;

    // Render analytics on admin page too
    renderResultsAnalytics(candidatesList, totalVotes);
  } catch (err) {
    console.error('Failed to load admin candidates:', err);
    tbody.innerHTML = `<tr><td colspan="4" style="text-align:center; color: #ef4444;">Failed to read candidates from blockchain.</td></tr>`;
  }
}

// Admin: Add Candidate
const addCandidateForm = document.getElementById('addCandidateForm');
if (addCandidateForm) {
  addCandidateForm.addEventListener('submit', async (e) => {
    e.preventDefault();
    const name = document.getElementById('candidateName').value.trim();
    const party = document.getElementById('partyName').value.trim();
    const btn = document.getElementById('addCandidateBtn');

    if (!name || !party) return;

    btn.disabled = true;
    btn.innerText = 'Submitting to Blockchain...';
    showAlert('Please confirm candidate addition in MetaMask...', 'waiting');

    try {
      const tx = await votingContract.addCandidate(name, party);
      await tx.wait();
      showAlert(`Candidate "${name}" (${party}) successfully registered on blockchain!`, 'success');
      addCandidateForm.reset();
      await loadAdminCandidates();
    } catch (err) {
      console.error('Add candidate error:', err);
      showAlert(`Error: ${err.reason || err.message}`, 'error');
    } finally {
      btn.disabled = false;
      btn.innerText = 'Add Candidate';
    }
  });
}

// Admin: Define Voting Dates
const setDatesForm = document.getElementById('setDatesForm');
if (setDatesForm) {
  setDatesForm.addEventListener('submit', async (e) => {
    e.preventDefault();
    const startVal = document.getElementById('startDate').value;
    const endVal = document.getElementById('endDate').value;
    const btn = document.getElementById('setDatesBtn');

    if (!startVal || !endVal) return;

    const startTimestamp = Math.floor(new Date(startVal).getTime() / 1000);
    const endTimestamp = Math.floor(new Date(endVal).getTime() / 1000);

    if (endTimestamp <= startTimestamp) {
      alert('End date must be after start date!');
      return;
    }

    btn.disabled = true;
    btn.innerText = 'Saving on Blockchain...';
    showAlert('Please confirm election dates transaction in MetaMask...', 'waiting');

    try {
      const tx = await votingContract.setDates(startTimestamp, endTimestamp);
      await tx.wait();
      showAlert('Election dates successfully configured on the smart contract!', 'success');
    } catch (err) {
      console.error('Set dates error:', err);
      showAlert(`Error: ${err.reason || err.message}`, 'error');
    } finally {
      btn.disabled = false;
      btn.innerText = 'Save Election Dates';
    }
  });
}

// Refresh button on Admin table
const refreshBtn = document.getElementById('refreshBtn');
if (refreshBtn) {
  refreshBtn.addEventListener('click', async () => {
    await refreshElectionData();
  });
}

// Render Live Election Results & Analytics with Progress Bars
function renderResultsAnalytics(candidates, totalVotes) {
  const container = document.getElementById('resultsBarsContainer');
  const totalBadge = document.getElementById('totalVotesBadge');
  const leaderBanner = document.getElementById('resultsLeaderBanner');
  const leaderName = document.getElementById('leaderName');
  const leaderParty = document.getElementById('leaderParty');
  const leaderVotes = document.getElementById('leaderVotes');

  if (!container) return;

  if (totalBadge) {
    totalBadge.innerText = `Total Votes Cast: ${totalVotes}`;
  }

  if (candidates.length === 0) {
    container.innerHTML = '<p style="color: #94a3b8; font-size: 13px;">No candidate votes to display.</p>';
    return;
  }

  // Find leader
  const sorted = [...candidates].sort((a, b) => b.votes - a.votes);
  const leader = sorted[0];

  if (leaderBanner && leader && totalVotes > 0 && leader.votes > 0) {
    leaderBanner.style.display = 'block';
    leaderName.innerText = leader.name;
    leaderParty.innerText = `(${leader.party})`;
    leaderVotes.innerText = `Leading with ${leader.votes} vote${leader.votes > 1 ? 's' : ''}!`;
  } else if (leaderBanner) {
    leaderBanner.style.display = 'none';
  }

  let html = '';
  candidates.forEach(c => {
    const percentage = totalVotes > 0 ? ((c.votes / totalVotes) * 100).toFixed(1) : 0;
    html += `
      <div class="result-row">
        <div class="result-header">
          <span>${c.name} <span class="result-meta">(${c.party})</span></span>
          <span><strong>${c.votes} votes</strong> <span class="result-meta">(${percentage}%)</span></span>
        </div>
        <div class="result-bar-bg">
          <div class="result-bar-fill" style="width: ${percentage}%;"></div>
        </div>
      </div>
    `;
  });

  container.innerHTML = html;
}

// Utility: Show Alert
function showAlert(message, type) {
  const alertEl = document.getElementById('statusAlert') || document.getElementById('adminAlert');
  if (!alertEl) return;

  alertEl.style.display = 'block';
  alertEl.className = 'status-message';
  if (type === 'waiting') alertEl.classList.add('status-waiting');
  else if (type === 'success') alertEl.classList.add('status-success');
  else if (type === 'error') alertEl.classList.add('status-error');

  alertEl.innerText = message;
}
