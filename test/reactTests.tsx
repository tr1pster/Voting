import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import '@testing-library/jest-dom';
import { ethers } from 'ethers';
import MyComponent from './MyComponent';

jest.mock('ethers', () => {
  const originalModule = jest.requireActual('ethers');

  return {
    __esModule: true,
    ...originalModule,
    ethers: {
      ...originalModule.ethers,
      getContract: jest.fn().mockImplementation(() => {
        return {
          myMethod: jest.fn().mockReturnValue(Promise.resolve('mockedValue')),
        };
      }),
    },
  };
});

describe('MyComponent', () => {
  it('renders without crashing', () => {
    const { container } = render(<MyComponent />);
    expect(container).toBeDefined();
  });

  it('interacts with the blockchain without issues', async () => {
    render(<MyComponent />);
    fireEvent.click(screen.getByRole('button', { name: /trigger blockchain interaction/i }));
    const outputElement = await screen.findByText(/mockedValue/i);
    expect(outputElement).toBeInTheDocument();
  });
});

process.env.REACT_APP_BLOCKCHAIN_URL = 'https://your.blockchain.node.url';

const provider = new ethers.providers.JsonRpcProvider(process.env.REACT_POST_BLOCKCHAIN_URL);