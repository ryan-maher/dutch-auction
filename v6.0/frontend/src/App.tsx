import { ReactElement } from 'react';
import styled from 'styled-components';
import { ActivateDeactivate } from './components/ActivateDeactivate';
import { AuctionDeployer } from './components/AuctionDeployer';
import { SectionDivider } from './components/SectionDivider';
// import { SignMessage } from './components/SignMessage';
import { WalletStatus } from './components/WalletStatus';

const StyledAppDiv = styled.div`
  display: grid;
  grid-gap: 20px;
`;

export function App(): ReactElement {
  return (
    <StyledAppDiv>
      <ActivateDeactivate />
      <SectionDivider />
      <WalletStatus />
      <SectionDivider />
      <AuctionDeployer />
    </StyledAppDiv>
  );
}
