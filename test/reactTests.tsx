// MyComponent.tsx
import React, { useState } from 'react';
import { ethers } from 'ethers';

const MyComponent = () => {
  const [voteTotal, setVoteTotal] = useState({ method1: 0, method2: 0 });

  const getContract = () => {
    const provider = new ethers.providers.JsonRpcProvider(process.env.REACT_APP_BLOCKCHAIN_URL);
    const contract = new ethers.Contract(
      "YOUR_CONTRACT_ADDRESS", // Replace with your contract address
      ["function myMethod() public view returns(uint)", "function anotherMethod() public view returns(uint)"], // Replace with actual ABI
      provider
    );
    return contract;
  }

  const handleBlockchainInteraction = async (method: 'myMethod' | 'anotherMethod') => {
    const contract = getContract();
    const result = await contract[method]();
    console.log(result);
    setVoteTotal((prevState) => ({
      ...prevState,
      [method === 'myMethod' ? 'method1' : 'method2']: result.toNumber(), // Assumes result can be converted to number
    }));
  };

  return (
    <div>
      <button onClick={() => handleBlockchainInteraction('myMethod')}>
        Trigger Blockchain Interaction
      </button>
      <div>Vote Total for Method 1: {voteTotal.method1}</div>
      
      <button onClick={() => handleBlockchainInteraction('anotherMethod')}>
        Trigger Another Blockchain Interaction
      </button>
      <div>Vote Total for Method 2: {voteTotal.method2}</div>
    </div>
  );
};

export default MyComponent;
```
```typescript
// MyComponent.test.tsx
import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import '@testing-library/jest-dom';
import * as ethers from 'ethers';
import MyComponent from './MyComponent';

jest.mock('ethers', () => {
  const originalModule = jest.requireActual('ethers');

  // Mock the specific Contract method used in the component
  const mockContract = {
    myMethod: jest.fn().mockResolvedValue({ toNumber: () => 10 }),
    anotherMethod: jest.fn().mockResolvedValue({ toNumber: () => 20 }),
  };

  return {
    ...originalModule,
    ethers: {
      ...originalModule.ethers,
      Contract: jest.fn(() => mock Domain),
    },
  };
});

describe('MyComponent tests', () => {
  it('renders without crashing', () => {
    const { container } = render(<MyComponent />);
    expect(container).toBeDefined();
  });

  it('displays vote totals correctly for each button press', async () => {
    render(<MyComponent />);
    
    fireEvent.click(screen.getByRole('button', { name: /trigger blockchain interaction/i }));
    await screen.findByText(/Vote Total for Method 1: 10/i);
    expect(screen.getByText(/Vote Total for Method 1: 10/i)).toBeInTheDocument();
  
    fireEvent.click(screen.getByRole('button', { name: /trigger another blockchain interaction/i }));
    await screen.findByText(/Vote Total for Method 2: 20/i);
    expect(screen.getByText(/Vote Total for Method 2: 20/i)).toBeInTheDocument();
  });
});