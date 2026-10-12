// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

contract Voting {
    address public owner;

    struct Candidate {
        uint id;
        string name;
        string party;
        uint voteCount;
    }

    // Candidate lookup and voter tracking
    mapping(uint => Candidate) public candidates;
    mapping(address => bool) public voters;
    uint public candidatesCount;

    // Election timeline (Unix timestamps in seconds)
    uint public startDate;
    uint public endDate;

    // Events
    event CandidateAdded(uint indexed id, string name, string party);
    event Voted(address indexed voter, uint indexed candidateId);
    event DatesUpdated(uint startDate, uint endDate);

    // Add candidate to the election (Admin portal)
    function addCandidate(string memory _name, string memory _party) public {
        require(bytes(_name).length > 0, "Candidate name cannot be empty");
        require(bytes(_party).length > 0, "Party name cannot be empty");

        candidatesCount++;
        candidates[candidatesCount] = Candidate(candidatesCount, _name, _party, 0);

        emit CandidateAdded(candidatesCount, _name, _party);
    }

    // Configure voting start and end timestamp (Admin portal)
    function setDates(uint _startDate, uint _endDate) public {
        require(_endDate > _startDate, "End date must be greater than start date");
        startDate = _startDate;
        endDate = _endDate;

        emit DatesUpdated(_startDate, _endDate);
    }

    // Get election dates
    function getDates() public view returns (uint, uint) {
        return (startDate, endDate);
    }

    // Get total number of candidates
    function getCountCandidates() public view returns (uint) {
        return candidatesCount;
    }

    // Get candidate details by ID
    function getCandidate(uint _candidateId) public view returns (uint, string memory, string memory, uint) {
        require(_candidateId > 0 && _candidateId <= candidatesCount, "Invalid candidate ID");
        Candidate memory c = candidates[_candidateId];
        return (c.id, c.name, c.party, c.voteCount);
    }

    // Cast vote for a candidate
    function vote(uint _candidateId) public {
        // 1. Check election dates if configured
        if (startDate > 0 && endDate > 0) {
            require(block.timestamp >= startDate, "Voting has not started yet");
            require(block.timestamp <= endDate, "Voting has ended");
        }

        // 2. Check if sender already voted
        require(!voters[msg.sender], "Your account has already voted");

        // 3. Check candidate validity
        require(_candidateId > 0 && _candidateId <= candidatesCount, "Invalid candidate selected");

        // Record vote
        voters[msg.sender] = true;
        candidates[_candidateId].voteCount++;

        emit Voted(msg.sender, _candidateId);
    }
}
