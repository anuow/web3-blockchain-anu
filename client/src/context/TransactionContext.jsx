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
  const [Transactions, setTransactions] = useState([]);
  const handleChange = (e, name) => {
    setFormData((prevState) => ({ ...prevState, [name]: e.target.value }));
  }

  const getAllTransactions = async () => {
    try {
      if(!ethereum) return alert("Please install MetaMask.");
      const transactionContract = await getEthereumContract();
      const awailableTransactions = await transactionContract.getAllTransactions();

      const structuredTransactions = awailableTransactions.map((transaction) => ({
        addressTo: transaction.receiver,
        addressFrom: transaction.sender,
        timestamp: new Date(Number(transaction.timestamp) * 1000).toLocaleString(),
        message: transaction.message,
        keyword: transaction.keyword,
        amount: ethers.formatEther(transaction.amount),
      }))

      setTransactions(structuredTransactions)
      console.log(structuredTransactions);

    } catch (error) {
      console.log(error);
    }
  }

  const checkIfWalletIsConnected = async () => {
    try {

      if (!ethereum) return alert("Please install MetaMask.");

      const accounts = await ethereum.request({ method: "eth_accounts" });

      if(accounts.length) {
        setCurrentAccount(accounts[0]);
        getAllTransactions();

      } else {
        console.log("No accounts found");
      }
    } catch (error) {

      console.log(error)
      throw new Error("No ethereum object");

    }  
  }

  const checkITransactionsExists = async () => {
    try {
      const transactionContract = await getEthereumContract();
      const transactionCount = await transactionContract.getTransactionCount();

      window.localStorage.setItem("transactionCount", transactionCount);
    } catch (error) {
      console.log(error);
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

    window.location.reload();


  } catch (error) {
    console.error("Transaction failed:", error);
    setIsLoading(false);
  }
};



  useEffect(() => {
    checkIfWalletIsConnected();
    checkITransactionsExists();
  }, []);

  return (
    <TransactionContext.Provider value={{ connectWallet, currentAccount, formData, setFormData, handleChange, sendTransaction, isLoading, Transactions }}>
      {children}
    </TransactionContext.Provider>
  )
}


