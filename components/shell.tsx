"use client";

import Link from "next/link";
import { useEffect, useRef, useState } from "react";
import type { ReactNode } from "react";
import { getConfiguredRegistryAddress, getConfiguredVaultAddress, verifyRevigateDeployment } from "@/lib/genlayer";
import { requestWalletConnection, watchWallet } from "@/lib/wallet-session.mjs";

type Provider = { request(args: { method: string; params?: unknown[] }): Promise<unknown>; on?(event: string, cb: (...args: unknown[]) => void): void; removeListener?(event: string, cb: (...args: unknown[]) => void): void };
declare global { interface Window { ethereum?: Provider } }

export function Shell({ children }: Readonly<{ children: ReactNode }>) {
  const [account, setAccount] = useState("");
  const [chain, setChain] = useState("");
  const [message, setMessage] = useState("");
  const [contractStatus, setContractStatus] = useState(() => process.env.NEXT_PUBLIC_REVIGATE_REGISTRY && process.env.NEXT_PUBLIC_REVIGATE_VAULT ? "Checking Registry/Vault pair…" : "Registry/Vault pair is not configured.");
  const walletSession = useRef<ReturnType<typeof watchWallet> | undefined>(undefined);
  const wrongNetwork = Boolean(chain && Number.parseInt(chain, 16) !== 61999);
  useEffect(() => {
    const provider = window.ethereum;
    if (!provider) return;
    const session = watchWallet(provider, (next) => { setAccount(next.account); setChain(next.chainId); });
    walletSession.current = session;
    return () => { session.stop(); walletSession.current = undefined; };
  }, []);
  useEffect(() => {
    let registry;
    let vault;
    try { registry = getConfiguredRegistryAddress(); vault = getConfiguredVaultAddress(); }
    catch (error) { queueMicrotask(() => setContractStatus(error instanceof Error ? error.message : "Invalid contract pair configuration.")); return; }
    if (!registry || !vault) return;
    verifyRevigateDeployment()
      .then(({ vaultConfig }) => setContractStatus(vaultConfig.custody_enabled
        ? "Registry/Vault identities matched · custody deployment needs release approval."
        : "Registry/Vault identities matched · custody is disabled on this pair."))
      .catch(() => setContractStatus("The configured Registry/Vault pair could not be verified."));
  }, []);
  async function connect() {
    const provider = window.ethereum;
    if (!provider || !walletSession.current) { setMessage("Install an EIP-1193 wallet such as MetaMask or Rabby to connect."); return; }
    try {
      const state = await requestWalletConnection(provider, walletSession.current);
      setMessage(state.chainId && Number.parseInt(state.chainId, 16) !== 61999 ? "Switch your wallet to GenLayer Studionet (chain 61999) before signing." : "");
    } catch (error) { setMessage(error instanceof Error ? error.message : "Wallet connection was rejected."); }
  }
  return <>
    <header className="topbar"><Link href="/" className="brand"><span className="brand-mark">R</span><span>Revi<span className="brand-light">gate</span><small>RULES WITH A HISTORY</small></span></Link>
      <nav aria-label="Main navigation"><Link href="/">Reading room</Link><Link href="/publish">Publish</Link><Link href="/agreements">Agreements</Link><Link href="/my-rules">My rules</Link><Link href="/activity">Activity</Link><Link href="/about">About</Link></nav>
      <button className="wallet-button" onClick={connect}>{account ? `${account.slice(0, 6)}…${account.slice(-4)}` : "Connect wallet"}</button>
    </header>
    {wrongNetwork && <div className="network-warning">Wrong network · Connect to GenLayer Studionet · Chain 61999</div>}
    {message && <div className="toast" role="status">{message}<button aria-label="Dismiss" onClick={() => setMessage("")}>×</button></div>}
    <main>{children}</main>
    <footer><span>Revigate · Studionet · Chain 61999 · {contractStatus}</span><Link href="/about">Trust boundaries and limits</Link></footer>
  </>;
}
