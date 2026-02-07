/**
 * Compressed NFT (cNFT) Integration
 * 
 * Uses Metaplex Bubblegum for cheap on-chain DNA storage
 * Cost: ~$0.001 per mint vs $0.50 for regular NFT
 */

const { Connection, PublicKey, Keypair } = require('@solana/web3.js');
const { Metaplex, keypairIdentity, bundlrStorage } = require('@metaplex-foundation/js');
const { 
  createCreateTreeInstruction,
  createMintV1Instruction,
  findLeafAssetIdPda,
  MetadataArgs,
  TokenProgramVersion,
  TokenStandard,
} = require('@metaplex-foundation/mpl-bubblegum');
const { getAssociatedTokenAddress, TOKEN_PROGRAM_ID } = require('@solana/spl-token');

// Helius RPC with cNFT support
const HELIUS_RPC = process.env.SOLANA_RPC_URL || 'https://mainnet.helius-rpc.com/?api-key=YOUR_KEY';

class CnftManager {
  constructor() {
    this.connection = new Connection(HELIUS_RPC, 'confirmed');
    this.merkleTree = null;
    this.treeAddress = process.env.MERKLE_TREE_ADDRESS || null;
  }

  /**
   * Create Merkle Tree for cNFTs
   * One-time setup (~$0.10)
   */
  async createTree(payerKeypair) {
    try {
      console.log('Creating Merkle Tree for cNFTs...');
      
      // Tree parameters
      const maxDepth = parseInt(process.env.MERKLE_TREE_MAX_DEPTH) || 20;
      const maxBufferSize = parseInt(process.env.MERKLE_TREE_BUFFER_SIZE) || 64;
      const canopyDepth = 0; // Use 0 for simplicity
      
      // Generate tree keypair
      const treeKeypair = Keypair.generate();
      
      // Calculate space needed
      const requiredSpace = this.getRequiredSpace(maxDepth, maxBufferSize);
      
      // Create instruction
      const createTreeIx = createCreateTreeInstruction(
        {
          payer: payerKeypair.publicKey,
          treeCreator: payerKeypair.publicKey,
          merkleTree: treeKeypair.publicKey,
          merkleTreeAuthority: payerKeypair.publicKey,
          logWrapper: new PublicKey('noopb9bkMVfRPU8AsbpTUg8AQkHTKwKiLquB8gPW2i6'),
          compressionProgram: new PublicKey('cmtDvXumGCrqC1Age74AVPhSRVXJMd8PJS91L8KbNCK'),
          systemProgram: new PublicKey('11111111111111111111111111111111'),
        },
        {
          maxBufferSize,
          maxDepth,
          public: false, // Only treeCreator can mint
        }
      );

      // Send transaction
      const transaction = new (require('@solana/web3.js').Transaction)().add(createTreeIx);
      transaction.feePayer = payerKeypair.publicKey;
      
      const { blockhash } = await this.connection.getLatestBlockhash();
      transaction.recentBlockhash = blockhash;
      
      transaction.sign(payerKeypair, treeKeypair);
      
      const signature = await this.connection.sendRawTransaction(
        transaction.serialize()
      );
      
      await this.connection.confirmTransaction(signature);
      
      console.log('✅ Merkle Tree created!');
      console.log('Tree Address:', treeKeypair.publicKey.toString());
      console.log('Transaction:', signature);
      
      this.treeAddress = treeKeypair.publicKey.toString();
      
      return {
        success: true,
        treeAddress: treeKeypair.publicKey.toString(),
        signature,
        maxDepth,
        maxBufferSize,
        capacity: Math.pow(2, maxDepth),
      };
    } catch (error) {
      console.error('Failed to create tree:', error);
      return { success: false, error: error.message };
    }
  }

  /**
   * Calculate required space for tree
   */
  getRequiredSpace(maxDepth, maxBufferSize) {
    // Approximate calculation
    const headerSize = 32 + 8 + 8 + 8 + 8; // Discriminator + fields
    const treeSize = Math.pow(2, maxDepth) * 32; // Nodes
    const bufferSize = maxBufferSize * 32; // Change log
    return headerSize + treeSize + bufferSize;
  }

  /**
   * Mint cNFT
   */
  async mintCNFT({
    recipient,
    metadata,
    payerKeypair,
  }) {
    try {
      if (!this.treeAddress) {
        throw new Error('Merkle tree not created. Run createTree first.');
      }

      const treePublicKey = new PublicKey(this.treeAddress);
      const recipientPublicKey = new PublicKey(recipient);

      console.log('Minting cNFT...');
      console.log('Tree:', this.treeAddress);
      console.log('Recipient:', recipient);

      // Build metadata args
      const metadataArgs = {
        name: metadata.name,
        symbol: metadata.symbol || 'DNA',
        uri: metadata.uri,
        sellerFeeBasisPoints: metadata.sellerFeeBasisPoints || 500,
        primarySaleHappened: true,
        isMutable: true,
        editionNonce: null,
        tokenStandard: TokenStandard.NonFungible,
        collection: null,
        uses: null,
        tokenProgramVersion: TokenProgramVersion.Original,
        creators: metadata.creators || [
          {
            address: payerKeypair.publicKey,
            verified: true,
            share: 100,
          },
        ],
      };

      // Create mint instruction
      const mintIx = createMintV1Instruction(
        {
          payer: payerKeypair.publicKey,
          merkleTree: treePublicKey,
          treeAuthority: await this.getTreeAuthority(treePublicKey),
          treeDelegate: payerKeypair.publicKey,
          leafOwner: recipientPublicKey,
          leafDelegate: recipientPublicKey,
          compressionProgram: new PublicKey('cmtDvXumGCrqC1Age74AVPhSRVXJMd8PJS91L8KbNCK'),
          logWrapper: new PublicKey('noopb9bkMVfRPU8AsbpTUg8AQkHTKwKiLquB8gPW2i6'),
          systemProgram: new PublicKey('11111111111111111111111111111111'),
        },
        {
          metadataArgs,
        }
      );

      // Send transaction
      const transaction = new (require('@solana/web3.js').Transaction)().add(mintIx);
      transaction.feePayer = payerKeypair.publicKey;
      
      const { blockhash } = await this.connection.getLatestBlockhash();
      transaction.recentBlockhash = blockhash;
      
      transaction.sign(payerKeypair);
      
      const signature = await this.connection.sendRawTransaction(
        transaction.serialize()
      );
      
      await this.connection.confirmTransaction(signature);

      // Get leaf index (simplified - in production track this)
      const leafIndex = Date.now(); // Placeholder

      // Find asset ID
      const [assetId] = findLeafAssetIdPda(treePublicKey, new (require('@solana/web3.js').BN)(leafIndex));

      console.log('✅ cNFT minted!');
      console.log('Asset ID:', assetId.toString());
      console.log('Transaction:', signature);

      return {
        success: true,
        signature,
        assetId: assetId.toString(),
        treeAddress: this.treeAddress,
        leafIndex,
        recipient,
      };
    } catch (error) {
      console.error('Failed to mint cNFT:', error);
      return { success: false, error: error.message };
    }
  }

  /**
   * Get tree authority PDA
   */
  async getTreeAuthority(treeAddress) {
    const [pda] = await PublicKey.findProgramAddress(
      [Buffer.from('merkle_tree_authority'), treeAddress.toBuffer()],
      new PublicKey('cmtDvXumGCrqC1Age74AVPhSRVXJMd8PJS91L8KbNCK')
    );
    return pda;
  }

  /**
   * Get cNFT metadata from Helius
   */
  async getCNFTMetadata(assetId) {
    try {
      const response = await fetch(HELIUS_RPC, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          jsonrpc: '2.0',
          id: 1,
          method: 'getAsset',
          params: {
            id: assetId,
          },
        }),
      });

      const data = await response.json();
      return data.result;
    } catch (error) {
      console.error('Failed to fetch metadata:', error);
      return null;
    }
  }
}

// Singleton instance
let cnftManager = null;

function getCnftManager() {
  if (!cnftManager) {
    cnftManager = new CnftManager();
  }
  return cnftManager;
}

module.exports = {
  CnftManager,
  getCnftManager,
};
