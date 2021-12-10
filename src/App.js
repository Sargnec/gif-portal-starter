import React, { useEffect, useState } from 'react';
import twitterLogo from './assets/twitter-logo.svg'
import './App.css';

const TWITTER_HANDLE = 'nesargg';
const TWITTER_LINK = `https://twitter.com/${TWITTER_HANDLE}`

const App = () => {
  const [walletAddress, setWalletAddress] = useState(null);
  /* This function holds the logic for deciding if a Phantom wallet is connected or not */
  const checkIfWalletIsConnected = async () => {
    try {
      const { solana } = window;
      if (solana) {
        if (solana.isPhantom) {
          console.log('phantom wallet found!')

          /* Solana gives functions to connect to wallet */
          const response = await solana.connect({ onlyIfTrusted: true });
          console.log(
            'Connected with public key:',
            response.publicKey.toString()
          );
          /* setting public key to state */
          setWalletAddress(response.publicKey.toString())
        }
      } else {
        alert('Not found')
      }
    } catch (error) {
      console.error(error)
    }
  }
  const connectWallet = async () => {
    const { solana } = window;
    if (solana) {
      const response = await solana.connect();
      console.log('Connected with a public key:', response.publicKey.toString());
      setWalletAddress(response.publicKey.toString())
    }
  };

  const renderNotConnectedContainer = () => (
    <button className="cta-button connect-wallet-button" onClick={connectWallet}>
      <p className="button-text ">Connect to Wallet</p>
    </button>
  )
  /* At first mount check if wallet connected */
  useEffect(() => {
    const onLoad = async () => {
      await checkIfWalletIsConnected();
    };
    window.addEventListener('load', onLoad);
    return () => window.removeEventListener('load', onLoad);
  }, [])


  return (
    <div className="App">
      <div className={walletAddress ? "authed-container" : "container"}>
        <div className="header-container">
          <p className="header">GIF Portal</p>
          <p className="sub-text">
            View your GIF collection in metaverse
          </p>
          {!walletAddress ? renderNotConnectedContainer() : null}
        </div>
        <div className="footer-container">
          <img alt="Twitter logo" className="twitter-logo" src={twitterLogo} />
          <a
            className="footer-text"
            href={TWITTER_LINK}
            target="_blank"
            rel="noreferrer"
          >{`built by @${TWITTER_HANDLE}`}</a>
        </div>
      </div>
    </div>
  )
}

export default App;