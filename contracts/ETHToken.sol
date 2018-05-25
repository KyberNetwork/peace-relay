pragma solidity ^0.4.24;

import "./SafeMath.sol";
import "./ERC20.sol";
import "./PeaceRelay.sol";
import "./RLP.sol";
import "./Ownable.sol";


contract ETHToken is ERC20, Ownable {
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
    
    struct ETHLockTxProof {
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

    PeaceRelay public ETHRelay;
    address public ETHLockingAddr;
    
    event Burn(address indexed from, address indexed ethAddr, uint indexed value);
    event Mint(address indexed to, uint value);
    
    constructor (address peaceRelayAddr) public {
        totalSupply = 0;
        name = "ETHToken";        // Set the name for display purposes
        symbol = "ETHT";           // Set the symbol for display purposes
        decimals = 9;             // Amount of decimals for display purposes
        ETHRelay = PeaceRelay(peaceRelayAddr);
    }
    
    function changePeaceRelayAddr(address _peaceRelayAddr) onlyOwner public {
        ETHRelay = PeaceRelay(_peaceRelayAddr);
    }
    
    function changeETHLockingAddr(address _ETHLockingAddr) onlyOwner public {
        ETHLockingAddr = _ETHLockingAddr;
    }
    
    function mint(bytes value, uint256 blockHash, bytes path, bytes parentNodes) public returns (bool) {
        if (!rewarded[keccak256(value, bytes32(blockHash), path, parentNodes)] && ETHRelay.checkTxProof(value, blockHash, path, parentNodes)) {
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
    
    function burn(uint256 _value, address ethAddr) public returns (bool) {
        // safeSub already has throw, so no need to throw
        balances[msg.sender] = balances[msg.sender].sub(_value);
        totalSupply = totalSupply.sub(_value);
        emit Burn(msg.sender, ethAddr, _value);
        return true;
    }
    
    function checkIfRewarded(bytes value, uint256 blockHash, bytes path, bytes parentNodes) public view returns (bool) {
        return rewarded[keccak256(value, bytes32(blockHash),path,parentNodes)];
    }
    
    function checkProof(bytes value, uint256 blockHash, bytes path, bytes parentNodes) public view returns (bool) {
        return ETHRelay.checkTxProof(value, blockHash, path, parentNodes);
    }
    
    function totalSupply() public view returns (uint256) {
        return totalSupply;
    }
    
    function balanceOf(address _owner) public view returns (uint) {
        return balances[_owner];
    }
    
    function transfer(address _to, uint _value) public returns (bool) {
        balances[msg.sender] = balances[msg.sender].sub(_value);
        balances[_to] = balances[_to].add(_value);
        emit Transfer(msg.sender, _to, _value);
        return true;
    }
    
    function allowance(address _owner, address _spender) public view returns (uint) {
        return allowed[_owner][_spender];
    }
    
    /**
     * * @dev Transfer tokens from one address to another
     * @param _from address The address which you want to send tokens from
     * @param _to address The address which you want to transfer to
     * @param _value uint256 the amount of tokens to be transferred
    **/
    
    function transferFrom(address _from, address _to, uint256 _value) public returns (bool) {
    require(_to != address(0));
    require(_value <= balances[_from]);
    require(_value <= allowed[_from][msg.sender]);

    balances[_from] = balances[_from].sub(_value);
    balances[_to] = balances[_to].add(_value);
    allowed[_from][msg.sender] = allowed[_from][msg.sender].sub(_value);
    emit Transfer(_from, _to, _value);
    return true;
    }
    
    function approve(address _spender, uint256 _value) public returns (bool) {
        allowed[msg.sender][_spender] = _value;
        emit Approval(msg.sender, _spender, _value);
        return true;
    }
    
     /**
      * @dev Increase the amount of tokens that an owner allowed to a spender.
      * approve should be called when allowed[_spender] == 0. To increment
      * allowed value is better to use this function to avoid 2 calls (and wait until
      * the first transaction is mined)
      * From MonolithDAO Token.sol
      * @param _spender The address which will spend the funds.
      * @param _addedValue The amount of tokens to increase the allowance by.
      */
  
    function increaseApproval(address _spender, uint _addedValue) public returns (bool) {
        allowed[msg.sender][_spender] = (allowed[msg.sender][_spender].add(_addedValue));
        emit Approval(msg.sender, _spender, allowed[msg.sender][_spender]);
        return true;
    }

    /**
     * @dev Decrease the amount of tokens that an owner allowed to a spender.
     * approve should be called when allowed[_spender] == 0. To decrement
     * allowed value is better to use this function to avoid 2 calls (and wait until
     * the first transaction is mined)
     * From MonolithDAO Token.sol
     * @param _spender The address which will spend the funds.
     * @param _subtractedValue The amount of tokens to decrease the allowance by.
    */
    
    function decreaseApproval(address _spender,uint _subtractedValue) public returns (bool) {
        uint oldValue = allowed[msg.sender][_spender];
        if (_subtractedValue > oldValue) {
            allowed[msg.sender][_spender] = 0;
        } else {
            allowed[msg.sender][_spender] = oldValue.sub(_subtractedValue);
        }
        emit Approval(msg.sender, _spender, allowed[msg.sender][_spender]);
        return true;
    }

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
    function getTransactionDetails(bytes txValue) view internal returns (Transaction memory tx) {
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
}