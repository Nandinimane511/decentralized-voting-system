const { expect } = require("chai");
const { ethers } = require("hardhat");

describe("Decentralized Voting System (Voting.sol)", function () {
  let voting, owner, voter1, voter2;

  beforeEach(async function () {
    [owner, voter1, voter2] = await ethers.getSigners();
    const Voting = await ethers.getContractFactory("Voting");
    voting = await Voting.deploy();
    await voting.waitForDeployment();
  });

  it("Should allow the owner to add candidates", async function () {
    await voting.addCandidate("Alice", "Party A");
    await voting.addCandidate("Bob", "Party B");

    expect(await voting.getCountCandidates()).to.equal(2);

    const candidate1 = await voting.getCandidate(1);
    expect(candidate1[1]).to.equal("Alice");
    expect(candidate1[2]).to.equal("Party A");
    expect(candidate1[3]).to.equal(0);
  });

  it("Should allow configuring election dates", async function () {
    const start = Math.floor(Date.now() / 1000) - 100;
    const end = start + 3600;
    await voting.setDates(start, end);

    const [savedStart, savedEnd] = await voting.getDates();
    expect(savedStart).to.equal(start);
    expect(savedEnd).to.equal(end);
  });

  it("Should allow casting a vote and increment vote count", async function () {
    await voting.addCandidate("Alice", "Party A");

    // Set active election period
    const start = Math.floor(Date.now() / 1000) - 100;
    const end = start + 3600;
    await voting.setDates(start, end);

    // Voter 1 casts vote
    await voting.connect(voter1).vote(1);

    const candidate = await voting.getCandidate(1);
    expect(candidate[3]).to.equal(1);
    expect(await voting.voters(voter1.address)).to.be.true;
  });

  it("Should PREVENT duplicate voting from the same account", async function () {
    await voting.addCandidate("Alice", "Party A");

    const start = Math.floor(Date.now() / 1000) - 100;
    const end = start + 3600;
    await voting.setDates(start, end);

    await voting.connect(voter1).vote(1);

    // Second vote should revert
    await expect(voting.connect(voter1).vote(1)).to.be.revertedWith("Your account has already voted");
  });
});
