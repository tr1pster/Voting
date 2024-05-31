require('dotenv').config();
const { expect } = require("chai");
const { ethers } = require("hardhat");

describe("Election Contract", function () {
  let Election;
  let election;
  let owner;
  let addr1;
  let addr2;

  beforeEach(async function () {
    Election = await ethers.getContractFactory("Election");
    [owner, addr1, addr2] = await ethers.getSigners();
    election = await Election.deploy();
  });

  describe("Election Creation", function() {
    it("Should create a new election", async function () {
      await election.createElection("Election 1");
      const electionCount = await election.electionCount();
      expect(electionCount).to.equal(1);
    });
  });

  describe("Vote Handling", function() {
    it("Should let a user vote for a candidate", async function () {
      await election.createElection("Election 1");
      await election.connect(addr1).vote(1, 1);
      const votes = await election.getVotes(1, 1);
      expect(votes).to.equal(1);
    });

    it("Should not let a user vote twice in the same election", async function () {
      await election.createElection("Election 1");
      await election.connect(addr1).vote(1, 1);
      await expect(election.connect(addr1).vote(1, 1)).to.be.revertedWith("Already voted");
    });
  });

  describe("Result Tallying", function() {
    it("Should correctly tally the votes", async function () {
      await election.createElection("Election 1");
      await election.connect(addr1).vote(1, 1);
      await election.connect(addr2).vote(1, 1);
      const votes = await election.getVotes(1, 1);
      expect(votes).to.equal(2);
    });
  });
});