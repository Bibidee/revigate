"use client";

import Link from "next/link";
import { useEffect, useRef, useState } from "react";
import type { ReactNode } from "react";
import { getConfiguredRegistryAddress, verifyRevigateDeployment } from "@/lib/genlayer";
import { disconnectWallet, requestWalletConnection, REVIGATE_WALLET_SESSION_EVENT, watchWallet } from "@/lib/wallet-session.mjs";

type Provider = { request(args: { method: string; params?: unknown[] }): Promise<unknown>; on?(event: string, cb: (...args: unknown[]) => void): void; removeListener?(event: string, cb: (...args: unknown[]) => void): void };
type WalletSessionState = { account: string; chainId: string; connected: boolean };
declare global { interface Window { ethereum?: Provider; __revigateWalletSession?: WalletSessionState } }

function publishWalletSession(state: { account: string; chainId: string }) {
  const detail = { ...state, connected: Boolean(state.account) };
  window.__revigateWalletSession = detail;
  window.dispatchEvent(new CustomEvent(REVIGATE_WALLET_SESSION_EVENT, { detail }));
}

export function Shell({ children }: Readonly<{ children: ReactNode }>) {
  const [account, setAccount] = useState("");
  const [chain, setChain] = useState("");
  const [message, setMessage] = useState("");
  const appDisconnected = useRef(false);
  const [contractStatus, setContractStatus] = useState(() => (process.env.NEXT_PUBLIC_REVIGATE_CONTRACT || process.env.NEXT_PUBLIC_REVIGATE_REGISTRY) ? "Checking contract…" : "Contract is not configured.");
  const walletSession = useRef<ReturnType<typeof watchWallet> | undefined>(undefined);
  const wrongNetwork = Boolean(chain && Number.parseInt(chain, 16) !== 61999);
  function attachWalletSession(provider: Provider) {
    if (walletSession.current) return walletSession.current;
    const session = watchWallet(provider, (next) => {
      if (appDisconnected.current) return;
      setAccount(next.account); setChain(next.chainId);
      publishWalletSession(next);
    });
    walletSession.current = session;
    return session;
  }
  useEffect(() => {
    publishWalletSession({ account: "", chainId: "" });
    const provider = window.ethereum;
    if (!provider) return;
    const session = attachWalletSession(provider);
    return () => { session.stop(); walletSession.current = undefined; };
  }, []);
  useEffect(() => {
    let registry;
    try { registry = getConfiguredRegistryAddress(); }
    catch (error) { queueMicrotask(() => setContractStatus(error instanceof Error ? error.message : "Invalid Registry configuration.")); return; }
    if (!registry) return;
    verifyRevigateDeployment()
      .then(({ registryConfig }) => setContractStatus(
        registryConfig.public_custody && registryConfig.custody_enabled
          ? "Revigate Registry identity verified; Studionet testnet controls available."
          : "Revigate Registry identity verified; financial controls are locked."))
      .catch(() => setContractStatus("The configured contract could not be verified."));
  }, []);
  async function connect() {
    const provider = window.ethereum;
    if (!provider) { setMessage("Install an EIP-1193 wallet such as MetaMask or Rabby to connect."); return; }
    const session = attachWalletSession(provider);
    try {
      const state = await requestWalletConnection(provider, session);
      appDisconnected.current = false;
      setAccount(state.account); setChain(state.chainId);
      publishWalletSession(state);
      window.dispatchEvent(new Event("revigate:wallet-connect"));
      setMessage(state.chainId && Number.parseInt(state.chainId, 16) !== 61999 ? "Switch your wallet to GenLayer Studionet (chain 61999) before signing." : "");
    } catch (error) { setMessage(error instanceof Error ? error.message : "Wallet connection was rejected."); }
  }
  function disconnect() {
    const session = walletSession.current;
    if (!session && !account) { setMessage("No Revigate wallet session is active."); return; }
    appDisconnected.current = true;
    if (session) {
      disconnectWallet(session);
      session.stop();
      if (walletSession.current === session) walletSession.current = undefined;
    }
    setAccount(""); setChain("");
    publishWalletSession({ account: "", chainId: "" });
    window.dispatchEvent(new Event("revigate:wallet-disconnect"));
    setMessage("Revigate app session disconnected. Your wallet remains connected in Rabby.");
  }
  return <>
    <header className="topbar"><Link href="/" className="brand"><span className="brand-mark">R</span><span>Revi<span className="brand-light">gate</span><small>RULES WITH A HISTORY</small></span></Link>
      <nav aria-label="Main navigation"><Link href="/">Reading room</Link><Link href="/publish">Publish</Link><Link href="/agreements">Agreements</Link><Link href="/my-rules">My rules</Link><Link href="/activity">Activity</Link><Link href="/about">About</Link></nav>
      {account ? <><span className="wallet-account" aria-label={`Connected wallet ${account}`}>{account.slice(0, 6)}…{account.slice(-4)}</span><button type="button" className="wallet-button" onClick={disconnect}>Disconnect</button></> : <button type="button" className="wallet-button" onClick={() => void connect()}>Connect wallet</button>}
    </header>
    {wrongNetwork && <div className="network-warning">Wrong network · Connect to GenLayer Studionet · Chain 61999</div>}
    {message && <div className="toast" role="status">{message}<button aria-label="Dismiss" onClick={() => setMessage("")}>×</button></div>}
    <main>{children}</main>
    <footer><span>Revigate · Studionet · Chain 61999 · {contractStatus}</span><Link href="/about">Trust boundaries and limits</Link></footer>
  </>;
}
