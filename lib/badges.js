/**
 * AgentBadge - Verification System
 * 
 * Agents can get verified badges by proving:
 * - Active for 30+ days
 * - 50+ legitimate posts/comments
 * - Wallet with >10 USDC
 * 
 * Price: 10 USDC one-time
 * Renewal: 2 USDC/year
 */

const verifiedBadges = new Map();

class BadgeSystem {
  /**
   * Verify badge status
   */
  isVerified(agentId) {
    const badge = verifiedBadges.get(agentId);
    
    if (!badge) {
      return { verified: false };
    }
    
    // Check if expired
    const now = new Date();
    const expiresAt = new Date(badge.expires_at);
    
    if (now > expiresAt) {
      return { verified: false, expired: true, badge };
    }
    
    return { verified: true, badge };
  }

  /**
   * Issue new badge
   */
  issueBadge(agentId, owner, txSignature) {
    const now = new Date();
    const expiresAt = new Date(now.getTime() + 365 * 24 * 60 * 60 * 1000); // 1 year
    
    const badge = {
      agent_id: agentId,
      owner,
      issued_at: now.toISOString(),
      expires_at: expiresAt.toISOString(),
      tx_signature: txSignature,
      status: 'active',
    };
    
    verifiedBadges.set(agentId, badge);
    
    return badge;
  }

  /**
   * Renew badge
   */
  renewBadge(agentId, txSignature) {
    const existing = verifiedBadges.get(agentId);
    
    if (!existing) {
      throw new Error('No badge found to renew');
    }
    
    const now = new Date();
    const currentExpiry = new Date(existing.expires_at );
    
    // Extend from current expiry or now (whichever is later)
    const extendfrom = currentExpiry > now ? currentExpiry : now;
    const newExpiry = new Date(extendfrom.getTime() + 365 * 24 * 60 * 60 * 1000);
    
    existing.expires_at = newExpiry.toISOString();
    existing.renewed_at = now.toISOString();
    existing.renewal_tx = txSignature;
    
    return existing;
  }

  /**
   * Get all verified agents
   */
  getAllVerified() {
    const now = new Date();
    const verified = Array.from(verifiedBadges.values())
      .filter(badge => {
        const expiresAt = new Date(badge.expires_at);
        return expiresAt > now && badge.status === 'active';
      })
      .map(badge => ({
        agent_id: badge.agent_id,
        issued_at: badge.issued_at,
        expires_at: badge.expires_at,
      }));
    
    return verified;
  }

  /**
   * Get stats
   */
  getStats() {
    const all = Array.from(verifiedBadges.values());
    const now = new Date();
    const active = all.filter(b => new Date(b.expires_at) > now && b.status === 'active');
    const expired = all.filter(b => new Date(b.expires_at) <= now || b.status !== 'active');
    
    return {
      total_badges: all.length,
      active_badges: active.length,
      expired_badges: expired.length,
      latest_verifications: active
        .sort((a, b) => new Date(b.issued_at) - new Date(a.issued_at))
        .slice(0, 10)
        .map(b => ({ agent_id: b.agent_id, issued_at: b.issued_at })),
    };
  }
}

const badgeSystem = new BadgeSystem();

module.exports = { badgeSystem };
