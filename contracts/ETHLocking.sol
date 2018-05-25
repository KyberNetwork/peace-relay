pragma solidity ^0.4.24;

import "./SafeMath.sol";
import "./PeaceRelay.sol";
import "./RLP.sol";
import "./Ownable.sol";

contract ETHLocking is Ownable {
    using SafeMath for uint256;
    using RLP for RLP.RLPItem;
    using RLP for RLP.Iterator;
    using RLP for bytes;
    
    // Public variables of the token
    string public version = "v0.2";
    uint public totalSupply;
    bytes4 public BURN_FUNCTION_SIG = 0xfcd3533c;
    address public owner;
    
    mapping (address => mapping (address => uint)) allowed;
    mapping(bytes32 => bool) rewarded;
    PeaceRelay public ETHRelay;
    address public ETHTokenAddr;
    
    struct Transaction {
        uint gasPrice;
        uint gasLimit;
        address to;
        uint value;
        bytes data;
    }
    
    struct Log {
        address sender;
        address ETHAddr;
        uint value;
    }
    
    event Locked(address indexed from, address indexed ethAddr, uint value);
    event Unlocked(address indexed to, uint value);
    
    constructor (address _ETHTokenAddr, address _peaceRelayAddr) public {
        totalSupply = 0;
        ETHTokenAddr = _ETHTokenAddr;
        ETHRelay = PeaceRelay(_peaceRelayAddr);
        owner = msg.sender;
    }
    
    function changePeaceRelayAddr(address _peaceRelayAddr) public onlyOwner {
        ETHRelay = PeaceRelay(_peaceRelayAddr);
    }
    
    function changeETHTokenAddr(address _ETHTokenAddr) public onlyOwner {
        ETHTokenAddr = _ETHTokenAddr;
    }
    
    function lock(address _ETHAddr) public payable returns (bool success) {
        // Note: This will never throw, as there is a max amount of tokens on a chain
        totalSupply = totalSupply.add(msg.value);
        emit Locked(msg.sender, _ETHAddr, msg.value);
        return true;
    }
    
    function unlock(
        bytes txValue, uint256 txBlockHash, bytes txPath, bytes txParentNodes,
        bytes recValue, bytes recPath, bytes recParentNodes
    ) public returns (bool success) {
    
        if (rewarded[keccak256(txValue, bytes32(txBlockHash), txPath, txParentNodes)] || rewarded[keccak256(recValue, bytes32(txBlockHash), recPath, recParentNodes)]) {
            return false;
        }

        if (ETHRelay.checkReceiptProof(recValue, txBlockHash, recPath, recParentNodes)) {
            Log memory log = getReceiptDetails(recValue);

            if (ETHRelay.checkTxProof(txValue, txBlockHash, txPath, txParentNodes)) {
                Transaction memory tx = getTransactionDetails(txValue);
                assert (getSig(tx.data) == BURN_FUNCTION_SIG);
                assert (tx.to == ETHTokenAddr);

                totalSupply = totalSupply.sub(log.value);
                rewarded[keccak256(txValue, bytes32(txBlockHash), txPath, txParentNodes)] = true;
                rewarded[keccak256(recValue, bytes32(txBlockHash), recPath, recParentNodes)] = true;
                log.ETHAddr.transfer(log.value);
                emit Unlocked(log.ETHAddr, log.value);
                return true;
            }
            
        return false;
        }
    }
    
    // HELPER FUNCTIONS
    function getSig(bytes b) pure public returns (bytes4 functionSig) {
        require(b.length >= 32);
        uint tmp = 0;
        for (uint i = 0; i < 4; i++) {
            tmp = tmp*(2**8)+uint8(b[i]);
        }
        return bytes4(tmp);
    }


    // rlpTransaction is a value at the bottom of the transaction trie.
    function getReceiptDetails(bytes rlpReceipt) constant internal returns (Log memory l) {
        RLP.RLPItem[] memory receipt = rlpReceipt.toRLPItem().toList();
        RLP.RLPItem[] memory logs = receipt[3].toList();
        RLP.RLPItem[] memory log = logs[0].toList();
        RLP.RLPItem[] memory logValue = log[1].toList();

        l.sender = address(logValue[1].toUint());
        l.ETHAddr = address(logValue[2].toUint());
        l.value = logValue[3].toUint();
    }

  // rlpTransaction is a value at the bottom of the transaction trie.
  function getTransactionDetails(bytes rlpTransaction) constant internal returns (Transaction memory tx) {
    RLP.RLPItem[] memory list = rlpTransaction.toRLPItem().toList();
    tx.gasPrice = list[1].toUint();
    tx.gasLimit = list[2].toUint();
    tx.to = address(list[3].toUint());
    // Ugly hard coding for now. Can only parse burn transactions.
    tx.data = new bytes(68);
    for (uint i = 0; i < 68; i++) {
      tx.data[i] = rlpTransaction[rlpTransaction.length - 135 + i];
    }
    return tx;
  }
}
