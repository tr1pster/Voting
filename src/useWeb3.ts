import { useState, useEffect } from 'react';
import Web3 from 'web3';
import { AbiItem } from 'web3-utils';

import votingContractABI from './VotingContractABI.json';

const VOTING_CONTRACT_ADDRESS = process.env.REACT_APP_CONTRACT_ADDRESS;

const useVotingWeb3 = () => {
  const [web3Instance, setWeb3Instance] = useState<Web3 | null>(null);
  const [votingContract, setVotingContract] = useState<any>(null);
  const [userAccounts, setUserAccounts] = useState<string[]>([]);
  const [isWeb3Connected, setIsWeb3Connected] = useState<boolean>(false);

  useEffect(() => {
    const initializeWeb3 = async () => {
      if (window.ethereum) {
        try {
          await window.ethereum.enable();
          const instantiatedWeb3 = new Web3(window.ethereum);
          setWeb3Instance(instantiatedWeb3);
          const retrievedAccounts = await instantiatedWeb3.eth.getAccounts();
          setUserAccounts(retrievedAccounts);
          setIsWeb3Connected(retrievedAccounts && retrievedAccounts.length > 0);
          const instantiatedContract = new instantiatedWeb3.eth.Contract(
            votingContractABI as AbiItem[], 
            VOTING_CONTRACT_ADDRESS
          );
          setVotingContract(instantiatedContract);
        } catch (error) {
          console.error("Failed to connect to MetaMask", error);
        }
      } else {
        console.log('Please use a web3-enabled browser like MetaMask!');
      }
    };

    initializeWeb3();
  }, []);

  const submitVote = async (candidateId: number) => {
    if (!web3Instance || !votingContract || userAccounts.length === 0) {
      console.log('Web3 has not been initialized, the contract is not set, or no accounts are connected.');
      return;
    }
    try {
      const transactionReceipt = await votingContract.methods.vote(candidateId).send({ from: userAccounts[0] });
      console.log('Transaction receipt: ', transactionReceipt);
    } catch (error) {
      console.error('Failed to send vote transaction', error);
    }
  };

  return { isWeb3Connected, userAccounts, submitVote };
};

export default useVotingWeb3;