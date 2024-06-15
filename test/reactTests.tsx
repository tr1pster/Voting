import React, { useState } from 'react';
import { ethers } from 'ethers';

const MyComponent = () => {
  const [voteTotal, setVoteTotal] = useState({ method1: 0, method2: 0 });

  const getContract = () => {
    const provider = new ethers.providers.JsonRpcProvider(process.env.REACT_APP_BLOCKCHAIN_URL);
    const contract = new ethers.Contract(
      "YOUR_CONTRACT_ADDRESS", // Replace this with your actual contract address
      ["function myMethod() public view returns(uint)", "function anotheranMethod() public view returns(uint)"], // Ensure this matches your actual ABI
      provider
    );
    return contract;
  }

  const logToComments = (message: string) => {
    console.log(message);
  }

  const handleBlockchainInteraction = async (method: 'myMethod' | 'anotherMethod') => {
    const contract = getContract();
    logToComments(`Attempting to call ${method} on the contract.`);
    const result = await contract[method]();
    console.log(`Result from ${method}:`, result);
    setVoteTotal((prevState) => ({
      ...prevState,
      [method === 'myMethod' ? 'method1' : 'method2']: result.toNumber(), // Assumes the result can be safely converted to a number
    }));
    logToComments(`Vote total updated for ${method}`);
  };

  return (
    <div>
      <button onClick={() => handleBlockchainInteraction('myMethod')}>
        Trigger Blockchain Interaction
      </button>
      <div>Vote Total for Method 1: {voteTotal.method1}</div>
      
      <button onClick={() => handleBlockchainManagedInteraction('anotherMethod')}>
        Trigger Another Blockchain Interaction
      </button>
      <div>Vote Total for Method 2: {voteTotal.method2}</div>
    </div>
  );
};

export default MyComponent;