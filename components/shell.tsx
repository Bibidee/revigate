"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import type { ReactNode } from "react";
import { getConfiguredRegistryAddress, getConfiguredVaultAddress, verifyRevigateDeployment } from "@/lib/genlayer";

type Provider = { request(args: { method: string; params?: unknown[] }): Promise<unknown>; on?(event: string, cb: (...args: unknown[]) => void): void; removeListener?(event: string, cb: (...args: unknown[]) => void): void };
declare global { interface Window { ethereum?: Provider } }

export function Shell({ children }: Readonly<{ children: ReactNode }>) {
  const [account, setAccount] = useState("");
  const [chain, setChain] = useState("");
  const [message, setMessage] = useState("");
  const [contractStatus, setContractStatus] = useState(() => process.env.NEXT_PUBLIC_REVIGATE_REGISTRY && process.env.NEXT_PUBLIC_REVIGATE_VAULT ? "Checking Registry/Vault pair…" : "Registry/Vault pair is not configured.");
  const wrongNetwork = Boolean(chain && Number.parseInt(chain, 16) !== 61999);
  useEffect(() => {
    const provider = window.ethereum;
    if (!provider) return;
    const updateAccounts = (items: unknown) => setAccount(Array.isArray(items) && typeof items[0] === "string" ? items[0] : "");
    const updateChain = (id: unknown) => setChain(typeof id === "string" ? id : "");
    provider.request({ method: "eth_accounts" }).then(updateAccounts).catch(() => undefined);
    provider.request({ method: "eth_chainId" }).then(updateChain).catch(() => undefined);
    provider.on?.("accountsChanged", updateAccounts);
    provider.on?.("chainChanged", updateChain);
    return () => { provider.removeListener?.("accountsChanged", updateAccounts); provider.removeListener?.("chainChanged", updateChain); };
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
    if (!window.ethereum) { setMessage("Install an EIP-1193 wallet such as MetaMask or Rabby to connect."); return; }
    try {
      const [selected, activeChain] = await Promise.all([
        window.ethereum.request({ method: "eth_requestAccounts" }),
        window.ethereum.request({ method: "eth_chainId" }),
      ]);
      setAccount(Array.isArray(selected) && typeof selected[0] === "string" ? selected[0] : "");
      setChain(typeof activeChain === "string" ? activeChain : "");
      setMessage(typeof activeChain === "string" && Number.parseInt(activeChain, 16) !== 61999 ? "Switch your wallet to GenLayer Studionet (chain 61999) before signing." : "");
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
