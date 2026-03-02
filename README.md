Let me just write this fully in text right here — clean, complete, nothing missing.

---

# DarkEarn — Complete MVP Document
## ETHMumbai 2026 · Top 1% Project Blueprint

---

# SECTION 1: THE PROBLEM

Web3 has a bounty economy worth millions of dollars. First Dollar, Superteam Earn, and Dework have proven there is real demand for on-chain contributor work. But every single one of these platforms shares one fatal flaw — **everything is completely public.**

When you complete a bounty on any existing platform, your wallet address is visible, your earnings are visible, which protocols hired you is visible, how much they paid you is visible, and your entire work history is permanently on-chain for anyone to read. This creates three real, painful problems that nobody has solved.

**Problem 1 — Broken Negotiation.** Before you even submit an application, the protocol can look up your wallet and see you accepted $150 gigs last week. They know your floor. They lowball you. You lose the negotiation before it starts. This happens on every single application on every existing platform.

**Problem 2 — Zero Privacy.** Competitors can see which protocols you work for. Bad actors can track your activity. Rivals know exactly when you're active, when you're desperate, and who values your skills. You have no protection whatsoever over your professional and financial information.

**Problem 3 — The Privacy-Reputation Trap.** If you try to protect yourself by creating a new wallet, you lose everything — your entire reputation history disappears. Zero history means zero credibility means nobody hires you. Right now, contributors are forced to choose between privacy and reputation. You cannot have both. This is the core problem DarkEarn solves.

First Dollar's own philosophy says "proof-of-work is reputation" — but that proof is naked. There is no privacy layer. The best contributors in web3 are being financially exposed every single day with zero recourse.

---

# SECTION 2: THE SOLUTION

DarkEarn is a privacy-first bounty platform for web3 contributors where the work is public, the money is private, and the reputation is ZK-proven.

The core breakthrough is this: **you do not need to show your history to prove your quality. You just need to prove the score that history produced.** Zero-knowledge proofs make this possible. You generate a cryptographic proof that says "I have a reputation score of 850 with 95% approval rate and 20+ completions in Solidity" — and nobody can see which projects, which wallets, or what you earned. The proof is mathematically verified. The history stays private.

DarkEarn has three innovations working together that no platform has combined before.

**Innovation 1 — Private Payments.** Every payment on DarkEarn flows through BitGo MPC institutional wallets with ZK-gated spending policies. Funds only release when a valid ZK reputation proof is verified on-chain. The contributor's stealth address receives payment — no public wallet, no visible amount. Institutional-grade security with complete privacy.

**Innovation 2 — ZK Reputation Score.** Contributors build a private reputation score over time. Every completion adds to their score privately. When applying, they generate a ZK proof of their score band in the browser in 3 seconds. Protocols see "Band 4 · Score 850+ · Verified" and nothing else. Higher score unlocks higher-paying gated bounties that lower bands cannot even see.

**Innovation 3 — Reverse Bidding.** Top Band 3 and Band 4 contributors receive private encrypted bids from protocols. The protocol sees an anonymous profile with a score band and skill categories. They send a private offer. The contributor accepts or declines without ever revealing their identity. Elite contributors stop applying for work — work comes to them. Privately.

---

# SECTION 3: HOW IT WORKS — FULL USER JOURNEY

**The Contributor Journey:**

A new contributor registers on DarkEarn by connecting their ENS name. Their actual wallet addresses are never linked publicly — ENS is their identity, wallets stay hidden. They browse the bounty board. Open bounties are visible to everyone. Mid-tier bounties require Band 2 score or above. Premium bounties are locked behind Band 3. Elite bounties are Band 4 only and invitation-based.

To apply, the contributor generates a ZK reputation proof in their browser. This takes approximately 3 seconds. The proof mathematically demonstrates their score band and skill categories without revealing any underlying data. They submit the proof with their application. The smart contract verifies the proof on-chain before the application is even recorded.

When they get hired and complete the work, they submit their deliverable. The protocol reviews and approves. The BitGo MPC wallet's spending policy confirms the ZK proof is valid, then automatically releases funds to the contributor's stealth address. The payment amount is never publicly visible. Their reputation score updates silently in the background — one more completion, score increases, still completely private.

Once they reach Band 3, they also receive a private bid inbox. Protocols can now find them and send encrypted offers directly. No application needed. The work comes to them.

**The Protocol Journey:**

A protocol posts a bounty with a title, description, requirements, and prize amount. The prize amount is stored encrypted on-chain — only revealed to accepted applicants, never to the public or competing protocols. They set a minimum reputation score threshold. They connect their BitGo MPC wallet which holds the prize funds with a spending policy requiring valid ZK proof verification before any release.

They receive applications showing only score bands and relevant skill proofs. They review work quality, approve the best submission, and sign the completion attestation. BitGo automatically releases funds. They never know the contributor's real wallet, earnings history elsewhere, or identity. They only know the work was done and the person is verified elite.

For premium talent, they can browse anonymous Band 3 and Band 4 contributor profiles and send private bids directly. The best contributors in the ecosystem are accessible without ever knowing who they are — only what they can do.

---

# SECTION 4: THE ZK REPUTATION SCORE — DEEP DIVE

This is the heart of DarkEarn and the reason it wins.

The reputation score is computed from private inputs that only the contributor holds: their total number of completed bounties, their approval rate as a percentage, their earnings tier (not exact amount, just a tier bucket), and their wallet age in months. These inputs are fed into a Noir ZK circuit which computes a score between 500 and 900 and assigns a band from 0 to 4.

The mathematical constraints in the circuit ensure the score is honest. You cannot claim a Band 4 score if your inputs only support Band 2. The circuit enforces the relationship between inputs and output cryptographically. If the proof verifies, the score is real. There is no way to fake it.

**Band Structure:**
Band 0 (500–599) gives access to open entry-level bounties only. Band 1 (600–699) unlocks small to mid tier bounties. Band 2 (700–749) unlocks mid-tier and opens the platform properly. Band 3 (750–849) unlocks high-value bounties and activates the private bid inbox. Band 4 (850–900) is elite tier — the highest paying bounties, invitation-only opportunities, and maximum protocol trust.

The score is represented as a soulbound NFT tied to the contributor's ENS name. Non-transferable. Cryptographically verified. Publicly shows the band only. The score behind the band stays private.

**ZK Skill Proofs** add a second dimension. Beyond the general score, contributors accumulate category-specific completions privately. Categories include Solidity development, Cairo development, frontend development, security auditing, content and documentation, and design. When applying for a specific bounty, contributors generate a skill-specific proof: "I have 10 or more verified Solidity completions." The protocol sees exactly the relevant credential for their bounty. Nothing more.

This means a protocol posting a Cairo smart contract bounty gets matched with contributors who have proven Cairo skills specifically — not just a general high score. Perfect signal. Zero exposure.

---

# SECTION 5: FULL TECH STACK

**ZK Layer — Noir and Barretenberg**

Noir is the circuit language built by Aztec Labs. It is the most production-ready ZK circuit language available for hackathons right now. It compiles to ACIR which runs as WebAssembly in the browser. The Barretenberg proving backend (bb.js) handles proof generation client-side in approximately 3 seconds. The Solidity verifier contract is automatically generated by the Noir toolchain — you write the circuit logic and get the verifier for free. No manual cryptography. No trusted setup issues. This is exactly the right tool for this project.

**Smart Contracts — Solidity and Foundry**

Four contracts total. The UltraVerifier is auto-generated by Noir and deployed as-is — you do not write this. The BountyEscrow contract handles bounty posting with encrypted prize amounts, application recording with ZK proof verification, work approval, and payment routing to stealth addresses. It integrates with BitGo via their SDK for institutional-grade fund custody. The ReputationNFT contract is a soulbound ERC-721 tied to ENS names — minted after verified completion, non-transferable, score band in metadata, updated silently after each completion. The SkillRegistry contract tracks per-category ZK commitments and verifies skill-specific proofs when applications are submitted.

**Deployment Chain — Base**

All contracts deploy to Base Sepolia for the hackathon. Base is low gas, fast, and perfectly aligned with First Dollar's Base-native positioning. This directly supports the Base sponsor bounty.

**Privacy Infrastructure**

Stealth addresses handle payment routing — contributors generate a new stealth address per payment, derived from their ENS-linked key. No on-chain link between stealth address and ENS name. ENS handles public pseudonymous identity — your .eth name is your entire professional profile. ZK commitments handle private reputation accumulation — each completion updates an off-chain Merkle tree of completions, the root is committed on-chain, proofs are generated against the root.

**DataHaven AI Agent — Node.js and StorageHub SDK**

A Node.js agent runs continuously off-chain. It monitors the platform for reputation fraud — specifically wash completions where the same entity posts and completes their own bounties, Sybil attacks where one person operates multiple pseudonymous profiles to inflate scores artificially, and unusual approval pattern anomalies. The agent computes fraud scores for every reputation update, flags suspicious activity, and decides whether a completion is valid. It saves its full verification state and decision log as JSON to DataHaven using their StorageHub SDK. After each run, it posts the DataHaven content hash on-chain. The ReputationNFT contract reads this hash before minting any credential — if the agent flagged the completion as suspicious, the mint is blocked. DataHaven is literally the control plane for the fraud detection system. This is word-for-word what their bounty describes.

**BitGo Integration — SDK and MPC Wallets**

Protocols use BitGo MPC wallets to hold bounty prize funds instead of raw smart contract escrow. BitGo's policy engine is configured with one rule: funds can only be released to a wallet that has presented a valid on-chain ZK reputation proof in the same transaction. No valid proof, no payment. This gives institutional-grade security to the payment layer. BitGo webhooks notify the contributor's stealth address in real time when funds are released. The SDK handles wallet creation, transaction signing, policy enforcement, and webhook setup. This hits the BitGo Privacy prize ($1,200) directly — it is a privacy application using BitGo infrastructure.

**Frontend — React, Vite, wagmi, Tailwind**

Three main views. The contributor dashboard lets contributors browse bounties by band access level, generate ZK proofs in browser, view private earnings tracker (only visible to them), manage their bid inbox at Band 3+, and see their public ENS profile preview. The protocol dashboard lets protocols post bounties with encrypted prizes, set score thresholds, browse anonymous contributor profiles for bidding, review applications by score band only, and approve work with one-click payment release. The public ENS profile page shows username.eth, score band, total completions count, member since date, and active skill categories — nothing else. No earnings, no client names, no wallet addresses.

---

# SECTION 6: 42-HOUR BUILD PLAN

**Hours 0 to 8 — ZK Circuits**

Install Nargo and scaffold the credit score circuit project. Write the main reputation score circuit with four inputs and band output. Add the four mathematical constraints. Write test inputs and generate a proof. Run the verifier generation command to get the Solidity verifier automatically. Then write the skill proof circuit — simpler, just verifies category-specific completion count above a threshold. Test both circuits. Pre-generate demo proofs and save them. Never regenerate live during the demo.

**Hours 8 to 18 — Smart Contracts**

Write BountyEscrow with post, apply, approve, and release functions. Integrate ZK proof verification into the apply function. Write encrypted prize amount storage using a simple hash commitment. Write ReputationNFT with soulbound logic, ENS binding, DataHaven hash check before mint, and score band metadata. Write SkillRegistry for category-specific proof verification. Deploy all four contracts to Base Sepolia using Foundry. Write minimal tests covering the demo happy path only.

**Hours 18 to 26 — DataHaven Agent**

Get DataHaven testnet tokens from their faucet. Install StorageHub SDK. Write the fraud detection agent with three checks: self-completion detection, Sybil pattern detection, and approval rate anomaly detection. Serialize the verification state as JSON. Upload to DataHaven bucket. Post content hash on-chain to the ReputationNFT contract. Run the agent once successfully. Verify the hash appears on-chain. Confirm the contract reads it correctly.

**Hours 26 to 30 — BitGo Integration**

Set up BitGo testnet account. Create an MPC wallet via SDK. Configure the spending policy rule requiring valid on-chain ZK proof. Set up a webhook pointing to a simple Express endpoint that logs payment release events. Test a full payment flow: proof verified on-chain, BitGo policy confirms, funds release to stealth address, webhook fires.

**Hours 30 to 40 — Frontend**

Build contributor dashboard with bounty browser, ZK proof generator (progress bar, 3-second generation, hex proof display), private earnings view, and bid inbox. Build protocol dashboard with bounty posting form (encrypted prize amount field), applicant reviewer, and approval button. Build public ENS profile page. Connect all views to deployed contracts via wagmi. Test full flow end to end.

**Hours 40 to 42 — Polish and Pitch Prep**

Pre-fund all demo wallets. Pre-generate demo ZK proofs. Write the 3-minute pitch script. Record a 60-second backup video demo. Write the README with architecture overview, contract addresses, and sponsor integration notes.

---

# SECTION 7: SPONSOR PRIZE MAP

**ETHMumbai Privacy Track — $500**

ZK proofs are the entire architecture of DarkEarn. The reputation score system, the skill proofs, the private application flow — all of it is powered by zero-knowledge cryptography. Privacy is not a feature added on top. It is the product. This is the strongest possible privacy track submission.

**ETHMumbai DeFi Track — $500**

DarkEarn has a complete on-chain financial system. Encrypted escrow contracts, automated payment release, stealth address routing, and BitGo institutional custody. The protocol bidding system creates a two-sided marketplace with real economic mechanics. This is a DeFi product with genuine financial infrastructure.

**ETHMumbai AI Track — $500**

The fraud detection agent is a real AI system solving a real problem. Wash completion fraud and Sybil attacks are genuine threats to any reputation system. The agent monitors continuously, makes decisions, and saves verified state. Without it, the reputation system is gameable. With it, the system is trustworthy.

**DataHaven — $2,000 (targeting $1,000 First Prize)**

The fraud detection agent saves its complete verification state and decision log to DataHaven after every run. The ReputationNFT contract reads the DataHaven content hash before minting any credential — if the agent flagged the completion, the mint is blocked. DataHaven is literally the control plane for the AI agent's decisions. This matches their bounty description precisely: AI agents that save data in DataHaven for validation and verification of state.

**ENS — $1,000 Creative + Pool Split**

ENS is not an integration. ENS is the identity layer of the entire platform. Your .eth name IS your professional profile. The reputation NFT is bound to your ENS name. Protocol bids are sent to your ENS name. Your public profile is your ENS name. The creative use case — ENS as a private professional identity with ZK-verified credentials — has never been built before. This directly targets the $1,000 creative prize. The pool split prize is an automatic addition.

**BitGo — $1,200 Privacy + $800 DeFi**

Protocols hold prize funds in BitGo MPC wallets. The spending policy requires valid on-chain ZK proof before any release. This is a privacy application (funds only move when privacy-preserving ZK credential is verified) AND a DeFi application (institutional wallet infrastructure powering decentralized bounty payments). Both BitGo prizes are in play simultaneously.

**Base — TBD**

All contracts deploy on Base. The product is designed for the Base ecosystem — First Dollar itself is Base-native. When Base confirms their bounty criteria, DarkEarn is the most natural fit on the entire floor.

**Total Conservative Estimate: $6,500 to $7,500 depending on Base bounty amount.**

---

# SECTION 8: UNIQUE SELLING POINTS

**USP 1 — Privacy AND Reputation simultaneously.** Every other approach forces a choice. New wallet means privacy but no reputation. Known wallet means reputation but no privacy. DarkEarn makes both coexist for the first time using ZK proofs.

**USP 2 — Power inversion through reverse bidding.** No bounty platform has ever let protocols bid on contributors. This single feature completely changes the dynamic. Elite contributors become the scarce resource being competed for, not the applicants being filtered. Judges have never seen this in web3.

**USP 3 — Skill-specific ZK credentials.** Not just "I am good" but "I am specifically good at Cairo development, verified cryptographically." Perfect signal, zero exposure. Matches contributors to bounties with precision that no existing platform can achieve.

**USP 4 — Institutional-grade privacy.** BitGo MPC wallets enforcing ZK-proof-gated spending policies brings enterprise security to anonymous contributor payments. This is a completely new combination that nobody has built.

**USP 5 — Real product, real users, right now.** This is not a DeFi primitive or a protocol. It is a platform with two clear user groups who feel this pain today. Judges can immediately imagine using it themselves. That is the difference between a clever demo and a winning project.

---

# SECTION 9: PITCH SCRIPT — 3 MINUTES

**Opening — 30 seconds:**

"Every bounty platform in web3 today has the same problem. Before you negotiate your rate, the protocol already knows what you earned last month. Your competitors know which gigs you applied for. Your work history, your earnings, your clients — all permanently public on-chain. That's not a bug. That's how blockchains work. Until now."

**The solution — 30 seconds:**

"DarkEarn is a bounty platform where the work is public, the money is private, and the reputation is ZK-proven. You prove you're elite without proving who you are. Your earnings are hidden behind BitGo institutional wallets. Your identity is your ENS name. Your reputation is a cryptographic proof that nobody can fake and nobody can see through."

**The demo — 60 seconds:**

Walk through the live demo showing a Band 4 contributor receiving three private bids from protocols in their inbox. They haven't applied anywhere. Accept one bid. Show the ZK skill proof generation in browser — 3 seconds, proof appears. Submit work, protocol approves. BitGo wallet releases payment to stealth address — no visible amount, no linked wallet. Public ENS profile updates: "25 completions · Band 4." Not a single dollar amount or wallet address was exposed at any point.

**The reverse bid moment — 30 seconds:**

"This is the moment that changes everything. Top contributors don't apply for work on DarkEarn. Work comes to them. Privately. Protocols compete for anonymous elite talent based purely on what they can prove they've done. The best web3 contributors stop being job seekers and start being the scarce resource."

**The close — 30 seconds:**

"First Dollar proved there is demand for on-chain bounties in the Base ecosystem. We are not competing with them. We are the privacy layer they never built. Every serious contributor who values their negotiating power, their financial privacy, and their professional reputation will use DarkEarn. The ZK proof is the moat. The reputation system is the network effect. The reverse bidding is the product."

---

# SECTION 10: QUESTIONS JUDGES WILL ASK — AND YOUR ANSWERS

**"How do you prevent fake reputation? Can I just pay myself to complete my own bounties?"**

The DataHaven AI agent specifically detects self-completion fraud. It monitors wallet funding patterns, completion timing, and approval behavior. If the same entity is detected on both sides of a completion, the agent flags it and the ReputationNFT mint is blocked. The DataHaven content hash ensures this check cannot be bypassed — the contract won't mint without a clean verification state from the agent.

**"Why would protocols leave First Dollar or Superteam for this?"**

They don't have to leave. DarkEarn is additive — protocols come here specifically to access the top Band 3 and Band 4 contributors who protect their privacy. These are the most experienced contributors who have the most to lose from public exposure. DarkEarn gives protocols access to talent they cannot reach anywhere else.

**"What does the ZK proof actually prove end to end?"**

The proof proves that the contributor's private inputs — completion count, approval rate, earnings tier, wallet age — mathematically produce the claimed score band. The circuit has hard constraints enforcing this relationship. If the proof verifies on-chain, the score is real. There is no other way a valid proof can exist.

**"Why ENS specifically?"**

ENS is the only human-readable identity layer in Ethereum that protocols actually use for trust. Binding the reputation NFT to an ENS name means the professional identity is portable, recognizable, and ENS-secured. It also means your reputation survives wallet changes — the ENS name persists, the NFT stays bound to it.

**"Why BitGo instead of just a smart contract escrow?"**

Smart contract escrow means the prize funds are visible in the contract. BitGo MPC means institutional-grade custody with programmable spending policies. The policy rule — only release to wallets with verified ZK proof — adds a second layer of enforcement beyond the smart contract. It also gives the platform a credible enterprise story for large protocols managing significant treasury funds.

---

# SECTION 11: WHAT THIS IS NOT

DarkEarn is not a DAO. It is not a governance token. It is not a yield protocol. It is not a lending primitive. It is not a speculative asset. It is a bounty platform with ZK reputation, private payments, and reverse bidding for web3 contributors. The scope is clear, the user is clear, the problem is clear. Judges respect teams that know exactly what they are building.

---

**One sentence. Memorize this. Open and close every conversation with it:**

*"DarkEarn is the only bounty platform where elite contributors get bid on by protocols, proven by ZK skill credentials, paid through BitGo institutional wallets — with zero identity exposure at any step."*