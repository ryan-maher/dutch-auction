import { useWeb3React } from '@web3-react/core';
import { Contract, ethers, Signer } from 'ethers';
// import '@nomiclabs/hardhat-ethers'; // Causes issues if imported
import {
  ChangeEvent,
  MouseEvent,
  ReactElement,
  useEffect,
  useState
} from 'react';
import styled from 'styled-components';
import AuctionArtifact from '../artifacts/contracts/BasicDutchAuction.sol/BasicDutchAuction.json';
import { Provider } from '../utils/provider';
import { SectionDivider } from './SectionDivider';
import ABI from '../artifacts/contracts/BasicDutchAuction.sol/BasicDutchAuction.json';

// import hre from 'hardhat'
// import { hrtime } from 'process';

const StyledDeployContractButton = styled.button`
  width: 180px;
  height: 2rem;
  border-radius: 1rem;
  border-color: blue;
  cursor: pointer;
  place-self: center;
`;

const StyledGetInfoButton = styled.button`
  width: 180px;
  height: 2rem;
  border-radius: 1rem;
  border-color: blue;
  cursor: pointer;
  place-self: center;
`;

const StyledAuctionDiv = styled.div`
  display: grid;
  grid-template-rows: 1fr 1fr 1fr;
  grid-template-columns: 135px 2.7fr 1fr;
  grid-gap: 10px;
  place-self: center;
  align-items: center;
`;

const StyledLabel = styled.label`
  font-weight: bold;
`;

const StyledInput = styled.input`
  padding: 0.4rem 0.6rem;
  line-height: 2fr;
`;

const StyledButton = styled.button`
  width: 150px;
  height: 2rem;
  border-radius: 1rem;
  border-color: blue;
  cursor: pointer;
`;

export function AuctionDeployer(): ReactElement {
  
  const context = useWeb3React<Provider>();
  const { library, active } = context;

  const [signer, setSigner] = useState<Signer>();
  const [auctionContract, setAuctionContract] = useState<Contract>();
  const [auctionContractAddress, setAuctionContractAddress] = useState<string>('');
  
  // For Deployment
  const [reservePrice, setReservePrice] = useState<number>();
  const [auctionBlockTime, setAuctionBlockTime] = useState<number>();
  const [offerPriceDecrement, setOfferPriceDecrement] = useState<number>();

  // For Get Info
  const [reservePriceInfo, setReservePriceInfo] = useState<number>();
  const [auctionBlockTimeInfo, setAuctionBlockTimeInfo] = useState<number>();
  const [offerPriceDecrementInfo, setOfferPriceDecrementInfo] = useState<number>();
  const [retrievedContractAddress, setRetrievedContractAddress] = useState<string>('');
  const [winnerAddress, setWinnerAddress] = useState<string>('');
  const [sellerAddress, setSellerAddress] = useState<string>('');
  const [currentPrice, setCurrentPrice] = useState<number>();
  const [acceptingBids, setAcceptingBids] = useState<string>('');

  // For Bidding
  const [bidAddress, setBidAddress] = useState<string>('');
  const [bidAmount, setBidAmount] = useState<number>();
  
  useEffect((): void => {
    if (!library) {
      setSigner(undefined);
      return;
    }

    setSigner(library.getSigner());
  }, [library]);

  function handleReservePrice(event: ChangeEvent<HTMLInputElement>) : void {
    event.preventDefault();
    setReservePrice(event.target.valueAsNumber);
  }

  function handleBlockTime(event: ChangeEvent<HTMLInputElement>) : void {
    event.preventDefault();
    setAuctionBlockTime(event.target.valueAsNumber);
  }

  function handleOfferPriceDecrement(event: ChangeEvent<HTMLInputElement>) : void {
    event.preventDefault();
    setOfferPriceDecrement(event.target.valueAsNumber);
  }

  function handleGetInfoHelper(event: ChangeEvent<HTMLInputElement>) : void {
    event.preventDefault();
    setRetrievedContractAddress(event.target.value);
  }

  function handleBidHelper(event: ChangeEvent<HTMLInputElement>) : void {
    event.preventDefault();
    setBidAddress(event.target.value);
  }

  function handleBidAmount(event:ChangeEvent<HTMLInputElement>) : void {
    event.preventDefault();
    setBidAmount(event.target.valueAsNumber);
  }

  function handleDeployContract(event: MouseEvent<HTMLButtonElement>) {
    event.preventDefault();

    async function deployAuctionContract(): Promise<void> {
      
      const Auction = new ethers.ContractFactory(
        AuctionArtifact.abi,
        AuctionArtifact.bytecode,
        signer
      );
      
      try{
        const dutchAuctionContract = await Auction.deploy(reservePrice, auctionBlockTime, offerPriceDecrement);

        await dutchAuctionContract.deployed();

        setAuctionContract(dutchAuctionContract);

        window.alert(`Auction deployed to: ${dutchAuctionContract.address}`);

        setAuctionContractAddress(dutchAuctionContract.address);

      } catch (error: any) {
        window.alert(
          'Error!' + (error && error.message ? `\n\n${error.message}` : '')
        );
        
      }

    }

    deployAuctionContract();
  
  }

  function handleGetInfo(event: MouseEvent<HTMLButtonElement>) {
    event.preventDefault();

    async function getContractInfo(): Promise<void> {

      try{

        const dutchAuction = new ethers.Contract(
          // @ts-ignore
          retrievedContractAddress,
          ABI.abi,
          signer
        );

        setAcceptingBids((await dutchAuction.accepting()).toString());
        setCurrentPrice((await dutchAuction.price()).toString());
        setSellerAddress((await dutchAuction.owner()).toString()); 
        setWinnerAddress((await dutchAuction.winner()).toString());
        setReservePriceInfo((await dutchAuction.reservePrice()).toString());
        setOfferPriceDecrementInfo((await dutchAuction.offerPriceDecrement()).toString());
        setAuctionBlockTimeInfo((await dutchAuction.numBlocksAuctionOpen()).toString());

    } catch (error: any) {
      window.alert(
        'Error!' + (error && error.message ? `\n\n${error.message}` : '')
      );

    }
  }

  getContractInfo();

}

function handleBid(event: MouseEvent<HTMLButtonElement>) {

  async function placeBid() : Promise<void> {
  
    try {

      const dutchAuction = new ethers.Contract(
        // @ts-ignore
        bidAddress,
        ABI.abi,
        signer
      );

      await dutchAuction.bid({value: bidAmount});

      window.alert(`Bid sent to: ${dutchAuction.address}`);

    } catch (error: any) {
      window.alert(
        'Error!' + (error && error.message ? `\n\n${error.message}` : '')
      );

    }

  }

  placeBid();

}

  return(
    <>
      <StyledAuctionDiv>
        
                                    {/* Deployment */}
        
        <StyledLabel>Contract address: </StyledLabel>
        <div>
          {auctionContractAddress ? (auctionContractAddress) : (<em>{`<Contract not yet deployed>`}</em>)}
        </div>
        <div></div>
        
        <StyledLabel htmlFor='reservePriceInput'>Reserve price</StyledLabel>
        
        <StyledInput 
        id="reservePriceInput" 
        type='number' 
        placeholder={`ex: 10000`}
        onChange={handleReservePrice} 
        ></StyledInput>
        
        <div></div>
        
        <StyledLabel htmlFor='auctionBlockTimeInput'>Auction time (in blocks)</StyledLabel>

        <StyledInput 
        id="auctionBlockTimeInput" 
        type='number' 
        placeholder={`ex: 50`} 
        onChange={handleBlockTime}
        ></StyledInput>

        <div></div>

        <StyledLabel htmlFor='offerPriceDecrementInput'>Offer price decrement</StyledLabel>

        <StyledInput 
        id='offerPriceDecrementInput' 
        type='number' 
        placeholder={`ex: 10`} 
        onChange={handleOfferPriceDecrement}
        ></StyledInput>

        <div></div>
        <div></div>

        <StyledDeployContractButton
          // disabled={!active || auctionContract ? true : false}
          // style={{
          //   cursor: !active || auctionContract ? 'not-allowed' : 'pointer',
          //   borderColor: !active || auctionContract ? 'unset' : 'blue'
          // }}
          onClick={handleDeployContract}>Deploy Auction Contract
        </StyledDeployContractButton>  

      </StyledAuctionDiv>
      <SectionDivider></SectionDivider>
      <StyledAuctionDiv>
          
                                    {/* Getting Info */}
        
        <StyledLabel id='auctionAddressLabel'> Auction address: </StyledLabel>

        <StyledInput 
          id='auctionAddressInput' 
          type='text' 
          //placeholder={`Not deployed`} 
          onChange={handleGetInfoHelper}
        ></StyledInput>

        <StyledGetInfoButton
        // style={{
        //   cursor: !active || auctionContract ? 'not-allowed' : 'pointer',
        //   borderColor: !active || auctionContract ? 'unset' : 'blue'
        // }}

        onClick={handleGetInfo}
        >Get Info
        </StyledGetInfoButton>

        <StyledLabel id='seller'>Seller: </StyledLabel>
        <div>
          {sellerAddress ? (sellerAddress) : (<em>{`<None yet>`}</em>)}
        </div>

        <div></div>
        
        <StyledLabel id='winner'>Winner: </StyledLabel>
        <div>
          {winnerAddress ? (winnerAddress) : (<em>{`<None yet>`}</em>)}
        </div>

        <div></div>
        
        <StyledLabel>Reserve price: </StyledLabel>
        <div>
          {reservePriceInfo ? (reservePriceInfo) : (<em>{`<Get contract info first>`}</em>)}
        </div>
        <div></div>
        <StyledLabel>Number of blocks auction open for: </StyledLabel>
        <div>
          {auctionBlockTimeInfo ? (auctionBlockTimeInfo) : (<em>{`<Get contract info first>`}</em>)}
        </div>
        <div></div>
        <StyledLabel>Offer price decrement: </StyledLabel>
        <div>
          {offerPriceDecrementInfo ? (offerPriceDecrementInfo) : (<em>{`<Get contract info first>`}</em>)}
        </div>
        <div></div>
        <StyledLabel id='currentPrice'>Current Price: </StyledLabel>
        <div>
          {currentPrice ? (currentPrice) : (<em>{`<Get contract info first>`}</em>)}
        </div>
        <div></div>
        <StyledLabel id='acceptingBids'>Accepting bids? </StyledLabel>
        <div>
          {acceptingBids ? (acceptingBids) : (<em>{`<Get contract info first>`}</em>)}
        </div>

      </StyledAuctionDiv>
      <SectionDivider></SectionDivider>
      <StyledAuctionDiv>

                                    {/* Bidding */}

        <StyledLabel htmlFor='bidAddressLabel'> Auction address: </StyledLabel>

        <StyledInput 
          id='bidAddressInput' 
          type='text'
          onChange={handleBidHelper} 
        ></StyledInput>

        <div></div>

        <StyledLabel htmlFor='bidAmountInput'> Bid amount: </StyledLabel>

        <StyledInput 
          id='bidAmountInput' 
          type='number'
          onChange={handleBidAmount} 
        ></StyledInput>

        <StyledButton
        // style={{
        //   cursor: !active || auctionContract ? 'not-allowed' : 'pointer',
        //   borderColor: !active || auctionContract ? 'unset' : 'blue'
        // }}
        onClick={handleBid}
        >Bid
        </StyledButton>
        
      
      </StyledAuctionDiv>
    </>
  )

}