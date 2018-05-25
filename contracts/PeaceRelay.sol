pragma solidity ^0.4.24;

import "./RLP.sol";
import "./MerklePatriciaProof.sol";

contract PeaceRelay {
  using RLP for RLP.RLPItem;
  using RLP for RLP.Iterator;
  using RLP for bytes;

  uint256 public genesisBlock;
  uint256 public highestBlock;
  address public owner;

  mapping (address => bool) authorized;
  mapping (uint256 => BlockHeader) public blocks;

  modifier onlyOwner() {
    if (owner == msg.sender) {
      _;
    }
  }

  modifier onlyAuthorized() {
    if (authorized[msg.sender]) {
      _;
    }
  }

  struct BlockHeader {
    uint      prevBlockHash; // 0
    bytes32   stateRoot;     // 3
    bytes32   txRoot;        // 4
    bytes32   receiptRoot;   // 5
  }

  event SubmitBlock(uint256 blockHash, address submitter);

  constructor (uint256 blockNumber) public {
    genesisBlock = blockNumber;
    highestBlock = blockNumber;
    authorized[msg.sender] = true;
    owner = msg.sender;
  }

  function authorize(address user) onlyOwner public {
    authorized[user] = true;
  }

  function deAuthorize(address user) onlyOwner public {
    authorized[user] = false;
  }

  function resetGenesisBlock(uint256 blockNumber) onlyAuthorized public {
    genesisBlock = blockNumber;
    highestBlock = blockNumber;
  }

  function submitBlock(uint256 blockHash, bytes rlpHeader) onlyAuthorized public {
    BlockHeader memory header = parseBlockHeader(rlpHeader);
    uint256 blockNumber = getBlockNumber(rlpHeader);
    if (blockNumber > highestBlock) {
      highestBlock = blockNumber;
    }
    blocks[blockHash] = header;
    // There is at least one orphan
    emit SubmitBlock(blockHash, msg.sender);
  }

  function checkTxProof(bytes value, uint256 blockHash, bytes path, bytes parentNodes) view public returns (bool) {
    // add fee for checking transaction
    bytes32 txRoot = blocks[blockHash].txRoot;
    return trieValue(value, path, parentNodes, txRoot);
  }

  function checkStateProof(bytes value, uint256 blockHash, bytes path, bytes parentNodes) view public returns (bool) {
    bytes32 stateRoot = blocks[blockHash].stateRoot;
    return trieValue(value, path, parentNodes, stateRoot);
  }

  function checkReceiptProof(bytes value, uint256 blockHash, bytes path, bytes parentNodes) view public returns (bool) {
    bytes32 receiptRoot = blocks[blockHash].receiptRoot;
    return trieValue(value, path, parentNodes, receiptRoot);
  }

  function parseBlockHeader(bytes rlpHeader) view internal returns (BlockHeader) {
    BlockHeader memory header;
    RLP.Iterator memory it = rlpHeader.toRLPItem().iterator();

    uint idx;
    while (it.hasNext()) {
      if (idx == 0) {
        header.prevBlockHash = it.next().toUint();
      } else if (idx == 3) {
        header.stateRoot = bytes32(it.next().toUint());
      } else if (idx == 4) {
        header.txRoot = bytes32(it.next().toUint());
      } else if (idx == 5) {
        header.receiptRoot = bytes32(it.next().toUint());
      } else {
        it.next();
      }
      idx++;
    }
    return header;
  }

  function getBlockNumber(bytes rlpHeader) view internal returns (uint blockNumber) {
    RLP.RLPItem[] memory rlpH = RLP.toList(RLP.toRLPItem(rlpHeader));
    blockNumber = RLP.toUint(rlpH[8]);
  }

  function getStateRoot(uint256 blockHash) view public returns (bytes32) {
    return blocks[blockHash].stateRoot;
  }

  function getTxRoot(uint256 blockHash) view public returns (bytes32) {
    return blocks[blockHash].txRoot;
  }

  function getReceiptRoot(uint256 blockHash) view public returns (bytes32) {
    return blocks[blockHash].receiptRoot;
  }

  function trieValue(bytes value, bytes encodedPath, bytes parentNodes, bytes32 root) view internal returns (bool) {
    return MerklePatriciaProof.verify(value, encodedPath, parentNodes, root);
  }

}
