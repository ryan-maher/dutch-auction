// SPDX-License-Identifier: MIT

pragma solidity ^0.8.0;

import "@openzeppelin/contracts/token/ERC20/ERC20.sol";
import "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import "@openzeppelin/contracts/access/Ownable.sol";
import "hardhat/console.sol";

// Code from OpenZeppelin Contracts Wizard
contract ERC20Token is ERC20{
    
    constructor(uint256 initialSupply) ERC20("AuctionToken", "ANFT"){
        console.log("initial supply is: ", initialSupply);
        _mint(address(this), initialSupply);
        approve(msg.sender, initialSupply);
        
    }
    
    mapping(address => mapping(address => uint256)) private _allowances;

}