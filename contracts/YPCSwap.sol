import "./YannickPferrCoin.sol";

pragma solidity >=0.6.0;

contract YPCSwap {
    YannickPferrCoin private ypc;
    mapping(address => uint256) private balances;
    uint256 private exchangeRate;

    constructor() public{
        exchangeRate = 1000000;
        ypc = new YannickPferrCoin(exchangeRate * 1e18);
    }

    function ypcToEth(uint256 amount) public {
        ypc.transferFrom(msg.sender, address(this), amount);
        payable(msg.sender).transfer(amount / exchangeRate);
    }

    function ethToYpc() public payable{
        ypc.transfer(msg.sender, msg.value * exchangeRate);
    }
    
    function getEthLiquidity() public view returns (uint256) {
        return address(this).balance;
    }

    function getYPCLiquidity() public view returns (uint256) {
        return ypc.balanceOf(address(this));
    }

    function balanceOf(address tokenOwner) public view returns (uint256) {
        return ypc.balanceOf(tokenOwner);
    }

    function getTokenAddress() public view returns (address) {
        return address(ypc);
    }

    function getExchangeRate() public view returns (uint256) {
        return exchangeRate;
    }
}
