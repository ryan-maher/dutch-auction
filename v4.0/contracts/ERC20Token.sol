// SPDX-License-Identifier: MIT

pragma solidity ^0.8.0;

import "@openzeppelin/contracts/token/ERC20/ERC20.sol";
import "@openzeppelin/contracts/access/Ownable.sol";
import "hardhat/console.sol";

// Code from OpenZeppelin Contracts Wizard
contract ERC20Token is ERC20{
    
    constructor(uint256 initialSupply) ERC20("AuctionToken", "ANFT"){
        // console.log("initial supply is: ", initialSupply);
        _mint(msg.sender, initialSupply);
        approve(msg.sender, initialSupply);
    }

}