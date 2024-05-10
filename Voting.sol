pragma solidity ^0.8.0;

import "openzeppelin-solidity/contracts/cryptography/ECDSA.sol";
import "openzeppelin-solidity/contracts/access/Ownable.sol";

contract VotingSystem is Ownable {
    using ECDSA for bytes32;

    struct Poll {
        string question;
        string[] choices;
        mapping(address => bool) hasVoted;
        mapping(uint => uint) votes;
        bool exists;
    }

    mapping(uint => Poll) public polls;
    uint public pollCount;

    mapping(address => bool) public registeredVoters;

    event VoterRegistered(address voter);
    event PollCreated(uint pollId, string question, string[] choices);
    event Voted(uint indexed pollId, address voter, uint choice);

    modifier onlyRegisteredVoter() {
        require(registeredVoters[msg.sender], "Not a registered voter");
        _;
    }

    function registerVoter() external {
        require(!registeredVoters[msg.sender], "Already registered");
        registeredVoters[msg.sender] = true;
        emit VoterRegistered(msg.sender);
    }

    function createPoll(string memory _question, string[] memory _choices) external onlyOwner {
        require(_choices.length > 1, "A poll must have at least two choices");
        Poll storage p = polls[pollCount++];
        p.question = _question;
        p.choices = _choices;
        p.exists = true;
        emit PollCreated(pollCount-1, _question, _choices);
    }
    
    function vote(uint _pollId, uint _choice, bytes memory _signature) external onlyRegisteredVoter {
        require(polls[_pollId].exists, "Poll does not exist");
        require(!polls[_pollId].hasVoted[msg.sender], "Already voted");
        require(verifyOwnerSignature(keccak256(abi.encodePacked(msg.sender, _pollId, _choice)), _signature), "Invalid signature");

        polls[_pollId].votes[_choice]++;
        polls[_pollId].hasVoted[msg.sender] = true;

        emit Voted(_pollId, msg.sender, _choice);
    }
    
    function verifyOwnerSignature(bytes32 hash, bytes memory signature) internal view returns (bool) {
        bytes32 ethSignedHash = hash.toEthSignedMessageHash();
        return ethSignedHash.recover(signature) == owner();
    }

    function getPoll(uint _pollId) public view returns (string memory question, string[] memory choices, uint[] memory votes) {
        require(polls[_pollId].exists, "Poll does not exist");
        question = polls[_pollId].question;
        choices = polls[_pollId].choices;
        
        votes = new uint[](polls[_pollId].choices.length);
        for(uint i = 0; i < polls[_pollId].choices.length; i++) {
            votes[i] = polls[_pollId].votes[i];
        }
    }

    function checkIfUserVoted(uint _pollId, address _user) public view returns (bool) {
        require(polls[_pollId].exists, "Poll does not exist");
        return polls[_pollId].hasVoted[_user];
    }
}