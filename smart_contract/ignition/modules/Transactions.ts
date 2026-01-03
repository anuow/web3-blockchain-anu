import { buildModule } from "@nomicfoundation/hardhat-ignition/modules";

export default buildModule("TransactionsModuleV2", (m) => {
  const transactions = m.contract("Transactions");
  return { transactions };
});
