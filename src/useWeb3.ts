import { useState, useEffect } from 'react';
import Web3 from 'web3';
import { AbiItem } from 'web3-utils';

import votingContractABI from './VotingContractABI.json';

const VOTING_CONTRACT_ADDRESS = process.env.REACT_APP_CONTRACT_ADDRESS;

const useVoting = () => {
  const [web3, setWeb3] = useState<Web3 | null>(null);
  const [votingContractInstance, setVotingContractInstance] = useState<any>(null);
  const [connectedAccounts, setConnectedAccounts] = useState<string[]>([]);
  const [isConnectedToWeb3, setIsConnectedToWeb3] = useState<boolean>(false);

  useEffect(() => {
    const setupWeb3Connection = async () => {
      if (window.ethereum) {
        try {
          // Request account access
          await window.ethereum.request({ method: 'eth_requestAccounts' });
          const web3Instance = new Web3(window.ethereum);
          setWeb3(web3Instance);
          const accounts = await web3Instance.eth.getAccounts();
          setConnectedAccounts(accounts);
          setIsConnectedToWeb3(accounts.length > 0);
          const contractInstance = new web3Instance.eth.Contract(
            votingContractABI as AbiItem[], 
            VOTING_CONTRACT_ADDRESS
          );
          setVotingContractInstance(contractInstance);
        } catch (error) {
          console.error("Failed to establish connection with MetaMask", error);
        }
      } else {
        console.log('Missing web3 provider. Please consider using MetaMask or another web3 wallet.');
      }
    };

    setupWeb3Connection();
  }, []);

  const castVote = async (candidateId: number) => {
    if (!web3 || !votingContractInstance || connectedAccounts.length === 0) {
      console.log('Connection to web3 is not established, contract not initialized, or no accounts connected.');
      return;
    }
    try {
      const voteReceipt = await votingContractInstance.methods.vote(candidateId).send({ from: connectedAccounts[0] });
      console.log('Vote transaction receipt: ', voteReceipt);
    } catch (error) {
      console.error('Error executing vote transaction', error);
    }
  };

  return { isConnectedToWeb3, connectedAccounts, castVote };
};

export default useVoting;