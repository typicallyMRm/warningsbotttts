const { SlashCommandBuilder } = require('discord.js');

module.exports = {
  data: new SlashCommandBuilder()
    .setName('addwarn')
    .setDescription('إعطاء تحذير')
    .addUserOption(opt => opt.setName('user').setDescription('المستخدم').setRequired(true))
    .addStringOption(opt => opt.setName('type').setDescription('نوع التحذير')
      .setRequired(true).addChoices(
        { name: 'تحذير إداري أول', value: 'warn1' },
        { name: 'تحذير إداري ثاني', value: 'warn2' },
        { name: 'كسر رتبه إدارية', value: 'warn3' }
      ))
    .addIntegerOption(opt => opt.setName('duration').setDescription('المدة بالدقائق').setRequired(true))
    .addStringOption(opt => opt.setName('reason').setDescription('السبب').setRequired(true)),

  async execute(interaction, warningManager, config) {
    const user = interaction.options.getUser('user');
    const type = interaction.options.getString('type');
    const duration = interaction.options.getInteger('duration') * 60000;
    const reason = interaction.options.getString('reason');
    const modRoles = config.moderatorRoles;

    if (!interaction.member.roles.cache.some(r => modRoles.includes(r.id))) {
      return interaction.reply({ content: '❌ ليس لديك صلاحية لإعطاء التحذير.', ephemeral: true });
    }

    const w = warningManager.createWarn(interaction.guild.id, user.id, type, duration, interaction.user.id, reason);

    const roleId = config.warnRoles[type];
    await interaction.guild.members.fetch(user.id).then(member => {
      if (roleId) member.roles.add(roleId).catch(console.error);
    });

    interaction.reply(`✅ تم تحذير ${user}

👥 الاسم: ${user.tag}
⚠️ التحذير: ${type}
⏱️ المدة: ${interaction.options.getInteger('duration')} دقيقة
📝 السبب: ${reason}`);

    const logCh = interaction.guild.channels.cache.get(config.logChannelId);
    if (logCh) logCh.send(`🔔 ${interaction.user.tag} قام بتحذير ${user.tag} - النوع: ${type}, المدة: ${interaction.options.getInteger('duration')} دقيقة, السبب: ${reason}`);

    const alertCh = interaction.guild.channels.cache.get(config.alertChannelId);
    if (alertCh) alertCh.send(`🚨 تم تحذير <@${user.id}> (${user.tag})
⚠️ النوع: ${type}
📝 السبب: ${reason}`);
  }
};