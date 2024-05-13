import { useState, useEffect } from 'react';
import Web3 from 'web3';
import { AbiItem } from 'web3-utils';

import VotingContractABI from './VotingContractABI.json';

const CONTRACT_ADDRESS = process.env.REACT_APP_CONTRACT_ADDRESS;

const useWeb3 = () => {
  const [web3, setWeb3] = useState<Web3 | null>(null);
  const [contract, setContract] = useState<any>(null);
  const [accounts, setAccounts] = useState<string[]>([]);
  const [isConnected, setIsConnected] = useState<boolean>(false);

  useEffect(() => {
    const initWeb3 = async () => {
      if (window.ethereum) {
        try {
          await window.ethereum.enable();
          const web3Instance = new Web3(window.ethereum);
          setWeb3(web3Instance);
          const accounts = await web3Instance.eth.getAccounts();
          setAccounts(accounts);
          setIsConnected(accounts && accounts.length > 0);
          const contractInstance = new web3Instance.eth.Contract(
            VotingContractABI as AbiItem[], 
            CONTRACT_ADDRESS
          );
          setContract(contractInstance);
        } catch (error) {
          console.error("Error connecting to MetaMask", error);
        }
      } else {
        console.log('Non-Ethereum browser detected. You should consider trying MetaMask!');
      }
    };

    initWeb3();
  }, []);

  const vote = async (candidateId: number) => {
    if (!web3 || !contract || accounts.length === 0) {
      console.log('Web3 is not initialized, contract is not set, or no accounts are connected.');
      return;
    }
    try {
      const receipt = await contract.methods.vote(candidateId).send({ from: accounts[0] });
      console.log('Transaction receipt: ', receipt);
    } catch (error) {
      console.error('Error sending vote transaction', error);
    }
  };

  return { isConnected, accounts, vote };
};

export default useWeb3;