import * as anchor from "@coral-xyz/anchor";
import { Program } from "@coral-xyz/anchor";
import { BankrunProvider, startAnchor } from "anchor-bankrun";
import { Voting } from "../target/types/voting";
import { PublicKey, SystemProgram } from "@solana/web3.js";
import * as assert from "node:assert";
import { beforeEach, it, describe } from "node:test";

const IDL = require("../target/idl/voting.json");
const votingAddress = new PublicKey("JAVuBXeBZqXNtS73azhBDAoYaaAFfo4gWXoZe2e7Jf8H");

describe("voting", () => {
  let context;
  let provider:any;
  let votingProgram:any;

  beforeEach(async () => {
    context = await startAnchor("", [{ name: "voting", programId: votingAddress }], []);
    provider = new BankrunProvider(context);
    votingProgram = new Program<Voting>(IDL, provider);
  });

  it("Initialize Poll", async () => {
    const pollId = new anchor.BN(1);

    const [pollPda] = PublicKey.findProgramAddressSync(
      [pollId.toArrayLike(Buffer, "le", 8)],
      votingProgram.programId
    );

    await votingProgram.methods
      .initializePoll(
        pollId,
        new anchor.BN(1762368705), 
        new anchor.BN(1762368905), 
        "Human Rights Justice"     
      )
      .accounts({
        signer: provider.wallet.publicKey,
        poll: pollPda,
        systemProgram: SystemProgram.programId,
      })
      .rpc();

    const pollAccount = await votingProgram.account.poll.fetch(pollPda);

    console.log("Fetched Poll Account:", pollAccount);

    assert.strictEqual(pollAccount.pollId.toNumber(), 1);
    assert.strictEqual(pollAccount.pollStart.toNumber(), 1762368705);
    assert.strictEqual(pollAccount.pollEnd.toNumber(), 1762368905);
    assert.strictEqual(pollAccount.description, "Human Rights Justice");
    assert.strictEqual(pollAccount.candidateAmount.toNumber(), 0);

    console.log(" Poll initialized successfully and verified!");
  });

  it("Initialize Candidate", async () => {
  const pollId = new anchor.BN(1);
  const [pollPda] = PublicKey.findProgramAddressSync(
    [pollId.toArrayLike(Buffer, "le", 8)],
    votingProgram.programId
  );

  await votingProgram.methods
    .initializePoll(
      pollId,
      new anchor.BN(1762368705),
      new anchor.BN(1762368905),
      "Test Poll"
    )
    .accounts({
      signer: provider.wallet.publicKey,
      poll: pollPda,
      systemProgram: SystemProgram.programId,
    })
    .rpc();

  // 🧩 Candidate 1: Alice
  const candidateName1 = "Alice";
  const [candidatePda1] = PublicKey.findProgramAddressSync(
    [pollId.toArrayLike(Buffer, "le", 8), Buffer.from(candidateName1)],
    votingProgram.programId
  );

  await votingProgram.methods
    .initializeCandidate(candidateName1, pollId)
    .accounts({
      signer: provider.wallet.publicKey,
      candidate: candidatePda1,
      poll: pollPda,
      systemProgram: SystemProgram.programId,
    })
    .rpc();

  const candidateName2 = "Sumiel";
  const [candidatePda2] = PublicKey.findProgramAddressSync(
    [pollId.toArrayLike(Buffer, "le", 8), Buffer.from(candidateName2)],
    votingProgram.programId
  );

  await votingProgram.methods
    .initializeCandidate(candidateName2, pollId)
    .accounts({
      signer: provider.wallet.publicKey,
      candidate: candidatePda2,
      poll: pollPda,
      systemProgram: SystemProgram.programId,
    })
    .rpc();

  const candidateAccount1 = await votingProgram.account.candidate.fetch(candidatePda1);
  console.log("Candidate 1 Account:", candidateAccount1);

  assert.strictEqual(candidateAccount1.candidateName, "Alice");
  assert.strictEqual(candidateAccount1.candidateVotes.toNumber(), 0);

  const pollAccount = await votingProgram.account.poll.fetch(pollPda);
  assert.strictEqual(pollAccount.candidateAmount.toNumber(), 2);

  console.log("Both candidates initialized successfully!");
});


  it("Vote Test", async () => {
  const pollId = new anchor.BN(1);

  const [pollPda] = PublicKey.findProgramAddressSync(
    [pollId.toArrayLike(Buffer, "le", 8)],
    votingProgram.programId
  );

  await votingProgram.methods
    .initializePoll(
      pollId,
      new anchor.BN(1762368705),
      new anchor.BN(1762368905),
      "Voting Time"
    )
    .accounts({
      signer: provider.wallet.publicKey,
      poll: pollPda,
      systemProgram: SystemProgram.programId,
    })
    .rpc();

  const candidateName = "Alice";
  const [candidatePda] = PublicKey.findProgramAddressSync(
    [pollId.toArrayLike(Buffer, "le", 8), Buffer.from(candidateName)],
    votingProgram.programId
  );

  await votingProgram.methods
    .initializeCandidate(candidateName, pollId)
    .accounts({
      signer: provider.wallet.publicKey,
      candidate: candidatePda,
      poll: pollPda,
      systemProgram: SystemProgram.programId,
    })
    .rpc();

  // Cast a vote
  await votingProgram.methods
    .voteCandidate(candidateName, pollId)
    .accounts({
      signer: provider.wallet.publicKey,
      poll: pollPda,
      candidate: candidatePda,
      systemProgram: SystemProgram.programId,
    })
    .rpc();

  const candidateAccount = await votingProgram.account.candidate.fetch(candidatePda);
  assert.strictEqual(candidateAccount.candidateVotes.toNumber(), 1);
  console.log("Vote casted successfully and verified!");
});

});
