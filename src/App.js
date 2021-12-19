import React, { useEffect, useState } from 'react';
import twitterLogo from './assets/twitter-logo.svg'
import './App.css';
import idl from './idl.json';
import kp from './keypair.json';
import { Connection, PublicKey, clusterApiUrl } from '@solana/web3.js';
import { Program, Provider, web3 } from '@project-serum/anchor'

//SystemProgram is a reference to solana runtime
const { SystemProgram, Keypair } = web3;

//create a keypair for the account that will hold the gif data
const arr = Object.values(kp._keypair.secretKey);
const secret = new Uint8Array(arr);
const baseAccount = web3.Keypair.fromSecretKey(secret)

//get our program id from idl file
const programID = new PublicKey(idl.metadata.address);

//set our newtwork to devnet
const network = clusterApiUrl('devnet');

//Controls how we want to acknowledge when a transaction is 'done'
const opts = {
  preflightCommitment: "processed"
}
const TEST_GIFS = [
  'https://media1.giphy.com/media/jp7jSyjNNz2ansuOS8/200.webp',
  'https://media0.giphy.com/media/pkKt4lHJuZj9KjsxoS/200.webp',
  'https://media0.giphy.com/media/cAxOGVNVPEkjDcpVQk/200.webp',
  'https://media1.giphy.com/media/vyTnNTrs3wqQ0UIvwE/200.webp',
  'https://media1.giphy.com/media/QPQ3xlJhqR1BXl89RG/200.webp',
  'https://media4.giphy.com/media/AAsNYlbJpyz7CWXItf/200.webp',
  'https://media4.giphy.com/media/UFhYFEdME9t8YBjWPT/200.webp',
  'https://media3.giphy.com/media/mXCz15nZ7Aa21NuXYc/200.webp',


]
const TWITTER_HANDLE = 'nesargg';
const TWITTER_LINK = `https://twitter.com/${TWITTER_HANDLE}`

const App = () => {
  const [walletAddress, setWalletAddress] = useState(null);
  const [inputValue, setInputValue] = useState('');
  const [gifList, setGifList] = useState(null);
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

  const onInputChange = (event) => {
    const { value } = event.target;
    setInputValue(value)
  }

  const getProvider = () => {
    const connection = new Connection(network, opts.preflightCommitment);
    const provider = new Provider(
      connection, window.solana, opts.preflightCommitment,
    );
    return provider
  }

  const createGifAccount = async () => {
    try {
      const provider = getProvider();
      const program = new Program(idl, programID, provider);
      console.log("ping")
      await program.rpc.startStuffOff({
        accounts: {
          baseAccount: baseAccount.publicKey,
          user: provider.wallet.publicKey,
          systemProgram: SystemProgram.programId,
        },
        signers: [baseAccount]
      });
      console.log("Created a new BaseAccount w/ address:", baseAccount.publicKey.toString())
      await getGifList();

    } catch (error) {
      console.log("Error creating BaseAccount account:", error)
    }
  }
  const sendGif = async () => {
    if (inputValue.length === 0) {
      console.log("no gif link given");
      return
    }
    setInputValue('')
    try {
      const provider = getProvider();
      const program = new Program(idl, programID, provider);

      await program.rpc.addGif(inputValue, {
        accounts: {
          baseAccount: baseAccount.publicKey,
          user: provider.wallet.publicKey,
        },
      });
      console.log("Gıf successfully send to program", inputValue)

      await getGifList();
    } catch (error) {
      console.log("Error sending gif", error)
    }
  }
  const renderNotConnectedContainer = () => (
    <button className="cta-button connect-wallet-button" onClick={connectWallet}>
      <p className="button-text ">Connect to Wallet</p>
    </button>
  )

  const renderConnectedContainer = () => {
    // If we hit this, it means the program account hasn't been initialized.
    if (gifList == null) {
      return (
        <div className="connected-container">
          <button className="cta-button submit-gif-button" onClick={createGifAccount}>
            Do One-Time Initialization For GIF Program Account
            </button>
        </div>
      )
    }
    // Otherwise, we're good! Account exists. User can submit GIFs.
    else {
      return (
        <div className="connected-container">
          <form
            onSubmit={(event) => {
              event.preventDefault();
              sendGif();
            }}
          >
            <input
              type="text"
              placeholder="Enter gif link!"
              value={inputValue}
              onChange={onInputChange}
            />
            <button type="submit" className="cta-button submit-gif-button">
              Submit
              </button>
          </form>
          <div className="gif-grid">
            {/* We use index as the key instead, also, the src is now item.gifLink */}
            {gifList.map((item, index) => (
              <div className="gif-item" key={index}>
                <img src={item.gifLink} alt={item.gifLink} />
              </div>
            ))}
          </div>
        </div>
      )
    }
  }
  /* At first mount check if wallet connected */
  useEffect(() => {
    const onLoad = async () => {
      await checkIfWalletIsConnected();
    };
    window.addEventListener('load', onLoad);
    return () => window.removeEventListener('load', onLoad);
  }, [])

  const getGifList = async () => {
    try {
      const provider = getProvider();
      const program = new Program(idl, programID, provider);
      const account = await program.account.baseAccount.fetch(baseAccount.publicKey);

      console.log("Got the account", account)
      setGifList(account.gifList)

    } catch (error) {
      console.log("Error in getGifList: ", error)
      setGifList(null);
    }
  }

  useEffect(() => {
    if (walletAddress) {
      console.log('Fetching GIF list...');
      getGifList()
    }
  }, [walletAddress]);

  return (
    <div className="App">
      <div className={walletAddress ? "authed-container" : "container"}>
        <div className="header-container">
          <p className="header">THE OFFICE IN METAVERSE</p>
          <p className="sub-text">
            View your GIF collection in metaverse
          </p>
          {!walletAddress ? renderNotConnectedContainer() : renderConnectedContainer()}
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