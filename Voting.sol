// SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;

import "openzeppelin-solidity/contracts/cryptography/ECDSA.sol";
import "openzeppelin-solidity/contracts/access/Ownable.sol";

contract VotingSystem is Ownable {
    using ECDSA for bytes32;

    struct Poll {
        string question;
        string[] choices;
        mapping(address => bool) voterHasVoted;
        mapping(uint => uint) choiceVotes;
        bool isActive;
    }

    mapping(uint => Poll) public polls;
    uint public totalPolls;

    mapping(address => bool) public isVoterRegistered;

    event VoterRegistered(address voter);
    event PollCreated(uint pollId, string question, string[] choices);
    event Voted(uint indexed pollId, address voter, uint choiceIndex);

    modifier onlyRegisteredVoter() {
        require(isVoterRegistered[msg.sender], "Not a registered voter");
        _;
    }

    function registerVoter() external {
        require(!isVoterRegistered[msg.sender], "Voter already registered");
        isVoterRegistered[msg.sender] = true;
        emit VoterRegistered(msg.sender);
    }

    function createPoll(string memory question, string[] memory choices) external onlyOwner {
        require(choices.length > 1, "Poll must have at least two choices");
        Poll storage newPoll = polls[totalPolls++];
        newPoll.question = question;
        newPoll.choices = choices;
        newPoll.isActive = true;
        emit PollCreated(totalPolls - 1, question, choices);
    }
    
    function castVote(uint pollId, uint choiceIndex, bytes memory signature) external onlyRegisteredVoter {
        require(polls[pollId].isActive, "Poll does not exist");
        require(!polls[pollId].voterHasVoted[msg.sender], "Voter has already cast a vote");
        require(verifySignatureWithOwner(keccak256(abi.encodePacked(msg.sender, pollId, choiceIndex)), signature), "Signature verification failed");

        polls[pollId].choiceVotes[choiceIndex]++;
        polls[pollId].voterHasVoted[msg.sender] = true;

        emit Voted(pollId, msg.sender, choiceIndex);
    }
    
    function verifySignatureWithOwner(bytes32 dataHash, bytes memory signature) internal view returns (bool) {
        bytes32 ethSignedHash = dataHash.toEthSignedMessageHash();
        return ethSignedHash.recover(signature) == owner();
    }

    function retrievePoll(uint pollId) public view returns (string memory question, string[] memory choices, uint[] memory votesCount) {
        require(polls[pollId].isActive, "Poll does not exist");
        question = polls[pollId].question;
        choices = polls[pollId].choices;
        
        votesCount = new uint[](polls[pollId].choices.length);
        for(uint i = 0; i < polls[pollId].choices.length; i++) {
            votesCount[i] = polls[pollId].choiceVotes[i];
        }
    }

    function hasVoterVoted(uint pollId, address voter) public view returns (bool) {
        require(polls[pollId].isActive, "Poll does not exist");
        return polls[pollId].voterHasVoted[voter];
    }
}