// SPDX-License-Identifier: MIT

// Test auction, used to test line 105 of NFTDutchAuction_ERC20Bids.sol
pragma solidity ^0.8.0;

import "@openzeppelin/contracts-upgradeable/proxy/utils/Initializable.sol";
import "@openzeppelin/contracts-upgradeable/proxy/utils/UUPSUpgradeable.sol";
import "@openzeppelin/contracts-upgradeable/access/OwnableUpgradeable.sol";

interface InterfaceNFT {
    function transferFrom(address from, address to, uint256 Id) external;
}

interface InterfaceERC20Token {
    function transfer(address to, uint256 amount) external;
    function transferFrom(address from, address to, uint256 amount) external returns (bool);
}

contract NewDutchAuction is Initializable, UUPSUpgradeable, OwnableUpgradeable{

    address payable public auctionOwner;
    uint256 public initialPrice;
    uint256 public startingBlock;
    uint256 public currentPrice;
    uint256 offerPriceDecrement;
    uint256 numBlocksAuctionOpen;
    bool public acceptingBids;
    address NFTAddress;
    uint256 NFTId;
    address tokenAddress;
    InterfaceNFT nft;
    InterfaceERC20Token erc20;
    
    function _authorizeUpgrade(address newImplementation) internal override virtual{}

}