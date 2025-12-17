import { network } from "hardhat";

const main = async () => {
  const { ethers } = await network.connect();

  const Transactions = await ethers.getContractFactory("Transactions");
  const transactions = await Transactions.deploy();

  await transactions.waitForDeployment();

  console.log(
    "Transactions deployed to:",
    await transactions.getAddress()
  );
};

const runMain = async () => {
  try {
    await main();
    process.exit(0);
  } catch (error) {
    console.error(error);
    process.exit(1);
  }
};

runMain();
