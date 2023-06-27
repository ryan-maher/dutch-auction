// SPDX-License-Identifier: MIT

pragma solidity ^0.8.0;

import "hardhat/console.sol";

interface InterfaceNFT {
    function transferFrom(address from, address to, uint256 Id) external;
}

interface InterfaceERC20Token {
    function transfer(address to, uint256 amount) external;
    function transferFrom(address from, address to, uint256 amount) external;
}

contract NFTDutchAuction_ERC20Bids{

    address payable public owner;
    uint256 public initialPrice;
    uint256 public startingBlock;
    uint256 public currentPrice;
    uint256 offerPriceDecrement;
    uint256 numBlocksAuctionOpen;
    bool public acceptingBids = true;
    address NFTAddress;
    uint256 NFTId;
    address tokenAddress;
    InterfaceNFT nft;
    InterfaceERC20Token erc20;
    
    constructor(address erc20TokenAddress, address erc721TokenAddress, uint256 _nftTokenId, uint256 _reservePrice, uint256 _numBlocksAuctionOpen, uint256 _offerPriceDecrement) {

        // Makes the seller the owner of the contract
        owner = payable(msg.sender);

        // Setting initial price
        initialPrice = _reservePrice + (_numBlocksAuctionOpen * _offerPriceDecrement);

        // Save starting block number
        startingBlock = block.number;

        // Save offer price decrement and number of blocks auction is open for
        offerPriceDecrement = _offerPriceDecrement;
        numBlocksAuctionOpen = _numBlocksAuctionOpen;

        // Save NFT information
        NFTAddress = erc721TokenAddress;
        NFTId = _nftTokenId;
        tokenAddress = erc20TokenAddress;

    }

    function NFTtransferFrom(address _inft, address from, address to, uint256 Id) internal {
        InterfaceNFT(_inft).transferFrom(from,to,Id);
    }

    function ERC20transferFrom(address _ierc20, address from, address to, uint256 amount) internal returns (bool){
        // InterfaceERC20Token(_ierc20).transferFrom(from, to, amount);
        console.log("Interface");
        InterfaceERC20Token(_ierc20).transferFrom(from, to, amount);
    }

    // Called externally by bidder
    function bid(uint256 amount) public payable returns(address) {
        
        // Check if auction is open at current block
        if(acceptingBids){
            acceptingBids = (block.number - startingBlock) <= numBlocksAuctionOpen;
        } 
        require(acceptingBids, "Auction closed");

        // Calculate current price
        currentPrice = initialPrice - ((block.number - startingBlock) * offerPriceDecrement);

        // Check if bid amount is >= current price
        require(amount >= currentPrice, "bid too low");

        // Send ERC20 token to owner (seller)
        (bool success) = ERC20transferFrom(tokenAddress, msg.sender, owner, amount);
        console.log("Sending ", amount , " tokens to owner");
        require(success, "transfer failed");
    
        // Transfer NFT to bidder
        NFTtransferFrom(NFTAddress, owner, msg.sender, NFTId);

        // Close auction
        acceptingBids = false;
        
        // returns address of winning bidder
        return msg.sender;
    
    }

}