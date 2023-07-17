//SPDX-License-Identifier: MIT

pragma solidity ^0.8.4;

contract BasicDutchAuction {

    address payable public owner;
    uint256 public initialPrice;
    uint256 public startingBlock;
    uint256 public currentPrice;
    uint256 public reservePrice;
    uint256 public offerPriceDecrement;
    uint256 public numBlocksAuctionOpen;
    bool public acceptingBids = true;
    address public winner;

    constructor(uint256 _reservePrice, uint256 _numBlocksAuctionOpen, uint256 _offerPriceDecrement) {

        // Makes the seller the owner of the contract
        owner = payable(msg.sender);

        // Setting initial price
        initialPrice = _reservePrice + (_numBlocksAuctionOpen * _offerPriceDecrement);

        // Save starting block number
        startingBlock = block.number;

        // Save offer price decrement and number of blocks auction is open for
        offerPriceDecrement = _offerPriceDecrement;
        numBlocksAuctionOpen = _numBlocksAuctionOpen;
        reservePrice = _reservePrice;
    }

    function price() public view returns (uint256) {
        
        uint256 auctionPrice;
        auctionPrice = (initialPrice - ((block.number - startingBlock) * offerPriceDecrement));

        if(auctionPrice < reservePrice){
            auctionPrice = reservePrice;
        }

        return auctionPrice;
    }

    function accepting() public view returns (bool) {
        
        if(!acceptingBids){
            return false;
        } else {
            return ((block.number - startingBlock) <= numBlocksAuctionOpen);
        }
    }

    // Called externally by bidder
    function bid() public payable returns(address) {
        
        // Check if auction is open at current block
        if(acceptingBids){
            acceptingBids = (block.number - startingBlock) <= numBlocksAuctionOpen;
        } 
        require(acceptingBids, "Auction closed");

        // Calculate current price
        currentPrice = initialPrice - ((block.number - startingBlock) * offerPriceDecrement);

        // Check if bid amount is >= current price
        require(msg.value >= currentPrice, "bid too low");

        // Send wei to owner (seller)
        (bool success, ) = owner.call{value: msg.value}("");
        require(success, "transfer failed");

        // Close auction
        acceptingBids = false;
        
        // Save address of winner
        winner = msg.sender;

        // returns address of winning bidder
        return msg.sender;
    
    }

}
