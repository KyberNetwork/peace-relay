pragma solidity ^0.4.21;

import "./SafeMath.sol";
import "./ERC20.sol";
import "./PeaceRelay.sol";
import "./RLP.sol";
import "./Ownable.sol";


contract ETCToken is ERC20, Ownable {
    using SafeMath for uint256;
    using RLP for RLP.RLPItem;
    using RLP for RLP.Iterator;
    using RLP for bytes;
    
    struct Transaction {
        uint nonce;
        uint gasPrice;
        uint gasLimit;
        address to;
        uint value;
        bytes data;
    }
    
    struct ETCLockTxProof {
        bytes value;
        bytes32 blockhash;
        bytes path;
        bytes parentNodes;
    }
    
    // Public variables of the token
    string public name;
    string public symbol;
    uint8 public decimals;    //How many decimals to show.
    string public version = "v0.1";
    uint public totalSupply;
    uint public DEPOSIT_GAS_MINIMUM = 500000; //should be constant
    bytes4 public LOCK_FUNCTION_SIG = 0xf435f5a7;

    mapping(address => uint) balances;
    mapping(address => mapping (address => uint)) allowed;
    mapping(bytes32 => bool) rewarded;

    PeaceRelay public ETCRelay;
    address public ETHLockingAddr;
    
    event Burn(address indexed from, address indexed etcAddr, uint indexed value);
    event Mint(address indexed to, uint value);
    
    function ETCToken(address peaceRelayAddr) {
        totalSupply = 0;
        name = "ETCToken";        // Set the name for display purposes
        symbol = "ETC";                       // Set the symbol for display purposes
        decimals = 9;                        // Amount of decimals for display purposes
        ETCRelay = PeaceRelay(peaceRelayAddr);
    }
    
    function changePeaceRelayAddr(address _peaceRelayAddr) onlyOwner public {
        ETCRelay = PeaceRelay(_peaceRelayAddr);
    }
    
    function changeETHLockingAddr(address _ETHLockingAddr) onlyOwner public {
        ETHLockingAddr = _ETHLockingAddr;
    }
    
    function mint(bytes value, uint256 blockHash, bytes path, bytes parentNodes) public returns (bool) {
        if (!rewarded[keccak256(value, bytes32(blockHash), path, parentNodes)] && ETCRelay.checkTxProof(value, blockHash, path, parentNodes)) {
            Transaction memory tx = getTransactionDetails(value);
            bytes4 functionSig = getSignature(tx.data);
          
            require(functionSig == LOCK_FUNCTION_SIG);
            require(tx.to == ETHLockingAddr);
            require(tx.gasLimit <= DEPOSIT_GAS_MINIMUM);

            address newAddress = getAddress(tx.data);

            totalSupply = totalSupply.add(tx.value);
            balances[newAddress] = balances[newAddress].add(tx.value);
            emit Mint(newAddress, tx.value);
            rewarded[keccak256(value, bytes32(blockHash), path, parentNodes)] = true;
            return true;
        }
        return false;
    }
    
    function burn(uint256 _value, address etcAddr) public returns (bool) {
        // safeSub already has throw, so no need to throw
        balances[msg.sender] = balances[msg.sender].sub(_value);
        totalSupply = totalSupply.sub(_value);
        emit Burn(msg.sender, etcAddr, _value);
        return true;
    }
    
    function checkIfRewarded(bytes value, uint256 blockHash, bytes path, bytes parentNodes) public constant returns (bool) {
        return rewarded[keccak256(value, bytes32(blockHash),path,parentNodes)];
    }
    
    function checkProof(bytes value, uint256 blockHash, bytes path, bytes parentNodes) public constant returns (bool) {
        return ETCRelay.checkTxProof(value, blockHash, path, parentNodes);
    }
    
    function transfer(address _to, uint _value) public returns (bool) {
        // safeSub already has throw, so no need to throw
        balances[msg.sender] = balances[msg.sender].sub(_value);
        balances[_to] = balances[_to].add(_value);
        emit Transfer(msg.sender, _to, _value);
        return true;
    }

    function transferFrom(address _from, address _to, uint _value) public returns (bool) {
        uint256 allowance = allowed[_from][msg.sender];
    
        balances[_from] = balances[_from].sub(_value);
        allowed[_from][msg.sender] = allowance.sub(_value);
        balances[_to] = balances[_to].add(_value);
        emit Transfer(_from, _to, _value);
        return true;
    }
    
    function balanceOf(address _owner) public constant returns (uint) {
        return balances[_owner];
    }
    
    function approve(address _spender, uint _value) public returns (bool) {
        allowed[msg.sender][_spender] = _value;
        emit Approval(msg.sender, _spender, _value);
        return true;
    }
    
    function allowance(address _owner, address _spender) public constant returns (uint) {
        return allowed[_owner][_spender];
    }
  
    // Non-payable unnamed function prevents Ether from being sent accidentally
	function () {}


    // HELPER FUNCTIONS
    function getSignature(bytes b) public pure returns (bytes4) {
        require(b.length >= 32);
        uint tmp = 0;
        for (uint i = 0; i < 4; i++) {
            tmp = tmp*(2**8)+uint8(b[i]);
        }
        return bytes4(tmp);
    }

    //grabs the first input from some function data
    //and implies that it is an address
    function getAddress(bytes b) public pure returns (address a) {
        if (b.length < 36) return address(0);
        assembly {
            let mask := 0xFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFF
            a := and(mask, mload(add(b, 36)))
            //36 is the offset of the first param of the data, if encoded properly.
            //4 bytes for the function signature, and 32 for the address.
        }
    }
    
    //txValue is a value at the bottom of the transaction trie.
    function getTransactionDetails(bytes txValue) constant internal returns (Transaction memory tx) {
        RLP.RLPItem[] memory list = txValue.toRLPItem().toList();
        tx.gasPrice = list[1].toUint();
        tx.gasLimit = list[2].toUint();
        tx.to = address(list[3].toUint());
        tx.value = list[4].toUint();
    
        //Ugly hard coding for now. Can only parse burn transactions.
        tx.data = new bytes(36);
        for (uint i = 0; i < 36; i++) {
            tx.data[i] = txValue[txValue.length - 103 + i];
        }
        return tx;
    }
    
    /*
    //rlpTransaction is a value at the bottom of the transaction trie.
    function testGetTransactionDetails(bytes rlpTransaction) constant returns (uint, uint, address, bytes) {
        Transaction memory tx;
        RLP.RLPItem[] memory list = rlpTransaction.toRLPItem().toList();
        tx.gasPrice = list[1].toUint();
        tx.gasLimit = list[2].toUint();
        tx.to = address(list[3].toUint());
        tx.value = list[4].toUint();
        
        //Ugly hard coding for now. Can only parse burn transactions.
        tx.data = new bytes(36);
        for (uint i = 0; i < 36; i++) {
            tx.data[i] = rlpTransaction[rlpTransaction.length - 103 + i];
        }
        return (tx.gasPrice, tx.gasLimit, tx.to, tx.data);
    }
    */
}
