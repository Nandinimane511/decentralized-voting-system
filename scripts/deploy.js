const hre = require("hardhat");
const fs = require("fs");
const path = require("path");

async function main() {
  console.log("Deploying Voting contract...");

  const [deployer] = await hre.ethers.getSigners();
  console.log("Deploying with account:", deployer.address);

  const Voting = await hre.ethers.getContractFactory("Voting");
  const voting = await Voting.deploy();
  await voting.waitForDeployment();

  const contractAddress = await voting.getAddress();
  console.log("Voting contract deployed to:", contractAddress);

  // Optional: Pre-seed sample candidates matching project report demo (BJP, AAP, INC)
  console.log("Seeding initial candidates...");
  await voting.addCandidate("Narendra Modi", "BJP");
  await voting.addCandidate("Arvind Kejriwal", "AAP");
  await voting.addCandidate("Rahul Gandhi", "INC");

  // Set default dates: started today, ends in 7 days
  const now = Math.floor(Date.now() / 1000);
  const sevenDaysLater = now + 7 * 24 * 60 * 60;
  await voting.setDates(now, sevenDaysLater);
  console.log("Election dates configured (active for 7 days).");

  // Export contract address & ABI for frontend
  const artifactPath = path.join(__dirname, "../artifacts/contracts/Voting.sol/Voting.json");
  const artifact = JSON.parse(fs.readFileSync(artifactPath, "utf8"));

  const deployConfig = {
    address: contractAddress,
    abi: artifact.abi,
    deployer: deployer.address,
    network: hre.network.name,
    timestamp: new Date().toISOString()
  };

  const outputDir = path.join(__dirname, "../public");
  if (!fs.existsSync(outputDir)) {
    fs.mkdirSync(outputDir, { recursive: true });
  }

  fs.writeFileSync(
    path.join(outputDir, "contract-config.json"),
    JSON.stringify(deployConfig, null, 2)
  );

  console.log("Saved contract-config.json to public/ directory!");
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
