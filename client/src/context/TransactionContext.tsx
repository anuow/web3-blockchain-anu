import React, { useEffect, useState, type PropsWithChildren } from "react";
import { ethers } from "ethers";

import { contractABI, contractAddress } from "../utils/constants";

export const TransactionContext = React.createContext<any>(null);

const { ethereum } = window as any;

const getEthereumContract = async () => {
  const provider = new ethers.BrowserProvider(ethereum);
  const signer = await provider.getSigner();

  const transactionContract = new ethers.Contract(
    contractAddress,
    contractABI,
    signer
  );

  console.log({ provider, signer, transactionContract });
};

export const TransactionProvider = ({ children }: PropsWithChildren) => {
  return (
    <TransactionContext.Provider value={{}}>
      {children}
    </TransactionContext.Provider>
  );
};
