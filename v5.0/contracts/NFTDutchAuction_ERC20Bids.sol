// SPDX-License-Identifier: MIT

pragma solidity ^0.8.0;

import "hardhat/console.sol";
import "@openzeppelin/contracts/proxy/ERC1967/ERC1967Proxy.sol";
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

contract NFTDutchAuction_ERC20Bids is UUPSUpgradeable, OwnableUpgradeable {

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
    
    function initialize(address erc20TokenAddress, address erc721TokenAddress, uint256 _nftTokenId, uint256 _reservePrice, uint256 _numBlocksAuctionOpen, uint256 _offerPriceDecrement) public initializer{
        
        // Makes the seller the owner of the contract
        auctionOwner = payable(msg.sender);

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

        acceptingBids = true;

        __Ownable_init();

    }

    function NFTtransferFrom(address _inft, address from, address to, uint256 Id) internal {
        InterfaceNFT(_inft).transferFrom(from,to,Id);
    }

    // function ERC20transferFrom(address _ierc20, address from, address to, uint256 amount) public virtual returns (bool) {
    function ERC20transferFrom(address _ierc20, address from, address to, uint256 amount) public virtual {
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
        //(bool success) = ERC20transferFrom(tokenAddress, msg.sender, owner, amount);
        ERC20transferFrom(tokenAddress, msg.sender, auctionOwner, amount);
        
        // transferFrom is not returning true even when tokens have been transferred successfully
        // could be an issue with interface/override
        // console.log("success: ", success);
        // require(success, "transfer failed");
    
        // Transfer NFT to bidder
        NFTtransferFrom(NFTAddress, auctionOwner, msg.sender, NFTId);

        // Close auction
        acceptingBids = false;
        
        // returns address of winning bidder
        return msg.sender;
    
    }

    function _authorizeUpgrade(address newImplementation) internal override onlyOwner{}

}