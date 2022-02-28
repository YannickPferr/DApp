pragma solidity >=0.6.0;

contract Test {
    uint private tvl = 0;

    mapping(address => uint) private balances;
    
    function deposit() public payable {
        balances[msg.sender] += msg.value;
        tvl += msg.value;
    }

    function withdraw(uint amount) public {
        require(balances[msg.sender] >= amount, "Your balance is too small!");
        balances[msg.sender] -= amount;
        tvl -= amount;
        payable(msg.sender).transfer(amount);
    }

    function getBalance() public view returns (uint) {
        return balances[msg.sender];
    }

    function getTVL() public view returns (uint) {
        return tvl;
    }
}
