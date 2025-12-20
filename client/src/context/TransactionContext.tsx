import React, { useEffect, useState } from "react";
import {
  ethers,
  BrowserProvider,
  formatEther,
  parseEther,
  toBeHex,
} from "ethers";

import { contractABI, contractAddress } from "../utils/constants";

export type FormData = {
  addressTo: string;
  amount: string;
  keyword: string;
  message: string;
};

type Transaction = {
  addressTo: string;
  addressFrom: string;
  timestamp: string;
  message: string;
  keyword: string;
  amount: number;
};

type TransactionContextType = {
  transactionCount: number | null;
  connectWallet: () => Promise<void>;
  transactions: Transaction[];
  currentAccount: string;
  isLoading: boolean;
  sendTransaction: () => Promise<void>;
  handleChange: (
    e: React.ChangeEvent<HTMLInputElement>,
    name: keyof FormData
  ) => void;
  formData: FormData;
};

export const TransactionContext =
  React.createContext<TransactionContextType | null>(null);

declare global {
  interface Window {
    ethereum?: any;
  }
}

const { ethereum } = window;

const createEthereumContract = async (): Promise<ethers.Contract> => {
  if (!ethereum) {
    throw new Error("Ethereum object not found");
  }
  const provider = new BrowserProvider(ethereum);
  const signer = provider.getSigner();
  const transactionsContract = new ethers.Contract(
    contractAddress,
    contractABI,
    await signer
  );

  return transactionsContract;
};

type ProviderProps = {
  children: React.ReactNode;
};

export const TransactionsProvider = ({ children }: ProviderProps) => {
  const [formData, setFormData] = useState<FormData>({
    addressTo: "",
    amount: "",
    keyword: "",
    message: "",
  });
  const [currentAccount, setCurrentAccount] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [transactionCount, setTransactionCount] = useState<number | null>(
    localStorage.getItem("transactionCount")
      ? Number(localStorage.getItem("transactionCount"))
      : null
  );

  const [transactions, setTransactions] = useState<Transaction[]>([]);

  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement>,
    name: keyof FormData
  ) => {
    setFormData((prev) => ({ ...prev, [name]: e.target.value }));
  };

  const getAllTransactions = async () => {
    try {
      if (ethereum) {
        const transactionsContract = await createEthereumContract();

        const availableTransactions =
          await transactionsContract.getAllTransactions();

        const structuredTransactions: Transaction[] = availableTransactions.map(
          (transaction: any) => ({
            addressTo: transaction.receiver,
            addressFrom: transaction.sender,
            timestamp: new Date(
              transaction.timestamp.toNumber() * 1000
            ).toLocaleString(),
            message: transaction.message,
            keyword: transaction.keyword,
            amount: Number(formatEther(transaction.amount)),
          })
        );

        console.log(structuredTransactions);

        setTransactions(structuredTransactions);
      } else {
        console.log("Ethereum is not present");
      }
    } catch (error) {
      console.log(error);
    }
  };

  const checkIfWalletIsConnected = async () => {
    try {
      if (!ethereum) return alert("Please install MetaMask.");

      const accounts = await ethereum.request({ method: "eth_accounts" });

      if (accounts.length) {
        setCurrentAccount(accounts[0]);

        getAllTransactions();
      } else {
        console.log("No accounts found");
      }
    } catch (error) {
      console.log(error);
    }
  };

  const checkIfTransactionsExists = async () => {
    try {
      if (ethereum) {
        const transactionsContract = await createEthereumContract();
        const currentTransactionCount =
          await transactionsContract.getTransactionCount();

        window.localStorage.setItem(
          "transactionCount",
          currentTransactionCount.toString()
        );
      }
    } catch (error) {
      console.log(error);

      throw new Error("No ethereum object");
    }
  };

  const connectWallet = async () => {
    try {
      if (!ethereum) return alert("Please install MetaMask.");

      const accounts = await ethereum.request({
        method: "eth_requestAccounts",
      });

      setCurrentAccount(accounts[0]);
      window.location.reload();
    } catch (error) {
      console.log(error);

      throw new Error("No ethereum object");
    }
  };

  const sendTransaction = async () => {
    try {
      if (ethereum) {
        const { addressTo, amount, keyword, message } = formData;
        const transactionsContract = await createEthereumContract();
        const parsedAmount = parseEther(amount);

        await ethereum.request({
          method: "eth_sendTransaction",
          params: [
            {
              from: currentAccount,
              to: addressTo,
              gas: "0x5208",
              value: toBeHex(parsedAmount),
            },
          ],
        });

        const transactionHash = await transactionsContract.addToBlockchain(
          addressTo,
          parsedAmount,
          message,
          keyword
        );

        setIsLoading(true);
        console.log(`Loading - ${transactionHash.hash}`);
        await transactionHash.wait();
        console.log(`Success - ${transactionHash.hash}`);
        setIsLoading(false);

        const transactionsCount =
          await transactionsContract.getTransactionCount();

        setTransactionCount(transactionsCount.toNumber());
        window.location.reload();
      } else {
        console.log("No ethereum object");
      }
    } catch (error) {
      console.log(error);

      throw new Error("No ethereum object");
    }
  };

  useEffect(() => {
    checkIfWalletIsConnected();
    checkIfTransactionsExists();
  }, []);

  return (
    <TransactionContext.Provider
      value={{
        transactionCount,
        connectWallet,
        transactions,
        currentAccount,
        isLoading,
        sendTransaction,
        handleChange,
        formData,
      }}
    >
      {children}
    </TransactionContext.Provider>
  );
};
