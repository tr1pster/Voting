pragma solidity ^0.8.0;

import "openzeppelin-solidity/contracts/cryptography/ECDSA.sol";
import "openzeppelin-solidity/contracts/access/Ownable.sol";

contract VotingSystem is Ownable {
    using ECDSA for bytes32;

    struct Poll {
        string question;
        string[] options;
        mapping(address => bool) hasVoted;
        mapping(uint => uint) votesPerOption;
        bool isOpen;
    }

    mapping(uint => Poll) private pollRegistry;
    uint public pollCount;

    mapping(address => bool) public registeredVoters;

    event VoterRegistered(address indexed voter);
    event PollCreated(uint indexed pollId, string question, string[] options);
    event VoteCast(uint indexed pollId, address voter, uint optionIndex);

    modifier onlyRegisteredVoter() {
        require(registeredVoters[msg.sender], "VoterRegistration: Caller is not a registered voter");
        _;
    }

    modifier pollExistsAndOpen(uint pollId) {
        require(pollId < pollCount, "PollManagement: Poll does not exist");
        require(pollRegistry[pollId].isOpen, "PollManagement: Poll is closed");
        _;
    }

    function registerVoter() external {
        require(!registeredVoters[msg.sender], "VoterRegistration: Voter already registered");
        registeredVoters[msg.sender] = true;
        emit VoterRegistered(msg.sender);
    }

    function createPoll(string memory question, string[] memory options) external onlyOwner {
        require(options.length > 1, "PollCreation: Poll must have at least two options");
        Poll storage newPoll = pollRegistry[pollCount++];
        newPoll.question = question;
        newPoll.options = options;
        newPoll.isOpen = true;
        emit PollCreated(pollCount - 1, question, options);
    }

    function submitVote(uint pollId, uint optionIndex, bytes memory signature) external onlyRegisteredVoter pollExistsAndOpen(pollId) {
        require(!pollRegistry[pollId].hasVoted[msg.sender], "Voting: Voter has already submitted a vote");
        require(optionIndex < pollRegistry[pollId].options.length, "Voting: Invalid option index");
        require(verifyOwnerSignature(keccak256(abi.encodePacked(msg.sender, pollId, optionIndex)), signature), "Voting: Signature verification failed");

        pollRegistry[pollId].votesPerOption[optionIndex]++;
        pollRegistry[pollId].hasVoted[msg.sender] = true;

        emit VoteCast(pollId, msg.sender, optionIndex);
    }

    function verifyOwnerSignature(bytes32 dataHash, bytes memory signature) internal view returns (bool) {
        bytes32 ethSignedHash = dataHash.toEthSignedMessageHash();
        return ethSignedHash.recover(signature) == owner();
    }

    function getPollDetails(uint pollId) public view pollExistsAndOpen(pollId) returns (string memory question, string[] memory options, uint[] memory voteCounts) {
        question = pollRegistry[pollId].question;
        options = pollRegistry[pollId].options;
        
        voteCounts = new uint[](options.length);
        for(uint i = 0; i < options.length; i++) {
            voteCounts[i] = pollRegistry[pollId].votesPerOption[i];
        }
    }

    function checkVoterParticipation(uint pollId, address voter) public view pollExistsAndOpen(pollId) returns (bool) {
        return pollRegistry[pollId].hasVoted[voter];
    }
}