const { SlashCommandBuilder } = require('discord.js');

module.exports = {
  data: new SlashCommandBuilder()
    .setName('removewarn')
    .setDescription('إزالة التحذير')
    .addUserOption(opt => opt.setName('user').setDescription('المستخدم').setRequired(true)),

  async execute(interaction, warningManager, config) {
    if (!interaction.member.roles.cache.some(r => config.moderatorRoles.includes(r.id))) {
      return interaction.reply({ content: '❌ ليس لديك صلاحية لإزالة التحذير.', ephemeral: true });
    }

    const user = interaction.options.getUser('user');
    const removed = warningManager.removeWarn(interaction.guild.id, user.id);
    if (!removed) return interaction.reply({ content: '❌ لا يوجد تحذير نشط لهذا المستخدم.', ephemeral: true });

    const roleId = config.warnRoles[warningManager.getWarn(interaction.guild.id, user.id)?.type];
    if (roleId) {
      await interaction.guild.members.fetch(user.id).then(m => m.roles.remove(roleId).catch(console.error));
    }

    interaction.reply(`✅ تم إزالة التحذير من ${user}`);
    const logCh = interaction.guild.channels.cache.get(config.logChannelId);
    if (logCh) logCh.send(`ℹ️ تم إزالة التحذير من ${user.tag}`);
  }
};