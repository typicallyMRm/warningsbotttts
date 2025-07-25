const fs = require('fs');
const path = require('path');

const WARN_FILE = path.join(__dirname, '..', 'warnings.json');

class WarningManager {
  constructor() {
    if (!fs.existsSync(WARN_FILE)) fs.writeFileSync(WARN_FILE, '{}');
    this.data = JSON.parse(fs.readFileSync(WARN_FILE));
  }

  save() {
    fs.writeFileSync(WARN_FILE, JSON.stringify(this.data, null, 2));
  }

  init(client) {
    this.client = client;
    this.client.config = require('../config.json');
    setInterval(() => this.checkExpired(), 60 * 1000);
    client.on('guildMemberAdd', member => this.handleRejoin(member));
  }

  createWarn(guildId, userId, type, durationMs, moderatorId, reason) {
    if (!this.data[guildId]) this.data[guildId] = {};
    this.data[guildId][userId] = {
      type, moderatorId, reason,
      issuedAt: Date.now(),
      expiresAt: Date.now() + durationMs
    };
    this.save();
    return this.data[guildId][userId];
  }

  removeWarn(guildId, userId) {
    if (!this.data[guildId] || !this.data[guildId][userId]) return false;
    delete this.data[guildId][userId];
    this.save();
    return true;
  }

  getWarn(guildId, userId) {
    return this.data[guildId]?.[userId] ?? null;
  }

  timeLeft(guildId, userId) {
    const w = this.getWarn(guildId, userId);
    if (!w) return 0;
    return Math.max(0, w.expiresAt - Date.now());
  }

  async checkExpired() {
    for (const [guildId, users] of Object.entries(this.data)) {
      const guild = this.client.guilds.cache.get(guildId);
      for (const [userId, w] of Object.entries(users)) {
        if (Date.now() >= w.expiresAt) {
          const member = guild?.members.cache.get(userId);
          const roleId = this.client.config.warnRoles[w.type];
          if (member && roleId) member.roles.remove(roleId).catch(console.error);
          delete users[userId];
          this.save();
          const logCh = guild.channels.cache.get(this.client.config.logChannelId);
          if (logCh) logCh.send(`⏳ انتهت مدة تحذير <@${userId}> من نوع **${w.type}** تلقائيًا.`);
        }
      }
    }
  }

  async handleRejoin(member) {
    const w = this.getWarn(member.guild.id, member.id);
    if (!w) return;
    const roleId = this.client.config.warnRoles[w.type];
    const timeLeft = this.timeLeft(member.guild.id, member.id);
    if (roleId && timeLeft > 0) {
      await member.roles.add(roleId).catch(console.error);
    } else if (timeLeft <= 0) {
      this.removeWarn(member.guild.id, member.id);
    }
  }
}

module.exports = new WarningManager();