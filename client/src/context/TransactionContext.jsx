import { useEffect, useState, createContext } from "react";
import { ethers } from "ethers";
import { contractABI, contractAddress } from "../utils/constants";

export const TransactionContext = createContext();

const { ethereum } = window;

const getEthereumContract = async () => {
  const provider = new ethers.BrowserProvider(ethereum);
  const signer = await provider.getSigner();

  const TransactionContract = new ethers.Contract(
    contractAddress,
    contractABI,
    signer
  );

  return TransactionContract;
}

export const TransactionProvider = ({ children }) => {
  const [currentAccount, setCurrentAccount] = useState(null);
  const [formData, setFormData] = useState({ addressTo: '', amount: '', keyword: '', message: '' });
  const [isLoading, setIsLoading] = useState(false);
  const [transactionCount, setTransactionCount] = useState(localStorage.getItem('transactionCount'));

  const handleChange = (e, name) => {
    setFormData((prevState) => ({ ...prevState, [name]: e.target.value }));
  }

  const checkIfWalletIsConnected = async () => {
    try {

      if (!ethereum) return alert("Please install MetaMask.");

      const accounts = await ethereum.request({ method: "eth_accounts" });

      if(accounts.length) {
        setCurrentAccount(accounts[0]);
        // getAllTransactions();

      } else {
        console.log("No accounts found");
      }
    } catch (error) {

      console.log(error)
      throw new Error("No ethereum object");

    }  
  }

  const connectWallet = async () => {
    try {
      if (!ethereum) return alert("Please install MetaMask.");

      const accounts = await ethereum.request({ method: "eth_requestAccounts" });

      setCurrentAccount(accounts[0]);

    } catch (error) {
      console.log(error)

      throw new Error("No ethereum object");
    }
  }

  const sendTransaction = async () => {
  try {
    if (!ethereum) return alert("Please install MetaMask.");

    const { addressTo, amount, keyword, message } = formData;

    const provider = new ethers.BrowserProvider(ethereum);
    const signer = await provider.getSigner();
    const sender = await signer.getAddress();

    const balance = await provider.getBalance(sender);
    const parsedAmount = ethers.parseEther(amount);

    console.log("Sender:", sender);
    console.log("Balance (ETH):", ethers.formatEther(balance));
    console.log("Amount (ETH):", amount);

    if (balance < parsedAmount) {
      throw new Error("Insufficient balance for transaction");
    }

    const transactionContract = new ethers.Contract(
      contractAddress,
      contractABI,
      signer
    );

    setIsLoading(true);

    const tx = await transactionContract.addToBlockchain(
      addressTo,
      parsedAmount,
      message,
      keyword,
      { value: parsedAmount }
    );

    console.log("Transaction hash:", tx.hash);
    await tx.wait();

    setIsLoading(false);

    const count = await transactionContract.getTransactionCount();
    setTransactionCount(Number(count));

  } catch (error) {
    console.error("Transaction failed:", error);
    setIsLoading(false);
  }
};



  useEffect(() => {
    checkIfWalletIsConnected();
  }, []);

  return (
    <TransactionContext.Provider value={{ connectWallet, currentAccount, formData, setFormData, handleChange, sendTransaction }}>
      {children}
    </TransactionContext.Provider>
  )
}


