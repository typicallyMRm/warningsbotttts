const { SlashCommandBuilder } = require('discord.js');

module.exports = {
  data: new SlashCommandBuilder()
    .setName('timeleft')
    .setDescription('عرض الوقت المتبقي على التحذير')
    .addUserOption(opt => opt.setName('user').setDescription('المستخدم').setRequired(true)),

  async execute(interaction, warningManager) {
    const user = interaction.options.getUser('user');
    const ms = warningManager.timeLeft(interaction.guild.id, user.id);
    if (!ms || ms <= 0) return interaction.reply({ content: '❌ لا يوجد تحذير نشط لهذا المستخدم.', ephemeral: true });
    const minutes = Math.floor(ms / 60000);
    const seconds = Math.floor((ms % 60000) / 1000);
    interaction.reply(`⏱️ الوقت المتبقي على تحذير ${user.tag}: ${minutes} دقيقة و ${seconds} ثانية`);
  }
};