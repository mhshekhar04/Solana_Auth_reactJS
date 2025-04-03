import { useEffect, useState } from "react";
import OpenLogin from "@toruslabs/openlogin";
import nacl from "tweetnacl";
import "./App.css";

const hexToUint8Array = (hex) => {
  if (hex.length % 2 !== 0) throw new Error("Invalid hex string");
  const arr = new Uint8Array(hex.length / 2);
  for (let i = 0; i < hex.length; i += 2) {
    arr[i / 2] = parseInt(hex.substr(i, 2), 16);
  }
  return arr;
};

const uint8ArrayToHex = (arr) => {
  return Array.from(arr)
    .map((b) => b.toString(16).padStart(2, "0"))
    .join("");
};

function App() {
  const [isLoading, setLoading] = useState(true);
  const [openlogin, setOpenLogin] = useState(null);
  const [torusPrivKey, setTorusPrivKey] = useState(null);
  const [edSecretKey, setEdSecretKey] = useState(null);
  const [edPublicKey, setEdPublicKey] = useState(null);
  const [showSecret, setShowSecret] = useState(false);

  const copyToClipboard = (text) => {
    navigator.clipboard
      .writeText(text)
      .then(() => alert("Copied to clipboard!"))
      .catch(() => alert("Copy failed!"));
  };

  const onMount = async () => {
    setLoading(true);
    try {
      const sdk = new OpenLogin({
        clientId: "BEKbgRFZnqnMQFOQYcDdYFq0mOxZGdbVkIxzr-YoRpWWFQD5g04aAMc2xF1sf-qZ0StRkOOHqSkqQozdpwBXAz8",
        network: "testnet",
      });
      setOpenLogin(sdk);
      await sdk.init();
      if (sdk.privKey) {
        setTorusPrivKey(sdk.privKey);
        const seed = hexToUint8Array(sdk.privKey);
        const keyPair = nacl.sign.keyPair.fromSeed(seed);
        setEdSecretKey(JSON.stringify(Array.from(keyPair.secretKey)));
        setEdPublicKey(uint8ArrayToHex(keyPair.publicKey));
      }
    } catch (error) {
      console.error("Initialization error:", error);
    } finally {
      setLoading(false);
    }
  };

  const onLogin = async () => {
    if (isLoading || torusPrivKey || !openlogin) return;
    setLoading(true);
    try {
      await openlogin.login({
        loginProvider: "google",
        redirectUrl: "http://localhost:3000",
      });
      if (openlogin.privKey) {
        setTorusPrivKey(openlogin.privKey);
        const seed = hexToUint8Array(openlogin.privKey);
        const keyPair = nacl.sign.keyPair.fromSeed(seed);
        setEdSecretKey(JSON.stringify(Array.from(keyPair.secretKey)));
        setEdPublicKey(uint8ArrayToHex(keyPair.publicKey));
      }
    } catch (error) {
      console.error("Login error:", error);
    } finally {
      setLoading(false);
    }
  };

  const onLogout = async () => {
    if (isLoading || !openlogin) return;
    setLoading(true);
    try {
      await openlogin.logout({});
      setTorusPrivKey(null);
      setEdSecretKey(null);
      setEdPublicKey(null);
      setShowSecret(false);
    } catch (error) {
      console.error("Logout error:", error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    onMount();
  }, []);

  return (
    <div className="App">
      {isLoading ? (
        <div className="loading-screen">
          <p>Loading...</p>
        </div>
      ) : torusPrivKey ? (
        <div className="wallet-container">
          <header className="wallet-header">
            <h1>🔐 My Web3 Wallet</h1>
            <button className="logout-button" onClick={onLogout}>
              Logout
            </button>
          </header>
          <div className="wallet-card">
            <div className="wallet-info">
              <h2>Public Key</h2>
              <div className="key-display scrollable-key">
                <code>{edPublicKey}</code>
                <button onClick={() => copyToClipboard(edPublicKey)}>Copy</button>
              </div>
            </div>

            <div className="wallet-actions">
              <button onClick={() => setShowSecret(!showSecret)}>
                {showSecret ? "Hide Secret Key" : "Show Secret Key"}
              </button>
              {showSecret && (
                <div className="key-section">
                  <h2>Secret Key (for Phantom)</h2>
                  <div className="key-display scrollable-key">
                    <code>{edSecretKey}</code>
                    <button onClick={() => copyToClipboard(edSecretKey)}>Copy</button>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      ) : (
        <div className="login-container">
          <div className="login-card">
            <h1>🌟 Welcome to Web3</h1>
            <p>Sign in to access your Phantom-compatible wallet</p>
            <button className="login-button" onClick={onLogin}>
              Login with Google
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

export default App;
