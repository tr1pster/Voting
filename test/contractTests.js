require('dotenv').config();
const { expect } = require("chai");
const { ethers } = require("hardhat");

describe("Election Contract", function () {
  let ElectionContract;
  let electionInstance;
  let contractOwner;
  let voterOne;
  let voterTwo;

  beforeEach(async function () {
    ElectionContract = await ethers.getContractFactory("Election");
    [contractOwner, voterOne, voterTwo] = await ethers.getSigners();
    electionInstance = await ElectionContract.deploy();
  });

  describe("Election Initialization", function() {
    it("Should initialize a new election", async function () {
      await electionInstance.initializeElection("Election 1");
      const totalElections = await electionInstance.getTotalElections();
      expect(totalElections).to.equal(1);
    });
  });

  describe("Voting Process", function() {
    it("Should record a vote for a candidate", async function () {
      await electionInstance.initializeElection("Election 1");
      await electionInstance.connect(voterOne).castVote(1, 1);
      const voteCount = await electionInstance.getCandidateVotes(1, 1);
      expect(voteCount).to.equal(1);
    });

    it("Should prevent double voting in the same election", async function () {
      await electionInstance.initializeElection("Election 1");
      await electionInstance.connect(voterOne).castVote(1, 1);
      await expect(electionInstance.connect(voterOne).castVote(1, 1)).to.be.revertedWith("Already voted");
    });
  });

  describe("Vote Counting", function() {
    it("Should accurately count the votes for a candidate", async function () {
      await electionInstance.initializeElection("Election 1");
      await electionInstance.connect(voterOne).castVote(1, 1);
      await electionInstance.connect(voterTwo).castVote(1, 1);
      const finalVoteCount = await electionInstance.getCandidateVotes(1, 1);
      expect(finalVoteCount).to.equal(2);
    });
  });
});