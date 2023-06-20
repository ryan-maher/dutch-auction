// SPDX-License-Identifier: MIT

pragma solidity ^0.8.0;

interface INFT {
        
    function transferFrom(address from, address to, uint256 Id) external;

}

contract NFTDutchAuction {
    
    address payable public owner;
    uint256 public initialPrice;
    uint256 public startingBlock;
    uint256 public currentPrice;
    uint256 offerPriceDecrement;
    uint256 numBlocksAuctionOpen;
    bool public acceptingBids = true;
    address tokenAddress;
    uint256 tokenId;
    INFT nft;
    
    constructor(address erc721TokenAddress, uint256 _nftTokenId, uint256 _reservePrice, uint256 _numBlocksAuctionOpen, uint256 _offerPriceDecrement){

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
        tokenAddress = erc721TokenAddress;
        tokenId = _nftTokenId;

    }

    function transferFrom(address _inft, address from, address to, uint256 Id) internal {
        INFT(_inft).transferFrom(from,to,Id);
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

        // Transfer NFT to bidder
        transferFrom(tokenAddress, owner, msg.sender, tokenId);

        // Close auction
        acceptingBids = false;
        
        // returns address of winning bidder
        return msg.sender;
    
    }

}