#!/usr/bin/env bun
/**
 * Trim.ph — Test Data Reset Script
 *
 * Run: bun run scripts/reset-test-data.mjs
 *
 * Clears all user-generated test data while keeping:
 *   - The demo vendor account (demo@trim.ph)
 *   - The 3 seeded Beta-sample campaigns
 *
 * Use this to get a clean state before running through the TEST.md paths.
 */

import { db } from "../src/lib/db"

async function main() {
  console.log("🔄 Resetting Trim.ph test data...\n")

  const counts = {
    conversions: await db.conversion.deleteMany({}),
    payouts: await db.payout.deleteMany({}),
    chatMessages: await db.chatMessage.deleteMany({}),
    chatRoomMembers: await db.chatRoomMember.deleteMany({}),
    chatRooms: await db.chatRoom.deleteMany({}),
    trackingLinks: await db.trackingLink.deleteMany({}),
    takeOneCodes: await db.takeOneCode.deleteMany({}),
    userCampaigns: await db.campaign.deleteMany({ where: { isSeeded: false } }),
    wallets: await db.wallet.deleteMany({}),
  }

  // Delete all users except the demo vendor
  const deletedUsers = await db.user.deleteMany({
    where: { email: { not: "demo@trim.ph" } },
  })

  console.log("✅ Deleted:")
  console.log(`   • ${counts.conversions.count} conversions`)
  console.log(`   • ${counts.payouts.count} payouts`)
  console.log(`   • ${counts.chatMessages.count} chat messages`)
  console.log(`   • ${counts.chatRoomMembers.count} chat room members`)
  console.log(`   • ${counts.chatRooms.count} chat rooms`)
  console.log(`   • ${counts.trackingLinks.count} tracking links`)
  console.log(`   • ${counts.takeOneCodes.count} take-one codes`)
  console.log(`   • ${counts.userCampaigns.count} user campaigns`)
  console.log(`   • ${counts.wallets.count} wallets`)
  console.log(`   • ${deletedUsers.count} users (kept demo@trim.ph)`)

  // Re-seed take-one codes for the remaining seeded campaigns
  const seededTakeOnes = await db.campaign.findMany({
    where: { isSeeded: true, type: "take_one" },
  })
  let codesAdded = 0
  for (const camp of seededTakeOnes) {
    const chars = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789"
    const gen = () =>
      "TRIM-" +
      Array.from(
        { length: 6 },
        () => chars[Math.floor(Math.random() * chars.length)]
      ).join("")
    const codes = Array.from({ length: 8 }, () => gen())
    await db.takeOneCode.createMany({
      data: codes.map((code) => ({ campaignId: camp.id, code })),
    })
    codesAdded += codes.length
  }
  console.log(`\n🌱 Re-seeded ${codesAdded} TRIM codes for ${seededTakeOnes.length} seeded Take One campaigns`)

  console.log("\n📋 Remaining state:")
  console.log(`   • ${await db.user.count()} user (demo@trim.ph)`)
  console.log(`   • ${await db.campaign.count()} campaigns (seeded Beta samples)`)
  console.log(`   • ${await db.takeOneCode.count()} take-one codes`)
  console.log("\n✨ Ready for testing. See TEST.md for the full test guide.")

  await db.$disconnect()
}

main().catch((e) => {
  console.error(e)
  process.exit(1)
})
