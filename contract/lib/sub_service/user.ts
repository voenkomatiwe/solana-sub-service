import { BN, web3 } from "@coral-xyz/anchor";
import {
  TOKEN_PROGRAM_ID,
  getAssociatedTokenAddress,
  getOrCreateAssociatedTokenAccount,
} from "@solana/spl-token";
import { PublicKey, Signer } from "@solana/web3.js";

import { bufferFromString } from "..";

export function findUserAddress(address: PublicKey): [PublicKey, number] {
  return PublicKey.findProgramAddressSync(
    [bufferFromString("user"), address.toBytes()],
    this.programId,
  );
}

export async function getUserData(address: PublicKey) {
  const [user] = this.findUserAddress(address);

  return await this.program.account.user.fetch(user);
}

export async function getAllUsers() {
  return await this.program.account.user.all();
}

export async function replenishUserStorage(
  mint: PublicKey,
  amount: BN,
  wallet: Signer,
) {
  const sender = wallet.publicKey;
  const [user, bump] = this.findUserAddress(sender);

  const userTokenAccount = await getOrCreateAssociatedTokenAccount(
    this.program.provider.connection,
    wallet,
    mint,
    user,
    true,
  );

  const senderTokenAccount = await getAssociatedTokenAddress(mint, sender);

  return await this.sendSigned(
    this.program.methods.replenishUserStorage(amount, bump).accounts({
      sender,
      user,
      senderTokenAccount,
      userTokenAccount: userTokenAccount.address,
      tokenProgram: TOKEN_PROGRAM_ID,
      systemProgram: web3.SystemProgram.programId,
    }),
    wallet,
  );
}

export async function withdrawFromUserStorage(
  mint: PublicKey,
  amount: BN,
  wallet?: Signer,
) {
  const sender = wallet ? wallet.publicKey : this.program.provider.publicKey;
  const [user] = this.findUserAddress(sender);

  const userTokenAccount = await getAssociatedTokenAddress(mint, user, true);
  const senderTokenAccount = await getAssociatedTokenAddress(mint, sender);

  return await this.sendSigned(
    this.program.methods.withdrawFromUserStorage(amount).accounts({
      sender,
      user,
      senderTokenAccount,
      userTokenAccount,
      tokenProgram: TOKEN_PROGRAM_ID,
    }),
    wallet,
  );
}
