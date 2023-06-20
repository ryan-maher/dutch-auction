// SPDX-License-Identifier: MIT

pragma solidity ^0.8.0;

import "@openzeppelin/contracts/token/ERC721/ERC721.sol";
import "@openzeppelin/contracts/token/ERC721/IERC721.sol";
import "@openzeppelin/contracts/access/Ownable.sol";
import "hardhat/console.sol";

// Code from OpenZeppelin Contracts Wizard
contract NFT is ERC721, Ownable{

    constructor() ERC721("AuctionNFT", "ANFT") {}

    // Can only be called by owner of NFT contract (onlyOwner requires it)
    function safeMint(address to, uint256 tokenId) public onlyOwner {
        _safeMint(to, tokenId);
    }

    // function approve(address to, uint256 tokenId) public override {
    //     _approve(to, tokenId);
    //     // console.log("[NFTContract] approved by: ", msg.sender);
    // }

    // function transferFrom(address from, address to, uint256 tokenId) external {

    // }

}